import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { ensureDir, pathExists } from "./fs-utils.js";
import { getDefaultCodexHome, getRuntimePlatform } from "./paths.js";
import type { ConfigBackupInfo, ManagedProfile, RestoreConfigBackupResult, SessionHistorySyncInput, SessionHistorySyncResolvedSource, SessionHistorySyncScope } from "../shared/types.js";

const execFileAsync = promisify(execFile);

const INHERITED_CODEX_HOME_ENTRIES = [
  "AGENTS.md",
  "instructions.md",
  "config.json",
  "mcp.json",
  "skills",
  "plugins"
];

const SESSION_HISTORY_DIRECTORIES = [
  "sessions",
  "archived_sessions"
];

const SESSION_HISTORY_INDEX_FILES = [
  "session_index.jsonl",
  "history.jsonl"
];

const GLOBAL_STATE_FILE = ".codex-global-state.json";
const DESKTOP_CATALOG_DB = path.join("sqlite", "codex-dev.db");
const THREAD_STATE_DATABASE_PATHS = [
  "state_5.sqlite",
  path.join("sqlite", "state_5.sqlite")
];

const SOURCE_KIND_SQL = `
CASE
  WHEN source IN ('cli', 'vscode', 'exec', 'appServer', 'unknown') THEN source
  WHEN source LIKE '{"subagent":%' THEN 'subAgent'
  ELSE 'unknown'
END
`;

interface NodeSqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    all(): Record<string, unknown>[];
    get(): Record<string, unknown> | undefined;
  };
  close(): void;
}

interface NodeSqliteModule {
  DatabaseSync: new (databasePath: string) => NodeSqliteDatabase;
}

let nodeSqliteModulePromise: Promise<NodeSqliteModule | null> | null = null;

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

export async function syncSessionHistory(profile: ManagedProfile, historySync: SessionHistorySyncInput, resolvedSources?: SessionHistorySyncResolvedSource[]): Promise<void> {
  const defaultCodexHome = path.resolve(getDefaultCodexHome());
  const profileCodexHome = path.resolve(profile.paths.codexHome);
  const sources = resolvedSources?.length
    ? resolvedSources
    : [{ type: "default" as const, label: "Current Codex / ChatGPT", codexHome: defaultCodexHome }];

  const retainedSessionIds = new Set<string>();

  await ensureDir(profile.paths.codexHome);
  for (const source of sources) {
    const sourceCodexHome = path.resolve(source.codexHome);
    if (sourceCodexHome === profileCodexHome || !(await pathExists(sourceCodexHome))) {
      continue;
    }
    await syncSessionHistoryIfRequested(sourceCodexHome, profileCodexHome, profile.provider.id, historySync, retainedSessionIds);
  }
}

export async function repairProfileGlobalState(profile: ManagedProfile): Promise<void> {
  const statePath = path.join(profile.paths.codexHome, GLOBAL_STATE_FILE);
  if (!(await pathExists(statePath))) {
    return;
  }

  const currentState = await readJsonObject(statePath);
  const repairedState = sanitizeCodexGlobalState(currentState);
  await fs.writeFile(statePath, `${JSON.stringify(repairedState)}\n`, { mode: 0o600 });
}

