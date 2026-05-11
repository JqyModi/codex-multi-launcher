import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists } from "./fs-utils.js";
import { getDefaultCodexHome } from "./paths.js";
import type { ConfigBackupInfo, ManagedProfile } from "../shared/types.js";

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

function renderManagedConfig(profile: ManagedProfile): string {
  return [
    "",
    "# --- Codex Profile Manager managed settings ---",
    "# These settings are appended so this profile can override inherited defaults.",
    renderConfig(profile).trimEnd(),
    "# --- End Codex Profile Manager managed settings ---",
    ""
  ].join("\n");
}

function stripManagedConfig(config: string): string {
  return config
    .replace(
      /\n?# --- Codex Profile Manager managed settings ---[\s\S]*?# --- End Codex Profile Manager managed settings ---\n?/g,
      "\n"
    )
    .trimEnd();
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

export async function listConfigBackups(profile: ManagedProfile): Promise<ConfigBackupInfo[]> {
  const backupRoot = path.join(profile.paths.codexHome, "profile-manager-backups");
  if (!(await pathExists(backupRoot))) {
    return [];
  }

  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const backups = await Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      const backupDir = path.join(backupRoot, entry.name);
      const manifestPath = path.join(backupDir, "manifest.json");
      const backupPath = path.join(backupDir, "config.toml");
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as { createdAt?: string; reason?: string };
        return {
          profileId: profile.id,
          backupPath,
          createdAt: manifest.createdAt ?? entry.name,
          reason: manifest.reason ?? "config backup"
        };
      } catch {
        return {
          profileId: profile.id,
          backupPath,
          createdAt: entry.name,
          reason: "config backup"
        };
      }
    }));

  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function writeCodexConfig(profile: ManagedProfile, options: { inheritDefaultConfig?: boolean; preserveExistingConfig?: boolean } = {}): Promise<string> {
  await ensureDir(profile.paths.codexHome);
  await backupCodexConfig(profile, "before profile manager config write");
  const configPath = path.join(profile.paths.codexHome, "config.toml");
  const defaultConfigPath = path.join(getDefaultCodexHome(), "config.toml");

  if (options.preserveExistingConfig && await pathExists(configPath)) {
    const existingConfig = await fs.readFile(configPath, "utf8");
    await fs.writeFile(configPath, `${stripManagedConfig(existingConfig)}${renderManagedConfig(profile)}`, { mode: 0o600 });
    return configPath;
  }

  if (options.inheritDefaultConfig && await pathExists(defaultConfigPath)) {
    const inheritedConfig = await fs.readFile(defaultConfigPath, "utf8");
    await fs.writeFile(configPath, `${stripManagedConfig(inheritedConfig)}${renderManagedConfig(profile)}`, { mode: 0o600 });
    return configPath;
  }

  await fs.writeFile(configPath, renderConfig(profile), { mode: 0o600 });
  return configPath;
}
