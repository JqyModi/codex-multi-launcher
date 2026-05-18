# Codex 多开助手首发文案

本文档保存首轮公网分发文案。发布前应根据当天版本号、Release 链接、已知问题和用户反馈再做一次最终校对。

## Linux.do 首发帖

标题：

```text
开源求测：做了一个 macOS 的 Codex 多开助手，支持每个 Profile 独立 API Key / Base URL
```

正文：

```markdown
大家好，我最近做了一个 macOS 小工具：Codex 多开助手。

落地页：
https://jqymodi.github.io/codex-multi-launcher/

GitHub：
https://github.com/JqyModi/codex-multi-launcher

## 背景

我自己使用 Codex App 时，经常遇到几个场景：

- 个人项目和工作项目用不同 API Key
- 有些项目走官方 OpenAI，有些走自建代理 Base URL
- 想测试第三方 Responses 兼容接口
- 希望同时开多个 Codex 窗口处理不同 repo

如果每次都手动改配置、切环境变量或从命令行指定工作区，很容易串配置，也不太适合长期使用。所以我把这个流程做成了一个图形化工具。

## 它能做什么

Codex 多开助手目前主要解决四件事：

- 管理多个 Codex Profile
- 每个 Profile 独立配置 API Key、Base URL 和模型
- 支持第三方 Responses 兼容接口
- 为每个 Profile 生成可双击打开的独立启动器 App

简单理解就是：一个 Profile 对应一个独立 Codex 工作区，不同窗口之间的 API 配置尽量互不影响。

## 当前版本边界

先把边界说清楚：

- 当前主要面向 macOS Apple Silicon
- App 还没有签名和 notarization，首次打开可能需要手动解除 quarantine
- 第三方接口只按 Responses 兼容接口验证，不保证所有服务商都能用
- 目前是 MVP，不是正式版本

未签名 App 如果打不开，可以参考 Release 说明里的命令：

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

## 现在最想求测什么

我现在最需要的真实使用反馈，尤其是这些点：

1. 你的 macOS 版本下能否正常启动
2. 是否能成功创建多个独立 Profile
3. 多个 Profile 的 API Key / Base URL / 模型是否符合你的工作流
4. 第三方 Responses 兼容接口能否正常测试和对话
5. 哪一步让你困惑、不会填写或失败
6. 是否需要 Provider 预设、导入导出、菜单栏快速启动等功能

## 反馈方式

优先提 GitHub Issues，方便跟踪：

https://github.com/JqyModi/codex-multi-launcher/issues

也可以直接在帖子里回复，我会整理成 issue 或后续版本计划。

反馈时建议带上这些信息：

- macOS 版本：
- Codex App 版本：
- 使用接口：OpenAI 官方 / 自建代理 / 第三方兼容接口
- Base URL 是否以 `/v1` 结尾：
- 是否成功创建 Profile：
- 是否成功打开独立 Codex：
- 遇到的问题：
- 希望增加的功能：

## 截图 / 演示

主视觉：
![Codex 多开助手主视觉](https://raw.githubusercontent.com/JqyModi/codex-multi-launcher/main/marketing-assets/hero-annotated.png)

演示视频/GIF：
https://github.com/JqyModi/codex-multi-launcher/raw/main/marketing-assets/codex-workflow-demo.mp4

如果你正在用 Codex App，并且有多 API Key、多 Base URL 或第三方 Responses 兼容接口的需求，欢迎体验。
```

发布备注：

- Linux.do 发帖时建议直接上传本地 `hero-annotated.png` 和 `codex-workflow-demo.mp4`，不要只依赖 raw 链接。
- 如果帖子不支持视频，可上传 `codex-workflow-demo.gif`。
- 语气保持求测，不要写“神器”“完美兼容”“无限多开”。

## X 首发帖

发布策略：

- X 先作为轻量首发渠道使用，不等待 Linux.do 审核结果。
- 首条只放落地页链接，减少链接噪音；GitHub 和 Issues 放在线程回复里。
- 素材优先附 `docs/marketing-assets/codex-workflow-demo.mp4`，如果视频转码失败则改用 `docs/marketing-assets/hero-annotated.png`。
- 语气保持开源求测，不写夸张承诺。

单条短帖：

```text
做了一个 macOS 小工具：Codex 多开助手。

它可以给 Codex App 创建多个隔离 Profile，让每个窗口都有独立的 API Key、Base URL 和模型配置，也支持第三方 Responses 兼容接口。

现在开源求测，想收集真实兼容反馈：
https://jqymodi.github.io/codex-multi-launcher/
```

线程版：

