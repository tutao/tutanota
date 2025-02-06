use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::{GroupInfo, GroupMembership};
use crate::entities::generated::tutanota::{
	CalendarEvent, CalendarGroupRoot, GroupSettings, UserSettingsGroupRoot,
};
use crate::groups::GroupType;
use crate::user_facade::UserFacade;
use crate::{ApiCallError, GeneratedId, ListLoadDirection};
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use chrono::{Datelike, Local, Timelike};
use std::collections::HashMap;
use std::sync::Arc;

#[derive(uniffi::Object)]
pub struct CalendarFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
}

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

		// Get the current local time
		let now = Local::now();

		// Get the beginning of the current month
		let beginning_of_month = now
			.with_day(1)
			.unwrap()
			.with_hour(0)
			.unwrap()
			.with_minute(0)
			.unwrap()
			.with_second(0)
			.unwrap()
			.with_nanosecond(0)
			.unwrap();

		// Get the timestamp
		let timestamp = beginning_of_month.timestamp();

		let short_events = self
			.crypto_entity_client
			.load_range(
				&group_root.shortEvents,
				&self.get_event_element_min_id(timestamp),
				200,
				ListLoadDirection::ASC,
			)
			.await?;
		let long_events = self
			.crypto_entity_client
			.load_range(
				&group_root.longEvents,
				&self.get_event_element_min_id(timestamp),
				200,
				ListLoadDirection::ASC,
			)
			.await?;
		Ok(CalendarEventsList {
			short_events,
			long_events,
		})
	}

	pub fn get_event_element_min_id(&self, timestamp: i64) -> GeneratedId {
		GeneratedId(self.create_event_element_id(timestamp, -DAYS_SHIFTED_MS))
	}

	fn create_event_element_id(&self, timestamp: i64, shift_days: i64) -> String {
		self.string_to_custom_id(format!("{}{}", timestamp, shift_days))
	}

	/**
	 * Converts a string to a custom id. Attention: the custom id must be intended to be derived from a string.
	 */
	fn string_to_custom_id(&self, string: String) -> String {
		CalendarFacade::base64to_base64url(&BASE64_URL_SAFE_NO_PAD.encode(string.as_bytes()))
	}

	/**
	 * Converts a base64 string to a url-conform base64 string. This is used for
	 * base64 coded url parameters.
	 *
	 * @param base64 The base64 string.
	 * @return The base64url string.
	 */
	fn base64to_base64url(base64: &str) -> String {
		let base64url = base64.replace('+', "-").replace('/', "_").replace('=', "");
		base64url
	}
}

pub const DAY_IN_MILLIS: i64 = 1000 * 60 * 60 * 24;
/**
 * the time in ms that element ids for calendar events and alarms  get randomized by
 */
pub const DAYS_SHIFTED_MS: i64 = 15 * DAY_IN_MILLIS;

pub const DEFAULT_CALENDAR_NAME: &str = "Private"; // FIXME get translations?
pub const DEFAULT_CALENDAR_COLOR: &str = "2196f3";

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
