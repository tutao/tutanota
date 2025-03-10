use crate::date::DateTime;
use crate::entities::{Entity, FinalIv};
use crate::metamodel::TypeModel;
use crate::type_model_provider::TypeModelProvider;
use crate::{service_impl, TypeRef};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const APP_NAME: &str = "test";
pub const APP_VERSION_NUMBER: u32 = 75;
pub const APP_VERSION_STR: &str = "75";

pub const HELLO_OUTPUT_ENCRYPTED: &str = r#"{
		"name": "HelloEncOutput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 458,
		"rootId": "CHR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": true,
		"values": {
			"459": {
				"final": false,
				"name": "answer",
				"id": 459,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"460": {
				"final": false,
				"name": "timestamp",
				"id": 460,
				"since": 7,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {},
		"app": "test",
		"version": "75"
	}"#;
impl Entity for HelloEncOutput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_id: 458,
		}
	}
}
pub const HELLO_INPUT_ENCRYPTED: &str = r#"{
		"name": "HelloEncInput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 358,
		"rootId": "RDR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": true,
		"values": {
			"359": {
				"final": false,
				"name": "message",
				"id": 359,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {},
		"app": "test",
		"version": "75"
	}"#;
impl Entity for HelloEncInput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_id: 358,
		}
	}
}

pub const HELLO_OUTPUT_UNENCRYPTED: &str = r#"{
		"name": "HelloUnEncOutput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 248,
		"rootId": "CHR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": false,
		"values": {
			"159": {
				"final": false,
				"name": "answer",
				"id": 159,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"160": {
				"final": false,
				"name": "timestamp",
				"id": 160,
				"since": 7,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "test",
		"version": "75"
	}"#;

impl Entity for HelloUnEncOutput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_id: 248,
		}
	}
}
pub const HELLO_INPUT_UNENCRYPTED: &str = r#"{
		"name": "HelloUnEncInput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 148,
		"rootId": "RDR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": false,
		"values": {
			"149": {
				"final": false,
				"name": "message",
				"id": 149,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "test",
		"version": "75"
	}"#;

impl Entity for HelloUnEncInput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_id: 148,
		}
	}
}

#[must_use]
pub fn extend_model_resolver(type_model_provider: &mut TypeModelProvider) -> bool {
	let enc_input_type_model = serde_json::from_str::<TypeModel>(HELLO_INPUT_ENCRYPTED).unwrap();
	let enc_output_type_model = serde_json::from_str::<TypeModel>(HELLO_OUTPUT_ENCRYPTED).unwrap();
	let unenc_input_type_model =
		serde_json::from_str::<TypeModel>(HELLO_INPUT_UNENCRYPTED).unwrap();
	let unenc_output_type_model =
		serde_json::from_str::<TypeModel>(HELLO_OUTPUT_UNENCRYPTED).unwrap();

	let test_types = [
		(HelloEncInput::type_ref().type_id, enc_input_type_model),
		(HelloEncOutput::type_ref().type_id, enc_output_type_model),
		(HelloUnEncInput::type_ref().type_id, unenc_input_type_model),
		(
			HelloUnEncOutput::type_ref().type_id,
			unenc_output_type_model,
		),
	]
	.into_iter()
	.collect();

	unsafe {
		let app_models_mut = std::ptr::from_ref(type_model_provider.app_models)
			.cast_mut()
			.as_mut()
			.expect("Should be Not null");

		app_models_mut.insert("test", test_types).is_some()
	}
}

pub struct HelloEncryptedService;
pub struct HelloUnEncryptedService;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloEncInput {
	#[serde(rename = "359")]
	pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[allow(non_snake_case)]
pub struct HelloEncOutput {
	#[serde(rename = "459")]
	pub answer: String,
	#[serde(rename = "460")]
	pub timestamp: DateTime,
	pub _finalIvs: HashMap<String, FinalIv>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloUnEncInput {
	#[serde(rename = "149")]
	pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloUnEncOutput {
	#[serde(rename = "159")]
	pub answer: String,
	#[serde(rename = "160")]
	pub timestamp: DateTime,
}

service_impl!(
	declare,
	HelloEncryptedService,
	"test/encrypted-hello",
	APP_VERSION_NUMBER
);
service_impl!(POST, HelloEncryptedService, HelloEncInput, HelloEncOutput);
service_impl!(PUT, HelloEncryptedService, HelloEncInput, HelloEncOutput);
service_impl!(GET, HelloEncryptedService, HelloEncInput, HelloEncOutput);
service_impl!(DELETE, HelloEncryptedService, HelloEncInput, HelloEncOutput);

service_impl!(
	declare,
	HelloUnEncryptedService,
	"test/unencrypted-hello",
	APP_VERSION_NUMBER
);
service_impl!(
	POST,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
service_impl!(
	PUT,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
service_impl!(
	GET,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
service_impl!(
	DELETE,
	HelloUnEncryptedService,
	HelloUnEncInput,
	HelloUnEncOutput
);