async function syncSessionHistoryIfRequested(sourceCodexHome: string, profileCodexHome: string, profileProviderId: string, historySync: SessionHistorySyncInput | undefined, retainedSessionIds: Set<string>): Promise<void> {
  const legacyProjectPath = process.env.CODEX_PROFILE_MANAGER_SESSION_SYNC_PROJECT?.trim();
  const shouldSync = historySync?.enabled || Boolean(legacyProjectPath);
  if (!shouldSync) {
    return;
  }

  const syncScope = historySync?.scope ?? "projects";
  const projectPaths = await getProjectHistoryRoots(sourceCodexHome, legacyProjectPath);
  const sourceSessionIds = new Set<string>();
  const selectors: HistorySyncSelectors = {
    scope: syncScope,
    projectPaths,
    sourceTaskRoots: getTaskHistoryRoots(sourceCodexHome)
  };
  const threadReferences = await collectSourceThreadReferencesIfPossible(path.join(sourceCodexHome, "state_5.sqlite"), selectors);
  for (const threadReference of threadReferences) {
    sourceSessionIds.add(threadReference.id);
    retainedSessionIds.add(threadReference.id);
  }

  for (const entry of SESSION_HISTORY_DIRECTORIES) {
    const sourceRoot = path.join(sourceCodexHome, entry);
    if (!(await pathExists(sourceRoot))) {
      continue;
    }

    await copySessionHistoryDirectory(sourceRoot, path.join(profileCodexHome, entry), selectors, profileProviderId, sourceSessionIds);
  }
  for (const sessionId of sourceSessionIds) {
    retainedSessionIds.add(sessionId);
  }
  await copyReferencedSessionRollouts(threadReferences, sourceCodexHome, profileCodexHome, profileProviderId);

  await Promise.all(SESSION_HISTORY_INDEX_FILES.map((entry) => copyFilteredSessionIndexFile(
    path.join(sourceCodexHome, entry),
    path.join(profileCodexHome, entry),
    sourceSessionIds
  )));
  const sourceStateDb = path.join(sourceCodexHome, "state_5.sqlite");
  await Promise.all(THREAD_STATE_DATABASE_PATHS.map((entry) => syncProjectThreadStateIfPossible(
    sourceStateDb,
    path.join(profileCodexHome, entry),
    sourceCodexHome,
    profileCodexHome,
    profileProviderId,
    sourceSessionIds,
    retainedSessionIds
  )));
  await syncProjectDesktopCatalogIfPossible(sourceCodexHome, profileCodexHome, profileProviderId, retainedSessionIds);
  await syncProjectGlobalStateIfPossible(sourceCodexHome, profileCodexHome, projectPaths, syncScope, sourceSessionIds);
}

interface HistorySyncSelectors {
  scope: SessionHistorySyncScope;
  projectPaths: string[];
  sourceTaskRoots: string[];
}

interface ThreadReference {
  id: string;
  rolloutPath: string;
}

async function getProjectHistoryRoots(defaultCodexHome: string, legacyProjectPath?: string): Promise<string[]> {
  if (legacyProjectPath) {
    return [path.resolve(legacyProjectPath)];
  }

  const statePath = path.join(defaultCodexHome, GLOBAL_STATE_FILE);
  const state = await readJsonObject(statePath);
  const roots = [
    ...asStringArray(state["project-order"]),
    ...asStringArray(state["electron-saved-workspace-roots"])
  ].map((entry) => path.resolve(entry));
  return Array.from(new Set(roots));
}

function getTaskHistoryRoots(sourceCodexHome: string): string[] {
  return Array.from(new Set([
    path.join(path.dirname(getDefaultCodexHome()), "Documents", "Codex"),
    path.join(path.dirname(sourceCodexHome), "Documents", "Codex")
  ].map((entry) => path.resolve(entry))));
}

async function copySessionHistoryDirectory(sourceRoot: string, destinationRoot: string, selectors: HistorySyncSelectors, profileProviderId: string, inheritedSessionIds: Set<string>): Promise<void> {
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = path.join(destinationRoot, entry.name);

    if (entry.isDirectory()) {
      await copySessionHistoryDirectory(sourcePath, destinationPath, selectors, profileProviderId, inheritedSessionIds);
      return;
    }

    if (!entry.isFile() || path.extname(entry.name) !== ".jsonl") {
      return;
    }

    const metadata = await readSessionMetadata(sourcePath);
    if (!metadata || !shouldSyncSessionMetadata(metadata, selectors)) {
      return;
    }

    await ensureDir(path.dirname(destinationPath));
    await copySessionWithProfileProvider(sourcePath, destinationPath, profileProviderId);
    inheritedSessionIds.add(metadata.sessionId);
  }));
}

async function copySessionWithProfileProvider(sourcePath: string, destinationPath: string, profileProviderId: string): Promise<void> {
  const source = await fs.readFile(sourcePath, "utf8");
  const newlineIndex = source.indexOf("\n");
  const firstLine = newlineIndex === -1 ? source : source.slice(0, newlineIndex);
  const remainder = newlineIndex === -1 ? "" : source.slice(newlineIndex);

  try {
    const event = JSON.parse(firstLine) as {
      type?: string;
      payload?: {
        model_provider?: string;
      };
    };

    if (event.type === "session_meta" && event.payload) {
      event.payload.model_provider = profileProviderId;
      await fs.writeFile(destinationPath, `${JSON.stringify(event)}${remainder}`, { mode: 0o600 });
      return;
    }
  } catch {
    // Fall back to a byte-for-byte copy if this is not a normal rollout file.
  }

  await fs.copyFile(sourcePath, destinationPath);
}

