# Codex Multi Launcher v0.1.6 社媒分发文案

## X / Twitter

### 发布目标

快速获得开发者关注和转发。重点不是讲全功能，而是用一个明确痛点抓住人：ChatGPT/Codex 合并后，多开、账号隔离、历史记录这些工作流变麻烦了。

### 建议配图

最多 4 张，顺序如下：

1. `docs/publishing/linuxdo-assets/01-dashboard.png`
2. `docs/publishing/linuxdo-assets/02-create-profile.png`
3. `docs/publishing/linuxdo-assets/04-chatgpt-account-mode.png`
4. `docs/publishing/linuxdo-assets/03-provider-settings.png`

### 单条短推版本，免费账号优先用

```text
Codex/ChatGPT 合并后，我的多开配置工作流炸了。

于是修了 Codex 多开助手：独立账号/配置、官方账号登录、API Key/Base URL、创建时同步历史对话。

开源：
https://github.com/JqyModi/codex-multi-launcher
```

### 英文单条短推版本，免费账号优先用

```text
I built an open-source multi-profile launcher for Codex/ChatGPT Desktop.

Separate windows, separate accounts, API configs, projects, and copied chat history.

https://github.com/JqyModi/codex-multi-launcher
```

### 首条回复补充

```text
v0.1.6 fixed the painful bits users reported:

• new ChatGPT/Codex app detection
• official ChatGPT account profiles
• project/task chat history copy
• Windows EPERM/symlink issues
• restart losing projects/history
```

### 更容易传播的 Thread 版本

```text
1/ Codex/ChatGPT desktop merging broke a lot of my old multi-window workflow.

I wanted:
• one window logged into my ChatGPT account
• another using API Key + custom Base URL
• separate projects and chat history
• no manual config file editing every time

So I built Codex Multi Launcher.
```

```text
2/ The app creates isolated desktop profiles for Codex / ChatGPT.

Each profile can have its own:
• login state
• provider config
• model
• project history
• task history

It is not an OpenAI project, just a local profile manager around the desktop app.
```

```text
3/ v0.1.6 fixed a few painful issues reported by users:

• new ChatGPT/Codex executable detection
• official ChatGPT account profile mode
• copied existing project/task chats into new profiles
• Windows symlink / EPERM profile creation issues
• restart losing projects/history
```

```text
4/ Still being honest about the limits:

• not real-time shared history
• third-party APIs need to match Codex's current API behavior
• Windows builds are unsigned for now

Open source:
https://github.com/JqyModi/codex-multi-launcher

Feedback welcome, especially from Windows users.
```

### 中文短推版本

```text
Codex 和 ChatGPT 桌面端合并后，我原来的多开工作流炸了一轮。

于是把 Codex 多开助手补到了 v0.1.6：

• 每个窗口独立账号/配置
• 支持 ChatGPT 官方账号登录
• 支持 API Key / Base URL
• 创建 Profile 时可同步已有项目/临时任务对话
• 修了 Windows EPERM 和重启丢历史问题

开源：
https://github.com/JqyModi/codex-multi-launcher
```

## Threads

### 发布目标

Threads 不适合太硬的“新品发布”。更适合像作者随手分享：这东西原来是自用，后来被用户反馈推着补了一堆坑。语气可以更口语，少 bullet，少技术黑话。

### 建议配图

发 2-3 张即可：

1. `docs/publishing/linuxdo-assets/01-dashboard.png`
2. `docs/publishing/linuxdo-assets/02-create-profile.png`
3. `docs/publishing/linuxdo-assets/04-chatgpt-account-mode.png`

### 中文版

```text
之前为了自己用 Codex 方便，做了一个很小的多开助手。

本来只是想解决一个问题：不同项目、不同账号、不同 API 配置，不要每天手动改配置文件。

结果 OpenAI 后面把 ChatGPT 和 Codex 桌面端合并了，旧路径、Windows 权限、官方账号登录、历史会话这些地方陆续都踩了一遍坑。

这段时间基本是被 GitHub issue 推着修，现在到 v0.1.6，终于比较像一个能正常给别人用的小工具了。

现在支持：

• ChatGPT 官方账号登录的独立 Profile
• API Key / Base URL 的独立 Profile
• 创建时同步已有项目和临时任务对话
• macOS 签名包
• Windows x64 安装包/便携版

它不是官方项目，也不提供账号或 Key，只是帮你把 Codex/ChatGPT 桌面端的多配置隔离管理起来。

项目开源在这里：
https://github.com/JqyModi/codex-multi-launcher

如果你也经常切 Codex 配置，可以试试看。Windows 用户的反馈尤其欢迎，因为很多坑我自己在 Mac 上确实测不出来。
```

