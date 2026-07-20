import { spawn, type SpawnOptions } from "node:child_process";
import nodeFs from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { inheritDefaultCodexHomeResources, listConfigBackups as listProfileConfigBackups, repairProfileGlobalState, restoreConfigBackup as restoreProfileConfigBackup, syncSessionHistory, writeCodexAuth, writeCodexConfig } from "./codex-config.js";
import { createProfileRecord, findProfile, listProfiles, removeProfileRecord, repairProfileCodexAppPath, restoreProfileRecord, softDeleteProfile, updateProfileLaunchMetadata, updateProfileRecord } from "./registry.js";
import { generateLauncher } from "./launcher.js";
import { codexExecutablePath, findWindowsCodexAppxDesktopApp, getDefaultCodexHome, getRuntimePlatform, isWindowsAppsPath, isWindowsCodexGuiExecutable } from "./paths.js";
import { pathExists } from "./fs-utils.js";
import { ensureWindowsAppxDesktopCache } from "./windows-appx-cache.js";
import { listProviderModels, testProvider } from "./provider-test.js";
import { deleteProfileSecrets, getApiKey, upsertApiKey } from "./secrets.js";
import { getRuntimeStatus as inspectRuntimeStatus } from "./runtime.js";
import type { ConfigBackupInfo, CreateProfileInput, CreateProfileResult, LauncherResult, ManagedProfile, ProfileProviderModelsInput, ProfileProviderTestInput, ProfileRuntimeInfo, ProviderModelsResult, ProviderTestResult, RestoreConfigBackupInput, RestoreConfigBackupResult, SessionHistorySyncResolvedSource, UpdateProfileInput, UpdateProfileResult } from "../shared/types.js";

export { listProfiles };

interface LaunchCommand {
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

interface LaunchLog {
  path: string;
  append: (message: string, details?: Record<string, unknown>) => Promise<void>;
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
  if (isApiKeyProfile(profile)) {
    const apiKey = input.provider.apiKey?.trim();
    if (!apiKey) {
      throw new Error("API key is required for API Key profiles.");
    }
    await upsertApiKey({
      profileId: profile.id,
      providerId: profile.provider.id,
      envKeyName: profile.provider.envKeyName,
      secretType: "api_key",
      value: apiKey
    });
    await writeCodexAuth(profile, apiKey);
  }
  if (input.inheritDefaultConfig) {
    await inheritDefaultCodexHomeResources(profile);
  }
  if (input.syncHistory?.enabled) {
    await syncSessionHistory(profile, input.syncHistory, await resolveSessionHistorySources(input, profile));
  }
  const configPath = await writeCodexConfig(profile, { inheritDefaultConfig: input.inheritDefaultConfig });
  const launcher = await generateLauncher(profile);

  return {
    profile,
    configPath,
    launcherPath: launcher.launcherPath
  };
}

async function resolveSessionHistorySources(input: CreateProfileInput, targetProfile: ManagedProfile): Promise<SessionHistorySyncResolvedSource[]> {
  const requestedSources = input.syncHistory?.sources?.length ? input.syncHistory.sources : [{ type: "default" as const }];
  const profiles = await listProfiles(true);
  const resolvedSources: SessionHistorySyncResolvedSource[] = [];

  for (const source of requestedSources) {
    if (source.type === "default") {
      resolvedSources.push({
        type: "default",
        label: "Current Codex / ChatGPT",
        codexHome: getDefaultCodexHome()
      });
      continue;
    }

    if (!source.profileId || source.profileId === targetProfile.id) {
      continue;
    }

    const sourceProfile = profiles.find((profile) => profile.id === source.profileId && profile.status !== "deleted");
    if (!sourceProfile) {
      continue;
    }

    resolvedSources.push({
      type: "profile",
      profileId: sourceProfile.id,
      label: sourceProfile.name,
      codexHome: sourceProfile.paths.codexHome
    });
  }

  return dedupeSessionHistorySources(resolvedSources, targetProfile.paths.codexHome);
}

function dedupeSessionHistorySources(sources: SessionHistorySyncResolvedSource[], targetCodexHome: string): SessionHistorySyncResolvedSource[] {
  const seen = new Set<string>();
  const targetPath = path.resolve(targetCodexHome);
  const dedupedSources: SessionHistorySyncResolvedSource[] = [];

  for (const source of sources) {
    const sourcePath = path.resolve(source.codexHome);
    if (sourcePath === targetPath || seen.has(sourcePath)) {
      continue;
    }
    seen.add(sourcePath);
    dedupedSources.push({
      ...source,
      codexHome: sourcePath
    });
  }

  return dedupedSources;
}

export async function generateProfileLauncher(profileId: string): Promise<LauncherResult> {
  const profile = await mustFindProfile(profileId);
  return generateLauncher(profile);
}

export async function refreshActiveProfileLaunchers(): Promise<void> {
  const profiles = await listProfiles();
  await Promise.all(profiles.map((profile) => generateLauncher(profile)));
}

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const profile = await updateProfileRecord(input);

