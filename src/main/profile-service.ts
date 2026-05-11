import { spawn } from "node:child_process";
import { codexExecutablePath } from "./paths.js";
import { writeCodexConfig } from "./codex-config.js";
import { createProfileRecord, findProfile, listProfiles, softDeleteProfile } from "./registry.js";
import { generateLauncher } from "./launcher.js";
import { getApiKey, upsertApiKey } from "./secrets.js";
import { getRuntimeStatus as inspectRuntimeStatus } from "./runtime.js";
import type { CreateProfileInput, CreateProfileResult, LauncherResult, ManagedProfile, ProfileRuntimeInfo } from "../shared/types.js";

export { listProfiles };

export async function getRuntimeStatus(): Promise<ProfileRuntimeInfo[]> {
  return inspectRuntimeStatus(await listProfiles());
}

export async function createProfile(input: CreateProfileInput): Promise<CreateProfileResult> {
  const profile = await createProfileRecord(input);
  await upsertApiKey({
    profileId: profile.id,
    providerId: profile.provider.id,
    envKeyName: profile.provider.envKeyName,
    secretType: "api_key",
    value: input.provider.apiKey
  });
  const configPath = await writeCodexConfig(profile);
  const launcher = await generateLauncher(profile);

  return {
    profile,
    configPath,
    launcherPath: launcher.launcherPath
  };
}

export async function generateProfileLauncher(profileId: string): Promise<LauncherResult> {
  const profile = await mustFindProfile(profileId);
  return generateLauncher(profile);
}

export async function deleteProfile(profileId: string): Promise<{ ok: true }> {
  await softDeleteProfile(profileId);
  return { ok: true };
}

export async function openProfile(profileId: string): Promise<{ pid: number | null }> {
  const profile = await mustFindProfile(profileId);
  const apiKey = await getApiKey(profile.id, profile.provider.id);
  const child = spawn(codexExecutablePath(profile.paths.codexAppPath), [`--user-data-dir=${profile.paths.userDataDir}`], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      CODEX_HOME: profile.paths.codexHome,
      ...(apiKey ? { [profile.provider.envKeyName]: apiKey } : {})
    }
  });

  child.unref();
  return { pid: child.pid ?? null };
}

async function mustFindProfile(profileId: string): Promise<ManagedProfile> {
  const profile = await findProfile(profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }
  return profile;
}
