use std::sync::Arc;
use crate::{ApiCallError, IdTuple};
use crate::element_value::ParsedEntity;
use crate::entities::Entity;
use crate::entities::tutanota::Mail;
#[mockall_double::double]
use crate::entity_client::EntityClient;


/// Provides high level functions to manipulate mail entities via the REST API
#[derive(uniffi::Object)]
pub struct MailFacade {
    entity_client: Arc<EntityClient>,
}

impl MailFacade {
    pub fn new(entity_client: Arc<EntityClient>) -> Self {
        MailFacade { entity_client }
    }
}

#[uniffi::export]
impl MailFacade {
    /// Gets an email (an entity/instance of `Mail`) from the backend
    pub async fn load_email_by_id_encrypted(&self, id_tuple: &IdTuple) -> Result<ParsedEntity, ApiCallError> {
        self.entity_client.load::<IdTuple>(&Mail::type_ref(), id_tuple).await
    }
}