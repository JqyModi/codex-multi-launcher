# Linux.do 开源推广帖草稿

## 推荐标题

被 Codex/ChatGPT 合并折腾了一轮后，我把 Codex 多开助手补到了 v0.1.6

## 备选标题

- Codex/ChatGPT 合并后多开炸了？我把这个开源小工具修到 v0.1.6 了
- 发完 Codex 多开助手后，被真实用户 issue 推着修了一轮
- Codex 多开助手 v0.1.6：官方账号分身、历史对话同步、Windows 启动坑都补了

## 建议配图顺序

1. `docs/publishing/linuxdo-assets/01-dashboard.png`
2. `docs/publishing/linuxdo-assets/02-create-profile.png`
3. `docs/publishing/linuxdo-assets/04-chatgpt-account-mode.png`
4. `docs/publishing/linuxdo-assets/03-provider-settings.png`

正文里建议最多放 3 张，剩下的放评论区或项目 README。首图放首页工作台，别放营销海报。

## 正文草稿

之前在 L 站发过一次 Codex 多开助手，当时主要是解决我自己“多个 Codex 配置来回切很麻烦”的问题。

没想到后面 OpenAI 把 ChatGPT 和 Codex 桌面端合并了，旧路径、旧启动方式、Windows 权限、官方账号登录状态、历史会话这些地方陆续炸了一遍。GitHub issue 里也有不少佬友反馈，我这段时间基本就是跟着真实问题一点点补。

现在修到 v0.1.6，感觉可以重新发一下，不然旧帖看到的人可能还以为这工具已经不能用了。

项目地址：
https://github.com/JqyModi/codex-multi-launcher

下载地址：
https://github.com/JqyModi/codex-multi-launcher/releases/latest

官网：
https://jqymodi.github.io/codex-multi-launcher/

![首页工作台](上传 01-dashboard.png)

这个工具不是官方项目，也不是中转站。它做的事情比较简单：给 Codex / ChatGPT 桌面 App 创建多个独立 Profile，让每个窗口都有自己的账号、API 配置、项目和对话记录。

我自己常用的场景是：

- 一个窗口用 ChatGPT 官方账号登录
- 一个窗口走自己的 API Key / Base URL
- 不同项目放不同配置里，互不污染
- 临时测试和长期项目分开
- 不用每次手改配置文件、重登账号

这轮主要补了几个真实坑。

第一是 ChatGPT / Codex 合并后的启动问题。

新版不再只认旧的 Codex.app / Codex.exe，会自动找现在的 ChatGPT / Codex 桌面端，也可以手动指定 App 路径。这个主要是为了解决 7 月那波更新后很多人突然打不开的问题。

第二是官方账号登录模式。

之前更偏 API Key 场景，现在可以创建“ChatGPT 账号登录”的 Profile。创建后直接打开对应窗口登录官方账号就行，不需要填 Base URL 和 API Key。

![创建 Profile](上传 02-create-profile.png)

第三是历史对话同步。

这个之前我也折腾了很久，刚开始只能同步项目目录，项目下面的历史对话经常不出现。现在创建 Profile 时可以选择把已有项目对话、临时任务对话，或者全部对话复制过去。

这里提前说清楚：它是创建 Profile 时复制历史，不是多个 Profile 实时共用一份数据库。这样保守一点，至少不容易把源 App 数据搞坏。

第四是 Windows 上几个比较恶心的权限问题。

Windows Store / WindowsApps / AppX、symlink、插件缓存这些路径在 Windows 上很容易报 EPERM。v0.1.3 之后做过一轮兼容，至少我这边和 issue 反馈里遇到的创建失败问题已经修掉了。

目前支持：

- macOS Apple Silicon
- macOS Intel
- macOS Universal
- Windows x64 安装包
- Windows x64 便携版

macOS 包已经做了 Developer ID 签名和 notarization。Windows 暂时还没签名，所以第一次打开可能会被系统拦一下，这个先如实说。

已知限制也写在前面，免得误会：

- 不是 OpenAI 官方项目
- 不提供 API Key / 账号
- 不绕过任何账号限制
- 第三方接口需要兼容 Codex 当前调用方式，不是所有 Chat Completions 接口都能直接用
- 历史同步是复制，不是实时同步
- Windows 包目前未签名

感谢之前在 L 站和 GitHub issue 里反馈问题的佬友。这个工具如果只靠我自己在 Mac 上用，很多 Windows 和官方账号登录的问题根本发现不了。

如果你刚好也有多账号、多配置、多窗口隔离这些需求，可以试试看。遇到问题建议直接丢 GitHub issue，最好带截图、系统版本、安装方式和错误信息，我会优先看能复现的问题。

觉得有用的话也可以顺手点个 Star，让我知道不是只有我一个人在折腾这个东西。

## 合规说明建议放在文末

本帖按开源推广区规则补充：

- 已打 `#开源推广` 标签：是
- 项目完整开源：是
- 项目 README 已链接感谢 LINUX DO 社区：是
- 如发帖过程中使用 AI 辅助润色，会按规则补充过程截图：是
- 接受社区监督：是

## 发帖小建议

- 正文不要出现“以下为 AI 生成内容”这种句子，太像模板。
- 如果必须补 AI 辅助截图，建议放最后或评论区，不要夹在正文中间。
- 首楼控制在 3 张图以内，别像产品手册。
- 第一条自回复可以放 FAQ：Windows 未签名、历史同步不是实时同步、第三方接口兼容边界。
- 标题别太正经，L 站更吃“我被真实问题折腾了一轮”的叙事。
