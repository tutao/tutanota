#[cfg_attr(test, mockall_double::double)]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::crypto::key::GenericAesKey;
use crate::element_value::ParsedEntity;
use crate::entities::entity_facade::{EntityFacade, ID_FIELD};
use crate::entities::generated::base::PersistenceResourcePostReturn;
use crate::entities::Entity;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::id::id_tuple::IdType;
use crate::instance_mapper::InstanceMapper;
use crate::metamodel::TypeModel;
use crate::GeneratedId;
use crate::{ApiCallError, ListLoadDirection};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// A high level interface to manipulate encrypted entities/instances via the REST API
pub struct CryptoEntityClient {
	entity_client: Arc<EntityClient>,
	entity_facade: Arc<dyn EntityFacade>,
	crypto_facade: Arc<CryptoFacade>,
	instance_mapper: Arc<InstanceMapper>,
}

#[cfg_attr(test, mockall::automock)]
impl CryptoEntityClient {
	pub fn new(
		entity_client: Arc<EntityClient>,
		entity_facade: Arc<dyn EntityFacade>,
		crypto_facade: Arc<CryptoFacade>,
		instance_mapper: Arc<InstanceMapper>,
	) -> Self {
		CryptoEntityClient {
			entity_client,
			entity_facade,
			crypto_facade,
			instance_mapper,
		}
	}

	pub fn get_crypto_facade(&self) -> &Arc<CryptoFacade> {
		&self.crypto_facade
	}

	pub fn serialize_entity<Instance>(
		&self,
		instance: Instance,
		key: Option<&GenericAesKey>,
	) -> Result<ParsedEntity, ApiCallError>
	where
		Instance: Entity + Serialize,
	{
		let type_ref = &Instance::type_ref();
		let type_model = self
			.entity_client
			.type_model_provider
			.resolve_type_ref(type_ref)
			.ok_or_else(|| {
				ApiCallError::internal(format!(
					"failed to find type model for type ref of instance {type_ref}"
				))
			})?;
		let parsed_instance = self
			.instance_mapper
			.serialize_entity(instance)
			.map_err(|_e| {
				ApiCallError::internal(format!("failed to serialize instance {type_ref}"))
			})?;
		if type_model.is_encrypted() {
			let key = key
				.ok_or_else(|| ApiCallError::internal(format!("No key to encrypt: {type_ref}")))?;
			self.entity_facade
				.encrypt_and_map(type_model, &parsed_instance, key)
				.map_err(Into::into)
		} else {
			Ok(parsed_instance)
		}
	}

	pub async fn create_instance<Instance: Entity + Serialize>(
		&self,
		instance: Instance,
		session_key: Option<&GenericAesKey>,
	) -> Result<PersistenceResourcePostReturn, ApiCallError> {
		let parsed_entity = self.serialize_entity(instance, session_key)?;
		self.entity_client
			.create_instance(&Instance::type_ref(), parsed_entity, &self.instance_mapper)
			.await
	}

	pub async fn update_instance<Instance: Entity + Serialize>(
		&self,
		instance: Instance,
	) -> Result<(), ApiCallError> {
		let type_ref = Instance::type_ref();
		let parsed_entity = self
			.instance_mapper
			.serialize_entity(instance)
			.map_err(|e| ApiCallError::internal_with_err(e, type_ref.to_string().as_str()))?;
		let type_model = self
			.entity_client
			.type_model_provider
			.resolve_type_ref(&type_ref)
			.ok_or_else(|| {
				ApiCallError::internal(format!(
					"failed to find type model for type ref of instance {type_ref}"
				))
			})?;

		let parsed_instance = if type_model.is_encrypted() {
			let session_key = self
				.crypto_facade
				.resolve_session_key(&parsed_entity, &type_model)
				.await
				.map_err(|e| {
					ApiCallError::internal_with_err(
						e,
						format!("While updating: {type_ref}").as_str(),
					)
				})?
				.ok_or_else(|| {
					ApiCallError::internal(format!("No session key before updating: {type_ref}"))
				})?;
			self.entity_facade.encrypt_and_map(
				type_model,
				&parsed_entity,
				&session_key.session_key,
			)?
		} else {
			parsed_entity
		};

		self.entity_client
			.update_instance(&type_ref, parsed_instance)
			.await
	}

