use std::ops::{Add, Sub};

use time::{Date, Duration, Month, PrimitiveDateTime, Weekday};
use time::util::weeks_in_year;

#[derive(PartialEq)]
enum ByRuleType {
    BYMINUTE,
    BYHOUR,
    BYDAY,
    BYMONTHDAY,
    BYYEARDAY,
    BYWEEKNO,
    BYMONTH,
    BYSETPOS,
    WKST,
}

impl ByRuleType {
    fn value(&self) -> &str {
        match *self {
            ByRuleType::BYMINUTE => "0",
            ByRuleType::BYHOUR => "1",
            ByRuleType::BYDAY => "2",
            ByRuleType::BYMONTHDAY => "3",
            ByRuleType::BYYEARDAY => "4",
            ByRuleType::BYWEEKNO => "5",
            ByRuleType::BYMONTH => "6",
            ByRuleType::BYSETPOS => "7",
            ByRuleType::WKST => "8"
        }
    }

    fn from_str(value: &str) -> ByRuleType {
        match value {
            "0" => ByRuleType::BYMINUTE,
            "1" => ByRuleType::BYHOUR,
            "2" => ByRuleType::BYDAY,
            "3" => ByRuleType::BYMONTHDAY,
            "4" => ByRuleType::BYYEARDAY,
            "5" => ByRuleType::BYWEEKNO,
            "6" => ByRuleType::BYMONTH,
            "7" => ByRuleType::BYSETPOS,
            "8" => ByRuleType::WKST,
            _ => panic!("Invalid ByRule {value}")
        }
    }
}

#[derive(PartialEq)]
enum RepeatPeriod {
    DAILY,
    WEEKLY,
    MONTHLY,
    ANNUALLY,
}

impl RepeatPeriod {
    fn value(&self) -> &str {
        match *self {
            RepeatPeriod::DAILY => "0",
            RepeatPeriod::WEEKLY => "1",
            RepeatPeriod::MONTHLY => "2",
            RepeatPeriod::ANNUALLY => "3"
        }
    }

    fn from_str(value: &str) -> RepeatPeriod {
        match value {
            "0" => RepeatPeriod::DAILY,
            "1" => RepeatPeriod::WEEKLY,
            "2" => RepeatPeriod::MONTHLY,
            "3" => RepeatPeriod::ANNUALLY,
            _ => panic!("Invalid RepeatPeriod {value}")
        }
    }
}

pub struct ByRule {
    by_rule: ByRuleType,
    interval: String,
}

pub struct RepeatRule {
    frequency: RepeatPeriod,
    by_rules: Vec<ByRule>,
}

trait MonthNumber {
    fn to_number(&self) -> i8;
    fn from_number(number: i8) -> Month;
}

impl MonthNumber for Month {
    fn to_number(&self) -> i8 {
        match *self {
            Month::January => 1,
            Month::February => 2,
            Month::March => 3,
            Month::April => 4,
            Month::May => 5,
            Month::June => 6,
            Month::July => 7,
            Month::August => 8,
            Month::September => 9,
            Month::October => 10,
            Month::November => 11,
            Month::December => 12,
        }
    }

    fn from_number(number: i8) -> Month {
        match number {
            1 => Month::January,
            2 => Month::February,
            3 => Month::March,
            4 => Month::April,
            5 => Month::May,
            6 => Month::June,
            7 => Month::July,
            8 => Month::August,
            9 => Month::September,
            10 => Month::October,
            11 => Month::November,
            12 => Month::December,
            _ => panic!("Invalid Month {number}")
        }
    }
}

pub struct EventRecurrence;