```text
1/4
我做了一个 macOS 小工具：Codex 多开助手。

目标很简单：让每个 Codex 窗口都有自己的 API 配置。

如果你经常在不同项目、API Key、Base URL 或第三方 Responses 兼容接口之间切换，欢迎帮忙测一下：
https://jqymodi.github.io/codex-multi-launcher/
```

```text
2/4
它目前支持：

- 创建多个隔离 Codex Profile
- 每个 Profile 独立 API Key / Base URL / 模型
- 生成可双击打开的启动器 App
- 测试第三方 Responses 兼容接口
- API Key 本地保存，诊断报告不包含密钥
```

```text
3/4
当前还是 MVP，边界先说清楚：

- 主要面向 macOS Apple Silicon
- App 还没有签名和 notarization
- 第三方接口只按 Responses 兼容接口验证
- 不承诺兼容所有服务商

我现在更想要真实使用反馈，而不是泛下载量。
```

```text
4/4
GitHub：
https://github.com/JqyModi/codex-multi-launcher

Issues 反馈：
https://github.com/JqyModi/codex-multi-launcher/issues

如果你正在用 Codex App，并且有多 API Key / 多 Base URL / 第三方兼容接口需求，欢迎试一下。
```

发布备注：

- 推荐使用线程版，首条附 MP4 演示视频。
- 如果只想快速试水，使用单条短帖并附主视觉图。
- 发出后 1 小时内重点观察：转发、收藏、GitHub Star、Release 下载、Issues。
- 若有人问“和直接命令行指定工作区有什么区别”，重点回复：降低小白操作成本、可恢复配置、可双击启动、多个 Profile 可视化管理。

## X 二次分发帖

发布策略：

- 适合换账号后重新分发。
- 重点从“我做了一个工具”改成“Codex 重度用户的具体痛点”。
- 首帖尽量短，突出问题和结果；回复里补链接与反馈入口。
- 优先附主视觉图或演示视频。无法上传素材时，先发纯文本，后续单独补图。

推荐主帖：

```text
Codex 用久了以后，我最烦的不是模型能力，而是配置切来切去。

个人项目一个 API Key，工作项目一个 Base URL，测试第三方 Responses 接口又是另一套配置。

所以我做了一个小工具：给 Codex App 创建多个独立 Profile，每个窗口都有自己的 API Key / Base URL / 模型。

macOS 版开源求测。
```

推荐回复：

```text
它目前能做：

- 多个 Codex Profile 隔离
- 每个 Profile 独立 API Key / Base URL / 模型
- 生成可双击打开的启动器 App
- API Key 本地保存
- 支持第三方 Responses 兼容接口测试

落地页：
https://jqymodi.github.io/codex-multi-launcher/
```

反馈回复：

```text
GitHub：
https://github.com/JqyModi/codex-multi-launcher

Issues：
https://github.com/JqyModi/codex-multi-launcher/issues

现在最想收集：
1. 第三方接口兼容反馈
2. 多 Profile 是否真的解决你的工作流
3. 是否需要 Windows 版 / 多账号登录支持
```

短版备选：

```text
如果你用 Codex App，同时有多个 API Key、多个 Base URL、或者第三方 Responses 兼容接口需求，可以试试这个：

Codex 多开助手。

它给每个 Codex 窗口创建独立 Profile，让配置不再互相串。

开源求测：
https://jqymodi.github.io/codex-multi-launcher/
```

## X Global Launch

Distribution strategy:

- Use English on X for global developer reach.
- Do not mix Chinese and English in the same post. Use one English thread, then repost/quote in Chinese later if needed.
- Lead with the workflow pain, not the product name.
- Put GitHub before the Chinese landing page until the landing page has a full English version.
- Keep the ask narrow: early feedback from Codex users who switch API keys, Base URLs, or Responses-compatible providers.

Recommended thread:

```text
I kept hitting a Codex Desktop workflow problem:

one project needs one API key, another uses a custom Base URL, and provider testing needs a third setup.

So I built a macOS utility for isolated Codex profiles. Each profile has its own API key, Base URL, model, and launcher.
```

```text
What it does today:

- isolated Codex profiles
- per-profile API key / Base URL / model
- double-clickable launcher apps
- local encrypted API key storage
- basic testing for third-party Responses-compatible APIs

It is an early MVP, and I am looking for real feedback.
```

```text
GitHub:
https://github.com/JqyModi/codex-multi-launcher

Latest release:
https://github.com/JqyModi/codex-multi-launcher/releases/latest

Most useful feedback:
- provider compatibility
- profile isolation workflow
- Windows / multi-account demand
```

