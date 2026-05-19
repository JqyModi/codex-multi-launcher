# 中文二次分发稿

## 推荐标题

```text
Codex 多开助手首轮反馈：大家真正关心的是 Windows、多账号和第三方接口
```

## 适用平台

- 微信公众号：使用长文版，可加入主视觉图和演示 GIF。
- 知乎文章：使用长文版，标题可改成问题式。
- 知乎想法 / 小红书：使用短版，配主视觉图或 20-40 秒流程视频。

## 长文版

```markdown
# Codex 多开助手首轮反馈：大家真正关心的是 Windows、多账号和第三方接口

Codex 多开助手发出第一版后，我发现一个很有意思的现象：

大家并不是在问“这个工具酷不酷”，而是在问几个非常具体的使用问题。

- Windows 能不能用？
- 能不能隔离不同 Codex 账号登录？
- 第三方 Responses 兼容接口到底能兼容到什么程度？
- 多个项目、多个 API Key、多个 Base URL 会不会串配置？

这说明这个需求不是单纯的“多开”，而是 Codex 重度用户在真实工作流里遇到的配置隔离问题。

## 当前版本已经解决什么

现在的 macOS MVP 主要解决这几件事：

- 创建多个隔离的 Codex Profile
- 每个 Profile 独立保存 API Key
- 每个 Profile 独立配置 Base URL 和模型
- 为每个 Profile 生成可双击打开的启动器 App
- 支持第三方 Responses 兼容接口的基础测试
- API Key 本地保存，诊断报告不包含密钥

如果你只是想让不同项目使用不同 API Key / Base URL，这个版本已经可以试。

## 还没有解决什么

我也把当前边界说清楚：

- 现在主要是 macOS 版本
- App 还没有签名和 notarization
- Windows 需要单独验证 Codex 配置路径、启动参数和安装方式
- 多账号登录隔离需要进一步确认登录态是否完全跟 `user-data-dir` 分离
- 第三方 Provider 只能按 Responses 兼容接口做验证，不承诺全部兼容

## 接下来优先做什么

我准备把后续迭代分成三条线：

1. Windows 可行性验证
   - 先确认 Codex 在 Windows 下的配置目录和启动参数。
   - 再验证能否生成类似的独立启动器。

2. 多账号登录隔离验证
   - 现在版本重点是 API Key、Base URL 和模型隔离。
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

## 短版

```text
Codex 多开助手第一版发出去后，反馈最集中的不是“怎么多开”，而是三个更真实的问题：

1. Windows 能不能支持？
2. 能不能隔离不同 Codex 账号登录？
3. 第三方 Responses 兼容接口到底能不能稳定用？

这也说明它真正解决的不是“多开炫技”，而是 Codex 重度用户的配置隔离问题：不同项目、不同 API Key、不同 Base URL、不同模型，不想来回手动改配置。

当前 macOS MVP 已经支持多 Profile、独立 API Key / Base URL / 模型、双击启动器和基础 Provider 测试。

接下来会优先验证 Windows、多账号登录隔离和 Provider 兼容列表。

项目开源求测：
https://github.com/JqyModi/codex-multi-launcher
```

## 素材建议

- 主视觉：`docs/marketing-assets/hero-annotated.png`
- 流程视频：`docs/marketing-assets/codex-workflow-demo.mp4`
- GIF 备选：`docs/marketing-assets/codex-workflow-demo.gif`

