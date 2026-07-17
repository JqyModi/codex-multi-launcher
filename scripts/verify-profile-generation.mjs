import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-profile-manager-"));
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;
await fs.mkdir(path.join(testRoot, ".codex"), { recursive: true });
await fs.writeFile(
  path.join(testRoot, ".codex", "config.toml"),
  [
    'model = "gpt-5.5"',
    `notify = ["${path.join(testRoot, ".codex", "computer-use", "Codex Computer Use.app", "Contents", "SharedSupport", "SkyComputerUseClient.app", "Contents", "MacOS", "SkyComputerUseClient")}", "turn-ended"]`,
    "",
    "[mcp_servers.example]",
    'command = "node"',
    'args = ["server.js"]',
    "",
    "[mcp_servers.node_repl.env]",
    `NODE_REPL_TRUSTED_CODE_PATHS = "${path.join(testRoot, ".codex")}"`,
    `CODEX_HOME = "${path.join(testRoot, ".codex")}"`,
    `SKY_CUA_SERVICE_PATH = "${path.join(testRoot, ".codex", "plugins", "cache", "openai-bundled", "computer-use", "1.0.1000387", "Codex Computer Use.app")}"`,
    "",
    "[features]",
    "multi_agent = true",
    ""
  ].join("\n"),
  { mode: 0o600 }
);
await fs.mkdir(path.join(testRoot, ".codex", "skills", "sample-skill"), { recursive: true });
await fs.writeFile(path.join(testRoot, ".codex", "skills", "sample-skill", "SKILL.md"), "# Sample skill\n", { mode: 0o600 });
await fs.mkdir(path.join(testRoot, ".codex", "plugins", "sample-plugin", ".codex-plugin"), { recursive: true });
await fs.writeFile(path.join(testRoot, ".codex", "plugins", "sample-plugin", ".codex-plugin", "plugin.json"), "{\"name\":\"sample-plugin\"}\n", { mode: 0o600 });
await fs.writeFile(path.join(testRoot, ".codex", "AGENTS.md"), "Default instructions\n", { mode: 0o600 });
const syncedProjectPath = path.join(testRoot, "Projects", "SyncedProject");
const otherProjectPath = path.join(testRoot, "Projects", "OtherProject");
const syncedSessionId = "019f-test-synced-session";
const otherSessionId = "019f-test-other-session";
const sourceProfileProjectPath = path.join(testRoot, "Projects", "SourceProfileProject");
const sourceProfileSessionId = "019f-test-source-profile-session";
const sourceProfileTaskPath = path.join(testRoot, ".codex-profiles", "source-history", "Documents", "Codex", "2026-07-16", "quick-task");
const sourceProfileTaskSessionId = "019f-test-source-profile-task-session";
const syncedSessionPath = path.join(testRoot, ".codex", "sessions", "2026", "07", "15", `rollout-2026-07-15T10-00-00-${syncedSessionId}.jsonl`);
const otherSessionPath = path.join(testRoot, ".codex", "sessions", "2026", "07", "15", `rollout-2026-07-15T11-00-00-${otherSessionId}.jsonl`);
const archivedSessionPath = path.join(testRoot, ".codex", "archived_sessions", `rollout-2026-07-15T12-00-00-${syncedSessionId}.jsonl`);
await Promise.all([
  fs.mkdir(path.dirname(syncedSessionPath), { recursive: true }),
    fs.mkdir(path.dirname(archivedSessionPath), { recursive: true }),
    fs.mkdir(syncedProjectPath, { recursive: true }),
    fs.mkdir(otherProjectPath, { recursive: true }),
    fs.mkdir(sourceProfileProjectPath, { recursive: true }),
    fs.mkdir(sourceProfileTaskPath, { recursive: true })
  ]);