  if (isApiKeyProfile(profile) && input.provider.apiKey) {
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
  if (!isApiKeyProfile(profile)) {
    return {
      status: "unknown_error",
      ok: false,
      summary: "Account login profile",
      details: "This profile uses ChatGPT account login and does not have an API key provider to test.",
      testedModelsEndpoint: false,
      testedResponsesEndpoint: false
    };
  }
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
  if (!isApiKeyProfile(profile)) {
    return {
      status: "auth_failed",
      ok: false,
      summary: "Account login profile",
      details: "This profile uses ChatGPT account login and does not have an API key provider to fetch models.",
      models: []
    };
  }
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
  const launchLog = await createLaunchLog(profile);
  await launchLog.append("openProfile started", {
    profileId: profile.id,
    profileName: profile.name,
    authMode: profile.auth?.mode ?? "api_key",
    providerType: profile.provider.type,
    codexAppPath: profile.paths.codexAppPath,
    codexHome: profile.paths.codexHome,
    userDataDir: profile.paths.userDataDir
  });

  try {
    await launchLog.append("reading saved API key", { required: isApiKeyProfile(profile), envKeyName: profile.provider.envKeyName });
    const apiKey = isApiKeyProfile(profile) ? await getApiKey(profile.id, profile.provider.id) : null;
    await launchLog.append("saved API key read", { found: Boolean(apiKey), envKeyName: profile.provider.envKeyName });

    await launchLog.append("writing Codex config");
    await writeCodexConfig(profile, { preserveExistingConfig: true });
    if (isApiKeyProfile(profile) && apiKey) {
      await launchLog.append("writing Codex auth bootstrap");
      await writeCodexAuth(profile, apiKey);
    }

    await launchLog.append("repairing profile global state");
    await repairProfileGlobalState(profile);
    let codexExecutable = codexExecutablePath(profile.paths.codexAppPath);
    await launchLog.append("resolved desktop executable", { codexExecutable });

    const shouldUseAppxCache = getRuntimePlatform() === "win32" && (!(await pathExists(codexExecutable)) || isWindowsAppsPath(codexExecutable));
    if (shouldUseAppxCache) {
      await launchLog.append("checking Windows AppX cache", { requestedExecutable: codexExecutable });
      const cachedAppx = await ensureWindowsAppxDesktopCache();
      if (cachedAppx) {
        codexExecutable = cachedAppx.cachedExecutablePath;
        await launchLog.append("using Windows AppX cache executable", { codexExecutable });
      } else {
        await launchLog.append("Windows AppX cache executable unavailable");
      }
    }

    if (!(await pathExists(codexExecutable)) || !isWindowsCodexGuiExecutable(codexExecutable)) {
      if (getRuntimePlatform() === "win32") {
        const appx = findWindowsCodexAppxDesktopApp();
        if (appx || isWindowsAppsPath(codexExecutable)) {
          throw new Error([
            "Microsoft Store / WindowsApps Codex is installed, but Windows blocks direct launching from the protected WindowsApps directory.",
            "Codex Multi Launcher cannot reliably open isolated profiles with the Store/AppX package yet because the launch needs per-profile environment variables and --user-data-dir.",
            appx ? `Detected package: ${appx.packageFullName}` : null,
            appx ? `Detected executable: ${appx.executablePath}` : `Requested executable: ${codexExecutable}`,
            "Profile creation is fixed; Store/AppX profile launching still needs a separate compatibility path."
          ].filter(Boolean).join(" "));
        }
      }

      throw new Error(`Codex desktop executable was not found: ${codexExecutable}. Install Codex for Windows or update this profile with the correct Codex.exe path.`);
    }

    await launchLog.append("regenerating profile launcher");
    await generateLauncher(profile);
    const launchCommand = profileLaunchCommand(profile, codexExecutable, apiKey);
    await launchLog.append("spawning desktop app", {
      command: launchCommand.command,
      args: launchCommand.args,
      cwd: launchCommand.cwd,
      env: summarizeLaunchEnv(launchCommand.env, profile.provider.envKeyName)
    });
    const spawnOutput = await openLaunchOutput(profile);
    const spawnOptions = getRuntimePlatform() === "win32"
      ? windowsDetachedSpawnOptions(launchCommand, spawnOutput.fd)
      : macosDetachedSpawnOptions(launchCommand, spawnOutput.fd);
    const child = spawn(launchCommand.command, launchCommand.args, spawnOptions);

    child.once("spawn", () => {
      void launchLog.append("desktop app process spawned", { pid: child.pid ?? null });
    });
    child.once("error", (error) => {
      spawnOutput.close();
      void launchLog.append("desktop app process error", { message: error.message, stack: error.stack });
    });
    child.once("exit", (code, signal) => {
      spawnOutput.close();
      void launchLog.append("desktop app process exited", { pid: child.pid ?? null, code, signal });
    });

    child.unref();
    await updateProfileLaunchMetadata(profile.id, child.pid ?? null);
    await launchLog.append("openProfile finished", { pid: child.pid ?? null, logPath: launchLog.path });
    return { pid: child.pid ?? null };
  } catch (error) {
    await launchLog.append("openProfile failed", serializeError(error));
    throw error;
  }
}

function isApiKeyProfile(profile: ManagedProfile): boolean {
  return (profile.auth?.mode ?? "api_key") === "api_key";
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
    cwd: path.dirname(codexExecutable),
    env
  };
}

