use std::sync::Arc;
use crate::{ApiCallError, IdTuple};
use crate::entities::tutanota::Mail;
#[mockall_double::double]
use crate::crypto_entity_client::CryptoEntityClient;


/// Provides high level functions to manipulate mail entities via the REST API
#[derive(uniffi::Object)]
pub struct MailFacade {
    crypto_entity_client: Arc<CryptoEntityClient>,
}

impl MailFacade {
    pub fn new(crypto_entity_client: Arc<CryptoEntityClient>) -> Self {
        MailFacade { crypto_entity_client }
    }
}

#[uniffi::export]
impl MailFacade {
    /// Gets an email (an entity/instance of `Mail`) from the backend
    pub async fn load_email_by_id_encrypted(&self, id_tuple: &IdTuple) -> Result<Mail, ApiCallError> {
        self.crypto_entity_client.load::<Mail, IdTuple>(id_tuple).await
    }
}