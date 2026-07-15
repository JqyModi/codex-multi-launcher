# Codex Session History Migration Notes

This document records the verified prototype flow for migrating historical Codex/ChatGPT session history from the source desktop app into an isolated Codex Profile Manager profile.

The current implementation is experimental. Keep it behind an explicit switch until the migration is productized and tested across macOS and Windows.

## Scope

The verified migration covers two kinds of sidebar history:

- Project threads: conversations grouped under a workspace/project, such as `OpenFaka`.
- Task threads: temporary conversations shown under the sidebar `Tasks` section, usually created under date-based temporary cwd paths such as `/Users/modi/Documents/Codex/2026-05-28/new-chat-11`.

Both kinds of history use the same underlying storage model. The difference is classification:

- Project threads are selected by `cwd == projectPath` or `cwd` inside `projectPath`.
- Task threads are ordinary user threads whose `cwd` is not grouped under the selected project, often using temporary/date-based work directories.

## Important Files

Source Codex home:

```text
~/.codex
```

Target profile Codex home example:

```text
~/.codex-profiles/session-sync-probe-openfaka/codex-home
```

History depends on these files:

- `sessions/YYYY/MM/DD/rollout-*.jsonl`: canonical conversation history and turn items.
- `archived_sessions/YYYY/MM/DD/rollout-*.jsonl`: archived conversation history, if any.
- `state_5.sqlite`: primary thread index used by app-server.
- `sqlite/state_5.sqlite`: secondary state DB also read by desktop/app-server flows.
- `sqlite/codex-dev.db`: desktop local thread catalog used by sidebar/catalog surfaces.
- `session_index.jsonl`: legacy session index compatibility.
- `history.jsonl`: legacy history compatibility.
- `.codex-global-state.json`: desktop global state for project/sidebar hints.

## Verified Test Profile

Profile:

```text
Session Sync Probe OpenFaka
```

Target Codex home:

```text
/Users/modi/.codex-profiles/session-sync-probe-openfaka/codex-home
```

Source Codex home:

```text
/Users/modi/.codex
```

Verified project:

```text
/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka
```

Verified task thread:

```text
019e6d3b-fdcf-7d41-aa5e-ecd918375557
```

Task cwd:

```text
/Users/modi/Documents/Codex/2026-05-28/new-chat-11
```

## Migration Flow

1. Close the target profile window before writing databases.

   App-server keeps SQLite WAL files open while the profile is running. Writing state while it is open can cause stale reads or later overwrite behavior.

2. Identify the source thread ids.

   For project migration, select rows from source `state_5.sqlite` where:

   ```sql
   cwd = '<projectPath>' OR cwd LIKE '<projectPath>/%'
   ```

   For task migration, select explicit user thread ids or filter by temporary cwd roots. Avoid blindly syncing every non-project row.

3. Copy matching rollout JSONL files.

   Copy from:

   ```text
   <sourceCodexHome>/sessions/...
   ```

   To:

   ```text
   <targetCodexHome>/sessions/...
   ```

   Do the same for `archived_sessions` if the source row is archived.

4. Rewrite copied rollout metadata.

   The first line of the rollout is `session_meta`. Rewrite at least:

   ```json
   {
     "payload": {
       "model_provider": "<targetProfileProviderId>"
     }
   }
   ```

   Keep `source`, `cwd`, `id`, timestamps, git info, and the rest of the payload unchanged unless there is a confirmed reason to change them.

5. Copy thread rows into both target state databases.

   Write into:

   ```text
   <targetCodexHome>/state_5.sqlite
   <targetCodexHome>/sqlite/state_5.sqlite
   ```

   Import matching rows from source `threads`, then rewrite:

   ```sql
   rollout_path = replace(rollout_path, '<sourceCodexHome>', '<targetCodexHome>')
   model_provider = '<targetProfileProviderId>'
   ```

   Also copy related rows from:

   - `thread_dynamic_tools`
   - `thread_spawn_edges`

6. Update desktop catalog.

   Write matching rows into:

   ```text
   <targetCodexHome>/sqlite/codex-dev.db
   ```

   Use the thread's real `source` as `source_kind`, for example `vscode`.

   Do not use `thread_source` as `source_kind`. `thread_source` may be `user`, which is not a valid `ThreadSourceKind` for sidebar filtering.

7. Copy legacy indexes.

   Append or merge matching rows from:

   ```text
   session_index.jsonl
   history.jsonl
   ```

   Filter by thread/session id. Do not copy the whole file unless doing a full-history import.

