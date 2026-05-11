import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-manager-"));
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;

const { createProfile, listProfiles } = await import("../dist-electron/main/profile-service.js");
const { getAppPaths } = await import("../dist-electron/main/paths.js");

const fakeKey = "sk-test-verify-profile-generation";
const result = await createProfile({
  name: "E2E Sandbox",
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
const launcherScript = path.join(result.profile.paths.launcherPath, "Contents", "MacOS", "launcher");

const [registryRaw, secretsRaw, configRaw, launcherRaw] = await Promise.all([
  fs.readFile(appPaths.profilesFile, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8"),
  fs.readFile(configPath, "utf8"),
  fs.readFile(launcherScript, "utf8")
]);

assert(registryRaw.includes("E2E Sandbox"), "registry should contain profile name");
assert(configRaw.includes('model_provider = "proxy"'), "config should select proxy provider");
assert(configRaw.includes('wire_api = "responses"'), "config should use responses API");
assert(configRaw.includes("CODEX_PROFILE_E2E_SANDBOX_API_KEY"), "config should reference generated env key");
assert(!configRaw.includes(fakeKey), "config must not contain plaintext API key");
assert(!launcherRaw.includes(fakeKey), "launcher must not contain plaintext API key");
assert(!secretsRaw.includes(fakeKey), "encrypted secrets file must not contain plaintext API key");
assert(launcherRaw.includes("CODEX_HOME="), "launcher should set CODEX_HOME");
assert(launcherRaw.includes("--user-data-dir="), "launcher should pass user-data-dir");

await fs.rm(testRoot, { force: true, recursive: true });

console.log("Profile generation verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
