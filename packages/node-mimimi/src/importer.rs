use crate::importer::importable_mail::{
	ImportableMailAttachment, ImportableMailAttachmentMetaData, KeyedImportableMailAttachment,
};
use crate::reduce_to_chunks::{ChunkedImportItem, UnitImport};
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use file_reader::{FileImport, FileIterationError};
use imap_reader::ImapImportConfig;
use imap_reader::{ImapImport, ImapIterationError};
use importable_mail::ImportableMail;
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
	Postponed = 3,
	Canceled = 4,
	Finished = 5,
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
			_ownerEncSessionKey: Some(owner_enc_session_key.object),
			_ownerGroup: mailbox._ownerGroup.clone(),
			_ownerKeyVersion: Some(owner_enc_session_key.version),
			_permissions: Default::default(),
			status: ImportStatus::Started as i64,
			failedMails: 0,
			successfulMails: 0,
			targetFolder: self.essentials.target_mailset.clone(),
			_errors: None,
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

	/// once we get the ImportableMail from either of source,
	/// continue to the uploading counterpart
	async fn import_all_mail(&mut self) -> Result<(), ImportError> {
		self.essentials.verify_import_feature_is_enabled().await?;
		self.initialize_remote_state().await?;

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

		let chunked_mails_provider =
			ImportableMailsButcher::new(mapped_import_source, |unit_import| {
				let size = estimate_json_size(&unit_import.import_mail_data);
				//println!("some import import mail data size {size}");
				size
			});

		for maybe_importable_chunk in chunked_mails_provider {
			import_state.change_status(ImportStatus::Running);
			import_state
				.update_import_state_on_server(&import_essentials.logged_in_sdk)
				.await?;

			let importable_post_data = match maybe_importable_chunk {
				Ok(importable_chunk) => {
					let mail_count = importable_chunk.len();
					let size = importable_chunk
						.iter()
						.fold(0, |acc, i| acc + estimate_json_size(&i.import_mail_data));
					println!("some import chunk size {size}");
					println!("some import mailcount size {mail_count}");

					let importable_serialized_chunk = import_essentials
						.make_serialized_chunk(importable_chunk)
						.await;

					match importable_serialized_chunk {
						Ok(chunk) => chunk,
						Err(_e) => {
							eprintln!("FIXMEE!!");
							// what to do now?
							continue;
						},
					}
				},

				Err(_too_big_chunk) => {
					// what to do?
					// for now move to next chunk
					eprintln!("FIXMEE!!");
					continue;
				},
			};

			let response = import_essentials
				.make_import_service_call(importable_post_data)
				.await;
			match response {
				// this import has been success,
				Ok(mut imported_post_out) => {
					import_state.add_imported_mails_count(imported_post_out.mails.len());
					import_state
						.imported_mail_ids
						.append(&mut imported_post_out.mails);
				},

				Err(_err) => {
					// todo: save the ImportableMails to some fail list,
					// since, in this iteration the source will not give these mail again,
					todo!()
				},
			}
		}

		import_state.change_status(ImportStatus::Finished);
		import_state
			.update_import_state_on_server(&import_essentials.logged_in_sdk)
			.await?;

		Ok(())
	}
}

impl ImportEssential {
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
		let count = attachments_file_data_flattened_refs.len();
		println!("attachments_file_data_refs {count}");
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
				.await?;

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
					.serialize_instance_to_json(import_mail_data, &session_key)?;
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
			.map_err(|e| ImportError::sdk("calling ImportMailService", e))
	}
}

impl ImportState {
	async fn update_import_state_on_server(
		&mut self,
		logged_in_sdk: &LoggedInSdk,
	) -> Result<(), ImportError> {
		if self.last_server_update.elapsed().unwrap_or_default() > Duration::from_secs(6) {
			logged_in_sdk
				.mail_facade()
				.get_crypto_entity_client()
				.update_instance(self.remote_state.clone())
				.await
				.map(|_| self.last_server_update = SystemTime::now())
				.map_err(|e| ImportError::sdk("update remote import state", e))
		} else {
			Ok(())
		}
	}

	fn change_status(&mut self, status: ImportStatus) {
		self.remote_state.status = status as i64;
	}

	fn add_imported_mails_count(&mut self, newly_imported_mails_count: usize) {
		self.remote_state.successfulMails = self
			.remote_state
			.successfulMails
			.saturating_add(newly_imported_mails_count.try_into().unwrap_or_default());
	}

	fn add_failed_mails_count(&mut self, newly_failed_mails_count: usize) {
		self.remote_state.successfulMails = self
			.remote_state
			.successfulMails
			.saturating_add(newly_failed_mails_count.try_into().unwrap_or_default());
	}
}

impl Importer {
	const IMPORT_DISABLED_ERR: ApiCallError = ApiCallError::ServerResponseError {
		source: HttpError::PreconditionFailedError(Some(ImportFailure(
			ImportFailureReason::ImportDisabled,
		))),
	};

