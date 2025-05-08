use super::event_facade::{
	ByRule, ByRuleType, EndType, EventRepeatRule, MonthNumber, RepeatPeriod,
};
#[cfg_attr(test, mockall_double::double)]
use crate::contacts::contact_facade::ContactFacade;
#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
#[cfg_attr(test, mockall_double::double)]
use crate::customer::customer_facade::CustomerFacade;
use crate::date::event_facade::EventFacade;
use crate::date::DateTime;
use crate::entities::generated::sys::{CustomerInfo, GroupInfo, GroupMembership, User};
use crate::entities::generated::tutanota::{
	CalendarEvent, CalendarGroupRoot, Contact, GroupSettings, UserSettingsGroupRoot,
};
use crate::groups::GroupType;
use crate::tutanota_constants::{AccountType, PlanType};
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::util::first_bigger_than_second_custom_id;
use crate::{ApiCallError, CustomId, GeneratedId, IdTupleCustom, ListLoadDirection};
use base64::prelude::{BASE64_STANDARD, BASE64_URL_SAFE, BASE64_URL_SAFE_NO_PAD};
use base64::Engine;
use num_enum::TryFromPrimitive;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::HashMap;
use std::string::ToString;
use std::sync::Arc;
use time::{Date, Duration, Month, OffsetDateTime, Time, UtcOffset};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BirthdayEvent {
	calendar_event: CalendarEvent,
	contact: Contact,
}

struct DateParts(Option<u32>, u8, u8);

// To keep the SDK decoupled and dependency free we decided to handle translations on native side
pub const DEFAULT_CALENDAR_NAME: &str = "";
pub const DEFAULT_CALENDAR_COLOR: &str = "2196f3";

pub const CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID: &str = "clientOnly_birthdays";
pub const CLIENT_ONLY_CALENDAR_BIRTHDAYS_TRANSLATION_KEY: &str = "birthdayCalendar_label";
pub const CLIENT_ONLY_CALENDAR_BIRTHDAYS_COLOR: &str = "FF9933";

#[derive(uniffi::Record)]
pub struct CalendarData {
	group_info: GroupInfo,
	group_settings: Option<GroupSettings>,
}

#[derive(uniffi::Record, Debug)]
pub struct CalendarRenderData {
	pub name: String,
	pub color: String,
}

#[derive(uniffi::Record)]
pub struct CalendarEventsList {
	pub short_events: Vec<CalendarEvent>,
	pub long_events: Vec<CalendarEvent>,
	pub birthday_events: Vec<BirthdayEvent>,
}

#[derive(uniffi::Object)]
pub struct CalendarFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
	contact_facade: Arc<ContactFacade>,
	customer_facade: Arc<CustomerFacade>,
}

#[cfg_attr(test, mockall::automock)]
impl CalendarFacade {
	#[must_use]
	pub fn new(
		crypto_entity_client: Arc<CryptoEntityClient>,
		user_facade: Arc<UserFacade>,
		contact_facade: Arc<ContactFacade>,
		customer_facade: Arc<CustomerFacade>,
	) -> Self {
		CalendarFacade {
			crypto_entity_client,
			user_facade,
			contact_facade,
			customer_facade,
		}
	}

	///  Fetches all user calendars
	async fn fetch_calendars_data(
		&self,
	) -> Result<HashMap<GeneratedId, CalendarData>, ApiCallError> {
		let user = self.user_facade.get_user();
		let memberships: Vec<&GroupMembership> = user
			.memberships
			.iter()
			.filter(|membership| {
				membership.group_type() == GroupType::Calendar && membership.capability.is_none()
			})
			.collect();

		if memberships.is_empty() {
			return Err(ApiCallError::internal(
				"User does not have a single calendar group. This should not be allowed."
					.to_owned(),
			));
		}

		let user_settings_group_root: UserSettingsGroupRoot = self
			.crypto_entity_client
			.load(&user.userGroup.group)
			.await?;
		let mut calendars_data: HashMap<GeneratedId, CalendarData> = HashMap::new();
		for membership in memberships {
			let group_info: GroupInfo = self
				.crypto_entity_client
				.load(&membership.groupInfo)
				.await?;
			let group_settings: Option<GroupSettings> = user_settings_group_root
				.groupSettings
				.iter()
				.find(|settings| settings.group == membership.group)
				.cloned();

			calendars_data.insert(
				membership.group.clone(),
				CalendarData {
					group_info,
					group_settings,
				},
			);
		}

		Ok(calendars_data)
	}

