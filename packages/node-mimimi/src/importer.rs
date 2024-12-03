use crate::importer::file_reader::import_client::{FileImport, FileIterationError};
use crate::importer::imap_reader::import_client::{ImapImport, ImapIterationError};
use crate::importer::imap_reader::ImapImportConfig;
use crate::importer::importable_mail::ImportableMail;
use crate::logging::Console;
use crate::reduce_to_chunks::reduce_to_chunks;
use crate::tuta::credentials::TutaCredentials;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use napi::bindgen_prelude::Error as NapiError;
use napi::Env;
use std::sync::{Arc, Mutex};
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::{GenericAesKey, VersionedAesKey};
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::entities::generated::sys::StringWrapper;
use tutasdk::entities::generated::tutanota::{
	ImportAttachment, ImportMailData, ImportMailGetIn, ImportMailPostIn,
	NewImportAttachment,
};
use tutasdk::entities::json_size_estimator::estimate_json_size;
use tutasdk::entities::Entity;
use tutasdk::login::Credentials;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::rest_error::ImportFailureReason;
use tutasdk::rest_error::PreconditionFailedReason::ImportFailure;
use tutasdk::services::generated::tutanota::ImportMailService;
use tutasdk::services::ExtraServiceParams;
use tutasdk::tutanota_constants::ArchiveDataType;
use tutasdk::{rest_error::HttpError, ApiCallError, CustomId, GeneratedId};
use tutasdk::{IdTupleGenerated, LoggedInSdk, Sdk};

pub type NapiTokioMutex<T> = napi::tokio::sync::Mutex<T>;

pub mod file_reader;
pub mod imap_reader;
mod importable_mail;

#[derive(Clone, PartialEq)]
pub enum ImportParams {
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
/// keep in sync with TutanotaConstants.ts
#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[cfg_attr(not(feature = "javascript"), derive(Clone))]
#[derive(PartialEq, Default)]
#[cfg_attr(test, derive(Debug))]
#[repr(u8)]
pub enum ImportStatus {
	#[default]
	NotInitialized = 0,
	Paused = 1,
	Running = 2,
	Postponed = 3,
	Finished = 4,
}

#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
#[derive(PartialEq, Clone, Default)]
#[cfg_attr(test, derive(Debug))]
pub struct ImportState {
	pub status: ImportStatus,
	pub imported_mails: u32,
}

struct Importer {
	local_import_state: ImportState,
	remote_import_state: entities::generated::tutanota::ImportMailState,
	logged_in_sdk: Arc<LoggedInSdk>,
	target_owner_group: GeneratedId,
	mail_group_key: VersionedAesKey,
	target_mail_folder: IdTupleGenerated,
	import_source: Arc<Mutex<ImportSource>>,
	randomizer_facade: RandomizerFacade,
}

pub enum ImportSource {
	RemoteImap { imap_import_client: ImapImport },
	LocalFile { fs_email_client: FileImport },
}

/// Wrapper for `Importer` to be used from napi-rs interface
#[cfg_attr(feature = "javascript", napi_derive::napi)]
pub struct ImporterApi {
	inner: Arc<NapiTokioMutex<Importer>>,
}

#[derive(Debug, PartialEq, Clone)]
pub enum IterationError {
	Imap(ImapIterationError),
	File(FileIterationError),
}

struct ImportSourceIterator {
	// it would be nice to not need the mutex, but when the importer continues the import,
	// it mutates its own state and also calls mutating functions on the source. solving this
	// probably requires a bigger restructure of the code (it's very OOP atm)
	source: Arc<Mutex<ImportSource>>,
}

impl Iterator for ImportSourceIterator {
	type Item = ImportableMail;

