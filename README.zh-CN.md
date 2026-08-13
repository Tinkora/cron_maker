# cron_maker

[English](./README.md)

<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="https://ko-fi.com/tinkora" target="_blank" rel="noopener noreferrer">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="在 Ko-fi 上支持 Tinkora" width="520">
  </a>
</p>
<!-- markdownlint-enable MD033 -->

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Rust 1.85+](https://img.shields.io/badge/rust-1.85%2B-orange.svg)](https://www.rust-lang.org)

cron_maker 在浏览器本地构建、验证、解释并预览 Unix/Vixie 五字段 cron 表达式。Rust 与 WebAssembly 负责处理表达式和调度数据，不会将它们发送到应用服务器。

仓库 URL：[https://github.com/Tinkora/cron_maker](https://github.com/Tinkora/cron_maker)

## 功能

- 可视化五字段调度构建器和原始表达式编辑器
- 支持通配符、单值、列表、范围、步进以及标准月份和星期名称的 Unix/Vixie 字段
- 日期和星期同时受限时采用 Vixie OR 语义
- 支持的别名：`@yearly`、`@annually`、`@monthly`、`@weekly`、`@daily`、`@midnight` 和 `@hourly`
- 英文和简体中文描述
- 使用内置 IANA 2026c 数据按时区及夏令时转换计算并显示执行时间，同时显示数据版本
- 以所选时区和 UTC 预览未来 5、10、20 或 50 次执行
- 默认英文界面，并提供完整简体中文切换
- 浏览器本地 Rust/WASM 处理及表达式复制
- 原始表达式输入最大 256 UTF-8 bytes，core 单次最多返回 50 次执行

支持的方言严格使用五个字段。六字段和七字段表达式，以及 `L`、`W`、`#`、`+`、`?` 修饰符会被拒绝。项目不提供 Quartz 或 AWS 调度语法、CLI、MCP 集成、Agent Skill、托管 API 或已发布 package。

执行预览会在分钟边界以及页面重新可见或恢复焦点时刷新，避免长时间打开的页面保留已过期结果。时区更新是显式 dependency 变更，应用页脚会显示内置 IANA 版本。

请阅读[产品范围](./docs/PRODUCT_SCOPE.zh-CN.md)了解明确的非目标，阅读[产品契约](./docs/CONTRACT.zh-CN.md)了解规范性的输入、输出、限制和错误码。

## 快速开始

环境要求：

- Rust 1.85 或更高版本
- Rust `wasm32-unknown-unknown` target
- `wasm-pack`
- Node.js 24 或更高版本及 npm

在本地 checkout 中执行：

```bash
rustup target add wasm32-unknown-unknown
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

打开 `http://127.0.0.1:4175`。应用使用 JavaScript module 和 WebAssembly 资源，因此需要通过本地 HTTP server 访问。

## 开发

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

Playwright suite 会在 375、768、1024 和 1440 像素宽度下测试 Chromium。修改 HTML 或其他用户可见前端代码前，必须遵循 [AGENTS.md](./AGENTS.md) 中的 `ui-ux-pro-max` 与浏览器验证规则。

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `crates/cron_maker_core` | 解析、规范化、中英文描述、IANA 时区调度和错误 |
| `crates/cron_maker_web` | WASM 边界与静态双语浏览器应用 |
| `docs` | 产品范围、公开契约、成熟度、发布流程和维护信息 |
| `.github` | 仓库自动化与社区配置 |

## 文档

- [产品范围](./docs/PRODUCT_SCOPE.zh-CN.md)
- [产品契约](./docs/CONTRACT.zh-CN.md)
- [成熟度与兼容性](./docs/MATURITY.zh-CN.md)
- [发布检查清单](./docs/RELEASE_CHECKLIST.zh-CN.md)
- [维护者](./docs/MAINTAINERS.zh-CN.md)
- [贡献指南](./CONTRIBUTING.zh-CN.md)
- [安全策略](./SECURITY.zh-CN.md)
- [支持](./SUPPORT.zh-CN.md)
- [行为准则](./CODE_OF_CONDUCT.zh-CN.md)
- [变更日志](./CHANGELOG.md)

## 隐私与安全

应用不会主动传输表达式或调度结果。静态文件托管方仍会收到普通资源请求的元数据，浏览器扩展或被修改的部署也可能观察页面内容。安全模型和预期的私密报告渠道见[安全策略](./SECURITY.zh-CN.md)。

## 发布状态

公开仓库中包含 1.0 之前的实现。`v0.1.0` 是首个公开 Release，浏览器 Demo 已部署到
[GitHub Pages](https://tinkora.github.io/cron_maker/)。Release 资产及其验证记录可从
[GitHub Releases 页面](https://github.com/Tinkora/cron_maker/releases)获取。支持行为与限制见[成熟度与兼容性](./docs/MATURITY.zh-CN.md)。

## 许可证

项目使用 [MIT License](./LICENSE)。Copyright (c) Tinkora contributors。
