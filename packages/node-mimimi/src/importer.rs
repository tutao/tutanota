use crate::importer::file_reader::import_client::{FileImport, FileIterationError};
use crate::importer::imap_reader::import_client::{ImapImport, ImapIterationError};
use crate::importer::imap_reader::ImapImportConfig;
use crate::importer::importable_mail::{ImportableMail, ImportedMailResponse};
use crate::logging::Console;
use std::future::Future;
use std::sync::Arc;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::{GenericAesKey, VersionedAesKey};
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::entities::tutanota::DraftCreateData;
use tutasdk::services::tutanota::DraftService;
use tutasdk::services::ExtraServiceParams;
use tutasdk::{ApiCallError, LoggedInSdk};

pub type NapiTokioMutex<T> = napi::tokio::sync::Mutex<T>;
pub type NapiResult<T> = napi::Result<T>;

/// A handle, once imap/file reader get the importable mail,
/// this handle is responsible to do the import to server,
/// Returns a boolean, indicating if this import was successful or not.
// todo: return more verbose status
pub type ImporterHandle = Box<dyn Fn(ImportableMail) -> Box<dyn Future<Output = bool>>>;

mod builder;
pub mod file_reader;
pub mod imap_reader;
mod importable_mail;

#[napi_derive::napi(discriminant = "type2")]
#[derive(Clone, PartialEq)]
pub enum ImportAuth {
	Imap {
		imap_import_config: ImapImportConfig,
	},
	LocalFile {
		file_path: String,
		is_mbox: bool,
	},
}

/// current state of the imap_reader import for this tuta account
/// requires an initialized SDK!
#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[derive(Clone, PartialEq, Debug)]
pub enum ImportStatus {
	NotInitialized,
	Paused,
	Running,
	Postponed,
	Finished,
}

struct ImporterInner {
	console: Option<&'static Console>,
	status: ImportStatus,

	importer_mail_address: String,

	logged_in_sdk: Arc<LoggedInSdk>,
	import_source: ImportSource,

	randomizer_facade: RandomizerFacade,
}

pub enum ImportSource {
	RemoteImap { imap_import_client: ImapImport },
	LocalFile { fs_email_client: FileImport },
}

#[napi_derive::napi]
pub struct Importer {
	inner: Arc<NapiTokioMutex<ImporterInner>>,
}

#[derive(Debug, PartialEq, Clone)]
pub enum IterationError {
	Imap(ImapIterationError),
	File(FileIterationError),
}

impl ImporterInner {
	pub async fn continue_import(&mut self) {
		let mut failed_import_count = 0_usize;
		let mut success_import_count = 0_usize;

		'walk_through_source: loop {
			let next_importable_mail = match &mut self.import_source {
				ImportSource::RemoteImap { imap_import_client } => imap_import_client
					.fetch_next_mail()
					.await
					.map_err(IterationError::Imap),

				ImportSource::LocalFile { fs_email_client } => fs_email_client
					.read_next_importable_mail()
					.map_err(IterationError::File),
			};

			let import_res = match next_importable_mail {
				Ok(mut next_importable_mail) => {
					next_importable_mail.first_sender.0 = self.importer_mail_address.clone();
					self.import_one_mail(next_importable_mail).await
				},

				// source says, all the iteration have ended,
				Err(IterationError::File(FileIterationError::SourceEnd))
				| Err(IterationError::Imap(ImapIterationError::SourceEnd)) => {
					break 'walk_through_source;
				},

				Err(e) => {
					panic!("Cannot get next email from source: {e:?}")
				},
			};

			match import_res {
				// this import have been success,
				Ok(_imported_mail_response) => success_import_count += 1,

				Err(()) => {
					// todo: save the ImportableMail to some fail list,
					// since, in this iteration the source will not give this mail again,
					failed_import_count += 1;
				},
			}
		}

		if failed_import_count > 0 {
			// some mail failed to import:
			self.status = ImportStatus::Postponed;
		} else {
			// nothing failed,
			self.status = ImportStatus::Finished;
			eprintln!(">>>>>>>>> Imported {success_import_count} mails");
		}
	}

	/// once we get the ImportableMail from either of srouce,
	/// continue to the uploading counterpart
	async fn import_one_mail(
		&self,
		importable_mail: ImportableMail,
	) -> Result<ImportedMailResponse, ()> {
		let mut create_draft_data = DraftCreateData::from(importable_mail);
		let new_aes_256_key = GenericAesKey::from_bytes(
			self.randomizer_facade
				.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();
		let mail_group_key = self
			.get_mail_group_key(self.importer_mail_address.as_str())
			.await
			.unwrap();
		let owner_enc_session_key =
			mail_group_key.encrypt_key(&new_aes_256_key, Iv::generate(&self.randomizer_facade));
		create_draft_data.ownerEncSessionKey = owner_enc_session_key.object;
		create_draft_data.ownerKeyVersion = owner_enc_session_key.version;

		let service_params = ExtraServiceParams {
			session_key: Some(new_aes_256_key),
			..Default::default()
		};

		let draft_return_data = self
			.logged_in_sdk
			.get_service_executor()
			.post::<DraftService>(create_draft_data, service_params)
			.await
			.expect("Cannot execute DraftService");

		Ok(ImportedMailResponse::from(draft_return_data))
	}

	async fn get_mail_group_key(
		&self,
		mail_address: &str,
	) -> Result<VersionedAesKey, ApiCallError> {
		let sender_mail_group_id = self
			.logged_in_sdk
			.mail_facade()
			.get_group_id_for_mail_address(mail_address)
			.await?;
		let mail_group_key = self
			.logged_in_sdk
			.get_current_sym_group_key(&sender_mail_group_id)
			.await?;
		Ok(mail_group_key)
	}
}

