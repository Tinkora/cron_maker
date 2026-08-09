# Support

[简体中文](./SUPPORT.zh-CN.md)

## Choose the Right Channel

Public support is not currently open. Issues and Discussions remain disabled while Tinkora establishes sustainable moderation and a separate private conduct-reporting channel. Do not treat an unlisted chat room, email address, social account, or maintainer account as an official support channel.

Use the [README](./README.md), [Product Contract](./docs/CONTRACT.md), and [Maturity](./docs/MATURITY.md) for self-service guidance. Suspected vulnerabilities use the repository's [private vulnerability report](https://github.com/Tinkora/cron_maker/security/advisories/new) after verifying that it opens a private advisory form; follow [SECURITY.md](./SECURITY.md). That form accepts security vulnerabilities only and is not a support or conduct channel.

When public interaction is explicitly opened, this document will name the verified channels and their scope. Until then, no response-time or individual support commitment is offered.

## Before Asking

1. Read the [README](./README.md), [Product Contract](./docs/CONTRACT.md), and [Maturity](./docs/MATURITY.md).
2. Confirm whether the request fits the five-field Unix/Vixie contract.
3. Reproduce against the current codebase or an identified published version when one exists.
4. Record the commit or version, browser, operating system, expression, IANA time zone, starting timestamp, requested count, and observed error code.
5. Reduce sensitive data and include the exact failing command or browser steps.

For DST reports, include a fixed Unix timestamp, the exact IANA identifier, expected UTC timestamps, and the time-zone database context when known. For build failures, include relevant error output but remove tokens and local secrets.

## Support Boundaries

Community support is best effort and has no guaranteed response time. Maintainers support the documented codebase and a current release when one exists, not custom forks, unrelated schedulers, browser extensions, or third-party hosting configurations.

Requests for six- or seven-field syntax, `L`, `W`, `#`, `+`, `?`, Quartz, AWS scheduling syntax, a CLI, MCP integration, or an Agent Skill are feature proposals outside the current contract, not usage defects.

When public interaction opens, general questions belong in the explicitly named discussion channel and issues should describe actionable behavior. Security reports must always follow [SECURITY.md](./SECURITY.md).
