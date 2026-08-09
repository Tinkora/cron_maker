# Maturity and Compatibility

[简体中文](./MATURITY.zh-CN.md)

## Current Status

cron_maker is a pre-1.0 codebase. Its core five-field path is implemented and covered by Rust and browser tests, but this status does not assert that a remote repository, hosted deployment, tag, package, or GitHub Release is currently available.

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Five-field parsing | Usable within contract | Rust tests cover values, names, lists, ranges, steps, aliases, invalid ranges, field counts, rejected modifiers, and byte limits |
| English and Chinese descriptions | Usable within contract | Rust tests cover common step, time, weekday, and month/day cases; wording is not a formal semantic proof for every expression |
| IANA time-zone scheduling | Usable within contract | Rust tests cover UTC progression, invalid zones, count limits, the scheduling horizon, DST gaps and overlaps, and the IANA 2026c Morocco scheduling and local-offset change |
| Browser application | Beta | Playwright covers real WASM, language switching, expression building, time-zone selection, automatic preview refresh, keyboard tabs, request privacy, console state, and overflow |
| Rust API | Pre-1.0 | Public and tested, but types and signatures may change before 1.0 |
| WASM API | Pre-1.0 | Used by the included application; no separately versioned npm distribution |
| Accessibility | Beta | Semantic controls, accessible labels, live status, keyboard tabs, and four viewport layouts are exercised; there is no third-party audit |
| Security | Best effort | Browser-local architecture and bounded input reduce exposure; there is no external audit or service-level response guarantee |

## Verified Invariants

The repository includes tests intended to prove these behaviors:

- Only the Unix/Vixie five-field dialect is accepted.
- Six- and seven-field expressions are rejected.
- `L`, `W`, `#`, `+`, and `?` extensions are rejected in the positions covered by the public contract.
- Standard month and weekday names, lists, ranges, and steps parse.
- Supported aliases retain a canonical lowercase alias and expand into five fields.
- Original expression input longer than 256 UTF-8 bytes is rejected before trimming.
- Restricted day-of-month and day-of-week fields use the tested Vixie OR rule.
- Requests above 50 occurrences are rejected; zero returns an empty list.
- IANA time-zone schedules skip a tested gap and return both timestamp instances in a tested overlap.
- The bundled IANA release is exposed, fixed at `2026c`, and covers Morocco's permanent UTC change in both scheduling and selected-zone `local_iso` formatting.
- Starting timestamps outside the documented proleptic Gregorian scheduling horizon are rejected instead of producing a misleading empty result.
- WASM structured results are JSON-compatible JavaScript objects.
- The browser starts in English and exposes a complete Simplified Chinese path.
- An open browser refreshes occurrences at minute boundaries and after visibility or focus resumes.
- The browser test observes no unexpected external requests, failed responses, console warnings or errors, or horizontal overflow in its configured runs.

Passing these tests does not certify every cron implementation, IANA database version, browser, locale, assistive technology, or operating environment.

## Compatibility Baseline

- Minimum supported Rust version: 1.85
- Rust edition: 2024
- Web build target: `wasm32-unknown-unknown`
- Bundled IANA time-zone database: `2026c`
- Browser-test runtime: Node.js 24 or newer
- Tested browser engine: Chromium through Playwright
- Automated viewport widths: 375, 768, 1024, and 1440 pixels
- Application and first-class documentation languages: English and Simplified Chinese

The repository must continue to compile with Rust 1.85. CI on a newer stable compiler does not substitute for an MSRV check.

## Known Limitations

- Only five-field Unix/Vixie cron is supported; there is no seconds or year field.
- `L`, `W`, `#`, `+`, and `?` are intentionally unsupported.
- Quartz and AWS dialects are not supported.
- The product previews times but does not install, execute, monitor, or alert on scheduled jobs.
- Description text is generated from validated syntax but should not replace review of critical schedules.
- DST behavior depends on the bundled IANA time-zone database and the scheduler's documented gap and overlap behavior.
- The bundled database is a release dependency; new IANA releases require an explicit dependency update and affected-zone regression tests.
- Schedule searches are bounded by the documented proleptic Gregorian horizon ending at the start of year 5000.
- The application has no accounts, saved schedules, synchronization, history, or collaboration.
- There is no CLI, MCP integration, Agent Skill, hosted API, npm release, crates.io release, or stable 1.0 API.
- Chromium automation at four widths is not a multi-browser compatibility guarantee.
- No public release availability is assumed by this document.

## Versioning Policy

The project follows Semantic Versioning for future releases, but versions below 1.0 may change the public contract in a minor release. Every user-visible or API-visible change must be recorded in the changelog. Patch releases should remain backward compatible within their minor line unless preserving incorrect or unsafe behavior would be unreasonable.

The criteria for 1.0 include:

1. At least one complete public release cycle with documented upgrade experience
2. A deliberate Rust and WASM API review
3. Stable five-field semantics and error-code policy
4. Reproducible release artifacts and enforced supply-chain checks
5. A maintained multi-browser and accessibility verification matrix
6. Evidence of sustained use and sufficient maintainer continuity
