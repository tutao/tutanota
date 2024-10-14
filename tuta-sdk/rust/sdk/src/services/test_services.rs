use crate::date::DateTime;
use crate::entities::{Entity, FinalIv};
use crate::metamodel::TypeModel;
use crate::type_model_provider::{AppName, TypeName};
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
			"answer": {
				"final": false,
				"name": "answer",
				"id": 459,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"timestamp": {
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
pub const HELLO_INPUT_ENCRYPTED: &str = r#"{
		"name": "HelloEncInput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 358,
		"rootId": "RDR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": true,
		"values": {
			"message": {
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

pub const HELLO_OUTPUT_UNENCRYPTED: &str = r#"{
		"name": "HelloUnEncOutput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 458,
		"rootId": "CHR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": false,
		"values": {
			"answer": {
				"final": false,
				"name": "answer",
				"id": 159,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"timestamp": {
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
pub const HELLO_INPUT_UNENCRYPTED: &str = r#"{
		"name": "HelloUnEncInput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 148,
		"rootId": "RDR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": false,
		"values": {
			"message": {
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

pub fn extend_model_resolver(model_resolver: &mut HashMap<AppName, HashMap<TypeName, TypeModel>>) {
	assert!(model_resolver.get("test").is_none());

	let enc_input_type_model = serde_json::from_str::<TypeModel>(HELLO_INPUT_ENCRYPTED).unwrap();
	let enc_output_type_model = serde_json::from_str::<TypeModel>(HELLO_OUTPUT_ENCRYPTED).unwrap();
	let unenc_input_type_model =
		serde_json::from_str::<TypeModel>(HELLO_INPUT_UNENCRYPTED).unwrap();
	let unenc_output_type_model =
		serde_json::from_str::<TypeModel>(HELLO_OUTPUT_UNENCRYPTED).unwrap();

	let test_types = [
		("HelloEncInput", enc_input_type_model),
		("HelloEncOutput", enc_output_type_model),
		("HelloUnEncInput", unenc_input_type_model),
		("HelloUnEncOutput", unenc_output_type_model),
	]
	.into_iter()
	.collect();
	model_resolver.insert("test", test_types);
}

pub struct HelloEncryptedService;
pub struct HelloUnEncryptedService;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloEncInput {
	pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloEncOutput {
	pub answer: String,
	pub timestamp: DateTime,
	#[allow(non_snake_case)]
	pub _finalIvs: HashMap<String, FinalIv>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloUnEncInput {
	pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloUnEncOutput {
	pub answer: String,
	pub timestamp: DateTime,
}

impl Entity for HelloEncInput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_: "HelloEncInput",
		}
	}
}

impl Entity for HelloEncOutput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_: "HelloEncOutput",
		}
	}
}

impl Entity for HelloUnEncInput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_: "HelloUnEncInput",
		}
	}
}

impl Entity for HelloUnEncOutput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "test",
			type_: "HelloUnEncOutput",
		}
	}
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
