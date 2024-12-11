use crate::importer::importable_mail::{
	ImportableMailAttachment, ImportableMailAttachmentMetaData, KeyedImportableMailAttachment,
};
use crate::reduce_to_chunks::UnitImport;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use file_reader::{FileImport, FileIterationError};
use imap_reader::ImapImportConfig;
use imap_reader::{ImapImport, ImapIterationError};
use importable_mail::ImportableMail;
use std::future::Future;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tutasdk::blobs::blob_facade::FileData;
use tutasdk::crypto::aes;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::{GenericAesKey, VersionedAesKey};
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::entities::generated::sys::{BlobReferenceTokenWrapper, StringWrapper};

use tutasdk::entities::generated::tutanota::{
	ImportAttachment, ImportMailData, ImportMailGetIn, ImportMailPostIn, ImportMailPostOut,
	ImportMailState,
};
use tutasdk::entities::json_size_estimator::estimate_json_size;
use tutasdk::rest_error::PreconditionFailedReason::ImportFailure;
use tutasdk::rest_error::{HttpError, ImportFailureReason};
use tutasdk::services::generated::tutanota::ImportMailService;
use tutasdk::services::ExtraServiceParams;
use tutasdk::tutanota_constants::ArchiveDataType;
use tutasdk::{ApiCallError, CustomId, GeneratedId};
use tutasdk::{IdTupleGenerated, LoggedInSdk};

pub mod file_reader;
pub mod imap_reader;
pub mod importable_mail;

pub const MAX_REQUEST_SIZE: usize = 1024 * 1024 * 8;

#[derive(Debug)]
pub enum ImportError {
	SdkError {
		// action we were trying to perform on sdk
		action: &'static str,
		// actual error sdk returned
		error: ApiCallError,
	},
	/// login feature is not available for this user
	NoImportFeature,
	/// Blob responded with empty server url list
	EmptyBlobServerList,
	/// Server did not return any element id for the newly posted import state
	NoElementIdForState,
	/// Can not create Native Rest client
	NoNativeRestClient(std::io::Error),
	/// Can not create valid credential from given raw input
	CredentialValidationError(()),
	/// Error when trying to resume the session passed from client
	LoginError(tutasdk::login::LoginError),
	/// Error while iterating through import source
	IterationError(IterationError),
	/// Some mail was too big
	TooBigChunk,
	/// number of mails we expected to be imported vs number of mails server had written is not same
	MismatchedImportCount { expected: usize, imported: usize },
}

#[derive(Debug)]
pub enum IterationError {
	Imap(ImapIterationError),
	File(FileIterationError),
}

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
	Started = 0,
	Paused = 1,
	Running = 2,
	Canceled = 3,
	Finished = 4,
}

/// when state callback function is called after every chunk of import,
/// javascript handle is expected to respond with this struct
#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
pub struct StateCallbackResponse {
	pub should_stop: bool,
}

pub struct ImportEssential {
	logged_in_sdk: Arc<LoggedInSdk>,
	target_owner_group: GeneratedId,
	mail_group_key: VersionedAesKey,
	target_mailset: IdTupleGenerated,
	randomizer_facade: RandomizerFacade,
}

pub struct ImportState {
	last_server_update: SystemTime,
	pub remote_state: ImportMailState,
	pub imported_mail_ids: Vec<IdTupleGenerated>,
}

pub struct Importer {
	essentials: ImportEssential,
	state: ImportState,
	source: ImportSource,
}

pub enum ImportSource {
	RemoteImap { imap_import_client: ImapImport },
	LocalFile { fs_email_client: FileImport },
}

impl Iterator for ImportSource {
	type Item = ImportableMail;