Short version:

```text
If you use Codex Desktop with multiple API keys, Base URLs, or Responses-compatible providers, I built a small macOS utility for that.

It creates isolated Codex profiles, each with its own API key / Base URL / model and a double-clickable launcher.

Early MVP, looking for feedback:
https://github.com/JqyModi/codex-multi-launcher
```

## Reddit English Launch

Posting strategy:

- Use Reddit as a feedback channel, not a traffic channel.
- Read subreddit rules before posting. If self-promotion is not allowed, do not post there.
- Prefer a text post over a link post so the value, boundaries, and feedback ask are clear.
- Good candidate communities to evaluate manually: `r/OpenAI`, `r/ChatGPTCoding`, `r/macapps`, `r/LocalLLaMA`.
- Do not cross-post the same wording into many communities on the same day.

Title options:

```text
I built a small macOS utility for isolated Codex Desktop profiles
```

```text
Early MVP: separate API keys, Base URLs, and launchers for Codex Desktop profiles
```

Recommended body:

```markdown
I kept running into a small but annoying Codex Desktop workflow problem:

- one project uses my default OpenAI setup
- another project needs a different API key
- provider testing needs a custom Base URL
- I want separate Codex windows without manually editing config files every time

So I built an early macOS MVP for isolated Codex profiles.

What it does today:

- creates separate Codex profile folders
- stores a per-profile API key locally
- writes per-profile Base URL / model config
- generates a double-clickable launcher app for each profile
- can test basic Responses-compatible third-party providers

It is not a polished commercial app yet. The current build is mainly for macOS, unsigned, and focused on validating whether this workflow is useful to other Codex users.

GitHub:
https://github.com/JqyModi/codex-multi-launcher

Latest release:
https://github.com/JqyModi/codex-multi-launcher/releases/latest

I am especially looking for feedback on:

1. whether the profile isolation matches your workflow
2. which third-party Responses-compatible providers work or fail
3. whether Windows support is important
4. whether multi-account login isolation matters more than API key isolation
5. any confusing step in setup

If this is useful, please open an issue with your environment and provider details:
https://github.com/JqyModi/codex-multi-launcher/issues
```

Short comment to add after posting if needed:

```text
For clarity: this does not modify the original Codex app. It creates separate profile folders and launcher apps so each workspace can carry its own config.
```

## Threads English Launch

Posting strategy:

- Threads should be lighter than Reddit.
- Use one concise post plus one follow-up reply.
- Lead with the workflow pain. Do not over-explain implementation details in the first post.
- Use the landing page or GitHub link. If only one link is allowed to look clean, use GitHub for global developers.

Recommended post:

```text
I built a small macOS MVP for Codex Desktop users who switch between multiple API keys, Base URLs, or Responses-compatible providers.

Each profile gets its own config and a double-click launcher, so you can keep separate Codex windows for different projects.

Early feedback welcome:
https://github.com/JqyModi/codex-multi-launcher
```

Recommended follow-up:

```text
Current scope:

- macOS first
- per-profile API key / Base URL / model
- local encrypted key storage
- separate launcher apps
- basic provider test flow

I am mainly looking for compatibility feedback and whether Windows support should be next.
```

## 中文二次分发稿

来源反馈：

- Linux.do 首发帖已经出现真实需求确认，有用户表示“也有这个需求”。
- 有用户直接询问 Windows 支持。
- 有用户关心是否能以不同账号登录多开，而不只是 API Key 隔离。

二次分发策略：

- 不再重复“我做了一个工具”，改成“首轮反馈后，我准备怎么迭代”。
- 中文平台优先回应 Windows、多账号、第三方 Provider 兼容这三个问题。
- 适合发布在公众号、小红书、知乎想法或 X 中文回复。

推荐标题：

```text
Codex 多开助手首轮反馈：Windows、多账号和第三方接口会怎么做
```

正文骨架：

```markdown
Codex 多开助手发出第一版后，收到的反馈比我预期更集中。

大家最关心的不是“能不能多开”本身，而是三个更具体的问题：

1. 能不能支持 Windows
2. 能不能隔离不同 Codex 账号登录
3. 第三方 Responses 兼容接口到底能兼容到什么程度

当前版本已经能解决 macOS 下的多 Profile、多 API Key、多 Base URL 和双击启动器问题。也就是说，如果你的主要痛点是不同项目使用不同 API 配置，现在可以先试。

但 Windows 和多账号隔离会是后续重点。

我接下来会优先验证：

- Windows 下 Codex 配置目录和启动参数是否能稳定隔离
- 账号登录态是否能跟 `user-data-dir` 完整隔离
- 常见第三方 Provider 的 `/models` 和 Responses 接口兼容情况
- 是否需要 Provider 预设，让新用户不必手填太多配置

如果你已经试过，最希望你反馈两类信息：

- 你的系统、Codex 版本、Provider 和 Base URL
- 你希望它解决 API Key 隔离，还是账号登录隔离

GitHub Issues：
https://github.com/JqyModi/codex-multi-launcher/issues

Release：
https://github.com/JqyModi/codex-multi-launcher/releases/latest
```

