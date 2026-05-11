import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ManagedProfile, ProfileRuntimeInfo } from "../shared/types.js";

const execFileAsync = promisify(execFile);

interface ProcessRow {
  pid: number;
  command: string;
}

async function listProcesses(): Promise<ProcessRow[]> {
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
    const process = processes.find((row) => row.command.includes(`--user-data-dir=${profile.paths.userDataDir}`));
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
