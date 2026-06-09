import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { inheritDefaultCodexHomeResources, listConfigBackups as listProfileConfigBackups, restoreConfigBackup as restoreProfileConfigBackup, writeCodexAuth, writeCodexConfig } from "./codex-config.js";
import { createProfileRecord, findProfile, listProfiles, removeProfileRecord, repairProfileCodexAppPath, restoreProfileRecord, softDeleteProfile, updateProfileLaunchMetadata, updateProfileRecord } from "./registry.js";
import { generateLauncher } from "./launcher.js";
import { codexExecutablePath, getRuntimePlatform, isWindowsCodexGuiExecutable } from "./paths.js";
import { pathExists } from "./fs-utils.js";
import { listProviderModels, testProvider } from "./provider-test.js";
import { deleteProfileSecrets, getApiKey, upsertApiKey } from "./secrets.js";
import { getRuntimeStatus as inspectRuntimeStatus } from "./runtime.js";
import type { ConfigBackupInfo, CreateProfileInput, CreateProfileResult, LauncherResult, ManagedProfile, ProfileProviderModelsInput, ProfileProviderTestInput, ProfileRuntimeInfo, ProviderModelsResult, ProviderTestResult, RestoreConfigBackupInput, RestoreConfigBackupResult, UpdateProfileInput, UpdateProfileResult } from "../shared/types.js";

export { listProfiles };

interface LaunchCommand {
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
}

export async function getRuntimeStatus(): Promise<ProfileRuntimeInfo[]> {
  return inspectRuntimeStatus(await listProfiles());
}

export async function listConfigBackups(profileId: string): Promise<ConfigBackupInfo[]> {
  return listProfileConfigBackups(await mustFindProfile(profileId));
}

export async function restoreConfigBackup(input: RestoreConfigBackupInput): Promise<RestoreConfigBackupResult> {
  return restoreProfileConfigBackup(await mustFindProfile(input.profileId), input.backupPath);
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
  await writeCodexAuth(profile, input.provider.apiKey);
  if (input.inheritDefaultConfig) {
    await inheritDefaultCodexHomeResources(profile);
  }
  const configPath = await writeCodexConfig(profile, { inheritDefaultConfig: input.inheritDefaultConfig });
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

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const profile = await updateProfileRecord(input);

  if (input.provider.apiKey) {
    await upsertApiKey({
      profileId: profile.id,
      providerId: profile.provider.id,
      envKeyName: profile.provider.envKeyName,
      secretType: "api_key",
      value: input.provider.apiKey
    });
    await writeCodexAuth(profile, input.provider.apiKey);
  }

  const configPath = await writeCodexConfig(profile, { preserveExistingConfig: true });
  const launcher = await generateLauncher(profile);

  return {
    profile,
    configPath,
    launcherPath: launcher.launcherPath
  };
}

export async function testProfileProvider(input: ProfileProviderTestInput): Promise<ProviderTestResult> {
  const profile = await mustFindProfile(input.profileId);
  const apiKey = input.apiKey || await getApiKey(profile.id, profile.provider.id);
  if (!apiKey) {
    return {
      status: "auth_failed",
      ok: false,
      summary: "API key not found",
      details: "No saved API key was found for this profile. Enter a new API key and try again.",
      testedModelsEndpoint: false,
      testedResponsesEndpoint: false
    };
  }

  return testProvider({
    baseUrl: profile.provider.type === "third_party_responses" ? input.baseUrl ?? profile.provider.baseUrl ?? "" : "https://api.openai.com/v1",
    apiKey,
    model: input.model
  });
}

export async function listProfileProviderModels(input: ProfileProviderModelsInput): Promise<ProviderModelsResult> {
  const profile = await mustFindProfile(input.profileId);
  const apiKey = input.apiKey || await getApiKey(profile.id, profile.provider.id);
  if (!apiKey) {
    return {
      status: "auth_failed",
      ok: false,
      summary: "API key not found",
      details: "No saved API key was found for this profile. Enter a new API key and try again.",
      models: []
    };
  }

  return listProviderModels({
    baseUrl: profile.provider.type === "third_party_responses" ? input.baseUrl ?? profile.provider.baseUrl ?? "" : "https://api.openai.com/v1",
    apiKey
  });
}

export async function deleteProfile(profileId: string): Promise<{ ok: true }> {
  await softDeleteProfile(profileId);
  return { ok: true };
}

export async function permanentlyDeleteProfile(profileId: string): Promise<{ ok: true }> {
  const profile = await removeProfileRecord(profileId);
  await deleteProfileSecrets(profile.id);
  await Promise.all([
    fs.rm(profile.paths.codexHome, { force: true, recursive: true }),
    fs.rm(profile.paths.userDataDir, { force: true, recursive: true }),
    fs.rm(profile.paths.launcherPath, { force: true, recursive: true })
  ]);
  return { ok: true };
}

export async function restoreProfile(profileId: string): Promise<{ ok: true }> {
  await restoreProfileRecord(profileId);
  return { ok: true };
}

export async function openProfile(profileId: string): Promise<{ pid: number | null }> {
  const profile = await repairProfileCodexAppPath(await mustFindProfile(profileId));
  const apiKey = await getApiKey(profile.id, profile.provider.id);
  await writeCodexConfig(profile, { preserveExistingConfig: true });
  if (apiKey) {
    await writeCodexAuth(profile, apiKey);
  }
  const codexExecutable = codexExecutablePath(profile.paths.codexAppPath);
  if (!(await pathExists(codexExecutable)) || !isWindowsCodexGuiExecutable(codexExecutable)) {
    throw new Error(`Codex desktop executable was not found: ${codexExecutable}. Install Codex for Windows or update this profile with the correct Codex.exe path.`);
  }
  await generateLauncher(profile);
  const launchCommand = getRuntimePlatform() === "win32"
    ? profileLaunchCommand(profile, codexExecutable, apiKey)
    : launcherOpenCommand(profile.paths.launcherPath);
  const child = spawn(launchCommand.command, launchCommand.args, {
    detached: true,
    stdio: "ignore",
    ...(launchCommand.env ? { env: launchCommand.env } : {})
  });

  child.unref();
  await updateProfileLaunchMetadata(profile.id, child.pid ?? null);
  return { pid: child.pid ?? null };
}

function profileLaunchCommand(profile: ManagedProfile, codexExecutable: string, apiKey: string | null): LaunchCommand {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CODEX_HOME: profile.paths.codexHome
  };
  if (apiKey) {
    env[profile.provider.envKeyName] = apiKey;
    if (profile.provider.type === "official_openai") {
      env.OPENAI_API_KEY = apiKey;
    }
  }

  return {
    command: codexExecutable,
    args: [`--user-data-dir=${profile.paths.userDataDir}`],
    env
  };
}

function launcherOpenCommand(launcherPath: string): LaunchCommand {
  if (getRuntimePlatform() === "win32") {
    return { command: "cmd.exe", args: ["/c", launcherPath] };
  }

  return { command: "/usr/bin/open", args: [launcherPath] };
}

async function mustFindProfile(profileId: string): Promise<ManagedProfile> {
  const profile = await findProfile(profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }
  return profile;
}
