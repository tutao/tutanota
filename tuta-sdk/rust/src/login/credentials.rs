pub struct Credentials {
    pub login: String,
    pub user_id: String,
    pub access_token: String,
    pub encrypted_password: Vec<u8>,
    pub credential_type: CredentialType,
}

pub enum CredentialType {
    Internal,
    External,
}
