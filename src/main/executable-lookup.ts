import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { getRuntimePlatform } from "./paths.js";

const execFileAsync = promisify(execFile);

export function defaultExecutablePathEnv(): string {
  const currentPath = process.env.PATH ?? "";
  const fallbackPaths = getRuntimePlatform() === "darwin" ? macosGuiFallbackPaths() : [];
  return uniquePathEntries([...currentPath.split(path.delimiter), ...fallbackPaths]).join(path.delimiter);
}

function macosGuiFallbackPaths(): string[] {
  const home = os.homedir();
  return [
    path.join(home, ".volta", "bin"),
    path.join(home, ".local", "bin"),
    "/opt/homebrew/opt/node@22/bin",
    "/opt/homebrew/opt/node/bin",
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",
    "/usr/local/opt/node@22/bin",
    "/usr/local/opt/node/bin",
    "/usr/local/bin",
    "/usr/local/sbin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin"
  ];
}

export async function findExecutable(command: string, versionArgs: string[] = ["--version"]): Promise<{ path: string | null; version: string | null }> {
  for (const executablePath of await findExecutableCandidates(command)) {
    try {
      const versionResult = await execFileAsync(executablePath, versionArgs, { env: { ...process.env, PATH: defaultExecutablePathEnv() } });
      return {
        path: executablePath,
        version: versionResult.stdout.trim() || null
      };
    } catch {
      // Keep looking: a candidate can exist but fail to start, for example a broken Homebrew Node dylib.
    }
  }

  return { path: null, version: null };
}

async function findExecutableCandidates(command: string): Promise<string[]> {
  const candidates: string[] = [];
  const lookupCommand = getRuntimePlatform() === "win32" ? "where.exe" : "which";
  const lookupArgs = getRuntimePlatform() === "win32" ? [command] : ["-a", command];

  try {
    const lookupResult = await execFileAsync(lookupCommand, lookupArgs, { env: { ...process.env, PATH: defaultExecutablePathEnv() } });
    candidates.push(...lookupResult.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  } catch {
    // Fall through to direct path probing below.
  }

  for (const directory of defaultExecutablePathEnv().split(path.delimiter)) {
    const candidate = path.join(directory, command);
    if (await isExecutableFile(candidate)) {
      candidates.push(candidate);
    }
  }

  return uniquePathEntries(candidates);
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
