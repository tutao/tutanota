use super::importer::{
	ImportLoopResult, ImportMailStateId, ImportProgressAction, ImportStatus, Importer,
};
use crate::importer::file_reader::FileImport;
use crate::importer::messages::{MailImportMessage, PreparationError, ProgressActionError};
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi::Env;
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
	importer_loop_handle: Option<napi::tokio::task::JoinHandle<ImportLoopResult>>,
	message_handler: Option<
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
		let import_directory =
			FileImport::make_import_directory_path(&config_directory, &mailbox_id);
		let existing_import = Importer::get_existing_import_id(&import_directory)
			.map_err(|_| PreparationError::CannotReadOldStateId)?;

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
					message_handler: None,
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

		let preparation_result = Self::prepare_new_import_inner(
			&mailbox_id,
			tuta_credentials,
			target_owner_group,
			target_mailset,
			source_paths,
			&config_directory,
		)
		.await;
		match preparation_result {
			Ok(importer) => Ok(ImporterApi {
				importer: Arc::new(importer),
				importer_loop_handle: None,
				message_handler: None,
			}),
			Err(prep_err) => {
				let import_directory_path =
					FileImport::make_import_directory_path(&config_directory, &mailbox_id);
				FileImport::delete_dir_if_exists(&import_directory_path).ok();
				Err(prep_err.into())
			},
		}
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

		// to-review:
		// extracted to closure because we want to do this update
		// - if we have loop running: after we wait for that loop
		// - if we do not have loop running: before we spawn new loop
		let update_remote_state = || async {
			self.importer
				.essentials
				.update_remote_state(|remote_state| {
					let pre_update_status = remote_state.status;

					// change the state to this progress action corresponding status in server
					remote_state.status = match next_progress_action {
						ImportProgressAction::Continue => ImportStatus::Running,
						ImportProgressAction::Pause => ImportStatus::Paused,
						ImportProgressAction::Stop => ImportStatus::Canceled,
					} as i64;

					let is_same_status = pre_update_status == remote_state.status;

					// do not perform this update if remote state is finalised,
					// prevent the situation where we already finalised the import but
					// since there will be some delay until user receive the final state,
					// they might have performed new action in mean time,
					// we should keep the original final state in that case

					let was_already_finalised = pre_update_status == ImportStatus::Canceled as i64
						|| pre_update_status == ImportStatus::Finished as i64;

					!was_already_finalised && !is_same_status
				})
				.await
				.map_err(|err| {
					log::error!(
						"Can not update remote status to action {next_progress_action:?}: {err:?}"
					);
					ProgressActionError::CannotUpdateRemoteStatus
				})
		};

		match std::mem::take(&mut self.importer_loop_handle) {
			Some(existing_loop_handle) => {
				let existing_loop_result = existing_loop_handle.await.map_err(|join_error| {
					log::error!("Can not join existing loop handle: {join_error:?}");
					ProgressActionError::CannotJoinImportLoop
				})?;

				if let Some(message_handler) = self.message_handler.as_ref() {
					Self::handle_import_loop_result(message_handler, existing_loop_result);
				}

				update_remote_state().await?;
			},

			None => {
				update_remote_state().await?;
				self.importer_loop_handle = Some(self.spawn_importer_task());
			},
		}

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
		self.message_handler = Some(hook);
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
	/// extracts the fallible operations out so we can do some common cleanup if one of them fails
	async fn prepare_new_import_inner(
		mailbox_id: &str,
		tuta_credentials: TutaCredentials,
		target_owner_group: GeneratedId,
		target_mailset: IdTupleGenerated,
		source_paths: impl Iterator<Item = PathBuf>,
		config_directory: &str,
	) -> Result<Importer, PreparationError> {
		let import_directory =
			FileImport::prepare_file_import(config_directory, mailbox_id, source_paths)?;

		let logged_in_sdk = Importer::create_sdk(tuta_credentials).await?;
		Importer::create_new_file_importer(
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			import_directory.clone(),
		)
		.await
	}

	fn spawn_importer_task(&mut self) -> napi::tokio::task::JoinHandle<ImportLoopResult> {
		let importer = Arc::clone(&self.importer);
		let error_handler = self.message_handler.clone();
		if error_handler.is_none() {
			log::warn!("Started importer loop without a error handler")
		}

		napi::tokio::task::spawn(async move {
			let import_loop_result = importer.start_stateful_import().await;
			if let Some(error_handler) = error_handler {
				Self::handle_import_loop_result(&error_handler, import_loop_result.clone())
			}
			import_loop_result
		})
	}

	fn handle_import_loop_result(
		message_handler: &ThreadsafeFunction<
			MailImportMessage,
			napi::threadsafe_function::ErrorStrategy::Fatal,
		>,
		loop_result: ImportLoopResult,
	) {
		let message_to_send = match loop_result {
			Err(error_to_send) => MailImportMessage::err(error_to_send),
			Ok(exit_message_kind) => MailImportMessage::ok(exit_message_kind),
		};

		let call_status = message_handler.call(
			message_to_send.clone(),
			ThreadsafeFunctionCallMode::NonBlocking,
		);

		if !matches!(call_status, napi::Status::Ok) {
			log::error!("Can not send final import message. Message: {message_to_send:?}")
		}
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
			encrypted_passphrase_key: tuta_credentials.encrypted_passphrase_key.clone().clone(),
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
