use croner::describe::{Language, describe as describe_pattern};

use crate::error::CoreError;
use crate::parse::{CronExpression, cron_for_expression};

#[derive(Clone, Copy, Default)]
struct SimplifiedChinese;

impl Language for SimplifiedChinese {
    fn every_minute(&self) -> &'static str {
        "每分钟"
    }

    fn every_second_phrase(&self) -> &'static str {
        "每秒"
    }

    fn every_x_minutes(&self, step: u16) -> String {
        format!("每隔{step}分钟")
    }

    fn every_x_seconds(&self, step: u16) -> String {
        format!("每隔{step}秒")
    }

    fn every_x_hours(&self, step: u16) -> String {
        format!("每隔{step}小时")
    }

    fn every_minute_of_every_x_hours(&self, step: u16) -> String {
        format!("每隔{step}小时的每分钟")
    }

    fn at_time(&self, time: &str) -> String {
        format!("{time}执行")
    }

    fn at_time_and_every_x_seconds(&self, time: &str, step: u16) -> String {
        format!("{time}起每隔{step}秒")
    }

    fn at_time_at_second(&self, time: &str, second: &str) -> String {
        format!("{time}的第{second}秒")
    }

    fn at_phrase(&self, phrase: &str) -> String {
        format!("在{phrase}")
    }

    fn on_phrase(&self, phrase: &str) -> String {
        format!("在{phrase}")
    }

    fn in_phrase(&self, phrase: &str) -> String {
        format!("于{phrase}")
    }

    fn second_phrase(&self, value: &str) -> String {
        format!("第{value}秒")
    }

    fn minute_phrase(&self, value: &str) -> String {
        format!("第{value}分钟")
    }

    fn minute_past_every_hour_phrase(&self, value: &str) -> String {
        format!("每小时的{value}")
    }

    fn hour_phrase(&self, value: &str) -> String {
        format!("第{value}小时")
    }

    fn year_phrase(&self, value: &str) -> String {
        format!("年份{value}")
    }

    fn day_phrase(&self, value: &str) -> String {
        format!("每月第{value}日")
    }

    fn the_last_day_of_the_month(&self) -> &'static str {
        "每月最后一天"
    }

    fn the_weekday_nearest_day(&self, day: &str) -> String {
        format!("最接近每月第{day}日的工作日")
    }

    fn the_last_weekday_of_the_month(&self, day: &str) -> String {
        format!("每月最后一个{day}")
    }

    fn the_nth_weekday_of_the_month(&self, occurrence: u8, day: &str) -> String {
        format!("每月第{occurrence}个{day}")
    }

    fn dom_and_dow_if_also(&self, day_of_week: &str) -> String {
        format!("且当天也是{day_of_week}")
    }

    fn dom_and_dow_if_also_one_of(&self, day_of_week: &str) -> String {
        format!("且当天也是以下日期之一：{day_of_week}")
    }

    fn list_conjunction_and(&self) -> &'static str {
        "和"
    }

    fn list_conjunction_or(&self) -> &'static str {
        "或"
    }

    fn list_conjunction_and_comma(&self) -> &'static str {
        "，以及"
    }

    fn day_of_week_names(&self) -> [&'static str; 7] {
        ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    }

    fn month_names(&self) -> [&'static str; 12] {
        [
            "一月",
            "二月",
            "三月",
            "四月",
            "五月",
            "六月",
            "七月",
            "八月",
            "九月",
            "十月",
            "十一月",
            "十二月",
        ]
    }
}

/// Generate Croner's validated English description.
pub fn describe_en(expr: &CronExpression) -> Result<String, CoreError> {
    Ok(cron_for_expression(expr)?.describe())
}

/// Generate a Simplified Chinese description through Croner's language API.
pub fn describe_zh(expr: &CronExpression) -> Result<String, CoreError> {
    let cron = cron_for_expression(expr)?;
    let description = describe_pattern(&cron.pattern, &SimplifiedChinese)
        .replace(", ", "，")
        .trim_end_matches('.')
        .to_string();
    Ok(format!("{description}。"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse::parse_cron;

    #[test]
    fn describes_every_minute_in_both_languages() {
        let expr = parse_cron("* * * * *").unwrap();
        assert_eq!(describe_en(&expr).unwrap(), "Every minute.");
        assert_eq!(describe_zh(&expr).unwrap(), "每分钟。");
    }

    #[test]
    fn describes_minute_steps_in_both_languages() {
        let expr = parse_cron("*/15 * * * *").unwrap();
        assert!(describe_en(&expr).unwrap().contains("15 minutes"));
        assert!(describe_zh(&expr).unwrap().contains("每隔15分钟"));
    }

    #[test]
    fn descriptions_include_time_and_weekdays() {
        let expr = parse_cron("30 9 * * MON-FRI").unwrap();
        let english = describe_en(&expr).unwrap();
        let chinese = describe_zh(&expr).unwrap();

        assert!(english.contains("09:30"));
        assert!(english.contains("Monday"));
        assert!(english.contains("Friday"));
        assert!(chinese.contains("09:30"));
        assert!(chinese.contains("周一"));
        assert!(chinese.contains("周五"));
    }

    #[test]
    fn chinese_description_keeps_month_day_and_time() {
        let expr = parse_cron("30 14 15 6 *").unwrap();
        let description = describe_zh(&expr).unwrap();

        assert!(description.contains("六月"));
        assert!(description.contains("15"));
        assert!(description.contains("14:30"));
    }
}
