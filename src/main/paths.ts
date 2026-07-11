import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import type { AppPaths } from "../shared/types.js";

export const APP_NAME = "Codex Profile Manager";
export const DEFAULT_CODEX_APP_PATH = "/Applications/ChatGPT.app";
export const DEFAULT_WINDOWS_CODEX_APP_PATH = "ChatGPT.exe";
const LEGACY_CODEX_APP_PATH = "/Applications/Codex.app";
const DESKTOP_EXECUTABLE_NAMES = ["ChatGPT", "Codex"] as const;
const WINDOWS_DESKTOP_EXECUTABLE_NAMES = ["ChatGPT.exe", "Codex.exe"] as const;
export type SupportedPlatform = "darwin" | "win32" | "linux";
export type DesktopAppSource = "preferred" | "auto-detected" | "missing";

export interface ResolvedDesktopApp {
  appPath: string;
  executablePath: string;
  productName: "ChatGPT" | "Codex";
  source: DesktopAppSource;
}

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
  return resolveCodexDesktopApp().appPath;
}

export function codexExecutablePath(codexAppPath: string): string {
  return resolveCodexDesktopApp(codexAppPath).executablePath;
}

export function resolveCodexDesktopApp(preferredPath?: string | null): ResolvedDesktopApp {
  const normalizedPreferredPath = preferredPath?.trim();
  if (normalizedPreferredPath) {
    const preferred = resolveDesktopAppCandidate(normalizedPreferredPath, "preferred");
    if (preferred) {
      return preferred;
    }
  }

  for (const candidate of defaultDesktopAppCandidates()) {
    const resolved = resolveDesktopAppCandidate(candidate, "auto-detected");
    if (resolved) {
      return resolved;
    }
  }

  const fallbackPath = normalizedPreferredPath || platformDefaultDesktopAppPath();
  return {
    appPath: fallbackPath,
    executablePath: expectedDesktopExecutablePath(fallbackPath),
    productName: productNameForPath(fallbackPath),
    source: "missing"
  };
}

function resolveDesktopAppCandidate(candidatePath: string, source: Exclude<DesktopAppSource, "missing">): ResolvedDesktopApp | null {
  if (getRuntimePlatform() === "win32") {
    if (path.extname(candidatePath).toLowerCase() === ".exe") {
      return fileExists(candidatePath) && isWindowsCodexGuiExecutable(candidatePath)
        ? {
            appPath: candidatePath,
            executablePath: candidatePath,
            productName: productNameForPath(candidatePath),
            source
          }
        : null;
    }

    for (const executableName of WINDOWS_DESKTOP_EXECUTABLE_NAMES) {
      const executablePath = path.join(candidatePath, executableName);
      if (fileExists(executablePath) && isWindowsCodexGuiExecutable(executablePath)) {
        return {
          appPath: candidatePath,
          executablePath,
          productName: productNameForPath(executablePath),
          source
        };
      }
    }

    return null;
  }

  if (path.extname(candidatePath).toLowerCase() !== ".app" && fileExists(candidatePath)) {
    return {
      appPath: candidatePath,
      executablePath: candidatePath,
      productName: productNameForPath(candidatePath),
      source
    };
  }

  for (const executableName of macosExecutableCandidates(candidatePath)) {
    const executablePath = path.join(candidatePath, "Contents", "MacOS", executableName);
    if (fileExists(executablePath)) {
      return {
        appPath: candidatePath,
        executablePath,
        productName: productNameForPath(executablePath),
        source
      };
    }
  }

  return null;
}

function expectedDesktopExecutablePath(appPath: string): string {
  if (getRuntimePlatform() === "win32") {
    return path.extname(appPath).toLowerCase() === ".exe" ? appPath : path.join(appPath, WINDOWS_DESKTOP_EXECUTABLE_NAMES[0]);
  }

  return path.extname(appPath).toLowerCase() === ".app"
    ? path.join(appPath, "Contents", "MacOS", productNameForPath(appPath))
    : appPath;
}

function defaultDesktopAppCandidates(): string[] {
  if (getRuntimePlatform() === "win32") {
    return findWindowsCodexAppExecutables();
  }

  return [DEFAULT_CODEX_APP_PATH, LEGACY_CODEX_APP_PATH];
}