8. Merge project global state for project migrations.

   For project threads, update `.codex-global-state.json` with related project keys:

   - `electron-saved-workspace-roots`
   - `project-order`
   - `active-workspace-roots`
   - `thread-workspace-root-hints`
   - `thread-project-assignments`
   - `sidebar-project-thread-orders`
   - related `electron-persisted-atom-state` entries

   Task threads do not necessarily need project assignment state.

9. Start the target profile and validate.

   After migration, open the target profile app and inspect the sidebar.

10. Restart with the fixed manager and validate again.

   A one-off in-place repair is not enough. Users must open profiles with a Codex Profile Manager build that contains the migration/config fixes.

   Verify:

   - Old packaged/dev manager processes are closed.
   - The target profile is opened from the fixed manager.
   - Historical threads remain visible after restarting the target profile.
   - `config.toml` does not regain glued managed-block markers.
   - `state_5.sqlite` and `sqlite/codex-dev.db` counts do not return to zero.

## Verified App-Server Checks

Generate TypeScript protocol definitions when needed:

```bash
CODEX_HOME=/Users/modi/.codex-profiles/session-sync-probe-openfaka/codex-home \
/Applications/ChatGPT.app/Contents/Resources/codex app-server generate-ts --out /tmp/codex-appserver-ts --experimental
```

The app-server transport is newline-delimited JSON, not `Content-Length`.

Initialize with:

```json
{"id":1,"method":"initialize","params":{"clientInfo":{"name":"probe","title":"Probe","version":"0.0.0"},"capabilities":{"experimentalApi":true}}}
```

Then send:

```json
{"method":"initialized","params":{}}
```

List threads:

```json
{"id":2,"method":"thread/list","params":{"limit":100,"cursor":null,"sortKey":"updated_at","archived":false}}
```

Read a thread:

```json
{"id":3,"method":"thread/read","params":{"threadId":"<threadId>","includeTurns":true}}
```

Resume a thread:

```json
{"id":4,"method":"thread/resume","params":{"threadId":"<threadId>","excludeTurns":false,"initialTurnsPage":{"limit":5,"sortDirection":"asc","itemsView":"full"}}}
```

Use `asc` or `desc` for `sortDirection`. `ascending` is invalid.

## Problems Found

### Provider Filtering

Initially, OpenFaka project rows were present in SQLite but invisible in the UI.

Root cause:

- Old threads had `model_provider` values such as `codex_local_access` or `openai`.
- The target profile was using provider id `proxy`.
- App-server default `thread/list` with `modelProviders:null` filters by active/current providers.
- Because the old provider ids did not match, sidebar returned zero visible rows.

Fix:

- Rewrite migrated thread rows and rollout `session_meta.payload.model_provider` to the target profile provider id.

### Two State Databases

The profile had both:

```text
state_5.sqlite
sqlite/state_5.sqlite
```

At one point only one was correct. The other still contained source rollout paths and older metadata.

Fix:

- Treat both state databases as migration targets.
- Use the same import and rewrite logic for both.
- Keep `rollout_path`, `model_provider`, `source`, `cwd`, preview, timestamps, and history mode consistent.

### Config TOML Corruption

After changing URL/API key, historical threads disappeared again.

Root cause:

- `config.toml` merge wrote managed config without reliable blank-line boundaries.
- `notify = ...` was glued to `# --- Codex Profile Manager managed settings ---`.
- `# --- End ...` was glued to `[model_providers.custom]`.
- App-server logged:

```text
Invalid configuration; using defaults. ... duplicate key
```

- With config invalid, app-server fell back to defaults and no longer considered `proxy` active.

Fix:

- Ensure managed config insertion always joins root config, managed block, and remaining tables with blank lines.
- Re-run `writeCodexConfig` after changing provider settings.
- Normalize inherited profile-specific paths to the target profile:

  ```text
  CODEX_HOME
  NODE_REPL_TRUSTED_CODE_PATHS
  SKY_CUA_SERVICE_PATH
  notify
  marketplaces.*.source
  ```

  Otherwise the new profile may keep pointing at the source `~/.codex` or another profile.

### History Disappears Again After Restart

One confirmed failure mode was easy to misread:

- After an in-place repair, historical rows still existed in SQLite.
- After restarting the target profile, the UI looked empty again.
- The database migration had not failed again. An old Codex Profile Manager process was still running.
- That old manager rewrote `config.toml` with the old merge logic when opening the profile.
- The managed block became invalid TOML again.
- App-server fell back to default config, `proxy` was no longer active, and the migrated rows looked invisible.

Diagnostic commands:

