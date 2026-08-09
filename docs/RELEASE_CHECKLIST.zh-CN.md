# 发布检查清单

[English](./RELEASE_CHECKLIST.md)

每次 cron_maker 发布都必须使用本清单。本清单定义门禁，不表示目标仓库、部署、tag 或 Release 当前已经存在。每个已勾选项目都应在 release PR 或跟踪 issue 中记录证据。

## 发布记录

- 版本：`vX.Y.Z`
- 目标 commit：
- 发布负责人：
- 评审者：
- 计划日期：
- 跟踪 issue 或 PR：

## 1. 范围与契约

- [ ] 每项已描述能力均已实现并测试；拟议工作没有被表述为可用。
- [ ] 变更符合[产品范围](./PRODUCT_SCOPE.zh-CN.md)，或者已经关联经过评审的范围决策。
- [ ] [产品契约](./CONTRACT.zh-CN.md)与 Rust、WASM 和浏览器行为一致。
- [ ] [成熟度](./MATURITY.zh-CN.md)如实说明实验性范围和限制。
- [ ] 英文与简体中文文档含义对等。
- [ ] `CHANGELOG.md` 在目标版本下记录用户可见变更、修复、安全说明和迁移方式。
- [ ] 公开文本不包含以前的组织、账号、域名、内部历史、私有路径、凭据或不受支持的能力声明。
- [ ] 六字段和七字段 cron、`L`、`W`、`#`、`+` 和 `?` 仍明确位于契约之外。
- [ ] 代码注释和 commit 使用英文；Markdown 不含 emoji。

## 2. 版本与仓库状态

- [ ] Working tree 干净，准确的 release commit 已经过评审。
- [ ] `Cargo.toml`、crate manifest 和 `Cargo.lock` 的目标版本及 Rust 1.85 基线一致。
- [ ] Repository、homepage、license、description 和文档 URL 均使用 `https://github.com/Tinkora/cron_maker`。
- [ ] 发布依赖相关链接前，目标仓库 URL 已经可以访问。
- [ ] 目标 tag 和 GitHub Release 尚不存在。
- [ ] [维护者](./MAINTAINERS.zh-CN.md)中已经记录维护所有权、发布权限和连续性联系人。
- [ ] 所有必要 review 和 branch protection check 均已满足。

## 3. Rust 与 WebAssembly 验证

使用声明的 toolchain 运行，并包含 Rust 1.85 的 MSRV 证据：

```bash
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
rustup target add wasm32-unknown-unknown
cargo check -p cron_maker_core --target wasm32-unknown-unknown
cargo check -p cron_maker_web --target wasm32-unknown-unknown

cd crates/cron_maker_web
npm ci
npx playwright install chromium
npm run test:browser:local
```

- [ ] 格式检查通过。
- [ ] 所有 workspace test 通过。
- [ ] 严格 Clippy 通过，且没有宽泛 lint suppression。
- [ ] 两个 crate 均可为 `wasm32-unknown-unknown` 编译。
- [ ] `wasm-pack` 从锁定的 dependency graph 构建 Web package。
- [ ] Playwright suite 在四个配置的 viewport 宽度下全部通过。
- [ ] 边界测试覆盖 256 UTF-8 bytes、50 次执行、无效字段数量、被拒绝的修饰符、无效时区和无效 timestamp。
- [ ] 固定 timestamp 测试至少覆盖一个 DST 跳变和一个 DST 回拨。
- [ ] 固定 timestamp 测试覆盖内置 IANA 版本 `NEWS` 中发生变化的地区。

## 4. 浏览器验证

构建并启动准确的候选版本：

```bash
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

- [ ] 应用加载时 console 没有 error 或 warning，WASM 请求成功。
- [ ] 没有意外的外部 runtime 请求，输入的表达式未被传输。
- [ ] 默认语言为英文；简体中文切换会更新可见和无障碍文本。
- [ ] 可视化编辑、原始编辑、支持的别名、预设、验证、描述和复制均正常工作。
- [ ] 六字段、七字段表达式和每种被拒绝的修饰符都显示有用错误。
- [ ] 有效 IANA 时区中的本地时间由内置数据库生成，并与 UTC 一致。
- [ ] 无效 IANA identifier 会失败，且不会保留误导性调度。
- [ ] 选择 5、10、20 或 50 次执行时呈现对应行数。
- [ ] 执行时间会在分钟边界以及恢复可见或焦点后刷新。
- [ ] 页脚与 WASM API 报告相同的内置 IANA 版本。
- [ ] 键盘 tab 行为、焦点顺序、label 和实时状态通知正常工作。
- [ ] 在 375、768、1024、1280、1281 和 1440 像素宽度下，没有水平 overflow、裁切或不连贯重叠。
- [ ] 保持 reduced-motion 行为和可见焦点。

## 5. 安全与供应链

- [ ] 目标仓库已启用 GitHub 私密漏洞报告，并且链接可以打开 private advisory form。
- [ ] 没有未解决的 high 或 critical severity advisory 阻止发布。
- [ ] 仓库策略要求的 dependency、license 和 vulnerability check 通过。
- [ ] `npm run check:lockfile` 确认每个已解析 package 都通过 HTTPS 使用 npm 官方 registry。
- [ ] 手动触发的 Supply chain workflow 确认内置 tzdb 与 IANA 当前版本一致。
- [ ] GitHub Actions 按仓库策略固定版本，并使用最小权限。
- [ ] Workflow 不会将未经认证的网络内容直接 pipe 到 shell，也不会向不可信 PR 暴露 secret。
- [ ] 发布产物包含所需的 checksum、provenance 或 attestation。
- [ ] Secret scanning 未发现凭据或敏感调度示例。

## 6. 发布

- [ ] 只有在全部门禁通过后才 merge release change。
- [ ] 从已验证 commit 创建签名或符合仓库策略的 annotated tag。
- [ ] 从 tag 构建 release artifact；不要上传未经验证的本地产物。
- [ ] 基于 changelog 发布 release note，并包含所有兼容性警告。
- [ ] 确认 source link、license file、artifact 及所有 checksum 或 attestation 可以下载。
- [ ] 只在目标仓库可用后验证文档与社区链接。

## 7. 发布后

- [ ] 在干净浏览器会话中打开已发布应用，分别在 UTC 和一个遵循 DST 的 IANA 时区验证常见表达式。
- [ ] 确认 README link 和私密安全报告可以访问；验证 Issues 与 Discussions 仍保持关闭，且公开文档未暴露已禁用的贡献链接。
- [ ] 确认 release 和 deployment automation 在准确的已发布 commit 上为绿色。
- [ ] 公告只描述已发布契约中的能力。
- [ ] 为延期工作创建有负责人的 follow-up issue；不要在公开文本中留下不受支持的能力声明。

## 停止条件

如果必要检查失败、浏览器本地隐私边界被破坏、存在未解决的 high 或 critical severity 漏洞、双语文档含义存在重大差异、目标仓库或安全渠道不可用、维护所有权不明确，或无法从目标 commit 重新构建候选版本，则不得发布。
