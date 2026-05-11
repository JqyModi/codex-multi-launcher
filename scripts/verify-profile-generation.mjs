import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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

const { createProfile, listConfigBackups, listProfiles, updateProfile } = await import("../dist-electron/main/profile-service.js");
const { getAppPaths } = await import("../dist-electron/main/paths.js");
const { getApiKey } = await import("../dist-electron/main/secrets.js");

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
const launcherContents = path.join(result.profile.paths.launcherPath, "Contents");
const launcherInfoPlist = path.join(launcherContents, "Info.plist");
const launcherMacosDir = path.join(launcherContents, "MacOS");
const launcherResourcesDir = path.join(launcherContents, "Resources");
const launcherScript = path.join(result.profile.paths.launcherPath, "Contents", "MacOS", "launcher");

const [registryRaw, secretsRaw, configRaw, launcherPlistRaw, launcherRaw, launcherStat, launcherContentsStat, launcherMacosStat, launcherResourcesStat] = await Promise.all([
  fs.readFile(appPaths.profilesFile, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8"),
  fs.readFile(configPath, "utf8"),
  fs.readFile(launcherInfoPlist, "utf8"),
  fs.readFile(launcherScript, "utf8"),
  fs.stat(launcherScript),
  fs.stat(launcherContents),
  fs.stat(launcherMacosDir),
  fs.stat(launcherResourcesDir)
]);

assert(registryRaw.includes("E2E Sandbox"), "registry should contain profile name");
assert(configRaw.includes('model_provider = "proxy"'), "config should select proxy provider");
assert(configRaw.includes('wire_api = "responses"'), "config should use responses API");
assert(configRaw.includes("CODEX_PROFILE_E2E_SANDBOX_API_KEY"), "config should reference generated env key");
assert(configRaw.includes("[mcp_servers.example]"), "config should inherit default MCP server settings");
assert(configRaw.includes("[features]"), "config should inherit default feature settings");
assert(configRaw.includes("Codex Profile Manager managed settings"), "config should mark appended managed settings");
assert(configRaw.lastIndexOf('model = "gpt-5.2"') > configRaw.indexOf('model = "gpt-5.5"'), "profile model override should be appended after inherited default");
assert(!configRaw.includes(fakeKey), "config must not contain plaintext API key");
assert(!launcherRaw.includes(fakeKey), "launcher must not contain plaintext API key");
assert(!secretsRaw.includes(fakeKey), "encrypted secrets file must not contain plaintext API key");
assert(launcherRaw.includes("CODEX_HOME="), "launcher should set CODEX_HOME");
assert(launcherRaw.includes("--user-data-dir="), "launcher should pass user-data-dir");
assert(launcherContentsStat.isDirectory(), "launcher bundle should contain Contents directory");
assert(launcherMacosStat.isDirectory(), "launcher bundle should contain Contents/MacOS directory");
assert(launcherResourcesStat.isDirectory(), "launcher bundle should contain Contents/Resources directory");
assert((launcherStat.mode & 0o111) !== 0, "launcher script should be executable");
assert(launcherPlistRaw.includes("<key>CFBundleDisplayName</key>"), "Info.plist should define display name");
assert(launcherPlistRaw.includes("<string>E2E Sandbox</string>"), "Info.plist should contain profile name");
assert(launcherPlistRaw.includes("<key>CFBundleExecutable</key>"), "Info.plist should define executable");
assert(launcherPlistRaw.includes("<string>launcher</string>"), "Info.plist should use launcher executable");
assert(launcherPlistRaw.includes("local.codexprofilemanager.e2e-sandbox"), "Info.plist should use profile bundle id");
assert(launcherRaw.startsWith("#!/bin/zsh"), "launcher should be a zsh script");
assert(launcherRaw.includes("set -euo pipefail"), "launcher should use strict shell mode");
assert(launcherRaw.includes(appPaths.masterKeyFile), "launcher should reference encrypted secret master key");
assert(launcherRaw.includes(appPaths.secretsFile), "launcher should reference encrypted secrets file");

const updatedKey = "sk-test-verify-profile-update";
await updateProfile({
  profileId: result.profile.id,
  provider: {
    displayName: "Updated Proxy",
    baseUrl: "https://updated.example.com/v1",
    model: "gpt-5.4",
    apiKey: updatedKey,
    reasoningEffort: "high"
  }
});

const [updatedConfigRaw, updatedLauncherRaw, updatedSecretsRaw] = await Promise.all([
  fs.readFile(configPath, "utf8"),
  fs.readFile(launcherScript, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8")
]);
const updatedStoredKey = await getApiKey(result.profile.id, result.profile.provider.id);
const backups = await listConfigBackups(result.profile.id);

assert(updatedConfigRaw.includes('name = "Updated Proxy"'), "updated config should contain new provider name");
assert(updatedConfigRaw.includes('base_url = "https://updated.example.com/v1"'), "updated config should contain new base URL");
assert(updatedConfigRaw.includes('model = "gpt-5.4"'), "updated config should contain new model");
assert(updatedConfigRaw.includes('model_reasoning_effort = "high"'), "updated config should contain new reasoning effort");
assert(!updatedConfigRaw.includes('base_url = "https://proxy.example.com/v1"'), "updated config should remove old managed base URL");
assert(updatedConfigRaw.match(/# --- Codex Profile Manager managed settings ---/g)?.length === 1, "managed config block should not be duplicated");
assert(updatedConfigRaw.includes("[mcp_servers.example]"), "update should preserve inherited MCP server settings");
assert(updatedStoredKey === updatedKey, "updated API key should be retrievable from encrypted storage");
assert(!updatedConfigRaw.includes(updatedKey), "updated config must not contain plaintext API key");
assert(!updatedLauncherRaw.includes(updatedKey), "updated launcher must not contain plaintext API key");
assert(!updatedSecretsRaw.includes(updatedKey), "updated encrypted secrets must not contain plaintext API key");
assert(backups.length >= 1, "profile update should create at least one config backup");
assert(backups[0].reason === "before profile manager config write", "backup should record config write reason");
assert(await fileExists(backups[0].backupPath), "backup config file should exist");

await fs.rm(testRoot, { force: true, recursive: true });

console.log("Profile generation verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
