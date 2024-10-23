use crate::importer::file_reader::import_client::FileImport;
use crate::importer::imap_reader::import_client::ImapImport;
use crate::importer::{ImportAuth, ImportSource, ImporterInner};
use crate::importer::{Importer, NapiTokioMutex};
use crate::logging::Console;
use crate::tuta::credentials::TutaCredentials;
use napi::bindgen_prelude::PromiseRaw;
use napi::Env;
use std::sync::Arc;
use tutasdk::login::Credentials;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

#[napi_derive::napi]
pub struct ImportBuilder {
	console: &'static Console,
	tuta_credentials: TutaCredentials,

	/// from where to import?
	import_source_auth: ImportAuth,
	/// target mailadress to import to
	target_mail_address: String,

	/// Represents a fallible async initialization process that
	/// results in a logged in importer (tuta and imap_reader) and that can be retried.
	handle: NapiTokioMutex<Option<Importer>>,
}

#[napi_derive::napi]
impl ImportBuilder {
	#[napi(factory)]
	pub fn setup(
		env: Env,
		tuta_credentials: TutaCredentials,
		import_source_auth: ImportAuth,
		target_mail_address: String,
	) -> napi::Result<Self> {
		let console = Console::get(env);
		Ok(ImportBuilder {
			console,
			tuta_credentials,
			import_source_auth,
			target_mail_address,
			handle: NapiTokioMutex::new(None),
		})
	}

	#[napi]
	pub fn build(&'static self, env: Env) -> napi::Result<PromiseRaw<Importer>> {
		env.spawn_future(async {
			self.build_inner().await.map_err(|e| {
				napi::Error::from_reason(format!("Cannot initialize importer. reason: {e}"))
			})
		})
	}
}

impl ImportBuilder {
	async fn build_inner(&self) -> Result<Importer, String> {
		let rest_client = Arc::new(
			NativeRestClient::try_new()
				.map_err(|e| format!("Cannot build native rest client: {e}"))?,
		);

		let logged_in_sdk = {
			let sdk = Sdk::new(self.tuta_credentials.api_url.clone(), rest_client);

			let sdk_credentials: Credentials = self
				.tuta_credentials
				.clone()
				.try_into()
				.map_err(|_| "Cannot convert to valid credentials".to_string())?;
			sdk.login(sdk_credentials)
				.await
				.map_err(|e| format!("Cannot login to sdk. Error: {:?}", e))?
		};

		let import_source = match self.import_source_auth {
			ImportAuth::Imap {
				ref imap_import_config,
			} => {
				let imap_import_client = ImapImport::new(imap_import_config.clone());
				ImportSource::RemoteImap { imap_import_client }
			},

			ImportAuth::LocalFile {
				ref file_path,
				is_mbox,
			} => {
				let fs_email_client = FileImport::new(file_path.as_str(), is_mbox);
				ImportSource::LocalFile { fs_email_client }
			},
		};

		Ok(Importer::new(
			self.console,
			logged_in_sdk,
			import_source,
			self.target_mail_address.clone(),
		))
	}
}
