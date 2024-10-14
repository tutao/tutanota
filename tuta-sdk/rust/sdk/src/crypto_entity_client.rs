#[cfg_attr(test, mockall_double::double)]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::entities::entity_facade::EntityFacade;
use crate::entities::Entity;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::entity_client::IdType;
use crate::instance_mapper::InstanceMapper;
use crate::ApiCallError;
use serde::Deserialize;
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

	pub async fn load<T: Entity + Deserialize<'static>, ID: IdType>(
		&self,
		id: &ID,
	) -> Result<T, ApiCallError> {
		let type_ref = T::type_ref();
		let type_model = self.entity_client.get_type_model(&type_ref)?;
		let mut parsed_entity = self.entity_client.load(&type_ref, id).await?;

		if type_model.marked_encrypted() {
			let possible_session_key = self
				.crypto_facade
				.resolve_session_key(&mut parsed_entity, type_model)
				.await
				.map_err(|error| ApiCallError::InternalSdkError {
					error_message: format!(
						"Failed to resolve session key for entity '{}' with ID: {}; {}",
						type_model.name, id, error
					),
				})?;
			match possible_session_key {
				Some(session_key) => {
					let decrypted_entity = self.entity_facade.decrypt_and_map(
						type_model,
						parsed_entity,
						session_key,
					)?;
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
}

#[cfg(test)]
mod tests {
	use crate::crypto::crypto_facade::{MockCryptoFacade, ResolvedSessionKey};
	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::{aes::Iv, Aes256Key};
	use crate::crypto_entity_client::CryptoEntityClient;
	use crate::date::DateTime;
	use crate::entities::entity_facade::EntityFacadeImpl;
	use crate::entities::tutanota::Mail;
	use crate::entity_client::MockEntityClient;
	use crate::instance_mapper::InstanceMapper;
	use crate::metamodel::TypeModel;
	use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
	use crate::util::entity_test_utils::generate_email_entity;
	use crate::util::test_utils::leak;
	use crate::{IdTuple, TypeRef};
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

		let raw_mail_id = encrypted_mail.get("_id").unwrap().assert_tuple_id();
		let mail_id = IdTuple::new(raw_mail_id.list_id.clone(), raw_mail_id.element_id.clone());
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
			.returning(move |_, _: &IdTuple| Ok(encrypted_mail.clone()));

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
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