impl<'a> EventRecurrence {
    pub fn new() -> Self {
        EventRecurrence {}
    }
    pub fn generate_future_instances(&self, date: PrimitiveDateTime, repeat_rule: RepeatRule) -> Vec<PrimitiveDateTime> {
        let by_month_rules: Vec<&ByRule> = repeat_rule.by_rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYMONTH }).collect();
        let by_day_rules: Vec<&ByRule> = repeat_rule.by_rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYDAY }).collect();
        let by_month_day_rules: Vec<&ByRule> = repeat_rule.by_rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYMONTHDAY }).collect();
        let by_year_day_rules: Vec<&ByRule> = repeat_rule.by_rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYYEARDAY }).collect();
        let by_week_no_rules: Vec<&ByRule> = repeat_rule.by_rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYWEEKNO }).collect();
        let by_set_pos: Vec<&ByRule> = repeat_rule.by_rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYSETPOS }).collect();

        let week_start: Weekday = match repeat_rule.by_rules.iter().find(|&x| { x.by_rule == ByRuleType::WKST }) {
            Some(rule) => match rule.interval.as_str() {
                "MO" => Weekday::Monday,
                "TU" => Weekday::Tuesday,
                "WE" => Weekday::Wednesday,
                "TH" => Weekday::Thursday,
                "FR" => Weekday::Friday,
                "SA" => Weekday::Saturday,
                "SU" => Weekday::Sunday,
                _ => Weekday::Monday
            },
            None => Weekday::Monday
        };

        let valid_months: Vec<i8> = by_month_rules.iter().clone().map(|&x| { x.interval.parse::<i8>().unwrap() }).collect();
        let valid_year_days: Vec<i8> = by_year_day_rules.iter().clone().map(|&x| { x.interval.parse::<i8>().unwrap() }).collect();

        let month_applied_events: Vec<PrimitiveDateTime> = self.apply_month_rules(&vec![date], &by_month_rules, &repeat_rule.frequency);
        let week_no_applied_events: Vec<PrimitiveDateTime> = self.apply_week_no_rules(month_applied_events, &by_week_no_rules, week_start);
        let year_day_applied_events: Vec<PrimitiveDateTime> = self.apply_year_day_rules(week_no_applied_events, &by_year_day_rules, by_week_no_rules.len() > 0, by_month_rules.len() > 0);
        let month_day_applied_events: Vec<PrimitiveDateTime> = self.apply_month_day_rules(year_day_applied_events, &by_month_day_rules, &repeat_rule.frequency == &RepeatPeriod::DAILY);
        let day_applied_events: Vec<PrimitiveDateTime> = self.apply_day_rules(month_day_applied_events, &by_day_rules, &repeat_rule.frequency, valid_months.clone(), week_start, by_week_no_rules.len() > 0, valid_year_days);

        self.finish_rules(day_applied_events, &by_set_pos, valid_months.clone(), date.assume_utc().unix_timestamp())
    }

    fn apply_month_rules(&self, dates: &Vec<PrimitiveDateTime>, rules: &Vec<&'a ByRule>, frequency: &RepeatPeriod) -> Vec<PrimitiveDateTime> {
        if rules.len() == 0 {
            return dates.clone();
        }

        let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

        for &rule in rules {
            for date in dates {
                let target_month: i8 = match rule.interval.parse::<i8>() {
                    Ok(month) => month,
                    _ => continue
                };

                if frequency == &RepeatPeriod::WEEKLY {
                    let week_start = PrimitiveDateTime::new(Date::from_iso_week_date(date.year(), date.iso_week(), Weekday::Monday).unwrap(), date.time());
                    let week_end = PrimitiveDateTime::new(Date::from_iso_week_date(date.year(), date.iso_week(), Weekday::Sunday).unwrap(), date.time());

                    let week_start_year = week_start.year();
                    let week_end_year = week_end.year();

                    let week_start_month = week_start.month().to_number();
                    let week_end_month = week_end.month().to_number();

                    let is_target_month = week_end_month == target_month || week_start_month == target_month;

                    if week_start_year == week_end_year && week_start_month < week_end_month && is_target_month {
                        new_dates.push(date.clone());
                        continue;
                    } else if week_start_year < week_end_year && is_target_month {
                        new_dates.push(date.clone());
                        continue;
                    }
                } else if frequency == &RepeatPeriod::ANNUALLY {
                    let new_date = match date.clone().replace_month(Month::from_number(target_month)) {
                        Ok(dt) => dt,
                        _ => continue
                    };

                    let years_to_add = if date.year() == new_date.year() && date.month().to_number() > target_month { 1 } else { 0 };

                    new_dates.push(match new_date.replace_year(new_date.year() + years_to_add) {
                        Ok(date) => date,
                        _ => continue
                    });

                    continue;
                }

                if date.month().to_number() == target_month {
                    new_dates.push(date.clone());
                }
            }
        }

        new_dates
    }

    fn apply_week_no_rules(&self, dates: Vec<PrimitiveDateTime>, rules: &Vec<&'a ByRule>, week_start: Weekday) -> Vec<PrimitiveDateTime> {
        if rules.len() == 0 {
            return dates.clone();
        }

        let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

        for &rule in rules {
            for date in &dates {
                let parsed_week: i8 = match rule.interval.parse::<i8>() {
                    Ok(week) => week,
                    _ => continue
                };

                let mut new_date = date.clone();
                let mut week_number: u8;

                if parsed_week < 0 {
                    week_number = weeks_in_year(date.year()) - parsed_week.unsigned_abs() + 1
                } else {
                    new_date = new_date.replace_date(Date::from_iso_week_date(new_date.year(), parsed_week as u8, new_date.weekday()).unwrap());
                    week_number = parsed_week as u8
                }

                let year_offset = if new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp() { 1 } else { 0 };
                new_date = new_date.replace_date(Date::from_iso_week_date(new_date.year() + year_offset, week_number, week_start).unwrap());

                for i in 0..7 {
                    let final_date = new_date.add(Duration::days(i));
                    if final_date.year() > new_date.year() {
                        break;
                    }

                    new_dates.push(final_date)
                }
            }
        }

        new_dates
    }

    fn apply_year_day_rules(&self, dates: Vec<PrimitiveDateTime>, rules: &Vec<&ByRule>, evaluate_same_week: bool, evaluate_same_month: bool) -> Vec<PrimitiveDateTime> {
        if rules.len() == 0 {
            return dates.clone();
        }

        let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

        for &rule in rules {
            for date in &dates {
                let parsed_day: i64 = match rule.interval.parse::<i64>() {
                    Ok(day) => day,
                    _ => continue
                };

                let mut new_date: PrimitiveDateTime;
                if parsed_day.is_negative() {
                    new_date = date.replace_month(Month::December).unwrap()
                        .replace_day(31).unwrap()
                        .sub(Duration::days((parsed_day.unsigned_abs() - 1) as i64));
                } else {
                    new_date = date.replace_month(Month::January).unwrap()
                        .replace_day(1).unwrap()
                        .add(Duration::days(parsed_day - 1));
                }

                let year_offset = if new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp() { 1 } else { 0 };
                new_date = match new_date.replace_year(new_date.year() + year_offset) {
                    Ok(date) => date,
                    _ => continue
                };

                if (evaluate_same_week && date.iso_week() != new_date.iso_week()) || (evaluate_same_month && date.month() != new_date.month()) {
                    continue;
                }

                new_dates.push(new_date)
            }
        }

        new_dates
    }

    fn apply_month_day_rules(&self, dates: Vec<PrimitiveDateTime>, rules: &Vec<&ByRule>, is_daily_event: bool) -> Vec<PrimitiveDateTime> {
        if rules.len() == 0 {
            return dates.clone();
        }

        let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

        for &rule in rules {
            for date in &dates {
                let target_day: i8 = match rule.interval.parse::<i8>() {
                    Ok(day) => day,
                    _ => continue
                };
                let days_diff = date.month().length(date.year()) as i8 - target_day.unsigned_abs() as i8 + 1;

                if is_daily_event {
                    if target_day.is_positive() && date.day() == target_day.unsigned_abs() {
                        new_dates.push(date.clone());
                    } else if target_day.is_negative() && days_diff == date.day() as i8 {
                        new_dates.push(date.clone());
                    }

                    continue;
                }

                if target_day >= 0 && target_day.unsigned_abs() <= date.month().length(date.year()) {
                    let date = match date.replace_day(target_day.unsigned_abs()) {
                        Ok(date) => date,
                        _ => continue
                    };

                    new_dates.push(date);
                } else if days_diff > 0 && target_day.unsigned_abs() <= date.month().length(date.year()) {
                    let date = match date.replace_day(days_diff.unsigned_abs()) {
                        Ok(date) => date,
                        _ => continue
                    };

                    new_dates.push(date);
                }
            }
        }

        new_dates
    }

    fn apply_day_rules(&self, dates: Vec<PrimitiveDateTime>, rules: &Vec<&ByRule>, frequency: &RepeatPeriod, valid_months: Vec<i8>, week_start: Weekday, has_week_no: bool, valid_year_days: Vec<i8>) -> Vec<PrimitiveDateTime> {
        Vec::new()
    }

    fn finish_rules(&self, dates: Vec<PrimitiveDateTime>, set_pos_rules: &Vec<&ByRule>, valid_months: Vec<i8>, event_start_time: i64) -> Vec<PrimitiveDateTime> {
        Vec::new()
    }
}

