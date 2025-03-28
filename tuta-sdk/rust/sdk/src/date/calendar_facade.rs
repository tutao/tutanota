use std::collections::HashMap;
use std::sync::Arc;

use num_enum::TryFromPrimitive;
use time::{OffsetDateTime, Time};

#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::date::event_facade::EventFacade;
use crate::date::DateTime;
use crate::entities::generated::sys::{GroupInfo, GroupMembership};
use crate::entities::generated::tutanota::{
	CalendarEvent, CalendarGroupRoot, GroupSettings, UserSettingsGroupRoot,
};
use crate::groups::GroupType;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::util::first_bigger_than_second_custom_id;
use crate::{ApiCallError, CustomId, GeneratedId, ListLoadDirection};

use super::event_facade::{ByRule, ByRuleType, EndType, EventRepeatRule, RepeatPeriod};

#[derive(uniffi::Record)]
pub struct CalendarData {
	group_info: GroupInfo,
	group_settings: Option<GroupSettings>,
}

#[derive(uniffi::Record)]
pub struct CalendarRenderData {
	pub name: String,
	pub color: String,
}

#[derive(uniffi::Record)]
pub struct CalendarEventsList {
	pub short_events: Vec<CalendarEvent>,
	pub long_events: Vec<CalendarEvent>,
}

#[derive(uniffi::Object)]
pub struct CalendarFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
}

impl CalendarFacade {
	pub fn new(
		crypto_entity_client: Arc<CryptoEntityClient>,
		user_facade: Arc<UserFacade>,
	) -> Self {
		CalendarFacade {
			crypto_entity_client,
			user_facade,
		}
	}

	/**
	 * Fetches all user calendars
	 */
	async fn fetch_calendars_data(
		&self,
	) -> Result<HashMap<GeneratedId, CalendarData>, ApiCallError> {
		let user = self.user_facade.get_user();
		let memberships: Vec<&GroupMembership> = user
			.memberships
			.iter()
			.filter(|membership| {
				membership.group_type() == GroupType::Calendar && membership.capability == None
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
			log::info!(
				"Membership: {:?} {:?}",
				membership.clone()._id.unwrap().as_str(),
				membership.clone().capability
			);
			let group_info: GroupInfo = self
				.crypto_entity_client
				.load(&membership.groupInfo)
				.await?;
			let group_settings: Option<GroupSettings> = user_settings_group_root
				.groupSettings
				.iter()
				.find(|settings| settings.group == membership.group)
				.and_then(|settings| Some(settings.clone()));

			calendars_data.insert(
				membership.group.to_owned(),
				CalendarData {
					group_info,
					group_settings,
				},
			);
		}

		Ok(calendars_data)
	}

	/**
	 * Fetches calendar events from a given calendar starting on a given Date and Time
	 * until the end of the same day
	 */
	async fn fetch_calendar_events_from_date_until_end_of_day(
		&self,
		calendar_id: &GeneratedId,
		date: DateTime,
	) -> Result<CalendarEventsList, ApiCallError> {
		let id: GeneratedId = calendar_id.to_owned();
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

		let membership = match memberships.iter().find(|membership| membership.group == id) {
			Some(membership) => *membership,
			_ => {
				return Err(ApiCallError::internal(format!(
					"Missing membership for id {}",
					id
				)))
			},
		};

		let date_in_seconds = (date.as_millis() / 1000) as i64;

		let parsed_date = match OffsetDateTime::from_unix_timestamp(date_in_seconds) {
			Ok(date) => date.date().midnight().assume_utc(),
			Err(e) => return Err(ApiCallError::internal_with_err(e, "Invalid date")),
		};

		let Some(next_day) = parsed_date.date().next_day() else {
			return Err(ApiCallError::internal("Invalid next day".to_string()));
		};

		let timestamp_start = (parsed_date.unix_timestamp() * 1000) as u64; // x1000 to get the timestamp in milliseconds
		let timestamp_end = (OffsetDateTime::new_utc(next_day, Time::from_hms(0, 0, 0).unwrap())
			.unix_timestamp()
			* 1000) as u64; // x1000 to get the timestamp in milliseconds

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

			if loaded_short_events.is_err() {
				return Err(loaded_short_events
					.err()
					.expect("Failed to load short calendar events"));
			}
			let mut unwraped_short_events = loaded_short_events?;
			match self.is_list_load_done(&max_short_id, &mut unwraped_short_events) {
				Ok((is_done, new_start)) => {
					has_short_events_finished = is_done;
					start_short_id = new_start;
				},
				Err(e) => return Err(e),
			};
			let mut filtered_short_events = self.filter_events_in_range(
				date.as_millis(),
				timestamp_end,
				&mut unwraped_short_events,
			);
			short_events.append(&mut filtered_short_events);

			if loaded_long_events.is_err() {
				return Err(loaded_long_events
					.err()
					.expect("Failed to load long calendar events"));
			}

			let mut unwraped_long_events = loaded_long_events?;

			match self.is_list_load_done(&max_long_id, &mut unwraped_long_events) {
				Ok((is_done, new_start)) => {
					has_long_events_finished = is_done;
					start_long_id = new_start;
				},
				Err(e) => return Err(e),
			};

			let events_facade = EventFacade {};
			let mut advanced_instances: Vec<CalendarEvent> = Vec::new();

			let event_with_repeat_rules = unwraped_long_events
				.iter()
				.filter(|event| event.repeatRule.is_some())
				.collect::<Vec<&CalendarEvent>>();

			for event in event_with_repeat_rules.iter() {
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
								interval: adv.interval.to_owned(),
							})
							.collect(),
					},
					repeat_rule.interval as u8,
					EndType::try_from_primitive(repeat_rule.endType as u8).unwrap(),
					repeat_rule
						.endValue
						.and_then(|val| Some(val.unsigned_abs())),
					repeat_rule
						.excludedDates
						.iter()
						.map(|date| date.date)
						.collect(),
					None,
					Some(DateTime::from_millis(timestamp_end)),
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