	/// Fetches calendar events from a given calendar starting on a given Date and Time
	/// until the end of the same day
	async fn fetch_calendar_events_from_date_until_end_of_day(
		&self,
		calendar_id: &GeneratedId,
		date: DateTime,
	) -> Result<CalendarEventsList, ApiCallError> {
		let user = self.user_facade.get_user();
		let memberships: Vec<&GroupMembership> = user
			.memberships
			.iter()
			.filter(|membership| membership.group_type() == GroupType::Calendar)
			.collect();

		if memberships.is_empty() {
			return Err(ApiCallError::internal(
				"User does not have a single calendar group. This should not be allowed."
					.to_owned(),
			));
		}

		let membership = match memberships
			.iter()
			.find(|membership| &membership.group == calendar_id)
		{
			Some(membership) => *membership,
			_ => {
				return Err(ApiCallError::internal(format!(
					"Missing membership for id {}",
					calendar_id
				)))
			},
		};

		let (timestamp_start, timestamp_end) = match self.parse_date_to_all_day_range(date) {
			Ok(value) => value,
			Err(err) => return Err(err),
		};

		let mut short_events: Vec<CalendarEvent> = Vec::new();
		let mut long_events: Vec<CalendarEvent> = Vec::new();

		let mut has_short_events_finished = false;
		let mut has_long_events_finished = false;

		let mut start_short_id = get_event_element_min_id(timestamp_start);
		let max_short_id = get_event_element_max_id(timestamp_end);
		let mut start_long_id = CustomId("".to_owned());
		let max_long_id = get_max_timestamp_id();
		let group_root: CalendarGroupRoot =
			self.crypto_entity_client.load(&membership.group).await?;

		while !has_short_events_finished && !has_long_events_finished {
			let (loaded_short_events, loaded_long_events): (
				Result<Vec<CalendarEvent>, ApiCallError>,
				Result<Vec<CalendarEvent>, ApiCallError>,
			) = tokio::join!(
				self.call_load_events(
					has_short_events_finished,
					&start_short_id,
					&group_root.shortEvents
				),
				self.call_load_events(
					has_long_events_finished,
					&start_long_id,
					&group_root.longEvents
				),
			);

			let mut unwraped_short_events = loaded_short_events?;
			let (is_done, new_start) =
				self.is_list_load_done(&max_short_id, &mut unwraped_short_events)?;
			has_short_events_finished = is_done;
			start_short_id = new_start;
			let mut filtered_short_events = self.filter_events_in_range(
				date.as_millis(),
				timestamp_end,
				&mut unwraped_short_events,
			);
			short_events.append(&mut filtered_short_events);

			let mut unwraped_long_events = loaded_long_events?;

			let (is_done, new_start) =
				self.is_list_load_done(&max_long_id, &mut unwraped_long_events)?;
			has_long_events_finished = is_done;
			start_long_id = new_start;

			let events_facade = EventFacade {};
			let mut advanced_instances: Vec<CalendarEvent> = Vec::new();

			let event_with_repeat_rules = unwraped_long_events
				.iter()
				.filter(|event| event.repeatRule.is_some())
				.collect::<Vec<&CalendarEvent>>();

			for event in &event_with_repeat_rules {
				let repeat_rule = event.repeatRule.as_ref().unwrap();
				let event_instances = match events_facade.create_event_instances(
					event.startTime,
					event.endTime,
					EventRepeatRule {
						frequency: RepeatPeriod::try_from_primitive(repeat_rule.frequency as u8)
							.unwrap(),
						by_rules: repeat_rule
							.advancedRules
							.iter()
							.map(|adv| ByRule {
								by_rule: ByRuleType::try_from_primitive(adv.ruleType as u8)
									.unwrap(),
								interval: adv.interval.clone(),
							})
							.collect(),
					},
					repeat_rule.interval as u8,
					EndType::try_from_primitive(repeat_rule.endType as u8).unwrap(),
					repeat_rule.endValue.map(|val| val.unsigned_abs()),
					repeat_rule
						.excludedDates
						.iter()
						.map(|date| date.date)
						.collect(),
					None,
					Some(DateTime::from_millis(timestamp_end)),
					repeat_rule.timeZone.clone(),
				) {
					Ok(ev) => ev,
					Err(e) => {
						log::error!(
							"Failed to parse advanced repeat rules for event {:?}: {e}",
							event._id
						);

						Vec::new()
					},
				};

				for ev in event_instances {
					if ev.as_millis() == event.startTime.as_millis() {
						continue;
					}

					let mut generic_event = event.to_owned().to_owned();
					let end_time = self.calculate_new_end_time(event, &ev);

					generic_event.startTime = ev;
					generic_event.endTime = end_time;

					advanced_instances.push(generic_event);
				}
			}

			unwraped_long_events.append(&mut advanced_instances);
			let mut filtered_long_events = self.filter_events_in_range(
				date.as_millis(),
				timestamp_end,
				&mut unwraped_long_events,
			);

			filtered_long_events = self.filter_excluded_dates(&mut filtered_long_events);

			long_events.append(&mut filtered_long_events);
		}

		// We use i128 because 0 - u64::MAX overflows i64::MIN
		short_events.sort_by(|a, b| self.sort_events_by_start_time(a, b));
		long_events.sort_by(|a, b| self.sort_events_by_start_time(a, b));

		Ok(CalendarEventsList {
			short_events,
			long_events,
			birthday_events: vec![],
		})
	}

