[English](README.md) | 中文

# Codex 多开助手

Codex 多开助手是一个 macOS 桌面工具，用来创建和管理相互隔离的 Codex App Profile。每个 Profile 都可以拥有独立的 API Key、Base URL、模型、`CODEX_HOME` 和 `--user-data-dir`，让多个 Codex 桌面窗口可以并行运行且互不串配置。

产品页：<https://jqymodi.github.io/codex-multi-launcher/>

## 为什么做

如果你只使用一个账号和一套 API 配置，Codex App 本身已经足够好用。真正的痛点通常出现在这些场景：

- 不同项目使用不同 API Key；
- 有些项目走官方 OpenAI，有些走第三方 Responses 兼容接口；
- 需要测试代理或中转站的不同 Base URL；
- 希望同时打开多个 Codex 桌面窗口处理不同仓库。

这个项目把原本需要手动改配置、切环境变量、写命令行启动参数的流程，整理成一个图形化工具。

## 功能

- 创建多个隔离的 Codex Profile。
- 为每个 Profile 独立配置 API Key、Base URL、模型和 Provider 名称。
- 支持第三方 OpenAI Responses 兼容接口。
- 尝试从 Provider 的 `/models` 接口获取可用模型。
- 为每个 Profile 生成可双击打开的启动器 App。
- API Key 本地加密保存，不进入诊断报告。
- 写入 Codex `config.toml` 前自动备份。
- 支持从 UI 恢复或彻底删除已移除的 Profile。

## 当前状态

当前版本仍是 MVP 测试版。

- 主要平台：macOS Apple Silicon。
- 当前 Provider 目标：OpenAI API 和第三方 Responses 兼容 API。
- MVP 暂不支持：只兼容 Chat Completions 的 Provider。
- 分发状态：未签名本地构建，首次启动可能会触发 macOS 安全提示。

## 下载

从最新 Release 下载测试版：

<https://github.com/JqyModi/codex-multi-launcher/releases/latest>

如果解压后 macOS 阻止打开，可以手动移除 quarantine：

```bash
xattr -dr com.apple.quarantine "/Applications/Codex 多开助手.app"
```

这只是当前未签名 MVP 的临时处理方式。正式公开分发应使用 Developer ID 签名和 notarization。

## 本地开发

安装依赖并本地运行：

```bash
npm install
npm run start
```

构建本地 macOS 包：

```bash
npm run package:mac
```

构建产物会输出到 `dist-app/`。

## 文档

- [PRD](docs/PRD.md)：产品范围、用户故事、成功指标和风险。
- [技术规格](docs/TECH_SPEC.md)：Codex Profile 隔离、启动器生成、Provider 配置、密钥和诊断。
- [配置结构](docs/CONFIG_SCHEMA.md)：Profile registry、加密密钥和生成的 Codex 配置。
- [用户流程](docs/USER_FLOW.md)：创建向导、Provider 测试、主界面、编辑和删除流程。
- [设计系统](docs/DESIGN_SYSTEM.md)：macOS 工具型应用的视觉方向、布局、色彩、字体和组件。
- [用户手册](docs/USER_MANUAL.md)：带截图的安装、创建 Profile、配置 Provider 和排障说明。
- [落地页](docs/landing/index.html)：用于 GitHub Pages 的静态产品页。
- [发布检查清单](docs/RELEASE_CHECKLIST.md)：测试版发布和收集反馈前的检查项。

## 反馈

请优先通过 GitHub Issues 反馈问题和需求：

<https://github.com/JqyModi/codex-multi-launcher/issues>

建议反馈时带上：

- macOS 版本；
- Codex App 版本；
- Provider 类型：官方 OpenAI、自建代理或第三方兼容接口；
- Base URL 是否以 `/v1` 结尾；
- 是否成功创建 Profile 并打开启动器；
- 具体报错信息或卡住的步骤。

## 致谢

感谢 [LinuxDo](https://linux.do/) 社区的支持。

