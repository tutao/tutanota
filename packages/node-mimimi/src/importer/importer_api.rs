use crate::importer::file_reader::import_client::FileImport;
use crate::importer::ImportSource;
use crate::importer::Importer;
use crate::tuta::credentials::TutaCredentials;
use std::sync::Arc;
use tutasdk::login::Credentials;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{LoggedInSdk, Sdk};

#[napi_derive::napi]
pub async fn create_file_importer(
	importer_address: String,
	tuta_credentials: TutaCredentials,
	file_path: String,
	is_mbox: bool,
) -> napi::Result<Importer> {
	let import_source = ImportSource::LocalFile {
		fs_email_client: FileImport::new(file_path, is_mbox),
	};
	let logged_in_sdk = create_sdk(tuta_credentials).await.unwrap();

	Ok(Importer::new(
		logged_in_sdk,
		import_source,
		importer_address,
	))
}

async fn create_sdk(tuta_credentials: TutaCredentials) -> Result<Arc<LoggedInSdk>, String> {
	let rest_client = Arc::new(
		NativeRestClient::try_new().map_err(|e| format!("Cannot build native rest client: {e}"))?,
	);

	let logged_in_sdk = {
		let sdk = Sdk::new(tuta_credentials.api_url.clone(), rest_client);

		let sdk_credentials: Credentials = tuta_credentials
			.clone()
			.try_into()
			.map_err(|_| "Cannot convert to valid credentials".to_string())?;
		sdk.login(sdk_credentials)
			.await
			.map_err(|e| format!("Cannot login to sdk. Error: {:?}", e))?
	};

	Ok(logged_in_sdk)
}
