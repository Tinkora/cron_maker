# Product Scope

[简体中文](./PRODUCT_SCOPE.zh-CN.md)

## Product Statement

cron_maker is a focused browser utility for creating, checking, explaining, and previewing Unix/Vixie five-field cron schedules. It helps developers and operators confirm an expression and its time-zone behavior without sending schedule data to an application service.

## Users and Jobs

| User | Job to be done |
| --- | --- |
| Developer | Build or validate a five-field cron expression without memorizing every field |
| Operator | Confirm the next execution times before installing a schedule |
| Reviewer | Compare an expression with English and Simplified Chinese descriptions |
| Distributed team | Evaluate wall-clock occurrences in a named IANA time zone across DST changes |

## Version 0.1 Scope

### Browser application

- Static application with no application backend, account, analytics, or schedule storage
- English by default with a complete Simplified Chinese language switch
- Visual five-field controls and a raw expression editor
- Built-in common presets and one-click expression copy
- Future-occurrence table with bundled-tzdb selected-zone time, UTC, and relative time
- Occurrence choices of 5, 10, 20, or 50

### Cron processing

- Exactly five Unix/Vixie fields: minute, hour, day of month, month, and day of week
- Wildcards, single values, comma-separated lists, inclusive ranges, steps, and range steps
- Numeric values plus standard `JAN`-`DEC` and `SUN`-`SAT` names where applicable
- Sunday represented by 0 or 7
- Vixie OR matching when day of month and day of week are both restricted
- Seven supported `@` aliases documented in the product contract
- Expression normalization, validation, English description, and Simplified Chinese description
- Maximum original expression input length of 256 UTF-8 bytes, measured before trimming

### Schedule preview

- Evaluation strictly after a supplied Unix timestamp
- UTC convenience evaluation and caller-selected IANA time-zone evaluation
- DST-aware wall-clock scheduling and selected-zone formatting through the bundled time-zone database
- Nonexistent fixed local times skipped in DST gaps and both repeated instances returned in DST overlaps
- Zero through 50 returned occurrences per core call
- UTC Unix seconds and ISO 8601 text across the WASM boundary

### Developer surface

- A Rust core crate for parsing, describing, and scheduling
- `wasm-bindgen` functions consumed by the included browser application
- JavaScript-compatible data objects and machine-readable error codes

Exact input and output behavior is normative in [Product Contract](./CONTRACT.md).

## Explicit Non-Goals

Version 0.1 does not provide:

- Six- or seven-field cron expressions, seconds fields, or year fields
- The non-Vixie modifiers `L`, `W`, `#`, `+`, or `?`
- Quartz or AWS scheduling dialects
- A scheduler daemon, job execution, process management, monitoring, alerts, or crontab installation
- Natural-language-to-cron generation
- Accounts, saved schedules, sync, collaboration, or history
- A hosted API, server-side computation, CLI, MCP integration, or Agent Skill
- An npm package, crates.io release, stable 1.0 API, or already-published Release
- Native mobile or desktop applications

These exclusions keep the product contract aligned with behavior that is implemented and tested.

## Privacy Boundary

The application does not intentionally transmit entered expressions or computed schedule data. Parsing, description, and scheduling happen in browser-loaded WASM. Static hosting still exposes normal asset-request metadata to the host, and browser extensions, a compromised browser, or a modified deployment can observe page content. Copying an expression places it on the system clipboard.

## Scope Change Gate

A proposed capability belongs in the product only when it has:

1. A demonstrated user problem that the current five-field workflow cannot solve adequately
2. A bounded implementation and maintenance owner
3. A privacy, security, compatibility, and resource-limit analysis
4. Outcome-focused Rust tests and a realistic browser verification plan
5. Equivalent English and Simplified Chinese documentation updates
6. An explicit decision about whether it changes the public contract

Proposals must remain labeled as proposed until implementation and verification are complete.
