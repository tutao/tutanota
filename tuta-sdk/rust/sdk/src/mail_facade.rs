use std::sync::Arc;

#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::tutanota::{Mail, MailBox, MailFolder, MailboxGroupRoot};
use crate::folder_system::FolderSystem;
use crate::generated_id::GeneratedId;
use crate::groups::GroupType;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::{ApiCallError, IdTuple, ListLoadDirection};

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

impl MailFacade {
	pub async fn load_user_mailbox(&self) -> Result<MailBox, ApiCallError> {
		let user = self.user_facade.get_user();
		let mail_group_ship = user
			.memberships
			.iter()
			.find(|m| m.group_type() == GroupType::Mail)
			.ok_or_else(|| ApiCallError::internal("User does not have mail group".to_owned()))?;
		let group_root: MailboxGroupRoot = self
			.crypto_entity_client
			.load(&mail_group_ship.group)
			.await?;
		let mailbox: MailBox = self.crypto_entity_client.load(&group_root.mailbox).await?;
		Ok(mailbox)
	}

	pub async fn load_folders_for_mailbox(
		&self,
		mailbox: &MailBox,
	) -> Result<FolderSystem, ApiCallError> {
		let folders_list = &mailbox.folders.as_ref().unwrap().folders;
		let folders: Vec<MailFolder> = self
			.crypto_entity_client
			.load_range(
				folders_list,
				&GeneratedId::min_id(),
				100,
				ListLoadDirection::ASC,
			)
			.await?;
		Ok(FolderSystem::new(folders))
	}

	pub async fn load_mails_in_folder(
		&self,
		folder: &MailFolder,
	) -> Result<Vec<Mail>, ApiCallError> {
		// TODO: real arguments
		// TODO: this is a placeholder impl that doesn't work with mail sets
		let mail_list_id = &folder.mails;
		let mails = self
			.crypto_entity_client
			.load_range(
				mail_list_id,
				&GeneratedId::max_id(),
				20,
				ListLoadDirection::DESC,
			)
			.await?;
		Ok(mails)
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
}
