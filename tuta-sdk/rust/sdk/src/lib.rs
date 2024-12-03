#![macro_use]

use std::collections::HashMap;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};
use std::sync::Arc;

use minicbor::encode::Write;
use minicbor::{Encode, Encoder};
use serde::Serialize;
use std::borrow::Borrow;
use thiserror::Error;

#[cfg_attr(test, mockall_double::double)]
use crate::blobs::blob_access_token_facade::BlobAccessTokenFacade;
use crate::blobs::blob_facade::BlobFacade;
#[cfg_attr(test, mockall_double::double)]
use crate::crypto::asymmetric_crypto_facade::AsymmetricCryptoFacade;
use crate::crypto::crypto_facade::create_auth_verifier;
#[cfg_attr(test, mockall_double::double)]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::crypto::key::{GenericAesKey, VersionedAesKey};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::{aes::Iv, Aes256Key, AES_256_KEY_SIZE};
#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::date::date_provider::SystemDateProvider;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::entity_facade::{EntityFacade, EntityFacadeImpl};
use crate::entities::generated::sys::{CreateSessionData, SaltData, User};
use crate::entities::generated::tutanota::Mail;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::instance_mapper::InstanceMapper;
use crate::json_serializer::{InstanceMapperError, JsonSerializer};
#[cfg_attr(test, mockall_double::double)]
use crate::key_cache::KeyCache;
#[cfg_attr(test, mockall_double::double)]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::login::login_facade::{derive_user_passphrase_key, KdfType};
use crate::login::{CredentialType, Credentials, LoginError, LoginFacade};
use crate::mail_facade::MailFacade;
use crate::rest_error::{HttpError, ParseFailureError};
use crate::services::generated::sys::{SaltService, SessionService};
#[cfg_attr(test, mockall_double::double)]
use crate::services::service_executor::{ResolvingServiceExecutor, ServiceExecutor};
use crate::services::ExtraServiceParams;
use crate::type_model_provider::{init_type_model_provider, AppName, TypeModelProvider, TypeName};
#[cfg_attr(test, mockall_double::double)]
use crate::typed_entity_client::TypedEntityClient;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use bindings::rest_client::{RestClient, RestClientError};

pub mod crypto;
pub mod crypto_entity_client;
pub mod date;
mod element_value;
pub mod entities;
mod entity_client;
pub mod folder_system;
mod groups;
mod instance_mapper;
mod json_element;
mod json_serializer;
mod key_cache;
mod key_loader_facade;
mod logging;
pub mod login;
mod mail_facade;
mod metamodel;

pub mod bindings;
pub mod blobs;
mod id;
#[cfg(feature = "net")]
pub mod net;
pub mod rest_error;
pub mod services;
mod simple_crypto;
pub mod tutanota_constants;
mod type_model_provider;
mod typed_entity_client;
mod user_facade;
mod util;

use crate::bindings::suspendable_rest_client::SuspendableRestClient;
use crate::entities::generated::base::PersistenceResourcePostReturn;
use crate::entities::generated::storage::BlobServerAccessInfo;
use crate::entities::Entity;
use crate::groups::GroupType;
use crate::json_element::RawEntity;
use crate::metamodel::TypeModel;
use crate::tutanota_constants::ArchiveDataType;
pub use id::custom_id::CustomId;
pub use id::generated_id::GeneratedId;
pub use id::id_tuple::IdTupleCustom;
pub use id::id_tuple::IdTupleGenerated;

pub static CLIENT_VERSION: &str = env!("CARGO_PKG_VERSION");

uniffi::setup_scaffolding!();

/// A type for an instance/entity from the backend
/// Definitions for them can be found inside the type model JSON files under `/test_data`
#[derive(Debug, PartialEq, Clone)]
pub struct TypeRef {
	pub app: AppName,
	pub type_: TypeName,
}

