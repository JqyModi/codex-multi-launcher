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
- 目前是 MVP，不是正式商业版本

未签名 App 如果打不开，可以参考 Release 说明里的命令：

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

## 现在最想求测什么

我现在最需要的不是泛下载量，而是真实使用反馈，尤其是这些点：

1. 你的 macOS 版本下能否正常启动
2. 是否能成功创建多个独立 Profile
3. 多个 Profile 的 API Key / Base URL / 模型是否符合你的工作流
4. 第三方 Responses 兼容接口能否正常测试和对话
5. 哪一步让你困惑、不敢填或失败
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

如果你正在用 Codex App，并且有多 API Key、多 Base URL 或第三方 Responses 兼容接口的需求，欢迎帮忙测一下。
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
