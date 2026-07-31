# Sub2API 多开授权闭环方案

> 状态：核心授权链路已实现并通过桌面端验证脚本、Sub2API 单元/HTTP 测试及 GitHub Actions 完整 CI；真实 Sub2API 部署、支付履约和 Mac/Windows 端到端验证待进行。
>
> 桌面端开发分支：`jqy/sub2api-desktop-auth`
>
> 基线分支：`jqy/win`，基于提交 `354339a`（v0.1.8）

## 1. 目标

在不要求用户手动填写 Base URL、模型和 API Key 的情况下，让用户在创建 Profile 时选择“订阅服务”，完成登录/购买/授权后自动生成可用的 Codex Profile。

目标流程：

```text
选择订阅服务
  -> 登录或购买套餐
  -> 支付服务端确认
  -> 授权当前桌面设备
  -> Sub2API 分配用户级设备 Key
  -> 桌面端获取接入配置
  -> 自动测试 Responses API
  -> 自动生成 Profile 和启动器
  -> 打开 Codex
```

Sub2API 继续负责用户、订阅、支付、额度、并发、Key 和上游路由；本项目只负责桌面授权、配置接收和 Profile 创建。

## 2. 边界与原则

### 2.1 代码仓库边界

桌面端仓库：`JqyModi/codex-multi-launcher`

- 增加“订阅服务”使用方式。
- 发起桌面设备授权。
- 接收授权结果和用户级接入配置。
- 复用现有 Provider 测试、密钥加密、Profile 生成和启动器逻辑。
- 不保存 Sub2API 管理员凭据。

Sub2API fork（单独仓库维护）：

- 保留原有用户、套餐、支付、订单、订阅和 API Key 体系。
- 增加桌面授权会话和设备管理。
- 支付成功后沿用原生订阅履约逻辑。
- 通过服务端接口查找或创建用户级设备 Key。
- 不把管理员 API 暴露给桌面端。

### 2.2 明确不做

- 不在 Electron 内捆绑 PostgreSQL、Redis 或 Sub2API 服务。
- 不在桌面端内嵌支付逻辑或保存支付信息。
- 不向用户分发共享的上游主 Key。
- 不新增 Key 级并发、RPM 或 TPM；首版使用 Sub2API 已有的用户级并发、订阅额度和 Key 金额窗口限制。
- 不在授权 URL、日志、诊断报告中传输或打印明文上游 Key。
- 不把支付页面跳转结果当作支付成功依据。

## 3. 已确认可直接复用的 Sub2API 能力

基于当前 Sub2API 源码核对，以下能力不需要重新开发：

| 能力 | 处理方式 |
| --- | --- |
| 注册、登录、Refresh Token | 直接使用原生接口 |
| 邮箱、OAuth、TOTP、Passkey | 按部署需要启用 |
| 套餐和订阅 | 直接使用原生订阅分组 |
| 订单和支付 | 直接使用原生支付页面和 Webhook |
| 支付后激活订阅 | 使用原生幂等履约逻辑 |
| 用户级 API Key | 使用 `/api/v1/keys` 创建、修改、删除 |
| Key 总额度和有效期 | 使用原生 Key 字段 |
| Key 5 小时、日、周金额限制 | 使用原生 Key 限额字段 |
| 用户级并发 | 使用用户并发配置 |
| 上游账号级并发 | 使用账号和分组配置 |
| 用户订阅日、周、月额度 | 使用订阅分组配置 |
| 多上游账号、分组和路由 | 使用原生网关调度 |
| `/v1/models` | 使用原生 OpenAI 路由 |
| `/v1/responses` | 使用原生 Responses 路由 |
| `/v1/responses/compact` | 使用原生 Compact 路由 |
| SSE、工具调用和故障切换 | 以 Codex 实测为准，底层已有对应处理和测试 |

当前 Sub2API 普通用户已经可以使用：

```text
GET    /api/v1/keys
POST   /api/v1/keys
PUT    /api/v1/keys/:id
DELETE /api/v1/keys/:id
```

因此桌面授权模块不需要重新实现 Key 管理，只需要在服务端安全地代替用户完成一次受控的创建/复用流程。

## 4. 需要二次开发的能力