	fn sort_events_by_start_time(&self, a: &CalendarEvent, b: &CalendarEvent) -> Ordering {
		((a.startTime.as_millis() as i128) - (b.startTime.as_millis() as i128))
			.cmp(&(a.startTime.as_millis() as i128))
	}

	async fn fetch_birthday_events(
		&self,
		date: DateTime,
	) -> Result<CalendarEventsList, ApiCallError> {
		let (timestamp_start, timestamp_end) = match self.parse_date_to_all_day_range(date) {
			Ok(value) => value,
			Err(err) => return Err(err),
		};

		let birthday_events: Vec<BirthdayEvent> = self
			.generate_birthdays()
			.await?
			.into_iter()
			.filter(|ev| self.is_event_in_range(&ev.calendar_event, timestamp_start, timestamp_end))
			.collect();

		Ok(CalendarEventsList {
			short_events: vec![],
			long_events: vec![],
			birthday_events,
		})
	}

	fn parse_date_to_all_day_range(&self, date: DateTime) -> Result<(u64, u64), ApiCallError> {
		let Ok(offset) = UtcOffset::current_local_offset() else {
			return Err(ApiCallError::InternalSdkError {
				error_message: "Failed to determine device time offset".to_string(),
			});
		};

		let date_in_seconds = (date.as_millis() / 1000) as i64;

		let parsed_date = match OffsetDateTime::from_unix_timestamp(date_in_seconds) {
			Ok(date) => date
				.to_offset(offset)
				.replace_time(Time::from_hms(0, 0, 0).unwrap()),
			Err(e) => return Err(ApiCallError::internal_with_err(e, "Invalid date")),
		};

		let Some(next_day) = parsed_date.date().next_day() else {
			return Err(ApiCallError::internal("Invalid next day".to_string()));
		};

		let timestamp_start =
			(OffsetDateTime::new_utc(parsed_date.date(), Time::from_hms(0, 0, 0).unwrap())
				.replace_offset(offset)
				.unix_timestamp()
				* 1000) as u64;

		let timestamp_end = (OffsetDateTime::new_utc(next_day, Time::from_hms(0, 0, 0).unwrap())
			.replace_offset(offset)
			.unix_timestamp()
			* 1000) as u64;

		Ok((timestamp_start, timestamp_end))
	}

	fn calculate_new_end_time(
		&self,
		original_event: &CalendarEvent,
		new_start_date: &DateTime,
	) -> DateTime {
		let diff = original_event.endTime.as_millis() - original_event.startTime.as_millis();

		DateTime::from_millis(new_start_date.as_millis() + diff)
	}

	fn filter_events_in_range(
		&self,
		timestamp_start: u64,
		timestamp_end: u64,
		events: &mut [CalendarEvent],
	) -> Vec<CalendarEvent> {
		events
			.iter()
			.filter(|&event| self.is_event_in_range(event, timestamp_start, timestamp_end))
			.map(|event| event.to_owned())
			.collect()
	}

	fn is_event_in_range(
		&self,
		event: &CalendarEvent,
		timestamp_start: u64,
		timestamp_end: u64,
	) -> bool {
		(event.startTime.as_millis() >= timestamp_start
			|| event.endTime.as_millis() > timestamp_start)
			&& event.startTime.as_millis() < timestamp_end
	}

