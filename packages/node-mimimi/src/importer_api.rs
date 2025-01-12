use super::importer::{
	ImportAction, ImportError, ImportMailStateId, ImportStatus, Importer, IterationError,
	ResumableImport,
};
use crate::importer::file_reader::FileImport;
use log::{error, warn};
use napi::tokio::sync::broadcast;
use napi::tokio::sync::broadcast::{channel, Receiver, Sender};
use napi::tokio::sync::oneshot;
use napi::tokio::sync::oneshot::error::RecvError;
use napi::tokio::sync::Mutex;
use napi::Env;
use std::collections::HashMap;
use std::fs;
use std::future::Future;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, LoggedInSdk};

type MailboxId = String;
pub static GLOBAL_IMPORTER_CHANNELS: OnceLock<Mutex<HashMap<MailboxId, RunningImport>>> =
	OnceLock::new();

#[napi_derive::napi]
pub struct ImporterApi {}

impl ImporterApi {
	pub async fn get_running_import(mailbox_id: &str) -> Option<RunningImport> {
		let guard = GLOBAL_IMPORTER_CHANNELS
			.get_or_init(|| Mutex::new(HashMap::new()))
			.lock()
			.await;

		guard
			.get(mailbox_id)
			.map(|running_import| running_import.clone())
	}

	pub async fn set_running_import(mailbox_id: &str, importer: RunningImport) {
		let mut map = GLOBAL_IMPORTER_CHANNELS.get_or_init(|| Mutex::new(HashMap::new()));
		map.lock().await.insert(mailbox_id.to_string(), importer);
	}

	pub async fn remove_running_import(mailbox_id: &str) {
		let mut map = GLOBAL_IMPORTER_CHANNELS.get_or_init(|| Mutex::new(HashMap::new()));
		map.lock().await.remove(mailbox_id);
	}

	pub async fn create_file_importer_inner(
		logged_in_sdk: Arc<LoggedInSdk>,
		target_owner_group: String,
		target_mailset: IdTupleGenerated,
		source_paths: Vec<PathBuf>,
		import_directory: PathBuf,
		importer_action_receiver: Receiver<ImportAction>,
	) -> napi::Result<Importer> {
		let target_owner_group = GeneratedId(target_owner_group);

		let importer = Importer::create_file_importer(
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			source_paths,
			import_directory,
			importer_action_receiver,
		)
		.await?;

		Ok(importer)
	}

	async fn create_sdk(
		tuta_credentials: TutaCredentials,
	) -> Result<Arc<LoggedInSdk>, ImportError> {
		let rest_client = NativeRestClient::try_new().map_err(ImportError::NoNativeRestClient)?;
		let base_url = tuta_credentials.api_url.clone();
		let sdk_credentials = tuta_credentials.try_into()?;

		let logged_in_sdk = tutasdk::Sdk::new(base_url, Arc::new(rest_client))
			.login(sdk_credentials)
			.await
			.map_err(ImportError::LoginError)?;

		Ok(logged_in_sdk)
	}
}

#[napi_derive::napi]
impl ImporterApi {
	#[napi]
	pub async fn start_file_import(
		mailbox_id: String,
		tuta_credentials: TutaCredentials,
		target_owner_group: String,
		target_mailset_id: (String, String),
		source_paths: Vec<String>,
		config_directory: String,
	) -> napi::Result<ImportMailStateId> {
		let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;
		if let Some(_) = Self::get_running_import(&mailbox_id).await {
			Err(ImportError::ImporterAlreadyRunning)?
		}

		let (target_mailset_lid, target_mailset_eid) = target_mailset_id;
		let target_mailset = IdTupleGenerated::new(
			GeneratedId(target_mailset_lid),
			GeneratedId(target_mailset_eid),
		);
		let import_directory: PathBuf =
			Importer::get_import_directory(config_directory, &mailbox_id);
		let source_paths = source_paths.into_iter().map(PathBuf::from).collect();
		let eml_sources = FileImport::prepare_import(import_directory.clone(), source_paths)
			.map_err(|e| ImportError::IterationError(IterationError::File(e)))?;

		let (importer_action_sender, importer_action_receiver) = channel(1);
		let inner = Self::create_file_importer_inner(
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			eml_sources,
			import_directory,
			importer_action_receiver,
		)
		.await?;

		let import_mail_state_id = inner.import_mail_state_id.clone();

		let import_completion_receiver = Self::spawn_importer_task(&mailbox_id, inner);
		Self::set_running_import(
			&mailbox_id,
			RunningImport::new(importer_action_sender, import_completion_receiver),
		)
		.await;
		Ok(import_mail_state_id.into())
	}

