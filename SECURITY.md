# Security Policy

[简体中文](./SECURITY.zh-CN.md)

## Supported Versions

| Version or branch | Support status |
| --- | --- |
| Current pre-release codebase | Best-effort fixes |
| Published releases | None are assumed available by this policy |
| Older snapshots | Not supported unless explicitly named in a future advisory |

cron_maker is maintained by a small team. Security fixes are prioritized, but there is no service-level response or backport guarantee. Update this table when the first release is actually published.

## Report a Vulnerability Privately

Do not open a public issue, discussion, or pull request for a suspected vulnerability.

The intended private channel is the target repository's [private vulnerability report form](https://github.com/Tinkora/cron_maker/security/advisories/new). Verify that the link opens a private advisory form before submitting details. Its inclusion here does not assert that the target repository or feature is currently available.

If the private form is unavailable, do not publish the report. Contact a Tinkora organization owner through an existing trusted private channel and ask for a confidential reporting path.

Include:

- The affected commit, build, browser, and operating system
- Reproduction steps or a minimal proof of concept
- Expected and observed behavior
- Security impact and required user interaction
- Whether expression or schedule data left the browser
- Any suggested mitigation or disclosure constraint

Response and remediation time depends on reproducibility, severity, and maintainer availability. No fixed acknowledgement deadline is promised.

## In Scope

- User-entered expressions or schedule results leaving the browser because of application behavior
- Script or markup injection through expressions, descriptions, status messages, or copied values
- Bypasses of the 256 UTF-8 byte expression limit or 50-occurrence result limit
- Parser discrepancies that accept syntax explicitly rejected by the public contract
- IANA time-zone or DST calculation defects with a concrete security impact
- WebAssembly memory-safety or sandbox-boundary issues attributable to this project
- Dependency vulnerabilities that materially affect cron_maker
- Repository automation or release-artifact supply-chain compromise

## Usually Out of Scope

- Browser, operating-system, or dependency issues that do not materially affect cron_maker
- Hosting-provider logs for ordinary static asset requests
- Social engineering, physical attacks, or denial of service against the hosting provider
- Reports based only on automated scanner output without reproducible impact
- Unsupported forks or modified deployments
- Requests for an unsupported cron dialect or product feature

Maintainers may still help route a credible upstream report.

## Security and Privacy Model

cron_maker is a static browser application. Parsing, descriptions, and occurrence calculation run in Rust/WASM loaded by the page. The implemented application has no account system, database, analytics, scheduler service, or hosted API, and it does not intentionally transmit entered expressions or computed schedules.

This boundary does not make the browsing session anonymous:

- A static host receives normal requests for HTML, CSS, JavaScript, WebAssembly, and related metadata.
- Browser extensions, a compromised browser, or a modified deployment can observe page content.
- Copying an expression writes it to the system clipboard, where other software may be able to read it.
- Time-zone identifiers and schedules can reveal operational patterns; use synthetic examples in public reports.
- Dependency and browser vulnerabilities may affect the loaded application even when project code makes no external runtime request.

User-controlled values are rendered through text-oriented DOM APIs in the included browser code. This is a design property, not a substitute for testing or deployment-level security headers.

## Coordinated Disclosure

Maintainers will validate the report, assess affected code, prepare a fix and regression tests, and coordinate disclosure through the private channel. Public disclosure should wait until a fix or agreed mitigation is available. Credit is optional and follows the reporter's preference.
