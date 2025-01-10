use super::importer::{ImportError, ImportProgressAction, ImportStatus, Importer, IterationError};
use crate::importer::file_reader::FileImport;
use napi::Env;
use std::path::PathBuf;
use std::sync::Arc;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::{GeneratedId, IdTupleGenerated, LoggedInSdk};

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
    importer_loop_handle: Option<napi::tokio::task::JoinHandle<Result<(), ImportError>>>,
}

impl ImporterApi {
    pub async fn create_file_importer_inner(
        logged_in_sdk: Arc<LoggedInSdk>,
        target_owner_group: String,
        target_mailset: IdTupleGenerated,
        source_paths: Vec<PathBuf>,
        import_directory: PathBuf,
    ) -> napi::Result<Importer> {
        let target_owner_group = GeneratedId(target_owner_group);

        let source_count = source_paths.len() as i64;
        let importer = Importer::create_file_importer(
            logged_in_sdk,
            target_owner_group,
            target_mailset,
            source_paths,
            import_directory,
        )
            .await?;

        todo!();

        Ok(importer)
    }
}

#[napi_derive::napi]
impl ImporterApi {
    #[napi]
    pub async fn prepare_import(
        mailbox_id: String,
        tuta_credentials: TutaCredentials,
        target_owner_group: String,
        target_mailset: (String, String),
        source_paths: Vec<String>,
        config_directory: String,
    ) -> napi::Result<ImporterApi> {
        let import_directory = Importer::get_import_directory(config_directory, &mailbox_id);
        let source_path_bufs = source_paths.iter().map(PathBuf::from).collect();
        let eml_files = FileImport::prepare_import(&import_directory, source_path_bufs)
            .map_err(|e| ImportError::IterationError(IterationError::File(e)))?;

        let (target_mailset_lid, target_mailset_eid) = target_mailset;
        let target_mailset = IdTupleGenerated::new(
            GeneratedId(target_mailset_lid),
            GeneratedId(target_mailset_eid),
        );
        let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;

        let importer = ImporterApi::create_file_importer_inner(
            logged_in_sdk,
            target_owner_group,
            target_mailset,
            eml_files,
            import_directory,
        )
            .await?;

        Ok(ImporterApi {
            importer: Arc::new(importer),
        })
    }

    #[napi]
    pub async fn start_file_import(&self) -> napi::Result<()> {
        Self::spawn_importer_task(Arc::clone(&self.importer));
        Ok(())
    }

    #[napi]
    pub async fn get_resumable_import(
        mailbox_id: String,
        config_directory: String,
        target_owner_group: String,
        tuta_credentials: TutaCredentials,
    ) -> napi::Result<Option<ImporterApi>> {
        let target_owner_group = GeneratedId(target_owner_group);
        let resumeable_import =
            Importer::get_resumable_import(config_directory.clone(), mailbox_id.clone()).await?;

        let Some(saved_id_tuple) = resumeable_import else {
            return Ok(None);
        };
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
    }

    #[napi]
    pub async fn set_progress_action(&self, next_progress_action: ImportProgressAction) -> napi::Result<()> {
        self.importer
            .set_next_progress_action(next_progress_action.clone())
            .await;

        let importer_loop = self.importer_loop_handle.as_ref().ok_or(ImportError::NoRunningImport)?;
        match next_progress_action {
            ImportProgressAction::Continue => {},

            ImportProgressAction::Pause | ImportProgressAction::Stop => {
                i
            }
        }

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
    fn spawn_importer_task(importer: Arc<Importer>) {
        napi::tokio::task::spawn(async move {
            let import_res = importer.start_stateful_import().await;
            let Err(import_error) = import_res else {
                return;
            };

            match import_error {
                ImportError::ImporterAlreadyRunning => {},
                _ => todo!(),
            }
        });
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
