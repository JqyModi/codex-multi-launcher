import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-manager-win-session-"));
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;
process.env.CODEX_PROFILE_MANAGER_PLATFORM_OVERRIDE = "win32";

const defaultCodexHome = path.join(testRoot, ".codex");
const projectPath = path.join(testRoot, "Projects", "OpenFaka");
const taskPath = path.join(testRoot, "Documents", "Codex", "2026-07-15", "hello-task");
const projectThreadId = "019f-win-project-thread";
const taskThreadId = "019f-win-task-thread";
const projectRolloutPath = path.join(defaultCodexHome, "sessions", "2026", "07", "15", `rollout-2026-07-15T10-00-00-${projectThreadId}.jsonl`);
const taskRolloutPath = path.join(defaultCodexHome, "sessions", "2026", "07", "15", `rollout-2026-07-15T10-05-00-${taskThreadId}.jsonl`);

await Promise.all([
  fs.mkdir(path.dirname(projectRolloutPath), { recursive: true }),
  fs.mkdir(projectPath, { recursive: true }),
  fs.mkdir(taskPath, { recursive: true }),
  fs.mkdir(path.join(defaultCodexHome, "sqlite"), { recursive: true })
]);
await fs.writeFile(path.join(defaultCodexHome, "config.toml"), 'model = "gpt-5.5"\n', { mode: 0o600 });
await fs.writeFile(projectRolloutPath, `${JSON.stringify(sessionMeta(projectThreadId, projectPath))}\n{"type":"event_msg","payload":{"message":"project history"}}\n`, { mode: 0o600 });
await fs.writeFile(taskRolloutPath, `${JSON.stringify(sessionMeta(taskThreadId, taskPath))}\n{"type":"event_msg","payload":{"message":"task history"}}\n`, { mode: 0o600 });
await fs.writeFile(
  path.join(defaultCodexHome, ".codex-global-state.json"),
  `${JSON.stringify({
    "electron-saved-workspace-roots": [projectPath],
    "project-order": [projectPath],
    "thread-workspace-root-hints": {
      [projectThreadId]: projectPath
    }
  })}\n`,
  { mode: 0o600 }
);

createStateDatabase(path.join(defaultCodexHome, "state_5.sqlite"));
createCatalogDatabase(path.join(defaultCodexHome, "sqlite", "codex-dev.db"));

const { createProfile, permanentlyDeleteProfile } = await import("../dist-electron/main/profile-service.js");

const result = await createProfile({
  name: "Windows Session Sync",
  inheritDefaultConfig: true,
  syncHistory: {
    enabled: true,
    scope: "all"
  },
  codexAppPath: "C:\\Users\\Tester\\AppData\\Local\\Programs\\ChatGPT\\ChatGPT.exe",
  provider: {
    type: "third_party_responses",
    displayName: "Windows Sync Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: "sk-test-windows-session-sync",
    reasoningEffort: "medium"
  }
});

try {
  const profileHome = result.profile.paths.codexHome;
  const stateRows = queryRows(path.join(profileHome, "state_5.sqlite"), "SELECT id, rollout_path AS rolloutPath, model_provider AS modelProvider, cwd FROM threads ORDER BY id;");
  const catalogRows = queryRows(path.join(profileHome, "sqlite", "codex-dev.db"), "SELECT thread_id AS threadId, model_provider AS modelProvider, source_kind AS sourceKind FROM local_thread_catalog ORDER BY thread_id;");
  const copiedProjectRolloutPath = path.join(profileHome, path.relative(defaultCodexHome, projectRolloutPath));
  const copiedProjectRollout = await fs.readFile(copiedProjectRolloutPath, "utf8");
  const copiedProjectMeta = JSON.parse(copiedProjectRollout.split("\n")[0]);

  assert(stateRows.length === 2, "Windows session sync should migrate project and task threads");
  assert(stateRows.every((row) => row.modelProvider === "proxy"), "Windows state rows should be rewritten to proxy provider");
  assert(stateRows.every((row) => typeof row.rolloutPath === "string" && row.rolloutPath.startsWith(profileHome)), "Windows rollout paths should point into the profile home");
  assert(catalogRows.length === 2, "Windows catalog should contain migrated visible threads");
  assert(catalogRows.every((row) => row.modelProvider === "proxy"), "Windows catalog rows should use proxy provider");
  assert(catalogRows.every((row) => row.sourceKind === "vscode"), "Windows catalog rows should derive source_kind from threads.source");
  assert(copiedProjectMeta.payload.model_provider === "proxy", "Windows copied rollout metadata should use proxy provider");
  assert(copiedProjectMeta.payload.cwd === projectPath, "Windows copied rollout should preserve cwd");
  assert(await exists(path.join(profileHome, "sqlite", "state_5.sqlite")), "Windows sync should create secondary state database");

  console.log("Windows session history sync verification passed.");
} finally {
  await permanentlyDeleteProfile(result.profile.id);
  await fs.rm(testRoot, { force: true, recursive: true });
}

