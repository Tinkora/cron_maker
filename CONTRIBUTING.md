# Contributing to cron_maker

[简体中文](./CONTRIBUTING.zh-CN.md)

cron_maker uses a source-visible, read-only public posture. Public interaction is not open: Issues and Discussions remain disabled, and external contributions are not actively solicited until Tinkora verifies a private conduct-reporting path and sustainable moderation. The technical process below will apply when the repository explicitly opens contribution channels.

## Before Starting

- Read [Product Scope](./docs/PRODUCT_SCOPE.md), [Product Contract](./docs/CONTRACT.md), and [Maturity](./docs/MATURITY.md).
- Do not treat a disabled Issue, Discussion, or unlisted maintainer account as a contribution channel.
- After public interaction is explicitly opened, search existing work and discuss a large feature, public API change, new dependency, dialect change, or product-scope change before implementation.
- Report vulnerabilities only through the private process in [SECURITY.md](./SECURITY.md).

## Development Environment

- Rust 1.85 or newer; changes must remain compatible with Rust 1.85
- The `wasm32-unknown-unknown` target
- `wasm-pack`
- Node.js 24 or newer and npm for browser tests

```bash
rustup target add wasm32-unknown-unknown
```

## Repository Layout

```text
cron_maker/
|-- crates/
|   |-- cron_maker_core/     # Parsing, descriptions, scheduling, and errors
|   `-- cron_maker_web/      # WASM boundary and static browser app
|-- docs/                    # Scope, contract, maturity, release, and ownership
|-- .github/                 # Automation and community configuration
`-- AGENTS.md                # Repository rules for maintainers and agents
```

## Local Checks

Run the complete baseline before requesting review:

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

Build and serve the browser application:

```bash
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

For parsing or scheduling changes, add outcome-focused tests for valid input, invalid input, the 256-byte and 50-result boundaries, and the relevant time-zone or DST behavior.

For a time-zone database update, compare the bundled version with the official [IANA release](https://data.iana.org/time-zones/tzdb/version), review that release's `NEWS`, update the exact Jiff pins and both contract languages, and add fixed-timestamp tests for every affected region relevant to future schedules. Run the Supply chain workflow manually before release; its currency job rejects a bundled version older than IANA's current release.

## Frontend Changes

Before creating, modifying, reviewing, or debugging HTML or user-facing frontend code, use the `ui-ux-pro-max` skill as required by [AGENTS.md](./AGENTS.md). Include real-browser evidence at 375, 768, 1024, and 1440 pixel widths. Check keyboard operation, visible focus, accessible names, live status, overflow, overlap, console output, runtime requests, language switching, time-zone input, and copy behavior.

Do not add a CDN or runtime third-party request without an approved product, privacy, and security decision. The application must not transmit user-entered expressions or schedule results.

## Documentation and Language

- Public documentation defaults to English and links to a complete Simplified Chinese counterpart where one exists.
- Update both language versions in the same pull request when meaning changes.
- Write code comments in English only.
- Do not document planned behavior as implemented.
- Use `https://github.com/Tinkora/cron_maker` for repository links without asserting availability that has not been verified.
- Do not include previous identities, internal history, credentials, private paths, or emoji in Markdown.

## Commits

Use English [Conventional Commits](https://www.conventionalcommits.org/) and keep each commit logically complete. Examples:

```text
fix: reject unsupported weekday modifiers
docs: clarify DST overlap behavior
```

## Pull Request Process

This process is inactive while public interaction remains closed. Once Tinkora explicitly opens contributions:

1. Create a focused branch such as `fix/timezone-validation`.
2. Make the smallest complete change that addresses the issue.
3. Add or update tests and both documentation languages as required.
4. Run all relevant local checks and record any environment limitation.
5. Complete the pull request template when the target repository provides one, link the decision record, and describe user-visible effects.
6. Address review feedback with focused commits.

A pull request is ready to merge only when required checks pass, requested changes are resolved, the public contract is accurate, and no unrelated changes are included.

## Review Priorities

Reviewers evaluate, in order:

1. Correct five-field parsing and schedule results
2. Privacy, input safety, bounded resource use, and time-zone correctness
3. Compatibility with the public contract and Rust 1.85
4. Browser accessibility and usability
5. Test quality and long-term maintainability

## Community Standards

Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). Support and feature discussions belong in the channels described in [SUPPORT.md](./SUPPORT.md). Maintainer roles and decision rules are in [Maintainers](./docs/MAINTAINERS.md).