// Option 1:
// metamodel -> Rust struct -> Kotlin/Swift classes
// need to be able to covert from ParsedEntity -> Rust struct
// will generate a bit more code but we need to write the conversion only once
// might or might not work for WASM

// Option 2:
// metamodel -> Kotlin/Swift classes
// need to be able to covert from ParsedEntity -> Kotlin/Swift class
// will generate a bit less code but we need to write the conversion for every platform
// will work for WASM for sure

impl Display for TypeRef {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		write!(f, "TypeRef({}, {})", self.app, self.type_)
	}
}

pub struct HeadersProvider {
	access_token: Option<String>,
}

impl HeadersProvider {
	#[must_use]
	fn new(access_token: Option<String>) -> Self {
		Self { access_token }
	}

	fn provide_headers(&self, model_version: u32) -> HashMap<String, String> {
		let mut headers = HashMap::from([
			("cv".to_owned(), CLIENT_VERSION.to_string()),
			("v".to_owned(), model_version.to_string()),
		]);

		if let Some(access_token) = &self.access_token {
			headers.insert("accessToken".to_owned(), access_token.to_string());
		}

		headers
	}
}

/// The external facing interface used by the consuming code via FFI
#[derive(uniffi::Object)]
pub struct Sdk {
	type_model_provider: Arc<TypeModelProvider>,
	json_serializer: Arc<JsonSerializer>,
	instance_mapper: Arc<InstanceMapper>,
	rest_client: Arc<dyn RestClient>,
	base_url: String,
}

#[uniffi::export]
impl Sdk {
	#[uniffi::constructor]
	pub fn new(base_url: String, raw_rest_client: Arc<dyn RestClient>) -> Sdk {
		logging::init_logger();
		log::info!("Initializing SDK...");

		let type_model_provider = Arc::new(init_type_model_provider());
		// TODO validate parameters
		let instance_mapper = Arc::new(InstanceMapper::new());
		let json_serializer = Arc::new(JsonSerializer::new(type_model_provider.clone()));
		let date_provider = Arc::new(SystemDateProvider);
		let rest_client = Arc::new(SuspendableRestClient::new(raw_rest_client, date_provider));

		Sdk {
			type_model_provider,
			json_serializer,
			instance_mapper,
			rest_client,
			base_url,
		}
	}
	/// Authorizes the SDK's REST requests via inserting `access_token` into the HTTP headers
	pub async fn login(&self, credentials: Credentials) -> Result<Arc<LoggedInSdk>, LoginError> {
		let auth_headers_provider =
			Arc::new(HeadersProvider::new(Some(credentials.access_token.clone())));

		let entity_facade = Arc::new(EntityFacadeImpl::new(
			self.type_model_provider.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
		));

		let entity_client = Arc::new(EntityClient::new(
			self.rest_client.clone(),
			self.json_serializer.clone(),
			self.base_url.clone(),
			auth_headers_provider.clone(),
			self.type_model_provider.clone(),
		));
		let typed_entity_client: Arc<TypedEntityClient> = Arc::new(TypedEntityClient::new(
			entity_client.clone(),
			self.instance_mapper.clone(),
		));

		let login_facade =
			LoginFacade::new(entity_client.clone(), typed_entity_client.clone(), |user| {
				UserFacade::new(Arc::new(KeyCache::new()), user)
			});
		let user_facade = Arc::new(login_facade.resume_session(&credentials).await?);

		let key_loader = Arc::new(KeyLoaderFacade::new(
			user_facade.clone(),
			typed_entity_client.clone(),
		));
		let service_executor: Arc<ServiceExecutor> = Arc::new(ServiceExecutor::new(
			auth_headers_provider.clone(),
			None,
			entity_facade.clone(),
			self.instance_mapper.clone(),
			self.json_serializer.clone(),
			self.rest_client.clone(),
			self.type_model_provider.clone(),
			self.base_url.clone(),
		));
		let asymmetric_crypto_facade = Arc::new(AsymmetricCryptoFacade::new(
			key_loader.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
			service_executor,
		));
		let crypto_facade: Arc<CryptoFacade> = Arc::new(CryptoFacade::new(
			key_loader.clone(),
			self.instance_mapper.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
			asymmetric_crypto_facade.clone(),
		));
		let crypto_entity_client: Arc<CryptoEntityClient> = Arc::new(CryptoEntityClient::new(
			entity_client.clone(),
			entity_facade.clone(),
			crypto_facade.clone(),
			self.instance_mapper.clone(),
		));

		let service_executor = Arc::new(ResolvingServiceExecutor::new(
			auth_headers_provider.clone(),
			crypto_facade.clone(),
			entity_facade.clone(),
			self.instance_mapper.clone(),
			self.json_serializer.clone(),
			self.rest_client.clone(),
			self.type_model_provider.clone(),
			self.base_url.clone(),
		));

		let date_provider = Arc::new(SystemDateProvider);

		let blob_facade = self.create_blob_facade(
			auth_headers_provider.clone(),
			service_executor.clone(),
			date_provider,
		);

		Ok(Arc::new(LoggedInSdk {
			user_facade,
			entity_client,
			service_executor,
			typed_entity_client,
			crypto_entity_client,
			instance_mapper: Arc::clone(&self.instance_mapper),
			entity_facade,
			blob_facade,
			json_serializer: Arc::clone(&self.json_serializer),
			type_model_provider: Arc::clone(&self.type_model_provider),
		}))
	}