	fn next(&mut self) -> Option<Self::Item> {
		let mut source = self.source.lock().unwrap();
		let next_importable_mail = match &mut *source {
			// the other way (converting fs_source to an async_iterator) would be nicer, but that's a nightly feature
			ImportSource::RemoteImap { imap_import_client } => imap_import_client
				.fetch_next_mail()
				.map_err(IterationError::Imap),
			ImportSource::LocalFile { fs_email_client } => fs_email_client
				.get_next_importable_mail()
				.map_err(IterationError::File),
		};

		match next_importable_mail {
			Ok(next_importable_mail) => Some(next_importable_mail),

			// source says, all the iteration have ended,
			Err(IterationError::File(FileIterationError::SourceEnd))
			| Err(IterationError::Imap(ImapIterationError::SourceEnd)) => None,

			Err(e) => {
				// once we handle this case we will need another iterator that filters (and logs) the
				// errors so we don't have to handle the error case during the chunking + upload
				panic!("Cannot get next email from source: {e:?}")
			},
		}
	}
}

impl Importer {
	const IMPORT_DISABLED: ApiCallError = ApiCallError::ServerResponseError {
		source: HttpError::PreconditionFailedError(Some(ImportFailure(
			ImportFailureReason::ImportDisabled,
		))),
	};

	pub async fn continue_import(&mut self) -> Result<ImportState, ()> {
		let source_iterator = ImportSourceIterator {
			source: Arc::clone(&self.import_source),
		};
		let _ = self.import_all_mail(source_iterator).await;

		self.remote_import_state.status = ImportStatus::Finished as i64;
		self.update_import_state_on_server().await?;

		Ok(self.local_import_state.clone())
	}

