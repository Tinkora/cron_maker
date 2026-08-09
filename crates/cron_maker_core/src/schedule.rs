use chrono::{Datelike, Duration, NaiveDate, TimeZone, Timelike, Utc};
use jiff::{
    Timestamp,
    civil::DateTime,
    tz::{AmbiguousOffset, TimeZone as JiffTimeZone},
};

use crate::error::CoreError;
use crate::parse::{CronExpression, cron_for_expression};

/// Maximum number of occurrences returned by one core call.
pub const MAX_EXECUTION_COUNT: u32 = 50;

const DST_TRANSITION_WINDOW: Duration = Duration::days(2);

/// Return the bundled IANA Time Zone Database release.
pub fn time_zone_database_version() -> &'static str {
    jiff_tzdb::VERSION.unwrap_or("unknown")
}

/// Compute future occurrences in UTC.
pub fn next_executions(
    expr: &CronExpression,
    from_unix: i64,
    count: u32,
) -> Result<Vec<i64>, CoreError> {
    next_executions_in_timezone(expr, from_unix, count, "UTC")
}

/// Compute future occurrences using an IANA time zone.
///
/// The cron pattern is evaluated as wall-clock time in the selected zone, so
/// nonexistent local times are skipped and repeated local times are returned
/// twice. Returned timestamps are Unix seconds in chronological order.
pub fn next_executions_in_timezone(
    expr: &CronExpression,
    from_unix: i64,
    count: u32,
    time_zone: &str,
) -> Result<Vec<i64>, CoreError> {
    if count == 0 {
        return Ok(Vec::new());
    }
    if count > MAX_EXECUTION_COUNT {
        return Err(CoreError::ResultLimitExceeded {
            requested: count,
            maximum: MAX_EXECUTION_COUNT,
        });
    }

    let zone = JiffTimeZone::get(time_zone)
        .map_err(|_| CoreError::InvalidTimeZone(time_zone.to_string()))?;
    let start =
        Timestamp::from_second(from_unix).map_err(|_| CoreError::InvalidTimestamp(from_unix))?;
    let local_start = chrono_datetime(zone.to_datetime(start), from_unix)?;
    let wall_clock_start = local_start
        .checked_sub_signed(DST_TRANSITION_WINDOW)
        .ok_or(CoreError::InvalidTimestamp(from_unix))?;
    if wall_clock_start.year() < croner::YEAR_LOWER_LIMIT
        || local_start.year() >= croner::YEAR_UPPER_LIMIT
    {
        return Err(CoreError::InvalidTimestamp(from_unix));
    }
    let cron = cron_for_expression(expr)?;
    let mut results = Vec::with_capacity(count as usize);
    let mut settle_until = None;

    for wall_clock in cron.iter_after(Utc.from_utc_datetime(&wall_clock_start)) {
        let local_candidate = wall_clock.naive_utc();
        if settle_until.is_some_and(|deadline| local_candidate > deadline) {
            break;
        }

        let civil_candidate = jiff_datetime(local_candidate, from_unix)?;
        let ambiguous = zone.to_ambiguous_timestamp(civil_candidate);
        match ambiguous.offset() {
            AmbiguousOffset::Gap { .. } => {}
            AmbiguousOffset::Unambiguous { .. } => {
                let timestamp = ambiguous
                    .unambiguous()
                    .map_err(|_| CoreError::InvalidTimestamp(from_unix))?
                    .as_second();
                if timestamp > from_unix {
                    results.push(timestamp);
                }
            }
            AmbiguousOffset::Fold { .. } => {
                let earlier = ambiguous
                    .earlier()
                    .map_err(|_| CoreError::InvalidTimestamp(from_unix))?
                    .as_second();
                let later = ambiguous
                    .later()
                    .map_err(|_| CoreError::InvalidTimestamp(from_unix))?
                    .as_second();
                for timestamp in [earlier, later] {
                    if timestamp > from_unix {
                        results.push(timestamp);
                    }
                }
            }
        }

        if results.len() >= count as usize && settle_until.is_none() {
            settle_until = local_candidate.checked_add_signed(DST_TRANSITION_WINDOW);
        }
    }

    results.sort_unstable();
    results.dedup();
    results.truncate(count as usize);
    Ok(results)
}

fn chrono_datetime(
    datetime: DateTime,
    source_timestamp: i64,
) -> Result<chrono::NaiveDateTime, CoreError> {
    NaiveDate::from_ymd_opt(
        i32::from(datetime.year()),
        u32::from(datetime.month() as u8),
        u32::from(datetime.day() as u8),
    )
    .and_then(|date| {
        date.and_hms_nano_opt(
            u32::from(datetime.hour() as u8),
            u32::from(datetime.minute() as u8),
            u32::from(datetime.second() as u8),
            datetime.subsec_nanosecond() as u32,
        )
    })
    .ok_or(CoreError::InvalidTimestamp(source_timestamp))
}

