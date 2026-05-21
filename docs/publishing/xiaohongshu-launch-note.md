# 小红书首发笔记草稿

目标：用更强的痛点共鸣切入，吸引正在使用 Codex、Cursor、Claude Code、Trae 等 AI 编程工具的用户点进来。小红书不是技术论坛，首屏必须先讲“真实麻烦”，再给解决方案。

## 发布定位

- 平台：小红书
- 目标用户：AI 编程工具重度用户、独立开发者、经常切换 API Key / Base URL / 模型的人
- 内容风格：强共鸣、轻技术、明确边界、邀请测试
- 转化目标：访问落地页、下载测试版、提交 GitHub Issue 或评论反馈
- 链接策略：正文中写“项目名：Codex 多开助手”，评论区或简介放链接；如果平台限制外链，改成“GitHub 搜 codex-multi-launcher”

## 首选标题

```text
用 Codex 最崩溃的瞬间：不是模型不行，是配置又串了
```

## 备选标题

1. `Codex 用户的扎心现实：API Key 多了以后，配置管理才是噩梦`
2. `我做了个 Codex 多开助手，专治 API Key / Base URL 来回切`
3. `别再手动改 Codex 配置了，每个窗口就该有自己的 API Key`
4. `一个 Codex 窗口不够用？真正麻烦的是每个项目配置都不一样`
5. `如果你也有多个 API Key，Codex 现在确实不太够用`

## 封面文案

推荐封面 1：

```text
Codex 配置又串了？
每个窗口都该有自己的 API Key
```

推荐封面 2：

```text
多个 API Key
多个 Base URL
Codex 怎么优雅多开？
```

推荐封面 3：

```text
别再手动改 config.toml
我做了个 Codex 多开助手
```

## 素材建议

- 首图：`docs/marketing-assets/hero-annotated.png`
- 视频：`docs/marketing-assets/codex-workflow-demo.mp4`
- 图文顺序建议：
  1. 封面图：突出“配置又串了 / 多 API Key / Codex 多开”
  2. 主界面截图：展示 Profile 列表和 Open 按钮
  3. Provider 配置截图：展示 Base URL、模型、API Key
  4. 演示视频：创建 Profile 到打开 Codex 的流程

## 已生成小红书配图

输出目录：`docs/publishing/xiaohongshu-assets/`

建议发布顺序：

1. `cover.png`：封面，主打“不是模型不行，是配置又串了”。
2. `symptoms.png`：痛点卡，解释为什么多 API Key / 多 Base URL 会变成日常摩擦。
3. `solution.png`：方案卡，展示一个 Profile 就是一套独立工作区。
4. `compat.png`：边界卡，说清 Responses 兼容、API Key 本地加密和模型填写逻辑。
5. `action.png`：反馈卡，引导用户提供服务商、Base URL、模型 ID 和 Windows / 多账号隔离需求。

设计主题：`apple-product-narrative`。封面和内容卡均为 `1080x1440`，适合小红书竖图发布。

## 正文版本 A：强共鸣版

```text
用 Codex 最崩溃的瞬间，可能不是模型不行。

而是你有多个项目、多个 API Key、多个 Base URL，结果每次都在来回改配置。

今天这个项目用官方 OpenAI。
明天那个项目走第三方 Responses 兼容接口。
后天又想测另一个中转站。

最后就变成：

打开 Codex 前先想一遍现在到底是哪套配置。
切项目之前先备份 config.toml。
换 API Key 之后还要担心会不会影响另一个窗口。

这件事很小，但每天重复几次真的很烦。

所以我做了一个小工具：Codex 多开助手。

它解决的不是“多开炫技”，而是让每个 Codex 窗口都有自己的独立配置：

- 独立 API Key
- 独立 Base URL
- 独立模型
- 独立 CODEX_HOME
- 独立 user-data-dir
- 每个 Profile 都生成一个可双击打开的启动器 App

如果你有多个 API Key，或者经常在官方 OpenAI、自建代理、第三方 Responses 兼容接口之间切换，这个工具应该能省掉不少重复操作。

当前状态也说清楚：

- 目前是 macOS MVP 测试版
- 未签名，首次打开可能需要手动解除 macOS quarantine
- 主要支持官方 OpenAI API 和第三方 Responses 兼容接口
- 只支持 Chat Completions 或原生 API 的服务商不一定可用
- Windows 和多账号登录隔离还在验证

我现在最想收集真实反馈：

1. 你的第三方接口能不能跑通
2. 哪些服务商兼容，哪些不兼容
3. Windows 是否是刚需
4. 多账号登录隔离是否比 API Key 隔离更重要
5. 哪一步让你觉得困惑

项目名：Codex 多开助手
GitHub 搜：codex-multi-launcher

如果你也被 Codex 多配置折磨过，可以试一下，也欢迎把报错和使用场景丢给我。
```

