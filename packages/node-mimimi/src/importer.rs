use crate::importer::importable_mail::{
	ImportableMailAttachment, ImportableMailAttachmentMetaData, KeyedImportableMailAttachment,
};
use crate::reduce_to_chunks::{AttachmentUploadData, KeyedImportMailData};
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use file_reader::{FileImport, FileIterationError};
use imap_reader::ImapImportConfig;
use imap_reader::{ImapImport, ImapIterationError};
use importable_mail::ImportableMail;
use std::fs;
use std::future::Future;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tutasdk::blobs::blob_facade::FileData;
use tutasdk::crypto::aes;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::{GenericAesKey, VersionedAesKey};
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::entities::generated::sys::{BlobReferenceTokenWrapper, StringWrapper};

use tutasdk::entities::generated::tutanota::{
	ImportAttachment, ImportMailGetIn, ImportMailPostIn, ImportMailPostOut, ImportMailState,
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

#[cfg(not(test))]
pub const MAX_REQUEST_SIZE: usize = 1024 * 1024 * 8;
#[cfg(test)]
pub const MAX_REQUEST_SIZE: usize = 1024 * 5;

// We need this type because IdTupleGenerated cannot be converted to a napi value.
#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
#[cfg_attr(test, derive(Debug))]
#[derive(Clone, PartialEq)]
pub struct ImportMailStateId {
	pub list_id: String,
	pub element_id: String,
}

#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
#[cfg_attr(test, derive(Debug))]
#[derive(Clone, PartialEq)]
pub struct ResumableImport {
	pub remote_state_id: ImportMailStateId,
	pub remaining_eml_count: i64,
}

impl From<IdTupleGenerated> for ImportMailStateId {
	fn from(
		IdTupleGenerated {
			list_id,
			element_id,
		}: IdTupleGenerated,
	) -> Self {
		Self {
			list_id: list_id.to_string(),
			element_id: element_id.to_string(),
		}
	}
}

impl From<ImportMailStateId> for IdTupleGenerated {
	fn from(
		ImportMailStateId {
			list_id,
			element_id,
		}: ImportMailStateId,
	) -> Self {
		Self {
			list_id: GeneratedId::from(list_id),
			element_id: GeneratedId::from(element_id),
		}
	}
}
#[derive(Debug)]
pub enum ImportError {
	SdkError {
		// action we were trying to perform on sdk
		action: &'static str,
		// actual error sdk returned
		error: ApiCallError,
	},
	/// import feature is not available for this user
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
	/// Different stateId was returned by server for same session of import
	InconsistentStateId,
	/// Error that occured when deleting a file
	FileDeletionError(std::io::Error, PathBuf),
	IOError(std::io::Error),
	CannotLoadMailbox,
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
	Running = 0,
	Paused = 1,
	Canceled = 2,
	Finished = 3,
}

/// A running import can be stopped or paused
#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[cfg_attr(not(feature = "javascript"), derive(Clone))]
#[derive(PartialEq)]
#[cfg_attr(test, derive(Debug))]
#[repr(u8)]
pub enum ImportProgressAction {
	Continue = 0,
	Pause = 1,
	Stop = 2,
}

/// when state callback function is called after every chunk of import,
/// javascript handle is expected to respond with this struct
#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
#[cfg_attr(test, derive(Debug))]
pub struct StateCallbackResponse {
	pub action: ImportProgressAction,
}

#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[derive(Clone)]
pub struct LocalImportState {
	pub remote_state_id: ImportMailStateId,
	pub current_status: ImportStatus,
	pub start_timestamp: i64,
	pub total_count: i64,
	pub success_count: i64,
	pub failed_count: i64,
}

pub struct ImportEssential {
	pub logged_in_sdk: Arc<LoggedInSdk>,
	target_owner_group: GeneratedId,
	mail_group_key: VersionedAesKey,
	target_mailset: IdTupleGenerated,
	randomizer_facade: RandomizerFacade,
}

pub struct Importer {
	pub state: LocalImportState,
	pub essentials: ImportEssential,
	source: ImportSource,
	import_directory: PathBuf,
}

pub enum ImportSource {
	RemoteImap { imap_import_client: Box<ImapImport> },
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
	super::reduce_to_chunks::Butcher<{ MAX_REQUEST_SIZE }, AttachmentUploadData, Source>;
impl Importer {
	fn make_random_aggregate_id(randomizer_facade: &RandomizerFacade) -> CustomId {
		let new_id_bytes = randomizer_facade.generate_random_array::<4>();
		let new_id_string = BASE64_URL_SAFE_NO_PAD.encode(new_id_bytes);
		CustomId(new_id_string)
	}
}

impl ImportEssential {
	const IMPORT_DISABLED_ERR: ApiCallError = ApiCallError::ServerResponseError {
		source: HttpError::PreconditionFailedError(Some(ImportFailure(
			ImportFailureReason::ImportDisabled,
		))),
	};

	async fn upload_attachments_for_chunk(
		&self,
		importable_chunk: Vec<AttachmentUploadData>,
	) -> Result<Vec<KeyedImportMailData>, ImportError> {
		let mut upload_data_per_mail: Vec<(Vec<FileData>, Vec<ImportableMailAttachmentMetaData>)> =
			Vec::with_capacity(importable_chunk.len());
		let attachments_count_per_mail: Vec<usize> = importable_chunk
			.iter()
			.map(|mail| mail.attachments.len())
			.collect();

		// aggregate attachment data from multiple mails to upload in fewer request to the BlobService
		let (attachments_per_mail, keyed_import_mail_data): (
			Vec<Vec<ImportableMailAttachment>>,
			Vec<KeyedImportMailData>,
		) = importable_chunk
			.into_iter()
			.map(|mail| (mail.attachments, mail.keyed_import_mail_data))
			.unzip();

		for attachments_next_mail in attachments_per_mail {
			if !attachments_next_mail.is_empty() {
				let keyed_attachments: Vec<KeyedImportableMailAttachment> = attachments_next_mail
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
				// attachments_next_mail is empty we push empty vectors in order to maintain
				// correct order of blob reference tokens across different attachments and mails
				// these empty vectors indicate
				// * an empty list of attachments
				// * and an empty list of corresponding attachment metadata for this mail
				upload_data_per_mail.push((vec![], vec![]));
			}
		}

		let (attachments_file_data_per_mail, attachments_meta_data_per_mail): (
			Vec<Vec<FileData>>,
			Vec<Vec<ImportableMailAttachmentMetaData>>,
		) = upload_data_per_mail.into_iter().unzip();

		let attachments_file_data_flattened: Vec<&FileData> =
			attachments_file_data_per_mail.iter().flatten().collect();

		// upload all attachments in this chunk in one call to the blob_facade
		// the blob_facade chunks them into efficient request to the BlobService
		let mut reference_tokens_per_attachment_flattened = self
			.logged_in_sdk
			.blob_facade()
			.encrypt_and_upload_multiple(
				ArchiveDataType::Attachments,
				&self.target_owner_group,
				attachments_file_data_flattened,
			)
			.await
			.map_err(|e| ImportError::sdk("fail to upload multiple attachments", e))?;

		// reference mails and received reference tokens, by using the attachments count per mail
		let mut all_reference_tokens_per_mail: Vec<Vec<Vec<BlobReferenceTokenWrapper>>> = vec![];
		for attachments_count in attachments_count_per_mail {
			if attachments_count == 0 {
				all_reference_tokens_per_mail.push(vec![]);
			} else {
				let reference_tokens_per_mail = reference_tokens_per_attachment_flattened
					.drain(..attachments_count)
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
				.map(
					|(file_data, (meta_data, reference_tokens_per_attachment))| {
						file_data
							.into_iter()
							.zip(meta_data.into_iter().zip(reference_tokens_per_attachment))
							.map(|(file_datum, (meta_datum, reference_tokens))| {
								meta_datum.make_import_attachment_data(
									self,
									&file_datum.session_key,
									reference_tokens,
								)
							})
							.collect()
					},
				)
				.collect();

		let unit_import_results = keyed_import_mail_data
			.into_iter()
			.zip(import_attachments_per_mail)
			.map(|(mut unit_import, import_attachments)| {
				unit_import.import_mail_data.importedAttachments = import_attachments;
				unit_import
			})
			.collect();

		Ok(unit_import_results)
	}

	async fn make_serialized_chunk(
		&self,
		remote_state_id: IdTupleGenerated,
		importable_chunk: Vec<KeyedImportMailData>,
	) -> Result<(ImportMailPostIn, GenericAesKey), ImportError> {
		let mut serialized_imports = Vec::with_capacity(importable_chunk.len());

		for unit_import in importable_chunk {
			let serialized_import = self
				.logged_in_sdk
				.serialize_instance_to_json(unit_import.import_mail_data, unit_import.session_key)
				.map_err(|e| ImportError::sdk("serializing instance to json", e))?;
			let wrapped_import_data = StringWrapper {
				_id: Some(Importer::make_random_aggregate_id(&self.randomizer_facade)),
				value: serialized_import,
			};
			serialized_imports.push(wrapped_import_data);
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
			mailState: remote_state_id,
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

impl LocalImportState {
	fn change_status(&mut self, new_status: ImportStatus) {
		self.current_status = new_status;
	}
}

impl Importer {
	pub async fn create_imap_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		imap_config: ImapImportConfig,
		import_directory: PathBuf,
	) -> Result<Importer, ImportError> {
		let import_source = ImportSource::RemoteImap {
			imap_import_client: Box::new(ImapImport::new(imap_config)),
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
			import_directory,
		);

		Ok(importer)
	}

	pub async fn create_file_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		source_paths: Vec<PathBuf>,
		import_directory: PathBuf,
	) -> Result<Importer, ImportError> {
		let fs_email_client = FileImport::new(source_paths)
			.map_err(|e| ImportError::IterationError(IterationError::File(e)))?;
		let import_source = ImportSource::LocalFile { fs_email_client };
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
			import_directory,
		);

		Ok(importer)
	}

	pub fn new(
		logged_in_sdk: Arc<LoggedInSdk>,
		mail_group_key: VersionedAesKey,
		target_mailset: IdTupleGenerated,
		import_source: ImportSource,
		target_owner_group: GeneratedId,
		import_directory: PathBuf,
	) -> Self {
		let randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng);

		Self {
			source: import_source,
			essentials: ImportEssential {
				logged_in_sdk,
				target_owner_group,
				mail_group_key,
				target_mailset,
				randomizer_facade,
			},
			state: LocalImportState::new(),
			import_directory,
		}
	}

	fn update_remote_state_id(
		local_state: &mut LocalImportState,
		state_id: IdTupleGenerated,
		import_directory: PathBuf,
	) -> Result<(), ImportError> {
		let min_id = GeneratedId::min_id();

		if local_state.remote_state_id.list_id == min_id.as_str()
			&& local_state.remote_state_id.element_id == min_id.as_str()
		{
			let generated = state_id.clone();
			local_state.remote_state_id = state_id.into();
			let mut state_id_file = import_directory.clone();
			state_id_file.push("import_mail_state");

			fs::write(state_id_file, generated.to_string()).map_err(ImportError::IOError)?;
			return Ok(());
		}

		// once id is set, it should always be same
		if local_state.remote_state_id != state_id.into() {
			return Err(ImportError::InconsistentStateId);
		}

		Ok(())
	}

	pub async fn load_import_state(
		logged_in_sdk: &LoggedInSdk,
		id: ImportMailStateId,
	) -> Result<ImportMailState, ApiCallError> {
		let id = IdTupleGenerated::from(id);
		logged_in_sdk
			.mail_facade()
			.get_crypto_entity_client()
			.load::<ImportMailState, _>(&id)
			.await
	}
	async fn mark_remote_final_state(
		&mut self,
		final_status: ImportStatus,
	) -> Result<(), ImportError> {
		assert!(
			final_status == ImportStatus::Finished
				|| final_status == ImportStatus::Canceled
				|| final_status == ImportStatus::Paused,
			"only cancel and finished should be final state"
		);

		// we reached final state before making first call, was either empty mails or was cancelled before making first post call
		if self.state.remote_state_id
			!= IdTupleGenerated::new(GeneratedId::min_id(), GeneratedId::min_id()).into()
		{
			let mut import_state = Self::load_import_state(
				&self.essentials.logged_in_sdk,
				self.state.remote_state_id.clone(),
			)
			.await
			.map_err(|e| ImportError::sdk("loading importState before Finished", e))?;
			import_state.status = final_status as i64;

			self.essentials
				.logged_in_sdk
				.mail_facade()
				.get_crypto_entity_client()
				.update_instance(import_state)
				.await
				.map_err(|e| ImportError::sdk("update remote import state", e))?;
		}

		Ok(())
	}

	pub async fn import_next_chunk(&mut self) -> Result<(), ImportError> {
		let Self {
			essentials: import_essentials,
			source: import_source,
			state: import_state,
			import_directory,
		} = self;

		let attachment_upload_data = import_source.into_iter().map(|importable_mail| {
			AttachmentUploadData::create_from_importable_mail(
				&import_essentials.randomizer_facade,
				&import_essentials.mail_group_key,
				importable_mail,
			)
		});
		let mut chunked_mails_provider =
			ImportableMailsButcher::new(attachment_upload_data, |upload_data| {
				estimate_json_size(&upload_data.keyed_import_mail_data.import_mail_data)
			});

		match chunked_mails_provider.next() {
			// everything have been finished
			None => {
				self.state.change_status(ImportStatus::Finished);
				Ok(())
			},

			// this chunk was too big to import
			Some(Err(_too_big_chunk)) => {
				self.state.failed_count += 1;
				Err(ImportError::TooBigChunk)?
			},

			// these chunks can be imported in single request
			Some(Ok(chunked_import_data)) => {
				let import_count_in_this_chunk: i64 = chunked_import_data
					.len()
					.try_into()
					.expect("item count in single chunk will never exceed i64::max");

				let eml_file_paths: Vec<Option<PathBuf>> = chunked_import_data
					.iter()
					.map(|id| id.keyed_import_mail_data.eml_file_path.clone())
					.collect();

				let unit_import_data = import_essentials
					.upload_attachments_for_chunk(chunked_import_data)
					.await
					.inspect_err(|_e| {
						import_state.failed_count += import_count_in_this_chunk;
					})?;
				let importable_post_data = import_essentials
					.make_serialized_chunk(
						import_state.remote_state_id.clone().into(),
						unit_import_data,
					)
					.await
					.inspect_err(|_e| {
						import_state.failed_count += import_count_in_this_chunk;
					})?;

				let import_mails_post_out = import_essentials
					.make_import_service_call(importable_post_data)
					.await
					.inspect_err(|_e| {
						import_state.failed_count += import_count_in_this_chunk;
					})?;

				Self::update_remote_state_id(
					import_state,
					import_mails_post_out.mailState,
					import_directory.clone(),
				)?;
				import_state.success_count += import_count_in_this_chunk;
				for eml_file_path in eml_file_paths.into_iter().flatten() {
					fs::remove_file(&eml_file_path)
						.map_err(|e| ImportError::FileDeletionError(e, eml_file_path))?;
				}

				Ok(())
			},
		}
	}

	pub async fn start_stateful_import<CallbackHandle, Err>(
		&mut self,
		callback_handle: impl Fn(LocalImportState) -> CallbackHandle,
	) -> Result<(), Err>
	where
		CallbackHandle: Future<Output = Result<StateCallbackResponse, Err>>,
		Err: From<ImportError>,
	{
		self.state.change_status(ImportStatus::Running);
		'import: loop {
			let callback_response = callback_handle(self.state.clone()).await?;
			match callback_response.action {
				ImportProgressAction::Pause => {
					self.state.change_status(ImportStatus::Paused);
					callback_handle(self.state.clone()).await?;
					self.mark_remote_final_state(ImportStatus::Paused).await?;
					break 'import Ok(());
				},
				ImportProgressAction::Stop => {
					self.state.change_status(ImportStatus::Canceled);
					self.mark_remote_final_state(ImportStatus::Canceled).await?;
					Self::delete_import_dir(&self.import_directory)?;
					callback_handle(self.state.clone()).await?;
					break 'import Ok(());
				},
				ImportProgressAction::Continue => {
					self.import_next_chunk().await?;
					if self.state.current_status == ImportStatus::Finished {
						self.mark_remote_final_state(ImportStatus::Finished).await?;
						Self::delete_import_dir(&self.import_directory)?;
						break 'import Ok(());
					}
				},
			}
		}
	}

	pub(super) async fn get_resumable_import(
		config_directory: String,
		mailbox_id: String,
	) -> Result<ResumableImport, ImportError> {
		let import_directory_path =
			Importer::get_import_directory(config_directory, GeneratedId::from(mailbox_id));
		let mut state_file_path = import_directory_path.clone();
		state_file_path.push("import_mail_state");

		if let Ok(id_tuple) = fs::read_to_string(&state_file_path) {
			let id_vec: Vec<String> = id_tuple.split("/").map(String::from).collect();
			if id_vec.len() == 2 {
				let id = IdTupleGenerated::try_from(id_tuple).unwrap();
				let mut count = 0_i64;

				fs::read_dir(import_directory_path.as_path())
					.map_err(ImportError::IOError)?
					.for_each(|_e| count += 1);
				count = count.saturating_sub(1);

				return Ok(ResumableImport {
					remote_state_id: ImportMailStateId::from(id),
					remaining_eml_count: count,
				});
			}
		}

		Self::delete_import_dir(&state_file_path.parent().unwrap().to_path_buf())?;

		Err(ImportError::NoElementIdForState)
	}

	fn delete_import_dir(import_directory_path: &PathBuf) -> Result<(), ImportError> {
		if import_directory_path.exists() {
			fs::remove_dir_all(import_directory_path)
				.map_err(|e| ImportError::FileDeletionError(e, import_directory_path.clone()))?;
		}
		Ok(())
	}
	pub fn get_import_directory(config_directory: String, mailbox_id: GeneratedId) -> PathBuf {
		[
			config_directory,
			"current_imports".into(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect()
	}
}

impl ImportError {
	pub fn sdk(action: &'static str, error: ApiCallError) -> Self {
		Self::SdkError { action, error }
	}
}

impl Default for LocalImportState {
	fn default() -> Self {
		Self::new()
	}
}

impl LocalImportState {
	pub fn new() -> Self {
		Self {
			remote_state_id: IdTupleGenerated::new(GeneratedId::min_id(), GeneratedId::min_id())
				.into(),
			current_status: Default::default(),
			start_timestamp: SystemTime::now()
				.duration_since(UNIX_EPOCH)
				.unwrap_or_default()
				.as_millis()
				.try_into()
				.unwrap_or_default(),
			total_count: 0,
			success_count: 0,
			failed_count: 0,
		}
	}
}

#[cfg(test)]
#[cfg(not(ci))]
mod tests {
	use super::*;
	use crate::importer::imap_reader::{ImapCredentials, LoginMechanism};

	use crate::tuta_imap::testing::GreenMailTestServer;
	use mail_builder::MessageBuilder;
	use std::sync::Mutex;
	use tutasdk::entities::generated::tutanota::MailFolder;
	use tutasdk::folder_system::MailSetKind;
	use tutasdk::net::native_rest_client::NativeRestClient;
	use tutasdk::Sdk;

	const IMPORTED_MAIL_ADDRESS: &str = "map-premium@tutanota.de";

	fn get_test_id() -> u32 {
		static TEST_COUNTER: Mutex<u32> = Mutex::new(0);
		let mut old_count_guard = TEST_COUNTER.lock().expect("Mutex poisoned");
		let new_count = old_count_guard.checked_add(1).unwrap();
		*old_count_guard = new_count;
		drop(old_count_guard);
		new_count
	}
	pub async fn import_all_of_source(importer: &mut Importer) -> Result<(), ImportError> {
		importer
			.start_stateful_import(|_| async {
				Ok(StateCallbackResponse {
					action: ImportProgressAction::Continue,
				})
			})
			.await
	}

	fn assert_same_remote_and_local_state(
		remote_state: &ImportMailState,
		local_state: &LocalImportState,
	) {
		// todo! sug
		// assert_eq!(remote_state.status, local_state.current_status as i64);
		assert_eq!(remote_state.failedMails, local_state.failed_count);
		assert_eq!(remote_state.successfulMails, local_state.success_count);
		assert_eq!(
			remote_state._id,
			Some(local_state.remote_state_id.clone().into())
		);
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

	pub async fn init_importer(import_source: ImportSource, target_folder: PathBuf) -> Importer {
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
			target_folder,
		)
	}

	async fn init_imap_importer(test_index: u8) -> (Importer, GreenMailTestServer) {
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
			imap_import_client: Box::new(ImapImport::new(imap_import_config)),
		};
		let target_directory = format!("/tmp/import_imap_{}", test_index).into();
		fs::create_dir_all(&target_directory).unwrap();
		(
			init_importer(import_source, target_directory).await,
			greenmail,
		)
	}

	pub async fn init_file_importer(source_paths: Vec<&str>) -> Importer {
		let files = source_paths
			.into_iter()
			.map(|file_name| {
				PathBuf::from(format!(
					"{}/tests/resources/testmail/{file_name}",
					env!("CARGO_MANIFEST_DIR")
				))
			})
			.collect();
		let target_folder: PathBuf = format!("/tmp/import_test_{}", get_test_id()).into();
		fs::create_dir_all(&target_folder).unwrap();
		let source_paths =
			FileImport::prepare_import(target_folder.as_path().into(), files).unwrap();

		let import_source = ImportSource::LocalFile {
			fs_email_client: FileImport::new(source_paths).unwrap(),
		};
		init_importer(import_source, target_folder).await
	}

	#[tokio::test]
	pub async fn import_multiple_from_imap_default_folder() {
		let (mut importer, greenmail) = init_imap_importer(0).await;

		let email_first = sample_email("Hello from imap 😀! -- Список.doc".to_string());
		let email_second = sample_email("Second time: hello".to_string());
		greenmail.store_mail("sug@example.org", email_first.as_str());
		greenmail.store_mail("sug@example.org", email_second.as_str());

		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = Importer::load_import_state(
			&importer.essentials.logged_in_sdk,
			importer.state.remote_state_id.clone(),
		)
		.await
		.unwrap();
		assert_same_remote_and_local_state(&remote_state, &importer.state);

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 2);
	}

	#[tokio::test]
	pub async fn import_single_from_imap_default_folder() {
		let (mut importer, greenmail) = init_imap_importer(1).await;

		let email = sample_email("Single email".to_string());
		greenmail.store_mail("sug@example.org", email.as_str());

		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = Importer::load_import_state(
			&importer.essentials.logged_in_sdk,
			importer.state.remote_state_id.clone(),
		)
		.await
		.unwrap();

		assert_same_remote_and_local_state(&remote_state, &importer.state);
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_without_attachment() {
		let mut importer = init_file_importer(vec!["sample.eml"]).await;
		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = Importer::load_import_state(
			&importer.essentials.logged_in_sdk,
			importer.state.remote_state_id.clone(),
		)
		.await
		.unwrap();

		assert_same_remote_and_local_state(&remote_state, &importer.state);
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_with_attachment() {
		let mut importer = init_file_importer(vec!["attachment_sample.eml"]).await;
		import_all_of_source(&mut importer).await.unwrap();
		let remote_state = Importer::load_import_state(
			&importer.essentials.logged_in_sdk,
			importer.state.remote_state_id.clone(),
		)
		.await
		.unwrap();

		assert_same_remote_and_local_state(&remote_state, &importer.state);
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	#[ignore = "present for jhm and sug"]
	async fn should_stop_if_on_stop_action() {
		let mut importer = init_file_importer(vec!["sample.eml"; 3]).await;

		let callback_resolver = |_| async {
			Result::<_, ImportError>::Ok(StateCallbackResponse {
				action: ImportProgressAction::Stop,
			})
		};
		importer
			.start_stateful_import(callback_resolver)
			.await
			.unwrap();
		let remote_state = Importer::load_import_state(
			&importer.essentials.logged_in_sdk,
			importer.state.remote_state_id.clone(),
		)
		.await
		.unwrap();

		assert_eq!(remote_state.status, ImportStatus::Canceled as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[test]
	fn max_request_size_in_test_is_different() {
		assert_eq!(1024 * 5, MAX_REQUEST_SIZE);
	}

	#[tokio::test]
	async fn get_resumable_state_id_should_delete_import_folder_if_no_state_id() {
		let config_dir_string =
			"/tmp/get_resumable_state_id_should_delete_import_folder_if_no_state_id";
		let mailbox_id = "some_mailbox_id";
		let import_dir: PathBuf = [
			config_dir_string.to_string(),
			"current_imports".to_string(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect();
		let config_dir = PathBuf::from(config_dir_string);

		let _tear_down = CleanDir {
			dir: config_dir.clone(),
		};

		if !import_dir.exists() {
			fs::create_dir_all(&import_dir).unwrap();
		}

		let result = Importer::get_resumable_import(
			config_dir.display().to_string(),
			mailbox_id.to_string(),
		)
		.await;
		assert!(matches!(result, Err(ImportError::NoElementIdForState)));
		assert!(!import_dir.exists());
	}

	#[tokio::test]
	async fn get_resumable_state_id_should_delete_import_folder_does_not_exist() {
		let config_dir_string =
			"/tmp/get_resumable_state_id_should_delete_import_folder_does_not_exist";
		let mailbox_id = "some_mailbox_id";
		let import_dir: PathBuf = [
			config_dir_string.to_string(),
			"current_imports".to_string(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect();
		let config_dir = PathBuf::from(config_dir_string);

		let result = Importer::get_resumable_import(
			config_dir.display().to_string(),
			mailbox_id.to_string(),
		)
		.await;
		assert!(matches!(result, Err(ImportError::NoElementIdForState)));
		assert!(!import_dir.exists());
	}

	#[tokio::test]
	async fn get_resumable_state_id_invalid_content() {
		let config_dir_string = "/tmp/get_resumable_state_id_invalid_content";
		let mailbox_id = "some_mailbox_id";
		let import_dir: PathBuf = [
			config_dir_string.to_string(),
			"current_imports".to_string(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect();
		let config_dir = PathBuf::from(config_dir_string);

		let _tear_down = CleanDir {
			dir: config_dir.clone(),
		};

		if !import_dir.exists() {
			fs::create_dir_all(&import_dir).unwrap();
		}
		let mut state_id_file_path = import_dir.clone();
		state_id_file_path.push("import_mail_state");
		let invalid_id = "blah";
		fs::write(&state_id_file_path, invalid_id).unwrap();

		let result = Importer::get_resumable_import(
			config_dir.display().to_string(),
			mailbox_id.to_string(),
		)
		.await;
		assert!(matches!(result, Err(ImportError::NoElementIdForState)),);
		assert!(!import_dir.try_exists().unwrap());
	}

	struct CleanDir {
		dir: PathBuf,
	}
	impl Drop for CleanDir {
		fn drop(&mut self) {
			if self.dir.exists() {
				fs::remove_dir_all(&self.dir).unwrap();
			}
		}
	}
}
