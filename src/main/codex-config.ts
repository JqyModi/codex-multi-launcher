import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists } from "./fs-utils.js";
import { getDefaultCodexHome, getRuntimePlatform } from "./paths.js";
import type { ConfigBackupInfo, ManagedProfile, RestoreConfigBackupResult } from "../shared/types.js";

const INHERITED_CODEX_HOME_ENTRIES = [
  "AGENTS.md",
  "instructions.md",
  "config.json",
  "mcp.json",
  "skills",
  "plugins"
];

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
      `temp_env_key = ${tomlString(profile.provider.envKeyName)}`,
      `wire_api = "responses"`,
      `requires_openai_auth = false`,
      ""
    );
  }

  return `${lines.join("\n")}`;
}

function renderRootConfig(profile: ManagedProfile): string {
  const lines = [
    ...(profile.provider.type === "third_party_responses" ? [`model_provider = ${tomlString(profile.provider.id)}`] : []),
    `model = ${tomlString(profile.provider.model)}`,
    `model_reasoning_effort = ${tomlString(profile.provider.reasoningEffort)}`
  ];
  return lines.join("\n");
}

function renderProviderConfig(profile: ManagedProfile): string {
  if (profile.provider.type !== "third_party_responses") {
    return "";
  }

  return [
    `[model_providers.${profile.provider.id}]`,
    `name = ${tomlString(profile.provider.displayName)}`,
    `base_url = ${tomlString(profile.provider.baseUrl ?? "")}`,
    `env_key = ${tomlString(profile.provider.envKeyName)}`,
    `temp_env_key = ${tomlString(profile.provider.envKeyName)}`,
    `wire_api = "responses"`,
    `requires_openai_auth = false`
  ].join("\n");
}

export async function writeCodexAuth(profile: ManagedProfile, apiKey: string): Promise<string> {
  await ensureDir(profile.paths.codexHome);
  const authPath = path.join(profile.paths.codexHome, "auth.json");
  await fs.writeFile(
    authPath,
    `${JSON.stringify({ auth_mode: "apikey", OPENAI_API_KEY: apiKey }, null, 2)}\n`,
    { mode: 0o600 }
  );
  return authPath;
}

export async function inheritDefaultCodexHomeResources(profile: ManagedProfile): Promise<void> {
  const defaultCodexHome = path.resolve(getDefaultCodexHome());
  const profileCodexHome = path.resolve(profile.paths.codexHome);

  if (defaultCodexHome === profileCodexHome || !(await pathExists(defaultCodexHome))) {
    return;
  }

  await ensureDir(profile.paths.codexHome);
  await Promise.all(INHERITED_CODEX_HOME_ENTRIES.map((entry) => copyIfExists(path.join(defaultCodexHome, entry), path.join(profileCodexHome, entry))));
}

function renderManagedConfig(profile: ManagedProfile): string {
  return [
    "",
    "# --- Codex Profile Manager managed settings ---",
    "# These settings are managed so this profile can override inherited defaults.",
    renderRootConfig(profile),
    renderProviderConfig(profile),
    "# --- End Codex Profile Manager managed settings ---",
    ""
  ].filter(Boolean).join("\n");
}

function stripManagedConfig(config: string): string {
  return config
    .replace(
      /\n?# --- Codex Profile Manager managed settings ---[\s\S]*?# --- End Codex Profile Manager managed settings ---\n?/g,
      "\n"
    )
    .trimEnd();
}

function removeInheritedRootOverrides(config: string): string {
  const rootKeys = new Set(["model", "model_provider", "model_reasoning_effort"]);
  const lines = config.split("\n");
  let inRoot = true;

  return lines
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        inRoot = false;
      }
      if (!inRoot || trimmed.startsWith("#")) {
        return true;
      }
      const key = trimmed.match(/^([A-Za-z0-9_-]+)\s*=/)?.[1];
      return !key || !rootKeys.has(key);
    })
    .join("\n")
    .trimEnd();
}

