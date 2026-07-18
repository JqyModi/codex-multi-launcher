[English](README.md) | [简体中文](README.zh-CN.md)

# Codex Multi Launcher（Codex 多开助手）

在 macOS 和 Windows 上同时运行多个相互隔离的 Codex / ChatGPT 桌面配置。每个配置都可以使用独立的 ChatGPT 账号、API Key、接口地址、模型、应用数据和指定历史对话。

[![最新版本](https://img.shields.io/github/v/release/JqyModi/codex-multi-launcher?display_name=tag)](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
[![累计下载](https://img.shields.io/github/downloads/JqyModi/codex-multi-launcher/total)](https://github.com/JqyModi/codex-multi-launcher/releases)
[![Stars](https://img.shields.io/github/stars/JqyModi/codex-multi-launcher)](https://github.com/JqyModi/codex-multi-launcher/stargazers)

- [产品官网](https://jqymodi.github.io/codex-multi-launcher/)
- [下载最新版](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
- [用户手册](https://jqymodi.github.io/codex-multi-launcher/manual.html)
- [问题反馈](https://github.com/JqyModi/codex-multi-launcher/issues)

<p align="center">
  <img alt="Codex 多开助手工作台" src="https://raw.githubusercontent.com/JqyModi/codex-multi-launcher/main/user-manual-assets/01-dashboard.png" width="980">
</p>

## 它解决什么问题

- 同时打开工作、个人和不同服务商的 Codex 窗口。
- 在不同窗口登录不同 ChatGPT 账号，登录状态互不影响。
- 在账号登录、官方 OpenAI API Key 和第三方 Responses 兼容接口之间切换。
- 创建新配置时同步指定项目或临时任务的历史对话。
- 不再手动修改 `config.toml`、环境变量和启动参数。

## 当前功能

- 每个配置独立使用 `CODEX_HOME` 和 `--user-data-dir`。
- 支持 ChatGPT 账号登录与 API Key 两种方式。
- 独立设置 API Key、接口地址、模型和服务商。
- 从源 App 或已有多开配置中同步历史对话。
- 可选仅项目、仅临时任务或全部支持的历史范围。
- 支持应用内检查、下载和安装更新。
- API Key 本地加密保存，诊断信息自动脱敏。
- macOS arm64、x64 和 universal 包已签名并完成 Apple 公证。
- 提供 Windows x64 安装版和便携版。

## 下载

请从 [最新版发布页](https://github.com/JqyModi/codex-multi-launcher/releases/latest) 选择对应安装包：

| 系统 | 安装包 |
| --- | --- |
| Apple Silicon Mac | arm64 或 universal macOS zip |
| Intel Mac | x64 或 universal macOS zip |
| Windows x64 | 安装版或便携版 exe |

Windows 安装包目前暂未签名；macOS 安装包已经过 Developer ID 签名和 Apple 公证。

## 使用与排错

- [多个 ChatGPT 账号同时登录](https://jqymodi.github.io/codex-multi-launcher/features/multiple-accounts/)
- [历史对话同步](https://jqymodi.github.io/codex-multi-launcher/features/session-sync/)
- [Windows 安装与排错](https://jqymodi.github.io/codex-multi-launcher/guides/windows/)
- [自定义接口地址和第三方 API](https://jqymodi.github.io/codex-multi-launcher/guides/custom-base-url/)

## 问题反馈

请通过 [GitHub Issues](https://github.com/JqyModi/codex-multi-launcher/issues) 反馈，并附带应用版本、操作系统、Codex / ChatGPT 版本、登录方式、复现步骤和 App 内复制的诊断信息。

请勿公开 API Key、账号 Cookie 或私人对话内容。

## 声明

Codex Multi Launcher 是独立社区项目，与 OpenAI 不存在隶属、授权、赞助或官方合作关系。
