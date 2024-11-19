#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::generated::sys::{Group, GroupInfo, User};
use crate::entities::generated::tutanota::{
	Mail, MailBox, MailFolder, MailboxGroupRoot, SimpleMoveMailPostIn, UnreadMailStatePostIn,
};
use crate::folder_system::{FolderSystem, MailSetKind};
use crate::groups::GroupType;
use crate::id::id_tuple::IdTupleGenerated;
use crate::rest_error::HttpError;
use crate::services::generated::tutanota::{SimpleMoveMailService, UnreadMailStateService};
#[cfg_attr(test, mockall_double::double)]
use crate::services::service_executor::ResolvingServiceExecutor;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::GeneratedId;
use crate::{ApiCallError, ListLoadDirection};
use std::sync::Arc;

/// Provides high level functions to manipulate mail entities via the REST API
#[derive(uniffi::Object)]
pub struct MailFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
	user_facade: Arc<UserFacade>,
	service_executor: Arc<ResolvingServiceExecutor>,
}

impl MailFacade {
	pub fn new(
		crypto_entity_client: Arc<CryptoEntityClient>,
		user_facade: Arc<UserFacade>,
		service_executor: Arc<ResolvingServiceExecutor>,
	) -> Self {
		MailFacade {
			crypto_entity_client,
			user_facade,
			service_executor,
		}
	}
}

/// Maximum number of mails that can be moved or modified in a single request.
///
/// If higher, it needs to be sent in batches or else the request will return HTTP Bad Request.
const MAX_MAIL_UPDATE_LIMIT: usize = 50;

/// All allowed targets for the SimpleMoveMailService.
///
/// This should be kept up-to-date with the server if any more targets are desired.
const ALLOWED_SIMPLE_MOVE_MAIL_TARGETS: &[MailSetKind] = &[MailSetKind::Trash];

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

	pub fn get_crypto_entity_client(&self) -> Arc<CryptoEntityClient> {
		self.crypto_entity_client.clone()
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

	/// Invoke the SimpleMoveMail service to move mail(s) to the first folder of a given folder
	/// type in their respective mailboxes.
	///
	/// # Panics
	///
	/// Panics if `folder_type` is unsupported by the SimpleMoveMailService.
	pub async fn simple_move_mail(
		&self,
		mut mails: Vec<IdTupleGenerated>,
		folder_type: MailSetKind,
	) -> Result<(), ApiCallError> {
		assert!(
			ALLOWED_SIMPLE_MOVE_MAIL_TARGETS.contains(&folder_type),
			"{folder_type:?} is not supported by SimpleMoveMailService"
		);

		mails.dedup();
		for mail in mails.chunks(MAX_MAIL_UPDATE_LIMIT) {
			self.service_executor
				.post::<SimpleMoveMailService>(
					SimpleMoveMailPostIn {
						_format: 0,
						destinationSetType: folder_type as i64,
						mails: mail.to_vec(),
					},
					Default::default(),
				)
				.await?;
		}

		Ok(())
	}
}

#[uniffi::export]
impl MailFacade {
	/// Gets an email (an entity/instance of `Mail`) from the backend
	pub async fn load_email_by_id_encrypted(
		&self,
		id_tuple: &IdTupleGenerated,
	) -> Result<Mail, ApiCallError> {
		self.crypto_entity_client
			.load::<Mail, IdTupleGenerated>(id_tuple)
			.await
	}