### 英文版

```text
I built a small open-source app because my Codex desktop workflow was getting messy.

I wanted different windows for different accounts, API keys, Base URLs, projects, and chat history without manually editing config files every time.

Then the ChatGPT/Codex desktop merge happened, and a bunch of things broke: executable paths, Windows permissions, account login persistence, copied histories.

v0.1.6 is basically the version shaped by real user issues.

It now supports:

• isolated Codex/ChatGPT desktop profiles
• official ChatGPT account profiles
• API Key / Base URL profiles
• copying existing project/task chats into new profiles
• signed macOS builds
• Windows x64 installer/portable builds

Not official. Not a proxy. No API keys included.
Just a local profile manager for people who need multiple Codex/ChatGPT desktop environments.

Open source:
https://github.com/JqyModi/codex-multi-launcher
```

## Reddit

### 发布目标

Reddit 最容易被自推广规则打掉。建议只发到允许开源工具分享或有固定 self-promotion thread 的社区，比如 `r/ChatGPTCoding` 的 self-promotion thread，或明确允许免费开源项目反馈的开发者社区。不要发成“download my app”，要发成“我做了一个开源工具，想听实际用户反馈”。

### 建议标题

```text
I built an open-source profile manager for Codex/ChatGPT Desktop after the app merge broke my workflow
```

备选：

```text
Open-source Codex/ChatGPT Desktop multi-profile manager: account profiles, API profiles, and copied chat history
```

### 正文

```markdown
Hi everyone. I built a small open-source desktop tool for a workflow I kept running into with Codex / ChatGPT Desktop.

The problem: I wanted multiple isolated desktop environments:

- one window logged into a ChatGPT account
- another window using API Key + custom Base URL
- separate projects and temporary tasks
- copied chat history when creating a new profile
- no manual editing of config files every time I switch context

After the recent ChatGPT/Codex Desktop changes, some old assumptions broke: executable paths changed, Windows had symlink / EPERM issues, and account-based profiles needed different handling from API-key profiles.

So I built **Codex Multi Launcher**:

https://github.com/JqyModi/codex-multi-launcher

What it does:

- creates isolated Codex / ChatGPT Desktop profiles
- supports official ChatGPT account login profiles
- supports API Key / Base URL provider profiles
- can copy existing project chats, temporary task chats, or both into a new profile
- detects the newer ChatGPT/Codex desktop app paths
- has macOS signed builds and Windows x64 installer/portable builds

What it does not do:

- it is not an OpenAI project
- it does not provide accounts or API keys
- it does not bypass any account limits
- chat history sync is copy-on-create, not real-time shared history
- third-party APIs still need to be compatible with Codex's current API behavior
- Windows builds are unsigned for now

I am especially looking for feedback from people using Windows, Store/AppX installs, or mixed official-account + API-key workflows.

If this is too close to self-promotion for this subreddit, I am happy to move it to the appropriate weekly/self-promo thread.
```

### Reddit 评论区第一条 FAQ

```markdown
Quick FAQ:

**Is this an official OpenAI app?**
No. It is a local open-source profile manager around the desktop app.

**Does it share history live between profiles?**
No. It copies selected existing project/task history when creating a profile. I chose this because live-sharing the same state database is much easier to corrupt.

**Does it work with any OpenAI-compatible API?**
Not necessarily. Codex Desktop currently expects behavior closer to its own API flow, so some Chat Completions-only providers may not work.

**Why is Windows unsigned?**
Code signing certificates are expensive. The macOS builds are signed/notarized; Windows signing is still undecided.
```

## 发布节奏

1. 先发 X 英文 Thread，配 4 张图。
2. 半小时后发 Threads 中文或英文，配 2-3 张图。
3. Reddit 不要同一天到处铺，先选一个最合规的社区或 self-promotion thread。
4. 每个平台第一小时内要及时回复评论，尤其是 Windows / Store / official account login 相关问题。
5. 不要把 release 链接放在第一句，第一句先讲痛点，链接放后面。
