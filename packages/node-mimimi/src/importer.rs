use crate::importer::importable_mail::ImportableMailWithPath;
use crate::reduce_to_chunks::{KeyedImportMailData, MailUploadDataWithAttachment};
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use crypto_primitives::randomizer_facade::RandomizerFacade;
use file_reader::FileImport;
use std::ffi::OsStr;
use std::fs;
use std::fs::DirEntry;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tutasdk::crypto::aes;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::{GenericAesKey, VersionedAesKey};
use tutasdk::entities::generated::sys::StringWrapper;

use crate::importer::attachment_importer::PerChunkAttachmentImporter;
use crate::importer::messages::{
	ImportErrorKind, ImportOkKind, MailImportErrorMessage, PreparationError,
};
use crate::importer_api::TutaCredentials;
use tutasdk::bindings::native_file_client::NativeFileClient;
use tutasdk::entities::generated::tutanota::{
	ImportMailGetIn, ImportMailPostIn, ImportMailPostOut, ImportMailState,
};
use tutasdk::entities::json_size_estimator::estimate_json_size;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::services::generated::tutanota::ImportMailService;
use tutasdk::services::ExtraServiceParams;
use tutasdk::tutanota_constants::ArchiveDataType;
use tutasdk::{ApiCallError, CustomId, GeneratedId, IdTupleGenerated, LoggedInSdk};

pub mod messages;

mod attachment_importer;
pub mod file_reader;
mod filename_producer;
pub mod importable_mail;

#[cfg(not(test))]
pub const MAX_REQUEST_SIZE: usize = 1024 * 1024 * 8;
#[cfg(test)]
pub const MAX_REQUEST_SIZE: usize = 1024 * 5;

pub(super) const STATE_ID_FILE_NAME: &str = "import_mail_state";
pub(super) const FAILED_MAILS_SUB_DIR: &str = "failed-mails";

// We need this type because IdTupleGenerated cannot be converted to a napi value.
#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
#[cfg_attr(test, derive(Debug))]
#[derive(Clone, PartialEq)]
pub struct ImportMailStateId {
	pub list_id: String,
	pub element_id: String,
}

#[derive(Clone, PartialEq)]
pub struct LocalFileImportParams {
	file_path: String,
	is_mbox: bool,
}

/// current state of the imap_reader import for this tuta account
/// requires an initialized SDK!
/// keep in sync with TutanotaConstants.ts
#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[cfg_attr(not(feature = "javascript"), derive(Clone))]
#[derive(PartialEq, Default, Debug)]
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
#[derive(PartialEq, Debug)]
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

pub struct ImportEssential {
	pub logged_in_sdk: Arc<LoggedInSdk>,
	target_owner_group: GeneratedId,
	mail_group_key: VersionedAesKey,
	pub remote_state_id: IdTupleGenerated,
	randomizer_facade: RandomizerFacade,
	pub(super) import_directory: PathBuf,
}

pub enum ImportSource {
	LocalFile { fs_email_client: FileImport },
}

impl Iterator for ImportSource {
	type Item = ImportableMailWithPath;

	fn next(&mut self) -> Option<Self::Item> {
		match self {
			ImportSource::LocalFile { fs_email_client } => {
				fs_email_client.get_next_importable_mail()
			},
		}
	}
}

pub(super) type ImportLoopResult = Result<ImportOkKind, MailImportErrorMessage>;

impl ImportEssential {
	pub async fn load_remote_state(&self) -> Result<ImportMailState, ApiCallError> {
		self.logged_in_sdk
			.mail_facade()
			.get_crypto_entity_client()
			.load::<ImportMailState, _>(&self.remote_state_id)
			.await
	}

	/// updates the remote importMailState, if changes to importMailState are valid
	/// @params updater: function updating the importMailState internally,
	///                  and returning whether if it should be uploaded or not.
	pub(super) async fn update_remote_state(
		&self,
		updater: impl Fn(&mut ImportMailState) -> bool,
	) -> Result<(), MailImportErrorMessage> {
		let mut server_state = self
			.load_remote_state()
			.await
			.map_err(|e| MailImportErrorMessage::sdk("getting remote import state", e))?;

		let should_upload = updater(&mut server_state);
		if should_upload {
			self.logged_in_sdk
				.mail_facade()
				.get_crypto_entity_client()
				.update_instance(server_state)
				.await
				.map_err(|e| MailImportErrorMessage::sdk("update remote import state", e))
		} else {
			Ok(())
		}
	}

