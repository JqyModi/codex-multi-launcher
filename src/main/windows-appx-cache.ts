import path from "node:path";
import { createRequire } from "node:module";
import { pathExists } from "./fs-utils.js";
import { findWindowsCodexAppxDesktopApp, getAppPaths, getRuntimePlatform, type WindowsAppxDesktopApp } from "./paths.js";

type NativeFs = typeof import("node:fs");

const require = createRequire(import.meta.url);

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
  const nativeFs = getNativeFs();

  await cleanupStaleTempApps(path.dirname(cachedAppPath), path.basename(cachedAppPath), nativeFs);

  if (!(await isValidCachedApp(cachedAppPath, cachedExecutablePath, nativeFs))) {
    const tempAppPath = `${cachedAppPath}.tmp-${Date.now()}`;
    await nativeFs.promises.rm(tempAppPath, { recursive: true, force: true });
    await nativeFs.promises.mkdir(path.dirname(tempAppPath), { recursive: true });
    try {
      await nativeFs.promises.cp(sourceAppDir, tempAppPath, {
        recursive: true,
        force: true,
        errorOnExist: false
      });
      await nativeFs.promises.rm(cachedAppPath, { recursive: true, force: true });
      await nativeFs.promises.mkdir(path.dirname(cachedAppPath), { recursive: true });
      await nativeFs.promises.rename(tempAppPath, cachedAppPath);
    } catch (error) {
      await nativeFs.promises.rm(tempAppPath, { recursive: true, force: true });
      throw error;
    }
  }

  return {
    ...appx,
    cachedAppPath,
    cachedExecutablePath
  };
}

function getNativeFs(): NativeFs {
  try {
    const originalFs = require("original-fs") as NativeFs;
    const promises = (originalFs as { promises?: { cp?: unknown } }).promises;
    if (typeof promises?.cp === "function") {
      return originalFs;
    }
  } catch {
    // Fall back to Node's fs when running verification scripts outside Electron.
  }
  return require("node:fs") as NativeFs;
}

async function cleanupStaleTempApps(cachePackageRoot: string, appDirName: string, nativeFs: NativeFs): Promise<void> {
  if (!(await pathExists(cachePackageRoot))) {
    return;
  }

  const entries = await nativeFs.promises.readdir(cachePackageRoot, { withFileTypes: true });
  await Promise.all(entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${appDirName}.tmp-`))
    .map((entry) => nativeFs.promises.rm(path.join(cachePackageRoot, entry.name), { recursive: true, force: true })));
}

async function isValidCachedApp(cachedAppPath: string, cachedExecutablePath: string, nativeFs: NativeFs): Promise<boolean> {
  try {
    const [appStat, executableStat, asarStat] = await Promise.all([
      nativeFs.promises.stat(cachedAppPath),
      nativeFs.promises.stat(cachedExecutablePath),
      nativeFs.promises.stat(path.join(cachedAppPath, "resources", "app.asar"))
    ]);
    return appStat.isDirectory() && executableStat.isFile() && asarStat.isFile();
  } catch {
    return false;
  }
}

function windowsAppxCacheRoot(): string {
  return path.join(process.env.LOCALAPPDATA || getAppPaths().appDataDir, "Codex Profile Manager", "WindowsAppsCache");
}

function safePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "_");
}
