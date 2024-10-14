use crate::crypto::crypto_facade::ResolvedSessionKey;
use crate::crypto::key::GenericAesKey;
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::{aes::Iv, PlaintextAndIv};
use crate::date::DateTime;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::Errors;
use crate::metamodel::{
	AssociationType, Cardinality, ElementType, ModelAssociation, ModelValue, TypeModel, ValueType,
};
use crate::type_model_provider::TypeModelProvider;
use crate::util::array_cast_slice;
use crate::ApiCallError;
use base64::prelude::{BASE64_STANDARD, BASE64_URL_SAFE_NO_PAD};
use base64::Engine;
use minicbor::Encode;
use std::borrow::Borrow;
use std::collections::HashMap;
use std::sync::Arc;

/// Provides high level functions to handle encryption/decryption of entities
#[derive(uniffi::Object)]
pub struct EntityFacadeImpl {
	type_model_provider: Arc<TypeModelProvider>,
	randomizer_facade: RandomizerFacade,
}

/// Value after it has been processed
struct MappedValue {
	/// The actual decrypted value that will be written to the field
	value: ElementValue,
	/// IV that was used for encryption or empty value if the field was default-encrypted (empty)
	iv: Option<Vec<u8>>,
	/// Expected encryption errors
	error: Option<String>,
}

#[cfg_attr(test, mockall::automock)]
pub trait EntityFacade: Send + Sync {
	fn decrypt_and_map(
		&self,
		type_model: &TypeModel,
		entity: ParsedEntity,
		resolved_session_key: ResolvedSessionKey,
	) -> Result<ParsedEntity, ApiCallError>;

	fn encrypt_and_map(
		&self,
		type_model: &TypeModel,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError>;
}

impl EntityFacadeImpl {
	#[must_use]
	pub fn new(
		type_model_provider: Arc<TypeModelProvider>,
		randomizer_facade: RandomizerFacade,
	) -> Self {
		EntityFacadeImpl {
			type_model_provider,
			randomizer_facade,
		}
	}

	fn should_restore_default_value(
		model_value: &ModelValue,
		value: &ElementValue,
		instance: &ParsedEntity,
		key: &str,
	) -> bool {
		if model_value.encrypted {
			if let Some(final_ivs) = Self::get_final_iv_for_key(instance, key) {
				return final_ivs.assert_bytes().is_empty()
					&& value == &ValueType::get_default(&model_value.value_type);
			}
		}
		false
	}

	fn encrypt_value(
		model_value: &ModelValue,
		instance_value: &ElementValue,
		session_key: &GenericAesKey,
		iv: Iv,
	) -> Result<ElementValue, ApiCallError> {
		let value_type = &model_value.value_type;

		if !model_value.encrypted
			|| (<ElementValue as Encode<()>>::is_nil(instance_value)
				&& model_value.cardinality == Cardinality::ZeroOrOne)
		{
			Ok(instance_value.clone())
		} else {
			let bytes = Self::map_value_to_binary(value_type, instance_value)
				.unwrap_or_else(|| panic!("invalid encrypted value {:?}", instance_value));
			let encrypted_data = session_key
				.encrypt_data(bytes.as_slice(), iv)
				.expect("Cannot encrypt data");
			Ok(ElementValue::Bytes(encrypted_data))
		}
	}

	fn get_final_iv_for_key(instance: &ParsedEntity, key: &str) -> Option<ElementValue> {
		if let Some(final_ivs) = instance.get("_finalIvs") {
			if let Some(array) = final_ivs.assert_dict_ref().get(key) {
				return Some(ElementValue::Bytes(array.assert_bytes()));
			};
		};
		None
	}

	fn map_value_to_binary(value_type: &ValueType, value: &ElementValue) -> Option<Vec<u8>> {
		if <ElementValue as Encode<()>>::is_nil(value) {
			return None;
		}
		match value_type {
			ValueType::Bytes => Some(value.assert_bytes()),
			ValueType::String => Some(value.assert_string().as_bytes().to_vec()),
			ValueType::Number => Some(value.assert_number().to_string().as_bytes().to_vec()),
			ValueType::Date => Some(
				value
					.assert_date()
					.as_millis()
					.to_string()
					.as_bytes()
					.to_vec(),
			),
			ValueType::Boolean => Some(if value.assert_bool() { b"1" } else { b"0" }.to_vec()),
			ValueType::GeneratedId => Some(value.assert_generated_id().0.as_bytes().to_vec()),
			ValueType::CustomId => Some(value.assert_custom_id().0.as_bytes().to_vec()),
			ValueType::CompressedString => unimplemented!("compressed string"),
		}
	}

