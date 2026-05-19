# 知乎二次分发稿

## 发布形式

优先发知乎文章。知乎更适合问题解决型标题和清晰边界说明，不建议只发短想法。

## 推荐标题

```text
Codex 如何同时管理多个 API Key、Base URL 和独立窗口？
```

备选标题：

```text
我做了一个 Codex 多开助手，第一批用户最关心的不是多开
```

## 摘要

```text
一个 macOS 小工具的早期求测记录：它解决的是 Codex 重度用户在多项目、多 API Key、多 Base URL 和第三方 Responses 接口之间切换时的配置隔离问题。
```

## 正文

```markdown
最近做了一个 macOS 小工具：Codex 多开助手。

第一版发出去后，我发现大家真正关心的不是“能不能多开”，而是几个更具体的工作流问题：

- Windows 能不能支持？
- 能不能隔离不同 Codex 账号登录？
- 第三方 Responses 兼容接口到底能不能稳定用？
- 多个项目、多个 API Key、多个 Base URL 会不会串配置？

这说明这个需求不是单纯的“多开”，而是 Codex 重度用户在真实工作里遇到的配置隔离问题。

## 我为什么做这个工具

我自己用 Codex App 时，经常会遇到这些情况：

- 个人项目和工作项目用不同 API Key
- 有些项目走官方 OpenAI，有些项目走自建代理或第三方 Base URL
- 想测试第三方 Responses 兼容接口
- 希望同时开多个 Codex 窗口处理不同 repo

这些问题理论上都能用命令行参数、环境变量或手动改配置解决，但长期使用很容易串配置，也不适合不熟悉命令行的用户。

所以我把它做成了图形化流程：创建 Profile、填写 Provider、测试接口、生成启动器，然后双击打开对应的 Codex 窗口。

## 当前版本已经能做什么

现在的 macOS MVP 主要支持：

- 创建多个隔离的 Codex Profile
- 每个 Profile 独立保存 API Key
- 每个 Profile 独立配置 Base URL 和模型
- 为每个 Profile 生成可双击打开的启动器 App
- 支持第三方 Responses 兼容接口的基础测试
- 尝试读取 `/models` 列表，读取不到时允许手动填写模型
- API Key 本地保存，诊断报告不包含密钥

如果你的主要需求是让不同项目使用不同 API Key / Base URL，这个版本已经可以试。

## 当前边界

这个版本还是 MVP，所以边界也要说清楚：

- 当前主要面向 macOS
- App 还没有签名和 notarization，首次打开可能需要手动解除限制
- Windows 需要单独验证 Codex 配置路径、启动参数和安装方式
- 多账号登录隔离需要进一步确认登录态是否完整跟 `user-data-dir` 分离
- 第三方 Provider 只能按 Responses 兼容接口做验证，不承诺全部兼容

## 接下来优先验证什么

我准备把后续迭代分成三条线：

1. Windows 可行性验证
   - 确认 Codex 在 Windows 下的配置目录和启动参数。
   - 验证能否生成类似的独立启动器。

2. 多账号登录隔离验证
   - 当前重点是 API Key、Base URL 和模型隔离。
   - 后续会验证不同 Codex 登录账号能否稳定隔离。

3. Provider 兼容列表
   - 记录哪些第三方 Responses 兼容接口可用。
   - 如果 `/models` 可获取模型列表，就直接提供选择。
   - 如果获取不到，保留手动填写模型 ID。

## 我现在最需要的反馈

如果你愿意帮忙测试，最有价值的不是“能不能打开”，而是这些信息：

- 你的系统：macOS / Windows
- Codex App 版本
- 你使用官方 OpenAI、自建代理，还是第三方兼容接口
- Base URL 是否以 `/v1` 结尾
- 是否成功创建并打开独立 Profile
- 你更需要 API Key 隔离，还是不同 Codex 账号登录隔离
- 哪一步让你困惑或失败

项目地址：
https://github.com/JqyModi/codex-multi-launcher

下载：
https://github.com/JqyModi/codex-multi-launcher/releases/latest

反馈入口：
https://github.com/JqyModi/codex-multi-launcher/issues
```

## 配图

建议插入：

1. `docs/marketing-assets/hero-annotated.png`
2. `docs/marketing-assets/codex-workflow-demo.gif` 或 `docs/marketing-assets/codex-workflow-demo.mp4`

## 标签建议

```text
Codex
OpenAI
AI 编程
开发工具
效率工具
```

## 发布前检查

- 标题是否是问题解决型，而不是单纯产品名。
- GitHub、Release、Issues 链接是否可点击。
- 图片是否没有隐私路径、真实 API Key 或无关项目名。
- 末尾是否明确要求具体反馈。