function sessionMeta(id, cwd) {
  return {
    timestamp: "2026-07-15T02:00:00.000Z",
    type: "session_meta",
    payload: {
      id,
      session_id: id,
      cwd,
      model_provider: "codex_local_access",
      source: "vscode"
    }
  };
}

function createStateDatabase(databasePath) {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(`
CREATE TABLE _sqlx_migrations (version INTEGER PRIMARY KEY, description TEXT NOT NULL, installed_on TEXT NOT NULL, success BOOLEAN NOT NULL, checksum BLOB NOT NULL, execution_time INTEGER NOT NULL);
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  rollout_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  cwd TEXT NOT NULL,
  title TEXT NOT NULL,
  sandbox_policy TEXT NOT NULL,
  approval_mode TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  has_user_event INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER,
  git_sha TEXT,
  git_branch TEXT,
  git_origin_url TEXT,
  cli_version TEXT NOT NULL DEFAULT '',
  first_user_message TEXT NOT NULL DEFAULT '',
  agent_nickname TEXT,
  agent_role TEXT,
  memory_mode TEXT NOT NULL DEFAULT 'enabled',
  model TEXT,
  reasoning_effort TEXT,
  agent_path TEXT,
  created_at_ms INTEGER,
  updated_at_ms INTEGER,
  thread_source TEXT,
  preview TEXT NOT NULL DEFAULT '',
  recency_at INTEGER NOT NULL DEFAULT 0,
  recency_at_ms INTEGER NOT NULL DEFAULT 0,
  history_mode TEXT NOT NULL DEFAULT 'legacy'
);
CREATE TABLE thread_dynamic_tools (thread_id TEXT NOT NULL, tool_name TEXT NOT NULL, PRIMARY KEY(thread_id, tool_name));
CREATE TABLE thread_spawn_edges (parent_thread_id TEXT NOT NULL, child_thread_id TEXT NOT NULL, PRIMARY KEY(parent_thread_id, child_thread_id));
`);
    insertThread(database, projectThreadId, projectRolloutPath, projectPath, "Project history");
    insertThread(database, taskThreadId, taskRolloutPath, taskPath, "Task history");
  } finally {
    database.close();
  }
}

function insertThread(database, id, rolloutPath, cwd, title) {
  database.prepare(`
INSERT INTO threads (
  id, rollout_path, created_at, updated_at, source, model_provider, cwd, title, sandbox_policy, approval_mode,
  tokens_used, has_user_event, archived, cli_version, first_user_message, memory_mode, preview, recency_at, history_mode
) VALUES (?, ?, 1784109600, 1784109600, 'vscode', 'codex_local_access', ?, ?, 'workspace-write', 'never',
  0, 1, 0, '0.0.0', 'hello', 'enabled', ?, 1784109600, 'legacy'
);
`).run(id, rolloutPath, cwd, title, title);
}

function createCatalogDatabase(databasePath) {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(`
CREATE TABLE local_thread_catalog_hosts (host_id TEXT PRIMARY KEY, host_kind TEXT NOT NULL);
CREATE TABLE local_thread_catalog (
  host_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  display_title TEXT NOT NULL,
  source_created_at REAL NOT NULL,
  source_updated_at REAL NOT NULL,
  cwd TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_detail TEXT,
  model_provider TEXT NOT NULL,
  git_branch TEXT,
  observation_sequence INTEGER NOT NULL,
  missing_candidate INTEGER NOT NULL,
  PRIMARY KEY(host_id, thread_id)
);
CREATE TABLE local_thread_catalog_sync_state (host_id TEXT PRIMARY KEY, watermark_updated_at REAL, initial_build_complete INTEGER NOT NULL, observation_sequence INTEGER NOT NULL);
CREATE TABLE local_thread_catalog_metadata (id INTEGER PRIMARY KEY, catalog_revision INTEGER NOT NULL);
`);
  } finally {
    database.close();
  }
}

function queryRows(databasePath, sql) {
  const database = new DatabaseSync(databasePath);
  try {
    return database.prepare(sql).all();
  } finally {
    database.close();
  }
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