function macosDetachedSpawnOptions(launchCommand: LaunchCommand, outputFd: number): SpawnOptions {
  return {
    cwd: launchCommand.cwd,
    detached: true,
    env: launchCommand.env,
    stdio: ["ignore", outputFd, outputFd]
  };
}

function windowsDetachedSpawnOptions(launchCommand: LaunchCommand, outputFd: number): SpawnOptions {
  return {
    detached: true,
    cwd: launchCommand.cwd,
    env: launchCommand.env,
    stdio: ["ignore", outputFd, outputFd]
  };
}

async function createLaunchLog(profile: ManagedProfile): Promise<LaunchLog> {
  const logDir = path.join(profile.paths.codexHome, "logs");
  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, "desktop-launch.log");
  return {
    path: logPath,
    append: async (message, details) => {
      const suffix = details ? ` ${JSON.stringify(redactLogDetails(details))}` : "";
      await fs.appendFile(logPath, `[${new Date().toISOString()}] ${message}${suffix}\n`, "utf8");
    }
  };
}

async function openLaunchOutput(profile: ManagedProfile): Promise<{ fd: number; close: () => void }> {
  const logDir = path.join(profile.paths.codexHome, "logs");
  await fs.mkdir(logDir, { recursive: true });
  const fd = nodeFs.openSync(path.join(logDir, "desktop-output.log"), "a");
  let closed = false;
  nodeFs.writeSync(fd, `\n[${new Date().toISOString()}] desktop process output begins\n`);
  return {
    fd,
    close: () => {
      if (closed) return;
      closed = true;
      try {
        nodeFs.writeSync(fd, `[${new Date().toISOString()}] desktop process output stream closed\n`);
      } catch {
        // ignore logging close failures
      }
      try {
        nodeFs.closeSync(fd);
      } catch {
        // ignore logging close failures
      }
    }
  };
}

function summarizeLaunchEnv(env: NodeJS.ProcessEnv | undefined, providerEnvKeyName: string): Record<string, unknown> {
  return {
    CODEX_HOME: env?.CODEX_HOME,
    providerEnvKeyName,
    providerApiKeyInjected: Boolean(env?.[providerEnvKeyName]),
    openaiApiKeyInjected: Boolean(env?.OPENAI_API_KEY),
    PATH: env?.PATH
  };
}

function redactLogDetails(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactLogDetails);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const redacted: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    redacted[key] = shouldRedactLogKey(key) ? "[redacted]" : redactLogDetails(entry);
  }
  return redacted;
}

function shouldRedactLogKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized === "apikey"
    || normalized === "openaiapikey"
    || normalized === "secret"
    || normalized === "token"
    || normalized === "authorization";
}

function serializeError(error: unknown): Record<string, unknown> {
  return error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error) };
}

async function mustFindProfile(profileId: string): Promise<ManagedProfile> {
  const profile = await findProfile(profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }
  return profile;
}