	fn filter_excluded_dates(&self, events: &mut [CalendarEvent]) -> Vec<CalendarEvent> {
		events
			.iter()
			.filter(|&event| {
				if event.repeatRule.is_none() {
					return true;
				}

				let repeat_rule = event.repeatRule.as_ref().unwrap();
				if repeat_rule.excludedDates.is_empty() {
					return true;
				}

				!repeat_rule
					.excludedDates
					.iter()
					.map(|date| date.date)
					.collect::<Vec<DateTime>>()
					.contains(&event.startTime)
			})
			.map(|event| event.to_owned())
			.collect()
	}

	fn is_list_load_done(
		&self,
		max_id: &CustomId,
		events: &mut [CalendarEvent],
	) -> Result<(bool, CustomId), ApiCallError> {
		if events.last().is_none() {
			return Ok((true, max_id.to_owned()));
		}

		let last_event = events.last().unwrap().to_owned();
		let Some(last_event_id) = last_event._id else {
			return Err(ApiCallError::internal("Event without id?".to_string()));
		};

		if first_bigger_than_second_custom_id(&last_event_id.element_id, max_id) {
			return Ok((true, last_event_id.element_id));
		}

		Ok((false, last_event_id.element_id))
	}

	async fn call_load_events(
		&self,
		has_finished: bool,
		start_id: &CustomId,
		event_list: &GeneratedId,
	) -> Result<Vec<CalendarEvent>, ApiCallError> {
		if !has_finished {
			return self
				.crypto_entity_client
				.load_range(event_list, start_id, 200, ListLoadDirection::ASC)
				.await;
		}

		Ok([].to_vec())
	}

	pub async fn generate_client_only_calendars(&self) -> HashMap<GeneratedId, CalendarRenderData> {
		let user: Arc<User> = self.user_facade.get_user();
		if user.accountType != AccountType::PAID as i64 {
			return HashMap::new();
		}

		let customer_info = match self.customer_facade.fetch_customer_info().await {
			Ok(customer_info) => customer_info,
			Err(e) => {
				log::error!(
					"Error while fetching customer info, skipping client only calendars... {e:?}"
				);
				return HashMap::new();
			},
		};

		let parsed_plan = match PlanType::try_from_primitive(customer_info.plan as u8) {
			Ok(plan) => plan,
			Err(e) => {
				log::error!("Failed to parse plan type with error: {e:?}");
				return HashMap::new();
			},
		};
		if !parsed_plan.is_new_paid_plan() {
			return HashMap::new();
		}

		let birthday_calendar_id = format!(
			"{}#{}",
			user._id.as_ref().unwrap(),
			CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID
		);
		HashMap::from([(
			GeneratedId(birthday_calendar_id),
			CalendarRenderData {
				name: String::from(CLIENT_ONLY_CALENDAR_BIRTHDAYS_TRANSLATION_KEY),
				color: String::from(CLIENT_ONLY_CALENDAR_BIRTHDAYS_COLOR),
			},
		)])
	}

	fn assert_valid_iso_birthday(&self, iso_birthday: &String) -> Result<DateParts, ApiCallError> {
		let valid_birthday_parts: DateParts = if iso_birthday.as_str().starts_with("--") {
			let month_and_day: Vec<&str> = iso_birthday.as_str()[2..].split("-").collect();
			if month_and_day.len() != 2 {
				return Err(ApiCallError::internal(format!(
					"Invalid birthday without year {}",
					iso_birthday
				)));
			}

			DateParts(
				None::<u32>,
				month_and_day[0].parse::<u8>().unwrap(),
				month_and_day[1].parse::<u8>().unwrap(),
			)
		} else {
			let birthday_parts: Vec<&str> = iso_birthday.split("-").collect();
			if birthday_parts.iter().count() != 3 || birthday_parts[0].len() != 4 {
				return Err(ApiCallError::internal(format!(
					"Invalid birthday {}",
					iso_birthday
				)));
			}

			DateParts(
				Some(birthday_parts[0].parse::<u32>().unwrap()),
				birthday_parts[1].parse::<u8>().unwrap(),
				birthday_parts[2].parse::<u8>().unwrap(),
			)
		};

		if !self.birthday_has_valid_range(&valid_birthday_parts) {
			return Err(ApiCallError::internal(format!(
				"Birthday outside acceptable range {}",
				iso_birthday
			)));
		}

		Ok(valid_birthday_parts)
	}

