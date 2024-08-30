use crate::entities::Entity;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::entity_client::IdType;
use crate::generated_id::GeneratedId;
use crate::instance_mapper::InstanceMapper;
use crate::metamodel::{ElementType, TypeModel};
use crate::{ApiCallError, IdTuple, ListLoadDirection};
use serde::Deserialize;
use std::sync::Arc;

pub struct TypedEntityClient {
	entity_client: Arc<EntityClient>,
	instance_mapper: Arc<InstanceMapper>,
}

/// Similar to EntityClient, but return a typed object instead of a generic Map
impl TypedEntityClient {
	#[allow(unused)]
	pub(crate) fn new(
		entity_client: Arc<EntityClient>,
		instance_mapper: Arc<InstanceMapper>,
	) -> Self {
		TypedEntityClient {
			entity_client,
			instance_mapper,
		}
	}

	#[allow(clippy::unused_async)]
	pub async fn load<T: Entity + Deserialize<'static>, Id: IdType>(
		&self,
		id: &Id,
	) -> Result<T, ApiCallError> {
		let type_model = self.entity_client.get_type_model(&T::type_ref())?;
		Self::check_if_encrypted(type_model)?;
		let parsed_entity = self.entity_client.load::<Id>(&T::type_ref(), id).await?;
		let typed_entity = self
			.instance_mapper
			.parse_entity::<T>(parsed_entity)
			.map_err(|e| {
				let message = format!("Failed to parse entity into proper types: {e}");
				ApiCallError::InternalSdkError {
					error_message: message,
				}
			})?;
		Ok(typed_entity)
	}

	#[allow(dead_code)]
	#[allow(clippy::unused_async)]
	async fn load_all<T: Entity + Deserialize<'static>>(
		&self,
		_list_id: &IdTuple,
		_start: Option<String>,
	) -> Result<Vec<T>, ApiCallError> {
		todo!("typed entity client load_all")
	}

	#[allow(clippy::unused_async)]
	pub async fn load_range<T: Entity + Deserialize<'static>>(
		&self,
		list_id: &GeneratedId,
		start_id: &GeneratedId,
		count: usize,
		direction: ListLoadDirection,
	) -> Result<Vec<T>, ApiCallError> {
		let type_model = self.entity_client.get_type_model(&T::type_ref())?;
		Self::check_if_encrypted(type_model)?;
		// TODO: enforce statically?
		if type_model.element_type != ElementType::ListElement {
			panic!(
				"load_range for non-list type {}/{}",
				type_model.app, type_model.name
			)
		}
		let entities = self
			.entity_client
			.load_range(&T::type_ref(), list_id, start_id, count, direction)
			.await?;
		let typed_entities = entities
			.into_iter()
			.map(|e| self.instance_mapper.parse_entity(e))
			.collect::<Result<Vec<_>, _>>()
			.map_err(|e| {
				let message = format!("Failed to parse entity: {e}");
				ApiCallError::InternalSdkError {
					error_message: message,
				}
			})?;
		Ok(typed_entities)
	}

	// TODO: enforce statically?
	fn check_if_encrypted(type_model: &TypeModel) -> Result<(), ApiCallError> {
		if type_model.is_encrypted() {
			return Err(ApiCallError::InternalSdkError {
				error_message: format!(
					"This client shall not handle encrypted fields! Entity: app: {}, name: {}",
					type_model.app, type_model.name
				),
			});
		}
		Ok(())
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
