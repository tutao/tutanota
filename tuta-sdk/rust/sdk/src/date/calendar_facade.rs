use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::{GroupInfo, GroupMembership};
use crate::entities::generated::tutanota::{
	CalendarEvent, CalendarGroupRoot, GroupSettings, UserSettingsGroupRoot,
};
use crate::groups::GroupType;
use crate::user_facade::UserFacade;
use crate::{ApiCallError, GeneratedId};
use std::collections::HashMap;
use std::sync::Arc;

#[derive(uniffi::Object)]
pub struct CalendarFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
}

#[derive(uniffi::Record)]
pub struct CalendarData {
	group_root: CalendarGroupRoot,
	group_info: GroupInfo,
	group_settings: Option<GroupSettings>,
}

#[derive(uniffi::Record)]
pub struct CalendarRenderData {
	pub name: String,
	pub color: String,
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
}

pub const DEFAULT_CALENDAR_NAME: &str = "Private"; // FIXME get translations?
pub const DEFAULT_CALENDAR_COLOR: &str = "2196f3";

#[uniffi::export]
impl CalendarFacade {
	pub async fn fetch_calendars_data(
		&self,
	) -> Result<HashMap<GeneratedId, CalendarRenderData>, ApiCallError> {
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

		let mut calendars_render_data: HashMap<GeneratedId, CalendarRenderData> = HashMap::new();
		let user_settings_group_root: UserSettingsGroupRoot = self
			.crypto_entity_client
			.load(&user.userGroup.group)
			.await?;

		for membership in memberships {
			// let group_root: CalendarGroupRoot =
			// 	self.crypto_entity_client.load(&membership.group).await?;
			let group_info: GroupInfo = self
				.crypto_entity_client
				.load(&membership.groupInfo)
				.await?;
			let group_settings: Option<GroupSettings> = user_settings_group_root
				.groupSettings
				.iter()
				.find(|settings| settings.group == membership.group)
				.and_then(|settings| Some(settings.clone()));

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

			calendars_render_data.insert(membership.group.to_owned(), render_data);
		}

		Ok(calendars_render_data)
	}

	pub fn fetch_calendar_events(
		&self,
		calendar_id: GeneratedId,
	) -> Result<Vec<CalendarEvent>, ApiCallError> {
		unimplemented!()
	}
}
