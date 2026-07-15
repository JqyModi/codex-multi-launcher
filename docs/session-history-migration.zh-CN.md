# Codex 会话历史迁移记录

这份文档记录了当前已验证的原型流程：把源桌面应用里的历史会话，迁移到一个隔离的 Codex Profile Manager Profile 中。

当前实现还是实验性质，正式产品化前要继续挂在显式开关下，并补齐 macOS / Windows 的完整验证。

## 范围

已验证的迁移覆盖两类侧边栏历史：

- 项目线程：按工作区 / 项目归类的会话，例如 `OpenFaka`。
- 任务线程：显示在侧边栏 `任务` 区的临时会话，通常来自日期型临时 cwd，例如 `/Users/modi/Documents/Codex/2026-05-28/new-chat-11`。

两类历史底层用的是同一套存储模型，区别只在归类方式：

- 项目线程：通过 `cwd == projectPath` 或 `cwd` 位于 `projectPath` 下筛选。
- 任务线程：是普通用户线程，只是没有被项目归类，通常落在临时 / 日期型工作目录里。

## 关键文件

源 Codex home：

```text
~/.codex
```

目标 profile Codex home 示例：

```text
~/.codex-profiles/session-sync-probe-openfaka/codex-home
```

历史依赖的文件：

- `sessions/YYYY/MM/DD/rollout-*.jsonl`：真正的会话历史和 turn 内容。
- `archived_sessions/YYYY/MM/DD/rollout-*.jsonl`：归档历史，如果有。
- `state_5.sqlite`：app-server 读的主线程索引。
- `sqlite/state_5.sqlite`：桌面侧也会读的第二份状态库。
- `sqlite/codex-dev.db`：侧边栏 / catalog 用的本地线程目录。
- `session_index.jsonl`：旧版兼容索引。
- `history.jsonl`：旧版兼容历史。
- `.codex-global-state.json`：项目 / 侧边栏相关的全局状态。

## 已验证测试 Profile

Profile：

```text
Session Sync Probe OpenFaka
```

目标 Codex home：

```text
/Users/modi/.codex-profiles/session-sync-probe-openfaka/codex-home
```

源 Codex home：

```text
/Users/modi/.codex
```

验证过的项目：

```text
/Users/modi/Documents/ai-GeminiPro/Codex/OpenFaka
```

验证过的任务线程：

```text
019e6d3b-fdcf-7d41-aa5e-ecd918375557
```

任务 cwd：

```text
/Users/modi/Documents/Codex/2026-05-28/new-chat-11
```

## 迁移流程

1. 先关闭目标 profile 窗口，再写数据库。

   app-server 在 profile 运行时会持有 SQLite WAL。边跑边写，很容易读到旧数据，甚至后面又被覆盖回去。

2. 先找出源线程 id。

   项目迁移时，从源 `state_5.sqlite` 里筛：

   ```sql
   cwd = '<projectPath>' OR cwd LIKE '<projectPath>/%'
   ```

   任务迁移时，应该只挑明确的用户线程或临时 cwd 范围，不要把所有非项目线程一股脑都同步过去。

3. 复制 rollout JSONL。

   从：

   ```text
   <sourceCodexHome>/sessions/...
   ```

   复制到：

   ```text
   <targetCodexHome>/sessions/...
   ```

   如果是归档线程，再同步 `archived_sessions`。

4. 重写 rollout 第一行的元数据。

   rollout 第一行是 `session_meta`。至少要改：

   ```json
   {
     "payload": {
       "model_provider": "<targetProfileProviderId>"
     }
   }
   ```

   其他字段尽量别动，除非有明确原因。

5. 把线程写入两份目标 state 库。

   写入：

   ```text
   <targetCodexHome>/state_5.sqlite
   <targetCodexHome>/sqlite/state_5.sqlite
   ```

   从源 `threads` 导入匹配行后，重写：

   ```sql
   rollout_path = replace(rollout_path, '<sourceCodexHome>', '<targetCodexHome>')
   model_provider = '<targetProfileProviderId>'
   ```

   同时带上相关表：

   - `thread_dynamic_tools`
   - `thread_spawn_edges`

6. 更新桌面 catalog。

   写入：

   ```text
   <targetCodexHome>/sqlite/codex-dev.db
   ```

   `source_kind` 要用线程的真实 `source`，例如 `vscode`。

   不要把 `thread_source` 塞给 `source_kind`。`thread_source` 可能是 `user`，这不是合法的 `ThreadSourceKind`，会影响侧边栏过滤。

7. 同步旧索引。

   需要合并的旧文件：

   ```text
   session_index.jsonl
   history.jsonl
   ```

   按 thread/session id 过滤。除非你真的在做全历史迁移，不要直接整文件复制。