#[cfg(test)]
mod tests {
    use time::{Date, Month, PrimitiveDateTime, Time};

    use super::*;

    #[test]
    fn test_parse_weekly_by_month() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::January, 23).unwrap(), time);
        let invalid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::March, 11).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_rules(&vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::WEEKLY), vec![valid_date]);

        assert_eq!(event_recurrence.apply_month_rules(&vec![invalid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::WEEKLY), vec![]);
    }

    #[test]
    fn test_parse_monthly_by_month() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::January, 23).unwrap(), time);
        let invalid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::March, 11).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_rules(&vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::MONTHLY), vec![valid_date]);

        assert_eq!(event_recurrence.apply_month_rules(&vec![invalid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::MONTHLY), vec![]);
    }

    #[test]
    fn test_parse_yearly_by_month() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::January, 23).unwrap(), time);
        let to_next_year = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::March, 11).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_rules(&vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY), vec![valid_date, valid_date.replace_month(Month::February).unwrap()]);

        // BYMONTH never limits on Yearly, just expands
        assert_eq!(
            event_recurrence.apply_month_rules(
                &vec![to_next_year],
                &vec![
                    &ByRule {
                        by_rule: ByRuleType::BYMONTH,
                        interval: "1".to_string(),
                    },
                    &ByRule {
                        by_rule: ByRuleType::BYMONTH,
                        interval: "2".to_string(),
                    },
                ],
                &RepeatPeriod::ANNUALLY,
            ),
            vec![
                to_next_year.replace_year(2025).unwrap().replace_month(Month::January).unwrap(),
                to_next_year.replace_year(2025).unwrap().replace_month(Month::February).unwrap(),
            ]
        );
    }

    #[test]
    fn test_parse_daily_by_month() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::January, 23).unwrap(), time);
        let second_valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::February, 12).unwrap(), time);
        let invalid_date = PrimitiveDateTime::new(Date::from_calendar_date(2024, Month::March, 11).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_rules(&vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::DAILY), vec![valid_date]);

        assert_eq!(event_recurrence.apply_month_rules(&vec![invalid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "1".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTH,
                interval: "2".to_string(),
            },
        ], &RepeatPeriod::DAILY), vec![]);
    }

    #[test]
    fn test_parse_positive_week_no() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 31).unwrap(), time);

        let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
        let base_date = Date::from_calendar_date(2025, Month::January, 27).unwrap();
        for i in 0..7 {
            valid_dates.push(PrimitiveDateTime::new(base_date.add(Duration::days(i)), time));
        }

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_week_no_rules(vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "5".to_string(),
            },
        ], Weekday::Monday), valid_dates);
    }

    #[test]
    fn test_parse_wkst_week_no() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 31).unwrap(), time);

        let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
        let base_date = Date::from_calendar_date(2025, Month::January, 28).unwrap();
        for i in 0..7 {
            valid_dates.push(PrimitiveDateTime::new(base_date.add(Duration::days(i)), time));
        }

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_week_no_rules(vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "5".to_string(),
            },
        ], Weekday::Tuesday), valid_dates);
    }

    #[test]
    fn test_parse_negative_week_no() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::December, 4).unwrap(), time);

        let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
        let base_date = Date::from_calendar_date(2025, Month::November, 24).unwrap();
        for i in 0..7 {
            valid_dates.push(PrimitiveDateTime::new(base_date.add(Duration::days(i)), time));
        }

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_week_no_rules(vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "-5".to_string(),
            },
        ], Weekday::Monday), valid_dates);
    }

    #[test]
    fn test_parse_edge_week_no() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let valid_date = PrimitiveDateTime::new(Date::from_calendar_date(2026, Month::December, 29).unwrap(), time);

        let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
        let base_date = Date::from_calendar_date(2026, Month::December, 28).unwrap();
        for i in 0..4 {
            valid_dates.push(PrimitiveDateTime::new(base_date.add(Duration::days(i)), time));
        }

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_week_no_rules(vec![valid_date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "-1".to_string(),
            },
        ], Weekday::Monday), valid_dates);
    }

    #[test]
    fn test_parse_out_of_week_no() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 22).unwrap(), time);

        let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
        let base_date = Date::from_calendar_date(2026, Month::January, 26).unwrap();
        for i in 0..7 {
            valid_dates.push(PrimitiveDateTime::new(base_date.add(Duration::days(i)), time));
        }

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_week_no_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "5".to_string(),
            },
        ], Weekday::Monday), valid_dates);
    }

    #[test]
    fn test_parse_year_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 1).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_year_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYYEARDAY,
                interval: "40".to_string(),
            }
        ], false, false), [
                       date.replace_day(9).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_year_day_keep_week() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 1).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_year_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYYEARDAY,
                interval: "40".to_string(),
            }
        ], true, false), []);
    }

    #[test]
    fn test_parse_year_day_keep_month() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 22).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_year_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYYEARDAY,
                interval: "40".to_string(),
            }
        ], true, true), []);
    }

    #[test]
    fn test_parse_out_of_year_year_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 22).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_year_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYYEARDAY,
                interval: "40".to_string(),
            }
        ], false, false), [
                       date.replace_year(2026).unwrap().replace_day(9).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_negative_year_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 22).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_year_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYYEARDAY,
                interval: "-1".to_string(),
            }
        ], false, false), [
                       date.replace_month(Month::December).unwrap().replace_day(31).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_by_month_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 22).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "10".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "20".to_string(),
            },
        ], false), [
                       date.replace_day(10).unwrap(),
                       date.replace_day(20).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_invalid_by_month_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 22).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "30".to_string(),
            },
        ], false), []);
    }

    #[test]
    fn test_parse_daily_by_month_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::February, 20).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "20".to_string(),
            }
        ], false), [
                       date.replace_day(20).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_negative_by_month_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "-1".to_string(),
            },
        ], false), [
                       date.replace_day(31).unwrap(),
                   ]);
    }

    #[test]
    fn test_parse_invalid_date_by_month_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_month_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "32".to_string(),
            },
        ], false), []);
    }
}