fn jiff_datetime(
    datetime: chrono::NaiveDateTime,
    source_timestamp: i64,
) -> Result<DateTime, CoreError> {
    let year = i16::try_from(datetime.year())
        .map_err(|_| CoreError::InvalidTimestamp(source_timestamp))?;
    DateTime::new(
        year,
        datetime.month() as i8,
        datetime.day() as i8,
        datetime.hour() as i8,
        datetime.minute() as i8,
        datetime.second() as i8,
        datetime.nanosecond() as i32,
    )
    .map_err(|_| CoreError::InvalidTimestamp(source_timestamp))
}

/// Format a Unix timestamp as an ISO 8601 string in UTC.
pub fn format_timestamp(unix: i64) -> String {
    Utc.timestamp_opt(unix, 0)
        .single()
        .map(|date_time| date_time.format("%Y-%m-%dT%H:%M:%SZ").to_string())
        .unwrap_or_else(|| unix.to_string())
}

/// Format a Unix timestamp with the bundled offset for an IANA time zone.
pub fn format_timestamp_in_timezone(unix: i64, time_zone: &str) -> Result<String, CoreError> {
    let zone = JiffTimeZone::get(time_zone)
        .map_err(|_| CoreError::InvalidTimeZone(time_zone.to_string()))?;
    let timestamp = Timestamp::from_second(unix).map_err(|_| CoreError::InvalidTimestamp(unix))?;

    Ok(timestamp
        .to_zoned(zone)
        .strftime("%Y-%m-%dT%H:%M:%S%:z")
        .to_string())
}

