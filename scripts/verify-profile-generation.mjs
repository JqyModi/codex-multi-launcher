import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-manager-"));
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;
await fs.mkdir(path.join(testRoot, ".codex"), { recursive: true });
await fs.writeFile(
  path.join(testRoot, ".codex", "config.toml"),
  [
    'model = "gpt-5.5"',
    "",
    "[mcp_servers.example]",
    'command = "node"',
    'args = ["server.js"]',
    "",
    "[features]",
    "multi_agent = true",
    ""
  ].join("\n"),
  { mode: 0o600 }
);

const { createProfile, deleteProfile, listConfigBackups, listProfiles, permanentlyDeleteProfile, restoreConfigBackup, restoreProfile, updateProfile } = await import("../dist-electron/main/profile-service.js");
const { getAppPaths } = await import("../dist-electron/main/paths.js");
const { getApiKey } = await import("../dist-electron/main/secrets.js");
const { getDiagnosticsReport } = await import("../dist-electron/main/diagnostics.js");
const { extractModelOptions } = await import("../dist-electron/main/provider-test.js");

assertExtractedModels(
  {
    object: "list",
    data: [
      {
        id: "gpt-5.2",
        object: "model",
        display_name: "GPT-5.2"
      }
    ]
  },
  ["gpt-5.2"],
  "OpenAI-style /models response should parse data[].id"
);
assertExtractedModels({ results: [{ id: "proxy-model" }] }, ["proxy-model"], "results[].id should parse as models");
assertExtractedModels({ list: [{ id: "listed-model" }] }, ["listed-model"], "list[].id should parse as models");
assertExtractedModels({ "data/list/results": [{ id: "slash-key-model" }] }, ["slash-key-model"], "slash-key array response should parse as models");
assertExtractedModels({ nested: { data: [{ id: "deep-model" }, { id: 123 }] } }, ["deep-model"], "nested model arrays should parse string ids only");
assertExtractedModels({ data: [{ name: "missing-id" }] }, [], "responses without id strings should not produce models");

const fakeKey = "sk-test-verify-profile-generation";
const result = await createProfile({
  name: "E2E Sandbox",
  inheritDefaultConfig: true,
  provider: {
    type: "third_party_responses",
    displayName: "E2E Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: fakeKey,
    reasoningEffort: "medium"
  }
});

const appPaths = getAppPaths();
const profiles = await listProfiles();

assert(profiles.length === 1, "expected one profile in registry");
assert(result.profile.id === "e2e-sandbox", "expected stable slug profile id");

const configPath = path.join(result.profile.paths.codexHome, "config.toml");
const authPath = path.join(result.profile.paths.codexHome, "auth.json");
const launcherContents = path.join(result.profile.paths.launcherPath, "Contents");
const launcherInfoPlist = path.join(launcherContents, "Info.plist");
const launcherMacosDir = path.join(launcherContents, "MacOS");
const launcherResourcesDir = path.join(launcherContents, "Resources");
const launcherIconPath = path.join(launcherResourcesDir, "profile-icon.icns");
const launcherScript = path.join(result.profile.paths.launcherPath, "Contents", "MacOS", "launcher");

