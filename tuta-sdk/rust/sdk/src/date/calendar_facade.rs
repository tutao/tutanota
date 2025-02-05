use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::{GroupInfo, GroupMembership};
use crate::entities::generated::tutanota::{
	CalendarGroupRoot, GroupSettings, UserSettingsGroupRoot,
};
use crate::groups::GroupType;
use crate::user_facade::UserFacade;
use crate::ApiCallError;
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

#[uniffi::export]
impl CalendarFacade {
	pub async fn fetch_calendars_data(&self) -> Result<Vec<CalendarData>, ApiCallError> {
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

		let mut calendars: Vec<CalendarData> = vec![];
		let user_settings_group_root: UserSettingsGroupRoot = self
			.crypto_entity_client
			.load(&user.userGroup.group)
			.await?;

		for membership in memberships {
			let group_root: CalendarGroupRoot =
				self.crypto_entity_client.load(&membership.group).await?;
			let group_info: GroupInfo = self
				.crypto_entity_client
				.load(&membership.groupInfo)
				.await?;
			let group_settings: Option<GroupSettings> = user_settings_group_root
				.groupSettings
				.iter()
				.find(|settings| settings.group == membership.group)
				.and_then(|settings| Some(settings.clone()));

			calendars.push(CalendarData {
				group_root,
				group_info,
				group_settings,
			});
		}

		Ok(calendars)
	}
}
