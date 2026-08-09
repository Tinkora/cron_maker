use cron_maker_core::{self as core, CoreError};
use wasm_bindgen::prelude::*;

fn core_err(error: CoreError) -> JsValue {
    let object = js_sys::Object::new();
    js_sys::Reflect::set(&object, &"code".into(), &error.code().into()).ok();
    js_sys::Reflect::set(&object, &"message".into(), &error.to_string().into()).ok();
    object.into()
}

fn serialize<T: serde::Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde::Serialize::serialize(value, &serde_wasm_bindgen::Serializer::json_compatible())
        .map_err(|error| JsValue::from_str(&format!("Serialization failed: {error}")))
}

/// Parse a Unix cron expression into validated fields.
#[wasm_bindgen]
pub fn wasm_parse_cron(expression: &str) -> Result<JsValue, JsValue> {
    serialize(&core::parse_cron(expression).map_err(core_err)?)
}

/// Validate a Unix cron expression and return its public contract metadata.
#[wasm_bindgen]
pub fn wasm_validate_cron(expression: &str) -> Result<JsValue, JsValue> {
    let parsed = core::parse_cron(expression).map_err(core_err)?;
    serialize(&serde_json::json!({
        "valid": true,
        "dialect": parsed.dialect,
        "field_count": parsed.field_count,
        "canonical": core::expression_to_string(&parsed),
    }))
}

/// Generate a validated English description.
#[wasm_bindgen]
pub fn wasm_describe_en(expression: &str) -> Result<String, JsValue> {
    let parsed = core::parse_cron(expression).map_err(core_err)?;
    core::describe_en(&parsed).map_err(core_err)
}

/// Generate a validated Simplified Chinese description.
#[wasm_bindgen]
pub fn wasm_describe_zh(expression: &str) -> Result<String, JsValue> {
    let parsed = core::parse_cron(expression).map_err(core_err)?;
    core::describe_zh(&parsed).map_err(core_err)
}

/// Compute future occurrences using wall-clock time in an IANA time zone.
#[wasm_bindgen]
pub fn wasm_next_executions(
    expression: &str,
    from_unix: i64,
    count: u32,
    time_zone: &str,
) -> Result<JsValue, JsValue> {
    let parsed = core::parse_cron(expression).map_err(core_err)?;
    let timestamps = core::next_executions_in_timezone(&parsed, from_unix, count, time_zone)
        .map_err(core_err)?;

    let results = timestamps
        .into_iter()
        .map(|timestamp| -> Result<_, CoreError> {
            Ok(serde_json::json!({
                "unix": timestamp,
                "iso": core::format_timestamp(timestamp),
                "local_iso": core::format_timestamp_in_timezone(timestamp, time_zone)?,
                "time_zone": time_zone,
            }))
        })
        .collect::<Result<Vec<_>, _>>()
        .map_err(core_err)?;
    serialize(&results)
}

/// Return the bundled IANA Time Zone Database release.
#[wasm_bindgen]
pub fn wasm_time_zone_database_version() -> String {
    core::time_zone_database_version().to_string()
}

/// Build and validate a five-field Unix cron expression.
#[wasm_bindgen]
pub fn wasm_build_expression(
    minute: &str,
    hour: &str,
    day_of_month: &str,
    month: &str,
    day_of_week: &str,
) -> Result<JsValue, JsValue> {
    let expression = format!("{minute} {hour} {day_of_month} {month} {day_of_week}");
    let parsed = core::parse_cron(&expression).map_err(core_err)?;
    serialize(&serde_json::json!({
        "expression": core::expression_to_string(&parsed),
        "description_en": core::describe_en(&parsed).map_err(core_err)?,
        "description_zh": core::describe_zh(&parsed).map_err(core_err)?,
    }))
}

/// Return the supported Unix cron presets.
#[wasm_bindgen]
pub fn wasm_get_presets() -> Result<JsValue, JsValue> {
    serialize(&serde_json::json!([
        {"label_en": "Hourly", "label_zh": "每小时", "expression": "@hourly"},
        {"label_en": "Daily", "label_zh": "每天", "expression": "@daily"},
        {"label_en": "Weekly", "label_zh": "每周", "expression": "@weekly"},
        {"label_en": "Monthly", "label_zh": "每月", "expression": "@monthly"},
        {"label_en": "Yearly", "label_zh": "每年", "expression": "@yearly"},
        {"label_en": "Every 15 minutes", "label_zh": "每15分钟", "expression": "*/15 * * * *"},
        {"label_en": "Every 6 hours", "label_zh": "每6小时", "expression": "0 */6 * * *"},
        {"label_en": "Weekdays at 09:30", "label_zh": "工作日9:30", "expression": "30 9 * * 1-5"},
        {"label_en": "Daily at midnight", "label_zh": "每天午夜", "expression": "0 0 * * *"},
        {"label_en": "Sunday at 02:00", "label_zh": "周日2:00", "expression": "0 2 * * 0"}
    ]))
}

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}