function removeProviderOverride(config: string, providerId: string): string {
  const escapedProviderId = providerId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return config
    .replace(
      new RegExp(`\\n?\\[model_providers\\.${escapedProviderId}\\]\\n[\\s\\S]*?(?=\\n\\s*\\[[^\\]]+\\]|$)`, "g"),
      "\n"
    )
    .trimEnd();
}

function mergeManagedConfig(config: string, profile: ManagedProfile): string {
  const cleanedConfig = removeProviderOverride(removeInheritedRootOverrides(stripManagedConfig(config)), profile.provider.id);
  const firstTableIndex = cleanedConfig.search(/^\s*\[[^\]]+\]/m);

  if (firstTableIndex === -1) {
    return `${cleanedConfig}${renderManagedConfig(profile)}`;
  }

  const rootConfig = cleanedConfig.slice(0, firstTableIndex).trimEnd();
  const tableConfig = cleanedConfig.slice(firstTableIndex).trimStart();
  return `${rootConfig}${renderManagedConfig(profile)}${tableConfig ? `${tableConfig}\n` : ""}`;
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
    await fs.writeFile(configPath, mergeManagedConfig(existingConfig, profile), { mode: 0o600 });
    return configPath;
  }

  if (options.inheritDefaultConfig && await pathExists(defaultConfigPath)) {
    const inheritedConfig = await fs.readFile(defaultConfigPath, "utf8");
    await fs.writeFile(configPath, mergeManagedConfig(inheritedConfig, profile), { mode: 0o600 });
    return configPath;
  }

  await fs.writeFile(configPath, renderConfig(profile), { mode: 0o600 });
  return configPath;
}

async function copyIfExists(sourcePath: string, destinationPath: string): Promise<void> {
  if (!(await pathExists(sourcePath)) || await pathExists(destinationPath)) {
    return;
  }

  await fs.cp(sourcePath, destinationPath, {
    recursive: true,
    force: false,
    errorOnExist: false,
    filter: shouldCopyInheritedPath
  });
}

async function shouldCopyInheritedPath(sourcePath: string): Promise<boolean> {
  if (shouldSkipInheritedPath(sourcePath)) {
    return false;
  }

  if (getRuntimePlatform() !== "win32") {
    return true;
  }

  try {
    const stat = await fs.lstat(sourcePath);
    return !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function shouldSkipInheritedPath(sourcePath: string): boolean {
  const basename = path.basename(sourcePath);
  if (basename === ".DS_Store" || basename === "node_modules") {
    return true;
  }

  if (getRuntimePlatform() !== "win32") {
    return false;
  }

  const normalized = sourcePath.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("/.codex/.tmp/")
    || normalized.endsWith("/.codex/.tmp")
    || normalized.includes("/.codex/plugins/cache/")
    || normalized.endsWith("/.codex/plugins/cache");
}

export async function restoreConfigBackup(profile: ManagedProfile, backupPath: string): Promise<RestoreConfigBackupResult> {
  const backupRoot = path.resolve(profile.paths.codexHome, "profile-manager-backups");
  const resolvedBackupPath = path.resolve(backupPath);
  if (!resolvedBackupPath.startsWith(`${backupRoot}${path.sep}`)) {
    throw new Error("Backup path is outside this profile's backup directory.");
  }
  if (path.basename(resolvedBackupPath) !== "config.toml") {
    throw new Error("Backup path must point to a config.toml backup.");
  }
  if (!(await pathExists(resolvedBackupPath))) {
    throw new Error("Backup config file does not exist.");
  }

  const configPath = path.join(profile.paths.codexHome, "config.toml");
  await backupCodexConfig(profile, "before restoring config backup");
  await fs.copyFile(resolvedBackupPath, configPath);

  return {
    profileId: profile.id,
    configPath,
    restoredFrom: resolvedBackupPath
  };
}