	/// once we get the ImportableMail from either of source,
	/// continue to the uploading counterpart
	async fn import_all_mail<Iter>(
		&mut self,
		importable_mails: Iter,
	) -> Result<Vec<IdTupleGenerated>, ()>
	where
		Iter: Iterator<Item = ImportableMail> + Send + 'static,
	{
		// check if importing is allowed before preparing the import
		let import_mail_get_in = ImportMailGetIn { _format: 0 };
		let response = self
			.logged_in_sdk
			.get_service_executor()
			.get::<ImportMailService>(import_mail_get_in, ExtraServiceParams::default())
			.await;

		match response {
			// importing is enabled
			Ok(mut imported_post_out) => {},

			Err(err) if err == Self::IMPORT_DISABLED => {
				eprintln!("!!!!!!!!!!!!!!! {:?}", err);
				todo!() // propagate to TS and show dialog
			},

			Err(_) => {
				return Err(()); // how to handle this?
			},
		}

		self.remote_import_state.status = ImportStatus::NotInitialized as i64;
		self.update_import_state_on_server().await?;

		const MAX_REQUEST_SIZE: usize = 1024 * 1024 * 5;
		let import_mail_data_and_attachments = importable_mails.map(|mut m| {
			let mut attachments = Vec::with_capacity(m.attachments.len());
			attachments.append(&mut m.attachments);

			let new_mail_aes_256_key = GenericAesKey::from_bytes(
				self.randomizer_facade
					.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
					.as_slice(),
			)
			.unwrap();

			let owner_enc_session_key = self
				.mail_group_key
				.encrypt_key(&new_mail_aes_256_key, Iv::generate(&self.randomizer_facade));

			(
				m.into_instance(owner_enc_session_key.object, owner_enc_session_key.version),
				new_mail_aes_256_key,
				attachments,
			)
		});
		let import_chunks = reduce_to_chunks(
			import_mail_data_and_attachments,
			MAX_REQUEST_SIZE,
			Box::new(|(imd, key, attachment)| estimate_json_size(imd)),
		);

		let mut mails: Vec<IdTupleGenerated> = Vec::new();
		let mut new_state = ImportState {
			status: ImportStatus::Running,
			imported_mails: 0,
		};

		for (chunk_index, import_chunk) in import_chunks.enumerate() {
			let import_len = import_chunk.len();

			let mut imports_with_attachments: Vec<(ImportMailData, GenericAesKey)> = Vec::new();
			for (import_mail_data, key, importable_mail_attachments) in import_chunk.into_iter() {
				let mut import_mail_data = import_mail_data;
				let mut import_attachments = Vec::new();
				for importable_mail_attachment in importable_mail_attachments {
					let session_key_for_file = GenericAesKey::from_bytes(
						self.randomizer_facade
							.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
							.as_slice(),
					)
					.unwrap();
					let owner_enc_file_session_key = self
						.mail_group_key
						.encrypt_key(&session_key_for_file, Iv::generate(&self.randomizer_facade));

					let reference_tokens = self
						.logged_in_sdk
						.blob_facade()
						.encrypt_and_upload(
							ArchiveDataType::Attachments,
							&self.target_owner_group,
							&session_key_for_file,
							&importable_mail_attachment.content,
						)
						.await
						.unwrap();

					// todo: do we need to upload the ivs and how?
					let enc_file_name = session_key_for_file
						.encrypt_data(
							importable_mail_attachment.filename.as_ref(),
							Iv::generate(&self.randomizer_facade),
						)
						.unwrap();
					let enc_mime_type = session_key_for_file
						.encrypt_data(
							importable_mail_attachment.content_type.as_ref(),
							Iv::generate(&self.randomizer_facade),
						)
						.unwrap();
					let enc_cid: Option<Vec<u8>> = match importable_mail_attachment.content_id {
						Some(cid) => Some(
							session_key_for_file
								.encrypt_data(cid.as_bytes(), Iv::generate(&self.randomizer_facade))
								.unwrap(),
						),
						None => None,
					};

					let import_attachment = ImportAttachment {
						_id: None,
						ownerEncFileSessionKey: owner_enc_file_session_key.object,
						ownerFileKeyVersion: owner_enc_file_session_key.version,
						existingAttachmentFile: None,
						newAttachment: Some(NewImportAttachment {
							_id: None,
							encCid: enc_cid,
							encFileHash: None,
							encFileName: enc_file_name,
							encMimeType: enc_mime_type,
							ownerEncFileHashSessionKey: None,
							referenceTokens: reference_tokens,
						}),
					};

					import_attachments.push(import_attachment);
				}
				import_mail_data.importedAttachments = import_attachments;
				imports_with_attachments.push((import_mail_data, key));
			}

			let maybe_serialized_imports: Result<Vec<StringWrapper>, ApiCallError> =
				imports_with_attachments
					.into_iter()
					.map(|(imd, key)| {
						self.logged_in_sdk
							.serialize_instance_to_json(imd, &key)
							.map(|value| StringWrapper {
								_id: Some(make_random_aggregate_id(&self.randomizer_facade)),
								value,
							})
					})
					.collect();

			let serialized_imports = maybe_serialized_imports.map_err(|e| ())?;

			let session_key_for_import_post = GenericAesKey::Aes256(
				tutasdk::crypto::aes::Aes256Key::generate(&self.randomizer_facade),
			);
			let owner_enc_sk_for_import_post = self.mail_group_key.encrypt_key(
				&session_key_for_import_post,
				Iv::generate(&self.randomizer_facade),
			);
			let import_mail_post_in = ImportMailPostIn {
				ownerGroup: self.target_owner_group.clone(),
				encImports: serialized_imports,
				targetMailFolder: self.target_mail_folder.clone(),
				ownerKeyVersion: owner_enc_sk_for_import_post.version,
				ownerEncSessionKey: owner_enc_sk_for_import_post.object,
				newImportedMailSetName: "@internal-imported-mailset".to_string(),
				_finalIvs: Default::default(),
				_format: 0,
				_errors: None,
			};

			// distribute load accross the cluster. should be switched to read token (once it is implemented on the
			// BlobFacade) and use ArchiveDataType::MailDetails to target one of the nodes that actually stores the
			// data
			let blob_service_access_info = self
				.logged_in_sdk
				.request_blob_facade_write_token(ArchiveDataType::Attachments)
				.await
				.map_err(|e| ())?;

			let server_to_upload = blob_service_access_info
				.servers
				.last()
				.map(|s| s.url.to_string());

			let response = self
				.logged_in_sdk
				.get_service_executor()
				.post::<ImportMailService>(
					import_mail_post_in,
					ExtraServiceParams {
						base_url: server_to_upload,
						session_key: Some(session_key_for_import_post),
						..Default::default()
					},
				)
				.await;

			match response {
				// this import has been success,
				Ok(mut imported_post_out) => {
					mails.append(&mut imported_post_out.mails);
					new_state = ImportState {
						status: ImportStatus::Running,
						imported_mails: self
							.local_import_state
							.imported_mails
							.saturating_add(u32::try_from(import_len).unwrap_or(u32::MAX)),
					};
				},

				Err(err) => {
					// todo: save the ImportableMails to some fail list,
					// since, in this iteration the source will not give these mail again,
					new_state = ImportState {
						status: ImportStatus::Postponed,
						imported_mails: self.local_import_state.imported_mails,
					};
				},
			}

			// update server every twice post request
			if chunk_index % 2 == 0 {
				self.remote_import_state.status = ImportStatus::Running as i64;
				self.update_import_state_on_server().await?;
			}
		}
		new_state.status = if new_state.status == ImportStatus::Postponed {
			ImportStatus::Postponed
		} else {
			ImportStatus::Finished
		};

		self.local_import_state = new_state;
		Ok(mails)
	}

