import path from "node:path";

process.env.CODEX_PROFILE_MANAGER_PLATFORM_OVERRIDE = "win32";
const { configurePathProvider, getAppPaths, getDefaultCodexHome } = await import("../dist-electron/main/paths.js");

configurePathProvider({
  home: () => "C:\\Users\\Tester",
  appData: () => "C:\\Users\\Tester\\AppData\\Roaming",
  userData: () => "C:\\Users\\Tester\\AppData\\Roaming\\Codex Profile Manager"
});

const appPaths = getAppPaths();

assert(appPaths.appDataDir === "C:\\Users\\Tester\\AppData\\Roaming\\Codex Profile Manager", "appDataDir should come from Electron userData provider");
assert(appPaths.profilesFile === path.join(appPaths.appDataDir, "profiles.json"), "profilesFile should be under appDataDir");
assert(appPaths.secretsFile === path.join(appPaths.appDataDir, "secrets.enc.json"), "secretsFile should be under appDataDir");
assert(appPaths.masterKeyFile === path.join(appPaths.appDataDir, "master.key"), "masterKeyFile should be under appDataDir");
assert(appPaths.defaultProfileRoot === path.join("C:\\Users\\Tester", ".codex-profiles"), "defaultProfileRoot should be under provider home");
assert(appPaths.defaultUserDataRoot === path.join("C:\\Users\\Tester\\AppData\\Roaming", "Codex Profiles"), "defaultUserDataRoot should be under provider appData");
assert(getDefaultCodexHome() === path.join("C:\\Users\\Tester", ".codex"), "default Codex home should be under provider home");

console.log("Path provider verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
