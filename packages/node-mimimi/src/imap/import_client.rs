use crate::imap::credentials::ImapCredentials;
use mail_parser::MessageParser;
use std::borrow::Cow;
use std::collections::HashMap;
use std::sync::Arc;
use tuta_imap::client::types::mail::ImapMail;
use tuta_imap::client::types::reexports::{Mailbox, StatusKind};
use tuta_imap::client::TutaImapClient;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::key::VersionedAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::custom_id::CustomId;
use tutasdk::entities::tutanota::{DraftCreateData, DraftCreateReturn, DraftData};
use tutasdk::services::tutanota::DraftService;
use tutasdk::services::ExtraServiceParams;
use tutasdk::{ApiCallError, LoggedInSdk};

/// current state of the imap import for this tuta account
/// requires an initialized SDK!
#[cfg_attr(feature = "javascript", napi)]
#[cfg_attr(test, derive(Debug, PartialEq))]
pub enum ImapImportStatus {
	NotInitialized,
	Paused,
	Running,
	Postponed,
	Finished,
}

#[cfg_attr(feature = "javascript", napi(object))]
#[derive(Clone)]
pub struct ImapImportConfig {
	pub root_import_mail_folder_name: String,
	pub credentials: ImapCredentials,

	pub import_target_address: String,
}

#[derive(thiserror::Error, Debug)]
pub enum ImportError {
	#[error("Imap server responded with unparsable eml text")]
	InvalidEml(String),
}

#[cfg_attr(feature = "javascript", napi)]
pub struct ImapImport {
	pub status: ImapImportStatus,
	pub import_config: ImapImportConfig,

	randomizer_facade: RandomizerFacade,

	// todo:
	// keep map of user_mail_group_key? to avoid fetching ( or calculating ) it everytime
	// map of user-email address
	// ( there can be multiple mail group keys if user have multiple mailbox? ) to mail group key.
	//
	// if something is not in this map yet,
	// `Self::get_user_mail_group_key()` will try to fetch it from sdk and insert here
	// so to get the key, prefer to call that method instead
	// user_mail_group_key: HashMap<String, VersionedAesKey>,
	imap_client: TutaImapClient,
	tuta_sdk: Arc<LoggedInSdk>,
}

#[cfg(feature = "javascript")]
#[napi]
impl ImapImport {
	#[napi(factory)]
	pub fn initialize(imap_import_config: ImapImportConfig) -> Self {
		Self::new(imap_import_config, todo!())
	}

	#[napi]
	pub async unsafe fn continue_import_napi(&mut self) {
		self.continue_import().await
	}

	#[napi]
	pub async fn delete_import(&self) -> ImapImportStatus {
		todo!()
	}

	#[napi]
	pub async fn pause_import(&self) -> ImapImportStatus {
		todo!()
	}
}

impl ImapImport {
	pub fn new(import_config: ImapImportConfig, tuta_sdk: Arc<LoggedInSdk>) -> Self {
		let imap_client = TutaImapClient::new(
			import_config.credentials.host.as_str(),
			import_config.credentials.port,
		);
		Self {
			status: ImapImportStatus::NotInitialized,
			imap_client,
			import_config,
			tuta_sdk,
			randomizer_facade: RandomizerFacade::from_core(rand::rngs::OsRng {}),
		}
	}

	async fn get_mail_group_key(
		&self,
		mail_address: &str,
	) -> Result<VersionedAesKey, ApiCallError> {
		let sender_mail_group_id = self
			.tuta_sdk
			.mail_facade()
			.get_group_id_for_mail_address(mail_address)
			.await
			.unwrap();
		let mail_group_key = self
			.tuta_sdk
			.get_current_sym_group_key(&sender_mail_group_id)
			.await?;
		Ok(mail_group_key)
	}

	pub async fn continue_import(&mut self) {
		let imap_mail = self.get_mail_from_imap();
		let draft_return_data = self.upload_mail_to_tutanota(imap_mail).await.unwrap();

		// 8. do something with DraftServiceReturnData
		eprintln!("====================== yay! ===========================");
		eprintln!(
			"Successfully uploaded imap mail as draft. Data: {:?}",
			draft_return_data.draft
		);
		eprintln!("========================================================");

		// 9. everything is completed. update the status
		self.status = ImapImportStatus::Finished
	}

	fn get_mail_from_imap(&mut self) -> ImapMail {
		// 1. get updated capabilities
		self.imap_client
			.refresh_capabilities()
			.eq(&StatusKind::Ok)
			.then_some(())
			.expect("Cannot refresh capabilities");

		// 2. login
		self.imap_client
			.login(
				self.import_config
					.credentials
					.username
					.as_ref()
					.expect("Need imap username")
					.as_str(),
				self.import_config
					.credentials
					.password
					.as_ref()
					.expect("Need imap password")
					.as_str(),
			)
			.eq(&StatusKind::Ok)
			.then_some(())
			.expect("Can not login");

		// 3. select mailbox
		self.imap_client
			.select_mailbox(Mailbox::Inbox)
			.eq(&StatusKind::Ok)
			.then_some(())
			.expect("Cannot select INBOX mailbox");

		// 4. search for uid and get the first result
		self.imap_client
			.search_all_uid()
			.eq(&StatusKind::Ok)
			.then_some(())
			.expect("Cannot search for uid in INBOX");

		let target_mail_id = self
			.imap_client
			.latest_search_results
			.first()
			.expect("Empty search result")
			.clone();

		// 5. fetch the mail by uid
		self.imap_client
			.fetch_mail_by_uid(target_mail_id.clone())
			.eq(&StatusKind::Ok)
			.then_some(())
			.expect("Cannot fetch a mail id");
		let fetched_mail = self
			.imap_client
			.latest_mails
			.remove(&target_mail_id)
			.expect("No mail was fetched");

		fetched_mail
	}

