import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists } from "./fs-utils.js";
import { findWindowsCodexAppxDesktopApp, getAppPaths, getRuntimePlatform, type WindowsAppxDesktopApp } from "./paths.js";

export interface CachedWindowsAppxDesktopApp extends WindowsAppxDesktopApp {
  cachedAppPath: string;
  cachedExecutablePath: string;
}

export async function ensureWindowsAppxDesktopCache(): Promise<CachedWindowsAppxDesktopApp | null> {
  if (getRuntimePlatform() !== "win32") {
    return null;
  }

  const appx = findWindowsCodexAppxDesktopApp();
  if (!appx) {
    return null;
  }

  const sourceAppDir = path.dirname(appx.executablePath);
  const cacheRoot = windowsAppxCacheRoot();
  const cachedAppPath = path.join(cacheRoot, safePathSegment(appx.packageFullName), "app");
  const cachedExecutablePath = path.join(cachedAppPath, path.basename(appx.executablePath));

  if (!(await pathExists(cachedExecutablePath))) {
    const tempAppPath = `${cachedAppPath}.tmp-${Date.now()}`;
    await fs.rm(tempAppPath, { recursive: true, force: true });
    await ensureDir(path.dirname(tempAppPath));
    await fs.cp(sourceAppDir, tempAppPath, {
      recursive: true,
      force: true,
      errorOnExist: false
    });
    await fs.rm(cachedAppPath, { recursive: true, force: true });
    await ensureDir(path.dirname(cachedAppPath));
    await fs.rename(tempAppPath, cachedAppPath);
  }

  return {
    ...appx,
    cachedAppPath,
    cachedExecutablePath
  };
}

function windowsAppxCacheRoot(): string {
  return path.join(process.env.LOCALAPPDATA || getAppPaths().appDataDir, "Codex Profile Manager", "WindowsAppsCache");
}

function safePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_");
}