async function readSessionMetadata(sessionPath: string): Promise<{ sessionId: string; cwd: string } | null> {
  const firstLine = await readFirstLine(sessionPath);
  if (!firstLine) {
    return null;
  }

  try {
    const event = JSON.parse(firstLine) as {
      type?: string;
      payload?: {
        session_id?: string;
        id?: string;
        cwd?: string;
      };
    };
    if (event.type !== "session_meta" || !event.payload?.cwd) {
      return null;
    }

    const sessionId = event.payload.session_id ?? event.payload.id;
    return sessionId ? { sessionId, cwd: event.payload.cwd } : null;
  } catch {
    return null;
  }
}

async function readFirstLine(filePath: string): Promise<string | null> {
  const file = await fs.open(filePath, "r");
  try {
    const chunks: Buffer[] = [];
    const buffer = Buffer.alloc(64 * 1024);
    let totalBytes = 0;

    while (totalBytes < 1024 * 1024) {
      const { bytesRead } = await file.read(buffer, 0, buffer.length, totalBytes);
      if (bytesRead === 0) {
        break;
      }

      const chunk = Buffer.from(buffer.subarray(0, bytesRead));
      const newlineIndex = chunk.indexOf(0x0a);
      if (newlineIndex !== -1) {
        chunks.push(chunk.subarray(0, newlineIndex));
        return Buffer.concat(chunks).toString("utf8");
      }

      chunks.push(chunk);
      totalBytes += bytesRead;
    }

    return chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : null;
  } finally {
    await file.close();
  }
}

function isProjectSession(cwd: string, projectPath: string): boolean {
  const normalizedCwd = path.resolve(cwd);
  return normalizedCwd === projectPath || normalizedCwd.startsWith(`${projectPath}${path.sep}`);
}

function isProjectHistorySession(cwd: string, projectPaths: string[]): boolean {
  return projectPaths.some((projectPath) => isProjectSession(cwd, projectPath));
}

function isTaskHistorySession(cwd: string, selectors: HistorySyncSelectors): boolean {
  const normalizedCwd = path.resolve(cwd);
  return selectors.sourceTaskRoots.some((sourceTaskRoot) => normalizedCwd === sourceTaskRoot
    || normalizedCwd.startsWith(`${sourceTaskRoot}${path.sep}`));
}

function shouldSyncSessionMetadata(metadata: { cwd: string }, selectors: HistorySyncSelectors): boolean {
  const isProject = isProjectHistorySession(metadata.cwd, selectors.projectPaths);
  const isTask = isTaskHistorySession(metadata.cwd, selectors);
  if (selectors.scope === "projects") {
    return isProject;
  }
  if (selectors.scope === "tasks") {
    return isTask && !isProject;
  }
  return isProject || isTask;
}

function renderHistoryWhereClause(selectors: HistorySyncSelectors, inheritedSessionIds: Set<string>): string {
  const clauses: string[] = [];
  if (inheritedSessionIds.size > 0) {
    clauses.push(`id IN (${Array.from(inheritedSessionIds).map(sqlString).join(",")})`);
  }

  if (selectors.scope === "projects" || selectors.scope === "all") {
    clauses.push(...selectors.projectPaths.map((projectPath) => cwdWhereClause(projectPath)));
  }

  if (selectors.scope === "tasks" || selectors.scope === "all") {
    clauses.push(`((${selectors.sourceTaskRoots.map(cwdWhereClause).join(" OR ")}) AND ${renderNotProjectWhereClause(selectors.projectPaths)})`);
  }

  return clauses.length > 0 ? clauses.join(" OR ") : "0";
}

async function collectSourceThreadReferencesIfPossible(sourceDb: string, selectors: HistorySyncSelectors): Promise<ThreadReference[]> {
  if (!(await pathExists(sourceDb))) {
    return [];
  }

  const historyWhere = renderHistoryWhereClause(selectors, new Set());
  const rows = await querySqliteRows(sourceDb, `SELECT id, rollout_path AS rolloutPath FROM threads WHERE ${historyWhere};`);
  return rows
    .map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      rolloutPath: typeof row.rolloutPath === "string" ? row.rolloutPath : ""
    }))
    .filter((item): item is ThreadReference => Boolean(item.id && item.rolloutPath));
}