	async fn upload_mail_to_tutanota(
		&mut self,
		fetched_mail: ImapMail,
	) -> Result<DraftCreateReturn, ImportError> {
		// 6. convert the fetched mail to tutanota draft data
		let mut create_draft_data = Self::make_tutanota_draft_input(
			self.import_config.import_target_address.as_str(),
			fetched_mail,
		)?;

		// 7. call DraftService
		// 7.1 construct a session key
		let new_aes_256_key = GenericAesKey::from_bytes(
			self.randomizer_facade
				.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();
		let mail_group_key = self
			.get_mail_group_key(self.import_config.import_target_address.as_str())
			.await
			.unwrap();
		let owner_enc_session_key =
			mail_group_key.encrypt_key(&new_aes_256_key, Iv::generate(&self.randomizer_facade));
		create_draft_data.ownerEncSessionKey = owner_enc_session_key.object;
		create_draft_data.ownerKeyVersion = owner_enc_session_key.version;

		// 7.2 make the service call
		let service_params = ExtraServiceParams {
			session_key: Some(new_aes_256_key),
			..Default::default()
		};
		let draft_return_data = self
			.tuta_sdk
			.get_service_executor()
			.post::<DraftService>(create_draft_data, service_params)
			.await
			.expect("Cannot execute DraftService");

		Ok(draft_return_data)
	}

	/// Convert the mail format from imap server to draft mail data
	fn make_tutanota_draft_input(
		importer_address: &str,
		imap_mail: ImapMail,
	) -> Result<DraftCreateData, ImportError> {
		let ImapMail { rfc822_full } = imap_mail;

		// parse the full mime message
		let imap_mail = MessageParser::new()
			.parse(rfc822_full.as_slice())
			.ok_or(ImportError::InvalidEml("Cannot parse rfc822 text".into()))?;

		// extract the bodies
		let mut combined_html_bodies = String::new();
		for body in imap_mail.html_bodies() {
			combined_html_bodies += body.text_contents().ok_or_else(|| {
				ImportError::InvalidEml(format!("Cannot get the text content of html_body"))
			})?;
		}

		// get the .from address
		let mail_parser::Addr {
			name: first_sender_name,
			address: first_sender_address,
		} = imap_mail
			.from()
			.map(|sender| sender.first())
			.flatten()
			.unwrap_or(&mail_parser::Addr {
				name: None,
				address: None,
			});

		// map to tutanota draftData
		let draft_create_data = DraftCreateData {
			_format: 0,
			conversationType: 0,
			ownerEncSessionKey: vec![],
			ownerKeyVersion: 0,
			previousMessageId: None,
			draftData: DraftData {
				subject: imap_mail.subject().unwrap_or("<empty subject>").to_string(),
				_id: CustomId::from_custom_string("aaaa"),
				bodyText: combined_html_bodies,
				compressedBodyText: None,
				confidential: false,
				method: 0,
				// we want to keep the actual sender mail address in original mail,
				// but draftService requires that senderMailAddress is the current user of this draft,
				senderMailAddress: importer_address.to_string(),
				senderName: first_sender_name
					.as_ref()
					.unwrap_or(&Cow::Borrowed(""))
					.to_string(),
				addedAttachments: vec![],
				bccRecipients: vec![],
				ccRecipients: vec![],
				removedAttachments: vec![],
				replyTos: vec![],
				toRecipients: vec![],
				_finalIvs: HashMap::new(),
			},
			_errors: None,
			_finalIvs: HashMap::new(),
		};
		Ok(draft_create_data)
	}
}

#[cfg(test)]
mod tests {
	use crate::imap::import_client::{
		ImapCredentials, ImapImport, ImapImportConfig, ImapImportStatus,
	};
	use mail_builder::MessageBuilder;
	use std::sync::Arc;
	use tuta_imap::testing::GreenMailTestServer;
	use tutasdk::net::native_rest_client::NativeRestClient;
	use tutasdk::Sdk;

	async fn init(sdk: Sdk) -> (ImapImport, GreenMailTestServer) {
		let logged_in_sdk = sdk
			.create_session("map-free@tutanota.de", "map")
			.await
			.unwrap();
		let greenmail = GreenMailTestServer::new();
		let imap_import_config = ImapImportConfig {
			root_import_mail_folder_name: "/".to_string(),
			credentials: ImapCredentials {
				host: "127.0.0.1".to_string(),
				port: greenmail.imaps_port.try_into().unwrap(),
				username: Some("sug@example.org".to_string()),
				password: Some("sug".to_string()),
				access_token: None,
			},
			import_target_address: "map-free@tutanota.de".to_string(),
		};

		let importer = ImapImport::new(imap_import_config, logged_in_sdk);

		(importer, greenmail)
	}

	#[tokio::test]
	async fn can_upload_to_draft_server() {
		let sdk = Sdk::new(
			"http://localhost:9000".to_string(),
			Arc::new(NativeRestClient::try_new().unwrap()),
		);
		let (mut importer, greenmail) = init(sdk).await;
		let email = MessageBuilder::new()
            .from(("Matthias", "map@example.org"))
            .to(("Johannes", "jmp@example.org"))
            .subject("Hello from imap 😀! -- Список.doc")
            .text_body("Hello tutao! this is the first step to have email import.Want to see html 😀?<p style='color:red'>red</p>")
            .write_to_string()
            .unwrap();
		greenmail.store_mail("sug@example.org", email.as_str());

		importer.continue_import().await;
		assert_eq!(ImapImportStatus::Finished, importer.status);
	}
}