	#[napi]
	pub async fn wait_for_running_import(mailbox_id: String) -> napi::Result<()> {
		match Self::get_running_import(&mailbox_id).await {
			Some(mut running_import) => {
				match running_import.import_completion_receiver.recv().await {
					Ok(result) => result?,
					Err(e) => {
						error!("did not receive completion result {}", e);
					},
				};
			},
			None => {},
		}
		Ok(())
	}

	fn spawn_importer_task(
		mailbox_id: &MailboxId,
		mut importer: Importer,
	) -> Receiver<napi::Result<()>> {
		let mailbox_id = mailbox_id.clone();
		let (import_completion_sender, import_completion_receiver) = broadcast::channel(1);
		napi::tokio::task::spawn(async move {
			let import_result = importer.run_import().await.map_err(Into::into);
			if let Err(e) = import_completion_sender.send(import_result) {
				error!("no one is listening for the result anymore {:?}", e)
			};
			Self::remove_running_import(&mailbox_id).await;
		});
		import_completion_receiver
	}

	#[napi]
	pub async fn get_resumable_import(
		config_directory: String,
		mailbox_id: String,
	) -> napi::Result<ResumableImport> {
		Importer::get_resumable_import(config_directory, mailbox_id)
			.await
			.map_err(Into::into)
	}

	#[napi]
	pub async fn resume_file_import(
		mailbox_id: String,
		tuta_credentials: TutaCredentials,
		mail_state_id: ImportMailStateId,
		config_directory: String,
	) -> napi::Result<()> {
		let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;
		let import_state =
			Importer::load_import_state(&logged_in_sdk, &IdTupleGenerated::from(mail_state_id))
				.await
				.map_err(|e| ImportError::sdk("load_import_state", e))?;

		let target_mailset = import_state.targetFolder;
		let target_owner_group = import_state
			._ownerGroup
			.expect("import state should have ownerGroup");

		let import_directory = Importer::get_import_directory(config_directory, &mailbox_id);

		let dir_entries = fs::read_dir(&import_directory)?;
		let mut source_paths: Vec<PathBuf> = vec![];
		for dir_entry in dir_entries {
			match dir_entry {
				Ok(dir_entry) => {
					source_paths.push(dir_entry.path());
				},
				Err(err) => {
					Err(ImportError::IOError(err))?;
				},
			}
		}

		let (importer_action_sender, importer_action_receiver) = channel(1);
		let inner = Self::create_file_importer_inner(
			logged_in_sdk,
			target_owner_group.as_str().to_string(),
			target_mailset,
			source_paths,
			import_directory,
			importer_action_receiver,
		)
		.await?;

		let import_completion_receiver = Self::spawn_importer_task(&mailbox_id, inner);
		Self::set_running_import(
			&mailbox_id,
			RunningImport::new(importer_action_sender, import_completion_receiver),
		)
		.await;
		Ok(())
	}

	#[napi]
	pub async fn set_action(mailbox_id: String, import_action: ImportAction) -> napi::Result<()> {
		if let Some(running_importer) = Self::get_running_import(&mailbox_id).await {
			if let Err(e) = running_importer.import_action_sender.send(import_action) {
				warn!("could not send import action {}", e)
			}
			Ok(())
		} else {
			warn!("no import to set import action");
			Ok(())
		}
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

struct RunningImport {
	import_action_sender: Sender<ImportAction>,
	import_completion_receiver: Receiver<Result<(), napi::Error>>,
}

impl RunningImport {
	fn new(
		send_import_action: Sender<ImportAction>,
		receive_import_result: Receiver<Result<(), napi::Error>>,
	) -> RunningImport {
		Self {
			import_action_sender: send_import_action,
			import_completion_receiver: receive_import_result,
		}
	}
}

impl Clone for RunningImport {
	fn clone(&self) -> Self {
		let send_import_action = self.import_action_sender.clone();
		let receive_import_result = self.import_completion_receiver.resubscribe();
		Self {
			import_action_sender: send_import_action,
			import_completion_receiver: receive_import_result,
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