await fs.writeFile(syncedSessionPath, `${JSON.stringify({
  timestamp: "2026-07-15T02:00:00.000Z",
  type: "session_meta",
  payload: {
    session_id: syncedSessionId,
    id: syncedSessionId,
    cwd: syncedProjectPath
  }
})}\n{"type":"event_msg","payload":{"message":"synced project history"}}\n`, { mode: 0o600 });
await fs.writeFile(otherSessionPath, `${JSON.stringify({
  timestamp: "2026-07-15T03:00:00.000Z",
  type: "session_meta",
  payload: {
    session_id: otherSessionId,
    id: otherSessionId,
    cwd: otherProjectPath
  }
})}\n{"type":"event_msg","payload":{"message":"other project history"}}\n`, { mode: 0o600 });
await fs.writeFile(archivedSessionPath, `${JSON.stringify({
  timestamp: "2026-07-15T04:00:00.000Z",
  type: "session_meta",
  payload: {
    id: syncedSessionId,
    cwd: path.join(syncedProjectPath, "subdir")
  }
})}\n{"type":"event_msg","payload":{"message":"archived synced project history"}}\n`, { mode: 0o600 });
await fs.writeFile(
  path.join(testRoot, ".codex", "session_index.jsonl"),
  [
    JSON.stringify({ id: syncedSessionId, thread_name: "Synced project history", updated_at: "2026-07-15T02:00:00.000Z" }),
    JSON.stringify({ id: otherSessionId, thread_name: "Other project history", updated_at: "2026-07-15T03:00:00.000Z" }),
    ""
  ].join("\n"),
  { mode: 0o600 }
);
await fs.writeFile(
  path.join(testRoot, ".codex", "history.jsonl"),
  [
    JSON.stringify({ session_id: syncedSessionId, ts: 1784109600, text: "synced prompt" }),
    JSON.stringify({ session_id: otherSessionId, ts: 1784113200, text: "other prompt" }),
    ""
  ].join("\n"),
  { mode: 0o600 }
);
await fs.writeFile(
  path.join(testRoot, ".codex", ".codex-global-state.json"),
  `${JSON.stringify({
    "electron-saved-workspace-roots": [syncedProjectPath],
    "project-order": [syncedProjectPath],
    "thread-workspace-root-hints": {
      [syncedSessionId]: syncedProjectPath
    }
  })}\n`,
  { mode: 0o600 }
);

const { createProfile, deleteProfile, listConfigBackups, listProfiles, permanentlyDeleteProfile, restoreConfigBackup, restoreProfile, updateProfile } = await import("../dist-electron/main/profile-service.js");
const { repairProfileGlobalState } = await import("../dist-electron/main/codex-config.js");
const { getAppPaths } = await import("../dist-electron/main/paths.js");
const { getApiKey } = await import("../dist-electron/main/secrets.js");
const { getDiagnosticsReport } = await import("../dist-electron/main/diagnostics.js");
const { extractModelOptions } = await import("../dist-electron/main/provider-test.js");

assertExtractedModels(
  {
    object: "list",
    data: [
      {
        id: "gpt-5.2",
        object: "model",
        display_name: "GPT-5.2"
      }
    ]
  },
  ["gpt-5.2"],
  "OpenAI-style /models response should parse data[].id"
);
assertExtractedModels({ results: [{ id: "proxy-model" }] }, ["proxy-model"], "results[].id should parse as models");
assertExtractedModels({ list: [{ id: "listed-model" }] }, ["listed-model"], "list[].id should parse as models");
assertExtractedModels({ "data/list/results": [{ id: "slash-key-model" }] }, ["slash-key-model"], "slash-key array response should parse as models");
assertExtractedModels({ nested: { data: [{ id: "deep-model" }, { id: 123 }] } }, ["deep-model"], "nested model arrays should parse string ids only");
assertExtractedModels({ data: [{ name: "missing-id" }] }, [], "responses without id strings should not produce models");

