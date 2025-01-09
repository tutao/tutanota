use super::importer::{ImportMailStateId, ImportProgressAction, ImportStatus, Importer};
use crate::importer::errors::{ImportMessageKind, MailImportMessage, PreparationError};
use crate::importer::file_reader::FileImport;
use log::error;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi::Env;
use std::future::{Future, IntoFuture};
use std::path::PathBuf;
use std::sync::Arc;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::{GeneratedId, IdTupleGenerated};

#[napi_derive::napi(object)]
#[derive(Clone)]
/// Passed in from js-side, will be validated before being converted to proper tuta sdk credentials.
pub struct TutaCredentials {
	pub api_url: String,
	pub client_version: String,
	pub login: String,
	pub user_id: String,
	pub access_token: String,
	// using the napi Buffer type causes TutaCredentials to not being able to share between threads safely
	pub encrypted_passphrase_key: Vec<u8>,
	pub is_internal_credential: bool,
}

#[napi_derive::napi]
pub struct ImporterApi {
	importer: Arc<Importer>,
	importer_loop_handle: Option<napi::tokio::task::JoinHandle<()>>,
	message_callback: Option<
		ThreadsafeFunction<MailImportMessage, napi::threadsafe_function::ErrorStrategy::Fatal>,
	>,
}

/// Implements the interface between the javascript and the rust code of the importer.
#[napi_derive::napi]
impl ImporterApi {
	/// check the disk for any leftover import state and attempt to reconstitute it to be resumed
	#[napi]
	pub async fn get_resumable_import(
		mailbox_id: String,
		config_directory: String,
		target_owner_group: String,
		tuta_credentials: TutaCredentials,
	) -> napi::Result<Option<ImporterApi>> {
		let target_owner_group = GeneratedId(target_owner_group);
		let import_directory = FileImport::make_import_directory(&config_directory, &mailbox_id);
		let existing_import = Importer::get_existing_import_id(&import_directory)?;

		match existing_import {
			None => Ok(None),

			Some(saved_id_tuple) => {
				let importer = Importer::resume_file_importer(
					&mailbox_id,
					config_directory,
					target_owner_group,
					tuta_credentials,
					saved_id_tuple,
				)
				.await?;

				Ok(Some(ImporterApi {
					importer: Arc::new(importer),
					importer_loop_handle: None,
					message_callback: None,
				}))
			},
		}
	}

	/// get the id of the remote import state entity that is stored on disk for this import
	#[napi]
	pub fn get_import_state_id(&self) -> napi::Result<ImportMailStateId> {
		Ok(self.importer.essentials.remote_state_id.clone().into())
	}

	/// use the given credentials and files to prepare to import some mails into the given mailbox.
	/// if there is still state left from a previous import into the same mailbox, it will be removed by this operation
	/// after this returns, a remote import state exists and can be used to control the import process.
	#[napi]
	pub async fn prepare_new_import(
		mailbox_id: String,
		tuta_credentials: TutaCredentials,
		target_owner_group: String,
		target_mailset: (String, String),
		source_paths: Vec<String>,
		config_directory: String,
	) -> napi::Result<ImporterApi> {
		let source_paths = source_paths.into_iter().map(PathBuf::from);
		let target_owner_group = GeneratedId(target_owner_group);
		let (target_mailset_lid, target_mailset_eid) = target_mailset;
		let target_mailset = IdTupleGenerated::new(
			GeneratedId(target_mailset_lid),
			GeneratedId(target_mailset_eid),
		);

		let import_directory =
			FileImport::prepare_file_import(&config_directory, &mailbox_id, source_paths)?;

		let logged_in_sdk = Importer::create_sdk(tuta_credentials).await?;
		let importer = Importer::create_new_file_importer(
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			import_directory,
		)
		.await?;

		Ok(ImporterApi {
			importer: Arc::new(importer),
			importer_loop_handle: None,
			message_callback: None,
		})
	}

