use std::sync::Arc;
use serde::Deserialize;
use crate::{ApiCallError, IdTuple, ListLoadDirection};
use crate::entities::Entity;
#[mockall_double::double]
use crate::entity_client::EntityClient;
use crate::entity_client::IdType;
use crate::generated_id::GeneratedId;
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

    pub async fn load<T: Entity + Deserialize<'static>, Id: IdType>(
        &self,
        id: &Id,
    ) -> Result<T, ApiCallError> {
        let type_model = self.entity_client.get_type_model(&T::type_ref())?;
        if type_model.encrypted {
            return Err(ApiCallError::InternalSdkError {
                error_message: format!("This client shall not handle encrypted fields! Entity: app: {}, name: {}", &T::type_ref().app, &T::type_ref().type_)
            });
        }
        let parsed_entity = self.entity_client.load::<Id>(&T::type_ref(), id).await?;
        let typed_entity = self.instance_mapper.parse_entity::<T>(parsed_entity).map_err(|e| {
            let message = format!("Failed to parse entity into proper types: {}", e.to_string());
            ApiCallError::InternalSdkError { error_message: message }
        })?;
        Ok(typed_entity)
    }

    #[allow(dead_code)]
    async fn load_all<T: Entity + Deserialize<'static>>(&self, _list_id: &IdTuple, _start: Option<String>) -> Result<Vec<T>, ApiCallError> {
        todo!()
    }

    #[allow(dead_code)]
    pub async fn load_range<T: Entity + Deserialize<'static>>(&self, _list_id: &GeneratedId, _start_id: &GeneratedId, _count: usize, _list_load_direction: ListLoadDirection) -> Result<Vec<T>, ApiCallError> {
        todo!()
    }
}


#[cfg(test)]
mockall::mock! {
    pub TypedEntityClient {
        pub fn new(
            entity_client: Arc<EntityClient>,
            instance_mapper: Arc<InstanceMapper>,
        ) -> Self;
        pub async fn load<T: Entity + Deserialize<'static>, Id: IdType>(
            &self,
            id: &Id,
         ) -> Result<T, ApiCallError>;
        async fn load_all<T: Entity + Deserialize<'static>>(
            &self,
            list_id: &IdTuple,
            start: Option<String>,
        ) -> Result<Vec<T>, ApiCallError>;
        pub async fn load_range<T: Entity + Deserialize<'static>>(
            &self,
            list_id: &GeneratedId,
            start_id: &GeneratedId,
            count: usize,
            list_load_direction: ListLoadDirection,
        ) -> Result<Vec<T>, ApiCallError>;
    }
}
