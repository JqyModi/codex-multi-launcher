# v0.1.9 订阅版本上线就绪记录

更新时间：2026-08-12（Asia/Shanghai）

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

### 生产验收结果（2026-08-11）

- 全新邮箱完成注册、验证码校验和真实套餐支付，支付后订阅状态为有效。
- 已购账号重新发起桌面授权时未要求重复购买，PKCE 兑换成功并自动创建订阅 Profile。
- 生产 Profile 默认模型为 `gpt-5.5`，`/v1/models` 返回 3 个模型。
- 最小 Responses 请求返回 HTTP 200；SSE 验收收到 11 个事件、1 个完成事件和 3 个函数调用相关事件。
- Sub2API 用户端记录到 2 次真实请求、8.85K Token 和约 `$0.0276` 标准用量，套餐日/周/月额度同步扣减。
- 通过正式 `openProfile` 路径启动 `/Applications/ChatGPT.app` 成功，独立 `CODEX_HOME`、`user-data-dir` 和订阅凭据均已注入；官方 App 首次使用引导属于新隔离目录的一次性页面，已补充到教程。

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
| macOS ARM64 签名与公证 | 已完成 | Developer ID 深度签名、Apple 公证、stapler 和 Gatekeeper 验证均通过 |
| macOS 当前候选 | 已完成 | arm64、x64、universal 三套 ZIP 均完成签名、公证、架构和敏感文件审计 |
| Windows 官方 Codex 集成回归 | 首发接受 | Windows runner 已完成安装版/便携版、Profile 创建、线程同步和可见窗口验证；Windows 专用路径、启动器、AppX 缓存与环境继承测试通过。因当前设备磁盘限制，真实 PD 首条对话转为发布后观察项 |
| 全新用户真实支付 | 已完成 | 真实支付、订阅授权、Profile 创建、普通 Responses、SSE、函数调用和用量扣减均已验证 |
| 公告正式下发 | 已完成 | 旧版升级公告与新版订阅教程公告已通过 Pages 发布并完成公网读取验证 |
| 正式 Release | 已完成 | v0.1.9 正式 Release 已发布，12 个附件均为 uploaded 且远端 SHA256 与本地一致 |

v0.1.9 的发布硬门槛已全部完成；Windows 真实官方 App 回归按首发风险接受，发布后通过用户反馈和 Issue 持续观察。

## 2026-08-12 macOS 正式候选

- 新签发证书：`Developer ID Application: Yun Jiang (ZZG8SS9R2S)`，有效期至 2031-08-12。
- arm64 SHA256：`26c879a4c9bffd4de443c88ca9d9a739270e8ff76330a89bc51cd7ee7f016bae`
- x64 SHA256：`de1ad45f4c54c1332a91672f536a5fd7e42b49025fc6263f011b45c8fd9df99e`
- universal SHA256：`d003085d59476e1a1745608bf87708f63c12ea5faee1277a7117a533ba3e1669`
- 三套 `.app` 均通过 `codesign --verify --deep --strict`、`spctl` 与 `stapler validate`。
- `verify-release-candidate` 已分别审计 x64、arm64、universal，并同时复核 Windows 候选；各平台 `app.asar` 均为 4,276 个文件。

## 2026-08-12 正式发布

- Release：`https://github.com/JqyModi/codex-multi-launcher/releases/tag/v0.1.9`
- 标签提交：`23b76a1546f9e61fb75cc5f053dd22cafa14fd65`
- Windows Setup、Portable、blockmap、`latest.yml`，三套 macOS ZIP 与 blockmap、`latest-mac.yml` 和统一 SHA256 清单均已上传。
- Pages 部署任务 `31518391951` 成功，公网公告已按 App 版本分别下发升级入口和订阅教程入口。
- `releases/latest`、`latest.yml` 与 `latest-mac.yml` 均完成远端读取和哈希复核。

## 2026-08-12 发布后生产加固

- Sub2API 生产环境已更新到 `6fca676`，容器、PostgreSQL、Redis 和 `/health` 均正常。
- 套餐名称、描述和功能增加中英文内容；购买页、我的订阅、购买页当前订阅和桌面多套餐授权均按界面语言显示，并兼容已下架的历史套餐。
- 部署前生成本地备份 `daily-20260812T002951Z`，PostgreSQL、Redis 和配置校验通过；隔离恢复演练成功读取 3 个用户、69 个订单、5 个订阅和 10 个 API Key。
- 同一备份已上传 OCI Object Storage：`daily/daily-20260812T002951Z.tar.gz` 及其 `.sha256` 校验文件。
- 本次仅更新服务端和 Web 订阅页面，没有修改 v0.1.9 桌面二进制；正式 Release 附件与更新元数据无需重建。
- 验证码投递记录已整理到 Sub2API 的 `docs/email-delivery.zh-CN.md`：新版 multipart 邮件、验证码主题和注册页垃圾邮件提示已部署，用户实测邮件不再进入垃圾邮件；DNS 认证记录保持不变。
