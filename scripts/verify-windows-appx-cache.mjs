const { createProfile, openProfile, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");
const { ensureWindowsAppxDesktopCache } = await import("../dist-electron/main/windows-appx-cache.js");

const cachedAppx = await ensureWindowsAppxDesktopCache();
assert(cachedAppx, "expected a Microsoft Store/AppX Codex package to be detected and cached");
console.log(JSON.stringify({
  packageFullName: cachedAppx.packageFullName,
  cachedExecutablePath: cachedAppx.cachedExecutablePath
}, null, 2));

const profileName = `Win AppX Cache ${Date.now()}`;
const result = await createProfile({
  name: profileName,
  inheritDefaultConfig: false,
  provider: {
    type: "third_party_responses",
    displayName: "AppX Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: "sk-test-windows-appx-cache",
    reasoningEffort: "medium"
  }
});

try {
  const launchResult = await openProfile(result.profile.id);
  assert(typeof launchResult.pid === "number" || launchResult.pid === null, "openProfile should return a launch result");
  console.log("Windows AppX cache launch verification passed.");
} finally {
  await permanentlyDeleteProfile(result.profile.id);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
