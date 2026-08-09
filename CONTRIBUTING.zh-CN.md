# 为 cron_maker 贡献

[English](./CONTRIBUTING.md)

cron_maker 采用源码可见、公开只读的社区策略。公开互动尚未开放：Issues 和 Discussions 保持关闭；在 Tinkora 验证私密行为举报通道和可持续管理能力前，不主动招揽外部贡献。仓库明确开放贡献通道后，将采用下述技术流程。

## 开始前

- 阅读[产品范围](./docs/PRODUCT_SCOPE.zh-CN.md)、[产品契约](./docs/CONTRACT.zh-CN.md)和[成熟度](./docs/MATURITY.zh-CN.md)。
- 不要把已关闭的 Issue、Discussion 或未列出的维护者账号当作贡献通道。
- 明确开放公开互动后，应先搜索已有工作，并在实现大型功能、公开 API 变更、新 dependency、方言变更或产品范围变更前讨论。
- 只通过[安全策略](./SECURITY.zh-CN.md)中的私密流程报告漏洞。

## 开发环境

- Rust 1.85 或更高版本；变更必须保持 Rust 1.85 兼容性
- `wasm32-unknown-unknown` target
- `wasm-pack`
- 用于浏览器测试的 Node.js 24 或更高版本及 npm

```bash
rustup target add wasm32-unknown-unknown
```

## 仓库结构

```text
cron_maker/
|-- crates/
|   |-- cron_maker_core/     # 解析、描述、调度和错误
|   `-- cron_maker_web/      # WASM 边界和静态浏览器应用
|-- docs/                    # 范围、契约、成熟度、发布和所有权
|-- .github/                 # 自动化和社区配置
`-- AGENTS.md                # 维护者和 agent 的仓库规则
```

## 本地检查

请求 review 前运行完整基线：

```bash
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo check -p cron_maker_core --target wasm32-unknown-unknown
cargo check -p cron_maker_web --target wasm32-unknown-unknown

cd crates/cron_maker_web
npm ci
npx playwright install chromium
npm run test:browser:local
```

构建并启动浏览器应用：

```bash
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

解析或调度行为发生变化时，需要针对有效输入、无效输入、256-byte 和 50-result 边界以及相关时区或 DST 行为添加面向结果的测试。

更新时区数据库时，需要将内置版本与 IANA [官方版本](https://data.iana.org/time-zones/tzdb/version)比较，阅读该版本的 `NEWS`，更新 Jiff 精确版本、两种语言的契约，并针对所有会影响未来调度的相关地区添加固定 timestamp 测试。发布前手动运行 Supply chain workflow；其中的版本检查会拒绝落后于 IANA 当前版本的内置数据。

## 前端变更

创建、修改、评审或调试 HTML 及用户可见前端代码前，必须按照 [AGENTS.md](./AGENTS.md) 使用 `ui-ux-pro-max` skill。提供 375、768、1024 和 1440 像素宽度下的真实浏览器证据，并检查键盘操作、可见焦点、无障碍名称、实时状态、overflow、重叠、console output、runtime request、语言切换、时区输入和复制行为。

未经批准的产品、隐私和安全决策，不得添加 CDN 或 runtime 第三方请求。应用不得传输用户输入的表达式或调度结果。

## 文档与语言

- 公开文档默认使用英文，并在存在简体中文版本时链接到完整对应文档。
- 含义变化时，在同一个 pull request 中同步更新两种语言。
- 代码注释仅使用英文。
- 不得把计划行为写成已经实现。
- 仓库链接使用 `https://github.com/Tinkora/cron_maker`，但不得声称未经验证的可用性。
- Markdown 不得包含以前的身份、内部历史、凭据、私有路径或 emoji。

## Commit

使用英文 [Conventional Commits](https://www.conventionalcommits.org/)，每个 commit 保持逻辑完整。例如：

```text
fix: reject unsupported weekday modifiers
docs: clarify DST overlap behavior
```

## Pull Request 流程

公开互动保持关闭时，以下流程不启用。Tinkora 明确开放贡献后：

1. 创建专注的 branch，例如 `fix/timezone-validation`。
2. 进行解决问题所需的最小完整变更。
3. 按需添加或更新测试和两种语言的文档。
4. 运行所有相关本地检查，并记录环境限制。
5. 目标仓库提供 template 后填写 pull request template，关联决策记录并说明用户可见影响。
6. 使用专注的 commit 处理 review feedback。

只有在必要检查通过、请求的变更已解决、公开契约准确且不含无关变更时，pull request 才可 merge。

## 评审优先级

评审者按以下顺序评估：

1. 五字段解析和调度结果正确
2. 隐私、输入安全、有界资源使用及时区正确性
3. 与公开契约和 Rust 1.85 的兼容性
4. 浏览器无障碍与可用性
5. 测试质量和长期可维护性

## 社区标准

参与行为遵循[行为准则](./CODE_OF_CONDUCT.zh-CN.md)。支持和功能讨论使用[支持](./SUPPORT.zh-CN.md)中说明的渠道。维护者角色与决策规则见[维护者](./docs/MAINTAINERS.zh-CN.md)。
