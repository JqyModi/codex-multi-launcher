import os from "node:os";
import path from "node:path";
import type { AppPaths } from "../shared/types.js";

export const APP_NAME = "Codex Profile Manager";
export const DEFAULT_CODEX_APP_PATH = "/Applications/Codex.app";

export function getAppPaths(): AppPaths {
  const home = os.homedir();
  const appDataDir = path.join(home, "Library", "Application Support", APP_NAME);

  return {
    appDataDir,
    profilesFile: path.join(appDataDir, "profiles.json"),
    secretsFile: path.join(appDataDir, "secrets.enc.json"),
    masterKeyFile: path.join(appDataDir, "master.key"),
    defaultProfileRoot: path.join(home, ".codex-profiles"),
    defaultUserDataRoot: path.join(home, "Library", "Application Support", "Codex Profiles"),
    defaultLauncherRoot: path.join(home, "Applications", "Codex Profiles")
  };
}

export function codexExecutablePath(codexAppPath: string): string {
  return path.join(codexAppPath, "Contents", "MacOS", "Codex");
}

export function slugifyProfileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "profile";
}
