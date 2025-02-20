use crate::entities::Entity;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::id::id_tuple::{BaseIdType, IdType};
use crate::instance_mapper::InstanceMapper;
use crate::metamodel::{ElementType, TypeModel};
use crate::{ApiCallError, ListLoadDirection};
use crate::{GeneratedId, TypeRef};
use serde::Deserialize;
use std::sync::Arc;

pub struct TypedEntityClient {
	entity_client: Arc<EntityClient>,
	instance_mapper: Arc<InstanceMapper>,
}

/// Similar to EntityClient, but return a typed object instead of a generic Map
#[cfg_attr(test, mockall::automock)]
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

	#[allow(clippy::unused_async, unused)]
	pub async fn read<T: Entity + Deserialize<'static>, Id: IdType>(
		&self,
		id: &Id,
	) -> Result<T, ApiCallError> {
		let type_model = self.entity_client.get_type_model(&T::type_ref())?;
		Self::check_if_encrypted(type_model)?;
		let parsed_entity = self.entity_client.read::<Id>(&T::type_ref(), id).await?;

		if type_model.marked_encrypted() {
			let typed_entity = self
				.process_encrypted_entity(type_model, parsed_entity)
				.await?;
			Ok(typed_entity)
		} else {
			let typed_entity = self
				.instance_mapper
				.parse_entity::<T>(parsed_entity)
				.map_err(|error| ApiCallError::InternalSdkError {
					error_message: format!(
						"Failed to parse unencrypted entity into proper types: {}",
						error
					),
				})?;
			Ok(typed_entity)
		}

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
	async fn read_all<T: Entity + Deserialize<'static>>(
		&self,
		_list_id: &GeneratedId,
		_start: Option<String>,
	) -> Result<Vec<T>, ApiCallError> {
		todo!("typed entity client load_all")
	}

	#[allow(clippy::unused_async, unused)]
	pub async fn read_range<T: Entity + Deserialize<'static>, Id: BaseIdType>(
		&self,
		list_id: &GeneratedId,
		start_id: &Id,
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
			.read_range(&T::type_ref(), list_id, start_id, count, direction)
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

	pub fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, ApiCallError> {
		self.entity_client.get_type_model(type_ref)
	}
}