	fn encrypt_and_map_inner(
		&self,
		type_model: &TypeModel,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError> {
		let mut encrypted = ParsedEntity::new();

		for (key, model_value) in &type_model.values {
			let instance_value = instance.get(&key.to_string()).ok_or_else(|| {
				ApiCallError::internal(format!("Can not find key: {key} in instance: {instance:?}"))
			})?;

			let encrypted_value: ElementValue;

			if Self::should_restore_default_value(model_value, instance_value, instance, key) {
				// restore the default encrypted value because it has not changed
				// note: this branch must be checked *before* the one which reuses IVs as this one checks
				// the length.
				encrypted_value = ElementValue::String("".to_string());
			} else if model_value.encrypted
				&& model_value.is_final
				&& Self::get_final_iv_for_key(instance, key).is_some()
			{
				let final_iv = Iv::from_bytes(
					Self::get_final_iv_for_key(instance, key)
						.unwrap()
						.assert_bytes()
						.as_slice(),
				)
				.map_err(|err| ApiCallError::internal(format!("iv of illegal size {:?}", err)))?;

				encrypted_value = Self::encrypt_value(model_value, instance_value, sk, final_iv)?
			} else {
				encrypted_value = Self::encrypt_value(
					model_value,
					instance_value,
					sk,
					Iv::generate(&self.randomizer_facade),
				)?
			}
			encrypted.insert(key.to_string(), encrypted_value);
		}

		if type_model.element_type == ElementType::Aggregated && !encrypted.contains_key("_id") {
			let new_id = self.randomizer_facade.generate_random_array::<4>();

			encrypted.insert(
				String::from("_id"),
				ElementValue::String(BASE64_URL_SAFE_NO_PAD.encode(BASE64_STANDARD.encode(new_id))),
			);
		}

		for (association_name, association) in &type_model.associations {
			let encrypted_association = match association.association_type {
				AssociationType::Aggregation => {
					self.encrypt_aggregate(type_model, association_name, association, instance, sk)?
				},
				AssociationType::ElementAssociation
				| AssociationType::ListAssociation
				| AssociationType::ListElementAssociation
				| AssociationType::BlobElementAssociation => instance
					.get(&association_name.to_string())
					.cloned()
					.ok_or(ApiCallError::internal(format!(
						"could not find association {association_name} on type {}",
						type_model.name
					)))?,
			};
			encrypted.insert(association_name.to_string(), encrypted_association);
		}

		Ok(encrypted)
	}

	fn encrypt_aggregate(
		&self,
		type_model: &TypeModel,
		association_name: &str,
		association: &ModelAssociation,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ElementValue, ApiCallError> {
		let dependency = association.dependency.unwrap_or(type_model.app);
		let aggregated_type_model = self
			.type_model_provider
			.get_type_model(dependency, association.ref_type)
			.ok_or_else(|| {
				ApiCallError::internal(format!(
					"unknown type model: {:?}",
					(dependency, association.ref_type)
				))
			})?;
		let instance_association = instance.get(&association_name.to_string()).unwrap();

		match (&association.cardinality, instance_association) {
			(Cardinality::ZeroOrOne, ElementValue::Null) => Ok(ElementValue::Null),

			(_, ElementValue::Null) => Err(ApiCallError::internal(format!(
				"Undefined attribute {}:{association_name}",
				type_model.name
			))),

			(Cardinality::Any, _) => {
				let aggregates = instance_association.assert_array();
				let mut encrypted_aggregates = Vec::with_capacity(aggregates.len());
				for aggregate in &aggregates {
					let parsed_entity = self.encrypt_and_map_inner(
						aggregated_type_model,
						&aggregate.assert_dict(),
						sk,
					)?;
					encrypted_aggregates.push(ElementValue::Dict(parsed_entity));
				}

				Ok(ElementValue::Array(encrypted_aggregates))
			},

			(Cardinality::One | Cardinality::ZeroOrOne, _) => {
				let parsed_entity = self.encrypt_and_map_inner(
					aggregated_type_model,
					&instance_association.assert_dict(),
					sk,
				)?;
				Ok(ElementValue::Dict(parsed_entity))
			},
		}
	}

	fn decrypt_and_map_inner(
		&self,
		type_model: &TypeModel,
		mut entity: ParsedEntity,
		session_key: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError> {
		let mut mapped_decrypted: HashMap<String, ElementValue> = Default::default();
		let mut mapped_errors: Errors = Default::default();
		let mut mapped_ivs: HashMap<String, ElementValue> = Default::default();

		for (&key, model_value) in &type_model.values {
			let stored_element = entity.remove(key).unwrap_or(ElementValue::Null);
			let MappedValue { value, iv, error } =
				self.map_value(stored_element, session_key, key, model_value)?;

			mapped_decrypted.insert(key.to_string(), value);
			if let Some(error) = error {
				mapped_errors.insert(key.to_string(), ElementValue::String(error));
			}
			if let Some(iv) = iv {
				mapped_ivs.insert(key.to_string(), ElementValue::Bytes(iv.clone()));
			}
		}

		for (&association_name, association_model) in &type_model.associations {
			let association_entry = entity
				.remove(association_name)
				.unwrap_or(ElementValue::Null);
			let (mapped_association, errors) = self.map_associations(
				type_model,
				association_entry,
				session_key,
				association_name,
				association_model,
			)?;

			mapped_decrypted.insert(association_name.to_string(), mapped_association);
			if !errors.is_empty() {
				mapped_errors.insert(association_name.to_string(), ElementValue::Dict(errors));
			}
		}

		if type_model.is_encrypted() {
			// Only top-level types are expected to have `_errors` in the end but it is removed
			// from the aggregates by `extract_errors()`.
			mapped_decrypted.insert("_errors".to_string(), ElementValue::Dict(mapped_errors));
			mapped_decrypted.insert("_finalIvs".to_string(), ElementValue::Dict(mapped_ivs));
		}

		Ok(mapped_decrypted)
	}

	fn map_associations(
		&self,
		type_model: &TypeModel,
		association_data: ElementValue,
		session_key: &GenericAesKey,
		association_name: &str,
		association_model: &ModelAssociation,
	) -> Result<(ElementValue, Errors), ApiCallError> {
		let mut errors: Errors = Default::default();
		let dependency = match association_model.dependency {
			Some(dep) => dep,
			None => type_model.app,
		};

		let Some(aggregate_type_model) = self
			.type_model_provider
			.get_type_model(dependency, association_model.ref_type)
		else {
			panic!("Undefined type_model {}", association_model.ref_type)
		};

		if let AssociationType::Aggregation = association_model.association_type {
			match (association_data, association_model.cardinality.borrow()) {
				(ElementValue::Null, Cardinality::ZeroOrOne) => Ok((ElementValue::Null, errors)),
				(ElementValue::Null, Cardinality::One) => Err(ApiCallError::InternalSdkError {
					error_message: format!(
						"Value {association_name} with cardinality ONE can't be null"
					),
				}),
				(ElementValue::Array(arr), Cardinality::Any) => {
					let mut aggregate_vec: Vec<ElementValue> = Vec::with_capacity(arr.len());
					for (index, aggregate) in arr.into_iter().enumerate() {
						match aggregate {
							ElementValue::Dict(entity) => {
								let mut decrypted_aggregate = self.decrypt_and_map_inner(
									aggregate_type_model,
									entity,
									session_key,
								)?;

								// Errors should be grouped inside the top-most object, so they should be
								// extracted and removed from aggregates
								if decrypted_aggregate.contains_key("_errors") {
									let error_key = &format!("{}_{}", association_name, index);
									self.extract_errors(
										error_key,
										&mut errors,
										&mut decrypted_aggregate,
									);
								}

								aggregate_vec.push(ElementValue::Dict(decrypted_aggregate));
							},
							_ => {
								return Err(ApiCallError::InternalSdkError {
									error_message: format!(
										"Invalid aggregate format. {} isn't a dict",
										association_name
									),
								})
							},
						}
					}

					Ok((ElementValue::Array(aggregate_vec), errors))
				},
				(ElementValue::Dict(dict), Cardinality::One | Cardinality::ZeroOrOne) => {
					let decrypted_aggregate =
						self.decrypt_and_map_inner(aggregate_type_model, dict, session_key);
					match decrypted_aggregate {
						Ok(mut dec_aggregate) => {
							self.extract_errors(association_name, &mut errors, &mut dec_aggregate);
							Ok((ElementValue::Dict(dec_aggregate), errors))
						},
						Err(_) => Err(ApiCallError::InternalSdkError {
							error_message: format!(
								"Failed to decrypt association {association_name}"
							),
						}),
					}
				},
				_ => Err(ApiCallError::InternalSdkError {
					error_message: format!("Invalid association {association_name}"),
				}),
			}
		} else {
			Ok((association_data, errors))
		}
	}
	fn extract_errors(
		&self,
		association_name: &str,
		errors: &mut Errors,
		dec_aggregate: &mut ParsedEntity,
	) {
		if let Some(ElementValue::Dict(err_dict)) = dec_aggregate.remove("_errors") {
			if !err_dict.is_empty() {
				errors.insert(association_name.to_string(), ElementValue::Dict(err_dict));
			}
		}
	}
	fn map_value(
		&self,
		value: ElementValue,
		session_key: &GenericAesKey,
		key: &str,
		model_value: &ModelValue,
	) -> Result<MappedValue, ApiCallError> {
		match (&model_value.cardinality, &model_value.encrypted, value) {
			(Cardinality::One | Cardinality::ZeroOrOne, true, ElementValue::String(s))
				if s.is_empty() =>
			{
				// If the value is default-encrypted (empty string) then return default value and
				// empty IV. When re-encrypting we should put the empty value back to not increase
				// used storage.
				let value = model_value.value_type.get_default();
				Ok(MappedValue {
					value,
					iv: Some(Vec::new()),
					error: None,
				})
			},
			(Cardinality::ZeroOrOne, _, ElementValue::Null) => {
				// If it's null, and it's permissible then we keep it as such
				Ok(MappedValue {
					value: ElementValue::Null,
					iv: None,
					error: None,
				})
			},
			(Cardinality::One | Cardinality::ZeroOrOne, true, ElementValue::Bytes(bytes)) => {
				// If it's a proper encrypted value then we need to decrypt it, parse it and
				// possibly record the IV.
				let PlaintextAndIv {
					data: plaintext,
					iv,
				} = session_key
					.decrypt_data_and_iv(bytes.as_slice())
					.map_err(|e| ApiCallError::InternalSdkError {
						error_message: e.to_string(),
					})?;

				match self.parse_decrypted_value(model_value.value_type.clone(), plaintext) {
					Ok(value) => {
						// We want to ensure we use the same IV for final encrypted values, as this
						// will guarantee we get the same value back when we encrypt it.
						let iv = if model_value.is_final {
							Some(iv.to_vec())
						} else {
							None
						};
						Ok(MappedValue {
							value,
							iv,
							error: None,
						})
					},
					Err(err) => Ok(MappedValue {
						value: model_value.value_type.get_default(),
						iv: None,
						error: Some(format!("Failed to decrypt {key}. {err}")),
					}),
				}
			},
			(Cardinality::One | Cardinality::ZeroOrOne, false, value) => Ok(MappedValue {
				value,
				iv: None,
				error: None,
			}),
			_ => Err(ApiCallError::internal(format!(
				"Invalid value/cardinality combination for key `{key}`"
			))),
		}
	}
	fn parse_decrypted_value(
		&self,
		value_type: ValueType,
		bytes: Vec<u8>,
	) -> Result<ElementValue, ApiCallError> {
		match value_type {
			ValueType::String => {
				let string = String::from_utf8(bytes)
					.map_err(|e| ApiCallError::internal_with_err(e, "Invalid string"))?;
				Ok(ElementValue::String(string))
			},
			ValueType::Number => {
				if bytes.is_empty() {
					Ok(ElementValue::Null)
				} else {
					// Encrypted numbers are encrypted strings.
					let string = String::from_utf8(bytes)
						.map_err(|e| ApiCallError::internal_with_err(e, "Invalid string"))?;
					let number = string
						.parse()
						.map_err(|e| ApiCallError::internal_with_err(e, "Invalid number"))?;

					Ok(ElementValue::Number(number))
				}
			},
			ValueType::Bytes => Ok(ElementValue::Bytes(bytes.clone())),
			ValueType::Date => {
				let bytes = array_cast_slice(bytes.as_slice(), "u64")
					.map_err(|e| ApiCallError::internal_with_err(e, "Invalid date bytes"))?;
				Ok(ElementValue::Date(DateTime::from_millis(
					u64::from_be_bytes(bytes),
				)))
			},
			ValueType::Boolean => {
				let value = match bytes.as_slice() {
					b"0" => false,
					b"1" => true,
					_ => {
						return Err(ApiCallError::InternalSdkError {
							error_message: "Failed to parse boolean bytes".to_owned(),
						})
					},
				};
				Ok(ElementValue::Bool(value))
			},
			ValueType::CompressedString => unimplemented!("compressed string"),
			v => unreachable!("Can't parse {v:?} into ElementValue"),
		}
	}
}

impl EntityFacade for EntityFacadeImpl {
	fn decrypt_and_map(
		&self,
		type_model: &TypeModel,
		entity: ParsedEntity,
		resolved_session_key: ResolvedSessionKey,
	) -> Result<ParsedEntity, ApiCallError> {
		let mut mapped_decrypted =
			self.decrypt_and_map_inner(type_model, entity, &resolved_session_key.session_key)?;
		mapped_decrypted.insert(
			"_ownerEncSessionKey".to_owned(),
			ElementValue::Bytes(resolved_session_key.owner_enc_session_key.clone()),
		);
		Ok(mapped_decrypted)
	}

	fn encrypt_and_map(
		&self,
		type_model: &TypeModel,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError> {
		self.encrypt_and_map_inner(type_model, instance, sk)
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::crypto_facade::ResolvedSessionKey;
	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::test_util::DeterministicRng;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::{aes::Iv, Aes256Key};
	use crate::date::DateTime;
	use crate::element_value::{ElementValue, ParsedEntity};
	use crate::entities::entity_facade::{EntityFacade, EntityFacadeImpl};
	use crate::entities::sys::CustomerAccountTerminationRequest;
	use crate::entities::tutanota::Mail;
	use crate::entities::Entity;
	use crate::instance_mapper::InstanceMapper;
	use crate::json_element::{JsonElement, RawEntity};
	use crate::json_serializer::JsonSerializer;
	use crate::metamodel::{Cardinality, ModelValue, ValueType};
	use crate::type_model_provider::init_type_model_provider;
	use crate::util::entity_test_utils::generate_email_entity;
	use crate::{collection, ApiCallError};
	use std::collections::{BTreeMap, HashMap};
	use std::sync::Arc;
	use std::time::SystemTime;

	const KNOWN_SK: [u8; 32] = [
		83, 168, 168, 203, 48, 91, 246, 102, 175, 252, 39, 110, 36, 141, 4, 216, 135, 201, 226,
		134, 182, 175, 15, 152, 117, 216, 81, 1, 120, 134, 116, 143,
	];

	#[test]
	fn test_decrypt_mail() {
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(KNOWN_SK.as_slice()).unwrap());
		let owner_enc_session_key = vec![0, 1, 2];
		let type_model_provider = Arc::new(init_type_model_provider());
		let raw_entity: RawEntity = make_json_entity();
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let encrypted_mail: ParsedEntity = json_serializer
			.parse(&Mail::type_ref(), raw_entity)
			.unwrap();

		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let type_ref = Mail::type_ref();
		let type_model = type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.unwrap();

		let decrypted_mail = entity_facade
			.decrypt_and_map(
				type_model,
				encrypted_mail,
				ResolvedSessionKey {
					session_key: sk,
					owner_enc_session_key,
				},
			)
			.unwrap();
		let instance_mapper = InstanceMapper::new();
		let mail: Mail = instance_mapper
			.parse_entity(decrypted_mail.clone())
			.unwrap();

		assert_eq!(
			&DateTime::from_millis(1720612041643),
			decrypted_mail.get("receivedDate").unwrap().assert_date()
		);
		assert!(decrypted_mail.get("confidential").unwrap().assert_bool());
		assert_eq!(
			"Html email features",
			decrypted_mail.get("subject").unwrap().assert_str()
		);
		assert_eq!(
			"Matthias",
			decrypted_mail
				.get("sender")
				.unwrap()
				.assert_dict()
				.get("name")
				.unwrap()
				.assert_str()
		);
		assert_eq!(
			"map-free@tutanota.de",
			decrypted_mail
				.get("sender")
				.unwrap()
				.assert_dict()
				.get("address")
				.unwrap()
				.assert_str()
		);
		assert!(decrypted_mail
			.get("attachments")
			.unwrap()
			.assert_array()
			.is_empty());
		assert_eq!(
			decrypted_mail
				.get("_finalIvs")
				.expect("has_final_ivs")
				.assert_dict()
				.get("subject")
				.expect("has_subject")
				.assert_bytes(),
			vec![
				0x54, 0x58, 0x02, 0x8b, 0x82, 0xca, 0xb8, 0xa2, 0xd2, 0x01, 0x94, 0xa5, 0x0f, 0x53,
				0x72, 0x06
			],
		);
		assert_eq!(
			decrypted_mail
				.get("sender")
				.expect("has sender")
				.assert_dict()
				.get("_finalIvs")
				.expect("has _finalIvs")
				.assert_dict()
				.len(),
			1,
		);
	}

	#[test]
	fn encrypt_value_string() {
		let model_value = create_model_value(ValueType::String, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let iv = Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng));
		let value = ElementValue::String("this is a string value".to_string());

		let encrypted_value =
			EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone());

		let expected = sk
			.encrypt_data(value.assert_string().as_bytes(), iv)
			.unwrap();

		assert_eq!(expected, encrypted_value.unwrap().assert_bytes())
	}

	#[test]
	fn encrypt_value_bool() {
		let model_value = create_model_value(ValueType::Boolean, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let iv = Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng));

		{
			let value = ElementValue::Bool(true);

			let encrypted_value =
				EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone());

			let expected = sk.clone().encrypt_data("1".as_bytes(), iv.clone()).unwrap();
			assert_eq!(expected, encrypted_value.unwrap().assert_bytes())
		}

		{
			let value = ElementValue::Bool(false);
			let encrypted_value =
				EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone());

			let expected = sk.clone().encrypt_data("0".as_bytes(), iv.clone()).unwrap();
			assert_eq!(expected, encrypted_value.unwrap().assert_bytes())
		}
	}