	async fn update_import_state_on_server(&self) -> Result<(), ()> {
		// if self.remote_import_state._id.is_none() {
		//     todo!()
		// } else {
		//     self.logged_in_sdk
		//         .update_remote_entity(self.remote_import_state.clone())
		//         .await
		//         .map_err(|_e| ())
		// }
		Ok(())
	}
}

fn make_random_aggregate_id(random: &RandomizerFacade) -> CustomId {
	let new_id_bytes = random.generate_random_array::<4>();
	let new_id_string = BASE64_URL_SAFE_NO_PAD.encode(new_id_bytes);
	let new_id = tutasdk::CustomId(new_id_string);
	new_id
}

impl ImporterApi {
	fn create_new_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		mail_group_key: VersionedAesKey,
		target_mail_folder: IdTupleGenerated,
		import_source: Arc<Mutex<ImportSource>>,
	) -> Importer {
		let randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng);
		let local_import_state = ImportState::default();

		let session_key_for_import_state = GenericAesKey::Aes256(
			tutasdk::crypto::aes::Aes256Key::generate(&randomizer_facade),
		);
		let owner_enc_sk_for_import_state = mail_group_key.encrypt_key(
			&session_key_for_import_state,
			Iv::generate(&randomizer_facade),
		);
		let remote_import_state = tutasdk::entities::generated::tutanota::ImportMailState {
			targetFolder: target_mail_folder.clone(),
			status: ImportStatus::NotInitialized as i64,
			_ownerEncSessionKey: Some(owner_enc_sk_for_import_state.object),
			_ownerKeyVersion: Some(owner_enc_sk_for_import_state.version),
			_ownerGroup: Some(target_owner_group.clone()),
			_permissions: Default::default(),
			_errors: None,
			_format: 0,
			_finalIvs: Default::default(),
			_id: None,
		};