			long_events.append(&mut filtered_long_events);
		}

		// We use i128 because 0 - u64::MAX overflows i64::MIN
		short_events.sort_by(|a, b| {
			((a.startTime.as_millis() as i128) - (b.startTime.as_millis() as i128))
				.cmp(&(a.startTime.as_millis() as i128))
		});
		long_events.sort_by(|a, b| {
			((a.startTime.as_millis() as i128) - (b.startTime.as_millis() as i128))
				.cmp(&(a.startTime.as_millis() as i128))
		});

		Ok(CalendarEventsList {
			short_events,
			long_events,
		})
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
		events: &mut Vec<CalendarEvent>,
	) -> Vec<CalendarEvent> {
		events
			.iter()
			.filter(|&event| {
				(event.startTime.as_millis() >= timestamp_start
					|| event.endTime.as_millis() > timestamp_start)
					&& event.startTime.as_millis() < timestamp_end
			})
			.map(|event| event.to_owned())
			.collect()
	}

	fn is_list_load_done(
		&self,
		max_id: &CustomId,
		events: &mut Vec<CalendarEvent>,
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
				.and_then(|settings| settings.name.to_owned())
				.unwrap_or_else(|| {
					if group_info.name.is_empty() {
						DEFAULT_CALENDAR_NAME.to_owned()
					} else {
						group_info.name.to_owned()
					}
				});
			let color = group_settings
				.as_ref()
				.and_then(|settings| Some(settings.color.to_owned()))
				.unwrap_or_else(|| DEFAULT_CALENDAR_COLOR.to_owned());

			let render_data = CalendarRenderData { name, color };

			calendars_render_data.insert(calendar_id, render_data);
		}
		calendars_render_data
	}

	pub async fn get_calendar_events(
		&self,
		calendar_id: &GeneratedId,
		date: DateTime,
	) -> CalendarEventsList {
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
// To keep the SDK decoupled and dependency free we decided to handle translations on native side
pub const DEFAULT_CALENDAR_NAME: &str = "";
pub const DEFAULT_CALENDAR_COLOR: &str = "2196f3";
pub const DEFAULT_SORT_EVENT_NAME: &str = "Short Event"; // Used only in tests
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
	use std::sync::Arc;

	use crate::crypto_entity_client::MockCryptoEntityClient;
	use crate::entities::generated::sys::{GroupInfo, GroupMembership, User};
	use crate::entities::generated::tutanota::{GroupSettings, UserSettingsGroupRoot};
	use crate::groups::GroupType;
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::create_test_entity;
	use crate::{GeneratedId, IdTupleGenerated};

	use super::{CalendarFacade, DEFAULT_CALENDAR_COLOR, DEFAULT_CALENDAR_NAME};

	fn create_mock_user(user_group: &GeneratedId, calendar_id: &GeneratedId) -> User {
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
				name: name.and_then(|s| Some(s.to_owned())),
				sourceUrl: source_url.and_then(|s| Some(s.to_owned())),
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
			name: name.unwrap_or(&"".to_string()).to_owned(),
			..create_test_entity()
		}
	}

	#[tokio::test]
	async fn test_private_default_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();

		let mock_user = create_mock_user(&user_group, &calendar_id);
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
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;

		assert_eq!(
			calendars_render_data.values().next().unwrap().name,
			DEFAULT_CALENDAR_NAME
		);
		assert_eq!(
			calendars_render_data.values().next().unwrap().color,
			DEFAULT_CALENDAR_COLOR
		);
	}

	#[tokio::test]
	async fn test_private_custom_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();
		let custom_color = "a5e4ac";
		let custom_name = "Private Custom Edited";

		let mock_user = create_mock_user(&user_group, &calendar_id);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root = create_mock_user_settings_group_root(
			Some(&calendar_id),
			Some(&custom_color),
			None,
			None,
		);
		mock_crypto_entity_client
			.expect_load::<UserSettingsGroupRoot, GeneratedId>()
			.return_const(Ok(mock_user_settings_group_root));

		let mock_group_info = create_mock_group_info(&calendar_id, Some(&custom_name));
		mock_crypto_entity_client
			.expect_load::<GroupInfo, IdTupleGenerated>()
			.return_const(Ok(mock_group_info));

		let calendar_facade = CalendarFacade::new(
			Arc::new(mock_crypto_entity_client),
			Arc::new(mock_user_facade),
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let render_data = calendars_render_data.values().next().unwrap();
		assert_eq!(render_data.name, custom_name);
		assert_eq!(render_data.color, custom_color);
	}

	#[tokio::test]
	async fn test_private_custom_calendar_no_name_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();
		let mock_user = create_mock_user(&user_group, &calendar_id);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let custom_color = "a5e4ac";
		let mock_user_settings_group_root = create_mock_user_settings_group_root(
			Some(&calendar_id),
			Some(&custom_color),
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
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let render_data = calendars_render_data.values().next().unwrap();
		assert_eq!(render_data.name, DEFAULT_CALENDAR_NAME);
		assert_eq!(render_data.color, custom_color);
	}

	#[tokio::test]
	async fn test_shared_calendar_render_info() {
		let mut mock_crypto_entity_client = MockCryptoEntityClient::default();
		let mut mock_user_facade = MockUserFacade::default();

		let user_group = GeneratedId::test_random();
		let calendar_id = GeneratedId::test_random();
		let custom_color = "e4c0a5";
		let custom_name = "Shared Calendar";

		let mock_user = create_mock_user(&user_group, &calendar_id);
		mock_user_facade.expect_get_user().return_const(mock_user);

		let mock_user_settings_group_root = create_mock_user_settings_group_root(
			Some(&calendar_id),
			Some(&custom_color),
			Some(&custom_name),
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
		);

		let calendars_render_data = calendar_facade.get_calendars_render_data().await;
		let render_data = calendars_render_data.values().next().unwrap();
		assert_eq!(render_data.name, custom_name.to_string());
		assert_eq!(render_data.color, custom_color);
	}
}