const fakeKey = "sk-test-verify-profile-generation";
const sourceProfileResult = await createProfile({
  name: "Source History",
  inheritDefaultConfig: false,
  provider: {
    type: "third_party_responses",
    displayName: "Source Proxy",
    baseUrl: "https://source.example.com/v1",
    model: "gpt-5.2",
    apiKey: "sk-test-source-profile",
    reasoningEffort: "medium"
  }
});
const sourceProfileSessionPath = path.join(sourceProfileResult.profile.paths.codexHome, "sessions", "2026", "07", "16", `rollout-2026-07-16T10-00-00-${sourceProfileSessionId}.jsonl`);
const sourceProfileTaskSessionPath = path.join(sourceProfileResult.profile.paths.codexHome, "sessions", "2026", "07", "16", `rollout-2026-07-16T11-00-00-${sourceProfileTaskSessionId}.jsonl`);
await fs.mkdir(path.dirname(sourceProfileSessionPath), { recursive: true });
await fs.writeFile(sourceProfileSessionPath, `${JSON.stringify({
  timestamp: "2026-07-16T02:00:00.000Z",
  type: "session_meta",
  payload: {
    session_id: sourceProfileSessionId,
    id: sourceProfileSessionId,
    cwd: sourceProfileProjectPath
  }
})}\n{"type":"event_msg","payload":{"message":"source profile project history"}}\n`, { mode: 0o600 });
await fs.writeFile(sourceProfileTaskSessionPath, `${JSON.stringify({
  timestamp: "2026-07-16T03:00:00.000Z",
  type: "session_meta",
  payload: {
    session_id: sourceProfileTaskSessionId,
    id: sourceProfileTaskSessionId,
    cwd: sourceProfileTaskPath
  }
})}\n{"type":"event_msg","payload":{"message":"source profile task history"}}\n`, { mode: 0o600 });
await fs.writeFile(
  path.join(sourceProfileResult.profile.paths.codexHome, "session_index.jsonl"),
  [
    JSON.stringify({ id: sourceProfileSessionId, thread_name: "Source profile project history", updated_at: "2026-07-16T02:00:00.000Z" }),
    JSON.stringify({ id: sourceProfileTaskSessionId, thread_name: "Source profile task history", updated_at: "2026-07-16T03:00:00.000Z" }),
    ""
  ].join("\n"),
  { mode: 0o600 }
);
await fs.writeFile(
  path.join(sourceProfileResult.profile.paths.codexHome, "history.jsonl"),
  [
    JSON.stringify({ session_id: sourceProfileSessionId, ts: 1784196000, text: "source profile prompt" }),
    JSON.stringify({ session_id: sourceProfileTaskSessionId, ts: 1784199600, text: "source profile task prompt" }),
    ""
  ].join("\n"),
  { mode: 0o600 }
);
await fs.writeFile(
  path.join(sourceProfileResult.profile.paths.codexHome, ".codex-global-state.json"),
  `${JSON.stringify({
    "chatgpt-migration-announcement-completed-v1": true,
    "local-projects": {
      "local-source-project": {
        id: "local-source-project",
        name: "Source Project",
        rootPaths: [sourceProfileProjectPath],
        createdAt: 1784196000000,
        updatedAt: 1784196000000
      }
    },
    "selected-project": {
      type: "local",
      projectId: "local-source-project"
    },
    "projectless-thread-ids": [sourceProfileTaskSessionId],
    "electron-saved-workspace-roots": [sourceProfileProjectPath],
    "project-order": [sourceProfileProjectPath],
    "thread-workspace-root-hints": {
      [sourceProfileSessionId]: sourceProfileProjectPath
    },
    "electron-persisted-atom-state": {
      "chatgpt-migration-announcement-completed-v1": true,
      "electron:onboarding-welcome-pending": false,
      "unread-thread-ids-by-host-v1": {
        local: [sourceProfileTaskSessionId]
      },
      [`sidebar-project-expanded-v1-codex:${sourceProfileProjectPath}`]: true
    }
  })}\n`,
  { mode: 0o600 }
);
await repairProfileGlobalState(sourceProfileResult.profile);
const repairedSourceGlobalState = JSON.parse(await fs.readFile(path.join(sourceProfileResult.profile.paths.codexHome, ".codex-global-state.json"), "utf8"));
assert(repairedSourceGlobalState["chatgpt-migration-announcement-completed-v1"] === true, "global state repair should preserve ChatGPT migration completion flags");
assert(repairedSourceGlobalState["local-projects"]?.["local-source-project"]?.rootPaths?.[0] === sourceProfileProjectPath, "global state repair should preserve Codex local project metadata");
assert(repairedSourceGlobalState["selected-project"]?.projectId === "local-source-project", "global state repair should preserve selected project state");
assert(repairedSourceGlobalState["projectless-thread-ids"]?.includes(sourceProfileTaskSessionId), "global state repair should preserve projectless thread state");
assert(repairedSourceGlobalState["electron-persisted-atom-state"]?.["chatgpt-migration-announcement-completed-v1"] === true, "global state repair should preserve persisted ChatGPT migration flags");
assert(repairedSourceGlobalState["electron-persisted-atom-state"]?.["electron:onboarding-welcome-pending"] === false, "global state repair should preserve onboarding flags");