## 正文版本 B：制造冲突版

```text
Codex 很强，但它现在有个很现实的问题：

当你有多个 API Key、多个 Base URL、多个项目时，它的配置管理会开始拖后腿。

很多人说“命令行启动一下就好了”。

但问题是，工具不是只给会折腾的人用的。

一个普通用户只是想：

- A 项目用官方 OpenAI
- B 项目用第三方 Responses 兼容接口
- C 项目用另一个 API Key
- 每个窗口不要互相污染
- 最好双击就能打开

这不应该靠记命令、改配置、手动备份来解决。

所以我做了一个 macOS 小工具：Codex 多开助手。

它可以创建多个独立 Codex Profile，每个 Profile 都有自己的：

- API Key
- Base URL
- 模型
- CODEX_HOME
- user-data-dir
- 双击启动器 App

它不会修改原 Codex App。
API Key 本地加密保存。
诊断报告不会包含 API Key。

目前它还是 MVP，不是成熟商业软件。

我更想先验证这个需求到底有多真实：

- 你是否也需要多个 Codex 窗口
- 你是否也有多个 API Key
- 你是否需要接入智谱、DeepSeek、通义、Kimi、OpenRouter 或自建中转
- 你更需要 API Key 隔离，还是账号登录隔离

项目名：Codex 多开助手
GitHub 搜：codex-multi-launcher

如果你正好踩过这个坑，欢迎试用，也欢迎直接提问题。
```

## 正文版本 C：扎心现实版

```text
AI 编程工具用久了以后，你会发现一个很扎心的现实：

真正浪费时间的，往往不是写代码。

而是这些小事：

- 这个项目该用哪个 API Key
- 这个 Base URL 有没有切回去
- 这个模型 ID 到底填哪个
- 改完 config.toml 会不会影响另一个窗口
- 想同时开两个 Codex，却发现配置会混在一起

这些问题单独看都不大。

但每天反复出现，就会变成工作流里的摩擦。

我最近做了一个小工具，叫 Codex 多开助手。

它的目标很简单：

让每个 Codex 窗口都有自己的配置。

一个窗口用官方 OpenAI。
一个窗口用第三方 Responses 兼容接口。
一个窗口专门跑某个项目。
一个窗口专门测试某个中转站。

互不影响，双击启动。

当前已经支持：

- 创建多个独立 Profile
- 每个 Profile 配置独立 API Key / Base URL / 模型
- 尝试从 /models 获取模型列表
- 获取不到模型列表时手动填写
- 生成可双击打开的启动器 App
- API Key 本地加密保存
- 复制诊断时不包含 API Key

当前还没完全解决：

- Windows 适配
- 多账号登录隔离验证
- 所有第三方 Provider 的兼容列表

项目名：Codex 多开助手
GitHub 搜：codex-multi-launcher

如果你也是 Codex 重度用户，尤其是手里有多个 API Key 或多个 Base URL，可以帮忙测一下。
我最需要的不是夸它好用，而是真实告诉我：哪里跑不通、哪里看不懂、哪些 Provider 不兼容。
```

## 评论区置顶建议

```text
补充说明：

1. 当前主要是 macOS 测试版。
2. 第三方服务商需要提供 OpenAI/Responses 兼容入口，原生 API 不一定可用。
3. GitHub 搜 codex-multi-launcher 可以找到项目、下载和 Issues。
4. 如果你愿意反馈，请带上服务商、Base URL 是否以 /v1 结尾、模型 ID 和报错信息，不要发 API Key。
```

## 标签建议

```text
#Codex
#AI编程
#独立开发
#程序员工具
#效率工具
#AI工具
#OpenAI
#Mac软件
```

## 发布建议

- 首发推荐使用版本 A，情绪共鸣最强，也更像小红书用户会停留阅读的开头。
- 标题使用“用 Codex 最崩溃的瞬间：不是模型不行，是配置又串了”。
- 封面使用“Codex 配置又串了？每个窗口都该有自己的 API Key”。
- 正文不要直接说“Linux.do 被删”，避免把注意力带偏到平台审核。
- 评论区再补 GitHub 搜索方式和兼容边界，降低正文外链导致的限流风险。