	fn birthday_has_valid_range(&self, valid_birthday_parts: &DateParts) -> bool {
		let year = valid_birthday_parts.0;
		let month = valid_birthday_parts.1;
		let day = valid_birthday_parts.2;

		(year.is_none() || year.unwrap() < 10000) && month > 0 && month < 13 && day > 0 && day <= 31
	}

	fn generate_event_uid(&self, calendar_id: &GeneratedId, timestamp: DateTime) -> String {
		format!(
			"{}{}@tuta.com",
			calendar_id.to_string(),
			timestamp.as_millis()
		)
	}

	async fn generate_birthdays(&self) -> Result<Vec<BirthdayEvent>, ApiCallError> {
		let contacts: Vec<Contact> = self.contact_facade.load_all_user_contacts().await?;

		let user_id = match self.user_facade.get_user()._id.clone() {
			Some(id) => id,
			_ => {
				return Err(ApiCallError::internal(
					"Trying to generate birthdays for a user without an Id".to_string(),
				))
			},
		};

		let birthdays: Vec<BirthdayEvent> = contacts
			.iter()
			.filter_map(|contact| self.assert_birthday_and_create_event(&user_id, &contact))
			.collect();

		Ok(birthdays)
	}

	fn assert_birthday_and_create_event(
		&self,
		user_id: &GeneratedId,
		contact: &Contact,
	) -> Option<BirthdayEvent> {
		if contact.birthdayIso.is_none() {
			return None;
		}

		let birthday_date =
			match self.assert_valid_iso_birthday(contact.birthdayIso.as_ref().unwrap()) {
				Ok(date) => date,
				Err(e) => {
					log::error!("{e:?}");
					return None;
				},
			};

		let event = match self.create_birthday_event(&contact, &birthday_date, &user_id) {
			Ok(ev) => ev,
			Err(e) => {
				log::error!("Failed to create birthday event: {}", e);
				return None;
			},
		};

		Some(event)
	}

	fn create_birthday_event(
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
			CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID
		));

		let uid: String = self.generate_event_uid(&birthday_calendar_id, DateTime::from_millis(0));

		let event_title = contact.firstName.clone();

		let birth_year = if birthday_parts.0.unwrap_or(0) < 1970 {
			1970
		} else {
			birthday_parts.0.unwrap()
		};
		let birthday_date = match Date::from_calendar_date(
			OffsetDateTime::now_local().unwrap().year(),
			Month::from_number(birthday_parts.1),
			birthday_parts.2,
		) {
			Ok(date) => date,
			Err(e) => return Err(ApiCallError::internal(format!("Invalid date: {e:?}"))),
		};

		let event_base_date = birthday_date.replace_year(birth_year as i32).unwrap();

		let offset_date_time_base =
			OffsetDateTime::new_utc(event_base_date, Time::from_hms(0, 0, 0).unwrap());
		let offset_date_time_start_time =
			OffsetDateTime::new_utc(birthday_date, Time::from_hms(0, 0, 0).unwrap());
		let offset_date_time_end_time = offset_date_time_start_time
			.checked_add(Duration::days(1))
			.unwrap();

		let base_datetime = DateTime::from_seconds(offset_date_time_base.unix_timestamp() as u64);

		// Set up start and end date base on UTC.
		// Also increments a copy of startDate by one day and set it as endDate
		let Ok(start_date) = EventFacade::get_all_day_time(&DateTime::from_seconds(
			offset_date_time_start_time.unix_timestamp() as u64,
		)) else {
			return Err(ApiCallError::internal(
				"Failed to parse event StartTime".to_string(),
			));
		};

		let Ok(end_date) = EventFacade::get_all_day_time(&DateTime::from_seconds(
			offset_date_time_end_time.unix_timestamp() as u64,
		)) else {
			return Err(ApiCallError::internal(
				"Failed to parse event EndTime".to_string(),
			));
		};

		let encoded_event_id = BASE64_URL_SAFE_NO_PAD.encode(format!(
			"{}{}/{}",
			base_datetime.as_millis(),
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
			_finalIvs: HashMap::new(),
		}
	}
}