```bash
sqlite3 ~/.codex-profiles/<profile-id>/codex-home/state_5.sqlite \
  "select count(*) from threads;"

sqlite3 ~/.codex-profiles/<profile-id>/codex-home/sqlite/codex-dev.db \
  "select count(*) from local_thread_catalog;"

rg -n -- 'Codex Profile Manager managed|CODEX_HOME|notify =|codex-home-profiles|# --- End Codex Profile Manager managed settings ---\[' \
  ~/.codex-profiles/<profile-id>/codex-home/config.toml
```

Healthy state:

- `threads` count is non-zero.
- `local_thread_catalog` count is non-zero.
- `notify = ...` and `# --- Codex Profile Manager managed settings ---` are on separate lines.
- `# --- End ...` and the next `[table]` are on separate lines.
- `CODEX_HOME` points to the current profile `codex-home`.

Permanent fix:

- Fix `writeCodexConfig` / `mergeManagedConfig` so every open/update/regenerate path writes valid TOML.
- Stop old packaged and old dev manager processes.
- Ship and install a build containing the fix.
- Do not rely on manual in-place repair except as an emergency recovery step.

### Catalog source_kind

Some migrated catalog rows used `thread_source` as `source_kind`.

Problem:

- `thread_source` can be `user`.
- Valid app-server `ThreadSourceKind` values include `cli`, `vscode`, `exec`, `appServer`, sub-agent variants, and `unknown`.
- `user` is not a valid source kind and can break or confuse desktop/sidebar filtering.

Fix:

- Use `threads.source` for `local_thread_catalog.source_kind`.
- Keep `thread_source` only as thread metadata, not as catalog source kind.

### Subagent Rows

Subagent rows are stored in `threads.source` as JSON objects such as:

```json
{"subagent":{"thread_spawn":{"parent_thread_id":"..."}}}
```

These rows are usually not meant to appear as top-level sidebar tasks.

Rule:

- For top-level project/task sync, include user/main threads first.
- Only include subagent rows if the parent thread needs full descendants and the target UI supports viewing them.

## Project Thread Result

OpenFaka migration result:

- Project folder appeared in the sidebar.
- Default `thread/list` returned 9 top-level project threads after provider rewrite.
- `thread/read` loaded full historical turns.
- `thread/resume` successfully restored context.

Example verified read:

```text
threadId: 019dbcb6-38f0-7493-b0d7-15d4abcd64ea
turns: 41
initialTurnsPage: 5
```

## Task Thread Result

Task thread probe:

```text
threadId: 019e6d3b-fdcf-7d41-aa5e-ecd918375557
title/preview: 你好
cwd: /Users/modi/Documents/Codex/2026-05-28/new-chat-11
```

Migration result:

- Default app-server list increased from 9 to 10 rows.
- The migrated task thread appeared in the left sidebar `Tasks` section.
- `thread/read` loaded 9 turns.

## Productization Notes

Recommended product behavior:

1. Add an explicit `Sync source app history` option when creating a profile.

2. Let users choose scope:

   - Project only
   - Tasks only
   - Project + tasks

3. For project sync, allow selecting one or more project roots.

4. For task sync, default to a small recent window, for example latest 30 or latest 90 days.

5. Exclude by default:

   - archived threads unless user opts in
   - subagent child rows as top-level tasks
   - rows with empty preview
   - rows with missing rollout files

6. Always rewrite:

   - copied rollout `model_provider`
   - state DB `model_provider`
   - state DB `rollout_path`
   - catalog `model_provider`
   - catalog `source_kind`

7. Validate immediately after migration:

   - `thread/list` default returns expected rows
   - project cwd filter returns expected project rows
   - `thread/read` works for a sample thread
   - `thread/resume` works for a sample thread

8. Show a migration summary to the user:

   - projects synced
   - task threads synced
   - skipped rows
   - missing rollout files
   - archived rows skipped
   - subagent rows skipped

## Current Prototype Entry

The current prototype uses:

```text
CODEX_PROFILE_MANAGER_SESSION_SYNC_PROJECT=/path/to/project
```

This only covers project-path filtering. The task-thread probe was manually migrated to confirm the same lower-level data chain works for `Tasks`.

Before shipping, replace the environment-variable-only prototype with a typed migration API and UI option.

## Safety Notes

- Never modify the source `~/.codex` during migration.
- Always copy into the target profile home.
- Close the target profile before writing SQLite files.
- Keep migration idempotent with `INSERT OR REPLACE`.
- Back up target `config.toml` and SQLite files before bulk import.
- Do not run full-history import without limits; old Codex homes can contain many project, task, and subagent rows.
- Windows support needs separate validation because symlink behavior, path separators, and Microsoft Store/AppX launches differ from macOS.
