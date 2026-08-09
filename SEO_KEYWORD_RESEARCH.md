# SEO 关键词研究（2026-08-09）

## 研究范围与边界

目标是为 Codex Multi Launcher 获取与产品实际能力匹配的自然搜索流量：在 macOS 和 Windows 上运行独立的 ChatGPT / Codex 桌面 Profile，并隔离本地应用状态、账号登录、API 配置和指定历史对话。

不面向账号共享、批量注册、代理/指纹浏览器、自动切换额度或规避服务限制等需求。

## 已验证的需求信号

| 搜索意图 | 证据 | 结论 | 对应页面 |
| --- | --- | --- | --- |
| ChatGPT 网页端的多账号切换 | OpenAI 帮助中心说明可同时保持两个网页端账号登录，但该能力尚未支持 Codex Desktop 和原生 ChatGPT App。 | 桌面端多账号状态隔离是明确缺口。 | `features/multiple-accounts/`、`guides/chatgpt-account/` |
| ChatGPT 桌面 App 多窗口 | 用户在社区询问 Windows 官方 App 能否同时打开多个窗口；Mac 用户也反馈 ChatGPT App 缺少多窗口体验。 | “桌面版多开 / 多窗口”比泛化“多账号”更贴近产品。 | 首页、`guides/windows/`、英文首页 |
| 工作与个人 ChatGPT 账号隔离 | 近期 Codex Desktop 用户询问在多个付费 ChatGPT 账号之间切换、避免反复退出登录。 | “个人/工作账号的独立窗口”是高匹配场景。 | `features/multiple-accounts/`、`guides/chatgpt-account/` |
| Codex 多开 | Search Console 已展示 `codex多开`、`codex 多开`、`codex 可以多开吗` 等查询。 | 保留 Codex 词，不用 ChatGPT 替代。 | 首页、`features/multiple-accounts/`、`guides/windows/` |
| ChatGPT 与 Codex 的趋势关联 | Google Trends（日本、过去 12 个月）中，`chatgpt codex` 是 ChatGPT 的上升相关查询，约 +2,050%；相关主题 OpenAI Codex 约 +2,000%。 | 保留 `ChatGPT Codex` 与 ChatGPT / Codex 并列命名，适合日本及英文搜索观察。 | 首页、英文首页 |
| 中文多开意图横向比较 | Google Trends（全球、过去 12 个月、搜索字词）相对均值：`Codex 多账号` 18、`ChatGPT 多账号` 12、`ChatGPT 多开` 2、`Codex 多开` 2、`ChatGPT 多窗口` 0。 | 中文趋势样本偏低且呈零散峰值，只用于相对排序；多账号由专题页承接，核心“多开”仍结合 Search Console 保留。 | 首页、`features/multiple-accounts/`、`guides/chatgpt-account/` |
| 英文桌面端意图横向比较 | Google Trends（全球、过去 12 个月、搜索字词）相对均值：`Codex desktop` 27、`ChatGPT desktop app` 26、`multiple ChatGPT accounts` 3、`multiple ChatGPT windows` 2、`multiple Codex accounts` 1。 | 英文用户更常使用产品/桌面端表达；英文首页优先加入 `ChatGPT desktop app` 与 `Codex Desktop`，同时在正文保留 multiple accounts/windows 高意图长尾。 | 英文首页 |

## 关键词分工

| 优先级 | 关键词簇 | 使用原则 |
| --- | --- | --- |
| P0 | ChatGPT 多开、ChatGPT 桌面版多开、ChatGPT 多窗口、多个 ChatGPT 桌面窗口 | 核心词 `ChatGPT 多开` 必须保留在首页和专题页 title/H1；“桌面版”与“多窗口”作为意图修饰，不替代核心词。 |
| P0 | ChatGPT 可以多开吗、ChatGPT 多账号、多个 ChatGPT 账号 | 由多账号隔离页承接，明确本地状态隔离与合规边界。 |
| P0 | ChatGPT 桌面版多开登录、ChatGPT 多账号登录 | 由账号登录指南承接，说明 Profile 创建和登录步骤。 |
| P1 | Windows ChatGPT 桌面版多开、ChatGPT.exe、WindowsApps / AppX | 由 Windows 排错页承接。 |
| P0 | ChatGPT desktop app、Codex desktop | Google Trends 英文组中相对热度最高；进入英文首页 title、H1、description，但保持页面语义是多开工具而非官方 App 下载页。 |
| P1 | multiple ChatGPT desktop windows、multiple ChatGPT accounts、multiple ChatGPT windows | 由英文首页承接；属于更贴近转化的长尾，保留在标题/正文，观察英文 Search Console 后再决定是否拆分独立英文指南。 |
| 保留 | Codex 多开、Codex 多账号、Codex 历史对话同步 | 继续保留，已有 Search Console 需求信号。 |
| 不覆盖 | ChatGPT 账号共享、账号批量运营、指纹浏览器、绕过额度/限制 | 与产品定位不符，并可能造成安全和合规风险。 |

## 来源

- OpenAI Help Center: [Use multiple accounts with account switching](https://help.openai.com/en/articles/20001068-use-multiple-accounts-with-account-switching)
- Reddit: [How do you switch between multiple accounts in the Codex desktop app?](https://www.reddit.com/r/codex/comments/1v3d42j/how_do_you_switch_between_multiple_accounts_in/)
- Reddit: [Two ChatGPT accounts, one Mac Studio Desktop App](https://www.reddit.com/r/ChatGPTPro/comments/1v5d0o6/two_chatgpt_accounts_one_mac_studio_desktop_app/)
- Reddit: [Is it possible to open multiple windows in the official app on Windows?](https://www.reddit.com/r/ChatGPT/comments/1h7vcza)
- Google Trends（已在浏览器复核）：`ChatGPT`，日本，过去 12 个月；相关查询 `chatgpt codex` +2,050%，相关主题 OpenAI Codex +2,000%。
- Google Trends（已在浏览器复核）：全球、过去 12 个月、搜索字词；中文组对比 `ChatGPT 多开` / `ChatGPT 多账号` / `ChatGPT 多窗口` / `Codex 多开` / `Codex 多账号`，相对均值分别为 2 / 12 / 0 / 2 / 18。
- Google Trends（已在浏览器复核）：全球、过去 12 个月、搜索字词；英文组对比 `multiple ChatGPT accounts` / `multiple ChatGPT windows` / `ChatGPT desktop app` / `multiple Codex accounts` / `Codex desktop`，相对均值分别为 3 / 2 / 26 / 1 / 27。

## 当前 Search Console 基线

截至 2026-08-09 的近 3 个月报告（实际有数据区间为 2026-07-17 至 2026-08-06）：91 次点击、977 次展示、CTR 9.3%、平均排名 7.9。已点击查询仍集中在 `codex多开`（12 次点击 / 47 展示）和 `codex 多开`（7 次 / 44 展示）；ChatGPT 词尚未出现，原因是 ChatGPT 页面词本轮刚调整且尚未部署/积累索引数据。

后续以 Search Console 的展示、点击、平均排名和页面 CTR 验证 ChatGPT 词，不把 Google Trends 的相对热度当作绝对搜索量。Trends 中的 0 表示样本不足或相对值过低，不等于真实搜索需求为零；中文组的稀疏峰值也不足以单独支持删除已有核心词。