#[uniffi::export]
impl CalendarFacade {
	pub async fn get_calendars_render_data(&self) -> HashMap<GeneratedId, CalendarRenderData> {
		let Ok(calendars_data) = self.fetch_calendars_data().await else {
			return HashMap::new();
		};

		let mut calendars_render_data: HashMap<GeneratedId, CalendarRenderData> = HashMap::new();
		for (calendar_id, calendar_data) in calendars_data.into_iter() {
			let CalendarData {
				group_info,
				group_settings,
			} = calendar_data;
			let name = group_settings
				.as_ref()
				.and_then(|settings| settings.name.clone())
				.unwrap_or_else(|| {
					if group_info.name.is_empty() {
						DEFAULT_CALENDAR_NAME.to_owned()
					} else {
						group_info.name.clone()
					}
				});
			let color = group_settings
				.as_ref()
				.map(|settings| settings.color.clone())
				.unwrap_or_else(|| DEFAULT_CALENDAR_COLOR.to_owned());

			let render_data = CalendarRenderData { name, color };

			calendars_render_data.insert(calendar_id, render_data);
		}

		let client_only_calendars = self.generate_client_only_calendars().await;
		calendars_render_data.extend(client_only_calendars);

		println!("{:?}", calendars_render_data);

		calendars_render_data
	}

	pub async fn get_calendar_events(
		&self,
		calendar_id: &GeneratedId,
		date: DateTime,
	) -> CalendarEventsList {
		if calendar_id
			.0
			.contains(CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID)
		{
			return self.fetch_birthday_events(date).await.unwrap();
		}

		self.fetch_calendar_events_from_date_until_end_of_day(calendar_id, date)
			.await
			.unwrap()
	}
}

pub const DAY_IN_MILLIS: u64 = 1000 * 60 * 60 * 24;
/**
 * The time in ms that element ids for calendar events and alarms  get randomized by
 */
pub const DAYS_SHIFTED_MS: u64 = 15 * DAY_IN_MILLIS;
pub const DEFAULT_SHORT_EVENT_NAME: &str = "Short Event"; // Used only in tests
pub const DEFAULT_LONG_EVENT_NAME: &str = "Long Event"; // Used only in tests

fn get_event_element_min_id(timestamp: u64) -> CustomId {
	CustomId::from_custom_string(&format!("{}", timestamp - DAYS_SHIFTED_MS))
}

fn get_event_element_max_id(timestamp: u64) -> CustomId {
	CustomId::from_custom_string(&format!("{}", timestamp + DAYS_SHIFTED_MS))
}
fn get_max_timestamp_id() -> CustomId {
	CustomId::from_custom_string(&(u64::MAX.to_string()))
}

#[cfg(test)]
mod calendar_facade_unit_tests {
	use super::{
		CalendarFacade, CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID, DEFAULT_CALENDAR_COLOR,
		DEFAULT_CALENDAR_NAME,
	};
	use crate::contacts::contact_facade::MockContactFacade;
	use crate::crypto_entity_client::MockCryptoEntityClient;
	use crate::customer::customer_facade::MockCustomerFacade;
	use crate::entities::generated::sys::{CustomerInfo, GroupInfo, GroupMembership, User};
	use crate::entities::generated::tutanota::{Contact, GroupSettings, UserSettingsGroupRoot};
	use crate::groups::GroupType;
	use crate::tutanota_constants::{AccountType, PlanType};
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::{create_mock_contact, create_test_entity};
	use crate::{GeneratedId, IdTupleGenerated};
	use std::sync::Arc;

	fn create_mock_user(
		user_group: &GeneratedId,
		calendar_id: &GeneratedId,
		account_type: AccountType,
	) -> User {
		User {
			memberships: vec![GroupMembership {
				groupType: Some(GroupType::Calendar as i64),
				group: calendar_id.to_owned(),
				..create_test_entity()
			}],
			userGroup: GroupMembership {
				group: user_group.to_owned(),
				..create_test_entity()
			},
			accountType: account_type as i64,
			..create_test_entity()
		}
	}

	fn create_mock_user_settings_group_root(
		calendar_id: Option<&GeneratedId>,
		color: Option<&str>,
		name: Option<&str>,
		source_url: Option<&str>,
	) -> UserSettingsGroupRoot {
		let mut user_settings_group_root = UserSettingsGroupRoot {
			groupSettings: vec![],
			..create_test_entity()
		};
		if calendar_id.is_some() || color.is_some() || name.is_some() || source_url.is_some() {
			let group_setting = GroupSettings {
				group: calendar_id.unwrap().to_owned(),
				color: color.unwrap().to_owned(),
				name: name.map(|s| s.to_owned()),
				sourceUrl: source_url.map(|s| s.to_owned()),
				..create_test_entity()
			};
			user_settings_group_root.groupSettings.push(group_setting);
		}
		user_settings_group_root
	}