### 4.1 桌面授权会话

新增短期授权会话，建议字段如下：

```text
id
client_id
user_id
device_id
platform
device_name
code_challenge
status: pending / approved / denied / expired / consumed
api_key_id
expires_at
approved_at
consumed_at
created_at
```

服务端只保存 `code_challenge` 或其摘要，不保存桌面端的 `code_verifier`。

### 4.2 设备管理

新增设备记录，用于：

- 查看已授权设备。
- 为每台设备绑定一个用户级 Key。
- 远程撤销设备。
- 设备重授权时轮换或复用 Key。
- 识别 Mac、Windows 和设备名称。

设备 Key 的建议默认值：

- 名称：`Codex Multi Launcher - <设备名>`
- 分组：用户当前订阅对应分组。
- 有效期：不超过订阅到期时间。
- 总额度：由订阅分组控制，除非业务需要再设置 Key 限额。
- 状态：订阅失效或设备撤销时变为 inactive。

### 4.3 授权后配置返回

服务端只向当前已授权设备返回：

```json
{
  "base_url": "https://api.example.com/v1",
  "access_token": "user-device-token",
  "provider_name": "订阅服务",
  "default_model": "gpt-5-codex",
  "expires_at": "2026-08-31T00:00:00Z",
  "subscription_id": "masked-id"
}
```

不返回：

- Sub2API 管理员 Token。
- 上游账号 Token。
- 其他设备的 Key。
- 支付密钥或内部订单凭据。

## 5. API 合约

接口前缀暂定为 `/api/v1/desktop-auth`，最终以 Sub2API fork 的路由规范为准。

### 5.1 创建授权会话

```http
POST /api/v1/desktop-auth/sessions
```

请求：

```json
{
  "client_id": "codex-multi-launcher",
  "platform": "macos",
  "device_name": "Modi MacBook Pro",
  "code_challenge": "...",
  "code_challenge_method": "S256"
}
```

返回：

```json
{
  "session_id": "short-lived-id",
  "authorization_url": "https://service.example/desktop/authorize?...",
  "expires_in": 300,
  "poll_interval": 2
}
```

### 5.2 网页授权

授权页面复用 Sub2API 当前登录和支付体系：

```text
未登录 -> 登录/注册
无有效订阅 -> 套餐购买
支付处理中 -> 等待服务端履约
已订阅 -> 显示设备信息和授权确认
点击授权 -> 会话变为 approved
```

当前 fork 已实现的审批接口：

```http
POST /api/v1/desktop-auth/sessions/:session_id/approve
Authorization: Bearer <Sub2API 登录态>
```

审批接口只读取当前登录用户的有效订阅；没有有效订阅时返回 `payment_required`，购买套餐并完成服务端履约后可以重复审批。审批成功后由 Sub2API 为用户所属订阅分组创建一个独立设备 Key，桌面端不会看到网页中的 Key。

授权页面必须只允许受控的桌面客户端 `client_id` 和固定回调来源，禁止任意 `redirect_uri`，避免开放重定向。

### 5.3 轮询并兑换配置

```http
POST /api/v1/desktop-auth/token
```

请求：

```json
{
  "session_id": "short-lived-id",
  "code_verifier": "..."
}
```

成功后立即将会话标记为 `consumed`，同一授权码不能重复兑换。

当前实现将会话放在 Redis 中，TTL 为 5 分钟；Redis 只保存短期兑换所需的服务端状态，Token 兑换成功后立即删除会话，不新增数据库表。

### 5.4 撤销设备

提供网页端用户操作，不让桌面端直接调用管理接口：

```http
POST /api/v1/desktop-auth/devices/:id/revoke
```

撤销动作应：

1. 将设备 Key 置为 inactive 或删除。
2. 清除设备授权缓存。
3. 保留审计记录。
4. 让正在运行的 Profile 在下一次请求时收到明确的授权失效错误。

## 6. 桌面端改造闭环

### 6.1 创建向导

现有“模型服务”步骤增加第三种使用方式：

```text
[订阅服务] [API Key 配置] [ChatGPT 账号登录]
```

选择“订阅服务”后隐藏：