const taskOnlyResult = await createProfile({
  name: "Task Only Sync",
  inheritDefaultConfig: false,
  syncHistory: {
    enabled: true,
    scope: "tasks",
    sources: [
      { type: "profile", profileId: sourceProfileResult.profile.id }
    ]
  },
  provider: {
    type: "third_party_responses",
    displayName: "Task Proxy",
    baseUrl: "https://task.example.com/v1",
    model: "gpt-5.2",
    apiKey: "sk-test-task-only",
    reasoningEffort: "medium"
  }
});
const taskOnlyGlobalStatePath = path.join(taskOnlyResult.profile.paths.codexHome, ".codex-global-state.json");
const taskOnlySessionPath = path.join(taskOnlyResult.profile.paths.codexHome, "sessions", "2026", "07", "16", path.basename(sourceProfileTaskSessionPath));
const taskOnlyProjectSessionPath = path.join(taskOnlyResult.profile.paths.codexHome, "sessions", "2026", "07", "16", path.basename(sourceProfileSessionPath));
const [taskOnlyGlobalStateRaw, taskOnlySessionRaw, taskOnlyIndexRaw, taskOnlyHistoryRaw] = await Promise.all([
  fs.readFile(taskOnlyGlobalStatePath, "utf8"),
  fs.readFile(taskOnlySessionPath, "utf8"),
  fs.readFile(path.join(taskOnlyResult.profile.paths.codexHome, "session_index.jsonl"), "utf8"),
  fs.readFile(path.join(taskOnlyResult.profile.paths.codexHome, "history.jsonl"), "utf8")
]);
const taskOnlyGlobalState = JSON.parse(taskOnlyGlobalStateRaw);
assert(!("electron-saved-workspace-roots" in taskOnlyGlobalState), "task-only sync should not create project workspace roots");
assert(!("project-order" in taskOnlyGlobalState), "task-only sync should not create project ordering");
assert(!("active-workspace-roots" in taskOnlyGlobalState), "task-only sync should not create active project roots");
assert(!taskOnlyGlobalStateRaw.includes(sourceProfileProjectPath), "task-only sync should not keep source project roots in global state");
assert(taskOnlySessionRaw.includes("source profile task history"), "task-only sync should copy task session history");
assert(taskOnlyIndexRaw.includes("Source profile task history"), "task-only sync should copy task session index rows");
assert(taskOnlyHistoryRaw.includes("source profile task prompt"), "task-only sync should copy task prompt history");
assert(!(await fileExists(taskOnlyProjectSessionPath)), "task-only sync should not copy project session history");
await permanentlyDeleteProfile(taskOnlyResult.profile.id);
const result = await createProfile({
  name: "E2E Sandbox",
  inheritDefaultConfig: true,
  syncHistory: {
    enabled: true,
    scope: "projects",
    sources: [
      { type: "default" },
      { type: "profile", profileId: sourceProfileResult.profile.id }
    ]
  },
  provider: {
    type: "third_party_responses",
    displayName: "E2E Proxy",
    baseUrl: "https://proxy.example.com/v1",
    model: "gpt-5.2",
    apiKey: fakeKey,
    reasoningEffort: "medium"
  }
});

const appPaths = getAppPaths();
const profiles = await listProfiles();

assert(profiles.length === 2, "expected source and target profiles in registry");
assert(result.profile.id === "e2e-sandbox", "expected stable slug profile id");

const configPath = path.join(result.profile.paths.codexHome, "config.toml");
const authPath = path.join(result.profile.paths.codexHome, "auth.json");
const launcherContents = path.join(result.profile.paths.launcherPath, "Contents");
const launcherInfoPlist = path.join(launcherContents, "Info.plist");
const launcherMacosDir = path.join(launcherContents, "MacOS");
const launcherResourcesDir = path.join(launcherContents, "Resources");
const launcherIconPath = path.join(launcherResourcesDir, "profile-icon.icns");
const launcherScript = path.join(result.profile.paths.launcherPath, "Contents", "MacOS", "launcher");
const inheritedSkillPath = path.join(result.profile.paths.codexHome, "skills", "sample-skill", "SKILL.md");
const inheritedPluginManifestPath = path.join(result.profile.paths.codexHome, "plugins", "sample-plugin", ".codex-plugin", "plugin.json");
const inheritedAgentsPath = path.join(result.profile.paths.codexHome, "AGENTS.md");
const inheritedSyncedSessionPath = path.join(result.profile.paths.codexHome, "sessions", "2026", "07", "15", path.basename(syncedSessionPath));
const inheritedOtherSessionPath = path.join(result.profile.paths.codexHome, "sessions", "2026", "07", "15", path.basename(otherSessionPath));
const inheritedArchivedSessionPath = path.join(result.profile.paths.codexHome, "archived_sessions", path.basename(archivedSessionPath));
const inheritedSourceProfileSessionPath = path.join(result.profile.paths.codexHome, "sessions", "2026", "07", "16", path.basename(sourceProfileSessionPath));
const inheritedSessionIndexPath = path.join(result.profile.paths.codexHome, "session_index.jsonl");
const inheritedHistoryPath = path.join(result.profile.paths.codexHome, "history.jsonl");