	pub async fn get_group_id_for_mail_address(
		&self,
		mail_address: &str,
	) -> Result<GeneratedId, ApiCallError> {
		let logged_in_user: Arc<User> = self.user_facade.get_user();
		let mail_group_memberships = logged_in_user
			.memberships
			.iter()
			.filter(|membership| Some(GroupType::Mail as i64) == membership.groupType);

		for mail_group_membership in mail_group_memberships.into_iter() {
			let group: Group = self
				.crypto_entity_client
				.load(&mail_group_membership.group)
				.await?;

			match (&group.user, &logged_in_user._id) {
				(None, _) => {
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
				(Some(group_user_id), Some(logged_in_user_id))
					if logged_in_user_id == group_user_id =>
				{
					let user_group_info: GroupInfo = self
						.crypto_entity_client
						.load(&logged_in_user.userGroup.groupInfo)
						.await?;
					let enabled_mail_addresses =
						get_enabled_mail_addresses_for_group_info(&user_group_info);
					if enabled_mail_addresses.contains(&mail_address.to_string()) {
						return Ok(mail_group_membership.group.clone());
					}
				},
				(Some(_), _) => continue,
			}
		}

		Err(HttpError::NotFoundError.into())
	}

	/// Mark mails as read/unread.
	///
	/// This is used to avoid having to get the Mail instance, edit it locally to change unread, and
	/// then upload (PUT) it back on the server, as it directly invokes the UnreadMailStateService.
	pub async fn set_unread_status_for_mails(
		&self,
		mut mails: Vec<IdTupleGenerated>,
		unread: bool,
	) -> Result<(), ApiCallError> {
		mails.dedup();
		for mail in mails.chunks(MAX_MAIL_UPDATE_LIMIT) {
			self.service_executor
				.post::<UnreadMailStateService>(
					UnreadMailStatePostIn {
						_format: 0,
						unread,
						mails: mail.to_vec(),
					},
					Default::default(),
				)
				.await?;
		}
		Ok(())
	}

	/// Move the given mails to the trash.
	///
	/// This is used to avoid having to load the user's mailbox, folders, etc., as it directly
	/// invokes the SimpleMoveMailService. It can also be used to move multiple Mails across
	/// different mailboxes that the user has access to, moving each Mail to their respective
	/// Trash folders.
	pub async fn trash_mails(&self, mails: Vec<IdTupleGenerated>) -> Result<(), ApiCallError> {
		self.simple_move_mail(mails, MailSetKind::Trash).await
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

#[cfg(test)]
mod tests {
	use super::UnreadMailStatePostIn;
	use crate::crypto_entity_client::MockCryptoEntityClient;
	use crate::entities::generated::tutanota::SimpleMoveMailPostIn;
	use crate::folder_system::MailSetKind;
	use crate::mail_facade::MailFacade;
	use crate::services::generated::tutanota::SimpleMoveMailService;
	use crate::services::generated::tutanota::UnreadMailStateService;
	use crate::services::service_executor::MockResolvingServiceExecutor;
	use crate::user_facade::MockUserFacade;
	use crate::GeneratedId;
	use crate::IdTupleGenerated;
	use mockall::predicate::{always, eq};
	use std::sync::Arc;

	#[tokio::test]
	async fn mark_mail_split() {
		async fn do_test(unread: bool) {
			let mut executor = MockResolvingServiceExecutor::default();
			let mails = generate_id_tuples(100);
			let first_invocation = UnreadMailStatePostIn {
				_format: 0,
				unread,
				mails: mails[..50].to_vec(),
			};
			let second_invocation = UnreadMailStatePostIn {
				_format: 0,
				unread,
				mails: mails[50..].to_vec(),
			};

			executor
				.expect_post::<UnreadMailStateService>()
				.with(eq(first_invocation), always())
				.returning(|_, _| Ok(()));

			executor
				.expect_post::<UnreadMailStateService>()
				.with(eq(second_invocation), always())
				.returning(|_, _| Ok(()));

			let facade = MailFacade::new(
				Arc::new(MockCryptoEntityClient::default()),
				Arc::new(MockUserFacade::default()),
				Arc::new(executor),
			);
			facade
				.set_unread_status_for_mails(mails, unread)
				.await
				.unwrap();
		}
		do_test(true).await;
		do_test(false).await;
	}

	#[tokio::test]
	async fn mark_mail_deduped() {
		async fn do_test(unread: bool) {
			let mut executor = MockResolvingServiceExecutor::default();
			let mails: Vec<IdTupleGenerated> = std::iter::repeat(IdTupleGenerated::new(
				GeneratedId::test_random(),
				GeneratedId::test_random(),
			))
			.take(100)
			.collect();

			let invocation = UnreadMailStatePostIn {
				_format: 0,
				unread,
				mails: vec![mails[0].clone()],
			};

			executor
				.expect_post::<UnreadMailStateService>()
				.with(eq(invocation), always())
				.returning(|_, _| Ok(()));

			let facade = MailFacade::new(
				Arc::new(MockCryptoEntityClient::default()),
				Arc::new(MockUserFacade::default()),
				Arc::new(executor),
			);
			facade
				.set_unread_status_for_mails(mails, unread)
				.await
				.unwrap();
		}
		do_test(true).await;
		do_test(false).await;
	}

	#[tokio::test]
	async fn mark_mail_once() {
		async fn do_test(unread: bool) {
			let mut executor = MockResolvingServiceExecutor::default();
			let mails = generate_id_tuples(1);
			let invocation = UnreadMailStatePostIn {
				_format: 0,
				unread,
				mails: mails.clone(),
			};
			executor
				.expect_post::<UnreadMailStateService>()
				.with(eq(invocation), always())
				.returning(|_, _| Ok(()));
			let facade = MailFacade::new(
				Arc::new(MockCryptoEntityClient::default()),
				Arc::new(MockUserFacade::default()),
				Arc::new(executor),
			);
			facade
				.set_unread_status_for_mails(mails, unread)
				.await
				.unwrap();
		}
		do_test(true).await;
		do_test(false).await;
	}

	#[tokio::test]
	async fn trash_mail_split() {
		let mut executor = MockResolvingServiceExecutor::default();
		let mails = generate_id_tuples(100);
		let first_invocation = SimpleMoveMailPostIn {
			_format: 0,
			mails: mails[..50].to_vec(),
			destinationSetType: MailSetKind::Trash as i64,
		};
		let second_invocation = SimpleMoveMailPostIn {
			_format: 0,
			mails: mails[50..].to_vec(),
			destinationSetType: MailSetKind::Trash as i64,
		};

		executor
			.expect_post::<SimpleMoveMailService>()
			.with(eq(first_invocation), always())
			.returning(|_, _| Ok(()));

		executor
			.expect_post::<SimpleMoveMailService>()
			.with(eq(second_invocation), always())
			.returning(|_, _| Ok(()));

		let facade = MailFacade::new(
			Arc::new(MockCryptoEntityClient::default()),
			Arc::new(MockUserFacade::default()),
			Arc::new(executor),
		);
		facade.trash_mails(mails).await.unwrap();
	}

	#[tokio::test]
	async fn trash_mail_dedupe() {
		let mut executor = MockResolvingServiceExecutor::default();
		let mails: Vec<IdTupleGenerated> = std::iter::repeat(IdTupleGenerated::new(
			GeneratedId::test_random(),
			GeneratedId::test_random(),
		))
		.take(100)
		.collect();
		let invocation = SimpleMoveMailPostIn {
			_format: 0,
			mails: vec![mails[0].clone()],
			destinationSetType: MailSetKind::Trash as i64,
		};
		executor
			.expect_post::<SimpleMoveMailService>()
			.with(eq(invocation), always())
			.returning(|_, _| Ok(()));
		let facade = MailFacade::new(
			Arc::new(MockCryptoEntityClient::default()),
			Arc::new(MockUserFacade::default()),
			Arc::new(executor),
		);
		facade.trash_mails(mails).await.unwrap();
	}

	#[tokio::test]
	async fn trash_mail_one() {
		let mut executor = MockResolvingServiceExecutor::default();
		let mails = generate_id_tuples(1);
		let invocation = SimpleMoveMailPostIn {
			_format: 0,
			mails: mails.clone(),
			destinationSetType: MailSetKind::Trash as i64,
		};
		executor
			.expect_post::<SimpleMoveMailService>()
			.with(eq(invocation), always())
			.returning(|_, _| Ok(()));
		let facade = MailFacade::new(
			Arc::new(MockCryptoEntityClient::default()),
			Arc::new(MockUserFacade::default()),
			Arc::new(executor),
		);
		facade.trash_mails(mails).await.unwrap();
	}

	fn generate_id_tuples(amt: usize) -> Vec<IdTupleGenerated> {
		std::iter::repeat_with(|| {
			IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random())
		})
		.take(amt)
		.collect()
	}
}