- 服务接口类型。
- 服务名称。
- Base URL。
- 手动模型输入。
- API Key 输入。

显示：

- 登录并接入。
- 当前订阅状态。
- 当前设备名称。
- 授权进度。
- 失败后的重试和打开服务中心入口。

### 6.2 授权状态

```text
未连接
正在打开授权页面
等待登录
等待支付确认
等待授权确认
正在获取配置
正在测试连接
已连接
授权失败
授权过期
```

### 6.3 Profile 创建

拿到服务端配置后，复用现有流程：

1. 将服务端 `base_url` 映射为 `ProviderConfig.baseUrl`。
2. 将 `access_token` 交给主进程保存。
3. 继续使用现有 AES-256-GCM 加密存储。
4. 通过现有 Provider 测试验证 `/models` 和 `/responses`。
5. 自动选择服务端默认模型，允许高级用户之后修改。
6. 写入 Profile Registry、`config.toml`、备份和启动器。
7. 不在 Renderer、日志和错误信息中显示明文 Token。

### 6.4 失败恢复

- 授权过期：重新打开授权，不重复创建 Profile。
- 支付成功但授权页面关闭：App 继续轮询，用户可恢复会话。
- Key 创建成功但 Profile 生成失败：保留授权记录，重试时复用设备 Key。
- Profile 创建成功但连接测试失败：保留 Profile 为未启用状态，显示服务端和本地诊断。
- 设备被撤销：Profile 标记为“订阅授权失效”，不删除用户本地历史数据。

## 7. 安全要求

### 必须实现

- HTTPS。
- `state`、PKCE 和短期授权会话。
- 授权码一次性消费。
- 授权会话 5 分钟过期。
- 服务端以支付 Webhook 确认支付，不信任前端回跳。
- 服务端检查订阅有效期后才允许兑换配置。
- 桌面端只获得用户级设备 Token。
- 管理接口与用户接口严格分离。
- 所有授权、Key 创建、撤销和支付履约记录审计日志。
- Base URL 使用服务端固定配置或白名单，不能由授权 URL 任意注入。

### 禁止实现

- 把管理员 Token 编译进 Electron。
- 把上游主 Key 发给客户端。
- 把明文 API Key 放在 URL query、日志或诊断包。
- 仅凭浏览器 `return_url` 判断已支付。
- 允许用户提交任意 `redirect_uri`。
- 让桌面端直接调用 Sub2API 管理 API。

## 8. 部署计划

### P0：本地闭环验证，零成本

- 使用 Sub2API Docker Compose 启动应用、PostgreSQL 和 Redis。
- 建立测试用户和免费/测试套餐。
- 暂不接真实支付，管理员直接分配测试订阅。
- 完成桌面端授权会话、用户 Key 和 Profile 自动创建。
- 验证 Mac 和 Windows 授权流程。

验收：用户从选择“订阅服务”到打开 Codex，不需要手填 URL、模型或 API Key。

### P1：公网封闭测试

- 优先使用 Oracle Cloud Always Free ARM VM，单机 Docker Compose。
- 配置域名、HTTPS、备份和监控。
- 邀请少量用户测试登录、授权、额度和故障恢复。
- 支付先使用测试套餐或小额真实订单。

验收：支付 Webhook、订阅激活、设备 Key、桌面 Profile 创建全部可追踪且可重试。

### P2：首发收费

- 迁移到稳定的 2 vCPU / 4 GB VPS。
- 保留 PostgreSQL、Redis 和 Sub2API 同机，降低成本。
- 开启每日数据库和配置异地备份。
- 增加状态页、错误监控和服务公告。
- 设置免费体验额度和单用户默认并发。

### P3：按指标扩容

仅在出现以下情况后扩容：

- 同时 SSE 连接持续超过 30～50。
- 内存持续超过 75%。
- PostgreSQL 连接池耗尽。
- Redis 延迟或错误明显升高。
- 网关 p95 首 Token 延迟持续恶化。

## 9. 验收矩阵

### Sub2API 服务端

