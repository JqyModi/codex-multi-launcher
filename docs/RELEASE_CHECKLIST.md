# Release Checklist

适用于订阅功能公开发布。所有勾选项应在候选版本号和生产环境配置冻结后执行。

## 版本与代码

- [ ] `package.json`、更新元数据、教程和公告使用同一版本号。
- [ ] 桌面端 `jqy/sub2api-desktop-auth` 与 Sub2API `jqy/desktop-auth` 工作区干净且已推送。
- [ ] 记录桌面端、Sub2API 和部署镜像的 Git commit。
- [ ] 确认没有测试密钥、Stripe Secret、上游 Key、个人路径或付款资料进入 Git。

## Sub2API 生产环境

- [ ] 部署前完成 PostgreSQL、环境变量和 Docker Compose 备份。
- [ ] 执行迁移 `193_subscription_plan_capacity_limits.sql` 与 `194_growth_funnel_events.sql`。
- [ ] 容器、PostgreSQL、Redis 和反向代理均为 healthy。
- [ ] 管理端套餐设置首发销量上限：轻量版 5、标准版 5、高频版 2、重度版 1；单用户限购按发布方案填写。
- [ ] 购买页正确显示剩余数量、售罄状态及支付宝/微信/国际银行卡。
- [ ] 支付 Webhook 重复通知不重复发放订阅；退款后权益和购买名额状态正确。
- [ ] 上游余额、连续 5xx 和容器异常告警发送到 `jqy.tieniu@gmail.com`。
- [ ] 7/30/90 天订阅转化漏斗可以打开，事件中不含 API Key、对话或完整 IP。
- [ ] 同机备份、OCI Object Storage 备份和一次恢复演练通过。

## 自动验证

- [ ] 桌面端运行 `npm run typecheck`。
- [ ] 桌面端运行 `npm run verify:subscription-auth`。
- [ ] 桌面端运行 `npm run verify:subscription-profile`。
- [ ] 桌面端运行 `npm run verify:subscription-reauth`。
- [ ] 桌面端运行 `npm run verify:e2e`。
- [ ] Sub2API 后端相关 Go 测试、前端 Vitest、`vue-tsc` 和生产构建通过。

## 候选包

- [ ] macOS arm64 签名、公证和 stapling 通过，冷启动无 Gatekeeper 警告。
- [ ] Windows x64 安装版和便携版均能启动、创建 Profile、打开 Codex。
- [ ] 自动更新元数据指向本次版本，旧版本能发现并下载更新。
- [ ] 生成所有发布文件 SHA256，并与 Release 附件逐一核对。
- [ ] 安装包和解压目录中不包含 `.env`、日志、测试订单或开发凭据。

## 全新用户真实验收

- [ ] 使用未注册邮箱从 App 点击“前往授权”。
- [ ] 注册、邮箱验证后直接进入订阅购买页。
- [ ] 分别确认人民币支付入口和国际银行卡入口金额/币种正确；选择一条真实小额支付完成全流程。
- [ ] 支付后自动回到授权页和 App，生成 Profile 后首条真实对话成功。
- [ ] SSE 流式输出和一次工具调用成功，Sub2API 用量记录关联正确订阅。
- [ ] 同套餐续期后原 Profile 无需换 Key；购买另一套餐后重新授权可原地切换。
- [ ] 退款后原请求被服务端拒绝，重复 Webhook 不重复退款或恢复权益。

## 文档与触达

- [ ] `subscription.html` 的创建、套餐、支付、完成和重新授权截图来自候选版本。
- [ ] 首页、README、更新日志、服务条款、隐私政策、退款规则和客服邮箱链接有效。
- [ ] 旧版本公告 CTA 指向最新 Release，`maxAppVersion` 截止旧版。
- [ ] 新版本公告 CTA 指向订阅图文教程，`minAppVersion` 从新版本开始。
- [ ] 两条公告使用不同 ID，发布时间和结束时间正确。
- [ ] GitHub Release 清楚说明订阅是可选新增功能，不影响已有 API Key 与 ChatGPT 账号 Profile。

## 发布后观察

- [ ] 首发销量上限保持开启，观察支付成功率、授权完成率、首个请求成功率和退款率。
- [ ] 发布后 1 小时、24 小时、7 天检查告警、订单、上游成本和漏斗。
- [ ] 发现支付或授权异常时先下架对应套餐，不影响 API Key / 官方账号模式。
- [ ] 记录已知问题、用户反馈和下一轮转化优化结论。
