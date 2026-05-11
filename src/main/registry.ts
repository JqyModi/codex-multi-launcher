import path from "node:path";
import { ensureDir, readJsonFile, writeJsonFile } from "./fs-utils.js";
import { DEFAULT_CODEX_APP_PATH, getAppPaths, slugifyProfileName } from "./paths.js";
import type { CreateProfileInput, ManagedProfile, ProfileRegistry, UpdateProfileInput } from "../shared/types.js";

const EMPTY_REGISTRY: ProfileRegistry = {
  schemaVersion: 1,
  profiles: []
};

export async function loadRegistry(): Promise<ProfileRegistry> {
  const appPaths = getAppPaths();
  return readJsonFile<ProfileRegistry>(appPaths.profilesFile, EMPTY_REGISTRY);
}

export async function saveRegistry(registry: ProfileRegistry): Promise<void> {
  const appPaths = getAppPaths();
  await writeJsonFile(appPaths.profilesFile, registry);
}

export async function listProfiles(includeDeleted = false): Promise<ManagedProfile[]> {
  const registry = await loadRegistry();
  return includeDeleted ? registry.profiles : registry.profiles.filter((profile) => profile.status !== "deleted");
}

export async function findProfile(profileId: string): Promise<ManagedProfile | null> {
  const registry = await loadRegistry();
  return registry.profiles.find((profile) => profile.id === profileId) ?? null;
}

export async function createProfileRecord(input: CreateProfileInput): Promise<ManagedProfile> {
  const appPaths = getAppPaths();
  const registry = await loadRegistry();
  const baseSlug = slugifyProfileName(input.name);
  const existingIds = new Set(registry.profiles.map((profile) => profile.id));
  let id = baseSlug;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const now = new Date().toISOString();
  const codexHome = path.join(appPaths.defaultProfileRoot, id, "codex-home");
  const userDataDir = path.join(appPaths.defaultUserDataRoot, id, "user-data");
  const launcherDirectory = input.launcherDirectory ?? appPaths.defaultLauncherRoot;
  const launcherPath = path.join(launcherDirectory, `${input.name}.app`);
  const providerId = input.provider.type === "official_openai" ? "openai" : "proxy";
  const envKeyName = input.provider.type === "official_openai"
    ? "OPENAI_API_KEY"
    : `CODEX_PROFILE_${id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;
  const profile: ManagedProfile = {
    id,
    name: input.name,
    status: "active",
    paths: {
      codexAppPath: input.codexAppPath ?? DEFAULT_CODEX_APP_PATH,
      codexHome,
      userDataDir,
      launcherPath
    },
    provider: {
      type: input.provider.type,
      id: providerId,
      displayName: input.provider.displayName,
      baseUrl: input.provider.baseUrl,
      wireApi: "responses",
      envKeyName,
      model: input.provider.model,
      reasoningEffort: input.provider.reasoningEffort ?? "medium"
    },
    launch: {
      lastLaunchedAt: null,
      lastKnownPid: null,
      lastKnownUserDataDir: userDataDir
    },
    timestamps: {
      createdAt: now,
      updatedAt: now
    }
  };

  await Promise.all([ensureDir(codexHome), ensureDir(userDataDir), ensureDir(launcherDirectory)]);

  registry.profiles.push(profile);
  await saveRegistry(registry);

  return profile;
}

export async function softDeleteProfile(profileId: string): Promise<void> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  profile.status = "deleted";
  profile.timestamps.updatedAt = new Date().toISOString();
  await saveRegistry(registry);
}

export async function restoreProfileRecord(profileId: string): Promise<void> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  profile.status = "active";
  profile.timestamps.updatedAt = new Date().toISOString();
  await saveRegistry(registry);
}

export async function updateProfileRecord(input: UpdateProfileInput): Promise<ManagedProfile> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === input.profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${input.profileId}`);
  }

  profile.provider.displayName = input.provider.displayName;
  profile.provider.baseUrl = input.provider.baseUrl;
  profile.provider.model = input.provider.model;
  profile.provider.reasoningEffort = input.provider.reasoningEffort ?? profile.provider.reasoningEffort;
  profile.timestamps.updatedAt = new Date().toISOString();
  await saveRegistry(registry);
  return profile;
}

export async function updateProfileLaunchMetadata(profileId: string, pid: number | null): Promise<void> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  profile.launch.lastLaunchedAt = new Date().toISOString();
  profile.launch.lastKnownPid = pid;
  profile.launch.lastKnownUserDataDir = profile.paths.userDataDir;
  profile.timestamps.updatedAt = new Date().toISOString();
  await saveRegistry(registry);
}
