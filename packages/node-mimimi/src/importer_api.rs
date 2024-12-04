use super::importer::{ImportError, Importer};
use napi::Env;
use std::sync::Arc;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, LoggedInSdk};

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

#[napi_derive::napi]
impl ImporterApi {
	#[napi]
	pub async unsafe fn continue_import(&mut self) -> napi::Result<()> {
		self.inner.lock().await.continue_import().await?;
		Ok(())
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
