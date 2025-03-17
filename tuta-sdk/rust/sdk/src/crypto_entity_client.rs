#[cfg_attr(test, mockall_double::double)]
use crate::crypto::asymmetric_crypto_facade::AsymmetricCryptoFacade;
#[cfg_attr(test, mockall_double::double)]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
use crate::crypto::public_key_provider::PublicKeyIdentifier;
use crate::crypto::X25519PublicKey;
use crate::element_value::ParsedEntity;
use crate::entities::entity_facade::{EntityFacade, ID_FIELD};
use crate::entities::generated::base::PersistenceResourcePostReturn;
use crate::entities::generated::tutanota::Mail;
use crate::entities::Entity;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::id::id_tuple::IdType;
use crate::instance_mapper::InstanceMapper;
#[cfg_attr(test, mockall_double::double)]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::metamodel::TypeModel;
use crate::tutanota_constants::{
	EncryptionAuthStatus, PublicKeyIdentifierType, SYSTEM_GROUP_MAIL_ADDRESS,
};
use crate::util::{convert_version_to_u64, Versioned};
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
	asymmetric_crypto_facade: Arc<AsymmetricCryptoFacade>,
	key_loader_facade: Arc<KeyLoaderFacade>,
}

#[cfg_attr(test, mockall::automock)]
impl CryptoEntityClient {
	pub fn new(
		entity_client: Arc<EntityClient>,
		entity_facade: Arc<dyn EntityFacade>,
		crypto_facade: Arc<CryptoFacade>,
		instance_mapper: Arc<InstanceMapper>,
		asymmetric_crypto_facade: Arc<AsymmetricCryptoFacade>,
		key_loader_facade: Arc<KeyLoaderFacade>,
	) -> Self {
		CryptoEntityClient {
			entity_client,
			entity_facade,
			crypto_facade,
			instance_mapper,
			asymmetric_crypto_facade,
			key_loader_facade,
		}
	}

	#[must_use]
	pub fn get_crypto_facade(&self) -> &Arc<CryptoFacade> {
		&self.crypto_facade
	}

	pub fn serialize_entity<Instance: Entity + Serialize>(
		&self,
		instance: Instance,
		key: Option<GenericAesKey>,
	) -> Result<ParsedEntity, ApiCallError> {
		let type_ref = &Instance::type_ref();
		let type_model = self.entity_client.get_type_model(type_ref)?;
		let parsed_instance = InstanceMapper::new()
			.serialize_entity(instance)
			.map_err(|_e| {
				ApiCallError::internal(format!("failed to serialize instance {type_ref}"))
			})?;
		if type_model.is_encrypted() {
			let key = key
				.ok_or_else(|| ApiCallError::internal(format!("No key to encrypt: {type_ref}")))?;
			self.entity_facade
				.encrypt_and_map(type_model, &parsed_instance, &key)
				.map_err(Into::into)
		} else {
			Ok(parsed_instance)
		}
	}