	pub async fn load<T: Entity + Deserialize<'static>, ID: IdType>(
		&self,
		id: &ID,
	) -> Result<T, ApiCallError> {
		let type_ref = T::type_ref();
		let type_model = self.entity_client.get_type_model(&type_ref)?;
		let parsed_entity = self.entity_client.load(&type_ref, id).await?;

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
	}

	async fn process_encrypted_entity<T: Entity + Deserialize<'static>>(
		&self,
		type_model: &TypeModel,
		mut parsed_entity: ParsedEntity,
	) -> Result<T, ApiCallError> {
		let possible_session_key = self
			.crypto_facade
			.resolve_session_key(&mut parsed_entity, type_model)
			.await
			.map_err(|error| {
				let id = parsed_entity.get(ID_FIELD);
				ApiCallError::InternalSdkError {
					error_message: format!(
						"Failed to resolve session key for entity '{}' with ID: {:?}; {}",
						type_model.name, id, error
					),
				}
			})?;
		match possible_session_key {
			Some(session_key) => {
				let decrypted_entity =
					self.entity_facade
						.decrypt_and_map(type_model, parsed_entity, session_key)?;
				let typed_entity = self
					.instance_mapper
					.parse_entity::<T>(decrypted_entity)
					.map_err(|e| ApiCallError::InternalSdkError {
						error_message: format!(
							"Failed to parse encrypted entity into proper types: {}",
							e
						),
					})?;
				Ok(typed_entity)
			},
			// `resolve_session_key()` only returns none if the entity is unencrypted, so
			// no need to handle it
			None => {
				unreachable!()
			},
		}
	}

	#[allow(dead_code)] // will be used but rustc can't see it in some configurations right now
	pub async fn load_range<T: Entity + Deserialize<'static>>(
		&self,
		list_id: &GeneratedId,
		start_id: &GeneratedId,
		count: usize,
		direction: ListLoadDirection,
	) -> Result<Vec<T>, ApiCallError> {
		let type_ref = T::type_ref();
		let type_model = self.entity_client.get_type_model(&type_ref)?;
		let parsed_entities = self
			.entity_client
			.load_range(&type_ref, list_id, start_id, count, direction)
			.await?;

		if type_model.marked_encrypted() {
			// StreamExt::collect requires result to be Default. Fall back to plain loop.
			let mut result_list = Vec::with_capacity(parsed_entities.len());
			for entity in parsed_entities {
				let typed_entity = self.process_encrypted_entity(type_model, entity).await?;
				result_list.push(typed_entity);
			}
			Ok(result_list)
		} else {
			let result_list: Vec<T> = parsed_entities
				.into_iter()
				.map(|e| self.instance_mapper.parse_entity::<T>(e))
				.collect::<Result<Vec<T>, _>>()
				.map_err(|error| ApiCallError::InternalSdkError {
					error_message: format!(
						"Failed to parse unencrypted entity into proper types: {}",
						error
					),
				})?;
			Ok(result_list)
		}
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::crypto_facade::{MockCryptoFacade, ResolvedSessionKey};
	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::{aes::Iv, Aes256Key};
	use crate::crypto_entity_client::CryptoEntityClient;
	use crate::date::DateTime;
	use crate::entities::entity_facade::{EntityFacadeImpl, ID_FIELD};
	use crate::entities::generated::tutanota::Mail;
	use crate::entity_client::MockEntityClient;
	use crate::instance_mapper::InstanceMapper;
	use crate::metamodel::TypeModel;
	use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
	use crate::util::entity_test_utils::generate_email_entity;
	use crate::util::test_utils::leak;
	use crate::{IdTupleGenerated, TypeRef};
	use rand::random;
	use std::sync::Arc;

	#[tokio::test]
	async fn can_load_mail() {
		// Generate an encrypted type to feed into a mock of the entity client
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
		let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
		let is_confidential = false;
		const SUBJECT: &str = "Subject";
		const SENDER_NAME: &str = "Sender";
		const RECIPIENT_NAME: &str = "Recipient";
		let (encrypted_mail, ..) = generate_email_entity(
			&sk,
			&iv,
			is_confidential,
			SUBJECT.to_owned(),
			SENDER_NAME.to_owned(),
			RECIPIENT_NAME.to_owned(),
		);

		// We cause a deliberate memory leak to convert the mail type's lifetime to static because
		// the callback to `returning` requires returned references to have a static lifetime
		let my_favorite_leak: &'static TypeModelProvider = leak(init_type_model_provider());

		let raw_mail_id = encrypted_mail
			.get(ID_FIELD)
			.unwrap()
			.assert_tuple_id_generated();
		let mail_id =
			IdTupleGenerated::new(raw_mail_id.list_id.clone(), raw_mail_id.element_id.clone());
		let mail_type_ref = TypeRef {
			app: "tutanota",
			type_: "Mail",
		};
		let mail_type_model: &'static TypeModel = my_favorite_leak
			.get_type_model(mail_type_ref.app, mail_type_ref.type_)
			.expect("Error in type_model_provider");

		// Set up the mock of the plain unencrypted entity client
		let mut mock_entity_client = MockEntityClient::default();
		mock_entity_client
			.expect_get_type_model()
			.returning(|_| Ok(mail_type_model));
		mock_entity_client
			.expect_load()
			.returning(move |_, _: &IdTupleGenerated| Ok(encrypted_mail.clone()));

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
					owner_key_version: 0i64,
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("hello@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
	}
}
