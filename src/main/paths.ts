import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import type { AppPaths } from "../shared/types.js";

export const APP_NAME = "Codex Profile Manager";
export const DEFAULT_CODEX_APP_PATH = "/Applications/Codex.app";
export const DEFAULT_WINDOWS_CODEX_APP_PATH = "Codex.exe";
export type SupportedPlatform = "darwin" | "win32" | "linux";

export interface PathProvider {
  home(): string;
  appData(): string;
  userData(): string;
}

let pathProvider: PathProvider | null = null;

export function configurePathProvider(provider: PathProvider): void {
  pathProvider = provider;
}

function overrideHome(): string | null {
  return process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE || null;
}

function getPathProvider(): PathProvider {
  const override = overrideHome();
  if (override) {
    return nodePathProvider(override);
  }

  return pathProvider ?? nodePathProvider(os.homedir());
}

function nodePathProvider(home: string): PathProvider {
  const appData = () => {
    if (getRuntimePlatform() === "darwin") {
      return path.join(home, "Library", "Application Support");
    }
    if (getRuntimePlatform() === "win32") {
      return process.env.APPDATA || path.join(home, "AppData", "Roaming");
    }
    return process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  };

  return {
    home: () => home,
    appData,
    userData: () => path.join(appData(), APP_NAME)
  };
}

export function getAppPaths(): AppPaths {
  const provider = getPathProvider();
  const home = provider.home();
  const appDataDir = provider.userData();

  return {
    appDataDir,
    profilesFile: path.join(appDataDir, "profiles.json"),
    secretsFile: path.join(appDataDir, "secrets.enc.json"),
    masterKeyFile: path.join(appDataDir, "master.key"),
    defaultProfileRoot: path.join(home, ".codex-profiles"),
    defaultUserDataRoot: path.join(provider.appData(), "Codex Profiles"),
    defaultLauncherRoot: defaultLauncherRoot(home)
  };
}

export function getDefaultCodexHome(): string {
  return path.join(getPathProvider().home(), ".codex");
}

export function getDefaultCodexAppPath(): string {
  if (getRuntimePlatform() === "win32") {
    return findWindowsCodexAppExecutable() ?? DEFAULT_WINDOWS_CODEX_APP_PATH;
  }

  return DEFAULT_CODEX_APP_PATH;
}

export function codexExecutablePath(codexAppPath: string): string {
  if (getRuntimePlatform() === "win32") {
    return path.extname(codexAppPath).toLowerCase() === ".exe" ? codexAppPath : path.join(codexAppPath, "Codex.exe");
  }

  return path.join(codexAppPath, "Contents", "MacOS", "Codex");
}

export function isWindowsCodexGuiExecutable(candidatePath: string): boolean {
  if (getRuntimePlatform() !== "win32") {
    return true;
  }

  if (path.basename(candidatePath) !== "Codex.exe") {
    return false;
  }

  const normalized = candidatePath.replace(/\\/g, "/").toLowerCase();
  return !normalized.includes("/resources/")
    && !normalized.includes("/bin/")
    && !normalized.endsWith("/resources/codex.exe");
}

function defaultLauncherRoot(home: string): string {
  if (getRuntimePlatform() === "win32") {
    return path.join(home, "Desktop", "Codex Profiles");
  }

  return path.join(home, "Applications", "Codex Profiles");
}

export function launcherFileName(profileName: string): string {
  return getRuntimePlatform() === "win32" ? `${profileName}.cmd` : `${profileName}.app`;
}

export function getRuntimePlatform(): SupportedPlatform {
  const override = process.env.CODEX_PROFILE_MANAGER_PLATFORM_OVERRIDE;
  if (override === "darwin" || override === "win32" || override === "linux") {
    return override;
  }

  if (process.platform === "win32" || process.platform === "linux") {
    return process.platform;
  }

  return "darwin";
}

function findWindowsCodexAppExecutable(): string | null {
  const candidates = [
    findCommandOnPath("Codex.exe"),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WindowsApps", "Codex.exe") : null,
    findRunningWindowsCodexAppExecutable(),
    findWindowsCodexAppxExecutable(),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "Codex", "Codex.exe") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Codex", "Codex.exe") : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, "Codex", "Codex.exe") : null,
    process.env["PROGRAMFILES(X86)"] ? path.join(process.env["PROGRAMFILES(X86)"], "Codex", "Codex.exe") : null
  ];

  for (const candidate of candidates) {
    if (candidate && fileExists(candidate) && isWindowsCodexGuiExecutable(candidate)) {
      return candidate;
    }
  }

  const roots = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"]].filter((value): value is string => Boolean(value));
  for (const root of roots) {
    const found = findFileShallow(root, "Codex.exe", 6, isWindowsCodexGuiExecutable);
    if (found && isWindowsCodexGuiExecutable(found)) {
      return found;
    }
  }

  return null;
}

function findRunningWindowsCodexAppExecutable(): string | null {
  try {
    const output = execFileSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "(Get-Process -Name Codex -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*\\\\app\\\\Codex.exe' } | Select-Object -First 1 -ExpandProperty Path)"
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output.trim() || null;
  } catch {
    return null;
  }
}

function findWindowsCodexAppxExecutable(): string | null {
  try {
    const output = execFileSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "$pkg = Get-AppxPackage OpenAI.Codex -ErrorAction SilentlyContinue | Select-Object -First 1; if ($pkg) { Join-Path $pkg.InstallLocation 'app\\Codex.exe' }"
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return output.trim() || null;
  } catch {
    return null;
  }
}

function findCommandOnPath(command: string): string | null {
  const pathValue = process.env.PATH;
  if (!pathValue) return null;

  for (const directory of pathValue.split(path.delimiter)) {
    const candidate = path.join(directory, command);
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function findFileShallow(root: string, fileName: string, maxDepth: number, predicate: (filePath: string) => boolean = () => true): string | null {
  if (maxDepth < 0) return null;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isFile() && entry.name === fileName && predicate(entryPath)) {
      return entryPath;
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = findFileShallow(path.join(root, entry.name), fileName, maxDepth - 1, predicate);
    if (found) {
      return found;
    }
  }

  return null;
}

function fileExists(targetPath: string): boolean {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

export function slugifyProfileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "profile";
}
