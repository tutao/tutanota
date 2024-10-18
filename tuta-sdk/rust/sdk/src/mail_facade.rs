#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::sys::{Group, GroupInfo, User};
use crate::entities::tutanota::Mail;
use crate::generated_id::GeneratedId;
use crate::rest_error::HttpError;
use crate::tutanota_constants::GroupType;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::{ApiCallError, IdTuple};
use std::sync::Arc;

/// Provides high level functions to manipulate mail entities via the REST API
#[derive(uniffi::Object)]
pub struct MailFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
}

impl MailFacade {
	pub fn new(
		crypto_entity_client: Arc<CryptoEntityClient>,
		user_facade: Arc<UserFacade>,
	) -> Self {
		MailFacade {
			crypto_entity_client,
			user_facade,
		}
	}
}

#[uniffi::export]
impl MailFacade {
	/// Gets an email (an entity/instance of `Mail`) from the backend
	pub async fn load_email_by_id_encrypted(
		&self,
		id_tuple: &IdTuple,
	) -> Result<Mail, ApiCallError> {
		self.crypto_entity_client
			.load::<Mail, IdTuple>(id_tuple)
			.await
	}

	pub async fn get_group_id_for_mail_address(
		&self,
		mail_address: &str,
	) -> Result<GeneratedId, ApiCallError> {
		let user = self.user_facade.get_user();
		let mail_group_memberships = user
			.memberships
			.iter()
			.filter(|membership| Some(GroupType::Mail as i64) == membership.groupType);

		for mail_group_membership in mail_group_memberships.into_iter() {
			let group: Group = self
				.crypto_entity_client
				.load(&mail_group_membership.group)
				.await?;
			match group.user {
				None => {
					let mail_group_info: GroupInfo = self
						.crypto_entity_client
						.load(&mail_group_membership.groupInfo)
						.await?;

					let enabled_mail_addresses =
						get_enabled_mail_addresses_for_group_info(&mail_group_info);
					if enabled_mail_addresses.contains(&mail_address.to_string()) {
						return Ok(mail_group_membership.group.clone());
					}
				},
				Some(user_id) if user._id == user_id => {
					let user_group_info: GroupInfo = self
						.crypto_entity_client
						.load(&user.userGroup.groupInfo)
						.await?;
					let enabled_mail_addresses =
						get_enabled_mail_addresses_for_group_info(&user_group_info);
					if enabled_mail_addresses.contains(&mail_address.to_string()) {
						return Ok(mail_group_membership.group.clone());
					}
				},
				Some(_) => continue,
			}
		}

		Err(HttpError::NotFoundError.into())
	}
}

fn get_enabled_mail_addresses_for_group_info(group_info: &GroupInfo) -> Vec<String> {
	group_info
		.mailAddressAliases
		.iter()
		.filter(|alias| alias.enabled)
		.map(|alias| alias.mailAddress.clone())
		.chain(group_info.mailAddress.clone())
		.collect()
}