8. 项目迁移时合并全局状态。

   对项目线程，要更新 `.codex-global-state.json` 里的相关键：

   - `electron-saved-workspace-roots`
   - `project-order`
   - `active-workspace-roots`
   - `thread-workspace-root-hints`
   - `thread-project-assignments`
   - `sidebar-project-thread-orders`
   - 相关 `electron-persisted-atom-state`

   任务线程通常不需要项目级归属状态。

9. 启动目标 profile 做验证。

   打开目标 profile，直接检查侧边栏。

10. 用新版管理器重启验证。

   只做一次原地修复不够。必须确保用户后续打开 profile 时，运行的是包含迁移修复逻辑的新版本 Codex Profile Manager。

   需要验证：

   - 关闭旧的打包版 / 旧 dev 进程。
   - 用新版管理器点击打开目标 profile。
   - 重启目标 profile 后，历史线程仍然存在。
   - `config.toml` 没有再次出现 managed block 粘连。
   - `state_5.sqlite` 和 `sqlite/codex-dev.db` 计数没有回到 0。

## 已验证的 app-server 检查

必要时先生成协议 TypeScript：

```bash
CODEX_HOME=/Users/modi/.codex-profiles/session-sync-probe-openfaka/codex-home \
/Applications/ChatGPT.app/Contents/Resources/codex app-server generate-ts --out /tmp/codex-appserver-ts --experimental
```

app-server 走的是换行分隔 JSON，不是 `Content-Length`。

初始化：

```json
{"id":1,"method":"initialize","params":{"clientInfo":{"name":"probe","title":"Probe","version":"0.0.0"},"capabilities":{"experimentalApi":true}}}
```

然后发送：

```json
{"method":"initialized","params":{}}
```

列出线程：

```json
{"id":2,"method":"thread/list","params":{"limit":100,"cursor":null,"sortKey":"updated_at","archived":false}}
```

读取线程：

```json
{"id":3,"method":"thread/read","params":{"threadId":"<threadId>","includeTurns":true}}
```

恢复线程：

```json
{"id":4,"method":"thread/resume","params":{"threadId":"<threadId>","excludeTurns":false,"initialTurnsPage":{"limit":5,"sortDirection":"asc","itemsView":"full"}}}
```

`sortDirection` 只能用 `asc` 或 `desc`，不能写 `ascending`。

## 遇到的问题

### 1. provider 过滤

最开始 OpenFaka 项目线程已经写进 SQLite，但 UI 里就是看不到。

原因很直接：

- 旧线程的 `model_provider` 是 `codex_local_access` 或 `openai`。
- 目标 profile 用的是 `proxy`。
- app-server 默认 `thread/list` 在 `modelProviders:null` 时，会按当前可用 provider 过滤。
- provider 不匹配，侧边栏就返回空。

解决：

- 迁移时把线程行和 rollout 第一行里的 `model_provider` 都改成目标 profile 的 provider id。

### 2. 两份 state 库

这个 profile 里同时有：

```text
state_5.sqlite
sqlite/state_5.sqlite
```

一开始只有一份是对的，另一份还留着旧路径和旧元数据。

解决：

- 两份 state 库都当作正式迁移目标。
- 两份都用同一套导入和重写逻辑。
- 保证 `rollout_path`、`model_provider`、`source`、`cwd`、preview、时间戳、history mode 一致。

### 3. config.toml 被写坏

重新配置 URL / API KEY 后，历史线程又消失了。

原因：

- managed config 插入时没有留好空行边界。
- `notify = ...` 和 `# --- Codex Profile Manager managed settings ---` 粘在了一行。
- `# --- End ...` 和 `[model_providers.custom]` 也粘在了一行。
- app-server 报：

```text
Invalid configuration; using defaults. ... duplicate key
```

- 配置无效后，app-server 回退到默认配置，`proxy` 不再是有效当前 provider。

解决：

- `mergeManagedConfig` 必须保证 root、managed block、后续 table 之间有稳定空行。
- 改完 provider 后重新写一次 `config.toml`。
- 继承来的 profile 专属路径要规范化到目标 profile：

  ```text
  CODEX_HOME
  NODE_REPL_TRUSTED_CODE_PATHS
  SKY_CUA_SERVICE_PATH
  notify
  marketplaces.*.source
  ```

  否则新 profile 可能继续指向源 `~/.codex`，或者串到其它 profile。

### 3.1 重启后历史又消失

最终确认过一次容易误判的场景：

- 原地修复后，SQLite 里历史线程仍然存在。
- 重启后 UI 又看不到历史。
- 排查发现不是数据库同步再次失败，而是旧版 Codex Profile Manager 进程还在运行。
- 旧版管理器在打开 profile 时继续用旧逻辑写 `config.toml`，把 managed block 再次粘连成非法 TOML。
- app-server 读取配置失败后回退默认配置，当前 provider 不再是 `proxy`，因此历史看起来像“丢了”。

验证方式：