	// not ready yet for production use, only does temporary login for free users without offline.
	pub async fn create_session(
		&self,
		mail_address: &str,
		passphrase: &str,
	) -> Result<Arc<LoggedInSdk>, LoginError> {
		let headers_provider = Arc::new(HeadersProvider::new(None));
		let entity_facade = Arc::new(EntityFacadeImpl::new(
			self.type_model_provider.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
		));

		let service_executor = ServiceExecutor::new(
			headers_provider.clone(),
			None,
			entity_facade,
			self.instance_mapper.clone(),
			self.json_serializer.clone(),
			self.rest_client.clone(),
			self.type_model_provider.clone(),
			self.base_url.to_string(),
		);
		let salt_get_input: SaltData = SaltData {
			_format: 0,
			mailAddress: mail_address.to_string(),
		};
		let salt_return = service_executor
			.get::<SaltService>(salt_get_input, ExtraServiceParams::default())
			.await?;

		let Ok(salt) = salt_return.salt.try_into() else {
			return Err(LoginError::InvalidKey {
				error_message: "salt has wrong length".to_string(),
			});
		};

		let randomizer = RandomizerFacade::from_core(rand_core::OsRng);
		let access_key = Aes256Key::generate(&randomizer);
		let user_passphrase_key = derive_user_passphrase_key(KdfType::Argon2id, passphrase, salt);
		let auth_verifier = create_auth_verifier(user_passphrase_key.clone());
		let session_data: CreateSessionData = CreateSessionData {
			_format: 0,
			accessKey: Some(access_key.as_bytes().to_vec()),
			authToken: None,
			authVerifier: Some(auth_verifier),
			clientIdentifier: "Linux Desktop".to_string(),
			mailAddress: Some(mail_address.to_string()),
			recoverCodeVerifier: None,
			user: None,
		};
		let encrypted_passphrase_key = GenericAesKey::Aes256(access_key).encrypt_key(
			&GenericAesKey::Aes256(user_passphrase_key),
			Iv::generate(&randomizer),
		);
		let session_data_response = service_executor
			.post::<SessionService>(session_data, ExtraServiceParams::default())
			.await?;

		self.login(Credentials {
			login: mail_address.to_string(),
			user_id: session_data_response.user.clone(),
			access_token: session_data_response.accessToken.clone(),
			encrypted_passphrase_key,
			credential_type: CredentialType::Internal,
		})
		.await
	}
}

