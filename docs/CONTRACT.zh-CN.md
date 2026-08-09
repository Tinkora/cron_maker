# 产品契约

[English](./CONTRACT.md)

本文档定义 cron_maker 0.1 代码库已实现的输入、输出和错误行为。产品说明不得承诺超出本契约的能力。如果文档存在缺陷，以源码和测试为准。

## 支持的接口

1. `crates/cron_maker_web/static` 中的静态浏览器应用
2. `cron_maker_core` 的公开 Rust module 和 re-export
3. `cron_maker_web` 通过 `wasm-bindgen` 导出的 JavaScript function

项目不发布托管调度 API、CLI、MCP interface、Agent Skill、npm package 或 crates.io package。

## 表达式契约

### 结构与限制

表达式严格包含五个由空白分隔的字段：

```text
minute hour day-of-month month day-of-week
```

| 字段 | 接受的范围或名称 |
| --- | --- |
| 分钟 | 0 至 59 |
| 小时 | 0 至 23 |
| 日期 | 1 至 31 |
| 月份 | 1 至 12 或 `JAN` 至 `DEC` |
| 星期 | 0 至 7 或 `SUN` 至 `SAT`；0 和 7 都表示星期日 |

解析器首先将原始输入限制在 256 UTF-8 bytes，然后移除首尾空白，并把内部空白规范化为单个空格。因此首尾空白也计入 byte 限制。月份和星期名称会规范化为大写。

支持的字段形式包括 `*`、单值、逗号分隔列表、闭区间、`*/15` 形式的步进，以及 `1-9/2` 形式的范围步进；每种形式都必须满足对应字段的有效范围。

六字段和七字段输入会以 `INVALID_FIELD_COUNT` 拒绝。`L`、`W`、`#`、`+` 和 `?` 的标准非 Vixie 用法，在这些修饰符具有扩展语义的字段中会以 `UNSUPPORTED_SYNTAX` 拒绝；相同字符出现在其他无效字段文本中时可能返回 `PARSE_ERROR`。不接受秒字段或年份字段。

### 别名

别名不区分大小写。解析后的别名会保留规范化的小写形式，结构化字段则包含展开后的五字段值。

| 别名 | 展开后的表达式 |
| --- | --- |
| `@yearly`、`@annually` | `0 0 1 1 *` |
| `@monthly` | `0 0 1 * *` |
| `@weekly` | `0 0 * * 0` |
| `@daily`、`@midnight` | `0 0 * * *` |
| `@hourly` | `0 * * * *` |

包括 `@reboot` 在内的其他 `@` 值会以 `UNKNOWN_SHORTCUT` 拒绝。

### 日期匹配

当日期和星期都受限而不是 `*` 时，本地时间只要匹配其中一个字段就算匹配。这是 Vixie OR 规则。例如，`0 0 1 * MON` 会在每月 1 日以及每个星期一执行。

## 描述契约

`describe_en` 和 `describe_zh` 接受已解析的表达式，返回英文或简体中文诊断描述。WASM wrapper 会先执行解析，因此无效输入会产生结构化错误，而不会产生描述。描述措辞面向用户，可以在不改变调度语义的前提下优化。

## 调度契约

`next_executions_in_timezone` 将五字段 pattern 按调用方提供的 IANA 时区中的本地时间计算。时区数据库决定 UTC offset 和夏令时转换。DST 跳变中不存在的固定本地时间会被跳过。DST 回拨中重复的固定本地时间会按时间顺序返回两个 timestamp 实例，前提是它们晚于起始 timestamp。

