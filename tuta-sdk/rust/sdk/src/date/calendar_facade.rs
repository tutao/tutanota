#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::{GroupInfo, GroupMembership};
use crate::entities::generated::tutanota::{
	CalendarEvent, CalendarGroupRoot, GroupSettings, UserSettingsGroupRoot,
};
use crate::groups::GroupType;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::{ApiCallError, GeneratedId, ListLoadDirection};
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use std::collections::HashMap;
use std::sync::Arc;
use time::OffsetDateTime;

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
			.filter(|membership| membership.group_type() == GroupType::Calendar)
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
		* Fetches calendar events of the current month for a specified calendar
		*/
	async fn fetch_calendar_events(
		&self,
		calendar_id: &GeneratedId,
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
		let membership: &GroupMembership = memberships
			.iter()
			.find(|membership| membership.group == id)
			.unwrap();
		let group_root: CalendarGroupRoot =
			self.crypto_entity_client.load(&membership.group).await?;

		let local = OffsetDateTime::now_utc();
		let beginning_of_month = local.date().replace_day(1).unwrap().midnight();
		let timestamp = beginning_of_month
			.assume_offset(local.offset())
			.unix_timestamp()
			* 1000; // x1000 to get the timestamp in milliseconds

		let short_events = self
			.crypto_entity_client
			.load_range(
				&group_root.shortEvents,
				&get_event_element_min_id(timestamp),
				200,
				ListLoadDirection::ASC,
			)
			.await?;
		let long_events = self
			.crypto_entity_client
			.load_range(
				&group_root.longEvents,
				&get_event_element_min_id(timestamp),
				200,
				ListLoadDirection::ASC,
			)
			.await?;
		Ok(CalendarEventsList {
			short_events,
			long_events,
		})
	}
}

#[uniffi::export]
impl CalendarFacade {
	pub async fn get_calendars_render_data(&self) -> HashMap<GeneratedId, CalendarRenderData> {
		let calendars_data = self.fetch_calendars_data().await.unwrap();

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

	pub async fn get_calendar_events(&self, calendar_id: &GeneratedId) -> CalendarEventsList {
		self.fetch_calendar_events(calendar_id).await.unwrap()
	}
}

pub const DAY_IN_MILLIS: i64 = 1000 * 60 * 60 * 24;
/**
 * The time in ms that element ids for calendar events and alarms  get randomized by
 */
pub const DAYS_SHIFTED_MS: i64 = 15 * DAY_IN_MILLIS;
// To keep the SDK decoupled and dependency free we decided to handle translations on native side
pub const DEFAULT_CALENDAR_NAME: &str = "";
pub const DEFAULT_CALENDAR_COLOR: &str = "2196f3";
pub const DEFAULT_SORT_EVENT_NAME: &str = "Short Event"; // Used only in tests
pub const DEFAULT_LONG_EVENT_NAME: &str = "Long Event"; // Used only in tests

fn get_event_element_min_id(timestamp: i64) -> GeneratedId {
	GeneratedId(create_event_element_id(timestamp, -DAYS_SHIFTED_MS))
}

fn create_event_element_id(timestamp: i64, shift_days: i64) -> String {
	string_to_custom_id(format!("{}{}", timestamp, shift_days))
}

/**
 * Converts a string to a custom id. Attention: the custom id must be intended to be derived from a string.
 */
fn string_to_custom_id(string: String) -> String {
	base64_to_base64url(&BASE64_URL_SAFE_NO_PAD.encode(string.as_bytes()))
}

/**
 * Converts a base64 string to a url-conform base64 string. This is used for
 * base64 coded url parameters.
 */
fn base64_to_base64url(base64: &str) -> String {
	let base64url = base64.replace('+', "-").replace('/', "_").replace('=', "");
	base64url
}

#[cfg(test)]
mod calendar_facade_unit_tests {
	use super::{CalendarFacade, DEFAULT_CALENDAR_COLOR, DEFAULT_CALENDAR_NAME};
	use crate::crypto_entity_client::MockCryptoEntityClient;
	use crate::entities::generated::sys::{GroupInfo, GroupMembership, User};
	use crate::entities::generated::tutanota::{GroupSettings, UserSettingsGroupRoot};
	use crate::groups::GroupType;
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::create_test_entity;
	use crate::{GeneratedId, IdTupleGenerated};
	use std::sync::Arc;

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