	#[test]
	fn encrypt_value_date() {
		let model_value = create_model_value(ValueType::Date, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let iv = Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng));
		let value = ElementValue::Date(DateTime::from_system_time(SystemTime::now()));

		let encrypted_value =
			EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone());

		let expected = sk
			.encrypt_data(value.assert_date().as_millis().to_string().as_bytes(), iv)
			.unwrap();

		assert_eq!(expected, encrypted_value.unwrap().assert_bytes());
	}

	#[test]
	fn encrypt_value_bytes() {
		let model_value = create_model_value(ValueType::Bytes, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let randomizer_facade = &RandomizerFacade::from_core(rand_core::OsRng);
		let iv = Iv::generate(randomizer_facade);
		let value = ElementValue::Bytes(randomizer_facade.generate_random_array::<5>().to_vec());

		let encrypted_value =
			EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone());

		let expected = sk
			.encrypt_data(value.assert_bytes().as_slice(), iv)
			.unwrap();

		assert_eq!(expected, encrypted_value.unwrap().assert_bytes());
	}

	#[test]
	fn encrypt_value_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();

		const ALL_VALUE_TYPES: &[ValueType] = &[
			ValueType::String,
			ValueType::Number,
			ValueType::Bytes,
			ValueType::Date,
			ValueType::Boolean,
			ValueType::GeneratedId,
			ValueType::CustomId,
			ValueType::CompressedString,
		];
		for value_type in ALL_VALUE_TYPES {
			assert_eq!(
				ElementValue::Null,
				EntityFacadeImpl::encrypt_value(
					&create_model_value(value_type.clone(), true, Cardinality::ZeroOrOne),
					&ElementValue::Null,
					&sk,
					Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
				)
				.unwrap()
			);
		}
	}

	#[test]
	#[should_panic = "invalid encrypted value Null"]
	fn encrypt_bytes_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		assert_eq!(
			Err(ApiCallError::internal(
				"Value test with cardinality ONE can not be null".to_string()
			)),
			EntityFacadeImpl::encrypt_value(
				&create_model_value(ValueType::Bytes, true, Cardinality::One),
				&ElementValue::Null,
				&sk,
				Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
			)
		);
	}

	#[test]
	#[should_panic = "invalid encrypted value Null"]
	fn encrypt_number_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		assert_eq!(
			Err(ApiCallError::internal(
				"Value test with cardinality ONE can not be null".to_string()
			)),
			EntityFacadeImpl::encrypt_value(
				&create_model_value(ValueType::Number, true, Cardinality::One),
				&ElementValue::Null,
				&sk,
				Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
			)
		);
	}

	#[test]
	#[should_panic = "invalid encrypted value Null"]
	fn encrypt_string_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		assert_eq!(
			Err(ApiCallError::internal(
				"Value test with cardinality ONE can not be null".to_string()
			)),
			EntityFacadeImpl::encrypt_value(
				&create_model_value(ValueType::String, true, Cardinality::One),
				&ElementValue::Null,
				&sk,
				Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
			)
		);
	}

	#[test]
	#[should_panic = "invalid encrypted value Null"]
	fn encrypt_date_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		assert_eq!(
			Err(ApiCallError::internal(
				"Value test with cardinality ONE can not be null".to_string()
			)),
			EntityFacadeImpl::encrypt_value(
				&create_model_value(ValueType::Date, true, Cardinality::One),
				&ElementValue::Null,
				&sk,
				Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
			)
		);
	}

	#[test]
	#[should_panic = "invalid encrypted value Null"]
	fn encrypt_compressed_string_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		assert_eq!(
			Err(ApiCallError::internal(
				"Value test with cardinality ONE can not be null".to_string()
			)),
			EntityFacadeImpl::encrypt_value(
				&create_model_value(ValueType::CompressedString, true, Cardinality::One),
				&ElementValue::Null,
				&sk,
				Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
			)
		);
	}

	#[test]
	#[should_panic = "invalid encrypted value Null"]
	fn encrypt_boolean_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		assert_eq!(
			Err(ApiCallError::internal(
				"Value test with cardinality ONE can not be null".to_string()
			)),
			EntityFacadeImpl::encrypt_value(
				&create_model_value(ValueType::Boolean, true, Cardinality::One),
				&ElementValue::Null,
				&sk,
				Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
			)
		);
	}

	#[test]
	fn encrypt_instance() {
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(KNOWN_SK.as_slice()).unwrap());
		let owner_enc_session_key = [0, 1, 2];

		let deterministic_rng = DeterministicRng(20);
		let iv = Iv::generate(&RandomizerFacade::from_core(deterministic_rng.clone()));
		let type_model_provider = Arc::new(init_type_model_provider());

		let type_ref = Mail::type_ref();
		let type_model = type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.unwrap();

		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(deterministic_rng),
		);

		let (mut expected_encrypted_mail, raw_mail) = generate_email_entity(
			&sk,
			&iv,
			true,
			String::from("Hello, world!"),
			String::from("Hanover"),
			String::from("Munich"),
		);

		// remove finalIvs for easy comparision
		{
			expected_encrypted_mail.remove("_finalIvs").unwrap();
			expected_encrypted_mail
				.get_mut("sender")
				.unwrap()
				.assert_dict_mut_ref()
				.remove("_finalIvs")
				.unwrap();
			expected_encrypted_mail
				.get_mut("firstRecipient")
				.unwrap()
				.assert_dict_mut_ref()
				.remove("_finalIvs")
				.unwrap();
		}

		let encrypted_mail = entity_facade.encrypt_and_map_inner(type_model, &raw_mail, &sk);

		assert_eq!(Ok(expected_encrypted_mail), encrypted_mail);

		// verify every data is preserved as is after decryption
		{
			let original_mail = raw_mail;
			let encrypted_mail = encrypted_mail.unwrap();
			let instance_mapper = InstanceMapper::new();

			let mut decrypted_mail = entity_facade
				.decrypt_and_map(
					type_model,
					encrypted_mail.clone(),
					ResolvedSessionKey {
						session_key: sk.clone(),
						owner_enc_session_key: owner_enc_session_key.to_vec(),
					},
				)
				.unwrap();

			// compare all the _finalIvs are initialised with expectedIV
			// for simplicity in comparison remove them as well( original_mail don't have _finalIvs )
			verify_final_ivs_and_clear(&iv, &mut decrypted_mail);

			assert_eq!(
				Some(&ElementValue::Bytes(owner_enc_session_key.to_vec())),
				decrypted_mail.get("_ownerEncSessionKey"),
			);
			decrypted_mail.insert("_ownerEncSessionKey".to_string(), ElementValue::Null);

			assert_eq!(
				Some(ElementValue::Dict(HashMap::new())),
				decrypted_mail.remove("_errors")
			);

			// comparison with sorted fields. only for easy for debugging
			assert_eq!(
				map_to_string(&original_mail),
				map_to_string(&decrypted_mail)
			);
			assert_eq!(original_mail, decrypted_mail);
		}
	}

	#[test]
	fn encrypt_unencrypted_to_db_literal() {
		let type_model_provider = Arc::new(init_type_model_provider());
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let type_ref = CustomerAccountTerminationRequest::type_ref();
		let type_model = type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.unwrap();
		let sk = GenericAesKey::from_bytes(rand::random::<[u8; 32]>().as_slice()).unwrap();

		let dummy_date = DateTime::from_system_time(SystemTime::now());
		let instance: RawEntity = collection! {
				"_format" => JsonElement::String("0".to_string()),
				"_id" => JsonElement::Array(vec![JsonElement::String("O1RT2Dj--3-0".to_string()); 2]),
				"_ownerGroup" => JsonElement::Null,
				"_permissions" => JsonElement::String("O2TT2Aj--2-1".to_string()),
				"terminationDate" => JsonElement::String(dummy_date.as_millis().to_string()),
				"terminationRequestDate" => JsonElement::String(dummy_date.as_millis().to_string()),
				"customer" => JsonElement::String("customId".to_string()),
		};
		let instance = json_serializer.parse(&type_ref, instance).unwrap();

		let encrypted_instance = entity_facade.encrypt_and_map(type_model, &instance, &sk);

		// unencrypted value should be kept as-is
		assert_eq!(Ok(instance), encrypted_instance);
	}

	#[test]
	fn encryption_final_ivs_will_be_reused() {
		let type_model_provider = Arc::new(init_type_model_provider());

		let rng = DeterministicRng(13);
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rng.clone()),
		);
		let type_ref = Mail::type_ref();
		let type_model = type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.unwrap();
		let sk = GenericAesKey::from_bytes(rand::random::<[u8; 32]>().as_slice()).unwrap();
		let new_iv = Iv::from_bytes(&rand::random::<[u8; 16]>()).unwrap();
		let original_iv = Iv::generate(&RandomizerFacade::from_core(rng.clone()));

		// use two separate iv
		assert_ne!(original_iv.get_inner(), new_iv.get_inner());

		let (_, mut unencrypted_mail) = generate_email_entity(
			&sk,
			&original_iv,
			true,
			String::from("Hello, world!"),
			String::from("Hanover"),
			String::from("Munich"),
		);

		// set separate finalIv for some field
		let final_iv_for_subject = [(
			"subject".to_string(),
			ElementValue::Bytes(new_iv.get_inner().to_vec()),
		)]
		.into_iter()
		.collect::<HashMap<String, ElementValue>>();

		unencrypted_mail.insert(
			"_finalIvs".to_string(),
			ElementValue::Dict(final_iv_for_subject),
		);

		let encrypted_mail = entity_facade
			.encrypt_and_map_inner(type_model, &unencrypted_mail, &sk)
			.unwrap();

		let encrypted_subject = encrypted_mail.get("subject").unwrap();
		let subject_and_iv = sk
			.decrypt_data_and_iv(&encrypted_subject.assert_bytes())
			.unwrap();

		assert_eq!(
			Ok("Hello, world!".to_string()),
			String::from_utf8(subject_and_iv.data)
		);
		assert_eq!(new_iv.get_inner(), &subject_and_iv.iv);

		// other fields should be encrypted with origin_iv
		let encrypted_recipient_name = encrypted_mail
			.get("firstRecipient")
			.unwrap()
			.assert_dict()
			.get("name")
			.unwrap()
			.assert_bytes();
		let recipient_and_iv = sk.decrypt_data_and_iv(&encrypted_recipient_name).unwrap();
		assert_eq!(original_iv.get_inner().to_vec(), recipient_and_iv.iv)
	}

	#[test]
	#[ignore = "todo: Right now we will anyway try to encrypt the default value even for final fields.\
	This is however not intended. We skip the implementation because we did not need it for service call?"]
	fn empty_final_iv_and_default_value_should_be_preserved() {
		let type_model_provider = Arc::new(init_type_model_provider());
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let type_ref = Mail::type_ref();
		let type_model = type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.unwrap();
		let sk = GenericAesKey::from_bytes(rand::random::<[u8; 32]>().as_slice()).unwrap();
		let iv = Iv::from_bytes(&rand::random::<[u8; 16]>()).unwrap();

		let default_subject = String::from("");
		let (_, unencrypted_mail) = generate_email_entity(
			&sk,
			&iv,
			true,
			default_subject.clone(),
			String::from("Hanover"),
			String::from("Munich"),
		);

		let encrypted_mail = entity_facade
			.encrypt_and_map_inner(type_model, &unencrypted_mail, &sk)
			.unwrap();

		let encrypted_subject = encrypted_mail.get("subject").unwrap().assert_bytes();
		assert_eq!(default_subject.as_bytes(), encrypted_subject.as_slice());
	}

	fn map_to_string(map: &HashMap<String, ElementValue>) -> String {
		let mut out = String::new();
		let sorted_map: BTreeMap<String, ElementValue> = map.clone().into_iter().collect();
		for (key, value) in &sorted_map {
			match value {
				ElementValue::Dict(aggregate) => {
					out.push_str(&format!("{}: {}\n", key, map_to_string(aggregate)))
				},
				_ => out.push_str(&format!("{}: {:?}\n", key, value)),
			}
		}
		out
	}

	fn verify_final_ivs_and_clear(iv: &Iv, instance: &mut ParsedEntity) {
		for (name, value) in instance.iter_mut() {
			match value {
				ElementValue::Dict(value_map) if name == "_finalIvs" => {
					for (_n, actual_iv) in value_map.iter() {
						assert_eq!(iv.get_inner(), actual_iv.assert_bytes().as_slice());
					}
					value_map.clear();
				},

				ElementValue::Dict(value_map) => verify_final_ivs_and_clear(iv, value_map),
				_ => {},
			}
		}
	}

	fn make_json_entity() -> RawEntity {
		collection! {
			"sentDate"=> JsonElement::Null,
			"_ownerEncSessionKey"=> JsonElement::String(
				"AbK4PO4dConOew4jXt7UcmL9I73z1NA14EgbpBEw8J9ipgjD3i92SakgAv7SFXOE59VlWQ5dw3whqqSzkwoQavWWkDeJep1JzdP4ZyzNFMO7".to_string(),
			),
			"method"=> JsonElement::String(
				"AROQNb+N33nEk9+C+fCuy0vPwMWzqDcnZP48St2Jm1obAvKux3xZwnq1mdqpZmcUQEUL3USwYoJ80Ef8gmqmFgk=".to_string(),
			),
			"bucketKey"=> JsonElement::Null,
			"conversationEntry"=> JsonElement::Array(
				vec![
					JsonElement::String(
						"O1RT2Dj--3-0".to_string(),
					),
					JsonElement::String(
						"O1RT2Dj--7-0".to_string(),
					),
				],
			),
			"_permissions"=> JsonElement::String(
				"O1RT2Dj--g-0".to_string(),
			),
			"mailDetailsDraft"=> JsonElement::Null,
			"sender"=> JsonElement::Dict(
				collection! {
					"address"=> JsonElement::String(
						"map-free@tutanota.de".to_string(),
					),
					"contact"=> JsonElement::Null,
					"_id"=> JsonElement::String(
						"0y7Pgw".to_string(),
					),
					"name"=> JsonElement::String(
						"AQLHPJe+eDYk6eRtBsmtpNBGllFzNvfb7gUuMjxsiJGinYAStt4nHO4L1PLChTZL63ifyZd87IqJ7DpVNFkpPNQ=".to_string(),
					),
				},
			),
			"subject"=> JsonElement::String(
				"AVRYAouCyrii0gGUpQ9TcgbBdzQiFUc8n0I32fO5pA0wk+0i6vNke8uML5vPy09NQEzUiozrSYDl3bEzHCdrD9rjQgvrJhaygZiAF5bv8eX/".to_string(),
			),
			"movedTime"=> JsonElement::String(
				"1720612041643".to_string(),
			),
			"state"=> JsonElement::String(
				"2".to_string(),
			),
			"_ownerKeyVersion"=> JsonElement::String(
				"0".to_string(),
			),
			"replyTos"=> JsonElement::Array(
				vec![],
			),
			"unread"=> JsonElement::String(
				"0".to_string(),
			),
			"body"=> JsonElement::Null,
			"authStatus"=> JsonElement::Null,
			"firstRecipient"=> JsonElement::Dict(
				collection! {
					"address"=> JsonElement::String(
						"bed-free@tutanota.de".to_string(),
					),
					"_id"=> JsonElement::String(
						"yPeInQ".to_string(),
					),
					"name"=> JsonElement::String(
						"AcCA59dQjq0y32zLYtBYvZZ84DXe3ftn4fBplPt9KAkdRBauIaKN2jiSqNa7wvcb5TTyeLz7tdTt9sKyM9Y+tx0=".to_string(),
					),
					"contact"=> JsonElement::Null,
				},
			),
			"differentEnvelopeSender"=> JsonElement::Null,
			"listUnsubscribe"=> JsonElement::String(
				"".to_string(),
			),
			"attachments"=> JsonElement::Array(
				vec![],
			),
			"_id"=> JsonElement::Array(
				vec![
					JsonElement::String(
						"O1RT1m6-0R-0".to_string(),
					),
					JsonElement::String(
						"O1RT2Dj----0".to_string(),
					),
				],
			),
			"confidential"=> JsonElement::String(
				"AWv1okmvm7ItO37ubnKytr0kPscHFvpjzzs7P6CeiL8F3H8GWj/lpk20ewECiAg3wfj7sCyajaw1ShWU0D+Qncg=".to_string(),
			),
			"headers"=> JsonElement::Null,
			"receivedDate"=> JsonElement::String(
				"1720612041643".to_string(),
			),
			"_ownerGroup"=> JsonElement::String(
				"O1RT1m4-0s-0".to_string(),
			),
			"replyType"=> JsonElement::String(
				"".to_string(),
			),
			"phishingStatus"=> JsonElement::String(
				"0".to_string(),
			),
			"_format"=> JsonElement::String(
				"0".to_string(),
			),
			"recipientCount"=> JsonElement::String(
				"1".to_string(),
			),
			"encryptionAuthStatus"=> JsonElement::String(
				"AfrN1BgMCYxVksEHHVYnJCMrBK+59cgsu2S84Vvc57YbwV3NvuzFMXq8fMkTZB7vtLBiZdc2ZwLKrxTGwPWqk7w=".to_string(),
			),
			"mailDetails"=> JsonElement::Array(
				vec![
					JsonElement::String(
						"O1RT1m5-0--0".to_string(),
					),
					JsonElement::String(
						"O1RT2Dk----0".to_string(),
					),
				],
			),
		"sets"=> JsonElement::Array(vec![]),}
	}

	fn create_model_value(
		value_type: ValueType,
		encrypted: bool,
		cardinality: Cardinality,
	) -> ModelValue {
		ModelValue {
			id: 426,
			value_type,
			cardinality,
			is_final: true,
			encrypted,
		}
	}
}
