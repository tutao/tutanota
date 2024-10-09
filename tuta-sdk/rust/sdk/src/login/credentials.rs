use crate::generated_id::GeneratedId;

#[derive(uniffi::Record, Clone)]
pub struct Credentials {
	pub login: String,
	pub user_id: GeneratedId,
	pub access_token: String,
	pub encrypted_passphrase_key: Vec<u8>,
	pub credential_type: CredentialType,
}

#[derive(uniffi::Enum, Debug, PartialEq, Clone)]
pub enum CredentialType {
	Internal,
	External,
}