	fn make_serialized_chunk(
		&self,
		importable_chunk: Vec<KeyedImportMailData>,
	) -> Result<ImportMailPostIn, MailImportErrorMessage> {
		let mut serialized_imports = Vec::with_capacity(importable_chunk.len());

		for unit_import in importable_chunk {
			let serialized_import = self
				.logged_in_sdk
				.serialize_instance_to_json(unit_import.import_mail_data, unit_import.session_key)
				.map_err(|e| MailImportErrorMessage::sdk("serializing instance to json", e))?;
			let wrapped_import_data = StringWrapper {
				_id: Some(Importer::make_random_aggregate_id(&self.randomizer_facade)),
				value: serialized_import,
			};
			serialized_imports.push(wrapped_import_data);
		}

		let post_in = ImportMailPostIn {
			encImports: serialized_imports,
			mailState: self.remote_state_id.clone(),
			_format: 0,
		};

		Ok(post_in)
	}

	// distribute load across the cluster. should be switched to read token (once it is implemented on the
	// BlobFacade) and use ArchiveDataType::MailDetails to target one of the nodes that actually stores the
	// data
	async fn get_server_url_to_upload(&self) -> Result<String, MailImportErrorMessage> {
		self.logged_in_sdk
			.request_blob_facade_write_token(ArchiveDataType::Attachments)
			.await
			.map_err(|e| MailImportErrorMessage::sdk("request blob write token", e))?
			.servers
			.last()
			.map(|s| s.url.to_string())
			.ok_or(ImportErrorKind::EmptyBlobServerList.into())
	}

	async fn make_import_service_call(
		&self,
		import_mail_data: ImportMailPostIn,
	) -> Result<ImportMailPostOut, MailImportErrorMessage> {
		let server_to_upload = self.get_server_url_to_upload().await?;
		let import_mail_post_in = import_mail_data;

		self.logged_in_sdk
			.get_service_executor()
			.post::<ImportMailService>(
				import_mail_post_in,
				ExtraServiceParams {
					base_url: Some(server_to_upload),
					..Default::default()
				},
			)
			.await
			.map_err(|e| MailImportErrorMessage::sdk("calling ImportMailService", e))
	}

	pub async fn create_new_server_import_state(
		logged_in_sdk: &LoggedInSdk,
		randomizer_facade: &RandomizerFacade,
		mail_group_key: VersionedAesKey,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		total_importable_mails: i64,
	) -> Result<IdTupleGenerated, PreparationError> {
		let session_key = GenericAesKey::Aes256(aes::Aes256Key::generate(randomizer_facade));
		let owner_enc_sk_for_import_state_get =
			mail_group_key.encrypt_key(&session_key, Iv::generate(randomizer_facade));
		let import_mail_get_in = ImportMailGetIn {
			_format: 0,
			newImportedMailSetName: "@internal-mailset".to_string(),
			ownerEncSessionKey: owner_enc_sk_for_import_state_get.object,
			ownerGroup: target_owner_group,
			ownerKeyVersion: owner_enc_sk_for_import_state_get.version as i64,
			totalMails: total_importable_mails,
			targetMailFolder: target_mailset,
			_errors: Default::default(),
			_finalIvs: Default::default(),
		};

		let import_get_response = logged_in_sdk
			.get_service_executor()
			.get::<ImportMailService>(
				import_mail_get_in,
				ExtraServiceParams {
					session_key: Some(session_key),
					..Default::default()
				},
			)
			.await
			.map_err(|e| {
				log::error!("Can not get:: on ImportMailService: {e:?}");

				if e == ImportErrorKind::IMPORT_DISABLED_ERROR {
					PreparationError::ImportFeatureDisabled
				} else {
					PreparationError::CannotLoadRemoteState
				}
			})?;

		Ok(import_get_response.mailState)
	}
}