function platformDefaultDesktopAppPath(): string {
  return getRuntimePlatform() === "win32" ? DEFAULT_WINDOWS_CODEX_APP_PATH : DEFAULT_CODEX_APP_PATH;
}

function macosExecutableCandidates(appPath: string): string[] {
  return uniquePathEntries([
    readMacosBundleExecutable(appPath),
    productNameForPath(appPath),
    ...DESKTOP_EXECUTABLE_NAMES
  ].filter((value): value is string => Boolean(value)));
}

function readMacosBundleExecutable(appPath: string): string | null {
  try {
    const plistPath = path.join(appPath, "Contents", "Info.plist");
    const plist = fs.readFileSync(plistPath, "utf8");
    const match = plist.match(/<key>CFBundleExecutable<\/key>\s*<string>([^<]+)<\/string>/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function productNameForPath(targetPath: string): "ChatGPT" | "Codex" {
  return targetPath.toLowerCase().includes("chatgpt") ? "ChatGPT" : "Codex";
}

export function isWindowsCodexGuiExecutable(candidatePath: string): boolean {
  if (getRuntimePlatform() !== "win32") {
    return true;
  }

  const basename = path.basename(candidatePath).toLowerCase();
  if (!WINDOWS_DESKTOP_EXECUTABLE_NAMES.some((name) => name.toLowerCase() === basename)) {
    return false;
  }

  const normalized = candidatePath.replace(/\\/g, "/").toLowerCase();
  return !normalized.includes("/resources/")
    && !normalized.includes("/bin/")
    && !normalized.endsWith("/resources/codex.exe")
    && !normalized.endsWith("/resources/chatgpt.exe");
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

function findWindowsCodexAppExecutables(): string[] {
  const candidates = [
    findCommandOnPath("ChatGPT.exe"),
    findCommandOnPath("Codex.exe"),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WindowsApps", "ChatGPT.exe") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WindowsApps", "Codex.exe") : null,
    findRunningWindowsCodexAppExecutable(),
    findWindowsCodexAppxExecutable(),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "ChatGPT", "ChatGPT.exe") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "Codex", "Codex.exe") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "ChatGPT", "ChatGPT.exe") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Codex", "Codex.exe") : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, "ChatGPT", "ChatGPT.exe") : null,
    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, "Codex", "Codex.exe") : null,
    process.env["PROGRAMFILES(X86)"] ? path.join(process.env["PROGRAMFILES(X86)"], "ChatGPT", "ChatGPT.exe") : null,
    process.env["PROGRAMFILES(X86)"] ? path.join(process.env["PROGRAMFILES(X86)"], "Codex", "Codex.exe") : null
  ];
  const found: string[] = [];

  for (const candidate of candidates) {
    if (candidate && fileExists(candidate) && isWindowsCodexGuiExecutable(candidate)) {
      found.push(candidate);
    }
  }

  const roots = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"]].filter((value): value is string => Boolean(value));
  for (const root of roots) {
    for (const executableName of WINDOWS_DESKTOP_EXECUTABLE_NAMES) {
      const executablePath = findFileShallow(root, executableName, 6, isWindowsCodexGuiExecutable);
      if (executablePath && isWindowsCodexGuiExecutable(executablePath)) {
        found.push(executablePath);
      }
    }
  }

  return uniquePathEntries(found);
}

function findRunningWindowsCodexAppExecutable(): string | null {
  try {
    const output = execFileSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "(Get-Process -Name ChatGPT,Codex -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -match '(?i)\\\\(ChatGPT|Codex)\\.exe$' -and $_.Path -notmatch '(?i)\\\\(resources|bin)\\\\' } | Select-Object -First 1 -ExpandProperty Path)"
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
      "$pkg = Get-AppxPackage OpenAI.Codex,OpenAI.ChatGPT,*OpenAI*Codex*,*OpenAI*ChatGPT* -ErrorAction SilentlyContinue | Select-Object -First 1; if ($pkg) { foreach ($name in 'ChatGPT.exe','Codex.exe','app\\ChatGPT.exe','app\\Codex.exe') { $candidate = Join-Path $pkg.InstallLocation $name; if (Test-Path $candidate) { $candidate; break } } }"
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

function uniquePathEntries(entries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of entries.map((item) => item.trim()).filter(Boolean)) {
    if (seen.has(entry)) continue;
    seen.add(entry);
    result.push(entry);
  }
  return result;
}

export function slugifyProfileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "profile";
}