/// Compute a compact English relative-time description.
pub fn relative_time(target_unix: i64, now_unix: i64) -> String {
    if target_unix <= now_unix {
        return "now".to_string();
    }
    let diff_secs = target_unix.abs_diff(now_unix);

    if diff_secs < 60 {
        return format!("in {diff_secs} seconds");
    }

    let minutes = diff_secs / 60;
    if minutes < 60 {
        return if minutes == 1 {
            "in 1 minute".to_string()
        } else {
            format!("in {minutes} minutes")
        };
    }

    let hours = minutes / 60;
    if hours < 24 {
        return if hours == 1 {
            "in 1 hour".to_string()
        } else {
            format!("in {hours} hours")
        };
    }

    let days = hours / 24;
    if days < 30 {
        return if days == 1 {
            "in 1 day".to_string()
        } else {
            format!("in {days} days")
        };
    }

    let months = days / 30;
    if months < 12 {
        return if months == 1 {
            "in 1 month".to_string()
        } else {
            format!("in {months} months")
        };
    }

    let years = months / 12;
    if years == 1 {
        "in 1 year".to_string()
    } else {
        format!("in {years} years")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse::parse_cron;

    #[test]
    fn returns_strictly_future_quarter_hour_occurrences() {
        let expr = parse_cron("*/15 * * * *").unwrap();
        let from = 1_767_225_600;
        let results = next_executions(&expr, from, 5).unwrap();

        assert_eq!(
            results,
            vec![
                from + 900,
                from + 1_800,
                from + 2_700,
                from + 3_600,
                from + 4_500,
            ]
        );
    }

    #[test]
    fn fixed_time_in_a_dst_gap_is_skipped() {
        let expr = parse_cron("30 2 * * *").unwrap();
        let results =
            next_executions_in_timezone(&expr, 1_772_884_800, 2, "America/New_York").unwrap();

        assert_eq!(results, vec![1_773_037_800, 1_773_124_200]);
    }

    #[test]
    fn uses_iana_2026c_for_moroccos_permanent_utc_change() {
        let expr = parse_cron("30 2 * * *").unwrap();
        let results =
            next_executions_in_timezone(&expr, 1_789_873_200, 1, "Africa/Casablanca").unwrap();

        assert_eq!(results, vec![1_789_957_800]);
        assert_eq!(
            format_timestamp_in_timezone(results[0], "Africa/Casablanca").unwrap(),
            "2026-09-21T02:30:00+00:00"
        );
    }

    #[test]
    fn publishes_the_bundled_iana_release() {
        assert_eq!(time_zone_database_version(), "2026c");
    }

    #[test]
    fn rejects_timestamps_outside_the_bundled_database_range() {
        let expr = parse_cron("* * * * *").unwrap();
        let outside_range = Timestamp::MAX.as_second() + 1;
        let error = next_executions(&expr, outside_range, 1).unwrap_err();

        assert_eq!(error.code(), "INVALID_TIMESTAMP");
    }

    #[test]
    fn rejects_starting_outside_the_cron_search_horizon() {
        let expr = parse_cron("* * * * *").unwrap();
        let unsupported_starts = [
            Utc.with_ymd_and_hms(1, 1, 1, 0, 0, 0)
                .single()
                .unwrap()
                .timestamp(),
            Utc.with_ymd_and_hms(5_000, 1, 1, 0, 0, 30)
                .single()
                .unwrap()
                .timestamp(),
        ];

        for from in unsupported_starts {
            let error = next_executions(&expr, from, 1).unwrap_err();
            assert_eq!(error.code(), "INVALID_TIMESTAMP");
        }
    }

    #[test]
    fn timezone_timestamp_formatting_rejects_invalid_inputs() {
        let invalid_zone = format_timestamp_in_timezone(1_767_225_600, "Mars/Olympus")
            .expect_err("an unknown IANA identifier must be rejected");
        assert_eq!(invalid_zone.code(), "INVALID_TIME_ZONE");

        let outside_range = Timestamp::MAX.as_second() + 1;
        let invalid_timestamp = format_timestamp_in_timezone(outside_range, "UTC")
            .expect_err("an unrepresentable timestamp must be rejected");
        assert_eq!(invalid_timestamp.code(), "INVALID_TIMESTAMP");
    }

    #[test]
    fn restricted_day_of_month_and_weekday_use_vixie_or_semantics() {
        let expr = parse_cron("0 0 1 * MON").unwrap();
        let results = next_executions(&expr, 1_769_817_600, 2).unwrap();
        let formatted = results
            .into_iter()
            .map(format_timestamp)
            .collect::<Vec<_>>();

        assert_eq!(formatted, ["2026-02-01T00:00:00Z", "2026-02-02T00:00:00Z"]);
    }

    #[test]
    fn fixed_time_occurs_twice_during_a_dst_overlap() {
        let expr = parse_cron("30 1 * * *").unwrap();
        let results =
            next_executions_in_timezone(&expr, 1_793_439_000, 2, "America/New_York").unwrap();

        assert_eq!(results, vec![1_793_511_000, 1_793_514_600]);
    }

    #[test]
    fn overlap_returns_the_second_ambiguous_time_when_the_first_is_past() {
        let expr = parse_cron("30 1 * * *").unwrap();
        let results =
            next_executions_in_timezone(&expr, 1_793_512_800, 2, "America/New_York").unwrap();

        assert_eq!(results, vec![1_793_514_600, 1_793_601_000]);
    }

    #[test]
    fn interval_occurrences_remain_chronological_during_an_overlap() {
        let expr = parse_cron("*/30 * * * *").unwrap();
        let results =
            next_executions_in_timezone(&expr, 1_793_509_140, 4, "America/New_York").unwrap();

        assert_eq!(
            results,
            vec![1_793_509_200, 1_793_511_000, 1_793_512_800, 1_793_514_600]
        );
    }

    #[test]
    fn timezone_schedule_rejects_unknown_iana_identifier() {
        let expr = parse_cron("0 9 * * *").unwrap();
        let error =
            next_executions_in_timezone(&expr, 1_767_225_600, 1, "Mars/Olympus").unwrap_err();

        assert_eq!(error.code(), "INVALID_TIME_ZONE");
    }

    #[test]
    fn count_zero_is_empty_and_large_requests_are_rejected() {
        let expr = parse_cron("* * * * *").unwrap();
        assert!(next_executions(&expr, 1_767_225_600, 0).unwrap().is_empty());

        let error = next_executions(&expr, 1_767_225_600, MAX_EXECUTION_COUNT + 1).unwrap_err();
        assert_eq!(error.code(), "RESULT_LIMIT_EXCEEDED");
    }

    #[test]
    fn formats_valid_timestamps_and_relative_durations() {
        let now = 1_767_225_600;
        assert_eq!(format_timestamp(now), "2026-01-01T00:00:00Z");
        assert_eq!(relative_time(now + 30, now), "in 30 seconds");
        assert_eq!(relative_time(now + 60, now), "in 1 minute");
        assert_eq!(relative_time(now + 3_600, now), "in 1 hour");
        assert_eq!(relative_time(now + 86_400, now), "in 1 day");
    }

    #[test]
    fn relative_time_handles_the_full_i64_range() {
        assert_eq!(relative_time(i64::MAX, i64::MIN), "in 593066617596 years");
        assert_eq!(relative_time(i64::MIN, i64::MAX), "now");
    }
}
