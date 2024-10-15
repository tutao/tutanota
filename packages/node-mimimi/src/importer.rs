use crate::imap::credentials::ImapCredentials;
use crate::logging::Console;
use crate::tuta::credentials::TutaCredentials;
use napi::bindgen_prelude::*;
use napi::threadsafe_function::ErrorStrategy::T;
use napi::tokio::sync::Mutex;
use napi::tokio::sync::OnceCell;
use napi::JsObject;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tuta_imap::client::TutanotaImapClient;
use tutasdk::login::Credentials;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::rest_client::{
	HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
};
use tutasdk::{LoggedInSdk, Sdk};

const TAG: &'static str = file!();

type Handle<T> = Arc<Mutex<T>>;

#[napi]
pub struct ImportCredentials {
	console: &'static Console,
	tuta_credentials: TutaCredentials,
	imap_credentials: ImapCredentials,

	/// Represents a fallible async initialization process that
	/// results in a logged in importer (tuta and imap) and that can be retried.
	handle: Mutex<Option<Importer>>,
}

#[napi]
impl ImportCredentials {
	#[napi(factory)]
	pub fn setup(
		env: Env,
		tuta_credentials: TutaCredentials,
		imap_credentials: ImapCredentials,
	) -> Result<Self> {
		let console = Console::get(env);
		Ok(ImportCredentials {
			console,
			tuta_credentials,
			imap_credentials,
			handle: Mutex::new(None),
		})
	}

	#[napi(ts_return_type = "Promise<Importer>")]
	/// Log into tuta + imap and return a handle to an object that can be used to control the import process.
	pub fn login(&'static self, env: Env) -> Result<JsObject> {
		env.execute_tokio_future(
			async { self.prepare_inner().await },
			|env: &mut Env, inner: ImporterInner| Ok(Importer::new(inner)),
		)
	}

	async fn prepare_inner(&self) -> Result<ImporterInner> {
		let api_url: String = self.tuta_credentials.api_url.clone();
		let rest_client = NativeRestClient::try_new()?;
		let client_version = self.tuta_credentials.client_version.clone();
		let sdk = Sdk::new(api_url, Arc::new(rest_client), client_version);

		let credentials: Credentials = self
			.tuta_credentials
			.clone()
			.try_into()
			.map_err(|_| napi::Error::from_reason("failed to convert credentials"))?;
		let logged_in_sdk = sdk.login(credentials).await.map_err(|e| {
			self.console.error(TAG, e.to_string().as_str());
			Error::from_reason("failed to log into tuta")
		})?;

		let imap = Arc::new(TutanotaImapClient::start_new_session("host", 42));

		Ok(ImporterInner {
			console: self.console,
			sdk: logged_in_sdk,
			imap,
		})
	}
}

struct ImporterInner {
	console: &'static Console,
	sdk: Arc<LoggedInSdk>,
	imap: Arc<TutanotaImapClient>,
}

#[napi]
pub struct Importer {
	inner: Handle<ImporterInner>,
}

impl Importer {
	fn new(inner: ImporterInner) -> Self {
		Self {
			inner: Arc::new(Mutex::new(inner)),
		}
	}
}