const [registryRaw, secretsRaw, configRaw, authRaw, launcherPlistRaw, launcherRaw, launcherStat, launcherContentsStat, launcherMacosStat, launcherResourcesStat, launcherIconStat] = await Promise.all([
  fs.readFile(appPaths.profilesFile, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8"),
  fs.readFile(configPath, "utf8"),
  fs.readFile(authPath, "utf8"),
  fs.readFile(launcherInfoPlist, "utf8"),
  fs.readFile(launcherScript, "utf8"),
  fs.stat(launcherScript),
  fs.stat(launcherContents),
  fs.stat(launcherMacosDir),
  fs.stat(launcherResourcesDir),
  fs.stat(launcherIconPath)
]);

assert(registryRaw.includes("E2E Sandbox"), "registry should contain profile name");
assert(result.profile.appearance.iconBackgroundColor === "#34C759", "profile should default to the standard identity color");
assert(registryRaw.includes('"iconBackgroundColor": "#34C759"'), "registry should persist profile appearance color");
assert(configRaw.includes('model_provider = "proxy"'), "config should select proxy provider");
assert(configRaw.includes('wire_api = "responses"'), "config should use responses API");
assert(configRaw.includes('requires_openai_auth = true'), "config should satisfy desktop auth gating");
assert(configRaw.includes("CODEX_PROFILE_E2E_SANDBOX_API_KEY"), "config should reference generated env key");
assert(configRaw.includes('temp_env_key = "CODEX_PROFILE_E2E_SANDBOX_API_KEY"'), "config should include Codex temp env key");
assert(configRaw.includes("[mcp_servers.example]"), "config should inherit default MCP server settings");
assert(configRaw.includes("[features]"), "config should inherit default feature settings");
assert(configRaw.includes("Codex Profile Manager managed settings"), "config should mark appended managed settings");
assert(!configRaw.includes('model = "gpt-5.5"'), "profile config should remove inherited root model to avoid duplicate TOML keys");
assert(configRaw.indexOf('model_provider = "proxy"') < configRaw.indexOf("[mcp_servers.example]"), "profile provider selector should be written before inherited tables");
assert(configRaw.indexOf('model = "gpt-5.2"') < configRaw.indexOf("[mcp_servers.example]"), "profile model should be written before inherited tables");
assert(!configRaw.includes(fakeKey), "config must not contain plaintext API key");
assert(!launcherRaw.includes(fakeKey), "launcher must not contain plaintext API key");
assert(!secretsRaw.includes(fakeKey), "encrypted secrets file must not contain plaintext API key");
assert(JSON.parse(authRaw).auth_mode === "apikey", "auth bootstrap should select API key mode");
assert(JSON.parse(authRaw).OPENAI_API_KEY === fakeKey, "auth bootstrap should contain API key for Codex desktop login");
assert(launcherRaw.includes("CODEX_HOME="), "launcher should set CODEX_HOME");
assert(launcherRaw.includes("--user-data-dir="), "launcher should pass user-data-dir");
assert(launcherContentsStat.isDirectory(), "launcher bundle should contain Contents directory");
assert(launcherMacosStat.isDirectory(), "launcher bundle should contain Contents/MacOS directory");
assert(launcherResourcesStat.isDirectory(), "launcher bundle should contain Contents/Resources directory");
assert(launcherIconStat.isFile(), "launcher bundle should contain generated profile icon");
assert((launcherStat.mode & 0o111) !== 0, "launcher script should be executable");
assert(launcherPlistRaw.includes("<key>CFBundleDisplayName</key>"), "Info.plist should define display name");
assert(launcherPlistRaw.includes("<string>E2E Sandbox</string>"), "Info.plist should contain profile name");
assert(launcherPlistRaw.includes("<key>CFBundleExecutable</key>"), "Info.plist should define executable");
assert(launcherPlistRaw.includes("<string>launcher</string>"), "Info.plist should use launcher executable");
assert(launcherPlistRaw.includes("<key>CFBundleIconFile</key>"), "Info.plist should define profile icon");
assert(launcherPlistRaw.includes("<string>profile-icon</string>"), "Info.plist should use generated profile icon");
assert(launcherPlistRaw.includes("local.codexprofilemanager.e2e-sandbox"), "Info.plist should use profile bundle id");
assert(launcherRaw.startsWith("#!/bin/zsh"), "launcher should be a zsh script");
assert(launcherRaw.includes("set -euo pipefail"), "launcher should use strict shell mode");
assert(launcherRaw.includes(appPaths.masterKeyFile), "launcher should reference encrypted secret master key");
assert(launcherRaw.includes(appPaths.secretsFile), "launcher should reference encrypted secrets file");
await execFileAsync("zsh", ["-n", launcherScript]);

const updatedKey = "sk-test-verify-profile-update";
await updateProfile({
  profileId: result.profile.id,
  appearance: {
    iconBackgroundColor: "#007AFF"
  },
  provider: {
    displayName: "Updated Proxy",
    baseUrl: "https://updated.example.com/v1",
    model: "gpt-5.4",
    apiKey: updatedKey,
    reasoningEffort: "high"
  }
});

const [updatedConfigRaw, updatedAuthRaw, updatedLauncherRaw, updatedSecretsRaw, updatedProfiles] = await Promise.all([
  fs.readFile(configPath, "utf8"),
  fs.readFile(authPath, "utf8"),
  fs.readFile(launcherScript, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8"),
  listProfiles(true)
]);
const updatedStoredKey = await getApiKey(result.profile.id, result.profile.provider.id);
const backups = await listConfigBackups(result.profile.id);
const updatedProfile = updatedProfiles.find((profile) => profile.id === result.profile.id);

assert(updatedProfile?.appearance.iconBackgroundColor === "#007AFF", "profile update should persist appearance color");
assert(updatedConfigRaw.includes('name = "Updated Proxy"'), "updated config should contain new provider name");
assert(updatedConfigRaw.includes('base_url = "https://updated.example.com/v1"'), "updated config should contain new base URL");
assert(updatedConfigRaw.includes('model = "gpt-5.4"'), "updated config should contain new model");
assert(updatedConfigRaw.includes('model_reasoning_effort = "high"'), "updated config should contain new reasoning effort");
assert(updatedConfigRaw.includes('model_provider = "proxy"'), "updated config should keep selecting proxy provider");
assert(!updatedConfigRaw.includes('base_url = "https://proxy.example.com/v1"'), "updated config should remove old managed base URL");
assert(updatedConfigRaw.match(/# --- Codex Profile Manager managed settings ---/g)?.length === 1, "managed config block should not be duplicated");
assert(updatedConfigRaw.includes("[mcp_servers.example]"), "update should preserve inherited MCP server settings");
assert(updatedStoredKey === updatedKey, "updated API key should be retrievable from encrypted storage");
assert(!updatedConfigRaw.includes(updatedKey), "updated config must not contain plaintext API key");
assert(!updatedLauncherRaw.includes(updatedKey), "updated launcher must not contain plaintext API key");
assert(!updatedSecretsRaw.includes(updatedKey), "updated encrypted secrets must not contain plaintext API key");
assert(JSON.parse(updatedAuthRaw).OPENAI_API_KEY === updatedKey, "auth bootstrap should update API key for Codex desktop login");
assert(backups.length >= 1, "profile update should create at least one config backup");
assert(backups[0].reason === "before profile manager config write", "backup should record config write reason");
assert(await fileExists(backups[0].backupPath), "backup config file should exist");

await updateProfile({
  profileId: result.profile.id,
  provider: {
    displayName: "Updated Proxy",
    baseUrl: "https://updated.example.com/v1",
    model: "gpt-5.5",
    reasoningEffort: "xhigh"
  }
});

const [modelOnlyConfigRaw, modelOnlyAuthRaw] = await Promise.all([
  fs.readFile(configPath, "utf8"),
  fs.readFile(authPath, "utf8")
]);

assert(modelOnlyConfigRaw.includes('model = "gpt-5.5"'), "model-only update should write changed model to config");
assert(modelOnlyConfigRaw.includes('model_reasoning_effort = "xhigh"'), "model-only update should write changed reasoning effort to config");
assert(!modelOnlyConfigRaw.includes('model = "gpt-5.4"'), "model-only update should remove previous managed model");
assert(JSON.parse(modelOnlyAuthRaw).OPENAI_API_KEY === updatedKey, "model-only update should keep existing auth API key");

await restoreConfigBackup({
  profileId: result.profile.id,
  backupPath: backups[0].backupPath
});
const restoredConfigRaw = await fs.readFile(configPath, "utf8");
const restoreBackups = await listConfigBackups(result.profile.id);

assert(restoredConfigRaw.includes('base_url = "https://proxy.example.com/v1"'), "restored config should contain original base URL");
assert(!restoredConfigRaw.includes('base_url = "https://updated.example.com/v1"'), "restored config should remove updated base URL");
assert(restoreBackups.some((backup) => backup.reason === "before restoring config backup"), "restore should create a pre-restore backup");

await deleteProfile(result.profile.id);
assert((await listProfiles()).length === 0, "soft-deleted profile should be hidden by default");
const allProfilesAfterDelete = await listProfiles(true);
assert(allProfilesAfterDelete.length === 1, "includeDeleted should return soft-deleted profile");
assert(allProfilesAfterDelete[0].status === "deleted", "soft-deleted profile should be marked deleted");
await restoreProfile(result.profile.id);
const restoredProfiles = await listProfiles();
assert(restoredProfiles.length === 1, "restored profile should be visible by default");
assert(restoredProfiles[0].status === "active", "restored profile should be active");

const diagnostics = await getDiagnosticsReport();
const diagnosticsRaw = JSON.stringify(diagnostics);
assert(diagnostics.profiles.length === 1, "diagnostics should include managed profile");
assert(diagnostics.profiles[0].backupCount >= 1, "diagnostics should include backup count");
assert(!diagnosticsRaw.includes(fakeKey), "diagnostics must not contain original plaintext API key");
assert(!diagnosticsRaw.includes(updatedKey), "diagnostics must not contain updated plaintext API key");

const officialKey = "sk-test-official-openai";
const officialResult = await createProfile({
  name: "Official OpenAI",
  inheritDefaultConfig: false,
  provider: {
    type: "official_openai",
    displayName: "OpenAI",
    model: "gpt-5.2",
    apiKey: officialKey,
    reasoningEffort: "medium"
  }
});
const officialConfigPath = path.join(officialResult.profile.paths.codexHome, "config.toml");
const officialAuthPath = path.join(officialResult.profile.paths.codexHome, "auth.json");
const officialLauncherScript = path.join(officialResult.profile.paths.launcherPath, "Contents", "MacOS", "launcher");
const [officialConfigRaw, officialAuthRaw, officialLauncherRaw] = await Promise.all([
  fs.readFile(officialConfigPath, "utf8"),
  fs.readFile(officialAuthPath, "utf8"),
  fs.readFile(officialLauncherScript, "utf8")
]);
const officialStoredKey = await getApiKey(officialResult.profile.id, officialResult.profile.provider.id);

assert(officialResult.profile.provider.envKeyName === "OPENAI_API_KEY", "official profile should use OPENAI_API_KEY");
assert(officialConfigRaw.includes('model = "gpt-5.2"'), "official config should contain model");
assert(!officialConfigRaw.includes("model_provider"), "official config should not select custom provider");
assert(!officialConfigRaw.includes("[model_providers."), "official config should not write custom provider block");
assert(officialLauncherRaw.includes("export OPENAI_API_KEY="), "official launcher should export OPENAI_API_KEY");
assert(officialStoredKey === officialKey, "official API key should be retrievable from encrypted storage");
assert(!officialConfigRaw.includes(officialKey), "official config must not contain plaintext API key");
assert(!officialLauncherRaw.includes(officialKey), "official launcher must not contain plaintext API key");
assert(JSON.parse(officialAuthRaw).OPENAI_API_KEY === officialKey, "official auth bootstrap should contain API key");

await permanentlyDeleteProfile(officialResult.profile.id);
assert(!(await fileExists(officialResult.profile.paths.codexHome)), "permanent delete should remove CODEX_HOME");
assert(!(await fileExists(officialResult.profile.paths.userDataDir)), "permanent delete should remove user-data-dir");
assert(!(await fileExists(officialResult.profile.paths.launcherPath)), "permanent delete should remove launcher app");
assert(await getApiKey(officialResult.profile.id, officialResult.profile.provider.id) === null, "permanent delete should remove stored API key");
assert(!(await listProfiles(true)).some((profile) => profile.id === officialResult.profile.id), "permanent delete should remove registry record");

await fs.rm(testRoot, { force: true, recursive: true });

console.log("Profile generation verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExtractedModels(payload, expectedIds, message) {
  const actualIds = extractModelOptions(payload).map((model) => model.id);
  assert(JSON.stringify(actualIds) === JSON.stringify(expectedIds), message);
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