async function copyReferencedSessionRollouts(threadReferences: ThreadReference[], defaultCodexHome: string, profileCodexHome: string, profileProviderId: string): Promise<void> {
  await Promise.all(threadReferences.map(async (threadReference) => {
    const sourcePath = threadReference.rolloutPath;
    if (!sourcePath.startsWith(`${defaultCodexHome}${path.sep}`) || !(await pathExists(sourcePath))) {
      return;
    }

    const destinationPath = path.join(profileCodexHome, path.relative(defaultCodexHome, sourcePath));
    await ensureDir(path.dirname(destinationPath));
    await copySessionWithProfileProvider(sourcePath, destinationPath, profileProviderId);
  }));
}

function cwdWhereClause(rootPath: string): string {
  const root = path.resolve(rootPath);
  return `(cwd = ${sqlString(root)} OR cwd LIKE ${sqlString(`${root}${path.sep}%`)})`;
}

function renderNotProjectWhereClause(projectPaths: string[]): string {
  if (projectPaths.length === 0) {
    return "1";
  }

  return projectPaths.map((projectPath) => `NOT ${cwdWhereClause(projectPath)}`).join(" AND ");
}

async function copyFilteredSessionIndexFile(sourcePath: string, destinationPath: string, inheritedSessionIds: Set<string>): Promise<void> {
  if (inheritedSessionIds.size === 0 || !(await pathExists(sourcePath))) {
    return;
  }

  const source = await fs.readFile(sourcePath, "utf8");
  const filteredLines = source
    .split("\n")
    .filter((line) => shouldKeepSessionIndexLine(line, inheritedSessionIds));

  if (filteredLines.length === 0) {
    return;
  }

  await ensureDir(path.dirname(destinationPath));
  const existingLines = await pathExists(destinationPath)
    ? (await fs.readFile(destinationPath, "utf8")).split("\n").filter(Boolean)
    : [];
  const mergedLines = Array.from(new Set([...existingLines, ...filteredLines]));
  await fs.writeFile(destinationPath, `${mergedLines.join("\n")}\n`, { mode: 0o600 });
}

function shouldKeepSessionIndexLine(line: string, inheritedSessionIds: Set<string>): boolean {
  if (!line.trim()) {
    return false;
  }

  try {
    const item = JSON.parse(line) as { id?: string; session_id?: string };
    const sessionId = item.session_id ?? item.id;
    return Boolean(sessionId && inheritedSessionIds.has(sessionId));
  } catch {
    return false;
  }
}

async function syncProjectThreadStateIfPossible(
  sourceDb: string,
  destinationDb: string,
  defaultCodexHome: string,
  profileCodexHome: string,
  profileProviderId: string,
  sourceSessionIds: Set<string>,
  retainedSessionIds: Set<string>
): Promise<void> {
  if (sourceSessionIds.size === 0 || retainedSessionIds.size === 0 || !(await pathExists(sourceDb))) {
    return;
  }

  await ensureDir(path.dirname(destinationDb));
  await ensureThreadStateDatabase(sourceDb, destinationDb);

  const selectedSessionIdsSql = renderSelectedSessionIdsSql(sourceSessionIds);
  const retainedSessionIdsSql = renderSelectedSessionIdsSql(retainedSessionIds);
  const sql = `
PRAGMA busy_timeout = 10000;
ATTACH DATABASE ${sqlString(sourceDb)} AS source;
CREATE TEMP TABLE selected_history_ids (id TEXT PRIMARY KEY);
${selectedSessionIdsSql}
INSERT OR IGNORE INTO _sqlx_migrations SELECT * FROM source._sqlx_migrations;
INSERT OR REPLACE INTO threads SELECT * FROM source.threads WHERE id IN (SELECT id FROM selected_history_ids);
UPDATE threads
SET rollout_path = replace(rollout_path, ${sqlString(defaultCodexHome)}, ${sqlString(profileCodexHome)}),
    model_provider = ${sqlString(profileProviderId)}
WHERE id IN (SELECT id FROM selected_history_ids);
INSERT OR REPLACE INTO thread_dynamic_tools
  SELECT * FROM source.thread_dynamic_tools
  WHERE thread_id IN (SELECT id FROM selected_history_ids);
INSERT OR REPLACE INTO thread_spawn_edges
  SELECT * FROM source.thread_spawn_edges
  WHERE parent_thread_id IN (SELECT id FROM selected_history_ids) OR child_thread_id IN (SELECT id FROM selected_history_ids);
DETACH DATABASE source;
DELETE FROM selected_history_ids;
${retainedSessionIdsSql}
DELETE FROM thread_dynamic_tools WHERE thread_id NOT IN (SELECT id FROM selected_history_ids);
DELETE FROM thread_spawn_edges WHERE parent_thread_id NOT IN (SELECT id FROM threads) AND child_thread_id NOT IN (SELECT id FROM threads);
DELETE FROM threads WHERE id NOT IN (SELECT id FROM selected_history_ids);
DROP TABLE selected_history_ids;
`;

  await runSqlite(destinationDb, sql);
}

