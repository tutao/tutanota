use std::ops::{Add, Sub};

use regex::Regex;
use time::{Date, Duration, Month, PrimitiveDateTime, Time, Weekday};
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
    fn to_number(&self) -> u8;
    fn from_number(number: u8) -> Month;
}

trait WeekdayString {
    fn from_short(short_weekday: &str) -> Weekday;
}

impl MonthNumber for Month {
    fn to_number(&self) -> u8 {
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

    fn from_number(number: u8) -> Month {
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

impl WeekdayString for Weekday {
    fn from_short(short_weekday: &str) -> Weekday {
        match short_weekday {
            "MO" => Weekday::Monday,
            "TU" => Weekday::Tuesday,
            "WE" => Weekday::Wednesday,
            "TH" => Weekday::Thursday,
            "FR" => Weekday::Friday,
            "SA" => Weekday::Saturday,
            "SU" => Weekday::Sunday,
            _ => panic!("Invalid Weekday {short_weekday}")
        }
    }
}

trait DateExpansion {
    fn add_month(&self) -> Date;
}

impl DateExpansion for Date {
    fn add_month(&self) -> Date {
        self.add(Duration::days(i64::from(self.month().length(self.year()))))
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

        let valid_months: Vec<u8> = by_month_rules.iter().clone().map(|&x| { x.interval.parse::<u8>().unwrap() }).collect();
        let valid_month_days: Vec<i8> = by_month_day_rules.iter().clone().map(|&x| { x.interval.parse::<i8>().unwrap() }).collect();
        let valid_year_days: Vec<i16> = by_year_day_rules.iter().clone().map(|&x| { x.interval.parse::<i16>().unwrap() }).collect();

        let month_applied_events: Vec<PrimitiveDateTime> = self.apply_month_rules(&vec![date], &by_month_rules, &repeat_rule.frequency);
        let week_no_applied_events: Vec<PrimitiveDateTime> = self.apply_week_no_rules(month_applied_events, &by_week_no_rules, week_start);
        let year_day_applied_events: Vec<PrimitiveDateTime> = self.apply_year_day_rules(week_no_applied_events, &by_year_day_rules, by_week_no_rules.len() > 0, by_month_rules.len() > 0);
        let month_day_applied_events: Vec<PrimitiveDateTime> = self.apply_month_day_rules(year_day_applied_events, &by_month_day_rules, &repeat_rule.frequency == &RepeatPeriod::DAILY);
        let day_applied_events: Vec<PrimitiveDateTime> = self.apply_day_rules(month_day_applied_events, &by_day_rules, &repeat_rule.frequency, valid_months.clone(), week_start, by_week_no_rules.len() > 0, valid_month_days, valid_year_days);

        self.finish_rules(day_applied_events, &by_set_pos, valid_months.clone(), date.assume_utc().unix_timestamp())
    }

    fn apply_month_rules(&self, dates: &Vec<PrimitiveDateTime>, rules: &Vec<&'a ByRule>, frequency: &RepeatPeriod) -> Vec<PrimitiveDateTime> {
        if rules.len() == 0 {
            return dates.clone();
        }

        let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

        for &rule in rules {
            for date in dates {
                let target_month: u8 = match rule.interval.parse::<u8>() {
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

    fn apply_day_rules(&self, dates: Vec<PrimitiveDateTime>, rules: &Vec<&ByRule>, frequency: &RepeatPeriod, valid_months: Vec<u8>, week_start: Weekday, has_week_no: bool, valid_month_days: Vec<i8>, valid_year_days: Vec<i16>) -> Vec<PrimitiveDateTime> {
        if rules.len() == 0 {
            return dates.clone();
        }

        let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();
        let regex = Regex::new(r"^([-+]?\d{0,3})([a-zA-Z]{2})?$").unwrap();

        for &rule in rules {
            for date in &dates {
                let Some(parsed_rule) = regex.captures(rule.interval.as_str()) else { continue };
                let target_week_day = parsed_rule.get(2);
                let leading_value = parsed_rule.get(1);
                date.add(Duration::days(i64::from(Month::December.length(2025))));
                if frequency == &RepeatPeriod::DAILY && target_week_day.is_some() && date.weekday() == Weekday::from_short(target_week_day.unwrap().as_str()) {
                    new_dates.push(date.clone())
                } else if frequency == &RepeatPeriod::WEEKLY && target_week_day.is_some() {
                    let mut new_date = date.replace_date(Date::from_iso_week_date(date.year(), date.iso_week(), Weekday::from_short(target_week_day.unwrap().as_str())).unwrap());
                    let interval_start = date.replace_date(Date::from_iso_week_date(date.year(), date.iso_week(), week_start).unwrap());

                    if new_date.assume_utc().unix_timestamp() > interval_start.add(Duration::weeks(1)).assume_utc().unix_timestamp() {
                        continue;
                    } else if new_date.assume_utc().unix_timestamp() < interval_start.assume_utc().unix_timestamp() {
                        new_date = new_date.add(Duration::weeks(1));
                    }

                    if valid_months.len() == 0 || valid_months.contains(&new_date.month().to_number()) {
                        new_dates.push(new_date)
                    }
                } else if frequency == &RepeatPeriod::MONTHLY && target_week_day.is_some() {
                    let mut allowed_days: Vec<u8> = Vec::new();

                    let week_change = match leading_value.map_or(Ok(0), |m| m.as_str().parse::<i8>()) {
                        Ok(val) => { val }
                        _ => { 0 }
                    };

                    let base_date = date.replace_day(1).unwrap();
                    let stop_condition = PrimitiveDateTime::new(base_date.date().add_month(), base_date.time());

                    for allowed_day in &valid_month_days {
                        if allowed_day.is_positive() {
                            allowed_days.push(allowed_day.unsigned_abs());
                            continue;
                        }

                        let day = base_date.month().length(date.year()) - allowed_day.unsigned_abs() + 1;
                        allowed_days.push(day);
                    }

                    let is_allowed_in_month_day = |day: u8| -> bool {
                        if allowed_days.len() == 0 {
                            return true;
                        }

                        allowed_days.contains(&day)
                    };

                    let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

                    if week_change != 0 {
                        let mut new_date = base_date;
                        if week_change.is_negative() {
                            new_date = new_date.replace_day(new_date.month().length(new_date.year())).unwrap();
                            new_date = new_date.replace_date(Date::from_iso_week_date(new_date.year(), new_date.iso_week(), parsed_weekday).unwrap());

                            let new_week = new_date.iso_week() - week_change.unsigned_abs() - 1;
                            new_date = new_date.replace_date(Date::from_iso_week_date(new_date.year(), new_week, new_date.weekday()).unwrap())
                        } else {
                            while new_date.weekday() != parsed_weekday {
                                new_date = new_date.add(Duration::days(1));
                            }

                            new_date = new_date.replace_date(Date::from_iso_week_date(new_date.year(), new_date.iso_week() + week_change.unsigned_abs() - 1, new_date.weekday()).unwrap())
                        }

                        if new_date.assume_utc().unix_timestamp() >= base_date.assume_utc().unix_timestamp()
                            && new_date.assume_utc().unix_timestamp() <= stop_condition.assume_utc().unix_timestamp()
                            && is_allowed_in_month_day(new_date.day()) {
                            new_dates.push(new_date)
                        }
                    } else {
                        let mut current_date = base_date;
                        while current_date.assume_utc().unix_timestamp() < stop_condition.assume_utc().unix_timestamp() {
                            let new_date = current_date.replace_date(Date::from_iso_week_date(current_date.year(), current_date.iso_week(), parsed_weekday).unwrap());
                            if new_date.assume_utc().unix_timestamp() >= base_date.assume_utc().unix_timestamp() && is_allowed_in_month_day(new_date.day()) {
                                if valid_months.len() > 0 && valid_months.contains(&new_date.month().to_number()) {
                                    new_dates.push(new_date)
                                } else if valid_months.len() == 0 {
                                    new_dates.push(new_date)
                                }
                            }

                            current_date = new_date.add(Duration::days(7));
                        }
                    }
                } else if frequency == &RepeatPeriod::ANNUALLY {
                    let week_change = match leading_value.map_or(Ok(0), |m| m.as_str().parse::<i64>()) {
                        Ok(val) => { val }
                        _ => { 0 }
                    };

                    if has_week_no && week_change != 0 {
                        println!("Invalid repeat rule, can't use BYWEEKNO with Week Offset on BYDAY");
                        continue;
                    }

                    if week_change != 0 && !has_week_no {
                        let mut new_date: PrimitiveDateTime;

                        if !target_week_day.is_some() {
                            if week_change > 0 {
                                new_date = date.replace_day(1).unwrap().replace_month(Month::January).unwrap().add(Duration::days(week_change - 1))
                            } else {
                                new_date = date.replace_month(Month::December).unwrap().replace_day(31).unwrap().sub(Duration::days(week_change.abs() - 1))
                            }
                        } else {
                            let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

                            if week_change > 0 {
                                new_date = date.replace_day(1).unwrap().replace_month(Month::January).unwrap().add(Duration::weeks(week_change - 1));

                                while new_date.weekday() != parsed_weekday {
                                    new_date = new_date.add(Duration::days(1));
                                }
                            } else {
                                new_date = date.replace_month(Month::December).unwrap().replace_day(31).unwrap().sub(Duration::weeks(week_change.abs() - 1));
                                while new_date.weekday() != parsed_weekday {
                                    new_date = new_date.sub(Duration::days(1));
                                }
                            }
                        }

                        if new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp() {
                            match new_date.replace_year(new_date.year() + 1) {
                                Ok(dt) => new_dates.push(dt),
                                _ => continue
                            }
                        } else {
                            new_dates.push(new_date)
                        }
                    } else if has_week_no {
                        if !target_week_day.is_some() {
                            continue;
                        }

                        let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());
                        let new_date = date.replace_date(Date::from_iso_week_date(date.year(), date.iso_week(), parsed_weekday).unwrap());
                        let interval_start = date.replace_date(Date::from_iso_week_date(date.year(), date.iso_week(), week_start).unwrap());
                        let week_ahead = interval_start.add(Duration::days(7));

                        if new_date.assume_utc().unix_timestamp() > week_ahead.assume_utc().unix_timestamp() || new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp() {} else if new_date.assume_utc().unix_timestamp() < interval_start.assume_utc().unix_timestamp() {
                            new_dates.push(interval_start.add(Duration::days(7)));
                        } else {
                            new_dates.push(new_date);
                        }
                    } else {
                        if !target_week_day.is_some() {
                            continue;
                        }

                        let day_one = date.replace_day(1).unwrap();
                        let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

                        let stop_date = match Date::from_calendar_date(date.year() + 1, date.month(), date.day()) {
                            Ok(date) => date,
                            _ => continue
                        };

                        let stop_condition = date.replace_date(stop_date);
                        let mut current_date = date.replace_date(Date::from_iso_week_date(date.year(), day_one.iso_week(), parsed_weekday).unwrap());

                        if current_date.assume_utc().unix_timestamp() >= day_one.assume_utc().unix_timestamp() {
                            new_dates.push(current_date);
                        }

                        current_date = current_date.add(Duration::days(7));

                        while current_date.assume_utc().unix_timestamp() < stop_condition.assume_utc().unix_timestamp() {
                            new_dates.push(current_date);
                            current_date = current_date.add(Duration::days(7));
                        }
                    }
                }
            }
        }

        if frequency == &RepeatPeriod::ANNUALLY {
            return new_dates.iter().filter(|date| { self.is_valid_day_in_year(**date, valid_year_days.clone()) }).map(|date| { *date }).collect();
        }

        new_dates
    }

    fn convert_date_to_day_of_year(&self, date: PrimitiveDateTime) -> u16 {
        let day = (date.replace_time(Time::from_hms(0, 0, 0).unwrap()).assume_utc().unix_timestamp() - PrimitiveDateTime::new(Date::from_calendar_date(date.year() - 1, Month::December, 31).unwrap(), date.time()).assume_utc().unix_timestamp()) / 24 / 60 / 60 / 1000;
        return day as u16;
    }

    fn get_valid_days_in_year(&self, year: i32, valid_year_days: &Vec<i16>) -> Vec<u16> {
        let days_in_year = Date::from_calendar_date(year, Month::December, 31).unwrap().ordinal();
        let mut allowed_days: Vec<u16> = Vec::new();

        for allowed_day in valid_year_days {
            if allowed_day > &0 {
                allowed_days.push(allowed_day.abs() as u16);
                continue;
            }

            let day = days_in_year - allowed_day.unsigned_abs() + 1;
            allowed_days.push(day);
        }

        allowed_days
    }

    fn is_valid_day_in_year(&self, date: PrimitiveDateTime, valid_year_days: Vec<i16>) -> bool {
        let valid_days = self.get_valid_days_in_year(date.year(), &valid_year_days);

        if valid_days.len() == 0 {
            return true;
        }

        let day_in_year = self.convert_date_to_day_of_year(date);

        let is_valid = valid_days.contains(&day_in_year);

        return is_valid;
    }

    fn finish_rules(&self, dates: Vec<PrimitiveDateTime>, set_pos_rules: &Vec<&ByRule>, valid_months: Vec<u8>, event_start_time: i64) -> Vec<PrimitiveDateTime> {
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

    #[test]
    fn test_parse_by_day_daily() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "FR".to_string(),
            }
        ], &RepeatPeriod::DAILY, vec![], Weekday::Monday, false, vec![], vec![]), [date]);
    }

    #[test]
    fn test_parse_by_day_daily_invalid() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 8).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "FR".to_string(),
            }
        ], &RepeatPeriod::DAILY, vec![], Weekday::Monday, false, vec![], vec![]), []);
    }

    #[test]
    fn test_parse_by_day_weekly() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 9).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "FR".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "SA".to_string(),
            },
        ], &RepeatPeriod::WEEKLY, vec![], Weekday::Monday, false, vec![], vec![]), [
                       date.replace_day(10).unwrap(),
                       date.replace_day(11).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_by_day_monthly() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 6).unwrap(), time);

        let event_recurrence = EventRecurrence {};
        // Can be WEEKDAY + WEEK

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "MO".to_string(),
            },
        ], &RepeatPeriod::MONTHLY, vec![], Weekday::Monday, false, vec![], vec![]), [
                       date,
                       date.replace_day(13).unwrap(),
                       date.replace_day(20).unwrap(),
                       date.replace_day(27).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_by_day_monthly_with_monthday() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 6).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        let rules = vec![
            ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "MO".to_string(),
            },
            ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "7".to_string(),
            },
        ];
        let by_day_rules: Vec<&ByRule> = rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYDAY }).collect();
        let by_month_day_rules: Vec<&ByRule> = rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYMONTHDAY }).collect();

        let valid_month_days: Vec<i8> = by_month_day_rules.iter().clone().map(|&x| { x.interval.parse::<i8>().unwrap() }).collect();

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &by_day_rules, &RepeatPeriod::MONTHLY, vec![], Weekday::Monday, false, valid_month_days, vec![]), []);
    }

    #[test]
    fn test_parse_by_day_monthly_with_week() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};
        // Can be WEEKDAY + WEEK

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "2MO".to_string(),
            },
        ], &RepeatPeriod::MONTHLY, vec![], Weekday::Monday, false, vec![], vec![]), [
                       date.replace_day(13).unwrap()
                   ]);
    }

    #[test]
    fn test_parse_by_day_monthly_with_monthday_and_week() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 6).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        let rules = vec![
            ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "2MO".to_string(),
            },
            ByRule {
                by_rule: ByRuleType::BYMONTHDAY,
                interval: "7".to_string(),
            },
        ];
        let by_day_rules: Vec<&ByRule> = rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYDAY }).collect();
        let by_month_day_rules: Vec<&ByRule> = rules.iter().filter(|&x| { x.by_rule == ByRuleType::BYMONTHDAY }).collect();

        let valid_month_days: Vec<i8> = by_month_day_rules.iter().clone().map(|&x| { x.interval.parse::<i8>().unwrap() }).collect();

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &by_day_rules, &RepeatPeriod::MONTHLY, vec![], Weekday::Monday, false, valid_month_days, vec![]), []);
    }

    #[test]
    fn test_parse_by_day_yearly() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 6).unwrap(), time);

        let event_recurrence = EventRecurrence {};
        let end_date = date.replace_year(2026).unwrap();
        let mut current_date = date;
        let mut expected_dates: Vec<PrimitiveDateTime> = Vec::new();

        while current_date.assume_utc().unix_timestamp() < end_date.assume_utc().unix_timestamp() {
            expected_dates.push(current_date);
            current_date = current_date.add(Duration::days(7))
        }

        // Can be WEEKDAY + WEEK

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "MO".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY, vec![], Weekday::Monday, false, vec![], vec![]), expected_dates);
    }

    #[test]
    fn test_parse_by_day_yearly_with_week() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};
        // Can be WEEKDAY + WEEK

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "2MO".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY, vec![], Weekday::Monday, false, vec![], vec![]), [
                       date.replace_day(13).unwrap(),
                   ]);
    }

    #[test]
    fn test_parse_by_day_yearly_with_ordinal_day() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};
        // Can be WEEKDAY + WEEK

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "35".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY, vec![], Weekday::Monday, false, vec![], vec![]), [
                       date.replace_month(Month::February).unwrap().replace_day(4).unwrap(),
                   ]);
    }

    #[test]
    fn test_parse_by_day_yearly_with_weekno() {
        //FIXME
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 6).unwrap(), time);

        let event_recurrence = EventRecurrence {};


        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "MO".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "6".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY, vec![], Weekday::Monday, true, vec![], vec![]), [date]);
    }

    #[test]
    fn test_parse_by_day_yearly_with_unmatch_weekno() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "35".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "7".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY, vec![], Weekday::Monday, true, vec![], vec![]), []);
    }

    #[test]
    fn test_parse_by_day_yearly_with_invalid_rule() {
        let time = Time::from_hms(13, 23, 00).unwrap();
        let date = PrimitiveDateTime::new(Date::from_calendar_date(2025, Month::January, 10).unwrap(), time);

        let event_recurrence = EventRecurrence {};
        // Can be WEEKDAY + WEEK

        assert_eq!(event_recurrence.apply_day_rules(vec![date], &vec![
            &ByRule {
                by_rule: ByRuleType::BYDAY,
                interval: "2MO".to_string(),
            },
            &ByRule {
                by_rule: ByRuleType::BYWEEKNO,
                interval: "6".to_string(),
            },
        ], &RepeatPeriod::ANNUALLY, vec![], Weekday::Monday, true, vec![], vec![]), []);
    }
}