		Importer {
			logged_in_sdk,
			target_owner_group,
			target_mail_folder,
			import_source,
			local_import_state,
			remote_import_state,
			randomizer_facade,
			mail_group_key,
		}
	}

	pub fn new(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		mail_group_key: VersionedAesKey,
		target_mail_folder: IdTupleGenerated,
		import_source: Arc<Mutex<ImportSource>>,
	) -> Self {
		Self {
			inner: Arc::new(NapiTokioMutex::new(Self::create_new_importer(
				logged_in_sdk,
				target_owner_group,
				mail_group_key,
				target_mail_folder,
				import_source,
			))),
		}
	}

	pub async fn continue_import_inner(&mut self) -> Result<ImportState, ()> {
		self.inner.lock().await.continue_import().await
	}

	pub async fn delete_import_inner(&mut self) -> Result<ImportState, ()> {
		todo!()
	}

	pub async fn pause_import_inner(&mut self) -> Result<ImportState, ()> {
		todo!()
	}

	pub async fn create_file_importer_inner(
		tuta_credentials: TutaCredentials,
		target_owner_group: String,
		target_mail_folder: (String, String),
		source_paths: Vec<String>,
	) -> napi::Result<ImporterApi> {
		let target_owner_group = GeneratedId(target_owner_group);
		let target_mailset = IdTupleGenerated::new(
			GeneratedId(target_mail_folder.0),
			GeneratedId(target_mail_folder.1),
		);
		let logged_in_sdk_future = Self::create_sdk(tuta_credentials);

		let fs_email_client = FileImport::new(source_paths)
			.map_err(|_e| NapiError::from_reason("Cannot create file import"))?;
		let import_source = Arc::new(Mutex::new(ImportSource::LocalFile { fs_email_client }));
		let logged_in_sdk = logged_in_sdk_future
			.await
			.map_err(|_e| NapiError::from_reason("Cannot create logged in sdk"))?;
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.map_err(|_e| NapiError::from_reason("Cannot get mail group key from sdk"))?;

		Ok(ImporterApi::new(
			logged_in_sdk,
			target_owner_group,
			mail_group_key,
			target_mailset,
			import_source,
		))
	}

	async fn create_sdk(tuta_credentials: TutaCredentials) -> Result<Arc<LoggedInSdk>, String> {
		let rest_client = Arc::new(
			NativeRestClient::try_new()
				.map_err(|e| format!("Cannot build native rest client: {e}"))?,
		);

		let logged_in_sdk = {
			let sdk = Sdk::new(tuta_credentials.api_url.clone(), rest_client);

			let sdk_credentials: Credentials = tuta_credentials
				.clone()
				.try_into()
				.map_err(|_| "Cannot convert to valid credentials".to_string())?;
			sdk.login(sdk_credentials)
				.await
				.map_err(|e| format!("Cannot login to sdk. Error: {:?}", e))?
		};

		Ok(logged_in_sdk)
	}
}

// Wrapper for napi
#[cfg(feature = "javascript")]
#[napi_derive::napi]
impl ImporterApi {
	// once Self::continue_import return custom error,
	// do the error conversion here, or in <From> trait
	fn error_conversion<E>(_err: E) -> napi::Error {
		todo!()
	}

	#[napi]
	pub async unsafe fn continue_import(&mut self) -> napi::Result<ImportState> {
		self.continue_import_inner()
			.await
			.map_err(Self::error_conversion)
	}

	#[napi]
	pub async unsafe fn delete_import(&mut self) -> napi::Result<ImportState> {
		self.delete_import_inner()
			.await
			.map_err(Self::error_conversion)
	}

	#[napi]
	pub async unsafe fn pause_import(&mut self) -> napi::Result<ImportState> {
		self.pause_import_inner()
			.await
			.map_err(Self::error_conversion)
	}

	#[napi]
	pub async fn create_file_importer(
		tuta_credentials: TutaCredentials,
		target_owner_group: String,
		target_mail_folder: (String, String),
		source_paths: Vec<String>,
	) -> napi::Result<ImporterApi> {
		Self::create_file_importer_inner(
			tuta_credentials,
			target_owner_group,
			target_mail_folder,
			source_paths,
		)
		.await
	}

