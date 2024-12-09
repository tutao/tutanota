use super::importer::{ImportError, ImportStatus, Importer};
use napi::bindgen_prelude::ToNapiValue;
use napi::threadsafe_function::ErrorStrategy::ErrorStrategy;
use napi::threadsafe_function::ThreadsafeFunction;
use napi::Env;
use std::sync::Arc;
use tutasdk::entities::generated::tutanota::ImportMailState;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, LoggedInSdk};

/// Since ImportMailState is generated and dos not implement napi::ToNapiValue,
/// create a wrapper
#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[cfg_attr(not(feature = "javascript"), derive(Clone))]
pub struct ExportedImportMailState {
	pub status: ImportStatus,
	pub imported_mails_count: i64,
	pub failed_mails_count: i64,
}

pub type NapiTokioMutex<T> = napi::tokio::sync::Mutex<T>;

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
		source_paths: Vec<String>,
	) -> napi::Result<ImporterApi> {
		let target_owner_group = GeneratedId(target_owner_group);
		let importer = Importer::create_file_importer(
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			source_paths,
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

/*
// let napi_env: napi::sys::napi_env__ = *self.env.raw();
// napi::bindgen_prelude::execute_tokio_future(
// 	self.env.raw(),
// 	async move {
// 		let env: Env = todo!();
// 		// let should_stop_provider = should_stop_provider.borrow_back(&env)?;
// 		//
// 		// let mut importer = locked_importer.lock().await;
// 		// while importer.get_remote_state().status != ImportStatus::Finished as i64 {
// 		// 	importer.continue_import().await?;
// 		//
// 		// 	// after every import check if client state changed in such a way that we should not import any further
// 		// }
// 		Ok(())
// 	},
// 	|e, v| napi::bindgen_prelude::ToNapiValue::to_napi_value(e, v),
// )?;
 */
#[napi_derive::napi]
impl ImporterApi {
	#[napi]
	pub async unsafe fn continue_import(
		&mut self,
		should_stop_import: ThreadsafeFunction<(), napi::threadsafe_function::ErrorStrategy::Fatal>,
	) -> napi::Result<ExportedImportMailState> {
		let should_stop_import = || should_stop_import.call_async::<bool>(());

		let mut importer = self.inner.lock().await;
		importer.start_pausable_import(should_stop_import).await?;

		Ok(importer.get_remote_state().clone().into())
	}

	#[napi]
	pub async unsafe fn delete_import(&mut self) -> napi::Result<()> {
		self.inner.lock().await.cancel_import().await?;
		Ok(())
	}

	#[napi]
	pub async unsafe fn pause_import(&mut self) -> napi::Result<()> {
		self.inner.lock().await.pause_import().await?;
		Ok(())
	}

	#[napi]
	pub async fn create_file_importer(
		tuta_credentials: TutaCredentials,
		target_owner_group: String,
		target_mailset_id: (String, String),
		source_paths: Vec<String>,
	) -> napi::Result<ImporterApi> {
		let (target_mailset_lid, target_mailset_eid) = target_mailset_id;

		let logged_in_sdk = ImporterApi::create_sdk(tuta_credentials).await?;
		let target_mailset = IdTupleGenerated::new(
			GeneratedId(target_mailset_lid),
			GeneratedId(target_mailset_eid),
		);

		Self::create_file_importer_inner(
			logged_in_sdk,
			target_owner_group,
			target_mailset,
			source_paths,
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

impl From<ImportMailState> for ExportedImportMailState {
	fn from(import_mail_state: ImportMailState) -> Self {
		Self {
			status: import_mail_state
				.status
				.try_into()
				.expect("Unexpected ImportStatus Code"),
			imported_mails_count: 0,
			failed_mails_count: 0,
		}
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
