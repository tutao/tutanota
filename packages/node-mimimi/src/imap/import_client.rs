use crate::imap::credentials::ImapCredentials;
use std::collections::HashMap;
use std::sync::Arc;
use tuta_imap::client::types::mail::ImapMail;
use tuta_imap::client::types::reexports::{Mailbox, StatusKind};
use tuta_imap::client::TutanotaImapClient;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::key::VersionedAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::crypto::Aes256Key;
use tutasdk::custom_id::CustomId;
use tutasdk::entities::tutanota::{DraftCreateData, DraftCreateReturn, DraftData};
use tutasdk::generated_id::GeneratedId;
use tutasdk::services::service_executor::ServiceExecutor;
use tutasdk::services::tutanota::DraftService;
use tutasdk::services::ExtraServiceParams;
use tutasdk::LoggedInSdk;

#[napi(object)]
#[derive(Clone)]
pub struct ImapImportParams {
	pub root_import_mail_folder_name: String,
	pub credentials: ImapCredentials,
}

/// current state of the imap import for this tuta account
/// requires an initialized SDK!
#[napi]
pub enum ImapImportStatus {
	NotInitialized,
	Paused,
	Running,
	Postponed,
	Finished,
}

#[napi(object)]
#[derive(Clone)]
pub struct ImapImportConfig {
	pub params: ImapImportParams,
}

#[napi]
pub struct ImapImport {
	pub status: ImapImportStatus,
	pub import_config: ImapImportConfig,

	randomizer_facade: RandomizerFacade,

	imap_client: TutanotaImapClient,
	tuta_sdk: Arc<LoggedInSdk>,

	mail_group_key: VersionedAesKey,
}

#[napi]
impl ImapImport {
	#[napi(factory)]
	pub fn initialize(imap_import_config: ImapImportConfig) -> Self {
		Self::new(imap_import_config, todo!(), todo!())
	}

	#[napi]
	pub async unsafe fn continue_import(&mut self) {
		let imap_mail = self.get_mail_from_imap();
		let draft_return_data = self.upload_mail_to_tutanota(imap_mail).await;

		// 8. do something with DraftServiceReturnData
		eprintln!("====================== yay! ===========================");
		eprintln!("Successfully uploaded imap mail as draft. Data: {draft_return_data:?}");
		eprintln!("========================================================");

		// 9. everything is completed. update the status
		self.status = ImapImportStatus::Finished
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
	pub fn new(
		import_config: ImapImportConfig,
		tuta_sdk: Arc<LoggedInSdk>,
		mail_group_key: VersionedAesKey,
	) -> Self {
		let imap_client = TutanotaImapClient::start_new_session(
			import_config.params.credentials.port.parse().unwrap(),
		);
		Self {
			status: ImapImportStatus::NotInitialized,
			imap_client,
			import_config,
			tuta_sdk,
			mail_group_key,
			randomizer_facade: RandomizerFacade::from_core(rand::rngs::OsRng {}),
		}
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
					.params
					.credentials
					.username
					.as_ref()
					.map(String::as_str)
					.unwrap_or("test@greenmail.org"),
				self.import_config
					.params
					.credentials
					.password
					.as_ref()
					.map(String::as_str)
					.unwrap_or("password"),
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

	async fn upload_mail_to_tutanota(&mut self, fetched_mail: ImapMail) -> DraftCreateReturn {
		// 6. convert the fetched mail to tutanota draft data
		let create_draft_data = Self::make_tutanota_draft_input(fetched_mail);

		// 7. call DraftService
		// 7.1 construct a session key

		let new_aes_256_key = Aes256Key::from_bytes(
			self.randomizer_facade
				.generate_random_array::<32>()
				.as_slice(),
		)
		.unwrap();
		let owner_enc_session_key = self.mail_group_key.encrypt_key(
			&GenericAesKey::Aes256(new_aes_256_key),
			Iv::generate(&self.randomizer_facade),
		);
		let session_key = GenericAesKey::from_bytes(owner_enc_session_key.object.as_slice())
			.expect("Cannot create session key from ownerSessionKey");

		// 7.2 make the service call
		let service_params = ExtraServiceParams {
			session_key: Some(session_key),
			..Default::default()
		};
		let draft_return_data = self
			.tuta_sdk
			.service_executor
			.post::<DraftService>(create_draft_data, service_params)
			.await
			.expect("Cannot execute DraftService");

		draft_return_data
	}

	/// Convert the mail format from imap server to draft mail data
	fn make_tutanota_draft_input(imap_mail: ImapMail) -> DraftCreateData {
		let ImapMail { subject } = imap_mail;

		DraftCreateData {
			_format: 0,
			conversationType: 0,
			ownerEncSessionKey: vec![],
			ownerKeyVersion: 0,
			previousMessageId: None,
			draftData: DraftData {
				subject,
				_id: CustomId::from_custom_string("aaaa"),
				bodyText: "this is a mail from imap".to_string(),
				compressedBodyText: None,
				confidential: false,
				method: 0,
				senderMailAddress: "map-free@tutanota.de".to_string(),
				senderName: "Tutanota Map".to_string(),
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
		}
	}
}

#[cfg(test)]
mod tests {
    use crate::imap::credentials::ImapCredentials;
    use std::sync::Arc;
    use tuta_imap::testing::GreenMailTestServer;
    use tutasdk::net::native_rest_client::NativeRestClient;
    use tutasdk::{Sdk, CLIENT_VERSION};

    async fn init(sdk: Sdk) -> (super::ImapImport, GreenMailTestServer) {
		let logged_in_sdk = sdk
			.create_session("map-free@tutanota.de", "map")
			.await
			.unwrap();
		let greenmail = GreenMailTestServer::new();
		let imap_import_config = super::ImapImportConfig {
			params: super::ImapImportParams {
				root_import_mail_folder_name: "/".to_string(),
				credentials: ImapCredentials {
					host: "127.0.0.1".to_string(),
					port: greenmail.imaps_port.to_string(),
					username: Some("sug@example.org".to_string()),
					password: Some("sug".to_string()),
					access_token: None,
				},
			},
		};
		let mail_group_id = logged_in_sdk
			.mail_facade()
			.get_group_id_for_mail_address("map-free@tutanota.de")
			.await
			.unwrap();
		eprintln!(">>>>> Mail Group Id: {mail_group_id:?}");

		let mail_group_key = todo!();
		let importer = super::ImapImport::new(imap_import_config, logged_in_sdk, mail_group_key);

		(importer, greenmail)
	}

	#[tokio::test]
	async fn can_upload_to_draft_server() {
		let sdk = Sdk::new(
			"http://localhost:9000".to_string(),
			Arc::new(NativeRestClient::try_new().unwrap()),
			CLIENT_VERSION.to_string(),
		);
		let (mut importer, greenmail) = init(sdk).await;

		// 1. construct ImapMail
		greenmail.store_mail("sug@example.org", "Subject: Find me if you can");
		let imap_mail = importer.get_mail_from_imap();

		// 2. start local tutadb server?
		{}

		// 3. call ImapImp::upload_mail_to_server
		let uploaded_draft_id = importer.upload_mail_to_tutanota(imap_mail).await;
	}
}
