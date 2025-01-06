use super::importer::{
    ImportError, ImportMailStateId, ImportProgressAction, ImportStatus, Importer, IterationError,
    LocalImportState, ResumableImport, GLOBAL_IMPORTER_STATES,
};
use crate::importer::file_reader::FileImport;
use napi::tokio::sync::Mutex;
use napi::tokio::sync::MutexGuard;
use napi::Env;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, LoggedInSdk};

pub type NapiTokioMutex<T> = napi::tokio::sync::Mutex<T>;

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
pub struct ImporterApi {}

impl ImporterApi {
    pub async fn get_running_imports<'a>() -> MutexGuard<'a, HashMap<String, Arc<Mutex<LocalImportState>>>> {
        /// SAFETY: it's wrapped in a mutex, so it should be fine to access from multiple threads.
        unsafe {
            GLOBAL_IMPORTER_STATES
                .get_or_init(|| Mutex::new(HashMap::new()))
                .lock()
                .await
        }
    }

    pub async fn create_file_importer_inner(
        logged_in_sdk: Arc<LoggedInSdk>,
        target_owner_group: String,
        target_mailset: IdTupleGenerated,
        source_paths: Vec<PathBuf>,
        import_directory: PathBuf,
    ) -> napi::Result<Importer> {
        let target_owner_group = GeneratedId(target_owner_group);

        let source_count = source_paths.len() as i64;
        let mut importer = Importer::create_file_importer(
            logged_in_sdk,
            target_owner_group,
            target_mailset,
            source_paths,
            import_directory,
        )
            .await?;
        {
            importer
                .update_state(|mut state| state.total_count = source_count)
                .await;
        }
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
    pub async fn get_import_state(mailbox_id: String) -> napi::Result<Option<LocalImportState>> {
        let locked_importer_states = Self::get_running_imports().await;
        match locked_importer_states.get(&mailbox_id) {
            Some(locked_state) => Ok(Some({
                let state = locked_state.lock().await.clone();
                state
            })),
            None => Ok(None),
        }
    }

    #[napi]
    pub async fn start_file_import(
        mailbox_id: String,
        tuta_credentials: TutaCredentials,
        target_owner_group: String,
        target_mailset_id: (String, String),
        source_paths: Vec<String>,
        config_directory: String,
    ) -> napi::Result<()> {
        let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;

        let mut running_imports = Self::get_running_imports().await;
        if running_imports.contains_key(&mailbox_id) {
            Err(ImportError::ImporterAlreadyRunning)?;
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

        let mut inner = Self::create_file_importer_inner(
            logged_in_sdk,
            target_owner_group,
            target_mailset,
            eml_sources,
            import_directory,
        )
            .await?;

        running_imports.insert(mailbox_id.clone(), inner.state.clone());
        drop(running_imports);

        Self::spawn_importer_task(mailbox_id, inner);
        Ok(())
    }

    fn spawn_importer_task(mailbox_id: String, mut inner: Importer) {
        napi::tokio::task::spawn(async move {
            match inner.start_stateful_import().await {
                Ok(_) => {}
                Err(e) => {
                    log::error!("Importer task failed: {:?}", e);
                }
            };

            let current_status = inner.get_state(|state| state.current_status).await;
            if current_status == ImportStatus::Finished || current_status == ImportStatus::Canceled
            {
                let mut running_imports = Self::get_running_imports().await;
                running_imports.remove(&mailbox_id);
            }
        });
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
        let import_state = Importer::load_import_state(&logged_in_sdk, mail_state_id)
            .await
            .map_err(|e| ImportError::sdk("load_import_state", e))?;

        let target_mailset = import_state.targetFolder;
        let target_owner_group = import_state
            ._ownerGroup
            .expect("import state should have ownerGroup");

        let import_directory: PathBuf =
            Importer::get_import_directory(config_directory, &mailbox_id);

        let dir_entries = fs::read_dir(&import_directory)?;
        let mut source_paths: Vec<PathBuf> = vec![];
        for dir_entry in dir_entries {
            match dir_entry {
                Ok(dir_entry) => {
                    source_paths.push(dir_entry.path());
                }
                Err(err) => {
                    Err(ImportError::IOError(err))?;
                }
            }
        }

        let inner = Self::create_file_importer_inner(
            logged_in_sdk,
            target_owner_group.as_str().to_string(),
            target_mailset,
            source_paths,
            import_directory,
        )
            .await?;

        {
            let mut running_imports = Self::get_running_imports().await;
            running_imports.insert(mailbox_id.clone(), inner.state.clone());
        }

        Self::spawn_importer_task(mailbox_id, inner);
        Ok(())
    }

    #[napi]
    pub async fn set_progress_action(
        mailbox_id: String,
        import_progress_action: ImportProgressAction,
        config_directory: String,
    ) -> napi::Result<()> {
        let mut running_imports = Self::get_running_imports().await;

        let locked_local_state = running_imports.get_mut(mailbox_id.as_str());
        let delete_import_dir = match locked_local_state {
            Some(local_import_state) => {
                let mut local_import_state = local_import_state.lock().await;
                let delete_import_dir = import_progress_action == ImportProgressAction::Stop
                    && local_import_state.import_progress_action == ImportProgressAction::Pause;
                local_import_state.import_progress_action = import_progress_action;
                delete_import_dir
            }
            None => true,
        };
        if delete_import_dir {
            let import_directory_path =
                Importer::get_import_directory(config_directory, &mailbox_id);
            Importer::delete_import_dir(&import_directory_path)?;
        }
        Ok(())
    }

    #[napi]
    pub unsafe fn init_log(env: Env) {
        // this is in a separate fn because Env isn't Send, so can't be used in async fn.
        crate::logging::console::Console::init(env)
    }

    #[napi]
    pub unsafe fn deinit_log() {
        crate::logging::console::Console::deinit();
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
