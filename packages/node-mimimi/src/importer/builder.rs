use crate::importer::file_reader::import_client::FileImport;
use crate::importer::imap_reader::import_client::ImapImport;
use crate::importer::imap_reader::{ImapCredentials, ImapImportConfig, LoginMechanism};
use crate::importer::{ImportAuth, ImportSource};
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

#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
pub struct ImportInitializer {
	pub root_import_mail_folder_name: String,
	pub imap_username: Option<String>,
	pub imap_password: Option<String>,
	pub imap_oauth: Option<String>,
	pub file_path: Option<String>,
	pub is_mbox: Option<bool>,
	pub tuta_credentials: TutaCredentials,
	pub target_mail_address: String,
	pub imap_host: Option<String>,
	pub imap_port: Option<i32>,
}

#[napi_derive::napi]
impl ImportBuilder {
	#[napi(factory)]
	pub fn setup(env: Env, initializer: ImportInitializer) -> napi::Result<Self> {
		let console = Console::get(env);
		let ImportInitializer {
			root_import_mail_folder_name,
			imap_username,
			imap_password,
			imap_oauth,
			file_path,
			is_mbox,
			tuta_credentials,
			target_mail_address,
			imap_host,
			imap_port,
		} = initializer;

		let import_source_auth = {
			if let (Some(host), Some(port)) = (imap_host, imap_port) {
				let login_mechanism =
					if let (Some(username), Some(password)) = (imap_username, imap_password) {
						LoginMechanism::Plain { username, password }
					} else if let Some(access_token) = imap_oauth {
						LoginMechanism::OAuth { access_token }
					} else {
						panic!("No imap login details");
					};

				ImportAuth::Imap {
					imap_import_config: ImapImportConfig {
						root_import_mail_folder_name,
						credentials: ImapCredentials {
							host,
							port: port.try_into().unwrap(),
							login_mechanism,
						},
					},
				}
			} else if let (Some(file_path), Some(is_mbox)) = (file_path, is_mbox) {
				ImportAuth::LocalFile { file_path, is_mbox }
			} else {
				panic!("No valid import source defined")
			}
		};

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