	pub async fn create_instance<Instance: Entity + Serialize>(
		&self,
		instance: Instance,
		session_key: Option<GenericAesKey>,
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
		let type_model = self.entity_client.get_type_model(&type_ref)?;

		let parsed_instance = if type_model.is_encrypted() {
			let session_key = self
				.crypto_facade
				.resolve_session_key(&parsed_entity, type_model)
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
		parsed_entity: ParsedEntity,
	) -> Result<T, ApiCallError> {
		let possible_session_key = self
			.crypto_facade
			.resolve_session_key(&parsed_entity, type_model)
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
				let sender_identity_pub_key = session_key.sender_identity_pub_key.clone();
				let decrypted_entity =
					self.entity_facade
						.decrypt_and_map(type_model, parsed_entity, session_key)?;
				let mut typed_entity = self
					.instance_mapper
					.parse_entity::<T>(decrypted_entity)
					.map_err(|e| ApiCallError::InternalSdkError {
						error_message: format!(
							"Failed to parse encrypted entity into proper types: {}",
							e
						),
					})?;
				self.insert_encryption_auth_status_if_needed::<T>(
					&mut typed_entity,
					sender_identity_pub_key,
				)
				.await;
				Ok(typed_entity)
			},
			// `resolve_session_key()` only returns none if the entity is unencrypted, so
			// no need to handle it
			None => {
				unreachable!()
			},
		}
	}

	/// Tries authenticating the given decrypted typed_entity against the provided sender_identity_pub_key
	/// If authentication is necessary the result will be injected into the typed_entity
	/// Currently this will not change the typed_entity except for (asymmetrically) encrypted mail instances.
	async fn insert_encryption_auth_status_if_needed<T: Entity + Deserialize<'static>>(
		&self,
		typed_entity: &mut T,
		sender_identity_pub_key: Option<X25519PublicKey>,
	) {
		let Some(mail): Option<&mut Mail> = crate::util::downcast_mut(typed_entity) else {
			// we only authenticate mail instances currently
			return;
		};

		mail.encryptionAuthStatus =
			match &mail.bucketKey {
				None => None,
				Some(bucket_key) => Some(
					self.authenticate_main_instance(
						sender_identity_pub_key.map(|sender_identity_pub_key| Versioned {
							version: convert_version_to_u64(bucket_key.senderKeyVersion.expect(
								"sender key version should be set on TutaCrypt bucket key",
							)),
							object: sender_identity_pub_key,
						}),
						mail,
						bucket_key
							.keyGroup
							.as_ref()
							.expect("key group should be set on TutaCrypt bucket key"),
					)
					.await as i64,
				),
			};
	}

	/// @return the EncryptionAuthStatus from the asymmetric decryption
	async fn authenticate_main_instance(
		&self,
		sender_identity_pub_key: Option<Versioned<X25519PublicKey>>,
		mail: &Mail,
		recipient_group: &GeneratedId,
	) -> EncryptionAuthStatus {
		match sender_identity_pub_key {
			None => {
				// This message was encrypted with RSA. We check if TutaCrypt could have been used instead.
				let current_key_pair: Versioned<AsymmetricKeyPair> = self
					.key_loader_facade
					.load_current_key_pair(recipient_group)
					.await
					.expect("loading our own current key pair");
				match current_key_pair.object {
					AsymmetricKeyPair::RSAKeyPair(_) | AsymmetricKeyPair::RSAX25519KeyPair(_) => {
						EncryptionAuthStatus::RSANoAuthentication
					},
					AsymmetricKeyPair::TutaCryptKeyPairs(_) => {
						// theoretically we could check that we did not rotate during this session.
						// However, we currently cannot rotate in the sdk.
						// So it is not possible and we would depend on keyrotationfacade ddor something else to keep state for us
						EncryptionAuthStatus::RsaDespiteTutacrypt
					},
				}
			},
			Some(sender_identity_pub_key) => {
				// TutaCrypt: we try authenticating
				let sender_verification_address = if mail.confidential {
					mail.sender.address.clone()
				} else {
					SYSTEM_GROUP_MAIL_ADDRESS.to_string()
				};
				self.tuta_crypt_authenticate_sender_of_main_instance(
					sender_verification_address,
					sender_identity_pub_key,
				)
				.await
			},
		}
	}

	async fn tuta_crypt_authenticate_sender_of_main_instance(
		&self,
		sender_mail_address: String,
		sender_identity_pub_key: Versioned<X25519PublicKey>,
	) -> EncryptionAuthStatus {
		let result = self
			.asymmetric_crypto_facade
			.authenticate_sender(
				PublicKeyIdentifier {
					identifier: sender_mail_address,
					identifier_type: PublicKeyIdentifierType::MailAddress,
				},
				sender_identity_pub_key.as_ref(),
			)
			.await;
		match result {
			Err(auth_error) => {
				println!("Failed to authenticate sender: {auth_error}");
				// we do not want to fail mail decryption here, e.g. in case an alias was removed we would get a permanent NotFoundError.
				// in those cases we will just show a warning banner but still want to display the mail
				EncryptionAuthStatus::TutacryptAuthenticationFailed
			},
			Ok(encryption_auth_status) => encryption_auth_status,
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
	use crate::crypto::asymmetric_crypto_facade::MockAsymmetricCryptoFacade;
	use crate::crypto::crypto_facade::{MockCryptoFacade, ResolvedSessionKey};
	use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
	use crate::crypto::public_key_provider::PublicKeyIdentifier;
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::rsa::RSAKeyPair;
	use crate::crypto::{aes::Iv, Aes256Key, TutaCryptKeyPairs, X25519PublicKey};
	use crate::crypto_entity_client::CryptoEntityClient;
	use crate::date::DateTime;
	use crate::entities::entity_facade::{EntityFacadeImpl, MockEntityFacade, ID_FIELD};
	use crate::entities::generated::sys::{AccountingInfo, BucketKey};
	use crate::entities::generated::tutanota::Mail;
	use crate::entity_client::MockEntityClient;
	use crate::instance_mapper::InstanceMapper;
	use crate::key_loader_facade::MockKeyLoaderFacade;
	use crate::metamodel::TypeModel;
	use crate::tutanota_constants::{
		CryptoProtocolVersion, EncryptionAuthStatus, PublicKeyIdentifierType,
	};
	use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
	use crate::util::entity_test_utils::generate_email_entity;
	use crate::util::test_utils::{create_test_entity, leak};
	use crate::util::Versioned;
	use crate::{GeneratedId, IdTupleGenerated, TypeRef};
	use mockall::predicate::eq;
	use rand::random;
	use std::sync::Arc;

	#[tokio::test]
	async fn no_auth_for_encrypted_instances_except_mail() {
		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(MockEntityClient::default()),
			Arc::new(MockEntityFacade::default()),
			Arc::new(MockCryptoFacade::default()),
			Arc::new(InstanceMapper::new()),
			Arc::new(MockAsymmetricCryptoFacade::default()),
			Arc::new(MockKeyLoaderFacade::default()),
		);
		let accounting_info: AccountingInfo = create_test_entity();
		let mut accounting_info_input = accounting_info.clone();
		crypto_entity_client
			.insert_encryption_auth_status_if_needed::<AccountingInfo>(
				&mut accounting_info_input,
				Some(X25519PublicKey::from_bytes([0; 32].as_slice()).unwrap()),
			)
			.await;
		assert_eq!(accounting_info, accounting_info_input);
	}

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
			None,
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
					owner_key_version: 0u64,
					sender_identity_pub_key: None,
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let asymmetric_crypto_facade = MockAsymmetricCryptoFacade::default();
		let key_loader_facade = MockKeyLoaderFacade::default();

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
			Arc::new(asymmetric_crypto_facade),
			Arc::new(key_loader_facade),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("sender@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
		assert_eq!(None, result.encryptionAuthStatus); // no bucket_key - no auth
	}

	#[tokio::test]
	async fn load_mail_authentication_succeeds() {
		// Generate an encrypted type to feed into a mock of the entity client
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
		let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
		let is_confidential = true; // important
		const SUBJECT: &str = "Subject";
		const SENDER_NAME: &str = "Sender";
		const RECIPIENT_NAME: &str = "Recipient";
		const SENDER_KEY_VERSION: u64 = 3u64;
		const SENDER_IDENTIFIER_EMAIL: &str = "sender@tutao.de";
		const PUB_SENDER_KEY: X25519PublicKey = X25519PublicKey::from_array([0xAC; 32]);
		let bucket_key = BucketKey {
			// only some fields are relevant because crypto_facade is mocked away
			_id: None,
			groupEncBucketKey: None,
			protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
			pubEncBucketKey: Some(vec![9, 8, 7]),
			recipientKeyVersion: 2,
			senderKeyVersion: Some(SENDER_KEY_VERSION as i64),
			bucketEncSessionKeys: vec![],
			keyGroup: Some(GeneratedId::test_random()),
		};
		let (encrypted_mail, ..) = generate_email_entity(
			&sk,
			&iv,
			is_confidential,
			SUBJECT.to_owned(),
			SENDER_NAME.to_owned(),
			RECIPIENT_NAME.to_owned(),
			Some(bucket_key),
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

		let mut asymmetric_crypto_facade = MockAsymmetricCryptoFacade::default();

		asymmetric_crypto_facade
			.expect_authenticate_sender()
			.withf(|sender, versioned_key| {
				sender.identifier == SENDER_IDENTIFIER_EMAIL
					&& sender.identifier_type == PublicKeyIdentifierType::MailAddress
					&& versioned_key.version == SENDER_KEY_VERSION
					&& versioned_key.object == &PUB_SENDER_KEY
			})
			.returning(move |_, _| Ok(EncryptionAuthStatus::TutacryptAuthenticationSucceeded));

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
					owner_key_version: 0u64,
					sender_identity_pub_key: Some(PUB_SENDER_KEY.clone()),
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let key_loader_facade = MockKeyLoaderFacade::default();

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
			Arc::new(asymmetric_crypto_facade),
			Arc::new(key_loader_facade),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("sender@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
		assert_eq!(
			Some(EncryptionAuthStatus::TutacryptAuthenticationSucceeded as i64),
			result.encryptionAuthStatus
		)
	}

	#[tokio::test]
	async fn load_mail_authentication_fails() {
		// Generate an encrypted type to feed into a mock of the entity client
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
		let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
		let is_confidential = true; // important
		const SUBJECT: &str = "Subject";
		const SENDER_NAME: &str = "Sender";
		const RECIPIENT_NAME: &str = "Recipient";
		let sender_key_version = 3u64;
		let bucket_key = BucketKey {
			// only some fields are relevant because crypto_facade is mocked away
			_id: None,
			groupEncBucketKey: None,
			protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
			pubEncBucketKey: Some(vec![9, 8, 7]),
			recipientKeyVersion: 2,
			senderKeyVersion: Some(sender_key_version as i64),
			bucketEncSessionKeys: vec![],
			keyGroup: Some(GeneratedId::test_random()),
		};
		let (encrypted_mail, ..) = generate_email_entity(
			&sk,
			&iv,
			is_confidential,
			SUBJECT.to_owned(),
			SENDER_NAME.to_owned(),
			RECIPIENT_NAME.to_owned(),
			Some(bucket_key),
		);
		let sender_identitfier = PublicKeyIdentifier {
			identifier: "sender@tutao.de".to_owned(), // hard_coded in generate_email_entity()
			identifier_type: PublicKeyIdentifierType::MailAddress,
		};
		let pub_sender_key = X25519PublicKey::from_bytes([0xac; 32].as_slice()).unwrap();
		let sender_key = pub_sender_key.clone();

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

		let mut asymmetric_crypto_facade = MockAsymmetricCryptoFacade::default();

		asymmetric_crypto_facade
			.expect_authenticate_sender()
			.withf(move |sender, versioned_key| {
				sender == &sender_identitfier
					&& versioned_key.version == sender_key_version
					&& versioned_key.object == &pub_sender_key
			})
			.returning(move |_, _| Ok(EncryptionAuthStatus::TutacryptAuthenticationFailed));

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
					owner_key_version: 0u64,
					sender_identity_pub_key: Some(sender_key.clone()),
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let key_loader_facade = MockKeyLoaderFacade::default();

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
			Arc::new(asymmetric_crypto_facade),
			Arc::new(key_loader_facade),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("sender@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
		assert_eq!(
			Some(EncryptionAuthStatus::TutacryptAuthenticationFailed as i64),
			result.encryptionAuthStatus
		)
	}

	#[tokio::test]
	async fn load_mail_authentication_system_sender_succeeds() {
		// Generate an encrypted type to feed into a mock of the entity client
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
		let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
		let is_confidential = false; // important: makes sure this is verified against the system pub key
		const SUBJECT: &str = "Subject";
		const SENDER_NAME: &str = "Sender";
		const RECIPIENT_NAME: &str = "Recipient";
		let sender_key_version = 3u64;
		let bucket_key = BucketKey {
			// only some fields are relevant because crypto_facade is mocked away
			_id: None,
			groupEncBucketKey: None,
			protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
			pubEncBucketKey: Some(vec![9, 8, 7]),
			recipientKeyVersion: 2,
			senderKeyVersion: Some(sender_key_version as i64),
			bucketEncSessionKeys: vec![],
			keyGroup: Some(GeneratedId::test_random()),
		};
		let (encrypted_mail, ..) = generate_email_entity(
			&sk,
			&iv,
			is_confidential,
			SUBJECT.to_owned(),
			SENDER_NAME.to_owned(),
			RECIPIENT_NAME.to_owned(),
			Some(bucket_key),
		);
		let system_sender_identitfier = PublicKeyIdentifier {
			identifier: "system@tutanota.de".to_owned(), // hard_coded in generate_email_entity()
			identifier_type: PublicKeyIdentifierType::MailAddress,
		};
		let pub_sender_key = X25519PublicKey::from_bytes([0xac; 32].as_slice()).unwrap();
		let sender_key = pub_sender_key.clone();

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

		let mut asymmetric_crypto_facade = MockAsymmetricCryptoFacade::default();

		asymmetric_crypto_facade
			.expect_authenticate_sender()
			.withf(move |sender, versioned_key| {
				sender == &system_sender_identitfier
					&& versioned_key.version == sender_key_version
					&& versioned_key.object == &pub_sender_key
			})
			.returning(move |_, _| Ok(EncryptionAuthStatus::TutacryptAuthenticationSucceeded));

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
					owner_key_version: 0u64,
					sender_identity_pub_key: Some(sender_key.clone()),
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let key_loader_facade = MockKeyLoaderFacade::default();

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
			Arc::new(asymmetric_crypto_facade),
			Arc::new(key_loader_facade),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("sender@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
		assert_eq!(
			Some(EncryptionAuthStatus::TutacryptAuthenticationSucceeded as i64),
			result.encryptionAuthStatus
		)
	}

	#[tokio::test]
	async fn no_auth_for_rsa_mail() {
		// Generate an encrypted type to feed into a mock of the entity client
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
		let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
		let is_confidential = true; // important
		const SUBJECT: &str = "Subject";
		const SENDER_NAME: &str = "Sender";
		const RECIPIENT_NAME: &str = "Recipient";
		let recipient_group = GeneratedId::test_random();
		let recipient_key_version = 2u64;
		let bucket_key = BucketKey {
			// only some fields are relevant because crypto_facade is mocked away
			_id: None,
			groupEncBucketKey: None,
			protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
			pubEncBucketKey: Some(vec![9, 8, 7]),
			recipientKeyVersion: recipient_key_version as i64,
			senderKeyVersion: None,
			bucketEncSessionKeys: vec![],
			keyGroup: Some(recipient_group.clone()),
		};
		let (encrypted_mail, ..) = generate_email_entity(
			&sk,
			&iv,
			is_confidential,
			SUBJECT.to_owned(),
			SENDER_NAME.to_owned(),
			RECIPIENT_NAME.to_owned(),
			Some(bucket_key),
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

		let asymmetric_crypto_facade = MockAsymmetricCryptoFacade::default();

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
					owner_key_version: 0u64,
					sender_identity_pub_key: None,
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let mut key_loader_facade = MockKeyLoaderFacade::default();

		key_loader_facade
			.expect_load_current_key_pair()
			.with(eq(recipient_group))
			.returning(move |_| {
				let randomizer_facade = make_thread_rng_facade();
				let recipient_key_pair = RSAKeyPair::generate(&randomizer_facade);
				Ok(Versioned {
					object: AsymmetricKeyPair::RSAKeyPair(recipient_key_pair),
					version: 0,
				})
			});

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
			Arc::new(asymmetric_crypto_facade),
			Arc::new(key_loader_facade),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("sender@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
		assert_eq!(
			Some(EncryptionAuthStatus::RSANoAuthentication as i64),
			result.encryptionAuthStatus
		)
	}

	#[tokio::test]
	async fn auth_result_rsa_despite_tuta_crypt() {
		// Generate an encrypted type to feed into a mock of the entity client
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
		let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
		let is_confidential = true; // important
		const SUBJECT: &str = "Subject";
		const SENDER_NAME: &str = "Sender";
		const RECIPIENT_NAME: &str = "Recipient";
		let recipient_group = GeneratedId::test_random();
		let recipient_key_version = 2u64;
		let bucket_key = BucketKey {
			// only some fields are relevant because crypto_facade is mocked away
			_id: None,
			groupEncBucketKey: None,
			protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
			pubEncBucketKey: Some(vec![9, 8, 7]),
			recipientKeyVersion: recipient_key_version as i64,
			senderKeyVersion: None,
			bucketEncSessionKeys: vec![],
			keyGroup: Some(recipient_group.clone()),
		};
		let (encrypted_mail, ..) = generate_email_entity(
			&sk,
			&iv,
			is_confidential,
			SUBJECT.to_owned(),
			SENDER_NAME.to_owned(),
			RECIPIENT_NAME.to_owned(),
			Some(bucket_key),
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

		let asymmetric_crypto_facade = MockAsymmetricCryptoFacade::default();

		// Set up the mock of the crypto facade
		let mut mock_crypto_facade = MockCryptoFacade::default();
		mock_crypto_facade
			.expect_resolve_session_key()
			.returning(move |_, _| {
				Ok(Some(ResolvedSessionKey {
					session_key: sk.clone(),
					owner_enc_session_key: vec![1, 2, 3],
					owner_key_version: 0u64,
					sender_identity_pub_key: None,
				}))
			});

		// TODO: it would be nice to mock this
		let type_model_provider = Arc::new(init_type_model_provider());

		// Use the real `EntityFacade` as it contains the actual decryption logic
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);

		let mut key_loader_facade = MockKeyLoaderFacade::default();

		key_loader_facade
			.expect_load_current_key_pair()
			.with(eq(recipient_group))
			.returning(move |_| {
				let randomizer_facade = make_thread_rng_facade();

				let recipient_key_pair = TutaCryptKeyPairs::generate(&randomizer_facade);
				Ok(Versioned {
					object: AsymmetricKeyPair::TutaCryptKeyPairs(recipient_key_pair),
					version: 0,
				})
			});

		let crypto_entity_client = CryptoEntityClient::new(
			Arc::new(mock_entity_client),
			Arc::new(entity_facade),
			Arc::new(mock_crypto_facade),
			Arc::new(InstanceMapper::new()),
			Arc::new(asymmetric_crypto_facade),
			Arc::new(key_loader_facade),
		);

		let result: Mail = crypto_entity_client.load(&mail_id).await.unwrap();

		assert_eq!(DateTime::from_millis(1470039025474), result.receivedDate);
		assert_eq!(is_confidential, result.confidential);
		assert_eq!(SUBJECT.to_owned(), result.subject);
		assert_eq!(SENDER_NAME.to_owned(), result.sender.name);
		assert_eq!("sender@tutao.de".to_owned(), result.sender.address);
		assert_eq!(
			RECIPIENT_NAME.to_owned(),
			result.firstRecipient.clone().unwrap().name
		);
		assert_eq!(
			"support@yahoo.com".to_owned(),
			result.firstRecipient.clone().unwrap().address
		);
		assert_eq!(
			Some(EncryptionAuthStatus::RsaDespiteTutacrypt as i64),
			result.encryptionAuthStatus
		)
	}
}
