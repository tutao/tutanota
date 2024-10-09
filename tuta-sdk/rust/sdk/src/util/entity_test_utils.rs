use crate::crypto::aes::Iv;
use crate::crypto::key::GenericAesKey;
use crate::date::DateTime;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::tutanota::{Mail, MailAddress};
use crate::entities::Entity;
use crate::generated_id::GeneratedId;
use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
use crate::util::test_utils::{create_test_entity, typed_entity_to_parsed_entity};
use crate::{IdTuple, TypeRef};

/// Generates and returns an encrypted Mail ParsedEntity. It also returns the decrypted Mail for comparison
pub fn generate_email_entity(
	session_key: &GenericAesKey,
	iv: &Iv,
	confidential: bool,
	subject: String,
	sender_name: String,
	recipient_name: String,
) -> (ParsedEntity, ParsedEntity) {
	let original_mail = Mail {
		_id: IdTuple {
			list_id: GeneratedId("O1RT1m6-0R-0".to_string()),
			element_id: GeneratedId("O1RT2Dj----0".to_string()),
		},
		receivedDate: DateTime::from_millis(1470039025474),
		confidential,
		subject,
		firstRecipient: Some(MailAddress {
			address: "support@yahoo.com".to_owned(),
			name: recipient_name,
			..create_test_entity()
		}),
		sender: MailAddress {
			address: "hello@tutao.de".to_owned(),
			name: sender_name,
			..create_test_entity()
		},
		..create_test_entity()
	};

	let encrypted_mail = typed_entity_to_encrypted_entity(original_mail.clone(), session_key, iv);
	let original_mail = typed_entity_to_parsed_entity(original_mail);

	(encrypted_mail, original_mail)
}

/// Convert a typed entity into an encrypted `ParsedEntity` dictionary type.
///
/// # Panics
///
/// Panics if the resulting entity is invalid and unable to be serialized.
#[must_use]
fn typed_entity_to_encrypted_entity<T: Entity + serde::Serialize>(
	entity: T,
	session_key: &GenericAesKey,
	iv: &Iv,
) -> ParsedEntity {
	let provider = init_type_model_provider();
	let mut parsed = typed_entity_to_parsed_entity(entity);
	let TypeRef { app, type_ } = T::type_ref();
	encrypt_test_entity_dict_with_provider(&mut parsed, &provider, app, type_, session_key, iv);
	parsed
}

fn encrypt_test_entity_dict_with_provider(
	entity: &mut ParsedEntity,
	provider: &TypeModelProvider,
	app: &str,
	type_: &str,
	session_key: &GenericAesKey,
	iv: &Iv,
) {
	let Some(model) = provider.get_type_model(app, type_) else {
		panic!("Failed to create test entity {app}/{type_}: not in model")
	};

	for (&name, value) in &model.values {
		if !value.encrypted {
			continue;
		}
		let Some(data) = entity.get_mut(name) else {
			continue;
		};
		let encrypt_element_value = |value_to_encrypt: &mut ElementValue| match value_to_encrypt {
			ElementValue::Bytes(b) => {
				*b = session_key
					.encrypt_data(b, iv.to_owned())
					.expect("failed to encrypt bytes");
			},
			ElementValue::Bool(b) => {
				*value_to_encrypt = ElementValue::Bytes(
					session_key
						.encrypt_data(if *b { b"1" } else { b"0" }, iv.clone())
						.expect("failed to encrypt bool"),
				)
			},
			ElementValue::Number(n) => {
				*value_to_encrypt = ElementValue::Bytes(
					session_key
						.encrypt_data(n.to_string().as_bytes(), iv.clone())
						.expect("failed to encrypt bool"),
				)
			},
			ElementValue::String(s) => {
				*value_to_encrypt = ElementValue::Bytes(
					session_key
						.encrypt_data(s.as_bytes(), iv.clone())
						.expect("failed to encrypt bool"),
				)
			},
			_ => unimplemented!(
				"can't encrypt {app}/{type_}.{name} => {:?}/{}",
				value.value_type,
				value_to_encrypt.type_variant_name()
			),
		};
		match data {
			ElementValue::Null => {},
			ElementValue::Array(arr) => {
				for i in arr {
					encrypt_element_value(i);
				}
			},
			n => encrypt_element_value(n),
		}
	}

	for (&name, association) in &model.associations {
		let Some(data) = entity.get_mut(name) else {
			continue;
		};
		match data {
			ElementValue::Null => {},
			ElementValue::Dict(d) => {
				encrypt_test_entity_dict_with_provider(
					d,
					provider,
					association.dependency.unwrap_or(app),
					association.ref_type,
					session_key,
					iv,
				);
			},
			ElementValue::Array(a) => {
				for i in a {
					let ElementValue::Dict(d) = i else {
						break;
					};
					encrypt_test_entity_dict_with_provider(
						d,
						provider,
						association.dependency.unwrap_or(app),
						association.ref_type,
						session_key,
						iv,
					);
				}
			},
			_ => (),
		}
	}
}
