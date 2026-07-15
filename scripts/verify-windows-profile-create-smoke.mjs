const profileName = `Win Profile Create Smoke ${Date.now()}`;
const { createProfile, listProfiles, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");

try {
  const result = await createProfile({
    name: profileName,
    inheritDefaultConfig: true,
    codexAppPath: "C:\\Program Files\\WindowsApps\\OpenAI.Codex_fake\\app\\Codex.exe",
    provider: {
      type: "third_party_responses",
      displayName: "Smoke Proxy",
      baseUrl: "https://proxy.example.com/v1",
      model: "gpt-5.2",
      apiKey: "sk-test-windows-profile-create-smoke",
      reasoningEffort: "medium"
    }
  });

  console.log(JSON.stringify({
    id: result.profile.id,
    codexHome: result.profile.paths.codexHome,
    launcherPath: result.profile.paths.launcherPath
  }, null, 2));

  await permanentlyDeleteProfile(result.profile.id);
  console.log("Windows profile creation smoke verification passed.");
} catch (error) {
  await cleanupProfilesByName(profileName);
  throw error;
}

async function cleanupProfilesByName(name) {
  try {
    const profiles = await listProfiles(true);
    await Promise.all(
      profiles
        .filter((profile) => profile.name === name)
        .map((profile) => permanentlyDeleteProfile(profile.id).catch(() => undefined))
    );
  } catch {
    // Best-effort cleanup only.
  }
}
