use tutasdk::generated_id::GeneratedId;
use tutasdk::login::CredentialType;


#[napi(object)]
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

impl TryInto<tutasdk::login::Credentials> for TutaCredentials {
    // todo: proper errors
    type Error = ();

    fn try_into(self) -> Result<tutasdk::login::Credentials, Self::Error> {
        // todo: validate!
        Ok(tutasdk::login::Credentials {
            login: self.login,
            user_id: GeneratedId(self.user_id),
            access_token: self.access_token,
            encrypted_passphrase_key: self.encrypted_passphrase_key.clone().to_vec(),
            credential_type: self.credential_type.into(),
        })
    }
}

#[napi(string_enum)]
pub enum TutaCredentialType {
    Internal,
    External,
}

impl Into<CredentialType> for TutaCredentialType {
    fn into(self) -> CredentialType {
        match self {
            TutaCredentialType::Internal => { CredentialType::Internal }
            TutaCredentialType::External => { CredentialType::External }
        }
    }
}