	fn next(&mut self) -> Option<Self::Item> {
		let next_importable_mail = match self {
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

pub type ImportableMailsButcher<Source> =
	super::reduce_to_chunks::Butcher<{ MAX_REQUEST_SIZE }, UnitImport, Source>;
impl Importer {
	fn make_random_aggregate_id(randomizer_facade: &RandomizerFacade) -> CustomId {
		let new_id_bytes = randomizer_facade.generate_random_array::<4>();
		let new_id_string = BASE64_URL_SAFE_NO_PAD.encode(new_id_bytes);
		CustomId(new_id_string)
	}

	pub fn get_remote_state(&self) -> &ImportMailState {
		&self.state.remote_state
	}

	async fn initialize_remote_state(&mut self) -> Result<(), ImportError> {
		let mailbox = self
			.essentials
			.logged_in_sdk
			.mail_facade()
			.load_user_mailbox()
			.await
			.map_err(|e| ImportError::sdk("loading mailbox", e))?;
		let session_key =
			GenericAesKey::Aes256(aes::Aes256Key::generate(&self.essentials.randomizer_facade));
		let owner_enc_session_key = self.essentials.mail_group_key.encrypt_key(
			&session_key,
			Iv::generate(&self.essentials.randomizer_facade),
		);

		let mut import_state_id =
			IdTupleGenerated::new(mailbox.mailImportStates.clone(), GeneratedId::min_id());
		let mut import_state_for_upload = ImportMailState {
			_format: 0,
			_id: Some(import_state_id.clone()),
			_permissions: mailbox._permissions,
			_ownerGroup: Some(mailbox._ownerGroup.unwrap()),
			_ownerEncSessionKey: Some(owner_enc_session_key.object),
			_ownerKeyVersion: Some(owner_enc_session_key.version),
			status: ImportStatus::Running as i64,
			successfulMails: 0,
			failedMails: 0,
			targetFolder: self.essentials.target_mailset.clone(),
			_errors: Some(Default::default()),
			_finalIvs: Default::default(),
		};

		let create_data = self
			.essentials
			.logged_in_sdk
			.mail_facade()
			.get_crypto_entity_client()
			.create_instance(import_state_for_upload.clone(), Some(&session_key))
			.await
			.map_err(|e| ImportError::sdk("creating remote import state", e))?;

		import_state_id.element_id = create_data
			.generatedId
			.ok_or(ImportError::NoElementIdForState)?;

		import_state_for_upload._permissions = create_data.permissionListId;
		import_state_for_upload._id = Some(import_state_id);
		self.state.remote_state = import_state_for_upload;
		self.state.last_server_update = SystemTime::now();

		Ok(())
	}
}

impl ImportEssential {
	const IMPORT_DISABLED_ERR: ApiCallError = ApiCallError::ServerResponseError {
		source: HttpError::PreconditionFailedError(Some(ImportFailure(
			ImportFailureReason::ImportDisabled,
		))),
	};

	async fn make_serialized_chunk(
		&self,
		importable_chunk: Vec<UnitImport>,
	) -> Result<(ImportMailPostIn, GenericAesKey), ImportError> {
		let mut serialized_imports = Vec::with_capacity(importable_chunk.len());

		let mut upload_data_per_mail: Vec<(Vec<FileData>, Vec<ImportableMailAttachmentMetaData>)> =
			Vec::with_capacity(importable_chunk.len());
		let attachments_count_per_mail: Vec<usize> = importable_chunk
			.iter()
			.map(|mail| mail.attachments.len())
			.collect();

		// aggregate attachment data from multiple mails to upload in fewer request to the BlobService
		let (attachments_per_mail, other_data): (
			Vec<Vec<ImportableMailAttachment>>,
			Vec<(ImportMailData, GenericAesKey)>,
		) = importable_chunk
			.into_iter()
			.map(|mail| (mail.attachments, (mail.import_mail_data, mail.session_key)))
			.collect();

		for attachments_one_mail in attachments_per_mail {
			if attachments_one_mail.len() > 0 {
				let keyed_attachments: Vec<KeyedImportableMailAttachment> = attachments_one_mail
					.into_iter()
					.map(|attachment| attachment.make_keyed_importable_mail_attachment(self))
					.collect();

				let (attachments_file_data, attachments_meta_data): (
					Vec<FileData>,
					Vec<ImportableMailAttachmentMetaData>,
				) = keyed_attachments
					.into_iter()
					.map(|keyed_attachment| {
						let file_datum = FileData {
							session_key: keyed_attachment.attachment_session_key,
							data: keyed_attachment.content,
						};
						(file_datum, keyed_attachment.meta_data)
					})
					.unzip();

				upload_data_per_mail.push((attachments_file_data, attachments_meta_data))
			} else {
				upload_data_per_mail.push((vec![], vec![]));
			}
		}

		let (attachments_file_data_per_mail, attachments_meta_data_per_mail): (
			Vec<Vec<FileData>>,
			Vec<Vec<ImportableMailAttachmentMetaData>>,
		) = upload_data_per_mail.into_iter().unzip();

		let attachments_file_data_flattened_refs: Vec<&FileData> =
			attachments_file_data_per_mail.iter().flatten().collect();

		if attachments_file_data_flattened_refs.len() > 0 {
			// upload all attachments in this chunk in one call to the blob_facade
			// the blob_facade chunks them into efficient request to the BlobService
			let mut reference_tokens_per_attachment_flattened = self
				.logged_in_sdk
				.blob_facade()
				.encrypt_and_upload_multiple(
					ArchiveDataType::Attachments,
					&self.target_owner_group,
					attachments_file_data_flattened_refs,
				)
				.await
				.map_err(|e| ImportError::sdk("uploading multiple attachments", e))?;

			// reference mails and received reference tokens again, by using the attachments count per mail
			let mut all_reference_tokens_per_mail: Vec<Vec<Vec<BlobReferenceTokenWrapper>>> =
				Vec::new();
			for attachments_count in attachments_count_per_mail {
				if attachments_count == 0 {
					println!("attachments 0 for mail");
					all_reference_tokens_per_mail.push(vec![]);
				} else {
					println!("attachments {attachments_count} for mail");
					let reference_tokens_per_mail = reference_tokens_per_attachment_flattened
						.drain(0..attachments_count)
						.collect();
					all_reference_tokens_per_mail.push(reference_tokens_per_mail);
				}
			}

			let import_attachments_per_mail: Vec<Vec<ImportAttachment>> =
				attachments_file_data_per_mail
					.into_iter()
					.zip(
						attachments_meta_data_per_mail
							.into_iter()
							.zip(all_reference_tokens_per_mail),
					)
					.map(|(file_data, (meta_data, reference_tokens_vectors))| {
						let import_attachments_for_one_mail = file_data
							.into_iter()
							.zip(meta_data.into_iter().zip(reference_tokens_vectors))
							.map(|(file_datum, (meta_datum, reference_tokens))| {
								if reference_tokens.len() == 0 {
									let len = file_datum.data.len();
									println!("reference tokens empty!!!! {len}");
								}
								meta_datum.make_import_attachment_data(
									self,
									&file_datum.session_key,
									reference_tokens,
								)
							})
							.collect();
						import_attachments_for_one_mail
					})
					.collect();

			let length = import_attachments_per_mail.len();
			println!("import_attachments_per_mail {length}");

			// serialize multiple import_mail_data into on request to the ImportMailService
			for ((mut import_mail_data, session_key), import_attachments) in
				other_data.into_iter().zip(import_attachments_per_mail)
			{
				import_mail_data.importedAttachments = import_attachments;

				let serialized_import = self
					.logged_in_sdk
					.serialize_instance_to_json(import_mail_data, &session_key)
					.map_err(|e| ImportError::sdk("serializing import_mail_data to json", e))?;
				let wrapped_import_data = StringWrapper {
					_id: Some(Importer::make_random_aggregate_id(&self.randomizer_facade)),
					value: serialized_import,
				};
				serialized_imports.push(wrapped_import_data);
			}
		} else {
			// case: no mail in chunk has attachment

			// serialize multiple import_mail_data into on request to the ImportMailService
			for (mut import_mail_data, session_key) in other_data {
				import_mail_data.importedAttachments = vec![];

				let serialized_import = self
					.logged_in_sdk
					.serialize_instance_to_json(import_mail_data, &session_key)
					.map_err(|e| ImportError::sdk("serializing instance to json", e))?;
				let wrapped_import_data = StringWrapper {
					_id: Some(Importer::make_random_aggregate_id(&self.randomizer_facade)),
					value: serialized_import,
				};
				serialized_imports.push(wrapped_import_data);
			}
		}

		let session_key = GenericAesKey::Aes256(aes::Aes256Key::generate(&self.randomizer_facade));
		let owner_enc_sk_for_import_post = self
			.mail_group_key
			.encrypt_key(&session_key, Iv::generate(&self.randomizer_facade));

		let post_in = ImportMailPostIn {
			ownerGroup: self.target_owner_group.clone(),
			encImports: serialized_imports,
			targetMailFolder: self.target_mailset.clone(),
			ownerKeyVersion: owner_enc_sk_for_import_post.version,
			ownerEncSessionKey: owner_enc_sk_for_import_post.object,
			newImportedMailSetName: "@internal-imported-mailset".to_string(),
			_finalIvs: Default::default(),
			_format: 0,
			_errors: None,
		};

		Ok((post_in, session_key))
	}

	// distribute load across the cluster. should be switched to read token (once it is implemented on the
	// BlobFacade) and use ArchiveDataType::MailDetails to target one of the nodes that actually stores the
	// data
	async fn get_server_url_to_upload(&self) -> Result<String, ImportError> {
		self.logged_in_sdk
			.request_blob_facade_write_token(ArchiveDataType::Attachments)
			.await
			.map_err(|e| ImportError::sdk("request blob write token", e))?
			.servers
			.last()
			.map(|s| s.url.to_string())
			.ok_or(ImportError::EmptyBlobServerList)
	}

	async fn make_import_service_call(
		&self,
		import_mail_data: (ImportMailPostIn, GenericAesKey),
	) -> Result<ImportMailPostOut, ImportError> {
		self.verify_import_feature_enabled().await?;

		let server_to_upload = self.get_server_url_to_upload().await?;
		let (import_mail_post_in, session_key_for_import_post) = import_mail_data;

		self.logged_in_sdk
			.get_service_executor()
			.post::<ImportMailService>(
				import_mail_post_in,
				ExtraServiceParams {
					base_url: Some(server_to_upload),
					session_key: Some(session_key_for_import_post),
					..Default::default()
				},
			)
			.await
			.map_err(|e| {
				if e == Self::IMPORT_DISABLED_ERR {
					ImportError::NoImportFeature
				} else {
					ImportError::sdk("calling ImportMailService", e)
				}
			})
	}

	pub async fn verify_import_feature_enabled(&self) -> Result<(), ImportError> {
		self.logged_in_sdk
			.get_service_executor()
			.get::<ImportMailService>(
				ImportMailGetIn { _format: 0 },
				ExtraServiceParams::default(),
			)
			.await
			.map_err(|e| {
				if e == Self::IMPORT_DISABLED_ERR {
					ImportError::NoImportFeature
				} else {
					ImportError::sdk("calling ImportMailService", e)
				}
			})
	}
}

impl ImportState {
	async fn update_import_state_on_server(
		&mut self,
		logged_in_sdk: &LoggedInSdk,
	) -> Result<(), ImportError> {
		if self.last_server_update.elapsed().unwrap_or_default() > Duration::from_secs(6) {
			self.force_update_import_state_on_server(logged_in_sdk)
				.await
		} else {
			Ok(())
		}
	}

	async fn force_update_import_state_on_server(
		&mut self,
		logged_in_sdk: &LoggedInSdk,
	) -> Result<(), ImportError> {
		logged_in_sdk
			.mail_facade()
			.get_crypto_entity_client()
			.update_instance(self.remote_state.clone())
			.await
			.map_err(|e| ImportError::sdk("update remote import state", e))?;

		self.last_server_update = SystemTime::now();
		Ok(())
	}

	fn change_status(&mut self, status: ImportStatus) {
		self.remote_state.status = status as i64;
	}

	fn add_newly_imported_mails(&mut self, mut newly_imported_mails: Vec<IdTupleGenerated>) {
		self.remote_state.successfulMails = self
			.remote_state
			.successfulMails
			.saturating_add(newly_imported_mails.len().try_into().unwrap_or_default());

		self.imported_mail_ids.append(&mut newly_imported_mails);
	}

	fn add_failed_mails_count(&mut self, newly_failed_mails_count: usize) {
		self.remote_state.failedMails = self
			.remote_state
			.failedMails
			.saturating_add(newly_failed_mails_count.try_into().unwrap_or_default());
	}
}

impl Importer {
	pub async fn create_imap_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		imap_config: ImapImportConfig,
	) -> Result<Importer, ImportError> {
		let import_source = ImportSource::RemoteImap {
			imap_import_client: ImapImport::new(imap_config),
		};
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.map_err(|e| ImportError::sdk("getting current_sym_group for imap import", e))?;

		let importer = Importer::new(
			logged_in_sdk,
			mail_group_key,
			target_mailset,
			import_source,
			target_owner_group,
		);

		Ok(importer)
	}

	pub async fn create_file_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		source_paths: Vec<String>,
	) -> Result<Importer, ImportError> {
		let fs_email_client = FileImport::new(source_paths)
			.map_err(|e| ImportError::IterationError(IterationError::File(e)))?;
		let import_source = ImportSource::LocalFile { fs_email_client };
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.map_err(|err| {
				ImportError::sdk("trying to get mail group key for target owner group", err)
			})?;

		let importer = Importer::new(
			logged_in_sdk,
			mail_group_key,
			target_mailset,
			import_source,
			target_owner_group,
		);

		Ok(importer)
	}

	pub fn new(
		logged_in_sdk: Arc<LoggedInSdk>,
		mail_group_key: VersionedAesKey,
		target_mailset: IdTupleGenerated,
		import_source: ImportSource,
		target_owner_group: GeneratedId,
	) -> Self {
		let randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng);
		Self {
			state: ImportState {
				last_server_update: SystemTime::now(),
				remote_state: ImportMailState {
					_format: Default::default(),
					_id: Default::default(),
					_ownerEncSessionKey: Default::default(),
					_ownerGroup: Default::default(),
					_ownerKeyVersion: Default::default(),
					_permissions: Default::default(),
					status: Default::default(),
					failedMails: Default::default(),
					successfulMails: Default::default(),
					targetFolder: IdTupleGenerated::new(Default::default(), Default::default()),
					_errors: Default::default(),
					_finalIvs: Default::default(),
				},
				imported_mail_ids: vec![],
			},
			source: import_source,
			essentials: ImportEssential {
				logged_in_sdk,
				target_owner_group,
				mail_group_key,
				target_mailset,
				randomizer_facade,
			},
		}
	}

