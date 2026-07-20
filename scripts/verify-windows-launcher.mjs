import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-manager-win-"));
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;
process.env.CODEX_PROFILE_MANAGER_PLATFORM_OVERRIDE = "win32";

await fs.mkdir(path.join(testRoot, ".codex"), { recursive: true });
await fs.writeFile(path.join(testRoot, ".codex", "config.toml"), 'model = "gpt-5.5"\n', { mode: 0o600 });

const { createProfile, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");
const { getAppPaths } = await import("../dist-electron/main/paths.js");

const fakeKey = "sk-test-windows-launcher";
const result = await createProfile({
  name: "Windows Sandbox",
  codexAppPath: "C:\\Users\\Tester\\AppData\\Local\\Programs\\ChatGPT\\ChatGPT.exe",
  inheritDefaultConfig: true,
  provider: {
    type: "third_party_responses",
    displayName: "Windows Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: fakeKey,
    reasoningEffort: "medium"
  }
});

const appPaths = getAppPaths();
const configPath = path.join(result.profile.paths.codexHome, "config.toml");
const launcherPath = result.profile.paths.launcherPath;
const [launcherRaw, configRaw, secretsRaw] = await Promise.all([
  fs.readFile(launcherPath, "utf8"),
  fs.readFile(configPath, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8")
]);

assert(launcherPath.endsWith(".cmd"), "Windows launcher should use .cmd extension");
assert(!launcherPath.endsWith(".app"), "Windows launcher should not use .app bundle extension");
assert(launcherRaw.startsWith("@echo off"), "Windows launcher should be a cmd script");
assert(launcherRaw.includes("set \"MANAGER_EXE="), "Windows launcher should reference the profile manager executable");
assert(launcherRaw.includes("--open-profile \"windows-sandbox\""), "Windows launcher should delegate profile opening back to the manager");
assert(!launcherRaw.includes("NODE_EXE"), "Windows launcher should not depend on an external Node runtime");
assert(!launcherRaw.includes("DECRYPT_SCRIPT_B64"), "Windows launcher should not decrypt secrets itself");
assert(!launcherRaw.includes("API_KEY_FILE"), "Windows launcher should not create an API key temp file");
assert(!launcherRaw.includes("CODEX_PROFILE_WINDOWS_SANDBOX_API_KEY"), "Windows launcher should not export provider secrets itself");
assert(!launcherRaw.includes("--user-data-dir="), "Windows launcher should not launch the desktop app directly");
assert(!launcherRaw.includes("ChatGPT.exe"), "Windows launcher should not reference the desktop app executable directly");
assert(!launcherRaw.includes(fakeKey), "Windows launcher must not contain plaintext API key");
assert(!configRaw.includes(fakeKey), "Windows profile config must not contain plaintext API key");
assert(!secretsRaw.includes(fakeKey), "encrypted secrets must not contain plaintext API key");
assert(configRaw.includes("requires_openai_auth = false"), "Third-party provider should not require OpenAI auth");

await permanentlyDeleteProfile(result.profile.id);

const legacyResult = await createProfile({
  name: "Windows Legacy",
  codexAppPath: "C:\\Users\\Tester\\AppData\\Local\\Programs\\Codex\\Codex.exe",
  inheritDefaultConfig: false,
  provider: {
    type: "third_party_responses",
    displayName: "Windows Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: fakeKey,
    reasoningEffort: "medium"
  }
});
const legacyLauncherRaw = await fs.readFile(legacyResult.profile.paths.launcherPath, "utf8");
assert(legacyLauncherRaw.includes("--open-profile \"windows-legacy\""), "Windows legacy launcher should delegate profile opening back to the manager");
assert(!legacyLauncherRaw.includes("Codex.exe"), "Windows launcher should not reference legacy desktop executable paths directly");
await permanentlyDeleteProfile(legacyResult.profile.id);

const accountResult = await createProfile({
  name: "Windows Account",
  authMode: "chatgpt_account",
  codexAppPath: "C:\\Users\\Tester\\AppData\\Local\\Programs\\ChatGPT\\ChatGPT.exe",
  inheritDefaultConfig: false,
  provider: {
    type: "official_openai",
    displayName: "ChatGPT Account",
    model: "gpt-5.2",
    reasoningEffort: "medium"
  }
});
const accountLauncherRaw = await fs.readFile(accountResult.profile.paths.launcherPath, "utf8");
assert(accountResult.profile.auth.mode === "chatgpt_account", "Windows account profile should persist account auth mode");
assert(accountLauncherRaw.includes("--open-profile \"windows-account\""), "Windows account launcher should delegate profile opening back to the manager");
assert(!accountLauncherRaw.includes("DECRYPT_SCRIPT_B64"), "Windows account launcher should not decrypt an API key");
assert(!accountLauncherRaw.includes("API_KEY_FILE"), "Windows account launcher should not create an API key temp file");
assert(!accountLauncherRaw.includes("OPENAI_API_KEY"), "Windows account launcher should not export OPENAI_API_KEY");
await permanentlyDeleteProfile(accountResult.profile.id);
await fs.rm(testRoot, { force: true, recursive: true });

console.log("Windows launcher verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
