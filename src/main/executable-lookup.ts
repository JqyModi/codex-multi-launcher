import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { getRuntimePlatform } from "./paths.js";

const execFileAsync = promisify(execFile);

const MACOS_GUI_FALLBACK_PATHS = [
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  "/usr/local/sbin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin"
];

export function defaultExecutablePathEnv(): string {
  const currentPath = process.env.PATH ?? "";
  const fallbackPaths = getRuntimePlatform() === "darwin" ? MACOS_GUI_FALLBACK_PATHS : [];
  return uniquePathEntries([...currentPath.split(path.delimiter), ...fallbackPaths]).join(path.delimiter);
}

export async function findExecutable(command: string, versionArgs: string[] = ["--version"]): Promise<{ path: string | null; version: string | null }> {
  const executablePath = await findExecutablePath(command);
  if (!executablePath) {
    return { path: null, version: null };
  }

  try {
    const versionResult = await execFileAsync(executablePath, versionArgs, { env: { ...process.env, PATH: defaultExecutablePathEnv() } });
    return {
      path: executablePath,
      version: versionResult.stdout.trim() || null
    };
  } catch {
    return { path: executablePath, version: null };
  }
}

async function findExecutablePath(command: string): Promise<string | null> {
  const lookupCommand = getRuntimePlatform() === "win32" ? "where.exe" : "which";

  try {
    const lookupResult = await execFileAsync(lookupCommand, [command], { env: { ...process.env, PATH: defaultExecutablePathEnv() } });
    const executablePath = lookupResult.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (executablePath) {
      return executablePath;
    }
  } catch {
    // Fall through to direct path probing below.
  }

  for (const directory of defaultExecutablePathEnv().split(path.delimiter)) {
    const candidate = path.join(directory, command);
    if (await isExecutableFile(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function isExecutableFile(candidatePath: string): Promise<boolean> {
  try {
    await fs.access(candidatePath, fs.constants.X_OK);
    return true;
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
