use std::ops::{Add, Sub};

use regex::{Match, Regex};
use time::util::weeks_in_year;
use time::{Date, Duration, Month, OffsetDateTime, PrimitiveDateTime, Weekday};

use crate::date::DateTime;

#[derive(uniffi::Enum, PartialEq, Copy, Clone)]
pub enum ByRuleType {
	ByMinute,
	ByHour,
	ByDay,
	ByMonthday,
	ByYearDay,
	ByWeekNo,
	ByMonth,
	BySetPos,
	Wkst,
}

#[derive(uniffi::Enum, PartialEq, Copy, Clone)]
pub enum RepeatPeriod {
	Daily,
	Weekly,
	Monthly,
	Annually,
}

#[derive(Clone, uniffi::Record)]
pub struct ByRule {
	pub by_rule: ByRuleType,
	pub interval: String,
}

#[derive(Clone, uniffi::Record)]
pub struct EventRepeatRule {
	pub frequency: RepeatPeriod,
	pub by_rules: Vec<ByRule>,
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
			_ => panic!("Invalid Month {number}"),
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
			_ => panic!("Invalid Weekday {short_weekday}"),
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

#[derive(uniffi::Object)]
pub struct EventFacade;

#[uniffi::export]
impl EventFacade {
	#[uniffi::constructor]
	pub fn new() -> Self {
		EventFacade {}
	}

	pub fn generate_future_instances(
		&self,
		date: DateTime,
		repeat_rule: EventRepeatRule,
	) -> Vec<DateTime> {
		let Ok(parsed_date) = OffsetDateTime::from_unix_timestamp(date.as_millis() as i64) else {
			return Vec::new();
		};

		let date = PrimitiveDateTime::new(parsed_date.date(), parsed_date.time());

		let by_month_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByMonth)
			.collect();
		let by_day_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByDay)
			.collect();
		let by_month_day_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByMonthday)
			.collect();
		let by_year_day_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByYearDay)
			.collect();
		let by_week_no_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByWeekNo)
			.collect();

		let week_start: Weekday = if repeat_rule.frequency == RepeatPeriod::Annually
			|| repeat_rule.frequency == RepeatPeriod::Weekly
		{
			match repeat_rule
				.by_rules
				.iter()
				.find(|&x| x.by_rule == ByRuleType::Wkst)
			{
				Some(rule) => match rule.interval.as_str() {
					"MO" => Weekday::Monday,
					"TU" => Weekday::Tuesday,
					"WE" => Weekday::Wednesday,
					"TH" => Weekday::Thursday,
					"FR" => Weekday::Friday,
					"SA" => Weekday::Saturday,
					"SU" => Weekday::Sunday,
					_ => Weekday::Monday,
				},
				None => Weekday::Monday,
			}
		} else {
			Weekday::Monday
		};

		let valid_months: Vec<u8> = by_month_rules
			.iter()
			.clone()
			.map(|&x| x.interval.parse::<u8>().unwrap())
			.collect();
		let valid_month_days: Vec<i8> = by_month_day_rules
			.iter()
			.clone()
			.map(|&x| x.interval.parse::<i8>().unwrap())
			.collect();
		let valid_year_days: Vec<i16> = by_year_day_rules
			.iter()
			.clone()
			.map(|&x| x.interval.parse::<i16>().unwrap())
			.collect();

		let month_applied_events: Vec<PrimitiveDateTime> =
			self.apply_month_rules(&vec![date], &by_month_rules, &repeat_rule.frequency);

		let week_no_applied_events: Vec<PrimitiveDateTime> =
			if repeat_rule.frequency == RepeatPeriod::Annually {
				self.apply_week_no_rules(month_applied_events, &by_week_no_rules, week_start)
			} else {
				month_applied_events
			};

		let year_day_applied_events: Vec<PrimitiveDateTime> =
			if repeat_rule.frequency == RepeatPeriod::Annually {
				self.apply_year_day_rules(
					week_no_applied_events,
					&by_year_day_rules,
					!by_week_no_rules.is_empty(),
					!by_month_rules.is_empty(),
				)
			} else {
				week_no_applied_events
			};

		let month_day_applied_events: Vec<PrimitiveDateTime> = self.apply_month_day_rules(
			year_day_applied_events,
			&by_month_day_rules,
			repeat_rule.frequency == RepeatPeriod::Daily,
		);
		let day_applied_events: Vec<PrimitiveDateTime> = self.apply_day_rules(
			month_day_applied_events,
			&by_day_rules,
			&repeat_rule.frequency,
			valid_months.clone(),
			week_start,
			!by_week_no_rules.is_empty(),
			valid_month_days,
			valid_year_days,
		);

		let date_timestamp = date.assume_utc().unix_timestamp();
		self.finish_rules(
			day_applied_events,
			valid_months.clone(),
			Some(date_timestamp),
		)
		.iter()
		.map(|date| DateTime::from_millis(date.assume_utc().unix_timestamp() as u64))
		.collect()
	}
}

