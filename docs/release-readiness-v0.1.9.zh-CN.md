# v0.1.9 订阅版本上线就绪记录

更新时间：2026-08-11（Asia/Shanghai）

本文记录 v0.1.9 候选版本的可复验证据、真实支付验收步骤和剩余发布门槛。通用检查项仍以 [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) 为准。

## 版本基线

| 项目 | 基线 |
| --- | --- |
| 桌面端分支 | `jqy/sub2api-desktop-auth` |
| 桌面端候选源码 | `363655b` |
| Sub2API 分支 | `jqy/desktop-auth` |
| Sub2API 生产源码 | `2cd3cb5` |
| 桌面版本 | `0.1.9` |
| 构建工具 | Node.js `24.14.0`、npm `11.6.2`、electron-builder `26.8.1` |
| 生产地址 | `https://sub2api.minai.eu.org` |

`electron-builder` 和 `wait-on` 均使用精确版本。`wait-on` 固定为 `9.0.3`，避免 `9.0.6` 发布包意外携带约 128 MB 模型缓存导致安装变慢和磁盘占用异常。

## 已通过证据

### Sub2API 生产环境

- 部署前备份：`/opt/sub2api/backups/rolling/daily-20260811T084659Z`。
- `sub2api`、PostgreSQL、Redis 容器均为 `healthy`。
- 数据库存在 `subscription_plans.max_sales`、`subscription_plans.per_user_limit` 和 `growth_events`。
- 四档首发总销量上限已生效：轻量版 5、标准版 5、高频版 2、重度版 1。
- 单用户限购为 0，允许同套餐正常续期。
- 管理端套餐页已显示 `0 / 5`、`0 / 5`、`0 / 2`、`0 / 1`。
- 管理端支付概览已显示 7/30/90 天订阅转化漏斗。
- 匿名事件接口会拒绝非法事件，未开放任意事件写入。

### 桌面端自动验证

以下命令已在干净的 `npm ci` 依赖树上通过：

```bash
npm run typecheck
npm run verify:subscription-auth
npm run verify:subscription-profile
npm run verify:subscription-reauth
npm run verify:e2e
npm run verify:paths
npm run verify:win-launcher
npm run verify:win-inheritance
npm run verify:win-profile-create
npm run verify:win-session-sync
npm run verify:release-candidate
```

候选包审计确认：

- macOS 与 Windows `app.asar` 内版本均为 `0.1.9`。
- 两个平台 `app.asar` 文件数量均为 4,276。
- 未包含 `.env`、日志、私钥、证书或凭据配置文件。
- `latest.yml` 与 `latest-mac.yml` 均指向 `0.1.9`。

