import path from "node:path";
import { ensureDir, readJsonFile, writeJsonFile } from "./fs-utils.js";
import { getAppPaths, isWindowsCodexGuiExecutable, launcherFileName, resolveCodexDesktopApp, slugifyProfileName } from "./paths.js";
import { pathExists } from "./fs-utils.js";
import type { CreateProfileInput, ManagedProfile, ProfileRegistry, UpdateProfileInput } from "../shared/types.js";

export const DEFAULT_PROFILE_ICON_BACKGROUND_COLOR = "#34C759";

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
  registry.profiles = registry.profiles.map(normalizeProfileAppearance);
  return includeDeleted ? registry.profiles : registry.profiles.filter((profile) => profile.status !== "deleted");
}

export async function findProfile(profileId: string): Promise<ManagedProfile | null> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === profileId);
  return profile ? normalizeProfileAppearance(profile) : null;
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
  const launcherPath = path.join(launcherDirectory, launcherFileName(input.name));
  const desktopApp = resolveCodexDesktopApp(input.codexAppPath);
  const providerId = input.provider.type === "official_openai" ? "openai" : "proxy";
  const envKeyName = input.provider.type === "official_openai"
    ? "OPENAI_API_KEY"
    : `CODEX_PROFILE_${id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;
  const profile: ManagedProfile = {
    id,
    name: input.name,
    status: "active",
    paths: {
      codexAppPath: desktopApp.appPath,
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
    appearance: {
      iconBackgroundColor: normalizeHexColor(input.appearance?.iconBackgroundColor)
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

export async function removeProfileRecord(profileId: string): Promise<ManagedProfile> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  registry.profiles = registry.profiles.filter((item) => item.id !== profileId);
  await saveRegistry(registry);
  return profile;
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
  profile.appearance = {
    ...normalizeProfileAppearance(profile).appearance,
    ...(input.appearance?.iconBackgroundColor ? { iconBackgroundColor: normalizeHexColor(input.appearance.iconBackgroundColor) } : {})
  };
  profile.timestamps.updatedAt = new Date().toISOString();
  await saveRegistry(registry);
  return profile;
}

export async function updateProfileCodexAppPath(profileId: string, codexAppPath: string): Promise<ManagedProfile> {
  const registry = await loadRegistry();
  const profile = registry.profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  profile.paths.codexAppPath = codexAppPath;
  profile.timestamps.updatedAt = new Date().toISOString();
  await saveRegistry(registry);
  return profile;
}

export async function repairProfileCodexAppPath(profile: ManagedProfile): Promise<ManagedProfile> {
  const resolvedDesktopApp = resolveCodexDesktopApp(profile.paths.codexAppPath);
  if (resolvedDesktopApp.source === "preferred" && await pathExists(resolvedDesktopApp.executablePath) && isWindowsCodexGuiExecutable(resolvedDesktopApp.executablePath)) {
    return profile;
  }

  if (resolvedDesktopApp.source === "auto-detected" && resolvedDesktopApp.appPath !== profile.paths.codexAppPath && await pathExists(resolvedDesktopApp.executablePath) && isWindowsCodexGuiExecutable(resolvedDesktopApp.executablePath)) {
    return updateProfileCodexAppPath(profile.id, resolvedDesktopApp.appPath);
  }

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

function normalizeProfileAppearance(profile: ManagedProfile): ManagedProfile {
  profile.appearance = {
    iconBackgroundColor: normalizeHexColor(profile.appearance?.iconBackgroundColor)
  };
  return profile;
}

function normalizeHexColor(value: string | undefined): string {
  if (!value) {
    return DEFAULT_PROFILE_ICON_BACKGROUND_COLOR;
  }

  const trimmed = value.trim();
  const shortHexMatch = trimmed.match(/^#?([0-9a-fA-F]{3})$/);
  if (shortHexMatch) {
    return `#${shortHexMatch[1].split("").map((character) => `${character}${character}`).join("").toUpperCase()}`;
  }

  const longHexMatch = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (longHexMatch) {
    return `#${longHexMatch[1].toUpperCase()}`;
  }

  return DEFAULT_PROFILE_ICON_BACKGROUND_COLOR;
}
