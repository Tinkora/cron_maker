# 维护者

[English](./MAINTAINERS.md)

## 项目所有权

cron_maker 由 [Tinkora organization](https://github.com/Tinkora) 维护。维护者负责保护五字段产品契约、浏览器本地隐私边界、发布完整性，以及未来开放公开贡献时采用的已记录流程。

## 维护团队

| 团队 | 角色 | 职责 |
| --- | --- | --- |
| Tinkora cron_maker maintainers | 项目维护者 | Triage、review、仓库设置、发布和私密安全协调 |

本文档不指定任何个人账号作为永久权威。公开发布前，发布记录必须指定发布负责人和评审者；仓库权限必须保证项目连续性，不能依赖未记录的个人凭据。

## 职责

- 保持行为、测试、公开契约和双语文档一致。
- Triage 报告时不承诺无法保证的时间表。
- 从正确性、隐私、无障碍、兼容性和维护成本角度评审变更。
- Merge 和发布前要求相关自动化与手工证据。
- 按最小权限管理仓库和 organization 权限。
- 通过已验证的私密渠道协调漏洞。
- 在可评审的仓库材料中记录范围和兼容性决策。
- 避免把拟议集成或发布计划表述为可用能力。

## 决策流程

常规修复和文档改进通过 pull request review 决定。Cron 方言、公开 Rust 或 WASM interface、输入或结果限制、时区语义、隐私行为、具有显著供应链影响的依赖或发布策略变更，必须关联 issue 或 discussion 并记录：

1. 用户问题与证据
2. 替代方案和维护成本
3. 隐私、安全与兼容性后果
4. 测试和发布计划
5. 最终维护者决定

维护者应在活跃评审者之间寻求共识。无法达成共识时，指定的发布负责人必须在 merge 前记录决定和理由。

## 评审与发布

- 作者不应批准自己的 pull request。
- 有其他合格评审者时，代码、workflow、dependency、安全和发布变更应得到独立评审。
- 即使只有一名活跃维护者，也必须通过必要自动化检查并提供可复现的验证证据。
- 安全敏感变更可在协调披露完成前保持私密。
- 公开 commit history 使用英文 Conventional Commits。
- 每次发布都使用[发布检查清单](./RELEASE_CHECKLIST.zh-CN.md)，并指定负责人和评审者。

## 成为维护者

维护权限来自持续贡献，贡献者需要展现可靠的技术判断、尊重他人的评审、稳定的跟进能力，以及对产品和安全契约的理解。权限应逐步授予：先承担 triage 或 review 职责，再获得仓库管理和发布权限。

## 连续性

维护者预计无法继续参与时，应通过有记录的 organization role 移交未完成的评审、安全和发布职责。Package 发布、deployment、organization ownership 和 release credential 不得依赖未记录的个人 token。

只有在公开互动开放后，治理问题才使用 [SUPPORT.md](../SUPPORT.zh-CN.md) 明确列出的渠道。安全事项遵循 [SECURITY.md](../SECURITY.zh-CN.md)。