## 微信公众号发布稿

标题：

```text
我做了一个 Codex 多开助手：让每个窗口拥有独立 API 配置
```

摘要：

```text
一个面向 Codex 重度用户的 macOS MVP：多 Profile、多 API Key、多 Base URL、第三方 Responses 兼容接口，正在小范围求测。
```

正文：

```markdown
# 我做了一个 Codex 多开助手：让每个窗口拥有独立 API 配置

最近我自己使用 Codex App 时，遇到一个反复出现的小问题：不同项目需要不同 API Key、Base URL 和模型配置。

个人项目可能用官方 OpenAI，工作项目可能走代理，测试时又想接第三方 Responses 兼容接口。每次手动切配置、改环境变量或从命令行指定工作区都能解决，但长期用起来不够顺手，也容易串配置。

所以我做了一个 macOS 小工具：Codex 多开助手。

落地页：
https://jqymodi.github.io/codex-multi-launcher/

GitHub：
https://github.com/JqyModi/codex-multi-launcher

## 它解决什么问题

Codex 多开助手的目标很简单：

> 让每个 Codex 窗口都有自己的 API 配置。

当前版本支持：

- 创建多个隔离的 Codex Profile
- 每个 Profile 独立配置 API Key
- 每个 Profile 独立配置 Base URL
- 每个 Profile 独立配置模型
- 支持第三方 Responses 兼容接口
- 生成可以双击打开的启动器 App

如果你平时只用一个官方账号、一个项目、一个固定配置，可能暂时不需要它。

但如果你经常在不同项目、不同 Key、不同服务商之间切换，这类隔离会明显降低配置混乱的概率。

## 当前版本长什么样

主界面会展示 Profile 列表、当前选中的 Profile、对应的 Provider、Base URL、启动器路径和打开按钮。

建议配图：`docs/marketing-assets/hero-annotated.png`

创建 Profile 时，可以填写 Provider 类型、Provider 名称、Base URL、模型和 API Key。App 会尝试获取 `/models` 模型列表；如果服务商不支持，也可以手动填写模型 ID。

建议配图：`docs/user-manual-assets/03-provider-settings.png`

## 安全和边界

这个版本还是 MVP，所以边界要先说清楚：

- 当前主要面向 macOS Apple Silicon
- App 还没有签名和 notarization，首次打开可能需要手动解除 quarantine
- 第三方接口只按 Responses 兼容接口处理，不保证所有服务商都可用
- API Key 本地保存，不进入诊断报告，也不写入启动脚本

未签名 App 打不开时，可以参考 Release 中的说明：

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

## 现在需要什么反馈

这个阶段我最想收集真实使用反馈，而不是单纯的下载量。

如果你愿意帮忙测，最有价值的是这些信息：

- macOS 版本
- Codex App 版本
- 使用官方 OpenAI、自建代理，还是第三方兼容接口
- Base URL 是否以 `/v1` 结尾
- 是否能成功创建 Profile
- 是否能成功打开独立 Codex
- 哪一步让你困惑或失败
- 你希望后续增加哪些 Provider 预设或工作流能力

反馈入口优先使用 GitHub Issues：

https://github.com/JqyModi/codex-multi-launcher/issues

这样问题、复现步骤和修复状态都能持续跟踪。

## 下载

落地页：
https://jqymodi.github.io/codex-multi-launcher/

Release：
https://github.com/JqyModi/codex-multi-launcher/releases/latest

如果你正在用 Codex App，并且确实有多 API Key、多 Base URL 或第三方 Responses 接口需求，欢迎帮忙试用。后续我会把兼容情况、常见问题和版本更新整理在公众号里。
```

排版备注：

- 公众号首图建议使用 `docs/marketing-assets/hero-annotated.png`。
- 正文中间插入 `docs/marketing-assets/codex-workflow-demo.gif` 或视频。
- 末尾可以放公众号二维码，但不替代 GitHub Issues 反馈入口。
- 语气保持“早期求测”，不要承诺兼容所有第三方服务商。