	pub async fn import_next_chunk(&mut self) -> Result<(), ImportError> {
		let Self {
			essentials: import_essentials,
			state: import_state,
			source: import_source,
		} = self;

		let mapped_import_source = import_source.into_iter().map(|importable_mail| {
			UnitImport::create_from_importable_mail(
				&import_essentials.randomizer_facade,
				&import_essentials.mail_group_key,
				importable_mail,
			)
		});
		let mut chunked_mails_provider =
			ImportableMailsButcher::new(mapped_import_source, |unit_import| {
				estimate_json_size(&unit_import.import_mail_data)
			});

		match chunked_mails_provider.next() {
			// everything have been finished
			None => {
				import_state.change_status(ImportStatus::Finished);
			},

			// this chunk was too big to import
			Some(Err(too_big_chunk)) => {
				import_state.add_failed_mails_count(1);
				Err(ImportError::TooBigChunk)?
			},

			// these chunks can be imported in single request
			Some(Ok(chunked_import_data)) => {
				let expected_imported_mails_count = chunked_import_data.len();

				let importable_post_data = import_essentials
					.make_serialized_chunk(chunked_import_data)
					.await
					.map_err(|e| {
						import_state.add_failed_mails_count(expected_imported_mails_count);
						e
					})?;

				let import_mails_post_out = import_essentials
					.make_import_service_call(importable_post_data)
					.await
					.map_err(|e| {
						import_state.add_failed_mails_count(expected_imported_mails_count);
						e
					})?;

				let imported_mails_count = import_mails_post_out.mails.len();
				import_state.add_newly_imported_mails(import_mails_post_out.mails);

				// make sure what we uploaded and what we got are same
				if imported_mails_count != expected_imported_mails_count {
					Err(ImportError::MismatchedImportCount {
						expected: expected_imported_mails_count,
						imported: imported_mails_count,
					})?
				}
			},
		}

		Ok(())
	}

