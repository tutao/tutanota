use crate::crypto::key::GenericAesKey;
use crate::services::hidden::Executor;
use crate::ApiCallError;
use std::collections::HashMap;

pub mod accounting;
pub mod base;
pub mod generator;
pub mod gossip;
pub mod monitor;
pub mod service_executor;
pub mod storage;
pub mod sys;
pub mod tutanota;
pub mod usage;

#[cfg(test)]
pub mod test_services;

/// The service trait is split into the base trait for the REST endpoint and the protocol version
/// plus four traits for the different methods, since each method has its own input and output types.
pub trait Service: 'static {
	const PATH: &'static str;
	const VERSION: u32;
}

#[async_trait::async_trait]
pub trait GetService: Service {
	type Input;
	type Output;

	#[allow(non_snake_case)]
	async fn GET(
		x: &impl Executor,
		data: Self::Input,
		params: ExtraServiceParams,
	) -> Result<Self::Output, ApiCallError>;
}

#[async_trait::async_trait]
pub trait PostService: Service {
	type Input;
	type Output;

	#[allow(non_snake_case)]
	async fn POST(
		x: &impl Executor,
		data: Self::Input,
		params: ExtraServiceParams,
	) -> Result<Self::Output, ApiCallError>;
}

#[async_trait::async_trait]
pub trait PutService: Service {
	type Input;
	type Output;

	#[allow(non_snake_case)]
	async fn PUT(
		x: &impl Executor,
		data: Self::Input,
		params: ExtraServiceParams,
	) -> Result<Self::Output, ApiCallError>;
}

#[async_trait::async_trait]
pub trait DeleteService: Service {
	type Input;
	type Output;

	#[allow(non_snake_case)]
	async fn DELETE(
		x: &impl Executor,
		data: Self::Input,
		params: ExtraServiceParams,
	) -> Result<Self::Output, ApiCallError>;
}

pub enum SuspensionBehavior {
	Suspend,
	Throw,
}

#[derive(Default)]
pub struct ExtraServiceParams {
	pub query_params: Option<HashMap<String, String>>,
	pub session_key: Option<GenericAesKey>,
	pub extra_headers: Option<HashMap<String, String>>,
	pub suspension_behavior: Option<SuspensionBehavior>,
	/** override origin for the request */
	pub base_url: Option<String>,
}

mod hidden {
	use crate::entities::Entity;
	use crate::rest_client::HttpMethod;
	use crate::services::{ExtraServiceParams, Service};
	use crate::{ApiCallError, TypeRef};
	use serde::{Deserialize, Serialize, Serializer};

	/// Type that allows us to call the executor even
	/// if the service doesn't have an input or output.
	/// it is unimportable outside of the services module and uninstantiable because the enum
	/// has no variants.
	/// using this construct prevents anyone outside the services module from trying to obtain
	/// the type model of this entity type or to return it from a service call.
	///
	/// also thought about just providing impl Entity for () but then we'd have problems with people
	/// trying to use that impl by accident and Entity::type_ref returning an Option.
	/// also we'd still need a way to actually construct the output when we notice that there's
	/// nothing to serialize, and just deciding that Service::Output and () are the same thing
	/// doesn't work.
	pub enum Nothing {}
	impl Entity for Nothing {
		fn type_ref() -> TypeRef {
			unreachable!()
		}
	}

	impl Serialize for Nothing {
		fn serialize<S>(&self, _serializer: S) -> Result<S::Ok, S::Error>
		where
			S: Serializer,
		{
			unreachable!()
		}
	}

	#[async_trait::async_trait]
	pub trait Executor: Sync + Send {
		async fn do_request<S, I>(
			&self,
			data: Option<I>,
			method: HttpMethod,
			extra_service_params: ExtraServiceParams,
		) -> Result<Option<Vec<u8>>, ApiCallError>
		where
			S: Service,
			I: Entity + Serialize + Send;

		async fn handle_response<O>(&self, body: Option<Vec<u8>>) -> Result<O, ApiCallError>
		where
			O: Entity + Deserialize<'static>;
	}
}
