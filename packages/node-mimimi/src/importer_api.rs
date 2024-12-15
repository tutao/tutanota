use super::importer::{
    ImportError, ImportStatus, Importer, IterationError, LocalImportState, StateCallbackResponse,
};
use crate::importer::file_reader::FileImport;
use crate::importer::ImportError::SdkError;
use log::{logger, Log};
use napi::bindgen_prelude::Promise;
use napi::threadsafe_function::ThreadsafeFunction;
use napi::Env;
use napi_derive::napi;
use std::fs;
use std::mem::discriminant;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::thread::current;
use tutasdk::entities::generated::tutanota::ImportMailState;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, LoggedInSdk};

pub type NapiTokioMutex<T> = napi::tokio::sync::Mutex<T>;

/// Javascript function to check for state change
type StateCallback =
ThreadsafeFunction<LocalImportState, napi::threadsafe_function::ErrorStrategy::Fatal>;

#[napi_derive::napi]
pub struct ImporterApi {
    inner: Arc<NapiTokioMutex<Importer>>,
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
    // FIXME Buffer type causes TutaCredentials to not being able to share between threads safely
    pub encrypted_passphrase_key: Vec<u8>,
    pub is_internal_credential: bool,
}

impl ImporterApi {
    pub async fn create_file_importer_inner(
        logged_in_sdk: Arc<LoggedInSdk>,
        target_owner_group: String,
        target_mailset: IdTupleGenerated,
        source_paths: Vec<PathBuf>,
        import_mail_state_id: Option<IdTupleGenerated>,
    ) -> napi::Result<ImporterApi> {
        let target_owner_group = GeneratedId(target_owner_group);
        let importer = Importer::create_file_importer(
            logged_in_sdk,
            target_owner_group,
            target_mailset,
            source_paths,
            import_mail_state_id,
        )
            .await?;
        Ok(ImporterApi {
            inner: Arc::new(NapiTokioMutex::new(importer)),
        })
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
    pub async unsafe fn start_import(
        &mut self,
        callback_handle: StateCallback,
    ) -> napi::Result<()> {
        let callback_handle_provider = |local_state: LocalImportState| async {
            let res = callback_handle
                .call_async::<Promise<StateCallbackResponse>>(local_state)
                .await;
            match res {
                Ok(promise) => promise.await,
                Err(e) => Err(e),
            }
        };

        let mut importer = self.inner.lock().await;
        importer
            .start_stateful_import(callback_handle_provider)
            .await?;

        Ok(())
    }

    #[napi]
    pub async fn create_file_importer(
        tuta_credentials: TutaCredentials,
        target_owner_group: String,
        target_mailset_id: (String, String),
        source_paths: Vec<String>,
        config_directory: String,
    ) -> napi::Result<ImporterApi> {
        let (target_mailset_lid, target_mailset_eid) = target_mailset_id;

        let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;
        let target_mailset = IdTupleGenerated::new(
            GeneratedId(target_mailset_lid),
            GeneratedId(target_mailset_eid),
        );

        let target_folder = config_directory + "/current_import";
        let source_paths = source_paths.into_iter().map(|p| PathBuf::from(p)).collect();
        let eml_sources = FileImport::prepare_import(target_folder.into(), source_paths)
            .map_err(|e| ImportError::IterationError(IterationError::File(e)))?;

        Self::create_file_importer_inner(
            logged_in_sdk,
            target_owner_group,
            target_mailset,
            eml_sources,
            None,
        )
            .await
    }

    #[napi]
    pub async fn resume_file_import(
        tuta_credentials: TutaCredentials,
        import_mail_state_id: (String, String),
        config_directory: String,
    ) -> napi::Result<ImporterApi> {
        let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;
        let import_state = Importer::load_import_state(
            &logged_in_sdk,
            &IdTupleGenerated::new(
                GeneratedId(import_mail_state_id.0),
                GeneratedId(import_mail_state_id.1),
            ),
        )
            .await
            .map_err(|e| ImportError::sdk("load_import_state", e))?;
        let target_mailset = import_state.targetFolder;
        let target_owner_group = import_state
            ._ownerGroup
            .expect("import state should have ownerGroup");

        let current_import_dir = format!("{}/current_import", config_directory);

        let dir_entries = fs::read_dir(current_import_dir)?;
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

        Self::create_file_importer_inner(
            logged_in_sdk,
            target_owner_group.as_str().to_string(),
            target_mailset,
            source_paths,
            import_state._id,
        )
            .await
    }

    #[napi]
    pub fn init_log(env: Env) {
        // this is in a separate fn because Env isn't Send, so can't be used in async fn.
        crate::logging::console::Console::init(env);
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
        log::error!("Unhandled error: {import_err:?}");

        napi::Error::from_reason(match import_err {
            ImportError::SdkError { .. } => "SdkError".to_string(),
            ImportError::NoImportFeature => "NoImportFeature".to_string(),
            ImportError::EmptyBlobServerList
            | ImportError::NoElementIdForState
            | ImportError::InconsistentStateId => "Malformed server response".to_string(),
            ImportError::NoNativeRestClient(_)
            | ImportError::IterationError(_)
            | ImportError::TooBigChunk => "IoError".to_string(),
            ImportError::CredentialValidationError(_) | ImportError::LoginError(_) => {
                "Not a valid login".to_string()
            }
            ImportError::FileDeletionError(_,path) => "FileDeletionError ".to_string() + path.to_str().unwrap(),
            ImportError::IOError(_) => "FileIoError".to_string(),
        })
    }
}
