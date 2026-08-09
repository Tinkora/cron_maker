# Product Contract

[简体中文](./CONTRACT.zh-CN.md)

This document defines the implemented input, output, and error behavior for the cron_maker 0.1 codebase. Product descriptions must not promise behavior beyond this contract. Source and tests remain authoritative if a documentation defect is found.

## Supported Interfaces

1. The static browser application in `crates/cron_maker_web/static`
2. The public Rust modules and re-exports in `cron_maker_core`
3. The JavaScript functions exported through `wasm-bindgen` by `cron_maker_web`

The project does not publish a hosted scheduling API, CLI, MCP interface, Agent Skill, npm package, or crates.io package.

## Expression Contract

### Shape and limits

An expression contains exactly five whitespace-separated fields:

```text
minute hour day-of-month month day-of-week
```

| Field | Accepted range or names |
| --- | --- |
| Minute | 0 through 59 |
| Hour | 0 through 23 |
| Day of month | 1 through 31 |
| Month | 1 through 12 or `JAN` through `DEC` |
| Day of week | 0 through 7 or `SUN` through `SAT`; 0 and 7 are Sunday |

The parser first limits the original input to 256 UTF-8 bytes, then trims leading and trailing whitespace and normalizes internal whitespace to single spaces. Leading and trailing whitespace therefore counts toward the byte limit. Month and weekday names are canonicalized to uppercase.

Supported field forms are `*`, a single value, a comma-separated list, an inclusive range, a step such as `*/15`, or a range step such as `1-9/2`, subject to the field's valid range.

Six- and seven-field inputs are rejected with `INVALID_FIELD_COUNT`. The standard non-Vixie uses of `L`, `W`, `#`, `+`, and `?` are rejected with `UNSUPPORTED_SYNTAX` in the fields where those modifiers have extension semantics. The same characters in other invalid field text can produce `PARSE_ERROR`. No seconds or year field is accepted.

### Aliases

Aliases are case-insensitive. A parsed alias retains a lowercase canonical alias while its structured fields contain the expanded five-field form.

| Alias | Expanded expression |
| --- | --- |
| `@yearly`, `@annually` | `0 0 1 1 *` |
| `@monthly` | `0 0 1 * *` |
| `@weekly` | `0 0 * * 0` |
| `@daily`, `@midnight` | `0 0 * * *` |
| `@hourly` | `0 * * * *` |

Other `@` values, including `@reboot`, are rejected with `UNKNOWN_SHORTCUT`.

### Day matching

When both day of month and day of week are restricted rather than `*`, a wall-clock time matches when either field matches. This is the Vixie OR rule. For example, `0 0 1 * MON` runs on the first day of each month and on every Monday.

## Description Contract

`describe_en` and `describe_zh` accept a parsed expression and return English or Simplified Chinese diagnostic descriptions. The WASM wrappers parse before describing, so invalid input produces a structured error rather than a description. Description wording is human-facing and may be clarified without changing scheduling semantics.

## Scheduling Contract

`next_executions_in_timezone` evaluates the five-field pattern as wall-clock time in a caller-supplied IANA time zone. The time-zone database determines offsets and daylight-saving transitions. A nonexistent fixed local time in a DST gap is skipped. Both timestamp instances of a repeated fixed local time in a DST overlap are returned, in chronological order, when they fall after the starting timestamp.