async function ensureThreadStateDatabase(sourceDb: string, destinationDb: string): Promise<void> {
  if (await pathExists(destinationDb) && await sqliteTableExists(destinationDb, "threads")) {
    return;
  }

  await fs.rm(destinationDb, { force: true });
  await fs.copyFile(sourceDb, destinationDb);
}

async function runSqlite(databasePath: string, sql: string): Promise<void> {
  const sqlite = await loadNodeSqliteModule();
  if (sqlite) {
    const database = new sqlite.DatabaseSync(databasePath);
    try {
      database.exec(sql);
    } finally {
      database.close();
    }
    return;
  }

  await execFileAsync("sqlite3", [databasePath, sql], { maxBuffer: 1024 * 1024 * 10 });
}

async function sqliteTableExists(databasePath: string, tableName: string): Promise<boolean> {
  try {
    const row = await querySqliteOne(databasePath, `SELECT name FROM sqlite_master WHERE type='table' AND name=${sqlString(tableName)};`);
    return row?.name === tableName;
  } catch {
    return false;
  }
}

async function querySqliteRows(databasePath: string, sql: string): Promise<Record<string, unknown>[]> {
  const sqlite = await loadNodeSqliteModule();
  if (sqlite) {
    const database = new sqlite.DatabaseSync(databasePath);
    try {
      return database.prepare(sql).all();
    } finally {
      database.close();
    }
  }

  const { stdout } = await execFileAsync("sqlite3", ["-json", databasePath, sql], { maxBuffer: 1024 * 1024 * 10 });
  return stdout.trim() ? JSON.parse(stdout) as Record<string, unknown>[] : [];
}

async function querySqliteOne(databasePath: string, sql: string): Promise<Record<string, unknown> | undefined> {
  const rows = await querySqliteRows(databasePath, sql);
  return rows[0];
}

async function loadNodeSqliteModule(): Promise<NodeSqliteModule | null> {
  nodeSqliteModulePromise ??= import("node:sqlite")
    .then((module) => module as unknown as NodeSqliteModule)
    .catch(() => null);
  return nodeSqliteModulePromise;
}

