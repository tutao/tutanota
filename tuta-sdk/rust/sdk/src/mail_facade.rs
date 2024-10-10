#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::entities::tutanota::Mail;
use crate::{ApiCallError, IdTupleGenerated};
use std::sync::Arc;

/// Provides high level functions to manipulate mail entities via the REST API
#[derive(uniffi::Object)]
pub struct MailFacade {
	crypto_entity_client: Arc<CryptoEntityClient>,
}

impl MailFacade {
	pub fn new(crypto_entity_client: Arc<CryptoEntityClient>) -> Self {
		MailFacade {
			crypto_entity_client,
		}
	}
}

#[uniffi::export]
impl MailFacade {
	/// Gets an email (an entity/instance of `Mail`) from the backend
	pub async fn load_email_by_id_encrypted(
		&self,
		id_tuple: &IdTupleGenerated,
	) -> Result<Mail, ApiCallError> {
		self.crypto_entity_client
			.load::<Mail, IdTupleGenerated>(id_tuple)
			.await
	}
}
