[English](README.md) | 中文

# Codex 多开助手

Codex 多开助手是一个面向 macOS 的小工具，用来创建多个彼此隔离的 Codex 桌面窗口，并为每个窗口配置独立的 API Key、Base URL、模型和启动器。

这个仓库用于：

- 发布产品落地页和用户手册；
- 通过 GitHub Issues 收集早期试用反馈；
- 通过 GitHub Releases 分发 macOS 测试版安装包。

## 在线访问

- 落地页：<https://jqymodi.github.io/codex-multi-launcher/>
- 用户手册：<https://jqymodi.github.io/codex-multi-launcher/manual.html>
- 问题反馈：<https://github.com/JqyModi/codex-multi-launcher/issues>
- 下载测试版：<https://github.com/JqyModi/codex-multi-launcher/releases/latest>

## 当前能力

- 创建独立 `CODEX_HOME` 和 `user-data-dir`。
- 生成可双击打开的 Codex 启动器 App。
- 支持官方 OpenAI API Key 和第三方 Responses 兼容接口。
- 可尝试通过 `/models` 获取模型列表。
- `/models` 不可用时仍保留手动填写模型。
- API Key 本地加密保存。
- 诊断信息不包含 API Key。

## 试用边界

当前版本主要面向 macOS Apple Silicon。

App 暂未签名和 notarization，首次打开可能需要手动解除 quarantine：

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

Windows 版本在技术上可适配，但当前启动器生成、路径检测和 Codex App 探测仍以 macOS 为主。

## 反馈建议

如果你试用了这个工具，欢迎提交 GitHub Issue：

<https://github.com/JqyModi/codex-multi-launcher/issues>

建议反馈时包含：

- macOS 版本和芯片架构；
- Codex App 版本；
- 使用官方 API Key 还是第三方 Responses 兼容接口；
- Base URL 是否以 `/v1` 结尾；
- App 内复制的诊断报告；
- 可复现步骤和截图。

## 致谢

感谢 [LinuxDo](https://linux.do/) 社区的支持。

