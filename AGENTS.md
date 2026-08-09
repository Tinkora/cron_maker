# Repository Guide for AI Agents

## Project Overview

cron_maker is a browser-local Unix/Vixie cron builder, validator, explainer, and execution preview. Rust owns parsing, English and Simplified Chinese descriptions, and IANA time-zone scheduling; the browser calls that logic through WebAssembly.

The implemented dialect is five-field Unix cron only. Do not claim support for six- or seven-field expressions, seconds or year fields, Quartz, AWS scheduling syntax, `L`, `W`, `#`, `+`, `?`, a CLI, MCP integration, an Agent Skill, a hosted API, or a published package or release.

## Public Content Rules

- Public documentation defaults to English and links to a complete Simplified Chinese counterpart where one exists.
- Update both language versions in the same change when meaning changes.
- Write all new or modified code comments in English only.
- Do not include superseded identity details, local absolute paths, credentials, or private operational notes.
- Do not use emoji in Markdown.
- Use `https://github.com/Tinkora/cron_maker` as the repository URL, without claiming that a deployment, package, tag, or release is available before it has been published and verified.
- Treat [docs/CONTRACT.md](./docs/CONTRACT.md) as the normative public contract and keep it aligned with implementation and tests.
- Describe proposed work as proposed. Never present a checklist, issue, or design idea as shipped behavior.

## Architecture

```text
cron_maker/
|-- crates/
|   |-- cron_maker_core/
|   |   `-- src/             # Parsing, descriptions, scheduling, and errors
|   `-- cron_maker_web/
|       |-- src/lib.rs       # JavaScript ABI exported through wasm-bindgen
|       |-- static/          # English-first bilingual browser application
|       `-- tests/browser/   # Four-viewport Playwright coverage
|-- docs/                    # Scope, contract, maturity, release, and ownership
|-- .github/                 # Repository automation
|-- Cargo.toml               # Rust 1.85 workspace and shared dependencies
`-- AGENTS.md                # This repository-specific guide
```

`cron_maker_core` owns the cron contract. The browser must call the exported WASM functions instead of reimplementing parsing or schedule calculation in JavaScript.

## Key Files

| File | Responsibility |
| --- | --- |
| `crates/cron_maker_core/src/parse.rs` | Five-field parsing, aliases, normalization, rejected syntax, and the 256-byte limit |
| `crates/cron_maker_core/src/describe.rs` | English and Simplified Chinese descriptions |
| `crates/cron_maker_core/src/schedule.rs` | IANA time-zone scheduling, DST behavior, and the 50-result limit |
| `crates/cron_maker_core/src/error.rs` | `CoreError` and machine-readable error codes |
| `crates/cron_maker_web/src/lib.rs` | WASM functions and JavaScript-compatible results |
| `crates/cron_maker_web/static/index.html` | Semantic browser application structure |
| `crates/cron_maker_web/static/app.js` | UI state, localization, WASM calls, formatting, and copy behavior |
| `crates/cron_maker_web/static/styles.css` | Responsive layout and visual states |
| `crates/cron_maker_web/package.json` | Reproducible WASM build, server, and browser-test commands |
| `crates/cron_maker_web/tests/browser/workbench.spec.js` | WASM, localization, privacy, keyboard, time-zone, and overflow checks |
| `docs/CONTRACT.md` | Normative public inputs, outputs, limits, and errors |

## Build and Test Commands

The minimum supported Rust version is 1.85, the workspace uses Rust edition 2024, and browser tests require Node.js 24 or newer.

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

Serve the built application over HTTP:

```bash
cd crates/cron_maker_web
npm ci
npm run build:wasm
npm run serve
```

Do not commit `target`, generated `pkg`, Playwright traces, screenshots, or other generated output.

## Core Invariants

### Expression contract

- Accept exactly five fields in this order: minute, hour, day of month, month, day of week.
- Ranges are minute 0-59, hour 0-23, day of month 1-31, month 1-12 or `JAN`-`DEC`, and day of week 0-7 or `SUN`-`SAT`; 0 and 7 are Sunday.
- Accept `*`, single values, comma-separated lists, inclusive ranges, steps, and range steps when the underlying five-field parser validates them.
- Accept only `@yearly`, `@annually`, `@monthly`, `@weekly`, `@daily`, `@midnight`, and `@hourly` aliases, case-insensitively.
- Reject six- and seven-field input. Reject the non-Vixie modifiers `L`, `W`, `#`, `+`, and `?`.
- Limit the original expression input to 256 UTF-8 bytes before trimming. This is a byte limit, not a character limit.
- When day of month and day of week are both restricted, match when either field matches, following Vixie OR semantics.