impl EventFacade {
	fn apply_month_rules(
		&self,
		dates: &Vec<PrimitiveDateTime>,
		rules: &Vec<&ByRule>,
		frequency: &RepeatPeriod,
	) -> Vec<PrimitiveDateTime> {
		if rules.is_empty() {
			return dates.clone();
		}

		let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

		for &rule in rules {
			for date in dates {
				let target_month: u8 = match rule.interval.parse::<u8>() {
					Ok(month) => month,
					_ => continue,
				};

				if frequency == &RepeatPeriod::Weekly {
					let week_start = PrimitiveDateTime::new(
						Date::from_iso_week_date(date.year(), date.iso_week(), Weekday::Monday)
							.unwrap(),
						date.time(),
					);
					let week_end = PrimitiveDateTime::new(
						Date::from_iso_week_date(date.year(), date.iso_week(), Weekday::Sunday)
							.unwrap(),
						date.time(),
					);

					let week_start_year = week_start.year();
					let week_end_year = week_end.year();

					let week_start_month = week_start.month().to_number();
					let week_end_month = week_end.month().to_number();

					let is_target_month =
						week_end_month == target_month || week_start_month == target_month;

					if (week_start_year == week_end_year
						&& week_start_month < week_end_month
						&& is_target_month)
						|| week_start_year < week_end_year && is_target_month
					{
						new_dates.push(*date);
						continue;
					}
				} else if frequency == &RepeatPeriod::Annually {
					let Ok(new_date) = (*date).replace_month(Month::from_number(target_month))
					else {
						continue;
					};

					let years_to_add = if date.year() == new_date.year()
						&& date.month().to_number() > target_month
					{
						1
					} else {
						0
					};

					new_dates.push(
						match new_date.replace_year(new_date.year() + years_to_add) {
							Ok(date) => date,
							_ => continue,
						},
					);

					continue;
				}

				if date.month().to_number() == target_month {
					new_dates.push(*date);
				}
			}
		}

		new_dates
	}

