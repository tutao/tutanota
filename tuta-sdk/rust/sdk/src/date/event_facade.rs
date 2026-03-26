use crate::date::calendar_facade::BIRTHDAY_CALENDAR_BASE_ID;
use crate::date::DateTime;
use crate::entities::generated::tutanota::{CalendarEvent, Contact};
use crate::util::generate_event_uid;
use crate::{ApiCallError, CustomId, GeneratedId, IdTupleCustom};
use base64::prelude::{BASE64_STANDARD, BASE64_URL_SAFE_NO_PAD};
use base64::Engine;
use regex::{Match, Regex};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::panic;
use time::util::weeks_in_year;
use time::{Date, Duration, Month, OffsetDateTime, PrimitiveDateTime, Time, UtcOffset, Weekday};
use time_tz::{timezones, Offset, TimeZone, Tz};

pub struct DateParts(pub Option<u32>, pub u8, pub u8);

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BirthdayEvent {
	pub(crate) calendar_event: CalendarEvent,
	contact: Contact,
}

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

pub trait MonthNumber {
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
	fn add_month(&self) -> Option<Date>;
}

impl DateExpansion for Date {
	fn add_month(&self) -> Option<Date> {
		self.checked_add(Duration::days(i64::from(self.month().length(self.year()))))
	}
}

#[derive(uniffi::Object)]
pub struct EventFacade;

/// Wrapper around EventFacade implementation that exposes methods to uniffi.
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
		progenitor_date: DateTime,
	) -> Result<Vec<DateTime>, ApiCallError> {
		self.apply_by_rules(date, repeat_rule, progenitor_date)
	}
}