impl Sdk {
	fn create_blob_facade(
		&self,
		auth_headers_provider: Arc<HeadersProvider>,
		service_executor: Arc<ResolvingServiceExecutor>,
		date_provider: Arc<SystemDateProvider>,
	) -> Arc<BlobFacade> {
		let blob_access_token_facade = BlobAccessTokenFacade::new(
			RandomizerFacade::from_core(rand_core::OsRng),
			service_executor,
			date_provider.clone(),
		);

		let blob_facade = BlobFacade::new(
			blob_access_token_facade,
			self.rest_client.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
			auth_headers_provider.clone(),
			self.instance_mapper.clone(),
			self.json_serializer.clone(),
		);
		Arc::new(blob_facade)
	}
}

#[allow(dead_code)]
#[derive(uniffi::Object)]
pub struct LoggedInSdk {
	user_facade: Arc<UserFacade>,
	entity_client: Arc<EntityClient>,
	service_executor: Arc<ResolvingServiceExecutor>,
	entity_facade: Arc<dyn EntityFacade>,
	json_serializer: Arc<JsonSerializer>,
	typed_entity_client: Arc<TypedEntityClient>,
	crypto_entity_client: Arc<CryptoEntityClient>,
	blob_facade: Arc<BlobFacade>,
	pub instance_mapper: Arc<InstanceMapper>,
	pub type_model_provider: Arc<TypeModelProvider>,
}

impl LoggedInSdk {
	#[must_use]
	pub fn get_service_executor(&self) -> &Arc<ResolvingServiceExecutor> {
		&self.service_executor
	}

	pub fn encrypt_and_map(
		&self,
		type_model: &TypeModel,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError> {
		self.entity_facade.encrypt_and_map(type_model, instance, sk)
	}

	pub fn get_entity_client(&self) -> Arc<EntityClient> {
		self.entity_client.clone()
	}

	pub async fn get_current_sym_group_key(
		&self,
		group_id: &GeneratedId,
	) -> Result<VersionedAesKey, ApiCallError> {
		self.crypto_entity_client
			.get_crypto_facade()
			.get_key_loader_facade()
			.as_ref()
			.get_current_sym_group_key(group_id)
			.await
			.map_err(|err| ApiCallError::internal(format!("KeyLoadError: {err:?}")))
	}

	pub fn get_user_group_id(&self) -> GeneratedId {
		self.user_facade.get_user_group_id()
	}

	pub async fn request_blob_facade_write_token(
		&self,
		archive_data_type: ArchiveDataType,
	) -> Result<BlobServerAccessInfo, ApiCallError> {
		let mail_group_id = self
			.user_facade
			.get_membership_by_group_type(GroupType::Mail)?
			.group;
		self.blob_facade
			.blob_access_token_facade
			.request_write_token(archive_data_type, &mail_group_id)
			.await
	}

	pub fn serialize_instance_to_json<Instance>(
		&self,
		instance: Instance,
		key: &GenericAesKey,
	) -> Result<String, ApiCallError>
	where
		Instance: Entity + Serialize,
	{
		let parsed_entity = self
			.crypto_entity_client
			.serialize_entity(instance, Some(key))?;
		let raw_entity = self
			.json_serializer
			.serialize(&Instance::type_ref(), parsed_entity)?;
		serde_json::to_string(&raw_entity).map_err(|_e| {
			ApiCallError::internal(format!(
				"failed to stringify raw entity {}",
				Instance::type_ref()
			))
		})
	}
}

#[uniffi::export]
impl LoggedInSdk {
	/// Generates a new interface to operate on mail entities
	#[must_use]
	pub fn mail_facade(&self) -> MailFacade {
		MailFacade::new(
			self.crypto_entity_client.clone(),
			self.user_facade.clone(),
			self.service_executor.clone(),
		)
	}

