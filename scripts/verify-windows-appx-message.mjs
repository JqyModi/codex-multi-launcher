const { createProfile, openProfile, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");

const profileName = `Win AppX Message ${Date.now()}`;
const result = await createProfile({
  name: profileName,
  inheritDefaultConfig: false,
  provider: {
    type: "third_party_responses",
    displayName: "AppX Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: "sk-test-windows-appx-message",
    reasoningEffort: "medium"
  }
});

try {
  await openProfile(result.profile.id);
  throw new Error("Expected openProfile to fail for Store/AppX-only Windows installation.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  assert(message.includes("Microsoft Store / WindowsApps Codex is installed"), "error should explain Store/AppX launch limitation");
  assert(!message.includes("Codex desktop executable was not found: ChatGPT.exe"), "error should not fall back to misleading ChatGPT.exe not found message");
  console.log("Windows AppX message verification passed.");
} finally {
  await permanentlyDeleteProfile(result.profile.id);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