#[napi_derive::napi]
impl Importer {
	pub fn new(
		console: &'static Console,
		logged_in_sdk: Arc<LoggedInSdk>,
		import_source: ImportSource,
		importer_mail_address: String,
	) -> Self {
		let import_inner = ImporterInner {
			console: Some(console),
			logged_in_sdk,
			import_source,
			importer_mail_address,
			status: ImportStatus::NotInitialized,
			randomizer_facade: RandomizerFacade::from_core(rand::rngs::OsRng),
		};
		Self {
			inner: Arc::new(NapiTokioMutex::new(import_inner)),
		}
	}

	#[napi]
	pub async unsafe fn continue_import_napi(&mut self) {
		self.inner.lock().await.continue_import().await;
	}

	#[napi]
	pub async unsafe fn delete_import(&mut self) -> ImportStatus {
		todo!()
	}

	#[napi]
	pub async unsafe fn pause_import(&mut self) -> ImportStatus {
		todo!()
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::importer::imap_reader::{ImapCredentials, LoginMechanism};
	use mail_builder::MessageBuilder;
	use tuta_imap::testing::GreenMailTestServer;
	use tutasdk::net::native_rest_client::NativeRestClient;
	use tutasdk::Sdk;

	async fn init_imap_importer() -> (ImporterInner, GreenMailTestServer) {
		let importer_mail_address = "map-free@tutanota.de".to_string();
		let logged_in_sdk = Sdk::new(
			"http://localhost:9000".to_string(),
			Arc::new(NativeRestClient::try_new().unwrap()),
		)
		.create_session(importer_mail_address.as_str(), "map")
		.await
		.unwrap();
		let greenmail = GreenMailTestServer::new();
		let imap_import_config = ImapImportConfig {
			root_import_mail_folder_name: "/".to_string(),
			credentials: ImapCredentials {
				host: "127.0.0.1".to_string(),
				port: greenmail.imaps_port.try_into().unwrap(),
				login_mechanism: LoginMechanism::Plain {
					username: "sug@example.org".to_string(),
					password: "sug".to_string(),
				},
			},
		};

		let import_source = ImportSource::RemoteImap {
			imap_import_client: ImapImport::new(imap_import_config),
		};
		let randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng);

		let importer = ImporterInner {
			importer_mail_address,
			logged_in_sdk,
			import_source,
			randomizer_facade,
			console: None,
			status: ImportStatus::NotInitialized,
		};

		(importer, greenmail)
	}

	pub async fn init_file_importer(file_path: &str, is_mbox: bool) -> ImporterInner {
		let logged_in_sdk = Sdk::new(
			"http://localhost:9000".to_string(),
			Arc::new(NativeRestClient::try_new().unwrap()),
		)
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();

		let import_source = ImportSource::LocalFile {
			fs_email_client: FileImport::new(file_path, is_mbox),
		};
		let randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng);
		let import_inner = ImporterInner {
			console: None,
			status: ImportStatus::NotInitialized,
			importer_mail_address: "map-free@tutanota.de".to_string(),
			logged_in_sdk,
			import_source,
			randomizer_facade,
		};
		import_inner
	}

	#[tokio::test]
	pub async fn import_from_default_folder() {
		let (mut importer, greenmail) = init_imap_importer().await;

		let email = MessageBuilder::new()
			.from(("Matthias", "map@example.org"))
			.to(("Johannes", "jmp@example.org"))
			.subject("Hello from imap 😀! -- Список.doc")
			.text_body("Hello tutao! this is the first step to have email import.Want to see html 😀?<p style='color:red'>red</p>")
			.write_to_string()
			.unwrap();
		greenmail.store_mail("sug@example.org", email.as_str());

		importer.continue_import().await;
		assert_eq!(importer.status, ImportStatus::Finished);
	}

	#[tokio::test]
	async fn can_import_single_eml_file() {
		let mut importer = init_file_importer(
			"/home/sug/dev/repositories/tutanota-3/packages/node-mimimi/sample.eml",
			false,
		)
		.await;

		importer.continue_import().await;
		assert_eq!(importer.status, ImportStatus::Finished);
	}
}