当前基线通过 Jiff 内置 IANA `2026c`。原生测试、WebAssembly build、调度计算和所选时区本地 timestamp 格式化使用同一份数据，应用不会在 runtime 获取时区规则。`time_zone_database_version` 和 `wasm_time_zone_database_version` 会公开内置版本，浏览器页脚也会显示该版本。更新数据库可能有意改变未来执行结果和 `local_iso` offset；此类更新必须引用相关 [IANA NEWS](https://data.iana.org/time-zones/tzdb-2026c/NEWS) 条目，并为受影响时区增加固定 timestamp 回归测试。

- 起始值是以秒为单位的 Unix timestamp。
- 返回的 timestamp 严格晚于起始值。
- `count == 0` 返回空列表。
- Count 为 1 至 50 时最多返回对应数量的执行点。
- Count 大于 50 时返回 `RESULT_LIMIT_EXCEEDED`。
- 未知 IANA identifier 返回 `INVALID_TIME_ZONE`。
- 无法表示或超出受支持前推格里高利历调度范围的 Unix timestamp 返回 `INVALID_TIMESTAMP`。所选时区中的本地起点必须早于 `5000-01-01`，用于处理转换的两天回看范围不得早于 `0001-01-01`。
- `next_executions` 等价于使用 `UTC` 时区。

`format_timestamp` 将有效 timestamp 格式化为 UTC `YYYY-MM-DDTHH:MM:SSZ`。`format_timestamp_in_timezone` 使用内置数据库，将有效 timestamp 格式化为指定 IANA 时区中的 `YYYY-MM-DDTHH:MM:SS[+-]HH:MM`。`relative_time` 接受完整 signed 64-bit timestamp 范围；目标时间不晚于当前时间时返回 `now`，未来目标则返回紧凑的英文近似相对时间，单位依次为秒、分钟、小时、天、按 30 天计算的月或按 12 个月计算的年。

## Rust API

主要公开 Rust interface 包括：

- `parse_cron`、`validate_cron` 和 `expression_to_string`
- `CronDialect`、`CronExpression` 和 `CronField`
- `describe_en` 和 `describe_zh`
- `next_executions` 和 `next_executions_in_timezone`
- `time_zone_database_version`
- `format_timestamp`、`format_timestamp_in_timezone` 和 `relative_time`
- `MAX_EXPRESSION_BYTES` 和 `MAX_EXECUTION_COUNT`
- `CoreError`

序列化表达式结构和 Rust signature 都是 1.0 之前的接口，可能依据下述兼容策略发生变化。

## WebAssembly API

由 `CoreError` 产生的错误会作为带有字符串 `code` 和 `message` property 的 JavaScript object 抛出。成功的结构化值是与 JSON 兼容的普通 JavaScript value。

| Function | 结果 |
| --- | --- |
| `wasm_parse_cron(expression)` | 已解析的 `CronExpression` object |
| `wasm_validate_cron(expression)` | 包含 `valid`、`dialect`、`field_count` 和 `canonical` 的 object |
| `wasm_describe_en(expression)` | 英文描述 string |
| `wasm_describe_zh(expression)` | 简体中文描述 string |
| `wasm_next_executions(expression, from_unix, count, time_zone)` | Object array，每项包含 `unix`、UTC `iso`、由内置 tzdb 生成的 `local_iso` 和原样返回的 `time_zone` |
| `wasm_time_zone_database_version()` | 内置 IANA 版本，例如 `2026c` |
| `wasm_build_expression(minute, hour, day_of_month, month, day_of_week)` | 包含规范化 `expression`、`description_en` 和 `description_zh` 的 object |
| `wasm_get_presets()` | 十个内置标签和表达式组成的 array |

`from_unix` 以兼容 BigInt 的 signed 64-bit integer 形式穿过生成的 WASM JavaScript 边界。浏览器应用使用 `BigInt` 传入。

## 浏览器应用契约

- 初始语言为英文。语言控件可将可见及无障碍界面切换为简体中文并切回。
- 可视化模式和原始表达式模式共享同一份已验证表达式状态。
- 执行次数控件提供 5、10、20 和 50。
- 时区控件优先使用浏览器解析出的 IANA 时区，无法获取时回退为 `UTC`。
- 结果表展示由内置 tzdb 生成的所选时区 `local_iso`、UTC 和浏览器本地化的相对时间。浏览器不会使用宿主时区数据库重新解释执行 timestamp。
- 结果表会在分钟边界以及可见页面恢复或重新获得焦点时刷新。
- 页脚显示内置 IANA 时区数据库版本。
- 复制控件通过 Clipboard API 写入当前表达式；失败时报告错误且不修改表达式。
- 解析、描述和执行时间计算均由本地加载的 WASM module 完成。

## 机器可读错误码

| 错误码 | 条件 |
| --- | --- |
| `EMPTY_EXPRESSION` | 表达式 trim 后为空 |
| `PARSE_ERROR` | 五字段语法、字段范围或其他解析规则无效 |
| `INVALID_FIELD_COUNT` | 展开后的表达式并非严格五字段 |
| `UNKNOWN_SHORTCUT` | `@` 别名不受支持 |
| `UNSUPPORTED_SYNTAX` | 被拒绝的非 Vixie 修饰符出现在其具有扩展语义的字段中 |
| `EXPRESSION_TOO_LONG` | 原始表达式输入超过 256 UTF-8 bytes |
| `INVALID_TIME_ZONE` | 所提供的值不是可识别的 IANA 时区 |
| `INVALID_TIMESTAMP` | 所提供的 Unix timestamp 无法表示或超出受支持的调度范围 |
| `RESULT_LIMIT_EXCEEDED` | 请求的执行次数超过 50 |

英文错误消息属于诊断文本，可以继续优化。调用方应按 `code` 分支，而不是依赖消息措辞。

## 兼容策略

代码库尚未达到 1.0。Rust type、WASM signature、序列化值、生成的描述和 UI 结构可能在 minor release 中变化，但必须在 [CHANGELOG.md](../CHANGELOG.md) 中记录，并同步更新两种语言的契约。维护者不应将现有错误码复用于另一种条件，并应为有意的契约变化提供迁移说明。