	pub async fn verify_import_feature_enabled(
		logged_in_sdk: &LoggedInSdk,
	) -> Result<(), ImportError> {
		let import_mail_get_in = ImportMailGetIn { _format: 0 };
		let response = logged_in_sdk
			.get_service_executor()
			// todo: instead of trying to GET ImportMailService, better to see the feature enabled for this user,
			// so we don't have new service just for this
			.get::<ImportMailService>(import_mail_get_in, ExtraServiceParams::default())
			.await;

		match response {
			Ok(_) => Ok(()),
			Err(err) if err == Self::IMPORT_DISABLED_ERR => Err(ImportError::NoImportFeature),
			Err(e) => Err(ImportError::sdk(
				"importService::get to check for import feature",
				e,
			)),
		}
	}

	pub async fn create_imap_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		imap_config: ImapImportConfig,
	) -> Result<Importer, ImportError> {
		Self::verify_import_feature_enabled(logged_in_sdk.as_ref()).await?;

		let import_source = ImportSource::RemoteImap {
			imap_import_client: ImapImport::new(imap_config),
		};
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.map_err(|e| ImportError::sdk("getting current_sym_group for imap import", e))?;

		let mut importer = Importer::new(
			logged_in_sdk,
			mail_group_key,
			target_mailset,
			import_source,
			target_owner_group,
		);

		importer.initialize_remote_state().await?;
		Ok(importer)
	}

	pub async fn create_file_importer(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		source_paths: Vec<String>,
	) -> Result<Importer, ImportError> {
		Self::verify_import_feature_enabled(logged_in_sdk.as_ref()).await?;

		let fs_email_client = FileImport::new(source_paths)
			.map_err(|e| ImportError::IterationError(IterationError::File(e)))?;
		let import_source = ImportSource::LocalFile { fs_email_client };
		let mail_group_key = logged_in_sdk
			.get_current_sym_group_key(&target_owner_group)
			.await
			.map_err(|err| {
				ImportError::sdk("trying to get mail group key for target owner group", err)
			})?;

		let mut importer = Importer::new(
			logged_in_sdk,
			mail_group_key,
			target_mailset,
			import_source,
			target_owner_group,
		);

		importer.initialize_remote_state().await?;
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

	pub async fn continue_import(&mut self) -> Result<(), ImportError> {
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
			Some(Err(too_big_chunk)) => Err(ImportError::TooBigChunk)?,

			// these chunks can be imported in single request
			Some(Ok(chunked_import_data)) => {
				let importable_post_data = import_essentials
					.make_serialized_chunk(chunked_import_data)
					.await?;

				let mut import_mails_post_out = import_essentials
					.make_import_service_call(importable_post_data)
					.await?;

				import_state.change_status(ImportStatus::Running);
				import_state.add_imported_mails_count(import_mails_post_out.mails.len());
				import_state
					.imported_mail_ids
					.append(&mut import_mails_post_out.mails);
			},
		}

		self.state
			.update_import_state_on_server(&import_essentials.logged_in_sdk)
			.await?;

		Ok(())
	}

	pub async fn pause_import(&mut self) -> Result<(), ImportError> {
		self.state.change_status(ImportStatus::Paused);
		self.state
			.update_import_state_on_server(&self.essentials.logged_in_sdk)
			.await?;
		Ok(())
	}

	pub async fn cancel_import(&mut self) -> Result<(), ImportError> {
		todo!()
	}
}

impl ImportError {
	pub fn sdk(action: &'static str, error: ApiCallError) -> Self {
		Self::SdkError { action, error }
	}
}

impl From<ImportError> for napi::Error {
	fn from(import_err: ImportError) -> Self {
		log::error!("Unhandled error: {import_err:?}");

		napi::Error::from_reason(match import_err {
			ImportError::SdkError { .. } => "SdkError",
			ImportError::NoImportFeature => "NoImportFeature",
			ImportError::EmptyBlobServerList | ImportError::NoElementIdForState => {
				"Malformed server response"
			},
			ImportError::NoNativeRestClient(_)
			| ImportError::IterationError(_)
			| ImportError::TooBigChunk => "IoError",
			ImportError::CredentialValidationError(_) | ImportError::LoginError(_) => {
				"Not a valid login"
			},
		})
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

	pub async fn init_file_importer(source_paths: Vec<String>) -> Importer {
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

		importer.continue_import().await.map_err(|_| ()).unwrap();
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

		importer.continue_import().await.map_err(|_| ()).unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_without_attachment() {
		let mut importer = init_file_importer(vec!["sample.eml".to_string()]).await;
		importer.continue_import().await.map_err(|_| ()).unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}

	#[tokio::test]
	async fn can_import_single_eml_file_with_attachment() {
		let mut importer = init_file_importer(vec!["attachment_sample.eml".to_string()]).await;
		importer.continue_import().await.map_err(|_| ()).unwrap();
		let remote_state = importer.get_remote_state();

		assert_eq!(remote_state.status, ImportStatus::Finished as i64);
		assert_eq!(remote_state.failedMails, 0);
		assert_eq!(remote_state.successfulMails, 1);
	}
}
