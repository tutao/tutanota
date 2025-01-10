use super::importer::{ImportError, ImportProgressAction, Importer, IterationError};
use crate::importer::file_reader::FileImport;
use napi::Env;
use std::future::{Future, IntoFuture};
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
}

#[napi_derive::napi]
impl ImporterApi {
	#[napi]
	pub async fn get_resumable_import(
		mailbox_id: String,
		config_directory: String,
		target_owner_group: String,
		tuta_credentials: TutaCredentials,
	) -> napi::Result<Option<ImporterApi>> {
		let target_owner_group = GeneratedId(target_owner_group);

		let existing_import =
			Importer::existing_import(config_directory.clone(), mailbox_id.clone()).await?;

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
				}))
			},
		}
	}

	#[napi]
	pub async fn prepare_new_import(
		mailbox_id: String,
		tuta_credentials: TutaCredentials,
		target_owner_group: String,
		target_mailset: (String, String),
		source_paths: Vec<String>,
		config_directory: String,
	) -> napi::Result<ImporterApi> {
		let target_owner_group = GeneratedId(target_owner_group);
		let (target_mailset_lid, target_mailset_eid) = target_mailset;
		let target_mailset = IdTupleGenerated::new(
			GeneratedId(target_mailset_lid),
			GeneratedId(target_mailset_eid),
		);
		let import_directory =
			Importer::get_import_directory(config_directory.clone(), &mailbox_id);

		let has_old_import =
			Importer::existing_import(config_directory.clone(), mailbox_id.clone())
				.await?
				.is_some();
		if has_old_import {
			Err(ImportError::ImporterAlreadyRunning)?;
		}

		// start clean import,
		// example: import_state id file is not there but some eml files are,
		// in that case we don't want to include those eml in this import
		Importer::delete_import_dir(&import_directory)?;
		FileImport::prepare_import(&import_directory, source_paths)
			.map_err(|e| ImportError::IterationError(IterationError::File(e)))?;

		let logged_in_sdk = Importer::create_sdk(tuta_credentials).await?;
		let importer = Importer::create_new_file_importer(
			&mailbox_id,
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			config_directory,
		)
		.await?;

		Ok(ImporterApi {
			importer: Arc::new(importer),
			importer_loop_handle: None,
		})
	}

	#[napi]
	pub async unsafe fn resume_import(&mut self) -> napi::Result<()> {
		let import_loop_is_running = self
			.importer_loop_handle
			.as_ref()
			.map(|handle| !handle.is_finished())
			.unwrap_or_default();
		if import_loop_is_running {
			Err(ImportError::ImporterAlreadyRunning)?;
		}

		let new_import_loop = self.spawn_importer_task();
		self.importer_loop_handle = Some(new_import_loop);

		Ok(())
	}

	#[napi]
	pub async unsafe fn set_progress_action(
		&mut self,
		next_progress_action: ImportProgressAction,
	) -> napi::Result<()> {
		self.importer
			.set_next_progress_action(next_progress_action.clone())
			.await;

		let previous_loop_handle =
			std::mem::take(&mut self.importer_loop_handle).ok_or(ImportError::NoRunningImport)?;
		previous_loop_handle
			.await
			.expect("Can not join the task handle");

		Ok(())
	}

	#[napi]
	pub fn init_log(env: Env) {
		// this is in a separate fn because Env isn't Send, so can't be used in async fn.
		crate::logging::console::Console::init(env)
	}

	#[napi]
	pub fn deinit_log() {
		crate::logging::console::Console::deinit();
	}
}

impl ImporterApi {
	fn spawn_importer_task(&mut self) -> napi::tokio::task::JoinHandle<()> {
		let importer = Arc::clone(&self.importer);
		napi::tokio::task::spawn(async move {
			let import_res = importer.start_stateful_import().await;
			let Err(import_error) = import_res else {
				return;
			};

			match import_error {
				ImportError::ImporterAlreadyRunning => {},
				_ => todo!(),
			}
		})
	}
}

impl TryFrom<TutaCredentials> for Credentials {
	type Error = ImportError;

	fn try_from(tuta_credentials: TutaCredentials) -> Result<Credentials, Self::Error> {
		// todo: validate!
		let credential_type = if tuta_credentials.is_internal_credential {
			CredentialType::Internal
		} else {
			CredentialType::External
		};
		Ok(Credentials {
			login: tuta_credentials.login,
			user_id: GeneratedId(tuta_credentials.user_id),
			access_token: tuta_credentials.access_token,
			encrypted_passphrase_key: tuta_credentials.encrypted_passphrase_key.clone().to_vec(),
			credential_type,
		})
	}
}

impl From<ImportError> for napi::Error {
	fn from(import_err: ImportError) -> Self {
		napi::Error::from_reason(format!("{:?}", import_err))
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
