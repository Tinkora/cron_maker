# 支持

[English](./SUPPORT.md)

## 选择正确渠道

公开支持目前尚未开放。在 Tinkora 建立可持续管理能力和独立的私密行为举报通道前，Issues 和 Discussions 保持关闭。不要把未列出的聊天室、邮箱、社交账号或维护者账号视为官方支持渠道。

请使用 [README](./README.zh-CN.md)、[产品契约](./docs/CONTRACT.zh-CN.md)和[成熟度](./docs/MATURITY.zh-CN.md)自助查阅。疑似漏洞应在确认链接会打开 private advisory form 后，通过仓库的[私密漏洞报告](https://github.com/Tinkora/cron_maker/security/advisories/new)提交，并遵循[安全策略](./SECURITY.zh-CN.md)。该表单只接收安全漏洞，不是支持或行为举报渠道。

明确开放公开互动后，本文档会列出经过验证的渠道及其范围。在此之前，不提供响应时间或个人支持承诺。

## 提问前

1. 阅读 [README](./README.zh-CN.md)、[产品契约](./docs/CONTRACT.zh-CN.md)和[成熟度](./docs/MATURITY.zh-CN.md)。
2. 确认请求是否属于五字段 Unix/Vixie 契约。
3. 在当前代码库或明确标识的已发布版本上复现；只有实际存在 Release 时才使用后者。
4. 记录 commit 或版本、browser、operating system、表达式、IANA 时区、起始 timestamp、请求次数和观察到的错误码。
5. 移除敏感数据，并提供准确的失败命令或浏览器步骤。

DST 报告应包含固定 Unix timestamp、准确 IANA identifier、预期 UTC timestamp，以及已知的时区数据库上下文。Build failure 应包含相关 error output，但必须移除 token 和本地 secret。

## 支持边界

社区支持为尽力提供，不保证响应时间。维护者支持已记录的代码库，以及实际存在时的当前 Release，不支持自定义 fork、无关 scheduler、浏览器扩展或第三方托管配置。

对六字段或七字段语法、`L`、`W`、`#`、`+`、`?`、Quartz、AWS 调度语法、CLI、MCP 集成或 Agent Skill 的请求属于当前契约之外的功能提案，不属于使用缺陷。

公开互动开放后，一般问题应进入明确列出的讨论渠道，Issue 应描述可采取行动的行为。安全报告始终必须遵循[安全策略](./SECURITY.zh-CN.md)。