	pub async fn start_stateful_import<CallbackHandle, Err>(
		&mut self,
		callback_handle: impl Fn() -> CallbackHandle,
	) -> Result<(), Err>
	where
		CallbackHandle: Future<Output = Result<StateCallbackResponse, Err>>,
		Err: From<ImportError>,
	{
		self.initialize_remote_state().await?;

		while self.get_remote_state().status != ImportStatus::Finished as i64 {
			self.state.change_status(ImportStatus::Running);

			let callback_response = callback_handle().await?;
			if callback_response.should_stop {
				self.state.change_status(ImportStatus::Canceled);
				break;
			}

			self.import_next_chunk().await?;

			self.state
				.update_import_state_on_server(&self.essentials.logged_in_sdk)
				.await?;
		}

		self.state
			.force_update_import_state_on_server(&self.essentials.logged_in_sdk)
			.await?;

		Ok(())
	}
}

impl ImportError {
	pub fn sdk(action: &'static str, error: ApiCallError) -> Self {
		Self::SdkError { action, error }
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

	pub async fn import_all_of_source(importer: &mut Importer) -> Result<(), ImportError> {
		importer
			.start_stateful_import(|| async { Ok(StateCallbackResponse { should_stop: false }) })
			.await
	}

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

		Importer::new(
			logged_in_sdk,
			mail_group_key,
			target_mail_folder,
			import_source,
			target_owner_group,
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

	pub async fn init_file_importer(source_paths: Vec<&str>) -> Importer {
		let files = source_paths
			.into_iter()
			.map(|file_name| {
				format!(
					"{}/tests/resources/testmail/{file_name}",
					env!("CARGO_MANIFEST_DIR")
				)
			})
			.collect();
		let import_source = ImportSource::LocalFile {
			fs_email_client: FileImport::new(files).unwrap(),
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

		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 2);
	}

	#[tokio::test]
	pub async fn import_single_from_imap_default_folder() {
		let (mut importer, greenmail) = init_imap_importer().await;

		let email = sample_email("Single email".to_string());
		greenmail.store_mail("sug@example.org", email.as_str());

		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_without_attachment() {
		let mut importer = init_file_importer(vec!["sample.eml"]).await;
		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_with_attachment() {
		let mut importer = init_file_importer(vec!["attachment_sample.eml"]).await;
		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn should_stop_if_true_response() {
		let mut importer = init_file_importer(vec!["sample.eml"]).await;

		let callback_resolver =
			|| async { Result::<_, ImportError>::Ok(StateCallbackResponse { should_stop: true }) };
		importer
			.start_stateful_import(callback_resolver)
			.await
			.unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Canceled as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 0);
	}
}
