use tutasdk::login::{CredentialType, Credentials};
use tutasdk::GeneratedId;

#[cfg_attr(feature = "javascript", napi_derive::napi(object))]
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
	pub credential_type: TutaCredentialType,
}

impl TryFrom<TutaCredentials> for Credentials {
	// todo: proper errors
	type Error = ();

	fn try_from(tuta_credentials: TutaCredentials) -> Result<Credentials, Self::Error> {
		// todo: validate!
		Ok(Credentials {
			login: tuta_credentials.login,
			user_id: GeneratedId(tuta_credentials.user_id),
			access_token: tuta_credentials.access_token,
			encrypted_passphrase_key: tuta_credentials.encrypted_passphrase_key.clone().to_vec(),
			credential_type: tuta_credentials.credential_type.into(),
		})
	}
}

#[cfg_attr(feature = "javascript", napi_derive::napi)]
#[cfg_attr(not(feature = "javascript"), derive(Clone))]
#[derive(PartialEq)]
pub enum TutaCredentialType {
	Internal,
	External,
}

impl From<TutaCredentialType> for CredentialType {
	fn from(val: TutaCredentialType) -> Self {
		match val {
			TutaCredentialType::Internal => CredentialType::Internal,
			TutaCredentialType::External => CredentialType::External,
		}
	}
}
