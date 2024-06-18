use std::sync::Arc;
use serde::Deserialize;
use crate::ApiCallError;
use crate::entities::Entity;
use crate::entity_client::{EntityClient, IdType};
use crate::instance_mapper::InstanceMapper;

pub struct TypedEntityClient {
    entity_client: Arc<EntityClient>,
    instance_mapper: Arc<InstanceMapper>,
}

/// Similar to EntityClient, but return a typed object instead of a generic Map
impl TypedEntityClient {
    pub(crate) fn new(
        entity_client: Arc<EntityClient>,
        instance_mapper: Arc<InstanceMapper>,
    ) -> Self {
        TypedEntityClient {
            entity_client,
            instance_mapper,
        }
    }

    pub async fn load<T: Entity + Deserialize<'static>>(
        &self,
        id: &IdType,
    ) -> Result<T, ApiCallError> {
        let type_model = self.entity_client.get_type_model(&T::type_ref())?;
        if type_model.encrypted {
            return Err(ApiCallError::InternalSdkError {
                error_message: "This client shall not handle encrypted fields!".to_owned()
            });
        }
        let parsed_entity = self.entity_client.load(&T::type_ref(), id).await?;
        let typed_entity = self.instance_mapper.parse_entity::<T>(parsed_entity).map_err(|e| {
            let message = format!("Failed to parse entity into proper types: {}", e.to_string());
            ApiCallError::InternalSdkError { error_message: message }
        })?;
        Ok(typed_entity)
    }
}


