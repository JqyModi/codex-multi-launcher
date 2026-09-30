const { createProfile, openProfile, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");
const { findWindowsCodexAppxDesktopApp } = await import("../dist-electron/main/paths.js");

const appx = findWindowsCodexAppxDesktopApp();
assert(appx, "expected a registered Microsoft Store/MSIX Codex package");
console.log(JSON.stringify({
  packageFullName: appx.packageFullName,
  executablePath: appx.executablePath
}, null, 2));

const profileName = `Win Packaged ${Date.now()}`;
const result = await createProfile({
  name: profileName,
  codexAppPath: appx.executablePath,
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
  assert(typeof launchResult.pid === "number" && launchResult.pid > 0, "packaged activation must return the launched PID");
  console.log(`Windows packaged launch verification passed (PID ${launchResult.pid}).`);
} finally {
  await permanentlyDeleteProfile(result.profile.id);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