	#[napi]
	pub fn init_log(env: Env) {
		// this is in a separate fn because Env isn't Send, so can't be used in async fn.
		Console::init(env);
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::importer::imap_reader::{ImapCredentials, LoginMechanism};
	use crate::tuta_imap::testing::GreenMailTestServer;
	use mail_builder::MessageBuilder;
	use tutasdk::entities::generated::tutanota::MailFolder;
	use tutasdk::folder_system::MailSetKind;
	use tutasdk::net::native_rest_client::NativeRestClient;
	use tutasdk::Sdk;

	const IMPORTED_MAIL_ADDRESS: &str = "map-premium@tutanota.de";

	fn sample_email(subject: String) -> String {
		let email = MessageBuilder::new()
            .from(("Matthias", "map@example.org"))
            .to(("Johannes", "jhm@example.org"))
            .subject(subject)
            .text_body("Hello tutao! this is the first step to have email import.Want to see html 😀?<p style='color:red'>red</p>")
            .write_to_string()
            .unwrap();
		email
	}

	async fn get_test_import_folder_id(
		logged_in_sdk: &Arc<LoggedInSdk>,
		kind: MailSetKind,
	) -> MailFolder {
		let mail_facade = logged_in_sdk.mail_facade();
		let mailbox = mail_facade.load_user_mailbox().await.unwrap();
		let folders = mail_facade
			.load_folders_for_mailbox(&mailbox)
			.await
			.unwrap();
		folders
			.system_folder_by_type(kind)
			.expect("inbox should exist")
			.clone()
	}

	pub async fn init_importer(import_source: ImportSource) -> Importer {
		let logged_in_sdk = Sdk::new(
			"http://localhost:9000".to_string(),
			Arc::new(NativeRestClient::try_new().unwrap()),
		)
		.create_session(IMPORTED_MAIL_ADDRESS, "map")
		.await
		.unwrap();

		let import_source = Arc::new(Mutex::new(import_source));
		let target_mail_folder = get_test_import_folder_id(&logged_in_sdk, MailSetKind::Archive)
			.await
			._id
			.unwrap();

		let target_owner_group = logged_in_sdk
			.mail_facade()
			.get_group_id_for_mail_address(IMPORTED_MAIL_ADDRESS)
			.await
			.unwrap();
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.unwrap();

		ImporterApi::create_new_importer(
			logged_in_sdk,
			target_owner_group,
			mail_group_key,
			target_mail_folder,
			import_source,
		)
	}

	async fn init_imap_importer() -> (Importer, GreenMailTestServer) {
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
		(init_importer(import_source).await, greenmail)
	}

	pub async fn init_file_importer(source_paths: Vec<String>) -> Importer {
		let import_source = ImportSource::LocalFile {
			fs_email_client: FileImport::new(source_paths).unwrap(),
		};
		init_importer(import_source).await
	}

	#[tokio::test]
	pub async fn import_multiple_from_imap_default_folder() {
		let (mut importer, greenmail) = init_imap_importer().await;

		let email_first = sample_email("Hello from imap 😀! -- Список.doc".to_string());
		let email_second = sample_email("Second time: hello".to_string());
		greenmail.store_mail("sug@example.org", email_first.as_str());
		greenmail.store_mail("sug@example.org", email_second.as_str());

		let import_res = importer.continue_import().await.map_err(|_| ());
		assert_eq!(
			Ok(ImportState {
				status: ImportStatus::Finished,
				imported_mails: 2,
			}),
			import_res
		);
	}

	#[tokio::test]
	pub async fn import_single_from_imap_default_folder() {
		let (mut importer, greenmail) = init_imap_importer().await;

		let email = sample_email("Single email".to_string());
		greenmail.store_mail("sug@example.org", email.as_str());

		let import_res = importer.continue_import().await.map_err(|_| ());
		assert_eq!(
			Ok(ImportState {
				status: ImportStatus::Finished,
				imported_mails: 1,
			}),
			import_res
		);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_without_attachment() {
		let mut importer = init_file_importer(vec!["./test/sample.eml".to_string()]).await;

		let import_res = importer.continue_import().await.map_err(|_| ());
		assert_eq!(
			Ok(ImportState {
				status: ImportStatus::Finished,
				imported_mails: 1,
			}),
			import_res
		);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_with_attachment() {
		let mut importer =
			init_file_importer(vec!["./test/attachment_sample.eml".to_string()]).await;

		let import_res = importer.continue_import().await.map_err(|_| ());
		assert_eq!(
			Ok(ImportState {
				status: ImportStatus::Finished,
				imported_mails: 1,
			}),
			import_res
		);
	}
}
