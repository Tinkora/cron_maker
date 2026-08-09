# Maintainers

[简体中文](./MAINTAINERS.zh-CN.md)

## Project Ownership

cron_maker is stewarded by the [Tinkora organization](https://github.com/Tinkora). Maintainers protect the five-field product contract, browser-local privacy boundary, release integrity, and the documented process for any future public contributions.

## Maintainer Team

| Team | Role | Responsibilities |
| --- | --- | --- |
| Tinkora cron_maker maintainers | Project stewards | Triage, review, repository settings, releases, and private security coordination |

No individual account is designated as a permanent authority in this document. Before a public release, the release record must identify a release owner and reviewer, and repository access must make continuity possible without relying on an undocumented personal credential.

## Responsibilities

- Keep behavior, tests, the public contract, and bilingual documentation aligned.
- Triage reports without promising unsupported timelines.
- Review changes for correctness, privacy, accessibility, compatibility, and maintenance cost.
- Require relevant automated and manual evidence before merge and release.
- Keep repository and organization permissions at least privilege.
- Coordinate vulnerabilities through a verified private channel.
- Record scope and compatibility decisions in a reviewable repository artifact.
- Avoid presenting proposed integrations or release plans as available capabilities.

## Decision Process

Routine fixes and documentation improvements are decided through pull request review. Changes to cron dialect, public Rust or WASM interfaces, input or result limits, time-zone semantics, privacy behavior, dependencies with material supply-chain impact, or release policy require a linked issue or discussion recording:

1. The user problem and evidence
2. Alternatives and maintenance cost
3. Privacy, security, and compatibility consequences
4. Test and release plan
5. The final maintainer decision

Maintainers seek consensus among active reviewers. If consensus is not possible, the designated release owner records the decision and rationale before merge.

## Review and Release

- Authors should not approve their own pull requests.
- Code, workflow, dependency, security, and release changes should receive independent review when another qualified reviewer is available.
- Required automated checks and reproducible verification evidence are mandatory even when only one maintainer is active.
- Security-sensitive changes may remain private until coordinated disclosure.
- Public commit history uses English Conventional Commits.
- Every release uses [Release Checklist](./RELEASE_CHECKLIST.md) and names its owner and reviewer.

## Becoming a Maintainer

Maintainer access is earned through sustained contributions demonstrating technical judgment, respectful review, reliable follow-through, and familiarity with the product and security contracts. Access should be granted incrementally: triage or review responsibility should precede repository administration and release authority.

## Continuity

A maintainer expecting to be unavailable should transfer open review, security, and release responsibilities through documented organization roles. Package publishing, deployment, organization ownership, and release credentials must not depend on an undocumented personal token.

Governance questions use a channel explicitly named in [SUPPORT.md](../SUPPORT.md) only after public interaction is opened. Security matters follow [SECURITY.md](../SECURITY.md).
