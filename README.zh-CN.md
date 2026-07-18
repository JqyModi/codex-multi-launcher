[English](README.md) | [简体中文](README.zh-CN.md)

# Codex Multi Launcher（Codex 多开助手）

**Codex 多开助手**是一款支持 macOS 和 Windows 的 Codex / ChatGPT 桌面多开与配置管理工具。每个配置都可以使用独立的 ChatGPT 账号、API Key、接口地址、模型、应用数据和指定历史对话。

[![最新版本](https://img.shields.io/github/v/release/JqyModi/codex-multi-launcher?display_name=tag)](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
[![累计下载](https://img.shields.io/github/downloads/JqyModi/codex-multi-launcher/total)](https://github.com/JqyModi/codex-multi-launcher/releases)
[![问题反馈](https://img.shields.io/github/issues/JqyModi/codex-multi-launcher)](https://github.com/JqyModi/codex-multi-launcher/issues)

- [产品官网](https://jqymodi.github.io/codex-multi-launcher/)
- [下载最新版](https://github.com/JqyModi/codex-multi-launcher/releases/latest)
- [查看用户手册](https://jqymodi.github.io/codex-multi-launcher/manual.html)
- [反馈问题](https://github.com/JqyModi/codex-multi-launcher/issues)

![Codex 多开助手工作台](https://raw.githubusercontent.com/JqyModi/codex-multi-launcher/main/user-manual-assets/01-dashboard.png)

## 为什么需要它

只使用一个账号和一套配置时，Codex 桌面版已经足够好用。但这些场景会变得麻烦：

- 工作、个人和不同服务商的 Codex 窗口需要同时打开；
- 希望不同窗口登录不同 ChatGPT 账号，互不影响登录状态；
- 需要在官方账号、OpenAI API Key 和第三方 Responses 兼容接口之间切换；
- 创建隔离配置时，希望保留指定项目或临时任务的历史对话；
- 不想反复修改 `config.toml`、环境变量和启动参数。

Codex 多开助手将这些操作整理成了可视化创建流程。

## 主要功能

- 创建多个相互隔离的 Codex / ChatGPT 桌面配置。
- 每个配置可选择 ChatGPT 账号登录或 API Key 模式。
- 独立配置 API Key、接口地址、模型和服务商名称。
- 按需同步项目对话、临时任务对话或全部历史对话。
- 支持从源 App 和已有多开配置中选择历史来源。
- 每个配置独立使用 `CODEX_HOME` 和 `--user-data-dir`。
- 在主程序中直接打开对应的独立窗口。
- 支持应用内检查、下载和安装更新。
- API Key 本地加密保存，不进入诊断信息。
- 保留 Codex 全局状态、新增项目和历史对话，重启后不会被重复初始化。

## 系统支持

| 系统 | 安装包 | 发布状态 |
| --- | --- | --- |
| macOS Apple Silicon | arm64、universal | 已使用 Developer ID 签名并完成 Apple 公证 |
| macOS Intel | x64、universal | 已使用 Developer ID 签名并完成 Apple 公证 |
| Windows x64 | 安装版、便携版 | 已提供，当前暂未签名 |

请从 [Latest Release](https://github.com/JqyModi/codex-multi-launcher/releases/latest) 下载适合当前设备的版本。

## 两种登录方式

### ChatGPT 账号登录

创建独立窗口后，在窗口内登录 ChatGPT Plus、Pro 或其他可用账号。这个模式不要求填写接口地址和 API Key，也不会覆盖其他配置中的账号登录状态。

### API Key

支持官方 OpenAI API 和实现了 Responses API 的第三方兼容接口。是否可用取决于服务商的实际接口能力；只支持 Chat Completions 的接口不一定能在 Codex 桌面版中使用。

## 历史对话同步

创建配置时可以选择：

- 仅同步项目对话；
- 仅同步临时任务对话；
- 同步全部支持的对话；
- 从源 App 或一个、多个已有配置中同步。

同步完成后，新配置拥有自己独立的历史副本，后续新对话不会反向影响来源配置。

## 本地开发

```bash
npm install
npm run dev
```

运行检查：

```bash
npm run typecheck
npm run verify:e2e
```

构建安装包：

```bash
npm run package:mac:arm64
npm run package:win:x64
```

产物会输出到 `dist-app/`。

## 项目文档

- [产品需求](docs/PRD.md)
- [技术规格](docs/TECH_SPEC.md)
- [配置结构](docs/CONFIG_SCHEMA.md)
- [第三方接口兼容说明](docs/PROVIDER_COMPATIBILITY.md)
- [历史对话迁移说明](docs/session-history-migration.zh-CN.md)
- [发布检查清单](docs/RELEASE_CHECKLIST.md)

## 安全与隐私

- API Key 使用本地加密文件保存。
- API Key 不会写入启动脚本或诊断报告。
- ChatGPT 账号凭证仍由官方 Codex / ChatGPT App 管理。
- 每个配置使用独立的本地应用数据和 Codex 数据目录。

提交公开 Issue 时，请不要附带 API Key、账号 Cookie 或私人对话内容。

## 问题反馈

请通过 [GitHub Issues](https://github.com/JqyModi/codex-multi-launcher/issues) 反馈 Bug 和功能建议。建议附带应用版本、操作系统、Codex / ChatGPT 版本、登录方式、复现步骤和 App 内复制的诊断信息。

## 声明

Codex Multi Launcher 是独立的社区项目，与 OpenAI 不存在隶属、授权、赞助或官方合作关系。Codex、ChatGPT 和 OpenAI 等名称及商标归其权利人所有。
