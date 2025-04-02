use std::ops::{Add, Sub};

use crate::date::DateTime;
use crate::ApiCallError;
use regex::{Match, Regex};
use time::util::weeks_in_year;
use time::{Date, Duration, Month, OffsetDateTime, PrimitiveDateTime, Time, Weekday};

#[derive(uniffi::Enum, PartialEq, Copy, Clone, num_enum::TryFromPrimitive)]
#[repr(u8)]
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

#[derive(uniffi::Enum, PartialEq, Copy, Clone, num_enum::TryFromPrimitive)]
#[repr(u8)]
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
		repeat_rule: &EventRepeatRule,
	) -> Vec<DateTime> {
		let Ok(parsed_date) = OffsetDateTime::from_unix_timestamp(date.as_seconds() as i64) else {
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
		.map(|date| DateTime::from_seconds(date.assume_utc().unix_timestamp().unsigned_abs()))
		.collect()
	}

	pub fn create_event_instances(
		&self,
		event_start_time: DateTime,
		event_end_time: DateTime,
		repeat_rule: EventRepeatRule,
		repeat_interval: u8,
		end_type: EndType,
		end_value: Option<u64>,
		excluded_dates: Vec<DateTime>,
		max_interval: Option<u8>,
		max_date: Option<DateTime>,
	) -> Result<Vec<DateTime>, ApiCallError> {
		let is_all_day_event = self.is_all_day_event_by_times(event_start_time, event_end_time);
		let set_pos_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|rule| rule.by_rule == ByRuleType::BySetPos)
			.collect();

		let calc_event_start = if is_all_day_event {
			let all_day_event = self.get_all_day_time(&event_start_time)?;

			all_day_event
		} else {
			event_start_time
		};

		let end_date = if end_type == EndType::UntilDate {
			if is_all_day_event {
				let all_day_event =
					self.get_all_day_time(&DateTime::from_millis(end_value.unwrap()))?;

				Some(all_day_event)
			} else {
				Some(DateTime::from_millis(end_value.unwrap()))
			}
		} else {
			None
		};

		let transformed_excluded_dates = if is_all_day_event {
			excluded_dates
				.iter()
				.filter_map(|date| self.get_all_day_time(date).ok())
				.collect()
		} else {
			excluded_dates
		};

		if end_type != EndType::Never && end_value.is_none() {
			return Err(ApiCallError::InternalSdkError {
				error_message: format!(
					"Event with different from EndType::Never without EndValue {:?}",
					event_start_time.as_millis()
				),
			});
		}

		let mut occurrences = 0;
		let mut interval_occurrences = 0;
		let mut generated_events: Vec<DateTime> = Vec::new();
		let mut interval_multiplier = 0;

		while (end_type != EndType::Count || occurrences < end_value.unwrap())
			&& ((max_interval.is_some() && interval_occurrences < max_interval.unwrap())
				|| max_interval.is_none())
		{
			let Ok(mut start_time) =
				OffsetDateTime::from_unix_timestamp(calc_event_start.as_seconds() as i64)
			else {
				break;
			};

			let repeat_frequency = repeat_rule.frequency;
			start_time = self.increment_date_by_repeat_period(
				&start_time,
				interval_multiplier * repeat_interval,
				&repeat_frequency,
			);

			if max_date.is_some()
				&& start_time.unix_timestamp().unsigned_abs() >= max_date.unwrap().as_seconds()
			{
				break;
			}

			let expanded_events: Vec<DateTime> = self.generate_future_instances(
				DateTime::from_seconds(start_time.unix_timestamp().unsigned_abs()),
				&repeat_rule,
			);

			let progenitor = DateTime::from_seconds(start_time.unix_timestamp() as u64);

			let mut has_invalid_set_pos = false;
			let parsed_set_pos: Vec<i64> = set_pos_rules
				.iter()
				.map(|rule| {
					let Ok(interval) = rule.interval.parse::<i64>() else {
						has_invalid_set_pos = true;
						return 0;
					};

					if interval < 0 {
						(expanded_events.len() as i64) - interval.abs()
					} else {
						interval - 1
					}
				})
				.collect();

			if (end_date.is_some() && progenitor.as_millis() >= end_date.unwrap().as_millis())
				|| has_invalid_set_pos
			{
				break;
			}

			for index in 0..expanded_events.len() {
				if (end_type == EndType::Count && occurrences >= end_value.unwrap())
					|| (end_type == EndType::UntilDate
						&& expanded_events.get(index).unwrap().as_millis() >= end_value.unwrap())
				{
					break;
				}

				if !parsed_set_pos.is_empty() || parsed_set_pos.contains(&(index as i64)) {
					continue;
				}

				if !transformed_excluded_dates.is_empty()
					&& transformed_excluded_dates.contains(expanded_events.get(index).unwrap())
				{
					continue;
				}

				generated_events.push(*expanded_events.get(index).unwrap());
				occurrences += 1;
			}

			if interval_occurrences == u8::MAX {
				break;
			}

			interval_occurrences += 1;
			interval_multiplier += 1;
		}

		Ok(generated_events)
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

	pub fn increment_date_by_repeat_period(
		&self,
		start_date: &OffsetDateTime,
		repeat_interval: u8,
		repeat_period: &RepeatPeriod,
	) -> OffsetDateTime {
		match repeat_period {
			RepeatPeriod::Daily => start_date.add(Duration::days(repeat_interval as i64)),
			RepeatPeriod::Weekly => start_date.add(Duration::weeks(repeat_interval as i64)),
			RepeatPeriod::Monthly => self.add_months_to_date(start_date, repeat_interval),
			RepeatPeriod::Annually => self.add_years_to_date(start_date, repeat_interval),
		}
	}

	fn add_years_to_date(&self, date: &OffsetDateTime, years: u8) -> OffsetDateTime {
		self.add_months_to_date(date, years * 12)
	}

	fn add_months_to_date(&self, date: &OffsetDateTime, months: u8) -> OffsetDateTime {
		if months == 0 {
			return *date;
		}

		let date = *date;

		let target_month = date.month().nth_next(months);
		let mut sum_years = (months / 12) as i32;

		if target_month.to_number() < date.month().to_number() && sum_years == 0 {
			sum_years = 1;
		}

		let target_year = date.year() + sum_years;
		let target_day = if target_month.length(target_year) < date.day() {
			target_month.length(target_year)
		} else {
			date.day()
		};

		date.replace_date(Date::from_calendar_date(target_year, target_month, target_day).unwrap())
	}

	pub fn is_all_day_event_by_times(
		&self,
		event_start_time: DateTime,
		event_end_time: DateTime,
	) -> bool {
		let Ok(start) = OffsetDateTime::from_unix_timestamp(event_start_time.as_seconds() as i64)
		else {
			return false;
		};
		let Ok(end) = OffsetDateTime::from_unix_timestamp(event_end_time.as_seconds() as i64)
		else {
			return false;
		};

		let start_fits =
			start.time().hour() == 0 && start.time().minute() == 0 && start.time().second() == 0;
		let end_fits =
			end.time().hour() == 0 && end.time().minute() == 0 && end.time().second() == 0;

		start_fits && end_fits
	}

	pub fn get_all_day_time(&self, date: &DateTime) -> Result<DateTime, ApiCallError> {
		let Ok(date) = OffsetDateTime::from_unix_timestamp(date.as_seconds() as i64) else {
			eprintln!(
				"Failed to get all day time for date {:?}",
				date.as_seconds()
			);

			return Err(ApiCallError::InternalSdkError {
				error_message: format!(
					"Failed to get all day time for date {}.",
					date.as_seconds()
				),
			});
		};

		Ok(DateTime::from_seconds(
			date.replace_time(Time::from_hms(0, 0, 0).unwrap())
				.unix_timestamp()
				.unsigned_abs(),
		))
	}
}

