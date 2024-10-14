#[napi(object)]
#[derive(Clone)]
/// passed in from js before being validated and used for logging into the imap server
pub struct ImapCredentials {
    /// hostname of the imap server to import mail from
    pub host: String,
    /// imap port of the imap server to import mail from
    pub port: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub access_token: Option<String>,
}