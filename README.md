# cron_maker

[简体中文](./README.zh-CN.md)

<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="https://ko-fi.com/tinkora" target="_blank" rel="noopener noreferrer">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support Tinkora on Ko-fi" width="520">
  </a>
</p>
<!-- markdownlint-enable MD033 -->

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Rust 1.85+](https://img.shields.io/badge/rust-1.85%2B-orange.svg)](https://www.rust-lang.org)

cron_maker builds, validates, explains, and previews Unix/Vixie five-field cron expressions locally in a browser. Rust and WebAssembly handle the expression and schedule data without sending it to an application server.

Repository URL: [https://github.com/Tinkora/cron_maker](https://github.com/Tinkora/cron_maker)

## Features

- Visual five-field schedule builder and raw expression editor
- Unix/Vixie fields with wildcards, values, lists, ranges, steps, and standard month or weekday names
- Vixie OR semantics when day of month and day of week are both restricted
- Supported aliases: `@yearly`, `@annually`, `@monthly`, `@weekly`, `@daily`, `@midnight`, and `@hourly`
- English and Simplified Chinese descriptions
- IANA time-zone evaluation and selected-zone display from bundled 2026c data, with daylight-saving transitions and a visible data version
- Preview of 5, 10, 20, or 50 future occurrences in selected-zone time and UTC
- English interface by default with a complete Simplified Chinese switch
- Browser-local Rust/WASM processing and expression copy
- A 256 UTF-8 byte original-input limit and a 50-occurrence core limit

The supported dialect has exactly five fields. Six- and seven-field expressions and the modifiers `L`, `W`, `#`, `+`, and `?` are rejected. The project does not provide Quartz or AWS scheduling syntax, a CLI, MCP integration, an Agent Skill, a hosted API, or a published package.

The occurrence preview refreshes at minute boundaries and after the page becomes visible or regains focus, so an open page does not retain expired results. Time-zone updates are explicit dependency changes; the bundled IANA release is shown in the application footer.

See [Product Scope](./docs/PRODUCT_SCOPE.md) for explicit non-goals and [Product Contract](./docs/CONTRACT.md) for normative inputs, outputs, limits, and error codes.

## Quick Start

Requirements:

- Rust 1.85 or newer
- The `wasm32-unknown-unknown` Rust target
- `wasm-pack`
- Node.js 24 or newer and npm

From a local checkout:

```bash
rustup target add wasm32-unknown-unknown
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

Open `http://127.0.0.1:4175`. A local HTTP server is required because the application loads JavaScript modules and WebAssembly assets.

## Development

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

The Playwright suite exercises Chromium at 375, 768, 1024, and 1440 pixel widths. Before changing HTML or other user-facing frontend code, follow the `ui-ux-pro-max` and browser-verification rules in [AGENTS.md](./AGENTS.md).

## Project Layout

| Path | Responsibility |
| --- | --- |
| `crates/cron_maker_core` | Parsing, normalization, descriptions, IANA time-zone scheduling, and errors |
| `crates/cron_maker_web` | WASM boundary and the static bilingual browser application |
| `docs` | Product scope, public contract, maturity, release process, and maintainership |
| `.github` | Repository automation and community configuration |

## Documentation

- [Product Scope](./docs/PRODUCT_SCOPE.md)
- [Product Contract](./docs/CONTRACT.md)
- [Maturity and Compatibility](./docs/MATURITY.md)
- [Release Checklist](./docs/RELEASE_CHECKLIST.md)
- [Maintainers](./docs/MAINTAINERS.md)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Changelog](./CHANGELOG.md)

## Privacy and Security

The application does not intentionally transmit expressions or schedule results. A static-file host still receives ordinary asset-request metadata, and browser extensions or a modified deployment can observe page content. Review [SECURITY.md](./SECURITY.md) for the security model and intended private reporting channel.

## Release Status

The public repository contains a pre-1.0 implementation. `v0.1.0` is the first
public release and the browser demo is deployed on [GitHub Pages](https://tinkora.github.io/cron_maker/).
Release assets and their verification records are available from the
[GitHub Releases page](https://github.com/Tinkora/cron_maker/releases). See
[Maturity and Compatibility](./docs/MATURITY.md) for supported behavior and
limitations.

## License

Licensed under the [MIT License](./LICENSE). Copyright (c) Tinkora contributors.