	/// set a new state for the next import loop. the current upload will be finished before
	/// changing to the given state and before returning.
	#[napi]
	pub async unsafe fn set_progress_action(
		&mut self,
		next_progress_action: ImportProgressAction,
	) -> napi::Result<()> {
		self.importer
			.set_next_progress_action(next_progress_action)
			.await;

		if let Some(previous_loop_handle) = std::mem::take(&mut self.importer_loop_handle) {
			previous_loop_handle
				.await
				.expect("Can not join the task handle");
		};

		match next_progress_action {
			ImportProgressAction::Continue => {
				self.importer
					.set_remote_import_status(ImportStatus::Running)
					.await?;
				self.importer_loop_handle = Some(self.spawn_importer_task());
			},
			ImportProgressAction::Pause => {
				self.importer
					.set_remote_import_status(ImportStatus::Paused)
					.await?;
			},
			ImportProgressAction::Stop => {
				self.importer
					.set_remote_import_status(ImportStatus::Canceled)
					.await?
			},
		};
		Ok(())
	}

	/// override the previous error hook with the new function to call if the loop encounters an error it can't ignore
	#[napi]
	pub unsafe fn set_message_hook(
		&mut self,
		hook: ThreadsafeFunction<
			MailImportMessage,
			napi::threadsafe_function::ErrorStrategy::Fatal,
		>,
	) -> napi::Result<()> {
		self.message_callback = Some(hook);
		Ok(())
	}

	/// arrange for rust log messages to appear in the log files sent via support/error mail
	#[napi]
	pub fn init_log(env: Env) {
		// this is in a separate fn because Env isn't Send, so can't be used in async fn.
		crate::logging::console::Console::init(env)
	}

	/// to be able to log to the js console, we start a task and
	/// hold references to some state while the module is active.
	/// this cleans up that state so the process can exit.
	/// log messages after this point will not be included in log files.
	#[napi]
	pub fn deinit_log() {
		crate::logging::console::Console::deinit();
	}
}

impl ImporterApi {
	fn spawn_importer_task(&mut self) -> napi::tokio::task::JoinHandle<()> {
		let importer = Arc::clone(&self.importer);
		let error_handler = self.message_callback.clone();
		log::info!("starting an import");
		napi::tokio::task::spawn(async move {
			let import_res = importer.start_stateful_import().await;
			if error_handler.is_none() {
				log::warn!("Started importer loop without a error handler")
			}

			if let Some(error_handler) = error_handler {
				let message_to_send = match import_res {
					Err(error_to_send) => error_to_send,
					Ok(()) => ImportMessageKind::Success.into(),
				};

				let call_status = error_handler.call(
					message_to_send.clone(),
					ThreadsafeFunctionCallMode::NonBlocking,
				);
				if !matches!(call_status, napi::Status::Ok) {
					log::error!("Can not send final import message. Message: {message_to_send:?}")
				}
			}
		})
	}
}

impl From<TutaCredentials> for Credentials {
	fn from(tuta_credentials: TutaCredentials) -> Credentials {
		let credential_type = if tuta_credentials.is_internal_credential {
			CredentialType::Internal
		} else {
			CredentialType::External
		};
		Credentials {
			login: tuta_credentials.login,
			user_id: GeneratedId(tuta_credentials.user_id),
			access_token: tuta_credentials.access_token,
			encrypted_passphrase_key: tuta_credentials.encrypted_passphrase_key.clone().to_vec(),
			credential_type,
		}
	}
}

#[cfg(test)]
mod tests {
	use tutasdk::{GeneratedId, IdTupleGenerated};

	#[test]
	fn ids_from_generated_id_tuple_string() {
		let id_tuple = IdTupleGenerated::new(GeneratedId::min_id(), GeneratedId::max_id());

		assert_eq!("------------/zzzzzzzzzzzz", id_tuple.to_string());

		let after_conversion = id_tuple.to_string().try_into();
		assert_eq!(Ok(id_tuple), after_conversion)
	}
}
