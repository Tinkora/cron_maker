use croner::Cron;
use croner::parser::{CronParser, Seconds, Year};

use crate::error::CoreError;

/// Maximum accepted cron expression length in UTF-8 bytes.
pub const MAX_EXPRESSION_BYTES: usize = 256;

/// The cron dialect represented by a parsed expression.
#[derive(Clone, Copy, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CronDialect {
    /// POSIX/Vixie-style five-field cron with Sunday represented by 0 or 7.
    Unix,
}

/// A validated field from a cron expression.
#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct CronField {
    /// The normalized field text.
    pub raw: String,
}

/// A validated Unix cron expression.
#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct CronExpression {
    /// The explicitly selected cron dialect.
    pub dialect: CronDialect,
    /// Minute field (0-59).
    pub minutes: CronField,
    /// Hour field (0-23).
    pub hours: CronField,
    /// Day-of-month field (1-31).
    pub day_of_month: CronField,
    /// Month field (1-12 or JAN-DEC).
    pub month: CronField,
    /// Day-of-week field (0-7 or SUN-SAT; 0 and 7 are Sunday).
    pub day_of_week: CronField,
    /// Original shortcut when the expression used a supported alias.
    pub shortcut: Option<String>,
    /// Number of fields in the selected dialect.
    pub field_count: u8,
}

fn expand_shortcut(shortcut: &str) -> Option<&'static str> {
    match shortcut {
        "@yearly" | "@annually" => Some("0 0 1 1 *"),
        "@monthly" => Some("0 0 1 * *"),
        "@weekly" => Some("0 0 * * 0"),
        "@daily" | "@midnight" => Some("0 0 * * *"),
        "@hourly" => Some("0 * * * *"),
        _ => None,
    }
}

fn unix_parser() -> CronParser {
    CronParser::builder()
        .seconds(Seconds::Disallowed)
        .year(Year::Disallowed)
        .build()
}

