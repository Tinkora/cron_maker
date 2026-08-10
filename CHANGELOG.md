# Changelog

All notable changes to cron_maker will be documented in this file. The project intends to follow [Semantic Versioning](https://semver.org/) when publishing releases.

## [Unreleased]

### Changed

- Nothing yet.

## [0.1.0] - 2026-08-11

### Added

- Initial browser-local Rust and WebAssembly implementation for Unix/Vixie five-field cron expressions
- Visual and raw expression editors with common five-field presets
- English and Simplified Chinese descriptions and interface text
- IANA 2026c time-zone occurrence previews whose scheduling and selected-zone display share the bundled data, with DST-aware wall-clock evaluation and a visible data version
- Minute-boundary and page-resume refreshes that prevent stale occurrence previews
- Limits of 256 UTF-8 bytes per expression and 50 occurrences per request
- Public product scope, contract, maturity, release, maintainership, security, support, contribution, and community-governance documentation

### Fixed

- Selected-zone timestamps now use the same bundled IANA data as schedule calculation instead of the browser host database
- Custom visual field values remain synchronized with the raw expression across language changes
- Occurrence columns remain fully visible across the single-column and two-column layout boundary
- Relative-time formatting handles the full signed 64-bit timestamp range without overflow

### Security

- Expression parsing and schedule calculation remain in the browser-loaded WASM module
- Bounded expression and result sizes limit resource use from untrusted input
- The npm lockfile is restricted to HTTPS package URLs from the official npm registry

### Known limitations

- Only five-field Unix/Vixie cron is supported
- Six- and seven-field expressions and `L`, `W`, `#`, `+`, and `?` are rejected
- Quartz, AWS scheduling syntax, CLI, MCP integration, Agent Skill, hosted API, and published packages are not provided

[Unreleased]: https://github.com/Tinkora/cron_maker/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Tinkora/cron_maker/releases/tag/v0.1.0
