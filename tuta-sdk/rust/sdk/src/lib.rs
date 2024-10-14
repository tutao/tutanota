#![macro_use]

use std::collections::HashMap;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};
use std::sync::Arc;

use minicbor::encode::Write;
use minicbor::{Encode, Encoder};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::crypto::crypto_facade::create_auth_verifier;
#[cfg_attr(test, mockall_double::double)]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::crypto::key::GenericAesKey;
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::{aes::Iv, Aes256Key};
#[cfg_attr(test, mockall_double::double)]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::element_value::ElementValue;
use crate::entities::entity_facade::EntityFacadeImpl;
use crate::entities::sys::{CreateSessionData, SaltData};
use crate::entities::tutanota::Mail;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::entity_client::IdType;
use crate::generated_id::GeneratedId;
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
use crate::services::service_executor::{ResolvingServiceExecutor, ServiceExecutor};
use crate::services::sys::{SaltService, SessionService};
use crate::services::ExtraServiceParams;
use crate::type_model_provider::{init_type_model_provider, AppName, TypeModelProvider, TypeName};
#[cfg_attr(test, mockall_double::double)]
use crate::typed_entity_client::TypedEntityClient;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use rest_client::{RestClient, RestClientError};

pub mod crypto;
mod crypto_entity_client;
pub mod custom_id;
pub mod date;
mod element_value;
pub mod entities;
mod entity_client;
pub mod generated_id;
mod instance_mapper;
mod json_element;
mod json_serializer;
mod key_cache;
mod key_loader_facade;
mod logging;
pub mod login;
mod mail_facade;
mod metamodel;

#[cfg(feature = "net")]
pub mod net;
pub mod rest_client;
mod rest_error;
pub mod services;
mod simple_crypto;
pub mod tutanota_constants;
mod type_model_provider;
mod typed_entity_client;
mod user_facade;
mod util;

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
	// In the future we might need to make this one optional to support "not authenticated" state
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
	pub fn new(base_url: String, rest_client: Arc<dyn RestClient>) -> Sdk {
		logging::init_logger();
		log::debug!("Initializing SDK...");

		let type_model_provider = Arc::new(init_type_model_provider());
		// TODO validate parameters
		let instance_mapper = Arc::new(InstanceMapper::new());
		let json_serializer = Arc::new(JsonSerializer::new(type_model_provider.clone()));

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
		let crypto_facade = Arc::new(CryptoFacade::new(
			key_loader.clone(),
			self.instance_mapper.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
		));
		let entity_facade = Arc::new(EntityFacadeImpl::new(
			self.type_model_provider.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
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

		Ok(Arc::new(LoggedInSdk {
			user_facade,
			entity_client,
			service_executor,
			typed_entity_client,
			crypto_entity_client,
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

#[allow(dead_code)]
#[derive(uniffi::Object)]
pub struct LoggedInSdk {
	user_facade: Arc<UserFacade>,
	entity_client: Arc<EntityClient>,
	service_executor: Arc<ResolvingServiceExecutor>,
	typed_entity_client: Arc<TypedEntityClient>,
	crypto_entity_client: Arc<CryptoEntityClient>,
}

#[uniffi::export]
impl LoggedInSdk {
	/// Generates a new interface to operate on mail entities
	#[must_use]
	pub fn mail_facade(&self) -> MailFacade {
		MailFacade::new(self.crypto_entity_client.clone())
	}
}

#[derive(uniffi::Enum, Debug, PartialEq)]
pub enum ListLoadDirection {
	ASC,
	/// Reverse order
	DESC,
}

/// A set of keys used to identify an element within a List Element Type
#[derive(uniffi::Record, Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct IdTuple {
	pub list_id: GeneratedId,
	pub element_id: GeneratedId,
}

impl IdTuple {
	#[must_use]
	pub fn new(list_id: GeneratedId, element_id: GeneratedId) -> Self {
		Self {
			list_id,
			element_id,
		}
	}
}

impl IdType for IdTuple {}

impl Display for IdTuple {
	fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
		write!(f, "{}/{}", self.list_id, self.element_id)
	}
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
			ElementValue::IdTupleId(id) => e
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
	use crate::entities::tutanota::Mail;
	use crate::serialize_mail;
	use crate::util::test_utils::create_test_entity;

	#[test]
	fn test_serialize_mail_does_not_panic() {
		let mail = create_test_entity::<Mail>();
		let _ = serialize_mail(mail);
	}
}