	fn create_mock_group_info(calendar_id: &GeneratedId, name: Option<&str>) -> GroupInfo {
		GroupInfo {
			groupType: Some(GroupType::Calendar as i64),
			group: calendar_id.to_owned(),
			name: name.unwrap_or("").to_owned(),
			..create_test_entity()
		}
	}

	fn create_mock_customer_info(
		customer_id: &GeneratedId,
		customer_info_id: IdTupleGenerated,
		plan_type: PlanType,
	) -> CustomerInfo {
		CustomerInfo {
			_id: Some(customer_info_id),
			customer: customer_id.clone(),
			plan: plan_type as i64,
			..create_test_entity()
		}
	}

	#[tokio::test]
	async fn test_private_default_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_contact_facade = MockContactFacade::default();
		let mock_customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();

		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::FREE);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root =
			create_mock_user_settings_group_root(None, None, None, None);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, None);
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(mock_customer_facade),
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let calendar_render_data = calendars_render_data.get(&calendar_id).unwrap();

		assert_eq!(calendar_render_data.name, DEFAULT_CALENDAR_NAME);
		assert_eq!(calendar_render_data.color, DEFAULT_CALENDAR_COLOR);
	}

	#[tokio::test]
	async fn test_private_custom_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_contact_facade = MockContactFacade::default();
		let mock_customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();
		let custom_color = "a5e4ac";
		let custom_name = "Private Custom Edited";

		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::FREE);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root = create_mock_user_settings_group_root(
			Some(&calendar_id),
			Some(custom_color),
			None,
			None,
		);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, Some(custom_name));
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(mock_customer_facade),
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let calendar_render_data = calendars_render_data.get(&calendar_id).unwrap();

		assert_eq!(calendar_render_data.name, custom_name);
		assert_eq!(calendar_render_data.color, custom_color);
	}

	#[tokio::test]
	async fn test_private_custom_calendar_no_name_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_contact_facade = MockContactFacade::default();
		let mock_customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();
		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::FREE);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let custom_color = "a5e4ac";
		let mock_user_settings_group_root = create_mock_user_settings_group_root(
			Some(&calendar_id),
			Some(custom_color),
			None,
			None,
		);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, None);
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(mock_customer_facade),
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let calendar_render_data = calendars_render_data.get(&calendar_id).unwrap();

		assert_eq!(calendar_render_data.name, DEFAULT_CALENDAR_NAME);
		assert_eq!(calendar_render_data.color, custom_color);
	}

	#[tokio::test]
	async fn test_shared_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_contact_facade = MockContactFacade::default();
		let mock_customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();
		let custom_color = "e4c0a5";
		let custom_name = "Shared Calendar";

		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::FREE);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root = create_mock_user_settings_group_root(
			Some(&calendar_id),
			Some(custom_color),
			Some(custom_name),
			None,
		);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, Some("Shared"));
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(mock_customer_facade),
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let calendar_render_data = calendars_render_data.get(&calendar_id).unwrap();

		assert_eq!(calendar_render_data.name, custom_name.to_string());
		assert_eq!(calendar_render_data.color, custom_color);
	}

	#[tokio::test]
	async fn test_birthday_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_contact_facade = MockContactFacade::default();
		let mut mock_customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();

		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::PAID);
		let user_id = mock_user._id.clone().unwrap();
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root =
			create_mock_user_settings_group_root(None, None, None, None);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, None);
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let mock_customer_info = create_mock_customer_info(
			&GeneratedId::test_random(),
			IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
			PlanType::Revolutionary,
		);
		mock_customer_facade
			.expect_fetch_customer_info()
			.return_const(Ok(mock_customer_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(mock_customer_facade),
		);

		let formated_id = format!(
			"{}#{}",
			user_id.as_str(),
			CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID
		);
		let birthday_calendar_id = GeneratedId(formated_id);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let render_data = calendars_render_data.get(&birthday_calendar_id).unwrap();

		let client_only_calendars = calendar_facade.generate_client_only_calendars().await;
		let birthday_calendar = client_only_calendars.get(&birthday_calendar_id).unwrap();

		assert_eq!(render_data.name, birthday_calendar.name);
		assert_eq!(render_data.color, birthday_calendar.color);
	}

	#[tokio::test]
	async fn test_do_not_create_birthday_calendar_render_info_for_legacy_account() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mock_contact_facade = MockContactFacade::default();
		let mut mock_customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();

		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::PAID);
		let user_id = mock_user._id.clone().unwrap();
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root =
			create_mock_user_settings_group_root(None, None, None, None);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, None);
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let mock_customer_info = create_mock_customer_info(
			&GeneratedId::test_random(),
			IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
			PlanType::Premium,
		);
		mock_customer_facade
			.expect_fetch_customer_info()
			.return_const(Ok(mock_customer_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(mock_customer_facade),
		);

		let formated_id = format!(
			"{}#{}",
			user_id.as_str(),
			CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID
		);
		let birthday_calendar_id = GeneratedId(formated_id);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let render_data = calendars_render_data.get(&birthday_calendar_id);
		assert!(render_data.is_none());

		let client_only_calendars = calendar_facade.generate_client_only_calendars().await;
		let birthday_calendar = client_only_calendars.get(&birthday_calendar_id);
		assert!(birthday_calendar.is_none());
	}

	#[tokio::test]
	async fn test_do_not_create_birthday_calendar_render_info_for_free_account() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let contact_facade = MockContactFacade::default();
		let customer_facade = MockCustomerFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();

		let mock_user = create_mock_user(&user_group, &calendar_id, AccountType::FREE);
		let user_id = mock_user._id.clone().unwrap();
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root =
			create_mock_user_settings_group_root(None, None, None, None);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, None);
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(contact_facade),
			Arc::new(customer_facade),
		);

		let formated_id = format!(
			"{}#{}",
			user_id.as_str(),
			CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID
		);
		let birthday_calendar_id = GeneratedId(formated_id);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let render_data = calendars_render_data.get(&birthday_calendar_id);
		assert!(render_data.is_none());

		let client_only_calendars = calendar_facade.generate_client_only_calendars().await;
		let birthday_calendar = client_only_calendars.get(&birthday_calendar_id);
		assert!(birthday_calendar.is_none());
	}

	#[tokio::test]
	async fn test_generate_birthday_from_valid_contacts() {
		let mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mut mock_contact_facade = MockContactFacade::default();
		let customer_facade = MockCustomerFacade::default();

		let default_private_calendar_id = GeneratedId::test_random();
		let user_group = GeneratedId::test_random();
		let mock_user =
			create_mock_user(&user_group, &default_private_calendar_id, AccountType::PAID);
		mock_user_facade.expect_get_user().return_const(mock_user);
		let contact_list_id = GeneratedId::test_random();

		let mock_contacts: Vec<Contact> = vec![
			create_mock_contact(
				&contact_list_id,
				&GeneratedId::test_random(),
				Some("Mary"),
				Some("2000-05-06".to_string()),
			),
			create_mock_contact(
				&contact_list_id,
				&GeneratedId::test_random(),
				Some("Jane"),
				Some("1950-05-06".to_string()),
			),
			create_mock_contact(
				&contact_list_id,
				&GeneratedId::test_random(),
				Some("John"),
				Some("--05-06".to_string()),
			),
		];
		mock_contact_facade
			.expect_load_all_user_contacts()
			.return_const(Ok(mock_contacts));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(customer_facade),
		);

		let birthdays = calendar_facade.generate_birthdays().await.unwrap();
		assert_eq!(birthdays.len(), 3);
	}

	#[tokio::test]
	async fn test_fail_to_generate_birthday_from_invalid_contacts() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();
		let mut mock_contact_facade = MockContactFacade::default();
		let customer_facade = MockCustomerFacade::default();

		let default_private_calendar_id = GeneratedId::test_random();
		let user_group = GeneratedId::test_random();
		let mock_user =
			create_mock_user(&user_group, &default_private_calendar_id, AccountType::PAID);
		mock_user_facade.expect_get_user().return_const(mock_user);
		let contact_list_id = GeneratedId::test_random();

		let mock_contacts: Vec<Contact> = vec![create_mock_contact(
			&contact_list_id,
			&GeneratedId::test_random(),
			Some("Jane"),
			Some("00-05-06".to_string()),
		)];
		mock_contact_facade
			.expect_load_all_user_contacts()
			.return_const(Ok(mock_contacts));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
			Arc::new(mock_contact_facade),
			Arc::new(customer_facade),
		);

		let birthdays = calendar_facade.generate_birthdays().await.unwrap();
		assert_eq!(birthdays.len(), 0);
	}
}
