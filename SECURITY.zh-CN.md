# 安全策略

[English](./SECURITY.md)

## 支持版本

| 版本或 branch | 支持状态 |
| --- | --- |
| 当前预发布代码库 | 尽力修复 |
| 已发布版本 | 本策略不假设任何版本当前已经发布 |
| 更早 snapshot | 除非未来 advisory 明确列出，否则不支持 |

cron_maker 由小型团队维护。安全修复具有高优先级，但不提供服务级响应或 backport 保证。首个 Release 实际发布后必须更新此表。

## 私密报告漏洞

不要为疑似漏洞创建公开 issue、discussion 或 pull request。

预期的私密渠道是目标仓库的[私密漏洞报告表单](https://github.com/Tinkora/cron_maker/security/advisories/new)。提交详情前必须确认该链接会打开 private advisory form。本文包含此链接并不表示目标仓库或该功能当前已经可用。

如果私密表单不可用，不要公开报告。通过已经建立的可信私密渠道联系 Tinkora organization owner，并请求机密报告方式。

报告应包含：

- 受影响的 commit、build、browser 和 operating system
- 复现步骤或最小 proof of concept
- 预期和实际行为
- 安全影响以及所需用户操作
- 表达式或调度数据是否离开浏览器
- 建议的缓解方式或披露限制

响应和修复时间取决于可复现性、严重程度和维护者可用时间。不承诺固定确认期限。

## 范围内问题

- 因应用行为导致用户输入的表达式或调度结果离开浏览器
- 通过表达式、描述、状态消息或复制值进行 script 或 markup injection
- 绕过 256 UTF-8 byte 表达式限制或 50 次执行结果限制
- 解析器接受公开契约明确拒绝语法的差异
- 具有具体安全影响的 IANA 时区或 DST 计算缺陷
- 可归因于本项目的 WebAssembly 内存安全或 sandbox 边界问题
- 对 cron_maker 有实质影响的 dependency 漏洞
- 仓库自动化或 release artifact 供应链入侵

## 通常不在范围内的问题

- 对 cron_maker 没有实质影响的浏览器、操作系统或 dependency 问题
- 静态托管方记录普通资源请求
- 针对托管方的社交工程、物理攻击或拒绝服务
- 只有自动 scanner output 而没有可复现影响的报告
- 不受支持的 fork 或修改后的部署
- 要求不受支持 cron 方言或产品功能的请求

维护者仍可协助转交可信的 upstream report。

## 安全与隐私模型

cron_maker 是静态浏览器应用。解析、描述和执行时间计算在页面加载的 Rust/WASM 中运行。已实现的应用不包含账号系统、数据库、分析、scheduler service 或托管 API，也不会主动传输输入的表达式或计算后的调度。

此边界并不让整个浏览会话匿名：

- 静态托管方会收到 HTML、CSS、JavaScript、WebAssembly 及相关元数据的正常请求。
- 浏览器扩展、被攻破的浏览器或被修改的部署可以观察页面内容。
- 复制表达式会写入系统剪贴板，其他软件可能能够读取。
- 时区 identifier 和调度可能暴露运维模式；公开报告应使用合成示例。
- 即使项目代码不发起外部 runtime 请求，dependency 和浏览器漏洞仍可能影响已加载应用。

内置浏览器代码通过面向文本的 DOM API 渲染用户可控值。这是设计属性，不能替代测试或部署级安全 header。

## 协调披露

维护者会验证报告、评估受影响代码、准备修复和回归测试，并通过私密渠道协调披露。公开披露应等待修复或约定的缓解措施可用。是否署名由报告者决定。