function renderSelectedSessionIdsSql(sessionIds: Set<string>): string {
  if (sessionIds.size === 0) {
    return "";
  }

  return `INSERT OR IGNORE INTO selected_history_ids (id) VALUES ${Array.from(sessionIds).map((id) => `(${sqlString(id)})`).join(",")};`;
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function syncProjectDesktopCatalogIfPossible(
  defaultCodexHome: string,
  profileCodexHome: string,
  profileProviderId: string,
  retainedSessionIds: Set<string>
): Promise<void> {
  const destinationStateDb = path.join(profileCodexHome, "state_5.sqlite");
  const sourceCatalogDb = path.join(defaultCodexHome, DESKTOP_CATALOG_DB);
  const destinationCatalogDb = path.join(profileCodexHome, DESKTOP_CATALOG_DB);

  if (!(await pathExists(destinationStateDb)) || !(await pathExists(sourceCatalogDb))) {
    return;
  }

  await ensureDir(path.dirname(destinationCatalogDb));
  if (!(await pathExists(destinationCatalogDb))) {
    await fs.copyFile(sourceCatalogDb, destinationCatalogDb);
  }

  const selectedSessionIdsSql = renderSelectedSessionIdsSql(retainedSessionIds);
  const sql = `
PRAGMA busy_timeout = 10000;
ATTACH DATABASE ${sqlString(destinationStateDb)} AS state;
CREATE TEMP TABLE selected_history_ids (id TEXT PRIMARY KEY);
${selectedSessionIdsSql}
DELETE FROM local_thread_catalog;
INSERT OR IGNORE INTO local_thread_catalog_hosts (host_id, host_kind) VALUES ('local', 'local');
INSERT OR REPLACE INTO local_thread_catalog (
  host_id,
  thread_id,
  display_title,
  source_created_at,
  source_updated_at,
  cwd,
  source_kind,
  source_detail,
  model_provider,
  git_branch,
  observation_sequence,
  missing_candidate
)
SELECT
  'local',
  id,
  title,
  COALESCE(created_at_ms, created_at * 1000) / 1000.0,
  COALESCE(NULLIF(recency_at_ms, 0), updated_at_ms, updated_at * 1000) / 1000.0,
  cwd,
  ${SOURCE_KIND_SQL},
  NULL,
  ${sqlString(profileProviderId)},
  git_branch,
  1,
  0
FROM state.threads
WHERE archived = 0
  AND preview <> ''
  AND id IN (SELECT id FROM selected_history_ids);
INSERT OR REPLACE INTO local_thread_catalog_sync_state (host_id, watermark_updated_at, initial_build_complete, observation_sequence)
VALUES ('local', NULL, 1, 1);
INSERT OR REPLACE INTO local_thread_catalog_metadata (id, catalog_revision) VALUES (1, 1);
DETACH DATABASE state;
DROP TABLE selected_history_ids;
`;

  await runSqlite(destinationCatalogDb, sql);
}

async function syncProjectGlobalStateIfPossible(defaultCodexHome: string, profileCodexHome: string, projectPaths: string[], syncScope: SessionHistorySyncScope, inheritedSessionIds: Set<string>): Promise<void> {
  const sourcePath = path.join(defaultCodexHome, GLOBAL_STATE_FILE);
  const destinationPath = path.join(profileCodexHome, GLOBAL_STATE_FILE);
  if (inheritedSessionIds.size === 0 || !(await pathExists(sourcePath))) {
    return;
  }

  const sourceState = await readJsonObject(sourcePath);
  const destinationState = await readJsonObject(destinationPath);
  const mergedState = mergeProjectGlobalState(sourceState, destinationState, projectPaths, syncScope, inheritedSessionIds);

  await ensureDir(path.dirname(destinationPath));
  await fs.writeFile(destinationPath, `${JSON.stringify(mergedState)}\n`, { mode: 0o600 });
}

async function readJsonObject(filePath: string): Promise<Record<string, unknown>> {
  if (!(await pathExists(filePath))) {
    return {};
  }

  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function mergeProjectGlobalState(sourceState: Record<string, unknown>, destinationState: Record<string, unknown>, projectPaths: string[], syncScope: SessionHistorySyncScope, inheritedSessionIds: Set<string>): Record<string, unknown> {
  const merged = sanitizeCodexGlobalState(destinationState);
  const shouldSyncProjectShells = syncScope !== "tasks";
  if (shouldSyncProjectShells) {
    mergeStringArrayProjects(merged, sourceState, "electron-saved-workspace-roots", projectPaths);
    mergeStringArrayProjects(merged, sourceState, "project-order", projectPaths);
    mergeStringArrayProjects(merged, sourceState, "active-workspace-roots", projectPaths);
  } else {
    delete merged["electron-saved-workspace-roots"];
    delete merged["project-order"];
    delete merged["active-workspace-roots"];
  }

  const sourceHints = asStringRecord(sourceState["thread-workspace-root-hints"]);
  const destinationHints = asStringRecord(merged["thread-workspace-root-hints"]);
  for (const sessionId of inheritedSessionIds) {
    const hint = sourceHints[sessionId];
    if (hint && isSafeGlobalWorkspaceRoot(hint)) {
      destinationHints[sessionId] = hint;
    }
  }
  if (Object.keys(destinationHints).length > 0) {
    merged["thread-workspace-root-hints"] = destinationHints;
  }

  const destinationPersisted = asObject(merged["electron-persisted-atom-state"]);
  if (shouldSyncProjectShells) {
    const sourcePersisted = asObject(sourceState["electron-persisted-atom-state"]);
    for (const projectPath of projectPaths) {
      const projectExpandedKey = `sidebar-project-expanded-v1-codex:${projectPath}`;
      if (projectExpandedKey in sourcePersisted) {
        destinationPersisted[projectExpandedKey] = sourcePersisted[projectExpandedKey];
      }
    }
    if ("flat-project-sidebar-preferences-v1" in sourcePersisted) {
      destinationPersisted["flat-project-sidebar-preferences-v1"] = sourcePersisted["flat-project-sidebar-preferences-v1"];
    }
  } else {
    for (const key of Object.keys(destinationPersisted)) {
      if (key.startsWith("sidebar-project-expanded-v1-codex:")) {
        delete destinationPersisted[key];
      }
    }
  }
  if (Object.keys(destinationPersisted).length > 0) {
    merged["electron-persisted-atom-state"] = destinationPersisted;
  }

  return merged;
}

function sanitizeCodexGlobalState(state: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...state };
  sanitizeStringArrayState(sanitized, "electron-saved-workspace-roots");
  sanitizeStringArrayState(sanitized, "project-order");
  sanitizeStringArrayState(sanitized, "active-workspace-roots");
  sanitizeStringRecordState(sanitized, "thread-projectless-output-directories");
  sanitizeLocalProjectsState(sanitized);

  const hints = Object.fromEntries(
    Object.entries(asStringRecord(state["thread-workspace-root-hints"]))
      .filter((entry) => isSafeGlobalWorkspaceRoot(entry[1]))
  );
  if (Object.keys(hints).length > 0) {
    sanitized["thread-workspace-root-hints"] = hints;
  } else {
    delete sanitized["thread-workspace-root-hints"];
  }

  const persisted = sanitizePersistedAtomState(asObject(state["electron-persisted-atom-state"]));
  if (Object.keys(persisted).length > 0) {
    sanitized["electron-persisted-atom-state"] = persisted;
  } else {
    delete sanitized["electron-persisted-atom-state"];
  }

  return sanitized;
}

function sanitizeStringArrayState(state: Record<string, unknown>, key: string): void {
  if (!(key in state)) {
    return;
  }

  const values = asStringArray(state[key]).filter(isSafeGlobalWorkspaceRoot);
  if (values.length > 0) {
    state[key] = values;
  } else {
    delete state[key];
  }
}

function sanitizeStringRecordState(state: Record<string, unknown>, key: string): void {
  if (!(key in state)) {
    return;
  }

  const values = Object.fromEntries(
    Object.entries(asStringRecord(state[key]))
      .filter((entry) => isSafeGlobalWorkspaceRoot(entry[1]))
  );
  if (Object.keys(values).length > 0) {
    state[key] = values;
  } else {
    delete state[key];
  }
}

function sanitizeLocalProjectsState(state: Record<string, unknown>): void {
  if (!("local-projects" in state)) {
    return;
  }

  const projects = asObject(state["local-projects"]);
  const sanitizedProjects: Record<string, unknown> = {};
  for (const [projectId, project] of Object.entries(projects)) {
    const projectObject = asObject(project);
    if (Object.keys(projectObject).length === 0) {
      continue;
    }

    if ("rootPaths" in projectObject) {
      const rootPaths = asStringArray(projectObject.rootPaths).filter(isSafeGlobalWorkspaceRoot);
      if (rootPaths.length === 0) {
        continue;
      }
      projectObject.rootPaths = rootPaths;
    }
    sanitizedProjects[projectId] = projectObject;
  }

  if (Object.keys(sanitizedProjects).length > 0) {
    state["local-projects"] = sanitizedProjects;
  } else {
    delete state["local-projects"];
  }
}

function sanitizePersistedAtomState(state: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...state };

  for (const key of Object.keys(sanitized)) {
    if (key.startsWith("sidebar-project-expanded-v1-codex:")) {
      const projectPath = key.slice("sidebar-project-expanded-v1-codex:".length);
      if (!isSafeGlobalWorkspaceRoot(projectPath)) {
        delete sanitized[key];
      }
    }
  }

  return sanitized;
}

