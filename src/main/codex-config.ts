import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists } from "./fs-utils.js";
import type { ManagedProfile } from "../shared/types.js";

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function renderConfig(profile: ManagedProfile): string {
  const lines: string[] = [
    `model = ${tomlString(profile.provider.model)}`,
    `model_reasoning_effort = ${tomlString(profile.provider.reasoningEffort)}`,
    ""
  ];

  if (profile.provider.type === "third_party_responses") {
    lines.unshift(`model_provider = ${tomlString(profile.provider.id)}`);
    lines.push(
      `[model_providers.${profile.provider.id}]`,
      `name = ${tomlString(profile.provider.displayName)}`,
      `base_url = ${tomlString(profile.provider.baseUrl ?? "")}`,
      `env_key = ${tomlString(profile.provider.envKeyName)}`,
      `wire_api = "responses"`,
      ""
    );
  }

  return `${lines.join("\n")}`;
}

export async function backupCodexConfig(profile: ManagedProfile, reason: string): Promise<string | null> {
  const configPath = path.join(profile.paths.codexHome, "config.toml");
  if (!(await pathExists(configPath))) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(profile.paths.codexHome, "profile-manager-backups", timestamp);
  await ensureDir(backupDir);
  const backupPath = path.join(backupDir, "config.toml");
  await fs.copyFile(configPath, backupPath);
  await fs.writeFile(
    path.join(backupDir, "manifest.json"),
    `${JSON.stringify({ reason, source: configPath, createdAt: new Date().toISOString() }, null, 2)}\n`,
    { mode: 0o600 }
  );
  return backupPath;
}

export async function writeCodexConfig(profile: ManagedProfile): Promise<string> {
  await ensureDir(profile.paths.codexHome);
  await backupCodexConfig(profile, "before profile manager config write");
  const configPath = path.join(profile.paths.codexHome, "config.toml");
  await fs.writeFile(configPath, renderConfig(profile), { mode: 0o600 });
  return configPath;
}