const [registryRaw, secretsRaw, configRaw, authRaw, launcherPlistRaw, launcherRaw, launcherStat, launcherContentsStat, launcherMacosStat, launcherResourcesStat, launcherIconStat, inheritedSkillRaw, inheritedPluginRaw, inheritedAgentsRaw, inheritedSyncedSessionRaw, inheritedArchivedSessionRaw, inheritedSourceProfileSessionRaw, inheritedSessionIndexRaw, inheritedHistoryRaw] = await Promise.all([
  fs.readFile(appPaths.profilesFile, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8"),
  fs.readFile(configPath, "utf8"),
  fs.readFile(authPath, "utf8"),
  fs.readFile(launcherInfoPlist, "utf8"),
  fs.readFile(launcherScript, "utf8"),
  fs.stat(launcherScript),
  fs.stat(launcherContents),
  fs.stat(launcherMacosDir),
  fs.stat(launcherResourcesDir),
  fs.stat(launcherIconPath),
  fs.readFile(inheritedSkillPath, "utf8"),
  fs.readFile(inheritedPluginManifestPath, "utf8"),
  fs.readFile(inheritedAgentsPath, "utf8"),
  fs.readFile(inheritedSyncedSessionPath, "utf8"),
  fs.readFile(inheritedArchivedSessionPath, "utf8"),
  fs.readFile(inheritedSourceProfileSessionPath, "utf8"),
  fs.readFile(inheritedSessionIndexPath, "utf8"),
  fs.readFile(inheritedHistoryPath, "utf8")
]);

assert(registryRaw.includes("E2E Sandbox"), "registry should contain profile name");
assert(registryRaw.includes("Source History"), "registry should contain source profile name");
assert(result.profile.appearance.iconBackgroundColor === "#34C759", "profile should default to the standard identity color");
assert(registryRaw.includes('"iconBackgroundColor": "#34C759"'), "registry should persist profile appearance color");
assert(configRaw.includes('model_provider = "proxy"'), "config should select proxy provider");
assert(configRaw.includes('wire_api = "responses"'), "config should use responses API");
assert(configRaw.includes('requires_openai_auth = false'), "third-party provider should not require OpenAI auth");
assert(configRaw.includes("CODEX_PROFILE_E2E_SANDBOX_API_KEY"), "config should reference generated env key");
assert(configRaw.includes('temp_env_key = "CODEX_PROFILE_E2E_SANDBOX_API_KEY"'), "config should include Codex temp env key");
assert((configRaw.match(/\[model_providers\.proxy\]/g) ?? []).length === 1, "config should contain one proxy provider table");
assert(configRaw.includes("[mcp_servers.example]"), "config should inherit default MCP server settings");
assert(configRaw.includes(`CODEX_HOME = "${result.profile.paths.codexHome}"`), "config should rewrite inherited CODEX_HOME to the profile home");
assert(configRaw.includes(`NODE_REPL_TRUSTED_CODE_PATHS = "${result.profile.paths.codexHome}"`), "config should rewrite inherited trusted code paths to the profile home");
assert(configRaw.includes(`notify = ["${path.join(result.profile.paths.codexHome, "computer-use", "Codex Computer Use.app", "Contents", "SharedSupport", "SkyComputerUseClient.app", "Contents", "MacOS", "SkyComputerUseClient")}", "turn-ended"]`), "config should rewrite inherited notify path to the profile home");
assert(configRaw.includes(`SKY_CUA_SERVICE_PATH = "${path.join(result.profile.paths.codexHome, "plugins", "cache", "openai-bundled", "computer-use", "1.0.1000387", "Codex Computer Use.app")}"`), "config should rewrite inherited computer-use service path to the profile home");
assert(!configRaw.includes(`${path.join(testRoot, ".codex")}/`), "config should not keep source CODEX_HOME paths");
assert(!configRaw.includes("codex-home-profiles"), "config should not contain duplicated profile-home fragments");
assert(configRaw.includes("[features]"), "config should inherit default feature settings");
assert(inheritedSkillRaw.includes("Sample skill"), "profile should inherit default CODEX_HOME skills");
assert(inheritedPluginRaw.includes("sample-plugin"), "profile should inherit default CODEX_HOME plugins");
assert(inheritedAgentsRaw.includes("Default instructions"), "profile should inherit default CODEX_HOME instructions");
assert(inheritedSyncedSessionRaw.includes("synced project history"), "profile should inherit matching project session history");
assert(inheritedArchivedSessionRaw.includes("archived synced project history"), "profile should inherit matching archived project session history");
assert(inheritedSourceProfileSessionRaw.includes("source profile project history"), "profile should inherit project session history from selected profile source");
assert(!(await fileExists(inheritedOtherSessionPath)), "profile should not inherit session history from another project");
assert(inheritedSessionIndexRaw.includes("Synced project history"), "profile should inherit matching session index rows");
assert(inheritedSessionIndexRaw.includes("Source profile project history"), "profile should inherit matching session index rows from selected profile source");
assert(!inheritedSessionIndexRaw.includes("Other project history"), "profile should not inherit session index rows from another project");
assert(inheritedHistoryRaw.includes("synced prompt"), "profile should inherit matching prompt history rows");
assert(inheritedHistoryRaw.includes("source profile prompt"), "profile should inherit matching prompt history rows from selected profile source");
assert(!inheritedHistoryRaw.includes("other prompt"), "profile should not inherit prompt history rows from another project");
assert(configRaw.includes("Codex Profile Manager managed settings"), "config should mark appended managed settings");
assert(!configRaw.includes('model = "gpt-5.5"'), "profile config should remove inherited root model to avoid duplicate TOML keys");
assert(configRaw.indexOf('model_provider = "proxy"') < configRaw.indexOf("[mcp_servers.example]"), "profile provider selector should be written before inherited tables");
assert(configRaw.indexOf('model = "gpt-5.2"') < configRaw.indexOf("[mcp_servers.example]"), "profile model should be written before inherited tables");
assert(!configRaw.includes(fakeKey), "config must not contain plaintext API key");
assert(!launcherRaw.includes(fakeKey), "launcher must not contain plaintext API key");
assert(!secretsRaw.includes(fakeKey), "encrypted secrets file must not contain plaintext API key");
assert(JSON.parse(authRaw).auth_mode === "apikey", "auth bootstrap should select API key mode");
assert(JSON.parse(authRaw).OPENAI_API_KEY === fakeKey, "auth bootstrap should contain API key for Codex desktop login");
assert(launcherRaw.includes("CODEX_HOME="), "launcher should set CODEX_HOME");
assert(launcherRaw.includes("--user-data-dir="), "launcher should pass user-data-dir");
assert(launcherContentsStat.isDirectory(), "launcher bundle should contain Contents directory");
assert(launcherMacosStat.isDirectory(), "launcher bundle should contain Contents/MacOS directory");
assert(launcherResourcesStat.isDirectory(), "launcher bundle should contain Contents/Resources directory");
assert(launcherIconStat.isFile(), "launcher bundle should contain generated profile icon");
assert((launcherStat.mode & 0o111) !== 0, "launcher script should be executable");
assert(launcherPlistRaw.includes("<key>CFBundleDisplayName</key>"), "Info.plist should define display name");
assert(launcherPlistRaw.includes("<string>E2E Sandbox</string>"), "Info.plist should contain profile name");
assert(launcherPlistRaw.includes("<key>CFBundleExecutable</key>"), "Info.plist should define executable");
assert(launcherPlistRaw.includes("<string>launcher</string>"), "Info.plist should use launcher executable");
assert(launcherPlistRaw.includes("<key>CFBundleIconFile</key>"), "Info.plist should define profile icon");
assert(launcherPlistRaw.includes("<string>profile-icon</string>"), "Info.plist should use generated profile icon");
assert(launcherPlistRaw.includes("local.codexprofilemanager.e2e-sandbox"), "Info.plist should use profile bundle id");
assert(launcherRaw.startsWith("#!/bin/zsh"), "launcher should be a zsh script");
assert(launcherRaw.includes("set -euo pipefail"), "launcher should use strict shell mode");
assert(launcherRaw.includes(appPaths.masterKeyFile), "launcher should reference encrypted secret master key");
assert(launcherRaw.includes(appPaths.secretsFile), "launcher should reference encrypted secrets file");
await execFileAsync("zsh", ["-n", launcherScript]);
await permanentlyDeleteProfile(sourceProfileResult.profile.id);

const updatedKey = "sk-test-verify-profile-update";
await updateProfile({
  profileId: result.profile.id,
  appearance: {
    iconBackgroundColor: "#007AFF"
  },
  provider: {
    displayName: "Updated Proxy",
    baseUrl: "https://updated.example.com/v1",
    model: "gpt-5.4",
    apiKey: updatedKey,
    reasoningEffort: "high"
  }
});

const [updatedConfigRaw, updatedAuthRaw, updatedLauncherRaw, updatedSecretsRaw, updatedProfiles] = await Promise.all([
  fs.readFile(configPath, "utf8"),
  fs.readFile(authPath, "utf8"),
  fs.readFile(launcherScript, "utf8"),
  fs.readFile(appPaths.secretsFile, "utf8"),
  listProfiles(true)
]);
const updatedStoredKey = await getApiKey(result.profile.id, result.profile.provider.id);
const backups = await listConfigBackups(result.profile.id);
const updatedProfile = updatedProfiles.find((profile) => profile.id === result.profile.id);

assert(updatedProfile?.appearance.iconBackgroundColor === "#007AFF", "profile update should persist appearance color");
assert(updatedConfigRaw.includes('name = "Updated Proxy"'), "updated config should contain new provider name");
assert(updatedConfigRaw.includes('base_url = "https://updated.example.com/v1"'), "updated config should contain new base URL");
assert(updatedConfigRaw.includes('model = "gpt-5.4"'), "updated config should contain new model");
assert(updatedConfigRaw.includes('model_reasoning_effort = "high"'), "updated config should contain new reasoning effort");
assert(updatedConfigRaw.includes('model_provider = "proxy"'), "updated config should keep selecting proxy provider");
assert(!updatedConfigRaw.includes('base_url = "https://proxy.example.com/v1"'), "updated config should remove old managed base URL");
assert(updatedConfigRaw.match(/# --- Codex Profile Manager managed settings ---/g)?.length === 1, "managed config block should not be duplicated");
assert(updatedConfigRaw.includes("[mcp_servers.example]"), "update should preserve inherited MCP server settings");
assert(updatedStoredKey === updatedKey, "updated API key should be retrievable from encrypted storage");
assert(!updatedConfigRaw.includes(updatedKey), "updated config must not contain plaintext API key");
assert(!updatedLauncherRaw.includes(updatedKey), "updated launcher must not contain plaintext API key");
assert(!updatedSecretsRaw.includes(updatedKey), "updated encrypted secrets must not contain plaintext API key");
assert(JSON.parse(updatedAuthRaw).OPENAI_API_KEY === updatedKey, "auth bootstrap should update API key for Codex desktop login");
assert(backups.length >= 1, "profile update should create at least one config backup");
assert(backups[0].reason === "before profile manager config write", "backup should record config write reason");
assert(await fileExists(backups[0].backupPath), "backup config file should exist");

await updateProfile({
  profileId: result.profile.id,
  provider: {
    displayName: "Updated Proxy",
    baseUrl: "https://updated.example.com/v1",
    model: "gpt-5.5",
    reasoningEffort: "xhigh"
  }
});

const [modelOnlyConfigRaw, modelOnlyAuthRaw] = await Promise.all([
  fs.readFile(configPath, "utf8"),
  fs.readFile(authPath, "utf8")
]);

assert(modelOnlyConfigRaw.includes('model = "gpt-5.5"'), "model-only update should write changed model to config");
assert(modelOnlyConfigRaw.includes('model_reasoning_effort = "xhigh"'), "model-only update should write changed reasoning effort to config");
assert(!modelOnlyConfigRaw.includes('model = "gpt-5.4"'), "model-only update should remove previous managed model");
assert(JSON.parse(modelOnlyAuthRaw).OPENAI_API_KEY === updatedKey, "model-only update should keep existing auth API key");

await restoreConfigBackup({
  profileId: result.profile.id,
  backupPath: backups[0].backupPath
});
const restoredConfigRaw = await fs.readFile(configPath, "utf8");
const restoreBackups = await listConfigBackups(result.profile.id);

assert(restoredConfigRaw.includes('base_url = "https://proxy.example.com/v1"'), "restored config should contain original base URL");
assert(!restoredConfigRaw.includes('base_url = "https://updated.example.com/v1"'), "restored config should remove updated base URL");
assert(restoreBackups.some((backup) => backup.reason === "before restoring config backup"), "restore should create a pre-restore backup");

await deleteProfile(result.profile.id);
assert((await listProfiles()).length === 0, "soft-deleted profile should be hidden by default");
const allProfilesAfterDelete = await listProfiles(true);
assert(allProfilesAfterDelete.length === 1, "includeDeleted should return soft-deleted profile");
assert(allProfilesAfterDelete[0].status === "deleted", "soft-deleted profile should be marked deleted");
await restoreProfile(result.profile.id);
const restoredProfiles = await listProfiles();
assert(restoredProfiles.length === 1, "restored profile should be visible by default");
assert(restoredProfiles[0].status === "active", "restored profile should be active");

const diagnostics = await getDiagnosticsReport();
const diagnosticsRaw = JSON.stringify(diagnostics);
assert(diagnostics.profiles.length === 1, "diagnostics should include managed profile");
assert(diagnostics.profiles[0].backupCount >= 1, "diagnostics should include backup count");
assert(!diagnosticsRaw.includes(fakeKey), "diagnostics must not contain original plaintext API key");
assert(!diagnosticsRaw.includes(updatedKey), "diagnostics must not contain updated plaintext API key");

const officialKey = "sk-test-official-openai";
const officialResult = await createProfile({
  name: "Official OpenAI",
  inheritDefaultConfig: false,
  provider: {
    type: "official_openai",
    displayName: "OpenAI",
    model: "gpt-5.2",
    apiKey: officialKey,
    reasoningEffort: "medium"
  }
});
const officialConfigPath = path.join(officialResult.profile.paths.codexHome, "config.toml");
const officialAuthPath = path.join(officialResult.profile.paths.codexHome, "auth.json");
const officialLauncherScript = path.join(officialResult.profile.paths.launcherPath, "Contents", "MacOS", "launcher");
const [officialConfigRaw, officialAuthRaw, officialLauncherRaw] = await Promise.all([
  fs.readFile(officialConfigPath, "utf8"),
  fs.readFile(officialAuthPath, "utf8"),
  fs.readFile(officialLauncherScript, "utf8")
]);
const officialStoredKey = await getApiKey(officialResult.profile.id, officialResult.profile.provider.id);

assert(officialResult.profile.provider.envKeyName === "OPENAI_API_KEY", "official profile should use OPENAI_API_KEY");
assert(officialConfigRaw.includes('model = "gpt-5.2"'), "official config should contain model");
assert(!officialConfigRaw.includes("model_provider"), "official config should not select custom provider");
assert(!officialConfigRaw.includes("[model_providers."), "official config should not write custom provider block");
assert(officialLauncherRaw.includes("export OPENAI_API_KEY="), "official launcher should export OPENAI_API_KEY");
assert(officialStoredKey === officialKey, "official API key should be retrievable from encrypted storage");
assert(!officialConfigRaw.includes(officialKey), "official config must not contain plaintext API key");
assert(!officialLauncherRaw.includes(officialKey), "official launcher must not contain plaintext API key");
assert(JSON.parse(officialAuthRaw).OPENAI_API_KEY === officialKey, "official auth bootstrap should contain API key");

await permanentlyDeleteProfile(officialResult.profile.id);
assert(!(await fileExists(officialResult.profile.paths.codexHome)), "permanent delete should remove CODEX_HOME");
assert(!(await fileExists(officialResult.profile.paths.userDataDir)), "permanent delete should remove user-data-dir");
assert(!(await fileExists(officialResult.profile.paths.launcherPath)), "permanent delete should remove launcher app");
assert(await getApiKey(officialResult.profile.id, officialResult.profile.provider.id) === null, "permanent delete should remove stored API key");
assert(!(await listProfiles(true)).some((profile) => profile.id === officialResult.profile.id), "permanent delete should remove registry record");

const accountResult = await createProfile({
  name: "ChatGPT Account",
  authMode: "chatgpt_account",
  inheritDefaultConfig: false,
  provider: {
    type: "official_openai",
    displayName: "ChatGPT Account",
    model: "gpt-5.2",
    reasoningEffort: "medium"
  }
});
const accountConfigPath = path.join(accountResult.profile.paths.codexHome, "config.toml");
const accountAuthPath = path.join(accountResult.profile.paths.codexHome, "auth.json");
const accountLauncherScript = path.join(accountResult.profile.paths.launcherPath, "Contents", "MacOS", "launcher");
const [accountConfigRaw, accountLauncherRaw] = await Promise.all([
  fs.readFile(accountConfigPath, "utf8"),
  fs.readFile(accountLauncherScript, "utf8")
]);
const accountStoredKey = await getApiKey(accountResult.profile.id, accountResult.profile.provider.id);

assert(accountResult.profile.auth.mode === "chatgpt_account", "account profile should persist account auth mode");
assert(accountResult.profile.provider.envKeyName === "OPENAI_API_KEY", "account profile should keep official provider metadata");
assert(accountConfigRaw.includes('model = "gpt-5.2"'), "account profile should still write basic model config");
assert(!(await fileExists(accountAuthPath)), "account profile should not bootstrap API key auth.json");
assert(accountStoredKey === null, "account profile should not store an API key");
assert(!accountLauncherRaw.includes("API_KEY="), "account launcher should not decrypt an API key");
assert(!accountLauncherRaw.includes("OPENAI_API_KEY"), "account launcher should not export OPENAI_API_KEY");
assert(accountLauncherRaw.includes("CODEX_HOME="), "account launcher should still isolate CODEX_HOME");
assert(accountLauncherRaw.includes("--user-data-dir="), "account launcher should still isolate user-data-dir");
await permanentlyDeleteProfile(accountResult.profile.id);

await fs.rm(testRoot, { force: true, recursive: true });

console.log("Profile generation verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExtractedModels(payload, expectedIds, message) {
  const actualIds = extractModelOptions(payload).map((model) => model.id);
  assert(JSON.stringify(actualIds) === JSON.stringify(expectedIds), message);
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
