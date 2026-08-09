use thiserror::Error;

/// Stable error type for cron expression operations.
#[derive(Clone, Debug, Error, PartialEq, Eq)]
pub enum CoreError {
    #[error("Cron expression is empty")]
    EmptyExpression,

    #[error("Invalid cron expression: {0}")]
    ParseError(String),

    #[error("Invalid field count: expected {expected} fields, got {actual}")]
    InvalidFieldCount { expected: usize, actual: usize },

    #[error("Unknown @-shortcut: {0}")]
    UnknownShortcut(String),

    #[error("Cron syntax is outside the selected Unix dialect: {0}")]
    UnsupportedSyntax(String),

    #[error("Cron expression is too long: {length} bytes, maximum {maximum}")]
    ExpressionTooLong { length: usize, maximum: usize },

    #[error("Unknown IANA time zone: {0}")]
    InvalidTimeZone(String),

    #[error("Invalid Unix timestamp: {0}")]
    InvalidTimestamp(i64),

    #[error("Requested {requested} occurrences, maximum {maximum}")]
    ResultLimitExceeded { requested: u32, maximum: u32 },
}

impl CoreError {
    /// Returns a stable machine error code for browser and Rust consumers.
    pub const fn code(&self) -> &'static str {
        match self {
            Self::EmptyExpression => "EMPTY_EXPRESSION",
            Self::ParseError(_) => "PARSE_ERROR",
            Self::InvalidFieldCount { .. } => "INVALID_FIELD_COUNT",
            Self::UnknownShortcut(_) => "UNKNOWN_SHORTCUT",
            Self::UnsupportedSyntax(_) => "UNSUPPORTED_SYNTAX",
            Self::ExpressionTooLong { .. } => "EXPRESSION_TOO_LONG",
            Self::InvalidTimeZone(_) => "INVALID_TIME_ZONE",
            Self::InvalidTimestamp(_) => "INVALID_TIMESTAMP",
            Self::ResultLimitExceeded { .. } => "RESULT_LIMIT_EXCEEDED",
        }
    }
}