GitHub Actions 已在真实 Windows runner 对当前候选提交完成同一套验证：[Run 31492514919](https://github.com/JqyModi/codex-multi-launcher/actions/runs/31492514919)。其中包括安装版/便携版构建、Windows Profile 创建与清理、线程历史同步、可见主窗口烟测和截图上传；烟测日志确认窗口标题为 `Codex Profile Manager`，进程在窗口出现后继续存活。

### 本地候选产物

| 产物 | SHA-256 |
| --- | --- |
| `Codex-Profile-Manager-Setup-0.1.9-x64.exe` | `d4cdc9778df0d133bffdaa94ab0484df7ec5780232b93eabddec1dc2103ca873` |
| `Codex-Profile-Manager-Portable-0.1.9-x64.exe` | `bbb221cf6d698e85e44e1329d6f6803f838b22cce9e21aee1ee6a51701e58ee1` |
| `codex-profile-manager-0.1.9-x64-mac.zip` | `45641e9e34b6be44db37db933b537a1a51992aebb6fd3ccb91365d426f8f8fef` |

完整清单位于构建目录的 `SHA256SUMS-v0.1.9.txt`。候选产物重新构建后必须重新运行 `npm run verify:release-candidate`，不能沿用旧哈希。

### macOS x64 本机功能回归

- 在 Intel Mac 上使用隔离的 Profile 管理目录和 Electron 用户数据目录启动 `dist-app/mac/Codex 多开助手.app`。
- 主窗口标题为 `Codex Profile Manager`，空白新用户工作台渲染完整，无白屏、错误弹窗、布局重叠或异常退出。
- 主进程和 Renderer/GPU/Network 子进程持续存活约 4 分钟后由验收进程主动关闭。
- `codesign` 显示当前候选仍为 ad-hoc 签名、无 TeamIdentifier；该结果只证明本机功能回归，不满足正式分发签名门槛。

## 全新用户真实验收

### 测试身份

- 使用从未在 Sub2API 注册过的邮箱或 Gmail `+` 别名。
- 不在文档、截图或 Issue 中记录密码、验证码、支付资料、API Key。
- 记录注册时间、订单号、套餐名称和 Profile 名称，便于后台关联。

### 主流程

开始真实支付前，先在仓库根目录启动完整授权验收进程。该进程会保留 PKCE 会话，并在支付授权成功后直接创建 Profile；不会输出 API Key 或 access token：

```bash
npm run acceptance:subscription:production -- \
  --confirm-production \
  --profile-name "Subscription Acceptance" \
  --timeout-minutes 10
```

把命令输出的授权 URL 打开在验收用户已登录的浏览器中。必须保持命令运行到显示 `Subscription Profile created successfully.`；中途退出会主动取消本地授权会话，需重新发起。

1. 从 v0.1.9 候选 App 创建 Profile，选择“订阅服务”。
2. 点击“前往授权”，确认打开生产域名且授权会话参数存在。
3. 注册全新账号并完成邮箱验证。
4. 确认验证后直接进入订阅购买页，不经过 Dashboard，也不要求重新发起授权。
5. 分别检查支付宝、微信支付显示 CNY，国际银行卡显示 USD。
6. 选择一条真实支付方式。点击最终支付按钮前由付款人确认金额。
7. 支付成功后确认原授权页显示接入成功，并自动回到 App。
8. 创建 Profile，确认默认模型可用并完成首条真实对话。
9. 验证一条 SSE 流式回复和一次工具调用。
10. 在 Sub2API 后台确认订单、订阅和使用记录属于同一测试用户与套餐。
11. 重启 App，再次打开 Profile，确认无需重新授权即可继续对话。

### 续期与更换套餐

1. 续购同一套餐后继续使用原 Profile，不能因 API Key 独立过期而失败。
2. 购买另一套餐后，在原 Profile 点击“重新授权”。
3. 授权页明确选择目标有效套餐，完成后原 Profile 原地更新。
4. 再次发起真实请求，确认服务端按新套餐分组和额度处理。

### 退款与幂等

1. 在后台对测试订单执行退款，记录退款时间和订单号。
2. 确认对应订阅失效或权益被撤销，原 Profile 请求由服务端拒绝。
3. 重放或等待重复支付 Webhook，确认不会重复发放订阅。
4. 重放退款通知，确认不会重复退款、重复增加销量名额或恢复权益。
5. 检查套餐已售数量按订单最终状态正确释放。

### 漏斗核对

验收后在管理端支付概览选择“7天”，确认以下阶段至少增加一次：

- 公告曝光/点击：仅从带正式公告的 App 入口测试时增加。
- 发起授权。
- 新增注册。
- 发起结账用户。
- 支付用户。
- 实际使用用户。

漏斗只核对计数和阶段转化，不应出现 API Key、对话内容、完整 IP 或稳定设备标识。

## 尚未通过的发布门槛

| 门槛 | 当前状态 | 完成条件 |
| --- | --- | --- |
| macOS ARM64 签名与公证 | 未完成 | 使用 Developer ID Application 和 App Store Connect API Key 构建，完成 notarization、stapling 和 Gatekeeper 冷启动 |
| macOS 当前候选 | 仅 x64、未签名 | 仅用于本机功能验收，不能作为正式公开附件 |
| Windows 官方 Codex 集成回归 | 部分完成 | Windows runner 已完成安装版/便携版、Profile 创建、线程同步和可见窗口验证；仍需在安装官方 Codex 的 Windows/PD 环境完成授权、打开源 App 和首条对话 |
| 全新用户真实支付 | 未完成 | 付款人确认金额后完成一次真实支付，并执行续期/换套餐/退款验证 |
| 公告正式下发 | 未完成 | Release 附件和教程上线后，再启用旧版升级公告与新版教程公告 |
| 正式 Release | 未完成 | 所有硬门槛通过后创建 Release，不得用本地未签名 macOS 包替代 |

在上述三项核心门槛（macOS 签名、公证；Windows 实机；全新用户真实支付）完成前，v0.1.9 只能视为候选版本，不能标记为正式发布完成。