This baseline bundles IANA release `2026c` through Jiff. The same data is used by native tests, the WebAssembly build, schedule calculation, and selected-zone local timestamp formatting; the application does not fetch time-zone rules at runtime. `time_zone_database_version` and `wasm_time_zone_database_version` expose the bundled release, and the browser footer displays it. Updating the database can intentionally change future occurrence results and `local_iso` offsets. Such an update must cite the relevant [IANA NEWS](https://data.iana.org/time-zones/tzdb-2026c/NEWS) entries and add fixed-timestamp regression coverage for affected zones.

- The starting value is a Unix timestamp in seconds.
- Returned timestamps are strictly later than the starting value.
- `count == 0` returns an empty list.
- Counts from 1 through 50 return at most that many occurrences.
- Counts greater than 50 return `RESULT_LIMIT_EXCEEDED`.
- An unknown IANA identifier returns `INVALID_TIME_ZONE`.
- A Unix timestamp that cannot be represented or falls outside the supported proleptic Gregorian scheduling horizon returns `INVALID_TIMESTAMP`. The selected-zone local start must be before `5000-01-01`, and the two-day transition lookback must not precede `0001-01-01`.
- `next_executions` is equivalent to using the `UTC` zone.

`format_timestamp` formats a valid timestamp as UTC `YYYY-MM-DDTHH:MM:SSZ`. `format_timestamp_in_timezone` uses the bundled database and formats a valid timestamp as `YYYY-MM-DDTHH:MM:SS[+-]HH:MM` in the requested IANA zone. `relative_time` accepts the full signed 64-bit timestamp range and returns `now` when the target is not later; future targets produce a compact English approximation in seconds, minutes, hours, days, months of 30 days, or years of 12 such months.

## Rust API

The primary public Rust surface is:

- `parse_cron`, `validate_cron`, and `expression_to_string`
- `CronDialect`, `CronExpression`, and `CronField`
- `describe_en` and `describe_zh`
- `next_executions` and `next_executions_in_timezone`
- `time_zone_database_version`
- `format_timestamp`, `format_timestamp_in_timezone`, and `relative_time`
- `MAX_EXPRESSION_BYTES` and `MAX_EXECUTION_COUNT`
- `CoreError`

Serialized expression structures and Rust signatures are pre-1.0 interfaces and may change under the compatibility policy below.

## WebAssembly API

Errors derived from `CoreError` are thrown as JavaScript objects with string `code` and `message` properties. Successful structured values are JSON-compatible plain JavaScript values.

| Function | Result |
| --- | --- |
| `wasm_parse_cron(expression)` | Parsed `CronExpression` object |
| `wasm_validate_cron(expression)` | Object with `valid`, `dialect`, `field_count`, and `canonical` |
| `wasm_describe_en(expression)` | English description string |
| `wasm_describe_zh(expression)` | Simplified Chinese description string |
| `wasm_next_executions(expression, from_unix, count, time_zone)` | Array of objects with `unix`, UTC `iso`, bundled-tzdb `local_iso`, and echoed `time_zone` |
| `wasm_time_zone_database_version()` | Bundled IANA release such as `2026c` |
| `wasm_build_expression(minute, hour, day_of_month, month, day_of_week)` | Object with canonical `expression`, `description_en`, and `description_zh` |
| `wasm_get_presets()` | Array of ten built-in labels and expressions |

`from_unix` crosses the generated WASM JavaScript boundary as a BigInt-compatible signed 64-bit integer. The browser application supplies it with `BigInt`.

## Browser Application Contract

- English is the initial language. The language control switches the visible and accessible interface to Simplified Chinese and back.
- The visual and raw-expression modes share one validated expression state.
- The occurrence control offers 5, 10, 20, and 50.
- The time-zone control starts from the browser's resolved IANA zone when available and falls back to `UTC`.
- The result table shows bundled-tzdb `local_iso` selected-zone time, UTC, and a browser-localized relative time. The browser does not reinterpret occurrence timestamps with its host time-zone database.
- The result table refreshes at minute boundaries and when a visible page resumes or regains focus.
- The footer shows the bundled IANA time-zone database release.
- The copy control writes the current expression through the Clipboard API and reports failure without changing the expression.
- Parsing, descriptions, and occurrence calculation are performed by the locally loaded WASM module.

## Machine-Readable Error Codes

| Code | Condition |
| --- | --- |
| `EMPTY_EXPRESSION` | The expression is empty after trimming |
| `PARSE_ERROR` | Five-field syntax, a field range, or another parser rule is invalid |
| `INVALID_FIELD_COUNT` | The expanded expression does not contain exactly five fields |
| `UNKNOWN_SHORTCUT` | An `@` alias is not supported |
| `UNSUPPORTED_SYNTAX` | A rejected non-Vixie modifier is used in a field where it has extension semantics |
| `EXPRESSION_TOO_LONG` | The original expression input exceeds 256 UTF-8 bytes |
| `INVALID_TIME_ZONE` | The supplied value is not a recognized IANA time zone |
| `INVALID_TIMESTAMP` | The supplied Unix timestamp cannot be represented or lies outside the supported scheduling horizon |
| `RESULT_LIMIT_EXCEEDED` | The requested occurrence count exceeds 50 |

English error messages are diagnostic text and may be clarified. Consumers should branch on `code`, not message wording.

## Compatibility Policy

The codebase is pre-1.0. Rust types, WASM signatures, serialized values, generated descriptions, and UI structure may change in a minor release when the change is documented in [CHANGELOG.md](../CHANGELOG.md) and both contract languages are updated. Maintainers should not reuse an existing error code for a different condition and should provide migration guidance for intentional contract changes.