pub struct Importer {
	pub(super) essentials: ImportEssential,
	next_progress_action: napi::tokio::sync::Mutex<ImportProgressAction>,
	chunked_import_source: napi::tokio::sync::Mutex<
		super::reduce_to_chunks::Butcher<{ MAX_REQUEST_SIZE }, MailUploadDataWithAttachment>,
	>,
}
impl Importer {
	fn make_random_aggregate_id(randomizer_facade: &RandomizerFacade) -> CustomId {
		let new_id_bytes = randomizer_facade.generate_random_array::<4>();
		let new_id_string = BASE64_URL_SAFE_NO_PAD.encode(new_id_bytes);
		CustomId(new_id_string)
	}

	pub(super) async fn set_next_progress_action(&self, action: ImportProgressAction) {
		*self.next_progress_action.lock().await = action;
	}

	/// called to start a completely new import, not on resume
	pub(super) async fn create_new_file_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		import_directory: PathBuf,
	) -> Result<Importer, PreparationError> {
		let eml_files_to_import: Vec<PathBuf> = Self::eml_files_in_directory(&import_directory)
			.map_err(|_| PreparationError::FailedToReadEmls)?;
		let total_importable_mails = eml_files_to_import.len() as i64;

		let import_source = ImportSource::LocalFile {
			fs_email_client: FileImport::new(eml_files_to_import),
		};

		Importer::initialize(
			logged_in_sdk,
			None,
			import_source,
			target_owner_group,
			import_directory,
			target_mailset,
			total_importable_mails,
		)
		.await
	}

	pub(super) async fn create_sdk(
		config_directory: &str,
		tuta_credentials: TutaCredentials,
	) -> Result<Arc<LoggedInSdk>, PreparationError> {
		let base_url = tuta_credentials.api_url.clone();
		let rest_client = NativeRestClient::try_new().map_err(|e| {
			log::error!("Can not create new native rest client: {e:?}");
			PreparationError::NoNativeRestClient
		})?;
		let file_client = NativeFileClient::try_new(config_directory.into()).map_err(|e| {
			log::error!("Can not create new native rest client: {e:?}");
			PreparationError::NoNativeRestClient
		})?;

		let logged_in_sdk =
			tutasdk::Sdk::new(base_url, Arc::new(rest_client), Arc::new(file_client))
				.login(tuta_credentials.into())
				.await
				.map_err(|e| {
					log::error!("Can not login to sdk: {e:?}");
					PreparationError::LoginError
				})?;

		Ok(logged_in_sdk)
	}

	fn eml_files_in_directory(directory: &Path) -> std::io::Result<Vec<PathBuf>> {
		Ok(fs::read_dir(directory)?
			.collect::<std::io::Result<Vec<DirEntry>>>()?
			.iter()
			.map(DirEntry::path)
			.filter(|path| path.is_file() && path.extension() == Some(OsStr::new("eml")))
			.collect())
	}

	/// check the given directory for any failed mail files that have been left behind during iteration
	pub(crate) fn get_failed_mails_count(import_directory: &Path) -> std::io::Result<usize> {
		let failed_sub_dir = import_directory.join(FAILED_MAILS_SUB_DIR);
		let failed_mails_count = fs::read_dir(failed_sub_dir)?
			.collect::<std::io::Result<Vec<DirEntry>>>()?
			.iter()
			.map(DirEntry::path)
			.filter(|path| path.extension() == Some(OsStr::new("eml")))
			.count();

		Ok(failed_mails_count)
	}

	pub(super) async fn resume_file_importer(
		mailbox_id: &str,
		config_directory: String,
		target_owner_group: GeneratedId,
		tuta_credentials: TutaCredentials,
		import_state_id: IdTupleGenerated,
	) -> Result<Importer, PreparationError> {
		let import_directory =
			FileImport::make_import_directory_path(&config_directory, mailbox_id);

		let eml_files_to_import = Self::eml_files_in_directory(import_directory.as_path())
			.map_err(|_| PreparationError::FailedToReadEmls)?;
		let total_importable_mails = eml_files_to_import.len() as i64;
		let import_source = ImportSource::LocalFile {
			fs_email_client: FileImport::new(eml_files_to_import),
		};

		let logged_in_sdk = Self::create_sdk(&config_directory, tuta_credentials).await?;
		let remote_import_state = logged_in_sdk
			.mail_facade()
			.get_crypto_entity_client()
			.load::<ImportMailState, _>(&import_state_id)
			.await
			.map_err(|e| {
				log::error!("Can not load remote import state: {e:?}");
				PreparationError::CannotLoadRemoteState
			})?;

		let target_mailset = remote_import_state.targetFolder;

		let importer = Importer::initialize(
			logged_in_sdk,
			Some(import_state_id),
			import_source,
			target_owner_group,
			import_directory,
			target_mailset,
			total_importable_mails,
		)
		.await?;
		Ok(importer)
	}

	/// set up remote state for this import if necessary and write the information
	/// to disk so it can be resumed if interrupted.
	pub(super) async fn initialize(
		logged_in_sdk: Arc<LoggedInSdk>,
		remote_state_id: Option<IdTupleGenerated>,
		import_source: ImportSource,
		target_owner_group: GeneratedId,
		import_directory: PathBuf,
		target_mailset: IdTupleGenerated,
		total_importable_mails: i64,
	) -> Result<Importer, PreparationError> {
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.map_err(|_| PreparationError::NoMailGroupKey)?;

		// the key is not copy, and we want to re-use it after moving it into the map fn
		// not using a move closure also doesn't work since we don't want to collect the iterator here.
		let mail_group_key_clone = mail_group_key.clone();
		let attachment_upload_data = import_source.into_iter().map(move |importable_mail| {
			let my_key = mail_group_key_clone.clone();
			MailUploadDataWithAttachment::create_from_importable_mail(
				&RandomizerFacade::from_core(rand::rngs::OsRng),
				&my_key,
				importable_mail,
			)
		});
		let chunked_mails_provider = super::reduce_to_chunks::Butcher::new(
			Box::new(attachment_upload_data),
			|upload_data| estimate_json_size(&upload_data.keyed_import_mail_data.import_mail_data),
		);
		let chunked_mails_provider = napi::tokio::sync::Mutex::new(chunked_mails_provider);

		let randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng);

		let remote_state_id = match remote_state_id {
			Some(remote_state_id) => remote_state_id,
			None => {
				ImportEssential::create_new_server_import_state(
					&logged_in_sdk,
					&randomizer_facade,
					mail_group_key.clone(),
					target_owner_group.clone(),
					target_mailset,
					total_importable_mails,
				)
				.await?
			},
		};

		let state_file_path = import_directory.join(STATE_ID_FILE_NAME);
		fs::write(
			state_file_path,
			format!("{}/{}", remote_state_id.list_id, remote_state_id.element_id),
		)
		.map_err(|_| PreparationError::StateFileWriteFailed)?;

		let import_essentials = ImportEssential {
			logged_in_sdk,
			target_owner_group,
			mail_group_key,
			randomizer_facade,
			remote_state_id,
			import_directory,
		};

		let importer = Importer {
			chunked_import_source: chunked_mails_provider,
			essentials: import_essentials,
			next_progress_action: napi::tokio::sync::Mutex::new(ImportProgressAction::Continue),
		};
		Ok(importer)
	}

	/// return `Ok(None)` if all mails are finished. we can remove the remote state id. the folder will be left with
	///        the unparseable/unreadable mails.
	///        `Ok(Some(..))` if we need to do another loop. the returned vector contains the file paths that were
	///        successfully uploaded.
	///        `Err()` if something went wrong. we might still continue depending on the error.
	pub async fn import_next_chunk(&self) -> Result<Option<Vec<PathBuf>>, MailImportErrorMessage> {
		let import_essentials = &self.essentials;
		let Self {
			chunked_import_source,
			..
		} = self;

		let next_chunk_to_import = chunked_import_source.lock().await.next();
		match next_chunk_to_import {
			// everything have been finished
			None => Ok(None),

			// this chunk was too big to import
			Some(Err(too_big_chunk)) => {
				log::debug!(
					"Too big chunk while uploading mail: {:?}",
					too_big_chunk.keyed_import_mail_data.eml_file_path
				);

				Err(MailImportErrorMessage {
					kind: ImportErrorKind::TooBigChunk,
					path: Some(
						too_big_chunk
							.keyed_import_mail_data
							.eml_file_path
							.to_string_lossy()
							.to_string()
							.clone(),
					),
				})?
			},

			// these chunks can be imported in single request
			Some(Ok(chunked_import_data)) => {
				let import_count_in_this_chunk: i64 = chunked_import_data
					.len()
					.try_into()
					.expect("item count in single chunk will never exceed i64::max");
				let eml_file_paths = chunked_import_data
					.iter()
					.map(|id| id.keyed_import_mail_data.eml_file_path.clone())
					.collect();

				let import_data_with_attachment_token =
					PerChunkAttachmentImporter::upload_attachments_for_chunk(
						&self.essentials,
						chunked_import_data,
					)
					.await?;
				let post_data =
					import_essentials.make_serialized_chunk(import_data_with_attachment_token)?;
				import_essentials
					.make_import_service_call(post_data)
					.await?;

				self.essentials
					.update_remote_state(move |state| {
						state.successfulMails += import_count_in_this_chunk;
						true
					})
					.await?;

				Ok(Some(eml_file_paths))
			},
		}
	}

	pub(super) async fn set_remote_import_status(
		&self,
		remote_import_status: ImportStatus,
	) -> Result<(), MailImportErrorMessage> {
		self.essentials
			.update_remote_state(|remote_state| {
				remote_state.status = remote_import_status as i64;
				true
			})
			.await
	}

	pub async fn start_stateful_import(&self) -> ImportLoopResult {
		loop {
			let requested_progress_action = *self.next_progress_action.lock().await;
			match requested_progress_action {
				ImportProgressAction::Pause => {
					return Ok(ImportOkKind::UserPauseInterruption);
				},
				ImportProgressAction::Stop => {
					self.update_failed_mails_counter().await;
					FileImport::delete_state_file(&self.essentials.import_directory).map_err(
						|_del_err| {
							MailImportErrorMessage::with_path(
								ImportErrorKind::FileDeletionError,
								self.essentials.import_directory.clone(),
							)
						},
					)?;
					return Ok(ImportOkKind::UserCancelInterruption);
				},

				ImportProgressAction::Continue => {
					let import_chunk_res = self.import_next_chunk().await;
					match import_chunk_res {
						Ok(None) => {
							self.update_failed_mails_counter().await;
							self.set_remote_import_status(ImportStatus::Finished)
								.await?;

							// deleting the state file is enough to mark there is no import running,
							// do not delete the whole directory because we will leave some un-importable file
							// in the directory. and users should be able to inspect those
							FileImport::delete_state_file(&self.essentials.import_directory)
								.map_err(|_del_err| {
									MailImportErrorMessage::with_path(
										ImportErrorKind::FileDeletionError,
										self.essentials.import_directory.clone(),
									)
								})?;

							let no_failed_mails =
								Importer::get_failed_mails_count(&self.essentials.import_directory)
									.map(|failed_mails_count| failed_mails_count == 0)
									// if we cannot read import directory to check for failed files,
									// pretend we have some failed mail
									.unwrap_or_default();
							return no_failed_mails
								.then_some(ImportOkKind::SourceExhaustedNoError)
								.ok_or(ImportErrorKind::SourceExhaustedSomeError.into());
						},

						Ok(Some(completed_paths)) => {
							self.remove_chunked_uploaded_files(completed_paths)?;
						},

						Err(chunk_import_error) => {
							self.handle_err_while_importing_chunk(chunk_import_error)
								.await?;
						},
					}
				},
			}
		}
	}

	fn remove_chunked_uploaded_files(
		&self,
		uploaded_files: Vec<PathBuf>,
	) -> Result<(), MailImportErrorMessage> {
		for eml_file_path in uploaded_files {
			fs::remove_file(&eml_file_path).map_err(|_e| {
				MailImportErrorMessage::with_path(ImportErrorKind::FileDeletionError, eml_file_path)
			})?;
		}

		Ok(())
	}

	/// Decide weather this error should abort the import process, or it should move to import the next chunk.
	/// - If it returns `Ok`, we should continue with the next chunk, if it returns `Err`, the error should
	///   be propagated to the node process to maybe be displayed, and the import should stop for now.
	/// - If mails involved in this error should not be picked when user retry, move them to FAILED_MAILS_SUB_DIR
	async fn handle_err_while_importing_chunk(
		&self,
		import_error: MailImportErrorMessage,
	) -> Result<(), MailImportErrorMessage> {
		self.update_failed_mails_counter().await;
		match import_error.kind {
			// if the import is (temporary) disabled, we should give up and let user try again later
			ImportErrorKind::ImportFeatureDisabled => Err(ImportErrorKind::ImportFeatureDisabled)?,

			// If a server does not give any available blob storage client (which we also use to make service call),
			// nothing we can do about should error out in a client
			ImportErrorKind::EmptyBlobServerList => Err(ImportErrorKind::SdkError)?,

			ImportErrorKind::SdkError => Err(import_error)?,

			// if something is too big, we just rename it as failed,
			// and is fine to continue importing next one. user will get import incomplete notification at end
			ImportErrorKind::TooBigChunk => {
				let too_big_chunk_path = import_error
					.path
					.expect("All too bug chunk error should contain path");
				FileImport::move_failed_eml_file(&PathBuf::from(too_big_chunk_path)).ok();

				Ok(())
			},

			// this happen when we can not delete the files after uploading them,
			// this is unlikely, as we were able to copy and read.
			// worst that can happen is:
			// use restart the application and we will import this mail again
			// best that can happen is:
			// user do not re-start application and let import finish, so we remove state_id at end
			// and we will clean complete dir in next import
			ImportErrorKind::FileDeletionError => {
				// we can not delete the file after we imported it,
				// best case: everything else is fine and import is finished/canceled so we just delete the whole dir
				// worst case: user pause/resume ( or quit the app and open again ) and the imported chunk will be imported again
				Ok(())
			},

			// this kind will not be created by import loop,
			// exists only to pass over to api
			ImportErrorKind::SourceExhaustedSomeError => unreachable!(),
		}
	}

	/// We have some case where we don't update failedMails counter on failure,
	/// but only move them to FAILED_EML_SUB_DIR directory ( example: we failed to parse eml while importing ),
	/// we should also include those in state for user visibility,
	/// so it is safe to always override the counter with number of failed mails file,
	/// all failure case should make sure to move the failed emls in that sub-dir
	async fn update_failed_mails_counter(&self) {
		self.essentials
				.update_remote_state(|remote_state| {
					match Importer::get_failed_mails_count(&self.essentials.import_directory) {
						Ok(failed_mail_count) => {
							remote_state.failedMails = failed_mail_count as i64;
							true
						}
						Err(e) => {
							log::error!("Not incrementing failedMails on import state. Can not count failed emails: {e:?}");
							false
						}
					}
				})
				.await
				.ok();
	}

	pub(super) fn get_existing_import_id(
		import_directory: &Path,
	) -> std::io::Result<Option<IdTupleGenerated>> {
		let state_file_path = import_directory.join(STATE_ID_FILE_NAME);

		if !state_file_path.try_exists()? {
			return Ok(None);
		}

		let id_tuple_str = fs::read_to_string(&state_file_path)?;
		let [list_id, element_id] = id_tuple_str
			.split('/')
			.map(String::from)
			.collect::<Vec<_>>()
			.try_into()
			.map_err(|_e| std::io::ErrorKind::InvalidData)?;

		let id_tuple = IdTupleGenerated::new(GeneratedId(list_id), GeneratedId(element_id));
		Ok(Some(id_tuple))
	}
}