	fn apply_week_no_rules(
		&self,
		dates: Vec<PrimitiveDateTime>,
		rules: &Vec<&ByRule>,
		week_start: Weekday,
	) -> Vec<PrimitiveDateTime> {
		if rules.is_empty() {
			return dates.clone();
		}

		let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

		for &rule in rules {
			for date in &dates {
				let parsed_week: i8 = match rule.interval.parse::<i8>() {
					Ok(week) => week,
					_ => continue,
				};

				let mut new_date = *date;

				let total_weeks = weeks_in_year(date.year());

				let week_number = if parsed_week < 0 {
					total_weeks - parsed_week.unsigned_abs() + 1
				} else {
					new_date = new_date.replace_date(
						Date::from_iso_week_date(
							new_date.year(),
							parsed_week as u8,
							new_date.weekday(),
						)
						.unwrap(),
					);
					parsed_week as u8
				};

				let year_offset = if new_date.assume_utc().unix_timestamp()
					< date.assume_utc().unix_timestamp()
				{
					date.year() - new_date.year() + 1
				} else {
					0
				};
				let year = new_date.year() + year_offset;
				new_date = new_date
					.replace_date(Date::from_iso_week_date(year, week_number, week_start).unwrap());

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

	fn apply_year_day_rules(
		&self,
		dates: Vec<PrimitiveDateTime>,
		rules: &Vec<&ByRule>,
		evaluate_same_week: bool,
		evaluate_same_month: bool,
	) -> Vec<PrimitiveDateTime> {
		if rules.is_empty() {
			return dates.clone();
		}

		let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

		for &rule in rules {
			for date in &dates {
				let parsed_day: i64 = match rule.interval.parse::<i64>() {
					Ok(day) => day,
					_ => continue,
				};

				let mut new_date: PrimitiveDateTime;
				if parsed_day.is_negative() {
					new_date = date
						.replace_month(Month::December)
						.unwrap()
						.replace_day(31)
						.unwrap()
						.sub(Duration::days((parsed_day.unsigned_abs() - 1) as i64));
				} else {
					new_date = date
						.replace_month(Month::January)
						.unwrap()
						.replace_day(1)
						.unwrap()
						.add(Duration::days(parsed_day - 1));
				}

				let year_offset = if new_date.assume_utc().unix_timestamp()
					< date.assume_utc().unix_timestamp()
				{
					1
				} else {
					0
				};
				new_date = match new_date.replace_year(new_date.year() + year_offset) {
					Ok(date) => date,
					_ => continue,
				};

				if (evaluate_same_week && date.iso_week() != new_date.iso_week())
					|| (evaluate_same_month && date.month() != new_date.month())
				{
					continue;
				}

				new_dates.push(new_date)
			}
		}

		new_dates
	}

	fn apply_month_day_rules(
		&self,
		dates: Vec<PrimitiveDateTime>,
		rules: &Vec<&ByRule>,
		is_daily_event: bool,
	) -> Vec<PrimitiveDateTime> {
		if rules.is_empty() {
			return dates.clone();
		}

		let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

		for &rule in rules {
			for date in &dates {
				let target_day: i8 = match rule.interval.parse::<i8>() {
					Ok(day) => day,
					_ => continue,
				};
				let days_diff =
					date.month().length(date.year()) as i8 - target_day.unsigned_abs() as i8 + 1;

				if is_daily_event {
					if (target_day.is_positive() && date.day() == target_day.unsigned_abs())
						|| (target_day.is_negative() && days_diff == date.day() as i8)
					{
						new_dates.push(*date);
					}

					continue;
				}

				if target_day >= 0 && target_day.unsigned_abs() <= date.month().length(date.year())
				{
					let Ok(date) = date.replace_day(target_day.unsigned_abs()) else {
						continue;
					};

					new_dates.push(date);
				} else if days_diff > 0
					&& target_day.unsigned_abs() <= date.month().length(date.year())
				{
					let Ok(date) = date.replace_day(days_diff.unsigned_abs()) else {
						continue;
					};

					new_dates.push(date);
				}
			}
		}

		new_dates
	}

	fn apply_day_rules(
		&self,
		dates: Vec<PrimitiveDateTime>,
		rules: &Vec<&ByRule>,
		frequency: &RepeatPeriod,
		valid_months: Vec<u8>,
		week_start: Weekday,
		has_week_no: bool,
		valid_month_days: Vec<i8>,
		valid_year_days: Vec<i16>,
	) -> Vec<PrimitiveDateTime> {
		if rules.is_empty() {
			return dates.clone();
		}

		let mut new_dates: Vec<PrimitiveDateTime> = Vec::new();

		// Gets the nth number and the day of the week for a given rule value
		// e.g. 312TH would return ["312TH", "312", "TH"]
		let regex = Regex::new(r"^([-+]?\d{0,3})([a-zA-Z]{2})?$").unwrap();

		for &rule in rules {
			for date in &dates {
				let Some(parsed_rule) = regex.captures(rule.interval.as_str()) else {
					continue;
				};
				let target_week_day = parsed_rule.get(2);
				let leading_value = parsed_rule.get(1);

				if frequency == &RepeatPeriod::Daily
					&& target_week_day.is_some()
					&& date.weekday() == Weekday::from_short(target_week_day.unwrap().as_str())
				{
					// Only filters weekdays that don't match the rule
					new_dates.push(*date)
				} else if frequency == &RepeatPeriod::Weekly && target_week_day.is_some() {
					self.expand_by_day_rules_for_weekly_events(
						&valid_months,
						week_start,
						&mut new_dates,
						date,
						target_week_day,
					)
				} else if frequency == &RepeatPeriod::Monthly && target_week_day.is_some() {
					self.expand_by_day_rule_for_monthly_events(
						&valid_months,
						&valid_month_days,
						&mut new_dates,
						date,
						target_week_day,
						leading_value,
					);
				} else if frequency == &RepeatPeriod::Annually {
					self.expand_by_day_rule_for_annually_events(
						week_start,
						has_week_no,
						&mut new_dates,
						date,
						target_week_day,
						leading_value,
					)
				}
			}
		}

		if frequency == &RepeatPeriod::Annually {
			return new_dates
				.iter()
				.filter(|date| self.is_valid_day_in_year(**date, valid_year_days.clone()))
				.copied()
				.collect();
		}

		new_dates
	}

	fn expand_by_day_rule_for_annually_events(
		&self,
		week_start: Weekday,
		has_week_no: bool,
		new_dates: &mut Vec<PrimitiveDateTime>,
		date: &PrimitiveDateTime,
		target_week_day: Option<Match>,
		leading_value: Option<Match>,
	) {
		let week_change = leading_value
			.map_or(Ok(0), |m| m.as_str().parse::<i64>())
			.unwrap_or_default();

		if has_week_no && week_change != 0 {
			println!("Invalid repeat rule, can't use BYWEEKNO with Week Offset on BYDAY");
			return;
		}

		if week_change != 0 && !has_week_no {
			let mut new_date: PrimitiveDateTime;

			// If there's no target week day, we just set the day of the year.
			if target_week_day.is_none() {
				if week_change > 0 {
					new_date = date
						.replace_day(1)
						.unwrap()
						.replace_month(Month::January)
						.unwrap()
						.add(Duration::days(week_change - 1))
				} else {
					new_date = date
						.replace_month(Month::December)
						.unwrap()
						.replace_day(31)
						.unwrap()
						.sub(Duration::days(week_change.abs() - 1))
				}
			} else {
				let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

				// There's a target week day so the occurrenceNumber indicates the week of the year
				// that the event will happen
				if week_change > 0 {
					new_date = date
						.replace_day(1)
						.unwrap()
						.replace_month(Month::January)
						.unwrap()
						.add(Duration::weeks(week_change - 1));

					while new_date.weekday() != parsed_weekday {
						new_date = new_date.add(Duration::days(1));
					}
				} else {
					new_date = date
						.replace_month(Month::December)
						.unwrap()
						.replace_day(31)
						.unwrap()
						.sub(Duration::weeks(week_change.abs() - 1));
					while new_date.weekday() != parsed_weekday {
						new_date = new_date.sub(Duration::days(1));
					}
				}
			}

			if new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp() {
				if let Ok(dt) = new_date.replace_year(new_date.year() + 1) {
					new_dates.push(dt)
				}
			} else {
				new_dates.push(new_date)
			}
		} else if has_week_no {
			// There's no week number or occurrenceNumber, so it will happen on all
			// weekdays that are the same as targetWeekDay

			if target_week_day.is_none() {
				return;
			}

			let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());
			let new_date = date.replace_date(
				Date::from_iso_week_date(date.year(), date.iso_week(), parsed_weekday).unwrap(),
			);

			let interval_start = date.replace_date(
				Date::from_iso_week_date(date.year(), date.iso_week(), week_start).unwrap(),
			);
			let week_ahead = interval_start.add(Duration::days(7));

			if new_date.assume_utc().unix_timestamp() > week_ahead.assume_utc().unix_timestamp()
				|| new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp()
			{
			} else if new_date.assume_utc().unix_timestamp()
				< interval_start.assume_utc().unix_timestamp()
			{
				new_dates.push(interval_start.add(Duration::days(7)));
			} else {
				new_dates.push(new_date);
			}
		} else {
			if target_week_day.is_none() {
				return;
			}

			let day_one = date.replace_day(1).unwrap();
			let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

			let Ok(stop_date) = Date::from_calendar_date(date.year() + 1, date.month(), date.day())
			else {
				return;
			};

			let stop_condition = date.replace_date(stop_date);
			let mut current_date = date.replace_date(
				Date::from_iso_week_date(date.year(), day_one.iso_week(), parsed_weekday).unwrap(),
			);

			if current_date.assume_utc().unix_timestamp() >= day_one.assume_utc().unix_timestamp() {
				new_dates.push(current_date);
			}

			current_date = current_date.add(Duration::days(7));

			while current_date.assume_utc().unix_timestamp()
				< stop_condition.assume_utc().unix_timestamp()
			{
				new_dates.push(current_date);
				current_date = current_date.add(Duration::days(7));
			}
		}
	}

	fn expand_by_day_rule_for_monthly_events(
		&self,
		valid_months: &[u8],
		valid_month_days: &Vec<i8>,
		new_dates: &mut Vec<PrimitiveDateTime>,
		date: &PrimitiveDateTime,
		target_week_day: Option<Match>,
		leading_value: Option<Match>,
	) {
		let mut allowed_days: Vec<u8> = Vec::new();

		let week_change = leading_value
			.map_or(Ok(0), |m| m.as_str().parse::<i8>())
			.unwrap_or_default();

		let base_date = date.replace_day(1).unwrap();
		let stop_condition = PrimitiveDateTime::new(base_date.date().add_month(), base_date.time());

		// Calculate allowed days parsing negative values
		// to valid days in the month. e.g -1 to 31 in JAN
		for allowed_day in valid_month_days {
			if allowed_day.is_positive() {
				allowed_days.push(allowed_day.unsigned_abs());
				continue;
			}

			let day = base_date.month().length(date.year()) - allowed_day.unsigned_abs() + 1;
			allowed_days.push(day);
		}

		// Simply checks if there's a list with allowed day and check if it includes a given day
		let is_allowed_in_month_day = |day: u8| -> bool {
			if allowed_days.is_empty() {
				return true;
			}

			allowed_days.contains(&day)
		};

		let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

		// If there's a leading value in the rule we have to change the week.
		// e.g. 2TH means second thursday, consequently, second week of the month
		if week_change != 0 {
			let mut new_date = base_date;
			if week_change.is_negative() {
				new_date = new_date
					.replace_day(new_date.month().length(new_date.year()))
					.unwrap();
				new_date = new_date.replace_date(
					Date::from_iso_week_date(new_date.year(), new_date.iso_week(), parsed_weekday)
						.unwrap(),
				);

				let new_week = new_date.iso_week() - week_change.unsigned_abs() + 1;
				new_date = new_date.replace_date(
					Date::from_iso_week_date(new_date.year(), new_week, new_date.weekday())
						.unwrap(),
				)
			} else {
				while new_date.weekday() != parsed_weekday {
					new_date = new_date.add(Duration::days(1));
				}

				new_date = new_date.replace_date(
					Date::from_iso_week_date(
						new_date.year(),
						new_date.iso_week() + week_change.unsigned_abs() - 1,
						new_date.weekday(),
					)
					.unwrap(),
				)
			}

			if new_date.assume_utc().unix_timestamp() >= base_date.assume_utc().unix_timestamp()
				&& new_date.assume_utc().unix_timestamp()
					<= stop_condition.assume_utc().unix_timestamp()
				&& is_allowed_in_month_day(new_date.day())
			{
				new_dates.push(new_date)
			}
		} else {
			// If there's no week change, just iterate to the target day
			let mut current_date = base_date;
			while current_date.assume_utc().unix_timestamp()
				< stop_condition.assume_utc().unix_timestamp()
			{
				let new_date = current_date.replace_date(
					Date::from_iso_week_date(
						current_date.year(),
						current_date.iso_week(),
						parsed_weekday,
					)
					.unwrap(),
				);
				if new_date.assume_utc().unix_timestamp() >= base_date.assume_utc().unix_timestamp()
					&& is_allowed_in_month_day(new_date.day())
					&& ((!valid_months.is_empty()
						&& valid_months.contains(&new_date.month().to_number()))
						|| valid_months.is_empty())
				{
					new_dates.push(new_date)
				}

				current_date = new_date.add(Duration::days(7));
			}
		}
	}

	fn expand_by_day_rules_for_weekly_events(
		&self,
		valid_months: &[u8],
		week_start: Weekday,
		new_dates: &mut Vec<PrimitiveDateTime>,
		date: &PrimitiveDateTime,
		target_week_day: Option<Match>,
	) {
		let parsed_target_week_day = Weekday::from_short(target_week_day.unwrap().as_str());

		// Go back to week start, so we don't miss any events
		let mut interval_start = *date;
		while interval_start.date().weekday() != week_start {
			interval_start = interval_start.sub(Duration::days(1));
		}

		// Move forward until we reach the target day
		let mut new_date = interval_start;
		while new_date.weekday() != parsed_target_week_day {
			new_date = new_date.add(Duration::days(1))
		}

		// Calculate next event to avoid creating events too ahead in the future
		let next_event = date.add(Duration::weeks(1)).assume_utc().unix_timestamp();

		if new_date.assume_utc().unix_timestamp()
			>= interval_start
				.add(Duration::weeks(1))
				.assume_utc()
				.unix_timestamp()
		{
			// The event is actually next week, so discard
			return;
		} else if new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp() {
			// Event is behind progenitor, go forward one week
			new_date = new_date.add(Duration::weeks(1));
		}

		if (new_date.assume_utc().unix_timestamp() >= next_event)
			|| (week_start != Weekday::Monday // We have WKST
			&& new_date.assume_utc().unix_timestamp()
			>= interval_start
			.add(Duration::weeks(1))
			.assume_utc()
			.unix_timestamp())
		{
			// Or we created an event after the first event or within the next week
			return;
		}

		if valid_months.is_empty() || valid_months.contains(&new_date.month().to_number()) {
			new_dates.push(new_date)
		}
	}

	fn get_valid_days_in_year(&self, year: i32, valid_year_days: &Vec<i16>) -> Vec<u16> {
		let days_in_year = Date::from_calendar_date(year, Month::December, 31)
			.unwrap()
			.ordinal();
		let mut allowed_days: Vec<u16> = Vec::new();

		for allowed_day in valid_year_days {
			if allowed_day > &0 {
				allowed_days.push(allowed_day.unsigned_abs());
				continue;
			}

			let day = days_in_year - allowed_day.unsigned_abs() + 1;
			allowed_days.push(day);
		}

		allowed_days
	}

	fn is_valid_day_in_year(&self, date: PrimitiveDateTime, valid_year_days: Vec<i16>) -> bool {
		let valid_days = self.get_valid_days_in_year(date.year(), &valid_year_days);

		if valid_days.is_empty() {
			return true;
		}

		let day_in_year = date.ordinal();

		valid_days.contains(&day_in_year)
	}

	fn finish_rules(
		&self,
		dates: Vec<PrimitiveDateTime>,
		valid_months: Vec<u8>,
		event_start_time: Option<i64>,
	) -> Vec<PrimitiveDateTime> {
		let mut clean_dates;

		if !valid_months.is_empty() {
			clean_dates = dates
				.iter()
				.filter(|date| valid_months.contains(&date.month().to_number()))
				.copied()
				.collect();
		} else {
			clean_dates = dates
		};

		if event_start_time.is_some() {
			clean_dates = clean_dates
				.iter()
				.filter(|date| {
					let date_unix_timestamp = date.assume_utc().unix_timestamp();
					date_unix_timestamp >= event_start_time.unwrap()
				})
				.copied()
				.collect();
		}

		clean_dates.sort_by(|a, b| {
			a.assume_utc()
				.unix_timestamp()
				.cmp(&b.assume_utc().unix_timestamp())
		});
		clean_dates.dedup();

		clean_dates
	}
}

#[cfg(test)]
mod tests {
	use time::{Date, Month, PrimitiveDateTime, Time};

	use super::*;

	trait PrimitiveToDateTime {
		fn to_date_time(&self) -> DateTime;
	}
	impl PrimitiveToDateTime for PrimitiveDateTime {
		fn to_date_time(&self) -> DateTime {
			DateTime::from_millis(self.assume_utc().unix_timestamp() as u64)
		}
	}

	#[test]
	fn test_parse_weekly_by_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::January, 23).unwrap(),
			time,
		);
		let invalid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::March, 11).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![valid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Weekly,
			),
			vec![valid_date]
		);

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![invalid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Weekly,
			),
			vec![]
		);
	}

	#[test]
	fn test_parse_monthly_by_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::January, 23).unwrap(),
			time,
		);
		let invalid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::March, 11).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![valid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Monthly,
			),
			vec![valid_date]
		);

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![invalid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Monthly,
			),
			vec![]
		);
	}

	#[test]
	fn test_parse_yearly_by_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::January, 23).unwrap(),
			time,
		);
		let to_next_year = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::March, 11).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![valid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Annually,
			),
			vec![
				valid_date,
				valid_date.replace_month(Month::February).unwrap(),
			]
		);

		// BYMONTH never limits on Yearly, just expands
		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![to_next_year],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Annually,
			),
			vec![
				to_next_year
					.replace_year(2025)
					.unwrap()
					.replace_month(Month::January)
					.unwrap(),
				to_next_year
					.replace_year(2025)
					.unwrap()
					.replace_month(Month::February)
					.unwrap(),
			]
		);
	}

	#[test]
	fn test_parse_daily_by_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::January, 23).unwrap(),
			time,
		);
		let invalid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::March, 11).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![valid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Daily,
			),
			vec![valid_date]
		);

		assert_eq!(
			event_recurrence.apply_month_rules(
				&vec![invalid_date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "1".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonth,
						interval: "2".to_string(),
					},
				],
				&RepeatPeriod::Daily,
			),
			vec![]
		);
	}

	#[test]
	fn test_parse_positive_week_no() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 31).unwrap(),
			time,
		);

		let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
		let base_date = Date::from_calendar_date(2025, Month::January, 27).unwrap();
		for i in 0..7 {
			valid_dates.push(PrimitiveDateTime::new(
				base_date.add(Duration::days(i)),
				time,
			));
		}

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_week_no_rules(
				vec![valid_date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "5".to_string(),
				},],
				Weekday::Monday,
			),
			valid_dates
		);
	}

	#[test]
	fn test_parse_wkst_week_no() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 31).unwrap(),
			time,
		);

		let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
		let base_date = Date::from_calendar_date(2025, Month::January, 28).unwrap();
		for i in 0..7 {
			valid_dates.push(PrimitiveDateTime::new(
				base_date.add(Duration::days(i)),
				time,
			));
		}

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_week_no_rules(
				vec![valid_date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "5".to_string(),
				},],
				Weekday::Tuesday,
			),
			valid_dates
		);
	}

	#[test]
	fn test_parse_negative_week_no() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::December, 4).unwrap(),
			time,
		);

		let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
		let base_date = Date::from_calendar_date(2025, Month::November, 24).unwrap();
		for i in 0..7 {
			valid_dates.push(PrimitiveDateTime::new(
				base_date.add(Duration::days(i)),
				time,
			));
		}

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_week_no_rules(
				vec![valid_date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "-5".to_string(),
				},],
				Weekday::Monday,
			),
			valid_dates
		);
	}

	#[test]
	fn test_parse_edge_week_no() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2026, Month::December, 29).unwrap(),
			time,
		);

		let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
		let base_date = Date::from_calendar_date(2026, Month::December, 28).unwrap();
		for i in 0..4 {
			valid_dates.push(PrimitiveDateTime::new(
				base_date.add(Duration::days(i)),
				time,
			));
		}

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_week_no_rules(
				vec![valid_date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "-1".to_string(),
				},],
				Weekday::Monday,
			),
			valid_dates
		);
	}

	#[test]
	fn test_parse_out_of_week_no() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 22).unwrap(),
			time,
		);

		let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
		let base_date = Date::from_calendar_date(2026, Month::January, 26).unwrap();
		for i in 0..7 {
			valid_dates.push(PrimitiveDateTime::new(
				base_date.add(Duration::days(i)),
				time,
			));
		}

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_week_no_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "5".to_string(),
				},],
				Weekday::Monday,
			),
			valid_dates
		);
	}

	#[test]
	fn test_parse_year_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 1).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_year_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByYearDay,
					interval: "40".to_string(),
				}],
				false,
				false,
			),
			[date.replace_day(9).unwrap()]
		);
	}

	#[test]
	fn test_parse_year_day_keep_week() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 1).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_year_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByYearDay,
					interval: "40".to_string(),
				}],
				true,
				false,
			),
			[]
		);
	}

	#[test]
	fn test_parse_year_day_keep_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 22).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_year_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByYearDay,
					interval: "40".to_string(),
				}],
				true,
				true,
			),
			[]
		);
	}

	#[test]
	fn test_parse_out_of_year_year_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 22).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_year_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByYearDay,
					interval: "40".to_string(),
				}],
				false,
				false,
			),
			[date.replace_year(2026).unwrap().replace_day(9).unwrap()]
		);
	}

	#[test]
	fn test_parse_negative_year_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 22).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_year_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByYearDay,
					interval: "-1".to_string(),
				}],
				false,
				false,
			),
			[date
				.replace_month(Month::December)
				.unwrap()
				.replace_day(31)
				.unwrap()]
		);
	}

	#[test]
	fn test_parse_by_month_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 22).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_day_rules(
				vec![date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByMonthday,
						interval: "10".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByMonthday,
						interval: "20".to_string(),
					},
				],
				false,
			),
			[date.replace_day(10).unwrap(), date.replace_day(20).unwrap()]
		);
	}

	#[test]
	fn test_parse_invalid_by_month_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 22).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "30".to_string(),
				},],
				false,
			),
			[]
		);
	}

	#[test]
	fn test_parse_daily_by_month_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 20).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "20".to_string(),
				}],
				false,
			),
			[date.replace_day(20).unwrap()]
		);
	}

	#[test]
	fn test_parse_negative_by_month_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "-1".to_string(),
				},],
				false,
			),
			[date.replace_day(31).unwrap(),]
		);
	}

	#[test]
	fn test_parse_invalid_date_by_month_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_month_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "32".to_string(),
				},],
				false,
			),
			[]
		);
	}

	#[test]
	fn test_parse_by_day_daily() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				}],
				&RepeatPeriod::Daily,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[date]
		);
	}

	#[test]
	fn test_parse_by_day_daily_invalid() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 8).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				}],
				&RepeatPeriod::Daily,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[]
		);
	}

	#[test]
	fn test_parse_by_day_weekly() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 9).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "FR".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "SA".to_string(),
					},
				],
				&RepeatPeriod::Weekly,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[date.replace_day(10).unwrap(), date.replace_day(11).unwrap()]
		);
	}

	#[test]
	fn test_parse_by_day_monthly() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 6).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		// Can be WEEKDAY + WEEK

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "MO".to_string(),
				},],
				&RepeatPeriod::Monthly,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[
				date,
				date.replace_day(13).unwrap(),
				date.replace_day(20).unwrap(),
				date.replace_day(27).unwrap()
			]
		);
	}

	#[test]
	fn test_parse_by_day_monthly_with_monthday() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 6).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		let rules = vec![
			ByRule {
				by_rule: ByRuleType::ByDay,
				interval: "MO".to_string(),
			},
			ByRule {
				by_rule: ByRuleType::ByMonthday,
				interval: "7".to_string(),
			},
		];
		let by_day_rules: Vec<&ByRule> = rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByDay)
			.collect();
		let by_month_day_rules: Vec<&ByRule> = rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByMonthday)
			.collect();

		let valid_month_days: Vec<i8> = by_month_day_rules
			.iter()
			.clone()
			.map(|&x| x.interval.parse::<i8>().unwrap())
			.collect();

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&by_day_rules,
				&RepeatPeriod::Monthly,
				vec![],
				Weekday::Monday,
				false,
				valid_month_days,
				vec![],
			),
			[]
		);
	}

	#[test]
	fn test_parse_by_day_monthly_with_week() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		// Can be WEEKDAY + WEEK

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "2MO".to_string(),
				},],
				&RepeatPeriod::Monthly,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[date.replace_day(13).unwrap()]
		);
	}

	#[test]
	fn test_parse_by_day_monthly_with_monthday_and_week() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 6).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		let rules = vec![
			ByRule {
				by_rule: ByRuleType::ByDay,
				interval: "2MO".to_string(),
			},
			ByRule {
				by_rule: ByRuleType::ByMonthday,
				interval: "7".to_string(),
			},
		];
		let by_day_rules: Vec<&ByRule> = rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByDay)
			.collect();
		let by_month_day_rules: Vec<&ByRule> = rules
			.iter()
			.filter(|&x| x.by_rule == ByRuleType::ByMonthday)
			.collect();

		let valid_month_days: Vec<i8> = by_month_day_rules
			.iter()
			.clone()
			.map(|&x| x.interval.parse::<i8>().unwrap())
			.collect();

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&by_day_rules,
				&RepeatPeriod::Monthly,
				vec![],
				Weekday::Monday,
				false,
				valid_month_days,
				vec![],
			),
			[]
		);
	}

	#[test]
	fn test_parse_by_day_yearly() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 6).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		let end_date = date.replace_year(2026).unwrap();
		let mut current_date = date;
		let mut expected_dates: Vec<PrimitiveDateTime> = Vec::new();

		while current_date.assume_utc().unix_timestamp() < end_date.assume_utc().unix_timestamp() {
			expected_dates.push(current_date);
			current_date = current_date.add(Duration::days(7))
		}

		// Can be WEEKDAY + WEEK

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "MO".to_string(),
				},],
				&RepeatPeriod::Annually,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			expected_dates
		);
	}

	#[test]
	fn test_parse_by_day_yearly_with_week() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		// Can be WEEKDAY + WEEK

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "2MO".to_string(),
				},],
				&RepeatPeriod::Annually,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[date.replace_day(13).unwrap(),]
		);
	}

	#[test]
	fn test_parse_by_day_yearly_with_ordinal_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		// Can be WEEKDAY + WEEK

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![&ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "35".to_string(),
				},],
				&RepeatPeriod::Annually,
				vec![],
				Weekday::Monday,
				false,
				vec![],
				vec![],
			),
			[date
				.replace_month(Month::February)
				.unwrap()
				.replace_day(4)
				.unwrap(),]
		);
	}

	#[test]
	fn test_parse_by_day_yearly_with_weekno() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 6).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "MO".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByWeekNo,
						interval: "6".to_string(),
					},
				],
				&RepeatPeriod::Annually,
				vec![],
				Weekday::Monday,
				true,
				vec![],
				vec![],
			),
			[date]
		);
	}

	#[test]
	fn test_parse_by_day_yearly_with_unmatch_weekno() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "35".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByWeekNo,
						interval: "7".to_string(),
					},
				],
				&RepeatPeriod::Annually,
				vec![],
				Weekday::Monday,
				true,
				vec![],
				vec![],
			),
			[]
		);
	}

	#[test]
	fn test_parse_by_day_yearly_with_invalid_rule() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		// Can be WEEKDAY + WEEK

		assert_eq!(
			event_recurrence.apply_day_rules(
				vec![date],
				&vec![
					&ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "2MO".to_string(),
					},
					&ByRule {
						by_rule: ByRuleType::ByWeekNo,
						interval: "6".to_string(),
					},
				],
				&RepeatPeriod::Annually,
				vec![],
				Weekday::Monday,
				true,
				vec![],
				vec![],
			),
			[]
		);
	}

	#[test]
	fn test_flow_with_by_month_daily() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Daily,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "2".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "3".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "6".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::January).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.to_date_time()]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::February).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[date.replace_month(Month::February).unwrap().to_date_time()]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::June).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[date.replace_month(Month::June).unwrap().to_date_time()]
		);
	}

	#[test]
	fn test_flow_daily_with_by_month_and_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Daily,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "2".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[]
		);
	}

	#[test]
	fn test_flow_daily_with_by_month_and_by_day_and_by_monthday() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 14).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Daily,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "2".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "14".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(14).unwrap().to_date_time()]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_day(13).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[]
		);
	}

	#[test]
	fn test_flow_weekly_with_by_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Weekly,
			by_rules: vec![ByRule {
				by_rule: ByRuleType::ByMonth,
				interval: "2".to_string(),
			}],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(10).unwrap().to_date_time(),]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::January).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[]
		);
	}

	#[test]
	fn test_flow_weekly_with_by_month_and_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Weekly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "2".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(13).unwrap().to_date_time(),
				date.replace_day(14).unwrap().to_date_time()
			]
		);
	}

	#[test]
	fn test_flow_weekly_with_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Weekly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(13).unwrap().to_date_time(),
				date.replace_day(14).unwrap().to_date_time()
			]
		);
	}

	#[test]
	fn test_flow_weekly_with_by_day_edge() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 2).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Weekly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "MO".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TU".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(3).unwrap().to_date_time(),
				date.replace_day(4).unwrap().to_date_time()
			]
		);
	}

	#[test]
	fn test_flow_weekly_with_by_day_and_wkst_edge() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Weekly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::Wkst,
					interval: "FR".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(13).unwrap().to_date_time(),]
		);
	}

	#[test]
	fn test_flow_weekly_with_by_day_and_wkst() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 7).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Weekly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::Wkst,
					interval: "FR".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(7).unwrap().to_date_time(),
				date.replace_day(13).unwrap().to_date_time(),
			]
		);
	}

	#[test]
	fn test_flow_monthly_with_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![ByRule {
				by_rule: ByRuleType::ByDay,
				interval: "FR".to_string(),
			}],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(14).unwrap().to_date_time(),
				date.replace_day(21).unwrap().to_date_time(),
				date.replace_day(28).unwrap().to_date_time()
			]
		);
	}

	#[test]
	fn test_flow_monthly_with_second_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![ByRule {
				by_rule: ByRuleType::ByDay,
				interval: "2FR".to_string(),
			}],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(14).unwrap().to_date_time(),]
		);
	}

	#[test]
	fn test_flow_monthly_with_two_last_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "-1FR".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "-2FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(21).unwrap().to_date_time(),
				date.replace_day(28).unwrap().to_date_time(),
			]
		);
	}

	#[test]
	fn test_flow_monthly_with_by_month() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);
		let date_not_in_range = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![ByRule {
				by_rule: ByRuleType::ByMonth,
				interval: "2".to_string(),
			}],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(10).unwrap().to_date_time(),]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(date_not_in_range.to_date_time(), repeat_rule.clone()),
			[]
		);
	}

	#[test]
	fn test_flow_monthly_with_by_month_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "25".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "28".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(25).unwrap().to_date_time(),
				date.replace_day(28).unwrap().to_date_time(),
			]
		);
	}

	#[test]
	fn test_flow_monthly_with_by_month_day_and_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "25".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByMonthday,
					interval: "28".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(28).unwrap().to_date_time()]
		);
	}

	#[test]
	fn test_flow_monthly_with_by_month_and_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Monthly,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "2".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(13).unwrap().to_date_time(),
				date.replace_day(14).unwrap().to_date_time(),
				date.replace_day(20).unwrap().to_date_time(),
				date.replace_day(21).unwrap().to_date_time(),
				date.replace_day(27).unwrap().to_date_time(),
				date.replace_day(28).unwrap().to_date_time()
			]
		);
	}

	#[test]
	fn test_flow_yearly_with_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let stop_condition = PrimitiveDateTime::new(
			Date::from_calendar_date(2026, Month::February, 10).unwrap(),
			time,
		);
		let mut expected_dates: Vec<DateTime> = Vec::new();
		let mut current_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 13).unwrap(),
			time,
		);

		while current_date.assume_utc().unix_timestamp()
			< stop_condition.assume_utc().unix_timestamp()
		{
			expected_dates.push(current_date.to_date_time());
			expected_dates.push(current_date.add(Duration::days(1)).to_date_time());

			current_date = current_date.add(Duration::days(7));
		}

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			expected_dates
		);
	}

	#[test]
	fn test_flow_yearly_with_by_day_and_by_year_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByYearDay,
					interval: "44".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(13).unwrap().to_date_time()]
		);

		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::March).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[]
		);
	}

	#[test]
	fn test_flow_yearly_with_by_week_no_and_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "8".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[date.replace_day(20).unwrap().to_date_time()]
		);

		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::March).unwrap().to_date_time(),
				repeat_rule.clone(),
			),
			[date
				.replace_year(2026)
				.unwrap()
				.replace_day(19)
				.unwrap()
				.to_date_time()]
		);
	}

	#[test]
	fn test_flow_yearly_with_negative_week_no() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let valid_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::December, 4).unwrap(),
			time,
		);

		let mut valid_dates: Vec<PrimitiveDateTime> = Vec::new();
		let base_date = Date::from_calendar_date(2025, Month::December, 1).unwrap();
		for i in 0..7 {
			valid_dates.push(PrimitiveDateTime::new(
				base_date.add(Duration::days(i)),
				time,
			));
		}

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![ByRule {
				by_rule: ByRuleType::ByWeekNo,
				interval: "-5".to_string(),
			}],
		};

		let event_recurrence = EventFacade {};

		assert_eq!(
			event_recurrence.generate_future_instances(valid_date.to_date_time(), repeat_rule),
			[]
		);
	}

	#[test]
	fn test_flow_yearly_with_by_week_no_and_wkst() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "8".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::Wkst,
					interval: "TU".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(18).unwrap().to_date_time(),
				date.replace_day(19).unwrap().to_date_time(),
				date.replace_day(20).unwrap().to_date_time(),
				date.replace_day(21).unwrap().to_date_time(),
				date.replace_day(22).unwrap().to_date_time(),
				date.replace_day(23).unwrap().to_date_time(),
				date.replace_day(24).unwrap().to_date_time(),
			]
		);
	}

	#[test]
	fn test_flow_yearly_with_by_month_and_by_day() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::February, 10).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByMonth,
					interval: "2".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TH".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "FR".to_string(),
				},
			],
		};

		let event_recurrence = EventFacade {};
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), repeat_rule.clone()),
			[
				date.replace_day(13).unwrap().to_date_time(),
				date.replace_day(14).unwrap().to_date_time(),
				date.replace_day(20).unwrap().to_date_time(),
				date.replace_day(21).unwrap().to_date_time(),
				date.replace_day(27).unwrap().to_date_time(),
				date.replace_day(28).unwrap().to_date_time(),
				date.replace_year(2026)
					.unwrap()
					.replace_day(5)
					.unwrap()
					.to_date_time(),
				date.replace_year(2026)
					.unwrap()
					.replace_day(6)
					.unwrap()
					.to_date_time(),
			]
		);
	}
}
