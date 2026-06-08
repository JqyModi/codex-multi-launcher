import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getRuntimePlatform } from "./paths.js";
import type { ManagedProfile, ProfileRuntimeInfo } from "../shared/types.js";

const execFileAsync = promisify(execFile);

interface ProcessRow {
  pid: number;
  command: string;
}

async function listProcesses(): Promise<ProcessRow[]> {
  if (getRuntimePlatform() === "win32") {
    return listWindowsProcesses();
  }

  return listUnixProcesses();
}

async function listUnixProcesses(): Promise<ProcessRow[]> {
  const result = await execFileAsync("ps", ["axo", "pid=,command="], { maxBuffer: 1024 * 1024 * 4 });
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return {
        pid: Number(match[1]),
        command: match[2]
      };
    })
    .filter((row): row is ProcessRow => Boolean(row));
}

async function listWindowsProcesses(): Promise<ProcessRow[]> {
  const script = "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress";
  const result = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", script], { maxBuffer: 1024 * 1024 * 8 });
  if (!result.stdout.trim()) {
    return [];
  }

  const parsed = JSON.parse(result.stdout) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as { ProcessId?: unknown; CommandLine?: unknown };
      if (typeof item.ProcessId !== "number" || typeof item.CommandLine !== "string") return null;
      return {
        pid: item.ProcessId,
        command: item.CommandLine
      };
    })
    .filter((row): row is ProcessRow => Boolean(row));
}

export async function getRuntimeStatus(profiles: ManagedProfile[]): Promise<ProfileRuntimeInfo[]> {
  let processes: ProcessRow[];

  try {
    processes = await listProcesses();
  } catch (error) {
    return profiles.map((profile) => ({
      profileId: profile.id,
      status: "unknown",
      pid: null,
      detail: error instanceof Error ? error.message : "Could not inspect process list."
    }));
  }

  return profiles.map((profile) => {
    const process = processes.find((row) => matchesUserDataDir(row.command, profile.paths.userDataDir));
    if (!process) {
      return {
        profileId: profile.id,
        status: "not_running",
        pid: null,
        detail: "No process found for this profile user-data-dir."
      };
    }

    return {
      profileId: profile.id,
      status: "running",
      pid: process.pid,
      detail: "Matched a Codex process by user-data-dir."
    };
  });
}

function matchesUserDataDir(command: string, userDataDir: string): boolean {
  return command.includes(`--user-data-dir=${userDataDir}`)
    || command.includes(`--user-data-dir="${userDataDir}"`)
    || command.includes(`--user-data-dir '${userDataDir}'`)
    || command.includes(`--user-data-dir ${userDataDir}`)
    || command.includes(`--user-data-dir "${userDataDir}"`)
    || command.includes(`--user-data-dir '${userDataDir}'`);
}
