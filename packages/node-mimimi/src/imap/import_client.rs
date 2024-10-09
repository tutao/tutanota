use crate::imap::credentials::ImapCredentials;
use std::collections::HashMap;
use tuta_imap::client::types::mail::ImapMail;
use tuta_imap::client::types::reexports::{Mailbox, StatusKind};
use tuta_imap::client::TutanotaImapClient;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::custom_id::CustomId;
use tutasdk::entities::tutanota::{DraftCreateData, DraftCreateReturn, DraftData};
use tutasdk::services::service_executor::ServiceExecutor;
use tutasdk::services::tutanota::DraftService;
use tutasdk::services::ExtraServiceParams;

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

	imap_client: TutanotaImapClient,
	service_executor: ServiceExecutor,
	session_key: GenericAesKey,
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
		service_executor: ServiceExecutor,
		session_key: GenericAesKey,
	) -> Self {
		let imap_client = TutanotaImapClient::start_new_session(
			import_config.params.credentials.port.parse().unwrap(),
		);
		Self {
			status: ImapImportStatus::NotInitialized,
			imap_client,
			import_config,
			service_executor,
			session_key,
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
		let service_params = ExtraServiceParams {
			session_key: Some(self.session_key.clone()),
			..Default::default()
		};
		let draft_return_data = self
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
				subject,                 // only fill the subject for now
				_id: Default::default(), //CustomId::from_custom_string("aaaaaaaaa"),
				bodyText: "this is a mail from imap".to_string(),
				compressedBodyText: None,
				confidential: false,
				method: 0,
				senderMailAddress: "send@tutao.de".to_string(),
				senderName: "ImapImporter".to_string(),
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
    use std::time::Duration;
    use tuta_imap::testing::GreenMailTestServer;
    use tutasdk::crypto::key::GenericAesKey;
    use tutasdk::entities::entity_facade::{EntityFacade as _, EntityFacadeImpl as EntityFacade};
    use tutasdk::net::native_rest_client::NativeRestClient;
    use tutasdk::services::service_executor::ServiceExecutor;
    use tutasdk::{Sdk, CLIENT_VERSION};

    async fn init(sdk: Sdk) -> (super::ImapImport, GreenMailTestServer) {
		let logged_in_sdk = sdk
			.create_session("map-free@tutanota.de", "map")
			.await
			.unwrap();
		let service_executor = ServiceExecutor::new(
			logged_in_sdk
				.get_entity_client()
				.get_headers_provider()
				.clone(),
			logged_in_sdk
				.get_crypto_entity_client()
				.get_crypto_facade()
				.clone(),
			Arc::new(EntityFacade::new(sdk.get_type_model_provider().clone())),
			sdk.get_instance_mapper().clone(),
			sdk.get_json_serializer().clone(),
			sdk.get_rest_client().clone(),
			sdk.get_type_model_provider().clone(),
			sdk.get_base_url().to_string(),
		);

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
		let importer = super::ImapImport::new(
			imap_import_config,
			service_executor,
			GenericAesKey::from_bytes(&[12; 32]).unwrap(),
		);

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

		// 3. call ImapImp::upload_mail_to_server
		let uploaded_draft_id = importer.upload_mail_to_tutanota(imap_mail).await;

		// 4. verify the draft ( with return idTuple ) is present in tutanota
		std::thread::sleep(Duration::from_secs(100000));
	}
}
