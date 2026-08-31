process.env.CODEX_PROFILE_MANAGER_PLATFORM_OVERRIDE = "win32";
process.env.LOCALAPPDATA = "C:\\Users\\Tester\\AppData\\Local";

const {
  currentWindowsAppxPathForManagedCache,
  isWindowsAppxDesktopCachePath
} = await import("../dist-electron/main/windows-appx-cache.js");

const cacheRoot = "C:\\Users\\Tester\\AppData\\Local\\Codex Profile Manager\\WindowsAppsCache";
const staleCachedExecutable = `${cacheRoot}\\OpenAI.Desktop_1.0.0.0_x64__test\\app\\ChatGPT.exe`;
const installedExecutable = "C:\\Program Files\\WindowsApps\\OpenAI.Desktop_2.0.0.0_x64__test\\app\\ChatGPT.exe";
const installedAppx = {
  packageName: "OpenAI.Desktop",
  packageFullName: "OpenAI.Desktop_2.0.0.0_x64__test",
  packageFamilyName: "OpenAI.Desktop_test",
  applicationId: "App",
  installLocation: "C:\\Program Files\\WindowsApps\\OpenAI.Desktop_2.0.0.0_x64__test",
  executablePath: installedExecutable,
  productName: "ChatGPT"
};

assert(isWindowsAppxDesktopCachePath(staleCachedExecutable), "managed cache executables should be detected");
assert(isWindowsAppxDesktopCachePath(staleCachedExecutable.toLowerCase()), "managed cache detection should be case-insensitive");
assert(
  currentWindowsAppxPathForManagedCache(staleCachedExecutable, () => installedAppx) === installedExecutable,
  "managed cache executables should resolve to the currently installed AppX executable"
);
assert(
  currentWindowsAppxPathForManagedCache(staleCachedExecutable, () => null) === null,
  "managed cache executables should remain usable when no AppX package is installed"
);

for (const customPath of [
  "C:\\Tools\\ChatGPT.exe",
  installedExecutable,
  "C:\\Users\\Tester\\AppData\\Local\\Codex Profile Manager\\WindowsAppsCache-Backup\\ChatGPT.exe"
]) {
  assert(!isWindowsAppxDesktopCachePath(customPath), `custom path should not be treated as managed cache: ${customPath}`);
  assert(
    currentWindowsAppxPathForManagedCache(customPath, () => {
      throw new Error("AppX discovery must not run for custom paths");
    }) === null,
    `custom path should not be replaced: ${customPath}`
  );
}

console.log("Windows AppX cache refresh verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