fn normalize_whitespace(expression: &str) -> String {
    expression.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn reject_non_vixie_extensions(fields: &[&str]) -> Result<(), CoreError> {
    let day_of_month = fields[2].to_ascii_uppercase();
    let day_of_week = fields[4].to_ascii_uppercase();

    if day_of_month.contains('L') || day_of_month.contains('W') || day_of_month.contains('?') {
        return Err(CoreError::UnsupportedSyntax(fields[2].to_string()));
    }
    if day_of_week.contains('#')
        || day_of_week.contains('L')
        || day_of_week.contains('+')
        || day_of_week.contains('?')
    {
        return Err(CoreError::UnsupportedSyntax(fields[4].to_string()));
    }

    Ok(())
}

pub(crate) fn cron_for_expression(expr: &CronExpression) -> Result<Cron, CoreError> {
    unix_parser()
        .parse(&expanded_expression(expr))
        .map_err(|error| CoreError::ParseError(error.to_string()))
}

fn expanded_expression(expr: &CronExpression) -> String {
    format!(
        "{} {} {} {} {}",
        expr.minutes.raw,
        expr.hours.raw,
        expr.day_of_month.raw,
        expr.month.raw,
        expr.day_of_week.raw
    )
}

/// Parse and validate a POSIX/Vixie-style five-field cron expression.
///
/// Supported aliases are expanded for validation but retained when formatting the
/// expression back to text. Expressions outside the selected dialect are rejected.
pub fn parse_cron(expression: &str) -> Result<CronExpression, CoreError> {
    if expression.len() > MAX_EXPRESSION_BYTES {
        return Err(CoreError::ExpressionTooLong {
            length: expression.len(),
            maximum: MAX_EXPRESSION_BYTES,
        });
    }
    let expression = expression.trim();
    if expression.is_empty() {
        return Err(CoreError::EmptyExpression);
    }

    let shortcut = if expression.starts_with('@') {
        let normalized = expression.to_ascii_lowercase();
        if expand_shortcut(&normalized).is_none() {
            return Err(CoreError::UnknownShortcut(expression.to_string()));
        }
        Some(normalized)
    } else {
        None
    };

    let expanded = shortcut
        .as_deref()
        .and_then(expand_shortcut)
        .unwrap_or(expression);
    let normalized = normalize_whitespace(expanded);
    let fields = normalized.split_whitespace().collect::<Vec<_>>();
    if fields.len() != 5 {
        return Err(CoreError::InvalidFieldCount {
            expected: 5,
            actual: fields.len(),
        });
    }

    reject_non_vixie_extensions(&fields)?;
    unix_parser()
        .parse(&normalized)
        .map_err(|error| CoreError::ParseError(error.to_string()))?;

    Ok(CronExpression {
        dialect: CronDialect::Unix,
        minutes: CronField {
            raw: fields[0].to_string(),
        },
        hours: CronField {
            raw: fields[1].to_string(),
        },
        day_of_month: CronField {
            raw: fields[2].to_string(),
        },
        month: CronField {
            raw: fields[3].to_ascii_uppercase(),
        },
        day_of_week: CronField {
            raw: fields[4].to_ascii_uppercase(),
        },
        shortcut,
        field_count: 5,
    })
}

/// Validate a Unix cron expression without returning its structured fields.
pub fn validate_cron(expression: &str) -> Result<(), CoreError> {
    parse_cron(expression).map(|_| ())
}

/// Convert a parsed expression back to its canonical text form.
pub fn expression_to_string(expr: &CronExpression) -> String {
    expr.shortcut
        .clone()
        .unwrap_or_else(|| expanded_expression(expr))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_wildcards_and_specific_values() {
        let wildcard = parse_cron("* * * * *").unwrap();
        assert_eq!(wildcard.minutes.raw, "*");
        assert_eq!(wildcard.field_count, 5);

        let specific = parse_cron("5 10 15 6 3").unwrap();
        assert_eq!(specific.minutes.raw, "5");
        assert_eq!(specific.hours.raw, "10");
        assert_eq!(specific.day_of_month.raw, "15");
        assert_eq!(specific.month.raw, "6");
        assert_eq!(specific.day_of_week.raw, "3");
    }

    #[test]
    fn preserves_supported_aliases_and_expands_their_fields() {
        let expr = parse_cron("@DAILY").unwrap();
        assert_eq!(expr.shortcut.as_deref(), Some("@daily"));
        assert_eq!(expr.minutes.raw, "0");
        assert_eq!(expr.hours.raw, "0");
        assert_eq!(expression_to_string(&expr), "@daily");
    }

    #[test]
    fn rejects_unknown_aliases() {
        let error = parse_cron("@reboot").unwrap_err();
        assert_eq!(error.code(), "UNKNOWN_SHORTCUT");
    }

    #[test]
    fn unix_parser_rejects_six_and_seven_field_expressions() {
        assert!(parse_cron("30 0 9 * * 1-5").is_err());
        assert!(parse_cron("0 30 9 * * 1-5 2026").is_err());
    }

    #[test]
    fn parser_rejects_out_of_range_values_without_a_second_validation_call() {
        assert!(parse_cron("60 * * * *").is_err());
        assert!(parse_cron("* 24 * * *").is_err());
        assert!(parse_cron("* * 0 * *").is_err());
        assert!(parse_cron("* * * 13 *").is_err());
        assert!(parse_cron("* * * * 8").is_err());
    }

    #[test]
    fn parser_accepts_standard_month_and_weekday_names() {
        let expr = parse_cron("0 9 * jan mon-fri").unwrap();
        assert_eq!(expression_to_string(&expr), "0 9 * JAN MON-FRI");
        assert_eq!(expr.month.raw, "JAN");
        assert_eq!(expr.day_of_week.raw, "MON-FRI");
    }

    #[test]
    fn parser_accepts_lists_ranges_and_steps() {
        let expr = parse_cron("1,3,5 1-9/2 * * 1-5").unwrap();
        assert_eq!(expr.minutes.raw, "1,3,5");
        assert_eq!(expr.hours.raw, "1-9/2");
        assert_eq!(expr.day_of_week.raw, "1-5");
    }

    #[test]
    fn parser_rejects_extensions_outside_the_unix_contract() {
        for expression in [
            "0 0 L * *",
            "0 0 15W * *",
            "0 0 * * 5#2",
            "0 0 * * +MON",
            "0 0 ? * MON",
        ] {
            let error = parse_cron(expression).unwrap_err();
            assert_eq!(error.code(), "UNSUPPORTED_SYNTAX");
        }
    }

    #[test]
    fn parser_enforces_an_input_size_limit() {
        let expression = format!("0 0 * * {}", "1,".repeat(MAX_EXPRESSION_BYTES));
        let error = parse_cron(&expression).unwrap_err();
        assert_eq!(error.code(), "EXPRESSION_TOO_LONG");
    }

    #[test]
    fn input_size_limit_counts_whitespace_before_normalization() {
        let expression = format!("{}* * * * *", " ".repeat(MAX_EXPRESSION_BYTES));
        let error = parse_cron(&expression).unwrap_err();

        assert_eq!(error.code(), "EXPRESSION_TOO_LONG");
    }
}
