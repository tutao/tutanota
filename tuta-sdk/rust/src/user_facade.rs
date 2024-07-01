use std::sync::Arc;
use crate::ApiCallError;
use crate::entities::sys::User;
use crate::id::Id;
use crate::typed_entity_client::TypedEntityClient;


/// FIXME: for testing unencrypted entity downloading. Remove after everything works together.
#[derive(uniffi::Object)]
pub struct UserFacade {
    entity_client: Arc<TypedEntityClient>,
}

impl UserFacade {
    pub fn new(entity_client: Arc<TypedEntityClient>) -> Self {
        UserFacade { entity_client }
    }
}

#[uniffi::export]
impl UserFacade {
    /// Gets a user (an entity/instance of `User`) from the backend
    pub async fn load_user_by_id(&self, id: &Id) -> Result<User, ApiCallError> {
        self.entity_client.load(id).await
    }
}