impl From<IdTupleGenerated> for ImportMailStateId {
	fn from(id_tuple: IdTupleGenerated) -> Self {
		Self {
			list_id: id_tuple.list_id.to_string(),
			element_id: id_tuple.element_id.to_string(),
		}
	}
}

impl From<ImportMailStateId> for IdTupleGenerated {
	fn from(id_tuple: ImportMailStateId) -> Self {
		Self {
			list_id: GeneratedId::from(id_tuple.list_id),
			element_id: GeneratedId::from(id_tuple.element_id),
		}
	}
}

#[cfg(test)]
pub mod tests {
	use super::*;
	use crate::test_utils::{init_file_importer, write_big_sample_email, CleanDir};

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local http server."
	)]
	#[tokio::test]
	async fn can_import_single_eml_file_without_attachment() {
		let importer = init_file_importer(vec!["sample.eml"]).await;
		importer.start_stateful_import().await.unwrap();

		let remote_state = importer.essentials.load_remote_state().await.unwrap();
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local https server."
	)]
	#[tokio::test]
	async fn can_import_single_eml_file_with_attachment() {
		let importer = init_file_importer(vec!["attachment_sample.eml"]).await;
		importer.start_stateful_import().await.unwrap();

		let remote_state = importer.essentials.load_remote_state().await.unwrap();
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local http server."
	)]
	#[tokio::test]
	async fn can_import_single_eml_file_with_invalid_date() {
		let importer = init_file_importer(vec!["brokendate.eml"]).await;
		importer.start_stateful_import().await.unwrap();

		let remote_state = importer.essentials.load_remote_state().await.unwrap();
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[test]
	fn max_request_size_in_test_is_different() {
		assert_eq!(1024 * 5, MAX_REQUEST_SIZE);
	}

	#[tokio::test]
	async fn existing_import_should_be_none_if_no_state_file() {
		let config_dir_string = "/tmp/existing_import_should_be_none_if_no_state_file";
		let mailbox_id = "some_mailbox_id";
		let import_dir: PathBuf = [
			config_dir_string.to_string(),
			"current_imports".to_string(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect();

		let result = Importer::get_existing_import_id(&import_dir);
		assert!(matches!(result, Ok(None)));
	}

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local http server."
	)]
	#[tokio::test]
	async fn importing_too_big_eml_should_fail() {
		let whither = "/tmp/toobig.eml";
		write_big_sample_email(whither);

		let importer = init_file_importer(vec![whither]).await;
		let import_res = importer.start_stateful_import().await;
		assert!(importer
			.essentials
			.import_directory
			.join(FAILED_MAILS_SUB_DIR)
			.join("toobig-0.eml")
			.try_exists()
			.unwrap());

		assert_eq!(
			ImportErrorKind::SourceExhaustedSomeError,
			import_res.unwrap_err().kind
		);

		let remote_state = importer.essentials.load_remote_state().await.unwrap();
		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 1);
		assert_eq!(remote_state.successfulMails, 0);
	}

	#[test]
	fn get_resumable_state_id_invalid_content() {
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
		state_id_file_path.push(STATE_ID_FILE_NAME);
		let invalid_id = "blah";
		fs::write(&state_id_file_path, invalid_id).unwrap();

		let result = Importer::get_existing_import_id(&import_dir)
			.unwrap_err()
			.kind();
		assert_eq!(result, std::io::ErrorKind::InvalidData);
	}

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local https server."
	)]
	#[tokio::test]
	async fn should_stop_if_on_stop_action() {
		let importer = init_file_importer(vec!["sample.eml"; 1]).await;
		importer
			.set_next_progress_action(ImportProgressAction::Stop)
			.await;
		importer.start_stateful_import().await.unwrap();

		let mut iterator = importer.chunked_import_source.lock().await;

		// if we set progress action to stop, it should not have consumed any iterator
		assert!(iterator.next().is_some());
		assert!(iterator.next().is_none());
	}

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local http server."
	)]
	#[tokio::test]
	async fn should_pause_if_on_pause_action() {
		let importer = init_file_importer(vec!["sample.eml"; 2]).await;
		importer
			.set_next_progress_action(ImportProgressAction::Pause)
			.await;
		importer.start_stateful_import().await.unwrap();

		let mut iterator = importer.chunked_import_source.lock().await;

		// if we set progress action to pause, it should not have consumed any iterator
		assert!(iterator.next().is_some());
		assert!(iterator.next().is_some());
		assert!(iterator.next().is_none());
	}

	#[cfg_attr(
		not(feature = "test-with-local-http-server"),
		ignore = "require local http server."
	)]
	#[tokio::test]
	async fn should_continue_if_on_continue_action() {
		let importer = init_file_importer(vec!["sample.eml"; 1]).await;
		importer
			.set_next_progress_action(ImportProgressAction::Continue)
			.await;
		importer.start_stateful_import().await.unwrap();

		let mut iterator = importer.chunked_import_source.lock().await;

		// if we set progress action to continue, it should have consumed all the chunks
		assert!(iterator.next().is_none());
	}
}