### Scheduling contract

- Evaluate the expression as wall-clock time in a caller-supplied IANA time zone.
- Use the exact bundled `jiff-tzdb` dependency for native and WASM scheduling; expose its IANA release through Rust, WASM, and the browser footer.
- Apply time-zone database DST transitions rather than a fixed UTC offset.
- Skip nonexistent fixed local times in a DST gap and return both instances of a repeated fixed local time in a DST overlap.
- Return occurrences strictly after the supplied Unix timestamp as Unix seconds.
- Return at most 50 occurrences. A count of zero returns an empty list; a larger count is rejected.
- `next_executions` is the UTC convenience wrapper; `next_executions_in_timezone` is the zone-aware API used by the browser.

### Browser contract

- English is the default interface; a complete Simplified Chinese switch updates visible and accessible UI text.
- The visual editor and raw expression editor operate on the same validated five-field expression.
- The occurrence selector offers 5, 10, 20, or 50 rows.
- Refresh occurrence previews at minute boundaries and when a visible page resumes or regains focus.
- Expression parsing, descriptions, and schedule calculation remain in browser-local WASM.
- New runtime network requests require an explicit product, privacy, and security decision.

## Machine-Readable Error Codes

Keep these identifiers synchronized with `CoreError::code()` and `docs/CONTRACT.md`:

| Code | Meaning |
| --- | --- |
| `EMPTY_EXPRESSION` | The trimmed expression is empty |
| `PARSE_ERROR` | A five-field expression fails syntax or range validation |
| `INVALID_FIELD_COUNT` | Input does not contain exactly five fields |
| `UNKNOWN_SHORTCUT` | An `@` alias is not in the supported alias set |
| `UNSUPPORTED_SYNTAX` | A rejected non-Vixie modifier is used in a field where it has extension semantics |
| `EXPRESSION_TOO_LONG` | The original expression input exceeds 256 UTF-8 bytes |
| `INVALID_TIME_ZONE` | The time-zone identifier is not recognized as an IANA zone |
| `INVALID_TIMESTAMP` | The timestamp cannot be represented or its selected-zone local start falls outside years 1 through 4999, including the required two-day transition lookback |
| `RESULT_LIMIT_EXCEEDED` | The requested occurrence count exceeds 50 |

WASM errors derived from `CoreError` are JavaScript objects with string `code` and `message` properties. Error message wording is diagnostic and is not the stable branch key.

## Change Requirements

- Add outcome-focused tests for successful input, invalid input, byte and count boundaries, time zones, and failure behavior.
- Preserve the parser as the only authority for expression validation.
- Keep user expressions and schedule data local to the browser.
- For every time-zone database update, review the matching IANA `NEWS`, update both contract languages and the changelog, and add fixed-timestamp tests for affected zones.
- Verify DST changes with fixed timestamps and named IANA zones.
- Update `CHANGELOG.md` for user-visible behavior or compatibility changes.
- Update English and Simplified Chinese contract documents together.
- Keep edits scoped; do not refactor unrelated modules while addressing a focused change.

## Commit Language

- Write commit subjects and bodies in English and follow Conventional Commits.
- This repository-level rule overrides any global preference for another commit-message language.

## Frontend Design Requirement

- Before creating, modifying, reviewing, or debugging any HTML page or user-facing frontend, invoke the `ui-ux-pro-max` skill.
- Run the skill's required `--design-system` search before editing, followed by relevant stack and UX searches.
- If `ui-ux-pro-max` is unavailable, stop frontend work and report the missing prerequisite.
- Verify the rendered result in a real browser at 375, 768, 1024, and 1440 pixel widths.
- Check console errors and warnings, runtime network requests, keyboard navigation, visible focus, accessible labels and announcements, reduced motion, overflow, overlap, expression validation, language switching, IANA time zones, DST-sensitive previews, and copy behavior.