- [ ] 注册、登录和 Refresh Token。
- [ ] 测试套餐和正式套餐。
- [ ] 支付订单创建。
- [ ] 支付 Webhook 验签和幂等。
- [ ] 支付后自动激活订阅。
- [x] 用户级设备 Key 自动创建。
- [ ] Key 有效期跟随订阅。
- [ ] 用户额度和并发限制。
- [ ] Key 撤销后请求失败。
- [ ] 多上游分组和故障切换。
- [ ] `/v1/models`。
- [ ] `/v1/responses` 非流式。
- [ ] `/v1/responses` SSE 流式。
- [ ] 工具调用。
- [ ] `/v1/responses/compact`。
- [ ] Codex 长上下文。

### 桌面端

- [x] “订阅服务”选项的默认和未连接状态。
- [ ] Mac 授权页面打开和回到 App。
- [ ] Windows 授权页面打开和回到 App。
- [ ] 浏览器关闭后的轮询恢复。
- [ ] 购买中状态。
- [ ] 支付成功后的自动继续。
- [x] 授权成功后自动填充 Provider。
- [x] 自动完成 Profile 和启动器生成。
- [x] Token 不出现在 Renderer、日志和诊断中。
- [ ] 重启 App 后 Profile 仍可打开。
- [ ] 订阅失效和设备撤销提示。
- [ ] 网络中断、授权过期、Key 创建失败的重试。

## 10. 发布与回滚

### 发布顺序

1. 先发布 Sub2API fork 的兼容服务端。
2. 保留桌面端 API Key 和官方登录两种旧方式。
3. 桌面端功能默认隐藏或仅对测试用户开放。
4. 完成 Mac 和 Windows 封闭测试。
5. 开放少量订阅套餐。
6. 观察授权成功率、Profile 生成成功率、网关错误率和退款率。

### 回滚

- 服务端关闭桌面授权入口，不影响已有 API Key Profile。
- 桌面端关闭“订阅服务”入口，不删除已有 Profile。
- 支付套餐可暂停售卖，但保留订阅查询和退款处理。
- 设备 Key 可以批量禁用，不能直接删除用户本地配置和历史会话。

## 11. 后续任务拆分

### 桌面端仓库

- [x] 订阅服务类型、创建向导和只读 Profile 配置。
- [x] 授权会话 API 客户端、PKCE 和内存状态机。
- [x] 浏览器授权后的轮询回退机制。
- [x] 授权配置接入现有 Profile 创建和本地加密存储。
- [ ] 订阅授权状态和重新授权。
- [x] Provider、Profile 创建和 Token 不经 Renderer 暴露的自动化测试。
- [ ] Mac 和 Windows 封闭测试。

### Sub2API fork

- [x] Redis 短期桌面授权会话（5 分钟 TTL，无需数据库迁移）。
- [ ] 设备模型和设备撤销。
- [x] 创建授权会话、PKCE 兑换及一次性消费接口。
- [x] 桌面授权网页。
- [x] 订阅状态检查和支付成功后的自动继续。
- [x] 用户订阅分组的设备 Key 创建编排。
- [ ] 审计日志和限流。
- [x] 服务端服务层、HTTP 合约和专项 CI 测试。
- [x] Docker Compose 本地验证文档；生产部署参数仍待确定。

### 运维与业务

- [ ] 域名和 HTTPS。
- [ ] 支付平台配置和 Webhook。
- [ ] 上游供应商授权与转售条款确认。
- [ ] 订阅、退款和服务条款。
- [ ] 隐私政策和数据处理说明。
- [ ] 备份恢复演练。
- [ ] 状态页和错误监控。
- [ ] 免费体验套餐和风控规则。

## 12. 当前决策

- [x] 使用 Sub2API 作为首选网关底座。
- [x] 复用 Sub2API 原生用户、订阅、支付、用户 Key、额度和并发能力。
- [x] 不做 Key 级并发、RPM、TPM 二次开发。
- [x] 桌面端只拿用户级设备 Token，不拿上游主 Key 或管理员 Key。
- [x] 以独立桌面授权模块连接 Sub2API 和多开助手。
- [x] 先本地零成本验证，再使用免费 VM 封闭测试，最后迁移低成本 VPS。
- [ ] 尚未决定正式上游供应商和支付渠道。
- [x] Sub2API fork 核心授权编码已完成。
- [x] 桌面端核心授权编码已完成。