#[derive(uniffi::Enum, PartialEq, Copy, Clone, num_enum::TryFromPrimitive)]
#[repr(u8)]
pub enum EndType {
	Never,
	Count,
	UntilDate,
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
			DateTime::from_millis(self.assume_utc().unix_timestamp().unsigned_abs() * 1000)
		}
	}

	#[test]
	fn test_generate_instances() {
		let event_facade = EventFacade::new();

		let event_start = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 22).unwrap(),
			Time::from_hms(12, 0, 0).unwrap(),
		)
		.assume_utc();

		let event_end = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 22).unwrap(),
			Time::from_hms(12, 30, 0).unwrap(),
		)
		.assume_utc();

		let max_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 30).unwrap(),
			Time::from_hms(00, 00, 0).unwrap(),
		)
		.assume_utc();

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Daily,
			by_rules: vec![],
		};

		let events = event_facade.create_event_instances(
			DateTime::from_seconds(event_start.unix_timestamp() as u64),
			DateTime::from_seconds(event_end.unix_timestamp() as u64),
			repeat_rule,
			1,
			EndType::Never,
			None,
			vec![],
			None,
			Some(DateTime::from_seconds(
				max_date.unix_timestamp().unsigned_abs(),
			)),
		);

		assert_eq!(
			events.unwrap(),
			vec![
				DateTime::from_millis(1742644800000), //22.03.2025 12:00:00
				DateTime::from_millis(1742731200000), //23.03.2025 12:00:00
				DateTime::from_millis(1742817600000), //24.03.2025 12:00:00
				DateTime::from_millis(1742904000000), //25.03.2025 12:00:00
				DateTime::from_millis(1742990400000), //26.03.2025 12:00:00
				DateTime::from_millis(1743076800000), //27.03.2025 12:00:00
				DateTime::from_millis(1743163200000), //28.03.2025 12:00:00
				DateTime::from_millis(1743249600000)  //29.03.2025 12:00:00
			]
		);
	}

	#[test]
	fn test_create_event_instances_for_weekly_events() {
		let event_facade = EventFacade::new();

		let event_start = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 13).unwrap(),
			Time::from_hms(12, 0, 0).unwrap(),
		)
		.assume_utc();

		let event_end = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 13).unwrap(),
			Time::from_hms(18, 30, 0).unwrap(),
		)
		.assume_utc();

		let max_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 27).unwrap(),
			Time::from_hms(14, 38, 0).unwrap(),
		)
		.assume_utc();

		let weekly_events = event_facade.create_event_instances(
			DateTime::from_seconds(event_start.unix_timestamp() as u64),
			DateTime::from_seconds(event_end.unix_timestamp() as u64),
			EventRepeatRule {
				frequency: RepeatPeriod::Weekly,
				by_rules: vec![],
			},
			1,
			EndType::Never,
			None,
			vec![],
			None,
			Some(DateTime::from_seconds(
				max_date.unix_timestamp().unsigned_abs(),
			)),
		);

		assert_eq!(
			weekly_events.unwrap(),
			vec![
				DateTime::from_millis(1741867200000), //13.03.2025 12:00:00
				DateTime::from_millis(1742472000000), //20.03.2025 12:00:00
				DateTime::from_millis(1743076800000)  //20.03.2025 12:00:00
			]
		);
	}

	#[test]
	fn test_create_event_instances_with_excluded_dates() {
		let event_facade = EventFacade::new();

		let event_start = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 22).unwrap(),
			Time::from_hms(12, 0, 0).unwrap(),
		)
		.assume_utc();

		let event_end = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 22).unwrap(),
			Time::from_hms(12, 30, 0).unwrap(),
		)
		.assume_utc();

		let max_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 30).unwrap(),
			Time::from_hms(00, 00, 0).unwrap(),
		)
		.assume_utc();

		let excluded_dates = event_facade.create_event_instances(
			DateTime::from_seconds(event_start.unix_timestamp() as u64),
			DateTime::from_seconds(event_end.unix_timestamp() as u64),
			EventRepeatRule {
				frequency: RepeatPeriod::Daily,
				by_rules: vec![],
			},
			1,
			EndType::Never,
			None,
			vec![
				DateTime::from_millis(1742644800000), //22.03.2025 12:00:00
				DateTime::from_millis(1742731200000), //23.03.2025 12:00:00
				DateTime::from_millis(1742817600000), //24.03.2025 12:00:00
				DateTime::from_millis(1742904000000), //25.03.2025 12:00:00
				DateTime::from_millis(1743076800000), //27.03.2025 12:00:00
				DateTime::from_millis(1743163200000), //28.03.2025 12:00:00
			],
			None,
			Some(DateTime::from_seconds(
				max_date.unix_timestamp().unsigned_abs(),
			)),
		);

		assert_eq!(
			excluded_dates.unwrap(),
			vec![
				DateTime::from_millis(1742990400000), //26.03.2025 12:00:00
				DateTime::from_millis(1743249600000)  //29.03.2025 12:00:00
			]
		);
	}

	#[test]
	fn test_create_event_instances_with_by_rule() {
		let event_facade = EventFacade::new();

		let event_start = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 22).unwrap(),
			Time::from_hms(12, 0, 0).unwrap(),
		)
		.assume_utc();

		let event_end = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 22).unwrap(),
			Time::from_hms(12, 30, 0).unwrap(),
		)
		.assume_utc();

		let max_date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::March, 30).unwrap(),
			Time::from_hms(00, 00, 0).unwrap(),
		)
		.assume_utc();

		let by_rules = event_facade.create_event_instances(
			DateTime::from_seconds(event_start.unix_timestamp() as u64),
			DateTime::from_seconds(event_end.unix_timestamp() as u64),
			EventRepeatRule {
				frequency: RepeatPeriod::Daily,
				by_rules: vec![
					ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "MO".to_string(),
					},
					ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "WE".to_string(),
					},
				],
			},
			1,
			EndType::Never,
			None,
			vec![],
			None,
			Some(DateTime::from_seconds(
				max_date.unix_timestamp().unsigned_abs(),
			)),
		);

		assert_eq!(
			by_rules.unwrap(),
			vec![
				DateTime::from_millis(1742817600000), //24.03.2025 12:00:00
				DateTime::from_millis(1742990400000), //26.03.2025 12:00:00
			]
		);
	}

	#[test]
	fn test_add_months_to_date() {
		let event_facade = EventFacade::new();
		let jan_31 = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 31).unwrap(),
			Time::from_hms(0, 0, 0).unwrap(),
		)
		.assume_utc();

		let feb_29 = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::February, 29).unwrap(),
			Time::from_hms(0, 0, 0).unwrap(),
		)
		.assume_utc();

		let dec_31 = PrimitiveDateTime::new(
			Date::from_calendar_date(2024, Month::December, 31).unwrap(),
			Time::from_hms(0, 0, 0).unwrap(),
		)
		.assume_utc();

		assert_eq!(
			event_facade.add_months_to_date(&jan_31, 1).date(),
			Date::from_calendar_date(2025, Month::February, 28).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&jan_31, 2).date(),
			Date::from_calendar_date(2025, Month::March, 31).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&jan_31, 3).date(),
			Date::from_calendar_date(2025, Month::April, 30).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&dec_31, 1).date(),
			Date::from_calendar_date(2025, Month::January, 31).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&feb_29, 12).date(),
			Date::from_calendar_date(2025, Month::February, 28).unwrap()
		);
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
				&repeat_rule,
			),
			[]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
			[date.to_date_time()]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::February).unwrap().to_date_time(),
				&repeat_rule,
			),
			[date.replace_month(Month::February).unwrap().to_date_time()]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::June).unwrap().to_date_time(),
				&repeat_rule,
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
			[date.replace_day(14).unwrap().to_date_time()]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_day(13).unwrap().to_date_time(),
				&repeat_rule,
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
			[date.replace_day(10).unwrap().to_date_time(),]
		);
		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::January).unwrap().to_date_time(),
				&repeat_rule,
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
			[date.replace_day(10).unwrap().to_date_time(),]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(date_not_in_range.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
			[date.replace_day(13).unwrap().to_date_time()]
		);

		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::March).unwrap().to_date_time(),
				&repeat_rule,
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
			[date.replace_day(20).unwrap().to_date_time()]
		);

		assert_eq!(
			event_recurrence.generate_future_instances(
				date.replace_month(Month::March).unwrap().to_date_time(),
				&repeat_rule,
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
			event_recurrence.generate_future_instances(valid_date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
			event_recurrence.generate_future_instances(date.to_date_time(), &repeat_rule),
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