	#[must_use]
	pub fn blob_facade(&self) -> Arc<BlobFacade> {
		self.blob_facade.clone()
	}
}

#[derive(uniffi::Enum, Debug, PartialEq)]
pub enum ListLoadDirection {
	ASC,
	/// Reverse order
	DESC,
}

/// Contains an error from the SDK to be handled by the consuming code over the FFI
#[derive(Error, Debug, uniffi::Error, Eq, PartialEq, Clone)]
pub enum ApiCallError {
	#[error("Rest client error, source: {source}")]
	RestClient {
		#[from]
		source: RestClientError,
	},
	#[error("ServerResponseError: {source}")]
	ServerResponseError {
		#[from]
		source: HttpError,
	},
	#[error("InternalSdkError: {error_message}")]
	InternalSdkError { error_message: String },
}

impl ApiCallError {
	#[must_use]
	pub fn internal(message: String) -> ApiCallError {
		ApiCallError::InternalSdkError {
			error_message: message,
		}
	}
	pub fn internal_with_err<E: Error>(error: E, message: &str) -> ApiCallError {
		ApiCallError::InternalSdkError {
			error_message: format!("{}: {}", error, message),
		}
	}
}

impl From<InstanceMapperError> for ApiCallError {
	fn from(value: InstanceMapperError) -> Self {
		ApiCallError::InternalSdkError {
			error_message: value.to_string(),
		}
	}
}

impl From<ParseFailureError> for ApiCallError {
	fn from(_value: ParseFailureError) -> Self {
		ApiCallError::InternalSdkError {
			error_message: "Parse error".to_owned(),
		}
	}
}

#[uniffi::export]
#[must_use]
pub fn serialize_mail(mail: Mail) -> Vec<u8> {
	let entity_map = InstanceMapper::new().serialize_entity(mail).unwrap();
	let mut vec = Vec::new();
	let mut encoder = Encoder::new(&mut vec);
	encoder.encode(&entity_map).unwrap();
	vec
}

impl<C> Encode<C> for ElementValue {
	fn encode<W: Write>(
		&self,
		e: &mut Encoder<W>,
		_: &mut C,
	) -> Result<(), minicbor::encode::Error<W::Error>> {
		match self {
			ElementValue::Null => e.null()?,
			ElementValue::String(s) => e.str(s)?,
			// JS-specific: some numbers might be big, so we encode them as strings
			ElementValue::Number(n) => e.str(n.to_string().as_str())?,
			ElementValue::Bytes(b) => e.bytes(b)?,
			// See OfflineStorage dateEncoder for this tag
			ElementValue::Date(d) => e.tag(minicbor::data::Tag::new(100))?.u64(d.as_millis())?,
			ElementValue::Bool(b) => e.bool(*b)?,
			ElementValue::IdGeneratedId(s) => e.str(s.as_str())?,
			ElementValue::IdCustomId(s) => e.str(s.as_str())?,
			ElementValue::IdTupleGeneratedElementId(id) => e
				.array(2)?
				.str(id.list_id.as_str())?
				.str(id.element_id.as_str())?,
			ElementValue::IdTupleCustomElementId(id) => e
				.array(2)?
				.str(id.list_id.as_str())?
				.str(id.element_id.as_str())?,
			ElementValue::Dict(d) => {
				e.map(d.len() as u64)?;
				for (k, v) in d {
					e.str(k)?;
					e.encode(v)?;
				}
				e
			},
			ElementValue::Array(a) => {
				e.array(a.len() as u64)?;
				for v in a {
					e.encode(v)?;
				}
				e
			},
		};
		Ok(())
	}

	fn is_nil(&self) -> bool {
		matches!(self, ElementValue::Null)
	}
}
#[cfg(test)]
mod tests {
	use crate::entities::generated::tutanota::Mail;
	use crate::serialize_mail;
	use crate::util::test_utils::create_test_entity;

	#[test]
	fn test_serialize_mail_does_not_panic() {
		let mail = create_test_entity::<Mail>();
		let _ = serialize_mail(mail);
	}
}