impl EventFacade {
	/// Calculates all occurrences of a recurring calendar event within the given constraints.
	///
	/// This is the core scheduling function. It advances through the recurrence set
	/// starting from the progenitor (the original event start time), applying BYxxx rules
	/// at each iteration to expand a single date into potentially multiple occurrences,
	/// then filters them according to the end condition, excluded dates, and max_date boundary.
	///
	/// # Arguments
	/// * `event_start_time` - The progenitor start time of the event
	/// * `event_end_time` - The end time of the event
	/// * `repeat_rule` - The recurrence rule containing frequency and BYxxx expansion rules
	/// * `repeat_interval` - How many frequency units to advance per iteration (e.g. every 2 weeks)
	/// * `end_type` - Whether the recurrence ends never, after a count, or at a specific date
	/// * `end_value` - The count or until-date depending on `end_type`
	/// * `excluded_dates` - Specific occurrence dates to exclude from the result (EXDATEs in iCal)
	/// * `max_date` - Upper boundary; occurrences on or after this date are not included
	/// * `time_zone` - IANA timezone string used for DST-aware date advancement
	pub fn calculate_event_occurrences(
		&self,
		event_start_time: DateTime,
		event_end_time: DateTime,
		repeat_rule: EventRepeatRule,
		repeat_interval: i64,
		end_type: EndType,
		end_value: Option<u64>,
		excluded_dates: Vec<DateTime>,
		max_date: DateTime,
		time_zone: String,
	) -> Result<Vec<DateTime>, ApiCallError> {
		let is_all_day_event =
			EventFacade::is_all_day_event_by_times(event_start_time, event_end_time);
		let set_pos_rules: Vec<&ByRule> = repeat_rule
			.by_rules
			.iter()
			.filter(|rule| rule.by_rule == ByRuleType::BySetPos)
			.collect();

		let tz = match timezones::get_by_name(&time_zone) {
			Some(tz) => tz,
			_ => {
				log::error!("Failed to find timezone for string {}", time_zone);
				timezones::db::UTC
			},
		};

		let end_date = if end_type == EndType::UntilDate {
			if is_all_day_event {
				Some(EventFacade::get_all_day_time(&DateTime::from_millis(
					end_value.unwrap(),
				))?)
			} else {
				Some(DateTime::from_millis(end_value.unwrap()))
			}
		} else {
			None
		};

		let transformed_excluded_dates: Vec<DateTime> = if is_all_day_event {
			excluded_dates
				.iter()
				.filter_map(|date| EventFacade::get_all_day_time(date).ok())
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

		let mut occurrences: u64 = 0;
		let mut generated_events: Vec<DateTime> = Vec::new();

		let initial_start_time = event_start_time;

		// iteration=0 means we are at the progenitor itself, then 1, 2, 3...
		let mut iteration: i64 = 0;
		let mut current_occurrence_date = initial_start_time;

		while end_type != EndType::Count || occurrences < end_value.unwrap() {
			let occurrences_for_date =
				self.apply_by_rules(current_occurrence_date, &repeat_rule, event_start_time)?;

			let mut has_invalid_set_pos = false;
			let parsed_set_pos: Vec<i64> = set_pos_rules
				.iter()
				.map(|rule| {
					let Ok(interval) = rule.interval.parse::<i64>() else {
						has_invalid_set_pos = true;
						return 0;
					};
					if interval < 0 {
						(occurrences_for_date.len() as i64) - interval.abs()
					} else {
						interval - 1
					}
				})
				.collect();

			if (end_date.is_some()
				&& current_occurrence_date.as_millis() >= end_date.unwrap().as_millis())
				|| has_invalid_set_pos
			{
				break;
			}

			for (index, occurrence) in occurrences_for_date.iter().enumerate() {
				if (end_type == EndType::Count && occurrences >= end_value.unwrap())
					|| (end_type == EndType::UntilDate
						&& occurrence.as_millis() >= end_value.unwrap())
				{
					break;
				}

				if !parsed_set_pos.is_empty() && !parsed_set_pos.contains(&(index as i64)) {
					continue;
				}

				if !transformed_excluded_dates.is_empty()
					&& transformed_excluded_dates.contains(occurrence)
				{
					continue;
				}

				if occurrence.as_seconds() < event_start_time.as_seconds() {
					// Occurrence is before the progenitor, skip
					continue;
				}

				// Skip re-adding the progenitor if apply_by_rules returns it on iteration 0
				// and it was already added (matches the TS: skip if iteration==1 and same as eventStartTime)
				if iteration == 0 && generated_events.contains(occurrence) {
					continue;
				}

				if occurrence.as_seconds() < max_date.as_seconds() {
					generated_events.push(*occurrence);
				}

				occurrences += 1;
			}

			if current_occurrence_date >= max_date {
				break;
			}

			// Advance to next occurrence date at the bottom, absolutely from initial_start_time
			iteration += 1;
			current_occurrence_date = self.calculate_next_occurrence_date(
				&initial_start_time,
				&is_all_day_event,
				repeat_interval,
				&repeat_rule.frequency,
				iteration,
				tz,
			)?;
		}

		Ok(generated_events)
	}

	fn date_time_offset_in_seconds(
		&self,
		progenitor_start_time: &OffsetDateTime,
		next_occurrence_start_time: &OffsetDateTime,
		time_zone: &Tz,
	) -> i32 {
		let progenitor_offset: i32 = time_zone
			.get_offset_utc(progenitor_start_time)
			.to_utc()
			.whole_seconds();

		let instance_offset: i32 = time_zone
			.get_offset_utc(next_occurrence_start_time)
			.to_utc()
			.whole_seconds();

		instance_offset - progenitor_offset
	}

	/// Computes the next occurrence date by advancing absolutely from the initial start time
	/// by `repeat_interval * iteration` frequency units, then adjusting for DST changes
	/// relative to the progenitor offset.
	///
	/// Advancing absolutely from the initial start time (rather than incrementally from the
	/// previous occurrence) prevents drift accumulation over long recurrence series.
	///
	/// # Arguments
	/// * `initial_start_time` - The progenitor date to advance from (not the previous occurrence)
	/// * `repeat_interval` - The base interval between occurrences
	/// * `repeat_rule` - Used to determine the frequency unit (daily, weekly, monthly, annually)
	/// * `iteration` - The current iteration index, multiplied by `repeat_interval` for the total advance
	/// * `progenitor_offset` - The UTC offset in seconds at the progenitor, used for DST correction
	/// * `time_zone` - IANA timezone string used to determine the UTC offset at the new date
	fn calculate_next_occurrence_date(
		&self,
		initial_start_time: &DateTime,
		is_all_day_event: &bool,
		repeat_interval: i64,
		frequency: &RepeatPeriod,
		iteration: i64,
		time_zone: &Tz,
	) -> Result<DateTime, ApiCallError> {
		let start_time =
			OffsetDateTime::from_unix_timestamp(initial_start_time.as_seconds() as i64).unwrap();

		let Some(next_occurrence_dt_start_time) = self.increment_date_by_repeat_period(
			&start_time,
			repeat_interval * iteration,
			frequency,
		) else {
			return Err(ApiCallError::InternalSdkError {
				error_message: format!(
					"Failed to increment date by repeat period E:{} I:{}",
					initial_start_time.as_seconds(),
					repeat_interval * iteration
				),
			});
		};

		if *(is_all_day_event) {
			Ok(DateTime::from_seconds(
				next_occurrence_dt_start_time
					.unix_timestamp()
					.unsigned_abs(),
			))
		} else {
			// Calculate the DST offset difference between the progenitor and this instance
			let dst_offset_seconds: i32 = self.date_time_offset_in_seconds(
				&start_time,
				&next_occurrence_dt_start_time,
				time_zone,
			);

			// Apply the DST offset to the instance
			// Zones with DST applied will see their start time shift backwards on the UTC+0 timeline.
			let dst_shifted_next_occurrence_start = next_occurrence_dt_start_time
				.replace_offset(UtcOffset::from_whole_seconds(dst_offset_seconds).unwrap());

			Ok(DateTime::from_seconds(
				dst_shifted_next_occurrence_start
					.unix_timestamp()
					.unsigned_abs(),
			))
		}
	}

	/// Computes the next occurrence date by advancing absolutely from the initial start time
	/// by `repeat_interval * iteration` frequency units, then adjusting for DST changes
	/// relative to the progenitor offset.
	///
	/// Advancing absolutely from the initial start time (rather than incrementally from the
	/// previous occurrence) prevents drift accumulation over long recurrence series.
	///
	/// # Arguments
	/// * `date` - The date to apply the defined byrules
	/// * `repeat_rule` - Repeat rule to extract all the byrules and relevant data
	/// * `progenitor_date` - Original event start
	fn apply_by_rules(
		&self,
		date: DateTime,
		repeat_rule: &EventRepeatRule,
		progenitor_date: DateTime,
	) -> Result<Vec<DateTime>, ApiCallError> {
		let Ok(parsed_date) = OffsetDateTime::from_unix_timestamp(date.as_seconds() as i64) else {
			log::warn!("Possible invalid date ({date:?}) provided to generate_future_instance, returning empty vec.");
			return Ok(Vec::new());
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
			.filter_map(|&x| self.filter_result(x.interval.parse::<u8>()))
			.collect();
		let valid_month_days: Vec<i8> = by_month_day_rules
			.iter()
			.clone()
			.filter_map(|&x| self.filter_result(x.interval.parse::<i8>()))
			.collect();
		let valid_year_days: Vec<i16> = by_year_day_rules
			.iter()
			.clone()
			.filter_map(|&x| self.filter_result(x.interval.parse::<i16>()))
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
			!by_month_rules.is_empty(),
		)?;

		let date_timestamp = progenitor_date.as_seconds();
		Ok(self
			.finish_rules(
				day_applied_events,
				valid_months.clone(),
				Some(date_timestamp),
			)
			.iter()
			.map(|date| DateTime::from_seconds(date.assume_utc().unix_timestamp().unsigned_abs()))
			.collect())
	}
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
			'date_loop: for date in &dates {
				let parsed_week: i8 = match rule.interval.parse::<i8>() {
					Ok(week) => week,
					_ => continue,
				};

				let mut new_date = *date;

				let total_weeks = weeks_in_year(date.year());

				if parsed_week == 0 || parsed_week > total_weeks as i8 {
					log::info!(
						"Parsed week number ({}) invalid based on total weeks ({}) for year ({})",
						parsed_week,
						total_weeks,
						date.year()
					);
					continue;
				}

				let week_number = if parsed_week < 0 {
					let week_diff = total_weeks - parsed_week.unsigned_abs() + 1;
					if week_diff > total_weeks || week_diff == 0 {
						log::info!(
							"Calculated week diff ({}) for parsed week number ({}) invalid based on total weeks ({}) for year ({})",
							week_diff,
							parsed_week,
							total_weeks,
							date.year()
						);
						continue;
					}

					week_diff
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
					let Some(final_date) = new_date.checked_add(Duration::days(i)) else {
						log::error!(
							"{}",
							format!(
								"Failed to add {} days to date {}",
								i,
								new_date.assume_utc().unix_timestamp()
							)
						);
						continue 'date_loop;
					};

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
					new_date = match date
						.replace_month(Month::December)
						.unwrap()
						.replace_day(31)
						.unwrap()
						.checked_sub(Duration::days((parsed_day.unsigned_abs() - 1) as i64))
					{
						Some(new_date) => new_date,
						None => {
							log::error!(
								"{}",
								format!(
									"Failed to sub {} days to end of {}",
									parsed_day.unsigned_abs() - 1,
									date.year()
								)
							);
							continue;
						},
					};
				} else {
					new_date = match date
						.replace_month(Month::January)
						.unwrap()
						.replace_day(1)
						.unwrap()
						.checked_add(Duration::days(parsed_day - 1))
					{
						Some(new_date) => new_date,
						None => {
							log::error!(
								"{}",
								format!(
									"Failed to add {} days to start of {}",
									parsed_day.unsigned_abs() - 1,
									date.year()
								)
							);
							continue;
						},
					}
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
		has_by_month: bool,
	) -> Result<Vec<PrimitiveDateTime>, ApiCallError> {
		if rules.is_empty() {
			return Ok(dates.clone());
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
					)?
				} else if frequency == &RepeatPeriod::Monthly && target_week_day.is_some() {
					self.expand_by_day_rule_for_monthly_events(
						&valid_months,
						&valid_month_days,
						&mut new_dates,
						date,
						target_week_day,
						leading_value,
					)?;
				} else if frequency == &RepeatPeriod::Annually {
					self.expand_by_day_rule_for_annually_events(
						week_start,
						has_week_no,
						&mut new_dates,
						date,
						target_week_day,
						leading_value,
						has_by_month,
						rule.by_rule == ByRuleType::ByWeekNo,
					)?
				}
			}
		}

		if frequency == &RepeatPeriod::Annually {
			return Ok(new_dates
				.iter()
				.filter(|date| self.is_valid_day_in_year(**date, valid_year_days.clone()))
				.copied()
				.collect());
		}

		Ok(new_dates)
	}

	fn expand_by_day_rule_for_annually_events(
		&self,
		week_start: Weekday,
		has_week_no: bool,
		new_dates: &mut Vec<PrimitiveDateTime>,
		date: &PrimitiveDateTime,
		target_week_day: Option<Match>,
		leading_value: Option<Match>,
		has_by_month: bool,
		is_iterating_on_week_number_by_rule: bool,
	) -> Result<(), ApiCallError> {
		let offset_at_by_rule = leading_value
			.map_or(Ok(0), |m| m.as_str().parse::<i64>())
			.unwrap_or_default();

		if !is_iterating_on_week_number_by_rule && has_week_no && offset_at_by_rule != 0 {
			return Err(ApiCallError::internal(
				"Invalid repeat rule, can't use BYWEEKNO with Offset on BYDAY".into(),
			));
		}

		if offset_at_by_rule != 0 && !has_week_no {
			let mut new_date: PrimitiveDateTime;

			// If there's no target week day, we just set the day of the year.
			if target_week_day.is_none() {
				if offset_at_by_rule > 0 {
					new_date = match date
						.replace_day(1)
						.unwrap()
						.replace_month(Month::January)
						.unwrap()
						.checked_add(Duration::days(offset_at_by_rule - 1))
					{
						Some(date) => date,
						None => {
							return Err(ApiCallError::internal(format!(
								"Failed to add {} days to start of {}",
								offset_at_by_rule - 1,
								date.year()
							)))
						},
					}
				} else {
					new_date = match date
						.replace_month(Month::December)
						.unwrap()
						.replace_day(31)
						.unwrap()
						.checked_sub(Duration::days(offset_at_by_rule.abs() - 1))
					{
						Some(date) => date,
						None => {
							return Err(ApiCallError::internal(format!(
								"Failed to sub {} days to end of {}",
								offset_at_by_rule - 1,
								date.year()
							)))
						},
					}
				}
			} else {
				let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());
				if has_by_month {
					let absolute_week = if offset_at_by_rule > 0 {
						offset_at_by_rule
					} else {
						let weeks_in_month: i64 =
							date.date().month().length(date.year()).div_ceil(7) as i64;
						weeks_in_month - offset_at_by_rule.abs() + 1
					};

					new_date = date.replace_day(1).unwrap();
					let mut week_count = if new_date.weekday() == parsed_weekday {
						1
					} else {
						0
					};
					while week_count < absolute_week {
						new_date = match new_date.checked_add(Duration::days(1)) {
							Some(new_date) => new_date,
							None => {
								return Err(ApiCallError::internal(format!(
									"Failed to add {} days to {}",
									1,
									new_date.assume_utc().unix_timestamp()
								)))
							},
						};

						if new_date.weekday() == parsed_weekday {
							week_count += 1
						}
					}
				} else {
					// There's a target week day  without byMonth so the occurrenceNumber indicates the week of the year that the event will happen
					if offset_at_by_rule > 0 {
						new_date = match date
							.replace_day(1)
							.unwrap()
							.replace_month(Month::January)
							.unwrap()
							.checked_add(Duration::weeks(offset_at_by_rule - 1))
						{
							Some(date) => date,
							None => {
								return Err(ApiCallError::internal(format!(
									"Failed to add {} weeks to start of {}",
									offset_at_by_rule - 1,
									date.year()
								)))
							},
						};

						while new_date.weekday() != parsed_weekday {
							new_date = match new_date.checked_add(Duration::days(1)) {
								Some(new_date) => new_date,
								None => {
									return Err(ApiCallError::internal(format!(
										"Failed to add {} days to {}",
										1,
										new_date.assume_utc().unix_timestamp()
									)))
								},
							};
						}
					} else {
						new_date = match date
							.replace_month(Month::December)
							.unwrap()
							.replace_day(31)
							.unwrap()
							.checked_sub(Duration::weeks(offset_at_by_rule.abs() - 1))
						{
							Some(date) => date,
							None => {
								return Err(ApiCallError::internal(format!(
									"Failed to sub {} weeks to end of {}",
									offset_at_by_rule.abs() - 1,
									date.year()
								)))
							},
						};

						while new_date.weekday() != parsed_weekday {
							new_date = match new_date.checked_sub(Duration::days(1)) {
								Some(new_date) => new_date,
								None => {
									return Err(ApiCallError::internal(format!(
										"Failed to sub {} days to {}",
										1,
										new_date.assume_utc().unix_timestamp()
									)))
								},
							};
						}
					}
				}
			}

			Self::safe_expand_dates(new_dates, new_date)
		} else if has_week_no {
			// There's no week number or occurrenceNumber, so it will happen on all
			// weekdays that are the same as targetWeekDay

			if target_week_day.is_none() {
				return Ok(());
			}

			let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());
			let new_date = date.replace_date(
				Date::from_iso_week_date(date.year(), date.iso_week(), parsed_weekday).unwrap(),
			);

			let interval_start = date.replace_date(
				Date::from_iso_week_date(date.year(), date.iso_week(), week_start).unwrap(),
			);

			let Some(week_ahead) = interval_start.checked_add(Duration::days(7)) else {
				return Err(ApiCallError::internal(format!(
					"Failed to add {} days to {}",
					7,
					interval_start.assume_utc().unix_timestamp()
				)));
			};

			if new_date.assume_utc().unix_timestamp() > week_ahead.assume_utc().unix_timestamp()
				|| new_date.assume_utc().unix_timestamp() < date.assume_utc().unix_timestamp()
			{
				return Ok(());
			} else if new_date.assume_utc().unix_timestamp()
				< interval_start.assume_utc().unix_timestamp()
			{
				return match interval_start.checked_add(Duration::days(7)) {
					Some(new_date) => Self::safe_expand_dates(new_dates, new_date),
					None => Err(ApiCallError::internal(format!(
						"Failed to add {} days to {}",
						7,
						interval_start.assume_utc().unix_timestamp()
					))),
				};
			} else {
				return Self::safe_expand_dates(new_dates, new_date);
			}
		} else {
			if target_week_day.is_none() {
				return Ok(());
			}

			let day_one = date.replace_day(1).unwrap();
			let parsed_weekday = Weekday::from_short(target_week_day.unwrap().as_str());

			let Ok(stop_date) = Date::from_calendar_date(date.year() + 1, date.month(), date.day())
			else {
				return Ok(());
			};

			let stop_condition = date.replace_date(stop_date);
			let mut current_date = date.replace_date(
				Date::from_iso_week_date(date.year(), day_one.iso_week(), parsed_weekday).unwrap(),
			);

			if current_date.assume_utc().unix_timestamp() >= day_one.assume_utc().unix_timestamp() {
				new_dates.push(current_date);
			}

			current_date = match current_date.checked_add(Duration::days(7)) {
				Some(new_date) => new_date,
				None => {
					return Err(ApiCallError::internal(format!(
						"Failed to add {} days to {}",
						7,
						current_date.assume_utc().unix_timestamp()
					)))
				},
			};

			while current_date.assume_utc().unix_timestamp()
				< stop_condition.assume_utc().unix_timestamp()
			{
				Self::safe_expand_dates(new_dates, current_date)?;

				current_date = match current_date.checked_add(Duration::days(7)) {
					Some(new_date) => new_date,
					None => {
						return Err(ApiCallError::internal(format!(
							"Failed to add {} days to {}",
							7,
							current_date.assume_utc().unix_timestamp()
						)))
					},
				};
			}

			Ok(())
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
	) -> Result<(), ApiCallError> {
		let mut allowed_days: Vec<u8> = Vec::new();

		let week_change = leading_value
			.map_or(Ok(0), |m| m.as_str().parse::<i8>())
			.unwrap_or_default();

		let base_date = date.replace_day(1).unwrap();
		let Some(next_month) = base_date.date().add_month() else {
			return Err(ApiCallError::internal(format!(
				"Failed to add {} months to {}",
				1,
				base_date.assume_utc().unix_timestamp()
			)));
		};
		let stop_condition = PrimitiveDateTime::new(next_month, base_date.time());

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

				let mut weeks_to_change = week_change.unsigned_abs();
				while weeks_to_change > 0 {
					if new_date.weekday() == parsed_weekday {
						weeks_to_change -= 1;
					}

					if weeks_to_change == 0 {
						break;
					}

					new_date = match new_date.checked_sub(Duration::days(1)) {
						Some(new_date) => new_date,
						None => {
							return Err(ApiCallError::internal(format!(
								"Failed to sub {} days to {}",
								1,
								new_date.assume_utc().unix_timestamp()
							)))
						},
					};
				}

				if new_date.month() != base_date.month() {
					return Ok(());
				}
			} else {
				while new_date.weekday() != parsed_weekday {
					new_date = match new_date.checked_add(Duration::days(1)) {
						Some(new_date) => new_date,
						None => {
							return Err(ApiCallError::internal(format!(
								"Failed to add {} days to {}",
								1,
								new_date.assume_utc().unix_timestamp()
							)))
						},
					};
				}

				new_date = match new_date
					.checked_add(Duration::weeks((week_change.unsigned_abs() - 1) as i64))
				{
					Some(new_date) => new_date,
					None => {
						return Err(ApiCallError::internal(format!(
							"Failed to add {} weeks to {}",
							week_change.unsigned_abs() - 1,
							new_date.assume_utc().unix_timestamp()
						)))
					},
				}
			}

			if new_date.assume_utc().unix_timestamp() >= base_date.assume_utc().unix_timestamp()
				&& new_date.assume_utc().unix_timestamp()
					<= stop_condition.assume_utc().unix_timestamp()
				&& is_allowed_in_month_day(new_date.day())
			{
				Self::safe_expand_dates(new_dates, new_date)?
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
					Self::safe_expand_dates(new_dates, new_date)?
				}

				current_date = match new_date.checked_add(Duration::days(7)) {
					Some(new_date) => new_date,
					None => {
						return Err(ApiCallError::internal(format!(
							"Failed to add {} days to {}",
							7,
							new_date.assume_utc().unix_timestamp()
						)))
					},
				}
			}
		}

		Ok(())
	}

	fn expand_by_day_rules_for_weekly_events(
		&self,
		valid_months: &[u8],
		week_start: Weekday,
		new_dates: &mut Vec<PrimitiveDateTime>,
		date: &PrimitiveDateTime,
		target_week_day: Option<Match>,
	) -> Result<(), ApiCallError> {
		let parsed_target_week_day = Weekday::from_short(target_week_day.unwrap().as_str());

		// Go back to week start, so we don't miss any events
		let mut interval_start = *date;
		while interval_start.date().weekday() != week_start {
			interval_start = match interval_start.checked_sub(Duration::days(1)) {
				Some(some_date) => some_date,
				None => {
					return Err(ApiCallError::internal(format!(
						"Failed to sub {} days to {}",
						1,
						interval_start.assume_utc().unix_timestamp()
					)))
				},
			};
		}

		// Move forward until we reach the target day
		let mut new_date = interval_start;
		while new_date.weekday() != parsed_target_week_day {
			new_date = match new_date.checked_add(Duration::days(1)) {
				Some(new_date) => new_date,
				None => {
					return Err(ApiCallError::internal(format!(
						"Failed to add {} days to {}",
						1,
						new_date.assume_utc().unix_timestamp()
					)))
				},
			};
		}

		// Calculate next event to avoid creating events too ahead in the future
		let next_event = match date.checked_add(Duration::weeks(1)) {
			Some(new_date) => new_date.assume_utc().unix_timestamp(),
			None => {
				return Err(ApiCallError::internal(format!(
					"Failed to add {} weeks to {}",
					1,
					date.assume_utc().unix_timestamp()
				)))
			},
		};

		let next_week = match interval_start.checked_add(Duration::weeks(1)) {
			Some(next_week) => next_week.assume_utc().unix_timestamp(),
			_ => {
				return Err(ApiCallError::internal(format!(
					"Failed to add {} weeks to {}",
					1,
					interval_start.assume_utc().unix_timestamp()
				)))
			},
		};

		if new_date.assume_utc().unix_timestamp() >= next_week {
			// The event is actually next week, so discard
			return Ok(());
		}

		if (new_date.assume_utc().unix_timestamp() >= next_event)
			|| (week_start != Weekday::Monday // We have WKST
            && new_date.assume_utc().unix_timestamp()
            >= next_week)
		{
			// Or we created an event after the first event or within the next week
			return Ok(());
		}

		if valid_months.is_empty() || valid_months.contains(&new_date.month().to_number()) {
			Self::safe_expand_dates(new_dates, new_date)?
		}

		Ok(())
	}

	fn safe_expand_dates(
		new_dates: &mut Vec<PrimitiveDateTime>,
		new_date: PrimitiveDateTime,
	) -> Result<(), ApiCallError> {
		match new_dates.try_reserve(1) {
			Ok(_) => new_dates.push(new_date),
			Err(memory_reserve_error) => {
				return Err(ApiCallError::internal_with_err(
					memory_reserve_error,
					"Unable to expand occurrences vector",
				))
			},
		}
		Ok(())
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
		event_start_time: Option<u64>,
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
					let date_unix_timestamp = date.assume_utc().unix_timestamp().unsigned_abs();
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
		repeat_interval: i64,
		repeat_period: &RepeatPeriod,
	) -> Option<OffsetDateTime> {
		match repeat_period {
			RepeatPeriod::Daily => start_date.checked_add(Duration::days(repeat_interval)),
			RepeatPeriod::Weekly => start_date.checked_add(Duration::weeks(repeat_interval)),
			RepeatPeriod::Monthly => self.add_months_to_date(start_date, repeat_interval),
			RepeatPeriod::Annually => self.add_years_to_date(start_date, repeat_interval),
		}
	}

	fn add_years_to_date(&self, date: &OffsetDateTime, years: i64) -> Option<OffsetDateTime> {
		self.add_months_to_date(date, years * 12)
	}

	fn add_months_to_date(&self, date: &OffsetDateTime, months: i64) -> Option<OffsetDateTime> {
		if months == 0 {
			return Some(*date);
		}

		let mut new_date = *date;

		let mut total_months = months;
		while total_months > 0 {
			let temp_date = new_date.checked_add(Duration::weeks(1))?;

			if temp_date.month() != new_date.month() {
				total_months -= 1;
			}

			new_date = temp_date;
		}

		let target_day = if new_date.month().length(new_date.year()) < date.day() {
			new_date.month().length(new_date.year())
		} else {
			date.day()
		};

		match new_date.replace_day(target_day) {
			Ok(new_date) => Some(new_date),
			_ => None,
		}
	}

	pub fn is_all_day_event_by_times(event_start_time: DateTime, event_end_time: DateTime) -> bool {
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

	pub fn get_all_day_time(date: &DateTime) -> Result<DateTime, ApiCallError> {
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

	pub fn create_birthday_event(
		&self,
		contact: &Contact,
		birthday_parts: &DateParts,
		user_id: &GeneratedId,
	) -> Result<BirthdayEvent, ApiCallError> {
		let cloned_contact = contact.clone();
		let contact_id = cloned_contact._id.clone().unwrap();
		let encoded_contact_id =
			BASE64_STANDARD.encode(format!("{}/{}", contact_id.list_id, contact_id.element_id));

		let birthday_calendar_id = GeneratedId(format!(
			"{}#{}",
			user_id.as_str(),
			BIRTHDAY_CALENDAR_BASE_ID
		));

		let uid: String = generate_event_uid(&birthday_calendar_id, DateTime::from_millis(0));

		let event_title = contact.firstName.clone();

		let birthday_date = match Date::from_calendar_date(
			OffsetDateTime::now_local().unwrap().year(),
			Month::from_number(birthday_parts.1),
			birthday_parts.2,
		) {
			Ok(date) => date,
			Err(e) => return Err(ApiCallError::internal(format!("Invalid date: {e:?}"))),
		};

		let birthday_date_time =
			OffsetDateTime::new_utc(birthday_date, Time::from_hms(0, 0, 0).unwrap());
		let Some(end_date_time) = birthday_date_time.checked_add(Duration::days(1)) else {
			return Err(ApiCallError::internal(
				"Failed to calculate birthday event end".to_string(),
			));
		};

		// Set up start and end date base on UTC.
		// Also increments a copy of startDate by one day and set it as endDate
		let Ok(start_date) = EventFacade::get_all_day_time(&DateTime::from_seconds(
			birthday_date_time.unix_timestamp() as u64,
		)) else {
			return Err(ApiCallError::internal(
				"Failed to parse event StartTime".to_string(),
			));
		};

		let Ok(end_date) = EventFacade::get_all_day_time(&DateTime::from_seconds(
			end_date_time.unix_timestamp() as u64,
		)) else {
			return Err(ApiCallError::internal(
				"Failed to parse event EndTime".to_string(),
			));
		};

		let encoded_event_id = BASE64_URL_SAFE_NO_PAD.encode(format!(
			"{}{}/{}",
			start_date.as_millis(),
			contact_id.list_id,
			contact_id.element_id
		));

		let calendar_event = self.create_partial_calendar_event(
			encoded_contact_id,
			birthday_calendar_id,
			uid,
			event_title,
			start_date,
			end_date,
			encoded_event_id,
		);

		Ok(BirthdayEvent {
			calendar_event,
			contact: cloned_contact,
		})
	}

	fn create_partial_calendar_event(
		&self,
		encoded_contact_id: String,
		birthday_calendar_id: GeneratedId,
		uid: String,
		event_title: String,
		start_date: DateTime,
		end_date: DateTime,
		encoded_event_id: String,
	) -> CalendarEvent {
		CalendarEvent {
			sequence: 0,
			recurrenceId: None,
			hashedUid: None,
			summary: event_title,
			startTime: start_date,
			endTime: end_date,
			location: "".to_string(),
			description: "".to_string(),
			alarmInfos: vec![],
			organizer: None,
			attendees: vec![],
			invitedConfidentially: None,
			repeatRule: None,
			pendingInvitation: None,
			uid: Some(uid),
			_id: Some(IdTupleCustom {
				list_id: birthday_calendar_id.clone(),
				element_id: CustomId(format!("{}#{}", encoded_event_id, encoded_contact_id)),
			}),
			_permissions: GeneratedId::min_id(),
			_format: 0,
			_ownerGroup: Some(birthday_calendar_id),
			_ownerEncSessionKey: None,
			_ownerKeyVersion: None,
			_errors: HashMap::new(),
			sender: None,
		}
	}

	fn filter_result<T, U>(&self, result: Result<T, U>) -> Option<T> {
		match result {
			Ok(rt) => Some(rt),
			_ => None,
		}
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
mod event_facade_unit_tests {
	use super::*;
	use crate::util::test_utils::create_test_entity;
	use std::ops::Add;
	use time::{Date, Month, PrimitiveDateTime, Time};

	trait PrimitiveToDateTime {
		fn to_date_time(&self) -> DateTime;
	}
	impl PrimitiveToDateTime for PrimitiveDateTime {
		fn to_date_time(&self) -> DateTime {
			DateTime::from_millis(self.assume_utc().unix_timestamp().unsigned_abs() * 1000)
		}
	}

	mod calculate_next_occurrence_date_timed_event_tests {
		use super::*;

		mod normal_timed_events {
			use super::*;

			#[test]
			fn test_calculate_simple_daily_recurrence_no_dst() {
				let events_facade = EventFacade {};

				let progenitor_start_datetime: DateTime = PrimitiveDateTime::new(
					Date::from_calendar_date(2025, Month::January, 1).unwrap(),
					Time::from_hms(12, 0, 0).unwrap(),
				)
				.to_date_time(); // Jan 01, 2025 - 12:00:00

				let repeat_interval: i64 = 1;

				let next_occurrence = events_facade
					.calculate_next_occurrence_date(
						&progenitor_start_datetime,
						&false,
						repeat_interval,
						&RepeatPeriod::Daily,
						1,
						timezones::db::europe::BERLIN,
					)
					.unwrap(); // Jan 02, 2025 - 12:00:00

				let expected_date = DateTime::from_seconds(
					progenitor_start_datetime.as_seconds()
						+ Duration::days(1).whole_seconds().unsigned_abs(),
				);

				assert_eq!(next_occurrence, expected_date);
			}
			#[test]
			fn test_daily_recurrence_across_start_of_dst() {
				let events_facade = EventFacade {};
				let full_day = 24;
				let dst_change_at_gmt_0 = -1;

				let progenitor_start_datetime: DateTime = PrimitiveDateTime::new(
					// day before beginning of dst
					Date::from_calendar_date(2026, Month::March, 28).unwrap(),
					Time::from_hms(12, 0, 0).unwrap(),
				)
				.to_date_time(); // March 28, 2026 - 12:00:00

				let day_repeat_interval: i64 = 1;

				let next_occurrence = events_facade
					.calculate_next_occurrence_date(
						&progenitor_start_datetime,
						&false,
						day_repeat_interval,
						&RepeatPeriod::Daily,
						1,
						timezones::db::europe::BERLIN,
					)
					.unwrap(); // March 29, 2026 - 11:00:00

				let expected_date = DateTime::from_seconds(
					progenitor_start_datetime.as_seconds()
						+ Duration::hours(full_day + dst_change_at_gmt_0)
							.whole_seconds()
							.unsigned_abs(),
				);

				assert_eq!(next_occurrence, expected_date)
			}

			#[test]
			fn test_daily_recurrence_across_end_of_dst() {
				let events_facade = EventFacade {};
				let full_day = 24;
				let dst_change_at_gmt_0 = 1;

				let progenitor_start_datetime: DateTime = PrimitiveDateTime::new(
					// day before end of dst
					Date::from_calendar_date(2026, Month::October, 24).unwrap(),
					Time::from_hms(12, 0, 0).unwrap(),
				)
				.to_date_time(); // Oct 24, 2026 - 12:00:00
				let day_repeat_interval: i64 = 1;

				let next_occurrence = events_facade.calculate_next_occurrence_date(
					&progenitor_start_datetime,
					&false,
					day_repeat_interval,
					&RepeatPeriod::Daily,
					1,
					timezones::db::europe::BERLIN,
				); // Oct 25, 2026 - 13:00:00

				let expected_date = DateTime::from_seconds(
					progenitor_start_datetime.as_seconds()
						+ Duration::hours(full_day + dst_change_at_gmt_0)
							.whole_seconds()
							.unsigned_abs(),
				);
				assert_eq!(next_occurrence.unwrap(), expected_date)
			}
		}
		mod all_day_events {
			use super::*;

			#[test]
			fn test_calculate_all_day_daily_recurrence_no_dst() {
				let events_facade = EventFacade {};

				let progenitor_start_datetime: DateTime = PrimitiveDateTime::new(
					Date::from_calendar_date(2025, Month::January, 1).unwrap(),
					Time::from_hms(0, 0, 0).unwrap(),
				)
				.to_date_time(); // Jan 01, 2025 - 00:00:00

				let repeat_interval: i64 = 1;

				let next_occurrence = events_facade
					.calculate_next_occurrence_date(
						&progenitor_start_datetime,
						&true,
						repeat_interval,
						&RepeatPeriod::Daily,
						1,
						timezones::db::europe::BERLIN,
					)
					.unwrap(); // Jan 02, 2025 - 00:00:00

				let expected_date = DateTime::from_seconds(
					progenitor_start_datetime.as_seconds()
						+ Duration::days(1).whole_seconds().unsigned_abs(),
				);

				assert_eq!(next_occurrence, expected_date);
			}

			#[test]
			fn test_all_day_daily_recurrence_across_start_of_dst() {
				let events_facade = EventFacade {};
				let full_day = 24;
				let progenitor_start_datetime: DateTime = PrimitiveDateTime::new(
					// day before beginning of dst
					Date::from_calendar_date(2026, Month::March, 29).unwrap(),
					Time::from_hms(0, 0, 0).unwrap(),
				)
				.to_date_time(); // March 29, 2026 - 00:00:00

				let day_repeat_interval: i64 = 1;

				let next_occurrence = events_facade
					.calculate_next_occurrence_date(
						&progenitor_start_datetime,
						&true,
						day_repeat_interval,
						&RepeatPeriod::Daily,
						1,
						timezones::db::europe::BERLIN,
					)
					.unwrap(); // March 30, 2026 - 00:00:00

				let expected_date = DateTime::from_seconds(
					progenitor_start_datetime.as_seconds()
						+ Duration::hours(full_day).whole_seconds().unsigned_abs(),
				);

				assert_eq!(next_occurrence, expected_date)
			}

			#[test]
			fn test_all_day_daily_recurrence_across_end_of_dst() {
				let events_facade = EventFacade {};
				let full_day = 24;

				let progenitor_start_datetime: DateTime = PrimitiveDateTime::new(
					// day before beginning of dst
					Date::from_calendar_date(2026, Month::October, 25).unwrap(),
					Time::from_hms(0, 0, 0).unwrap(),
				)
				.to_date_time(); // October 25, 2026 - 00:00:00

				let day_repeat_interval: i64 = 1;

				let next_occurrence = events_facade
					.calculate_next_occurrence_date(
						&progenitor_start_datetime,
						&true,
						day_repeat_interval,
						&RepeatPeriod::Daily,
						1,
						timezones::db::europe::BERLIN,
					)
					.unwrap(); // October 26, 2026 - 00:00:00

				let expected_date = DateTime::from_seconds(
					progenitor_start_datetime.as_seconds()
						+ Duration::hours(full_day).whole_seconds().unsigned_abs(),
				);

				assert_eq!(next_occurrence, expected_date)
			}
		}
	}

	mod calculate_event_occurrences_tests {
		use super::*;
		use crate::date::event_facade::{
			ByRule, ByRuleType, EndType, EventRepeatRule, RepeatPeriod,
		};
		use crate::date::DateTime;
		use time::{Date, Month};

		#[test]
		fn test_generate_events_by_day_by_month_yearly() {
			let events_facade = EventFacade {};

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, Month::December, 30)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let events = events_facade.calculate_event_occurrences(
				DateTime::from_seconds(1725235200), // 2024-09-02T00:00:00.000Z
				DateTime::from_seconds(1725321600), // 2024-09-03T00:00:00.000Z
				EventRepeatRule {
					frequency: RepeatPeriod::Annually,
					by_rules: vec![
						ByRule {
							by_rule: ByRuleType::ByDay,
							interval: "1MO".to_string(),
						},
						ByRule {
							by_rule: ByRuleType::ByMonth,
							interval: "9".to_string(),
						},
					],
				},
				1,
				EndType::Count,
				Some(6),
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
			);

			assert_eq!(events.clone().unwrap().iter().len(), 2);
			assert_eq!(
				events.unwrap(),
				[
					DateTime::from_seconds(1725235200), // 2024-09-02T00:00:00.000Z
					DateTime::from_seconds(1756684800), // 2025-09-01T00:00:00.000Z
				]
			);
		}

		#[test]
		fn test_generate_events_by_month_on_last_friday() {
			let events_facade = EventFacade {};

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2026, Month::January, 1)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let event_start_time = DateTime::from_seconds(1743147215);
			let event_end_time = DateTime::from_seconds(1743161615);

			let events = events_facade.calculate_event_occurrences(
				event_start_time,
				event_end_time,
				EventRepeatRule {
					frequency: RepeatPeriod::Monthly,
					by_rules: vec![ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "-1FR".to_string(),
					}],
				},
				1,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
			);

			assert_eq!(events.clone().unwrap().iter().len(), 10);
			assert_eq!(
				events.unwrap(),
				[
					DateTime::from_seconds(1743147215), // Fri Mar 28 2025 07:33:35 GMT+0000
					DateTime::from_seconds(1745562815), // Fri Apr 25 2025 06:33:35 GMT+0000
					DateTime::from_seconds(1748586815), // Fri May 30 2025 06:33:35 GMT+0000
					DateTime::from_seconds(1751006015), // Fri Jun 27 2025 06:33:35 GMT+0000
					DateTime::from_seconds(1753425215), // Fri Jul 25 2025 06:33:35 GMT+0000
					DateTime::from_seconds(1756449215), // Fri Aug 29 2025 06:33:35 GMT+0000
					DateTime::from_seconds(1758868415), // Fri Sep 26 2025 06:33:35 GMT+0000
					DateTime::from_seconds(1761896015), // Fri Oct 31 2025 07:33:35 GMT+0000
					DateTime::from_seconds(1764315215), // Fri Nov 28 2025 07:33:35 GMT+0000
					DateTime::from_seconds(1766734415), // Fri Dec 26 2025 07:33:35 GMT+0000
				]
			);
		}

		#[test]
		fn test_generate_event_with_by_rule_result_before_incremented_event_instance() {
			let events_facade = EventFacade {};

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, time::Month::May, 16)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let events = events_facade.calculate_event_occurrences(
				DateTime::from_seconds(1745485200), // 2025-04-24T09:00:00.000Z
				DateTime::from_seconds(1745501400), // 2025-04-24T13:30:00.000Z
				EventRepeatRule {
					frequency: RepeatPeriod::Monthly,
					by_rules: vec![ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "3TH".to_string(),
					}],
				},
				1,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
			);

			assert_eq!(events.unwrap().iter().len(), 1);
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

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, time::Month::March, 30)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let repeat_rule = EventRepeatRule {
				frequency: RepeatPeriod::Daily,
				by_rules: vec![],
			};

			let events = event_facade.calculate_event_occurrences(
				DateTime::from_seconds(event_start.unix_timestamp() as u64),
				DateTime::from_seconds(event_end.unix_timestamp() as u64),
				repeat_rule,
				1,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
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
		fn test_generate_instances_with_by_rule() {
			let event_facade = EventFacade::new();

			let event_start = PrimitiveDateTime::new(
				Date::from_calendar_date(2025, Month::April, 12).unwrap(),
				Time::from_hms(15, 30, 0).unwrap(),
			)
			.assume_utc();

			let event_end = PrimitiveDateTime::new(
				Date::from_calendar_date(2025, Month::April, 12).unwrap(),
				Time::from_hms(16, 0, 0).unwrap(),
			)
			.assume_utc();

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2027, time::Month::May, 1)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let repeat_rule = EventRepeatRule {
				frequency: RepeatPeriod::Monthly,
				by_rules: vec![ByRule {
					interval: "2SA".to_string(),
					by_rule: ByRuleType::ByDay,
				}],
			};

			let events = event_facade.calculate_event_occurrences(
				DateTime::from_seconds(event_start.unix_timestamp() as u64),
				DateTime::from_seconds(event_end.unix_timestamp() as u64),
				repeat_rule,
				3,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
			);

			assert_eq!(
				events.unwrap(),
				vec![
					DateTime::from_seconds(1744471800), //12.04.2025 15:30:00
					DateTime::from_seconds(1752334200), //12.07.2025 15:30:00
					DateTime::from_seconds(1760196600), //11.10.2025 15:30:00
					DateTime::from_seconds(1768062600), //10.01.2026 15:30:00
					DateTime::from_seconds(1775921400), //11.04.2026 15:30:00
					DateTime::from_seconds(1783783800), //11.07.2026 15:30:00
					DateTime::from_seconds(1791646200), //10.10.2026 15:30:00
					DateTime::from_seconds(1799512200), //09.01.2027 15:30:00
					DateTime::from_seconds(1807371000), //10.04.2027 15:30:00
				]
			);
		}

		#[test]
		fn test_generate_instances_with_by_rule_one_month() {
			let event_facade = EventFacade::new();

			let event_start = PrimitiveDateTime::new(
				Date::from_calendar_date(2025, Month::April, 24).unwrap(),
				Time::from_hms(15, 30, 0).unwrap(),
			)
			.assume_utc();

			let event_end = PrimitiveDateTime::new(
				Date::from_calendar_date(2025, Month::April, 12).unwrap(),
				Time::from_hms(16, 0, 0).unwrap(),
			)
			.assume_utc();

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, time::Month::July, 1)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let repeat_rule = EventRepeatRule {
				frequency: RepeatPeriod::Monthly,
				by_rules: vec![ByRule {
					interval: "3TH".to_string(),
					by_rule: ByRuleType::ByDay,
				}],
			};

			let events = event_facade.calculate_event_occurrences(
				DateTime::from_seconds(event_start.unix_timestamp() as u64),
				DateTime::from_seconds(event_end.unix_timestamp() as u64),
				repeat_rule,
				1,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
			);

			assert_eq!(
				events.unwrap(),
				vec![
					DateTime::from_seconds(1747323000), //15.05.2025 15:30:00
					DateTime::from_seconds(1750347000), //19.06.2025 15:30:00
				]
			);
		}

		#[test]
		fn test_generate_instances_with_dst_change() {
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

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, time::Month::April, 1)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let repeat_rule = EventRepeatRule {
				frequency: RepeatPeriod::Daily,
				by_rules: vec![],
			};

			let events = event_facade.calculate_event_occurrences(
				DateTime::from_seconds(event_start.unix_timestamp() as u64),
				DateTime::from_seconds(event_end.unix_timestamp() as u64),
				repeat_rule,
				1,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
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
					DateTime::from_millis(1743249600000), //29.03.2025 12:00:00
					DateTime::from_millis(1743332400000), //30.03.2025 11:00:00
					DateTime::from_millis(1743418800000)  //31.03.2025 11:00:00
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

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, Month::March, 27)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let weekly_events = event_facade.calculate_event_occurrences(
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
				max_date,
				"Europe/Berlin".to_string(),
			);

			// 27 of march is matching one occurance but max-date is not inclusive.
			assert_eq!(
				weekly_events.unwrap(),
				vec![
					DateTime::from_millis(1741867200000), //13.03.2025 12:00:00
					DateTime::from_millis(1742472000000), //20.03.2025 12:00:00
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

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, Month::March, 30)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let excluded_dates = event_facade.calculate_event_occurrences(
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
				max_date,
				"Europe/Berlin".to_string(),
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

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, Month::March, 30)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let by_rules = event_facade.calculate_event_occurrences(
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
				max_date,
				"Europe/Berlin".to_string(),
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
		fn test_generate_events_biweekly() {
			let events_facade = EventFacade {};

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2025, Month::December, 30)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
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
					ByRule {
						by_rule: ByRuleType::ByDay,
						interval: "WE".to_string(),
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

			let events = events_facade.calculate_event_occurrences(
				DateTime::from_seconds(1756893600),
				DateTime::from_seconds(1756895400),
				repeat_rule,
				2,
				EndType::Never,
				None,
				vec![],
				max_date,
				"Europe/Berlin".to_string(),
			);

			assert!(events.is_ok())
		}

		#[test]
		fn test_generate_instances_for_old_event_reaching_far_future() {
			let event_facade = EventFacade::new();

			let event_start = DateTime::from_seconds(
				time::Date::from_calendar_date(2025, time::Month::January, 2)
					.unwrap()
					.with_time(Time::from_hms(18, 0, 0).unwrap())
					.assume_utc()
					.unix_timestamp() as u64,
			);
			let event_end = DateTime::from_seconds(
				time::Date::from_calendar_date(2025, time::Month::January, 2)
					.unwrap()
					.with_time(Time::from_hms(18, 30, 0).unwrap())
					.assume_utc()
					.unix_timestamp() as u64,
			);
			let max_date = DateTime::from_seconds(
				time::Date::from_calendar_date(2026, time::Month::March, 10)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let events = event_facade
				.calculate_event_occurrences(
					event_start,
					event_end,
					EventRepeatRule {
						frequency: RepeatPeriod::Daily,
						by_rules: vec![],
					},
					1,
					EndType::Never,
					None,
					vec![],
					max_date,
					"UTC".to_string(),
				)
				.unwrap();

			// Jan 2 2025 to Mar 10 2026 is 432 days, so we expect 432 instances
			assert_eq!(events.len(), 432);
		}

		#[test]
		fn test_generate_all_day_event_instances() {
			let event_facade = EventFacade::new();

			let event_start = Date::from_calendar_date(2026, Month::July, 01)
				.unwrap()
				.midnight()
				.assume_utc();

			let event_end = Date::from_calendar_date(2026, Month::July, 02)
				.unwrap()
				.midnight()
				.assume_utc();

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2026, Month::July, 31)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let repeat_rule = EventRepeatRule {
				frequency: RepeatPeriod::Daily,
				by_rules: vec![],
			};

			let events = event_facade
				.calculate_event_occurrences(
					DateTime::from_seconds(event_start.unix_timestamp() as u64),
					DateTime::from_seconds(event_end.unix_timestamp() as u64),
					repeat_rule,
					1,
					EndType::Never,
					None,
					vec![],
					max_date,
					"Europe/Berlin".to_string(),
				)
				.unwrap();

			assert_eq!(events.iter().count(), 30);
			assert!(events.iter().enumerate().all(|(index, event_start_time)| {
				let expected_date =
					Date::from_calendar_date(2026, Month::July, 01 * (index + 1) as u8)
						.unwrap()
						.midnight()
						.assume_utc()
						.unix_timestamp();
				return event_start_time.as_seconds() == expected_date as u64;
			}));
		}

		#[test]
		fn test_generate_recurring_all_day_event_across_dst() {
			let event_facade = EventFacade::new();

			let event_start = Date::from_calendar_date(2026, Month::March, 01)
				.unwrap()
				.midnight()
				.assume_utc();

			let event_end = Date::from_calendar_date(2026, Month::March, 02)
				.unwrap()
				.midnight()
				.assume_utc();

			let max_date = DateTime::from_seconds(
				Date::from_calendar_date(2026, Month::March, 31)
					.unwrap()
					.midnight()
					.assume_utc()
					.unix_timestamp() as u64,
			);

			let repeat_rule = EventRepeatRule {
				frequency: RepeatPeriod::Daily,
				by_rules: vec![],
			};

			let events = event_facade
				.calculate_event_occurrences(
					DateTime::from_seconds(event_start.unix_timestamp() as u64),
					DateTime::from_seconds(event_end.unix_timestamp() as u64),
					repeat_rule,
					1,
					EndType::Never,
					None,
					vec![],
					max_date,
					"Europe/Berlin".to_string(),
				)
				.unwrap();

			// assert_eq!(events.iter().count(), 30);
			assert!(events.iter().enumerate().all(|(index, event_start_time)| {
				let expected_date =
					Date::from_calendar_date(2026, Month::March, 01 * (index + 1) as u8)
						.unwrap()
						.midnight()
						.assume_utc()
						.unix_timestamp();
				return event_start_time.as_seconds() == expected_date as u64;
			}));
		}
	}

	#[test]
	fn test_generate_birthday() {
		let event_facade = EventFacade::new();
		let birthday_midnight = OffsetDateTime::now_utc()
			.replace_month(Month::May)
			.unwrap()
			.replace_day(12)
			.unwrap()
			.replace_time(Time::from_hms(0, 0, 0).unwrap());

		let next_day_midnight = OffsetDateTime::now_utc()
			.replace_month(Month::May)
			.unwrap()
			.replace_day(12)
			.unwrap()
			.replace_time(Time::from_hms(0, 0, 0).unwrap())
			.add(Duration::days(1));

		let event = event_facade
			.create_birthday_event(
				&Contact {
					firstName: "Robert".to_string(),
					birthdayIso: Some("--05-12".to_string()),
					..create_test_entity()
				},
				&DateParts(None, 05, 12),
				&GeneratedId::test_random(),
			)
			.unwrap();

		assert_eq!(
			event.calendar_event.startTime.as_seconds(),
			birthday_midnight.unix_timestamp().unsigned_abs()
		);
		assert_eq!(
			event.calendar_event.endTime.as_seconds(),
			next_day_midnight.unix_timestamp().unsigned_abs()
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
			event_facade.add_months_to_date(&jan_31, 1).unwrap().date(),
			Date::from_calendar_date(2025, Month::February, 28).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&jan_31, 2).unwrap().date(),
			Date::from_calendar_date(2025, Month::March, 31).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&jan_31, 3).unwrap().date(),
			Date::from_calendar_date(2025, Month::April, 30).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&dec_31, 1).unwrap().date(),
			Date::from_calendar_date(2025, Month::January, 31).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&feb_29, 12).unwrap().date(),
			Date::from_calendar_date(2025, Month::February, 28).unwrap()
		);

		assert_eq!(
			event_facade.add_months_to_date(&Date::MAX.midnight().assume_utc(), 12),
			None
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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

		let rules = [
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
			event_recurrence
				.apply_day_rules(
					vec![date],
					&by_day_rules,
					&RepeatPeriod::Monthly,
					vec![],
					Weekday::Monday,
					false,
					valid_month_days,
					vec![],
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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

		let rules = [
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
			event_recurrence
				.apply_day_rules(
					vec![date],
					&by_day_rules,
					&RepeatPeriod::Monthly,
					vec![],
					Weekday::Monday,
					false,
					valid_month_days,
					vec![],
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
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
			event_recurrence
				.apply_day_rules(
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
					false
				)
				.unwrap(),
			[date]
		);
	}

	#[test]
	#[should_panic = "Invalid repeat rule, can't use BYWEEKNO with Offset on BYDAY"]
	fn test_parse_by_day_yearly_with_invalid_rule() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 10).unwrap(),
			time,
		);

		let event_recurrence = EventFacade {};
		// Can be WEEKDAY + WEEK

		event_recurrence
			.apply_day_rules(
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
				false,
			)
			.unwrap();
	}

	#[test]
	fn test_generate_future_instances_yearly_byweekno_byday_on_a_different_week() {
		let time = Time::from_hms(13, 23, 00).unwrap();
		let date = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 6).unwrap(),
			time,
		);

		let expected = PrimitiveDateTime::new(
			Date::from_calendar_date(2025, Month::January, 21).unwrap(),
			time,
		);

		let repeat_rule = EventRepeatRule {
			frequency: RepeatPeriod::Annually,
			by_rules: vec![
				ByRule {
					by_rule: ByRuleType::ByDay,
					interval: "TU".to_string(),
				},
				ByRule {
					by_rule: ByRuleType::ByWeekNo,
					interval: "4".to_string(),
				},
			],
		};

		let event_facade = EventFacade {};
		let result = event_facade
			.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
			.unwrap();
		assert_eq!(result, [expected.to_date_time()]);
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
			event_recurrence
				.generate_future_instances(
					date.replace_month(Month::January).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_month(Month::January).unwrap().to_date_time()
				)
				.unwrap(),
			[]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
			[date.to_date_time()]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date.replace_month(Month::February).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_month(Month::February).unwrap().to_date_time()
				)
				.unwrap(),
			[date.replace_month(Month::February).unwrap().to_date_time()]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date.replace_month(Month::June).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_month(Month::June).unwrap().to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
			[date.replace_day(14).unwrap().to_date_time()]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date.replace_day(13).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_day(13).unwrap().to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
			[date.replace_day(10).unwrap().to_date_time(),]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date.replace_month(Month::January).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_month(Month::January).unwrap().to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
					by_rule: ByRuleType::Wkst,
					interval: "SU".to_string(),
				},
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
		let future_instances = event_recurrence
			.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
			.unwrap();
		assert_eq!(
			future_instances,
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
			[date.replace_day(10).unwrap().to_date_time(),]
		);
		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date_not_in_range.to_date_time(),
					&repeat_rule,
					date_not_in_range.to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
			[date.replace_day(13).unwrap().to_date_time()]
		);

		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date.replace_month(Month::March).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_month(Month::March).unwrap().to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
			[date.replace_day(20).unwrap().to_date_time()]
		);

		assert_eq!(
			event_recurrence
				.generate_future_instances(
					date.replace_month(Month::March).unwrap().to_date_time(),
					&repeat_rule,
					date.replace_month(Month::March).unwrap().to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(
					valid_date.to_date_time(),
					&repeat_rule,
					valid_date.to_date_time()
				)
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
			event_recurrence
				.generate_future_instances(date.to_date_time(), &repeat_rule, date.to_date_time())
				.unwrap(),
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