```bash
sqlite3 ~/.codex-profiles/<profile-id>/codex-home/state_5.sqlite \
  "select count(*) from threads;"

sqlite3 ~/.codex-profiles/<profile-id>/codex-home/sqlite/codex-dev.db \
  "select count(*) from local_thread_catalog;"

rg -n -- 'Codex Profile Manager managed|CODEX_HOME|notify =|codex-home-profiles|# --- End Codex Profile Manager managed settings ---\[' \
  ~/.codex-profiles/<profile-id>/codex-home/config.toml
```

正确状态：

- `threads` 数量不为 0。
- `local_thread_catalog` 数量不为 0。
- `notify = ...` 和 `# --- Codex Profile Manager managed settings ---` 不在同一行。
- `# --- End ...` 和下一个 `[table]` 不在同一行。
- `CODEX_HOME` 指向当前 profile 的 `codex-home`。

长期解决：

- 修复 `writeCodexConfig` / `mergeManagedConfig`，保证每次打开、更新、生成启动器都会写出合法 TOML。
- 停掉旧打包版和旧 dev 进程。
- 发布并安装包含修复的新版本。
- 不依赖手动原地修复；手动修复只能作为救急手段。

### 4. catalog 的 source_kind

有些 catalog 行把 `thread_source` 当成了 `source_kind`。

问题：

- `thread_source` 可能是 `user`。
- `ThreadSourceKind` 的合法值里没有 `user`。
- 这会把侧边栏过滤搞歪。

解决：

- `local_thread_catalog.source_kind` 必须用 `threads.source`。
- `thread_source` 只保留为线程元数据，不拿来做 catalog 分类。

### 5. subagent 行

`threads.source` 里有些行是 JSON 对象，比如：

```json
{"subagent":{"thread_spawn":{"parent_thread_id":"..."}}}
```

这类行一般不该作为顶层任务出现。

规则：

- 项目 / 任务顶层同步，先只同步用户主线程。
- 如果要带子 agent，要明确父线程和 UI 支持方式。

## 项目线程结果

OpenFaka 的验证结果：

- 项目文件夹进侧边栏了。
- 默认 `thread/list` 在 provider 重写后能返回 9 条主线程。
- `thread/read` 能读出完整历史 turns。
- `thread/resume` 能恢复上下文。

示例：

```text
threadId: 019dbcb6-38f0-7493-b0d7-15d4abcd64ea
turns: 41
initialTurnsPage: 5
```

## 任务线程结果

任务线程探针：

```text
threadId: 019e6d3b-fdcf-7d41-aa5e-ecd918375557
title/preview: 你好
cwd: /Users/modi/Documents/Codex/2026-05-28/new-chat-11
```

验证结果：

- 默认列表从 9 条变成 10 条。
- 这条任务线程出现在左侧 `任务` 区。
- `thread/read` 能读到 9 个 turns。

## 产品化建议

1. 创建 profile 时增加显式的“同步源 app 历史”开关。
2. 让用户选范围：

   - 仅项目
   - 仅任务
   - 项目 + 任务

3. 项目同步支持多 root。
4. 任务同步默认只拉最近窗口，比如最近 30 / 90 天。
5. 默认排除：

   - archived threads，除非用户主动勾选
   - subagent 子线程，除非 UI 明确支持
   - preview 为空的线程
   - rollout 文件缺失的线程
6. 永远重写：

   - rollout 的 `model_provider`
   - state 库里的 `model_provider`
   - state 库里的 `rollout_path`
   - catalog 里的 `model_provider`
   - catalog 里的 `source_kind`
7. 同步后立刻验证：

   - 默认 `thread/list`
   - 项目 cwd 过滤
   - `thread/read`
   - `thread/resume`
8. 给用户一个迁移结果摘要：

   - 同步了哪些项目
   - 同步了多少任务线程
   - 跳过了哪些线程
   - 哪些 rollout 文件缺失
   - 哪些 archived 行被跳过

## 当前原型入口

现在的原型入口是：

```text
CODEX_PROFILE_MANAGER_SESSION_SYNC_PROJECT=/path/to/project
```

这个只覆盖“项目路径”同步。任务线程探针是手工单条迁移出来的，用来确认同一条底层数据链路也能跑通 `任务` 区。

正式发布前，最好把这个环境变量方案替换成带类型的迁移 API 和 UI 选项。

## 安全注意事项

- 不要改源 `~/.codex`。
- 所有写入都落在目标 profile home。
- 写 SQLite 前先关掉目标 profile。
- 批量导入要保持幂等，推荐 `INSERT OR REPLACE`。
- 改 `config.toml` 前先备份。
- 不要无脑全量同步，老 Codex home 里项目、任务、subagent 数量都可能很大。
- Windows 还要单独验证，symlink、路径分隔符、Microsoft Store / AppX 启动逻辑都和 macOS 不一样。