function mergeStringArrayProjects(destination: Record<string, unknown>, source: Record<string, unknown>, key: string, projectPaths: string[]): void {
  const safeProjectPaths = projectPaths.filter(isSafeGlobalWorkspaceRoot);
  if (safeProjectPaths.length === 0) {
    return;
  }

  const values = asStringArray(destination[key]);
  const sourceValues = asStringArray(source[key])
    .filter(isSafeGlobalWorkspaceRoot)
    .filter((value) => isProjectHistorySession(value, safeProjectPaths));
  for (const value of sourceValues.length > 0 ? sourceValues : safeProjectPaths) {
    if (!values.includes(value)) {
      values.push(value);
    }
  }
  destination[key] = values;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value as Record<string, unknown> } : {};
}

function asStringRecord(value: unknown): Record<string, string> {
  const object = asObject(value);
  return Object.fromEntries(Object.entries(object).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function isSafeGlobalWorkspaceRoot(value: string): boolean {
  if (getRuntimePlatform() !== "win32") {
    return true;
  }

  const normalized = value.replace(/\\/g, "/").toLowerCase();
  return !normalized.startsWith("c:/mac/")
    && !normalized.startsWith("//mac/")
    && !normalized.startsWith("//?/unc/mac/");
}

function renderManagedConfig(profile: ManagedProfile): string {
  const body = [
    "# --- Codex Profile Manager managed settings ---",
    "# These settings are managed so this profile can override inherited defaults.",
    renderRootConfig(profile),
    renderProviderConfig(profile),
    "# --- End Codex Profile Manager managed settings ---"
  ].filter(Boolean).join("\n");
  return `\n${body}\n`;
}

function stripManagedConfig(config: string): string {
  const normalizedConfig = normalizeManagedConfigBoundaries(config);
  return normalizedConfig
    .replace(
      /\n?# --- Codex Profile Manager managed settings ---[\s\S]*?# --- End Codex Profile Manager managed settings ---\n?/g,
      "\n"
    )
    .trimEnd();
}

function normalizeManagedConfigBoundaries(config: string): string {
  return config
    .replace(/([^\n])(# --- Codex Profile Manager managed settings ---)/g, "$1\n$2")
    .replace(/(# --- End Codex Profile Manager managed settings ---)([^\n])/g, "$1\n$2");
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

function rewriteInheritedProfilePaths(config: string, profile: ManagedProfile): string {
  const defaultCodexHome = getDefaultCodexHome();
  const escapedDefaultCodexHome = escapeRegExp(defaultCodexHome);
  return normalizeProfileSpecificConfig(config
    .replace(new RegExp(`${escapedDefaultCodexHome}(?=$|/)`, "g"), profile.paths.codexHome)
    .replace(new RegExp(`${escapeRegExp(profile.paths.codexHome)}(?:-profiles/[^/]+/codex-home)+(?=$|/)`, "g"), profile.paths.codexHome), profile);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeProfileSpecificConfig(config: string, profile: ManagedProfile): string {
  const computerUseClientPath = path.join(profile.paths.codexHome, "computer-use", "Codex Computer Use.app", "Contents", "SharedSupport", "SkyComputerUseClient.app", "Contents", "MacOS", "SkyComputerUseClient");
  const computerUseServicePath = path.join(profile.paths.codexHome, "plugins", "cache", "openai-bundled", "computer-use", "1.0.1000387", "Codex Computer Use.app");
  return config
    .replace(/^notify = \[[^\n]*"turn-ended"\][ \t]*$/m, `notify = [${tomlString(computerUseClientPath)}, "turn-ended"]`)
    .replace(/^NODE_REPL_TRUSTED_CODE_PATHS = .+$/m, `NODE_REPL_TRUSTED_CODE_PATHS = ${tomlString(profile.paths.codexHome)}`)
    .replace(/^CODEX_HOME = .+$/m, `CODEX_HOME = ${tomlString(profile.paths.codexHome)}`)
    .replace(/^SKY_CUA_SERVICE_PATH = .+$/m, `SKY_CUA_SERVICE_PATH = ${tomlString(computerUseServicePath)}`);
}

function mergeManagedConfig(config: string, profile: ManagedProfile): string {
  const cleanedConfig = rewriteInheritedProfilePaths(removeProviderOverride(removeInheritedRootOverrides(stripManagedConfig(config)), profile.provider.id), profile);
  const firstTableIndex = cleanedConfig.search(/^\s*\[[^\]]+\]/m);
  const managedConfig = renderManagedConfig(profile).trim();

  if (firstTableIndex === -1) {
    const rootConfig = cleanedConfig.trimEnd();
    return rootConfig ? `${rootConfig}\n\n${managedConfig}\n` : `${managedConfig}\n`;
  }

  const rootConfig = cleanedConfig.slice(0, firstTableIndex).trimEnd();
  const tableConfig = cleanedConfig.slice(firstTableIndex).trimStart();
  return [
    rootConfig,
    managedConfig,
    tableConfig.trimEnd()
  ].filter(Boolean).join("\n\n") + "\n";
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
