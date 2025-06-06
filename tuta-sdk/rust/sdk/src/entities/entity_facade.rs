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
use crate::{ApiCallError, TypeRef};
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use core::str;
use lz4_flex::block::DecompressError;
use minicbor::Encode;
use std::collections::HashMap;
use std::sync::Arc;

/// The name of the field that contains the session key encrypted
/// by the owner group's key in an entity
pub const OWNER_ENC_SESSION_KEY_FIELD: &str = "_ownerEncSessionKey";
/// The name of the owner-encrypted session key version field in an entity
pub const OWNER_KEY_VERSION_FIELD: &str = "_ownerKeyVersion";
/// The name of the owner group field in an entity
pub const OWNER_GROUP_FIELD: &str = "_ownerGroup";
/// The name of the ID field in an entity
pub const ID_FIELD: &str = "_id";
/// The name of the permissions field in an entity
pub const PERMISSIONS_FIELD: &str = "_permissions";
/// The name of the format field in an entity
pub const FORMAT_FIELD: &str = "_format";
/// The name of the bucket key field in an entity
pub const BUCKET_KEY_FIELD: &str = "bucketKey";
pub const MAX_UNCOMPRESSED_INPUT_LZ4: usize = 0x7e000000;

/// Provides high level functions to handle encryption/decryption of entities
#[derive(uniffi::Object)]
pub struct EntityFacadeImpl {
	type_model_provider: Arc<TypeModelProvider>,
	randomizer_facade: RandomizerFacade,
}

/// Value after it has been processed
#[cfg_attr(test, derive(Debug, PartialEq))]
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
				if final_ivs.assert_bytes().is_empty() {
					eprintln!(
						"Have empty finalIv and contains value: {:?} for key: {key}. Is of type: {:?}",
						value, model_value.value_type
					);
				}
				return final_ivs.assert_bytes().is_empty()
					&& model_value.value_type.get_default().eq(value);
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

		let element_is_nil = <ElementValue as Encode<()>>::is_nil(instance_value);
		if !model_value.encrypted
			|| (element_is_nil && model_value.cardinality == Cardinality::ZeroOrOne)
		{
			Ok(instance_value.clone())
		} else if element_is_nil {
			Err(ApiCallError::internal(format!(
				"Nil encrypted value is not accepted. ModelValue Id: {:?}",
				model_value.id
			)))
		} else {
			let bytes = Self::map_value_to_binary(value_type, instance_value);
			let encrypted_data = session_key
				.encrypt_data(bytes.as_slice(), iv)
				.expect("Cannot encrypt data");
			Ok(ElementValue::Bytes(encrypted_data))
		}
	}

	fn get_final_iv_for_key(instance: &ParsedEntity, key: &str) -> Option<ElementValue> {
		let finals_ivs = instance.get("_finalIvs")?;
		let arrays = finals_ivs
			.assert_dict_ref()
			.get(key)?
			.assert_bytes()
			.to_owned();
		Some(ElementValue::Bytes(arrays))
	}

	fn map_value_to_binary(value_type: &ValueType, value: &ElementValue) -> Vec<u8> {
		match value_type {
			ValueType::Bytes => value.assert_bytes().clone(),
			ValueType::String => value.assert_string().as_bytes().to_vec(),
			ValueType::Number => value.assert_number().to_string().as_bytes().to_vec(),
			ValueType::Date => value
				.assert_date()
				.as_millis()
				.to_string()
				.as_bytes()
				.to_vec(),

			ValueType::Boolean => if value.assert_bool() { b"1" } else { b"0" }.to_vec(),
			ValueType::GeneratedId => value.assert_generated_id().0.as_bytes().to_vec(),
			ValueType::CustomId => value.assert_custom_id().0.as_bytes().to_vec(),
			ValueType::CompressedString => {
				Self::lz4_compress_plain_bytes(value.assert_string().as_bytes())
					// this limit should be checked before creating the instance/entity itself
					// eg: client should not accept more input in mail editor once limit is reached
					.expect("Unchecked input data? received too large byte for lz4_compression")
			},
		}
	}

	fn encrypt_and_map_inner(
		&self,
		type_model: &TypeModel,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError> {
		let mut encrypted = ParsedEntity::new();

		for (&value_id, value_type) in &type_model.values {
			let value_id_string = String::from(value_id);
			let instance_value = instance.get(&value_id_string).ok_or_else(|| {
				ApiCallError::internal(format!(
					"Can not find key: {} in instance: {instance:?}",
					value_id_string
				))
			})?;

			let encrypted_value = if !value_type.encrypted {
				instance_value.clone()
			} else if Self::should_restore_default_value(
				value_type,
				instance_value,
				instance,
				value_id_string.as_str(),
			) {
				// restore the default encrypted value because it has not changed
				// note: this branch must be checked *before* the one which reuses IVs as this one checks
				// the length.
				ElementValue::String(String::new())
			} else if value_type.is_final
				&& Self::get_final_iv_for_key(instance, &value_id_string).is_some()
			{
				let final_iv = Iv::from_bytes(
					Self::get_final_iv_for_key(instance, &value_id_string)
						.unwrap()
						.assert_bytes()
						.as_slice(),
				)
				.map_err(|err| ApiCallError::internal(format!("iv of illegal size {:?}", err)))?;

				Self::encrypt_value(value_type, instance_value, sk, final_iv)?
			} else {
				Self::encrypt_value(
					value_type,
					instance_value,
					sk,
					Iv::generate(&self.randomizer_facade),
				)?
			};
			encrypted.insert(value_id_string.to_string(), encrypted_value);
		}

		if type_model.element_type == ElementType::Aggregated {
			let id_attribute_id = type_model
				.get_attribute_id_by_attribute_name(ID_FIELD)
				.map_err(|err| {
					ApiCallError::internal(format!(
						"{ID_FIELD} field not found on the aggregate {:?}",
						err
					))
				})?;

			match encrypted.get(&id_attribute_id) {
				Some(ElementValue::Null) => {
					encrypted.insert(
						id_attribute_id,
						make_random_aggregate_id(&self.randomizer_facade),
					);
				},
				Some(_) => {
					// the _id is most likely already set to some valid value
				},
				None => {
					//
				},
			}
		}

		for (&association_id, association_type) in &type_model.associations {
			let association_id_string: String = association_id.into();
			let encrypted_association = match association_type.association_type {
				AssociationType::Aggregation => self.encrypt_aggregate(
					type_model,
					association_id_string.as_str(),
					association_type,
					instance,
					sk,
				)?,
				AssociationType::ElementAssociation
				| AssociationType::ListAssociation
				| AssociationType::ListElementAssociationCustom
				| AssociationType::ListElementAssociationGenerated
				| AssociationType::BlobElementAssociation => instance
					.get(&association_id_string)
					.cloned()
					.ok_or(ApiCallError::internal(format!(
						"could not find association {} on type {}",
						association_id_string, type_model.name
					)))?,
			};
			encrypted.insert(association_id_string.to_string(), encrypted_association);
		}

		Ok(encrypted)
	}

	fn encrypt_aggregate(
		&self,
		type_model: &TypeModel,
		association_id: &str,
		association: &ModelAssociation,
		instance: &ParsedEntity,
		sk: &GenericAesKey,
	) -> Result<ElementValue, ApiCallError> {
		let dependency_type_ref = TypeRef::new(
			association.dependency.unwrap_or(type_model.app),
			association.ref_type_id,
		);

		let aggregated_type_model = self
			.type_model_provider
			.resolve_client_type_ref(&dependency_type_ref)
			.ok_or_else(|| {
				ApiCallError::internal(format!("unknown type model: {:?}", dependency_type_ref))
			})?;
		let instance_association = instance.get(&association_id.to_string()).unwrap();

		let aggregates = instance_association.assert_array();
		let mut encrypted_aggregates = Vec::with_capacity(aggregates.len());
		for aggregate in &aggregates {
			let parsed_entity =
				self.encrypt_and_map_inner(aggregated_type_model, &aggregate.assert_dict(), sk)?;
			encrypted_aggregates.push(ElementValue::Dict(parsed_entity));
		}

		Ok(ElementValue::Array(encrypted_aggregates))
	}

	fn decrypt_and_map_inner(
		&self,
		type_model: &TypeModel,
		mut entity: ParsedEntity,
		session_key: &GenericAesKey,
	) -> Result<ParsedEntity, ApiCallError> {
		let mut mapped_decrypted: ParsedEntity = Default::default();
		let mut mapped_errors: Errors = Default::default();
		let mut mapped_ivs: HashMap<String, ElementValue> = Default::default();

		for (&value_id, value_type) in &type_model.values {
			let value_id_string: String = value_id.into();
			let value_name = &value_type.name;
			let stored_element = entity
				.remove(&value_id_string)
				.unwrap_or(ElementValue::Null);
			let MappedValue { value, iv, error } =
				Self::decrypt_and_parse_value(stored_element, session_key, value_name, value_type)?;

			mapped_decrypted.insert(value_id_string.clone(), value);
			if let Some(error) = error {
				mapped_errors.insert(value_id_string.clone(), ElementValue::String(error));
			}
			match iv {
				Some(iv) => {
					mapped_ivs.insert(value_id_string, ElementValue::Bytes(iv.clone()));
				},
				None if value_type.is_final && value_type.encrypted => {
					mapped_ivs.insert(value_id_string, ElementValue::Null);
				},
				_ => {},
			}
		}

		for (&association_id, association_type) in &type_model.associations {
			let association_name = &association_type.name;
			let association_id_string: String = association_id.into();
			let association_entry = entity
				.remove(&association_id_string)
				.unwrap_or(ElementValue::Array(vec![]));
			let (mapped_association, errors) = self.map_associations(
				type_model,
				association_entry,
				session_key,
				association_name,
				association_type,
			)?;

			mapped_decrypted.insert(association_id_string.clone(), mapped_association);
			if !errors.is_empty() {
				mapped_errors.insert(association_id_string, ElementValue::Dict(errors));
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
		let dependency = association_model.dependency.unwrap_or(type_model.app);
		let dependency_typeref = TypeRef::new(dependency, association_model.ref_type_id);

		if let AssociationType::Aggregation = association_model.association_type {
			let aggregate_type_model = self
				.type_model_provider
				.resolve_client_type_ref(&dependency_typeref)
				.unwrap_or_else(|| panic!("Undefined type_model {}", dependency_typeref));

			let mut aggregate_vec = Vec::with_capacity(association_data.assert_array_ref().len());
			let ElementValue::Array(association_data) = association_data else {
				return Err(ApiCallError::InternalSdkError {
					error_message: format!(
						"Invalid aggregate format. {} isn't an array",
						association_name
					),
				});
			};
			for (index, aggregate) in association_data.into_iter().enumerate() {
				match aggregate {
					ElementValue::Dict(entity) => {
						let mut decrypted_aggregate =
							self.decrypt_and_map_inner(aggregate_type_model, entity, session_key)?;

						// Errors should be grouped inside the top-most object, so they should be
						// extracted and removed from aggregates
						if decrypted_aggregate.contains_key("_errors") {
							let error_key = &format!("{}_{}", association_name, index);
							self.extract_errors(error_key, &mut errors, &mut decrypted_aggregate);
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
		} else {
			Ok((association_data, errors))
		}
	}
	fn extract_errors(
		&self,
		association_id: &str,
		errors: &mut Errors,
		dec_aggregate: &mut ParsedEntity,
	) {
		if let Some(ElementValue::Dict(err_dict)) = dec_aggregate.remove("_errors") {
			if !err_dict.is_empty() {
				errors.insert(association_id.to_string(), ElementValue::Dict(err_dict));
			}
		}
	}
	fn decrypt_and_parse_value(
		value: ElementValue,
		session_key: &GenericAesKey,
		key: &str,
		model_value: &ModelValue,
	) -> Result<MappedValue, ApiCallError> {
		match (&model_value.cardinality, &model_value.encrypted, value) {
			(Cardinality::One | Cardinality::ZeroOrOne, true, value)
				if value.eq(&model_value.value_type.get_default()) =>
			{
				// If the value is default-encrypted (empty string) then return default value and
				// empty IV. When re-encrypting we should put the empty value back to not increase
				// used storage.
				let value = model_value.value_type.get_default();
				Ok(MappedValue {
					value,
					iv: None,
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

				match Self::parse_decrypted_value(model_value.value_type.clone(), plaintext) {
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
						.map_err(|e| ApiCallError::internal_with_err(e, "Invalid number string"))?;
					let number = string
						.parse()
						.map_err(|e| ApiCallError::internal_with_err(e, "Invalid number"))?;

					Ok(ElementValue::Number(number))
				}
			},
			ValueType::Bytes => Ok(ElementValue::Bytes(bytes.clone())),
			ValueType::Date => {
				let mut valid_bytes: Vec<u8> = bytes.clone();

				if let Ok(string) = str::from_utf8(&valid_bytes) {
					let bytes = string
						.parse::<u64>()
						.map_err(|e| ApiCallError::internal_with_err(e, "Invalid date bytes"))?;
					valid_bytes = bytes.to_be_bytes().to_vec();
				};

				let bytes = array_cast_slice(valid_bytes.as_slice(), "u64")
					.map_err(|e| ApiCallError::internal_with_err(e, "Invalid date bytes"))?;
				let value = u64::from_be_bytes(bytes);
				let date_time = DateTime::from_millis(value);
				Ok(ElementValue::Date(date_time))
			},
			ValueType::Boolean => match bytes.as_slice() {
				b"1" => Ok(ElementValue::Bool(true)),
				b"0" => Ok(ElementValue::Bool(false)),
				_ => Err(ApiCallError::InternalSdkError {
					error_message: "Failed to parse boolean bytes".to_owned(),
				}),
			},
			ValueType::CompressedString => {
				let uncompressed_bytes = Self::lz4_decompress_decrypted_bytes(bytes.as_slice())
					.map_err(|e| {
						ApiCallError::internal_with_err(e, "Cannot decompress compressed string")
					})?;

				let uncompressed_string = String::from_utf8(uncompressed_bytes).map_err(|e| {
					ApiCallError::internal_with_err(
						e,
						"Invalid utf-8 character in uncompressed string",
					)
				})?;

				Ok(ElementValue::String(uncompressed_string))
			},

			ValueType::GeneratedId | ValueType::CustomId => {
				unreachable!("Cannot convert {value_type:?} to ElementValue");
			},
		}
	}

	#[must_use]
	pub fn lz4_compress_plain_bytes(bytes: &[u8]) -> Option<Vec<u8>> {
		if bytes.is_empty() {
			Some(Vec::new())
		} else if bytes.len() <= MAX_UNCOMPRESSED_INPUT_LZ4 {
			Some(lz4_flex::compress(bytes))
		} else {
			None
		}
	}

	pub fn lz4_decompress_decrypted_bytes(
		compressed_bytes: &[u8],
	) -> Result<Vec<u8>, DecompressError> {
		if compressed_bytes.is_empty() {
			return Ok(Vec::new());
		}

		// since we don't store the uncompressed size we have to guess how much memory we might
		// need.
		// 12 times the compressed size should work for almost all cases.
		let mut uncompressed_bytes = lz4_flex::decompress(compressed_bytes, compressed_bytes.len());
		while let Err(DecompressError::OutputTooSmall {
			actual,
			expected: _,
		}) = uncompressed_bytes
		{
			uncompressed_bytes = lz4_flex::decompress(compressed_bytes, actual * 2);
		}
		uncompressed_bytes
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

		let owner_enc_session_key_attribute_id: String = type_model
				.get_attribute_id_by_attribute_name(OWNER_ENC_SESSION_KEY_FIELD)
				.map_err(|err| ApiCallError::InternalSdkError {
					error_message: format!(
						"{OWNER_ENC_SESSION_KEY_FIELD} attribute does not exist on the type model with typeId {:?} {:?}",
						type_model.id,
						err
					),
				})?;

		mapped_decrypted.insert(
			owner_enc_session_key_attribute_id,
			ElementValue::Bytes(resolved_session_key.owner_enc_session_key.clone()),
		);

		let owner_key_version_attribute_id: String = type_model
			.get_attribute_id_by_attribute_name(OWNER_KEY_VERSION_FIELD)
			.map_err(|err| ApiCallError::InternalSdkError {
				error_message: format!(
						"{OWNER_KEY_VERSION_FIELD} attribute does not exist on the type model with typeId {:?} {:?}",
						type_model.id,
						err
					),
			})?;

		mapped_decrypted.insert(
			owner_key_version_attribute_id,
			ElementValue::Number(resolved_session_key.owner_key_version as i64),
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

fn make_random_aggregate_id(random: &RandomizerFacade) -> ElementValue {
	let new_id_bytes = random.generate_random_array::<4>();
	let new_id_string = BASE64_URL_SAFE_NO_PAD.encode(new_id_bytes);
	let new_id = crate::CustomId(new_id_string);
	ElementValue::IdCustomId(new_id)
}

#[cfg(test)]
mod lz4_compressed_string_compatibility_tests {
	use crate::crypto::compatibility_test_utils::{
		get_compatibility_test_data, CompressionTestData,
	};
	use crate::entities::entity_facade::EntityFacadeImpl;
	use base64::prelude::BASE64_STANDARD;
	use base64::Engine;

	#[test]
	#[ignore]
	fn create_compatibility_test_data() {
		let test_data = get_compatibility_test_data().compression_tests;
		let out = test_data
			.iter()
			.map(|td| {
				BASE64_STANDARD.encode(
					EntityFacadeImpl::lz4_compress_plain_bytes(td.uncompressed_text.as_bytes())
						.unwrap(),
				)
			})
			.collect::<Vec<String>>();

		println!("List<String> rustCompressed = List.of(");
		for (index, o) in out.iter().enumerate() {
			print!("\t\t\"{o}\"");
			if index != out.len() - 1 {
				println!(",");
			}
		}
		println!(");");
	}

	#[test]
	fn compatibility_with_js_and_java() {
		let test_data = get_compatibility_test_data().compression_tests;
		for test_data in test_data.into_iter() {
			let CompressionTestData {
				uncompressed_text,
				compressed_base64_text_java,
				compressed_base64_text_java_script,
				compressed_base64_text_rust,
			} = test_data;

			let new_compressed_bas64_text_rust =
				EntityFacadeImpl::lz4_compress_plain_bytes(uncompressed_text.as_bytes()).unwrap();

			assert_eq!(new_compressed_bas64_text_rust, compressed_base64_text_rust);

			let decompressed_bytes_java = EntityFacadeImpl::lz4_decompress_decrypted_bytes(
				compressed_base64_text_java.as_slice(),
			)
			.unwrap();

			let decompressed_bytes_javascript = EntityFacadeImpl::lz4_decompress_decrypted_bytes(
				compressed_base64_text_java_script.as_slice(),
			)
			.unwrap();

			let decompressed_bytes_rust = EntityFacadeImpl::lz4_decompress_decrypted_bytes(
				compressed_base64_text_rust.as_slice(),
			)
			.unwrap();

			assert_eq!(decompressed_bytes_java, uncompressed_text.as_bytes());
			assert_eq!(decompressed_bytes_javascript, uncompressed_text.as_bytes());
			assert_eq!(decompressed_bytes_rust, uncompressed_text.as_bytes());
			assert_eq!(
				uncompressed_text.is_empty(),
				decompressed_bytes_java.is_empty()
			);
		}
	}
}

#[cfg(test)]
mod tests {
	use crate::bindings::file_client::MockFileClient;
	use crate::bindings::rest_client::MockRestClient;
	use crate::crypto::crypto_facade::ResolvedSessionKey;
	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::test_util::DeterministicRng;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::{aes::Iv, Aes256Key};
	use crate::date::DateTime;
	use crate::element_value::{ElementValue, ParsedEntity};
	use crate::entities::entity_facade::{
		make_random_aggregate_id, EntityFacade, EntityFacadeImpl, MappedValue, ID_FIELD,
		MAX_UNCOMPRESSED_INPUT_LZ4, OWNER_ENC_SESSION_KEY_FIELD, OWNER_KEY_VERSION_FIELD,
	};
	use crate::entities::generated::sys::CustomerAccountTerminationRequest;
	use crate::entities::generated::tutanota::{Mail, MailAddress};
	use crate::entities::Entity;
	use crate::instance_mapper::InstanceMapper;
	use crate::json_element::{JsonElement, RawEntity};
	use crate::json_serializer::JsonSerializer;
	use crate::metamodel::{AttributeId, Cardinality, ModelValue, ValueType};
	use crate::type_model_provider::TypeModelProvider;
	use crate::util::entity_test_utils::generate_email_entity;
	use crate::{collection, ApiCallError};
	use std::collections::{BTreeMap, HashMap};
	use std::sync::Arc;
	use std::time::SystemTime;

	const KNOWN_SK: [u8; 32] = [
		83, 168, 168, 203, 48, 91, 246, 102, 175, 252, 39, 110, 36, 141, 4, 216, 135, 201, 226,
		134, 182, 175, 15, 152, 117, 216, 81, 1, 120, 134, 116, 143,
	];

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

	#[test]
	fn test_parse_decrypted_value_date_from_string() {
		let timestamp: u64 = 1738310400000;
		let value = timestamp.to_string().as_bytes().to_vec();

		let parsed_decrypted_value =
			EntityFacadeImpl::parse_decrypted_value(ValueType::Date, value);

		assert!(parsed_decrypted_value.is_ok());
		assert_eq!(
			&DateTime::from_millis(timestamp),
			parsed_decrypted_value.unwrap().assert_date()
		);
	}

	#[test]
	fn test_parse_decrypted_value_date_from_number() {
		let timestamp: u64 = 1738310400000;
		let value = timestamp.to_be_bytes().to_vec();

		let parsed_decrypted_value =
			EntityFacadeImpl::parse_decrypted_value(ValueType::Date, value);

		assert!(parsed_decrypted_value.is_ok());
		assert_eq!(
			&DateTime::from_millis(timestamp),
			parsed_decrypted_value.unwrap().assert_date()
		);
	}

	#[test]
	fn test_parse_decrypted_value_date_from_invalid() {
		let value = vec![];

		let parsed_decrypted_value =
			EntityFacadeImpl::parse_decrypted_value(ValueType::Date, value);

		assert!(parsed_decrypted_value.is_err());
		let err = parsed_decrypted_value.unwrap_err().to_string();
		assert!(err.contains("Invalid date bytes"));
	}

	#[test]
	fn test_decrypt_and_parse_date_from_string() {
		let timestamp: u64 = 1738310400000;
		let model_value = create_model_value(ValueType::String, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let iv = Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng));
		let value = ElementValue::String(timestamp.to_string());
		let encrypted_value =
			EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone()).unwrap();

		let decrypt_model_value = create_model_value(ValueType::Date, true, Cardinality::One);
		let decrypted_value = EntityFacadeImpl::decrypt_and_parse_value(
			encrypted_value,
			&sk,
			"test",
			&decrypt_model_value,
		);

		assert!(decrypted_value.is_ok());
	}

	#[test]
	fn test_decrypt_mail() {
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(KNOWN_SK.as_slice()).unwrap());
		let owner_enc_session_key = vec![0, 1, 2];
		let owner_key_version = 0u64;

		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));
		let raw_entity: RawEntity = make_mail_raw_entity();
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let encrypted_mail: ParsedEntity = json_serializer
			.parse(&Mail::type_ref(), raw_entity)
			.unwrap();

		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let mail_type_model = type_model_provider
			.resolve_server_type_ref(&Mail::type_ref())
			.unwrap();
		let mail_address_type_model = type_model_provider
			.resolve_server_type_ref(&MailAddress::type_ref())
			.unwrap();
		let decrypted_mail = entity_facade
			.decrypt_and_map(
				&mail_type_model,
				encrypted_mail,
				ResolvedSessionKey {
					session_key: sk,
					owner_enc_session_key,
					owner_key_version,
					sender_identity_pub_key: None,
				},
			)
			.unwrap();
		let instance_mapper = InstanceMapper::new(type_model_provider.clone());
		let _mail: Mail = instance_mapper
			.parse_entity(decrypted_mail.clone())
			.unwrap();

		assert_eq!(
			&DateTime::from_millis(1720612041643),
			decrypted_mail
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("receivedDate")
						.unwrap()
				)
				.unwrap()
				.assert_date()
		);
		assert!(decrypted_mail
			.get(
				&mail_type_model
					.get_attribute_id_by_attribute_name("confidential")
					.unwrap()
			)
			.unwrap()
			.assert_bool());
		assert_eq!(
			"Html email features",
			decrypted_mail
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("subject")
						.unwrap()
				)
				.unwrap()
				.assert_str()
		);
		assert_eq!(
			"Matthias",
			decrypted_mail
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap()
				)
				.unwrap()
				.assert_array_ref()[0]
				.assert_dict()
				.get(
					&mail_address_type_model
						.get_attribute_id_by_attribute_name("name")
						.unwrap()
				)
				.unwrap()
				.assert_str()
		);
		assert_eq!(
			"map-free@tutanota.de",
			decrypted_mail
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap()
				)
				.unwrap()
				.assert_array_ref()[0]
				.assert_dict()
				.get(
					&mail_address_type_model
						.get_attribute_id_by_attribute_name("address")
						.unwrap()
				)
				.unwrap()
				.assert_str()
		);
		assert!(decrypted_mail
			.get(
				&mail_type_model
					.get_attribute_id_by_attribute_name("attachments")
					.unwrap()
			)
			.unwrap()
			.assert_array()
			.is_empty());
		assert_eq!(
			decrypted_mail
				.get("_finalIvs")
				.expect("has_final_ivs")
				.assert_dict()
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("subject")
						.unwrap()
				)
				.expect("has_subject")
				.assert_bytes(),
			&vec![
				0x54, 0x58, 0x02, 0x8b, 0x82, 0xca, 0xb8, 0xa2, 0xd2, 0x01, 0x94, 0xa5, 0x0f, 0x53,
				0x72, 0x06
			],
		);
		assert_eq!(
			decrypted_mail
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap()
				)
				.expect("has sender")
				.assert_array_ref()[0]
				.assert_dict()
				.get("_finalIvs")
				.expect("has _finalIvs")
				.assert_dict()
				.len(),
			1,
		);
	}

	#[test]
	fn decrypt_compressed_string() {
		let model_value = create_model_value(ValueType::CompressedString, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let iv = Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng));
		let value = ElementValue::String("this is a string value".to_string());

		let encrypted_value =
			EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone()).unwrap();

		let decrypted_value =
			EntityFacadeImpl::decrypt_and_parse_value(encrypted_value, &sk, "test", &model_value);

		assert_eq!(
			Ok(MappedValue {
				value: ElementValue::String("this is a string value".to_string()),
				iv: Some(iv.get_inner().to_vec()),
				error: None,
			}),
			decrypted_value
		);
	}

	#[test]
	fn decrypt_empty_compressed_string() {
		let decrypted_value = EntityFacadeImpl::decrypt_and_parse_value(
			ElementValue::String(String::default()),
			&GenericAesKey::from_bytes(&KNOWN_SK).unwrap(),
			"test",
			&create_model_value(ValueType::CompressedString, true, Cardinality::One),
		)
		.map(|a| a.value);

		assert_eq!(Ok(ElementValue::String(String::default())), decrypted_value);
	}

	#[test]
	fn compress_empty_compressed_string() {
		let session_key = GenericAesKey::from_bytes(&KNOWN_SK).unwrap();
		let iv = Iv::from_bytes(&rand::random::<[u8; 16]>()).unwrap();
		let encrypted_value = EntityFacadeImpl::encrypt_value(
			&create_model_value(ValueType::CompressedString, true, Cardinality::One),
			&ElementValue::String(String::default()),
			&session_key,
			iv.clone(),
		);

		let encrypted_string = session_key
			.encrypt_data(String::default().as_bytes(), iv)
			.unwrap();
		assert_eq!(Ok(ElementValue::Bytes(encrypted_string)), encrypted_value);
	}

	#[test]
	fn should_not_compress_too_large_bytes() {
		assert_eq!(MAX_UNCOMPRESSED_INPUT_LZ4, 0x7e000000);
		let compressed_max_limit = EntityFacadeImpl::lz4_compress_plain_bytes(
			b"a".repeat(MAX_UNCOMPRESSED_INPUT_LZ4).as_slice(),
		);
		let compressed_over_limit = EntityFacadeImpl::lz4_compress_plain_bytes(
			b"a".repeat(MAX_UNCOMPRESSED_INPUT_LZ4 + 1).as_slice(),
		);

		assert!(compressed_max_limit.is_some());
		assert_eq!(None, compressed_over_limit);
	}

	#[test]
	fn should_decompress_with_no_limit() {
		// Construct some compressed text by ourselves instead of calling lz4_flex::compress
		// to save ~10seconds ( in dev machine ) of test runtime
		// compressed_over_limit is the output of: lz4_flex::compress(b"a".repeat(MAX_UNCOMPRESSED_INPUT).as_slice());
		let mut compressed_over_limit = vec![31, 97, 1, 0];
		let mut compressed_rest = vec![255; 8289918];
		let mut compressed_tail = vec![110, 96, 97, 97, 97, 97, 97, 97];
		compressed_over_limit.append(&mut compressed_rest);
		compressed_over_limit.append(&mut compressed_tail);

		let decompressed =
			EntityFacadeImpl::lz4_decompress_decrypted_bytes(compressed_over_limit.as_slice())
				.map(|a| a.len())
				.map_err(|_| ());

		assert_eq!(Ok(MAX_UNCOMPRESSED_INPUT_LZ4 + 10), decompressed);
	}

	#[test]
	fn decrypt_compressed_string_with_resize() {
		let input_bytes = b"test ".repeat(124);
		let compressed =
			EntityFacadeImpl::lz4_compress_plain_bytes(input_bytes.as_slice()).unwrap();
		let decompressed =
			EntityFacadeImpl::lz4_decompress_decrypted_bytes(compressed.as_slice()).unwrap();
		assert_eq!(input_bytes.as_slice(), decompressed.as_slice());
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

		assert_eq!(&expected, encrypted_value.unwrap().assert_bytes())
	}

	#[test]
	fn encrypt_value_compressed_string() {
		let model_value = create_model_value(ValueType::CompressedString, true, Cardinality::One);
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let iv = Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng));

		let value = ElementValue::String("Hello, world".to_string());

		let encrypted_value =
			EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone())
				.map(|a| a.assert_bytes().to_owned());

		let expected = sk
			.clone()
			.encrypt_data(
				lz4_flex::compress(value.assert_string().as_bytes()).as_slice(),
				iv.clone(),
			)
			.unwrap();
		assert_eq!(Ok(expected), encrypted_value)
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
			assert_eq!(&expected, encrypted_value.unwrap().assert_bytes())
		}

		{
			let value = ElementValue::Bool(false);
			let encrypted_value =
				EntityFacadeImpl::encrypt_value(&model_value, &value, &sk, iv.clone());

			let expected = sk.clone().encrypt_data("0".as_bytes(), iv.clone()).unwrap();
			assert_eq!(&expected, encrypted_value.unwrap().assert_bytes())
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

		assert_eq!(&expected, encrypted_value.unwrap().assert_bytes());
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

		assert_eq!(&expected, encrypted_value.unwrap().assert_bytes());
	}

	#[test]
	fn encrypt_value_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
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
	fn encrypt_value_do_not_accept_null() {
		let sk = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		for value_type in ALL_VALUE_TYPES {
			assert_eq!(
				Err(ApiCallError::internal(
					"Nil encrypted value is not accepted. ModelValue Id: AttributeId(426)"
						.to_string()
				)),
				EntityFacadeImpl::encrypt_value(
					&create_model_value(value_type.clone(), true, Cardinality::One),
					&ElementValue::Null,
					&sk,
					Iv::generate(&RandomizerFacade::from_core(rand_core::OsRng)),
				)
			);
		}
	}

	#[test]
	fn encrypt_and_map_instance() {
		let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(KNOWN_SK.as_slice()).unwrap());
		let owner_enc_session_key = [0, 1, 2];
		let owner_key_version = 0u64;

		let deterministic_rng = DeterministicRng(20);
		let random = RandomizerFacade::from_core(deterministic_rng.clone());
		// we're kind of using the implementation to test itself here, but
		// this is not about the actual value, but that it is set at all
		let expected_aggregate_id = make_random_aggregate_id(&random);

		let iv = Iv::generate(&random);
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));

		let mail_type_model = type_model_provider
			.resolve_server_type_ref(&Mail::type_ref())
			.unwrap();
		let mail_address_type_model = type_model_provider
			.resolve_server_type_ref(&MailAddress::type_ref())
			.unwrap();

		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(deterministic_rng),
		);

		let (mut expected_encrypted_mail, mut raw_mail) = generate_email_entity(
			&sk,
			&iv,
			true,
			String::from("Hello, world!"),
			String::from("Hanover"),
			String::from("Munich"),
			None,
		);

		// removes finalIvs for easy comparison as well as setting the aggregate _id fields
		{
			expected_encrypted_mail.remove("_finalIvs").unwrap();
			expected_encrypted_mail
				.get_mut(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap(),
				)
				.unwrap()
				.assert_array_mut_ref()[0]
				.assert_dict_mut_ref()
				.remove("_finalIvs")
				.unwrap();
			expected_encrypted_mail
				.get_mut(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap(),
				)
				.unwrap()
				.assert_array_mut_ref()[0]
				.assert_dict_mut_ref()
				.insert(
					mail_address_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap(),
					expected_aggregate_id.clone(),
				);
			expected_encrypted_mail
				.get_mut(
					&mail_type_model
						.get_attribute_id_by_attribute_name("firstRecipient")
						.unwrap(),
				)
				.unwrap()
				.assert_array_mut_ref()[0]
				.assert_dict_mut_ref()
				.remove("_finalIvs")
				.unwrap();
			expected_encrypted_mail
				.get_mut(
					&mail_type_model
						.get_attribute_id_by_attribute_name("firstRecipient")
						.unwrap(),
				)
				.unwrap()
				.assert_array_mut_ref()[0]
				.assert_dict_mut_ref()
				.insert(
					mail_address_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap(),
					expected_aggregate_id.clone(),
				);
		}

		{
			// generate_email_entity generates aggregate ids for us, but the entity_facade is supposed to set
			// them on the fly if they're missing. by removing them here we test that they're re-created
			raw_mail
				.get_mut(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap(),
				)
				.unwrap()
				.assert_array_mut_ref()[0]
				.assert_dict_mut_ref()
				.insert(
					mail_address_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap(),
					ElementValue::Null,
				);
			raw_mail
				.get_mut(
					&mail_type_model
						.get_attribute_id_by_attribute_name("firstRecipient")
						.unwrap(),
				)
				.unwrap()
				.assert_array_mut_ref()[0]
				.assert_dict_mut_ref()
				.insert(
					mail_address_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap(),
					ElementValue::Null,
				);
		}

		let encrypted_mail = entity_facade
			.encrypt_and_map_inner(&mail_type_model, &raw_mail, &sk)
			.unwrap();

		assert_eq!(expected_encrypted_mail, encrypted_mail);

		// verify every data is preserved as is after decryption
		{
			let mut original_mail = raw_mail;
			{
				original_mail
					.get_mut(
						&mail_type_model
							.get_attribute_id_by_attribute_name("sender")
							.unwrap(),
					)
					.unwrap()
					.assert_array_mut_ref()[0]
					.assert_dict_mut_ref()
					.insert(
						mail_address_type_model
							.get_attribute_id_by_attribute_name(ID_FIELD)
							.unwrap(),
						expected_aggregate_id.clone(),
					);
				original_mail
					.get_mut(
						&mail_type_model
							.get_attribute_id_by_attribute_name("firstRecipient")
							.unwrap(),
					)
					.unwrap()
					.assert_array_mut_ref()[0]
					.assert_dict_mut_ref()
					.insert(
						mail_address_type_model
							.get_attribute_id_by_attribute_name(ID_FIELD)
							.unwrap(),
						expected_aggregate_id.clone(),
					);
			}

			let mut decrypted_mail = entity_facade
				.decrypt_and_map(
					&mail_type_model,
					encrypted_mail.clone(),
					ResolvedSessionKey {
						session_key: sk.clone(),
						owner_enc_session_key: owner_enc_session_key.to_vec(),
						owner_key_version,
						sender_identity_pub_key: None,
					},
				)
				.unwrap();

			// compare all the _finalIvs are initialised with expectedIV
			// for simplicity in comparison remove them as well( original_mail don't have _finalIvs )
			verify_final_ivs_and_clear(&iv, &mut decrypted_mail);

			assert_eq!(
				Some(&ElementValue::Bytes(owner_enc_session_key.to_vec())),
				decrypted_mail.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name(OWNER_ENC_SESSION_KEY_FIELD)
						.unwrap()
				),
			);
			decrypted_mail.insert(
				mail_type_model
					.get_attribute_id_by_attribute_name(OWNER_ENC_SESSION_KEY_FIELD)
					.unwrap(),
				ElementValue::Null,
			);
			assert_eq!(
				Some(&ElementValue::Number(
					owner_key_version as i64 // we know it is 0
				)),
				decrypted_mail.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name(OWNER_KEY_VERSION_FIELD)
						.unwrap()
				),
			);
			decrypted_mail.insert(
				mail_type_model
					.get_attribute_id_by_attribute_name(OWNER_KEY_VERSION_FIELD)
					.unwrap(),
				ElementValue::Null,
			);

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
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let type_ref = CustomerAccountTerminationRequest::type_ref();
		let type_model = type_model_provider
			.resolve_server_type_ref(&type_ref)
			.unwrap();
		let sk = GenericAesKey::from_bytes(rand::random::<[u8; 32]>().as_slice()).unwrap();

		let dummy_date = DateTime::from_system_time(SystemTime::now());
		// sys/CustomerAccountTerminationRequest
		let raw_entity: RawEntity = collection! {
				"2009" => JsonElement::String("0".to_string()),
				"2007" => JsonElement::Array(vec![JsonElement::String("O1RT2Dj--3-0".to_string()); 2]),
				"2010" => JsonElement::Null,
				"2008" => JsonElement::String("O2TT2Aj--2-1".to_string()),
				"2012" => JsonElement::String(dummy_date.as_millis().to_string()),
				"2013" => JsonElement::String(dummy_date.as_millis().to_string()),
				"2011" => JsonElement::Array(vec![JsonElement::String("customId".to_string())]),
		};
		let parsed_entity = json_serializer.parse(&type_ref, raw_entity).unwrap();

		let encrypted_instance = entity_facade.encrypt_and_map(&type_model, &parsed_entity, &sk);

		// unencrypted value should be kept as-is
		assert_eq!(Ok(parsed_entity), encrypted_instance);
	}

	#[test]
	fn encryption_final_ivs_will_be_reused() {
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));

		let rng = DeterministicRng(13);
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rng.clone()),
		);
		let mail_type_model = type_model_provider
			.resolve_server_type_ref(&Mail::type_ref())
			.unwrap();
		let mail_address_type_model = type_model_provider
			.resolve_server_type_ref(&MailAddress::type_ref())
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
			None,
		);

		// set separate finalIv for some field
		let final_iv_for_subject = [(
			mail_type_model
				.get_attribute_id_by_attribute_name("subject")
				.unwrap()
				.to_string(),
			ElementValue::Bytes(new_iv.get_inner().to_vec()),
		)]
		.into_iter()
		.collect::<HashMap<String, ElementValue>>();

		unencrypted_mail.insert(
			"_finalIvs".to_string(),
			ElementValue::Dict(final_iv_for_subject),
		);

		let encrypted_mail = entity_facade
			.encrypt_and_map_inner(&mail_type_model, &unencrypted_mail, &sk)
			.unwrap();

		let encrypted_subject = encrypted_mail
			.get(
				&mail_type_model
					.get_attribute_id_by_attribute_name("subject")
					.unwrap(),
			)
			.unwrap();
		let subject_and_iv = sk
			.decrypt_data_and_iv(encrypted_subject.assert_bytes())
			.unwrap();

		assert_eq!(
			Ok("Hello, world!".to_string()),
			String::from_utf8(subject_and_iv.data)
		);
		assert_eq!(new_iv, subject_and_iv.iv);

		// other fields should be encrypted with origin_iv
		let encrypted_recipient_name = encrypted_mail
			.get(
				&mail_type_model
					.get_attribute_id_by_attribute_name("firstRecipient")
					.unwrap(),
			)
			.unwrap()
			.assert_array()[0]
			.assert_dict()
			.get(
				&mail_address_type_model
					.get_attribute_id_by_attribute_name("name")
					.unwrap(),
			)
			.unwrap()
			.assert_bytes()
			.clone();
		let recipient_and_iv = sk.decrypt_data_and_iv(&encrypted_recipient_name).unwrap();
		assert_eq!(original_iv, recipient_and_iv.iv)
	}

	#[test]
	#[ignore = "todo: Right now we will anyway try to encrypt the default value even for final fields.\
	This is however not intended. We skip the implementation because we did not need it for service call?"]
	fn empty_final_iv_and_default_value_should_be_preserved() {
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));
		let entity_facade = EntityFacadeImpl::new(
			Arc::clone(&type_model_provider),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let type_ref = Mail::type_ref();
		let type_model = type_model_provider
			.resolve_client_type_ref(&type_ref)
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
			None,
		);

		let encrypted_mail = entity_facade
			.encrypt_and_map_inner(type_model, &unencrypted_mail, &sk)
			.unwrap();

		let encrypted_subject = encrypted_mail.get("subject").unwrap().assert_bytes();
		assert_eq!(default_subject.as_bytes(), encrypted_subject.as_slice());
	}

	fn map_to_string(map: &ParsedEntity) -> String {
		let mut out = String::new();
		let sorted_map: BTreeMap<String, ElementValue> = map.clone().into_iter().collect();
		for (key, value) in &sorted_map {
			match value {
				ElementValue::Array(aggregates) => {
					for aggregate in aggregates {
						if let ElementValue::Dict(aggregate) = aggregate {
							out.push_str(&format!("{}: {}\n", key, map_to_string(aggregate)))
						}
					}
				},
				_ => out.push_str(&format!("{}: {:?}\n", key, value)),
			}
		}
		out
	}

	fn verify_final_ivs_and_clear(_iv: &Iv, instance: &mut ParsedEntity) {
		for (name, value) in instance.iter_mut() {
			match value {
				ElementValue::Dict(value_map) if name == "_finalIvs" => {
					for (_n, actual_iv) in value_map.iter() {
						match actual_iv {
							ElementValue::Null | ElementValue::Bytes(_) => {},
							__other => {
								panic!("Unexpected element value: {:?}", __other);
							},
						}
					}
					value_map.clear();
				},

				ElementValue::Array(value_map) => {
					for aggregate in value_map {
						if let ElementValue::Dict(aggregate) = aggregate {
							verify_final_ivs_and_clear(_iv, aggregate)
						}
					}
				},
				_ => {},
			}
		}
	}

	fn make_mail_raw_entity() -> RawEntity {
		// tutanota:Mail
		collection! {
			"560"=> JsonElement::Null,
			"102"=> JsonElement::String(
				"AbK4PO4dConOew4jXt7UcmL9I73z1NA14EgbpBEw8J9ipgjD3i92SakgAv7SFXOE59VlWQ5dw3whqqSzkwoQavWWkDeJep1JzdP4ZyzNFMO7".to_string(),
			),
			"1120"=> JsonElement::String(
				"AROQNb+N33nEk9+C+fCuy0vPwMWzqDcnZP48St2Jm1obAvKux3xZwnq1mdqpZmcUQEUL3USwYoJ80Ef8gmqmFgk=".to_string(),
			),
			"1310"=> JsonElement::Array(vec![]),
			"117"=>  JsonElement::Array(vec![JsonElement::Array(
				vec![
					JsonElement::String(
						"O1RT2Dj--3-0".to_string(),
					),
					JsonElement::String(
						"O1RT2Dj--7-0".to_string(),
					),
				],
			)]),
			"100"=> JsonElement::String(
				"O1RT2Dj--g-0".to_string(),
			),
			"1309"=> JsonElement::Array(vec![]),
			"111"=>  JsonElement::Array(vec![JsonElement::Dict(
				collection! {
					"95"=> JsonElement::String(
						"map-free@tutanota.de".to_string(),
					),
					"96"=> JsonElement::Array(vec![]),
					"93"=> JsonElement::String(
						"0y7Pgw".to_string(),
					),
					"94"=> JsonElement::String(
						"AQLHPJe+eDYk6eRtBsmtpNBGllFzNvfb7gUuMjxsiJGinYAStt4nHO4L1PLChTZL63ifyZd87IqJ7DpVNFkpPNQ=".to_string(),
					),
				},
			)]),
			"105"=> JsonElement::String(
				"AVRYAouCyrii0gGUpQ9TcgbBdzQiFUc8n0I32fO5pA0wk+0i6vNke8uML5vPy09NQEzUiozrSYDl3bEzHCdrD9rjQgvrJhaygZiAF5bv8eX/".to_string(),
			),
			"896"=> JsonElement::String(
				"1720612041643".to_string(),
			),
			"108"=> JsonElement::String(
				"2".to_string(),
			),
			"1395"=> JsonElement::String(
				"0".to_string(),
			),
			"109"=> JsonElement::String(
				"0".to_string(),
			),
			"1346"=> JsonElement::Null,
			"1022"=> JsonElement::Null,
			"1306"=> JsonElement::Array(vec![JsonElement::Dict(
				collection! {
					"95"=> JsonElement::String(
						"bed-free@tutanota.de".to_string(),
					),
					"93"=> JsonElement::String(
						"yPeInQ".to_string(),
					),
					"94"=> JsonElement::String(
						"AcCA59dQjq0y32zLYtBYvZZ84DXe3ftn4fBplPt9KAkdRBauIaKN2jiSqNa7wvcb5TTyeLz7tdTt9sKyM9Y+tx0=".to_string(),
					),
					"96"=> JsonElement::Array(vec![]),
				},
			)]),
			"617"=> JsonElement::Null,
			"866"=> JsonElement::String(
				"".to_string(),
			),
			"115"=> JsonElement::Array(
				vec![],
			),
			"99"=> JsonElement::Array(
				vec![
					JsonElement::String(
						"O1RT1m6-0R-0".to_string(),
					),
					JsonElement::String(
						"O1RT2Dj----0".to_string(),
					),
				],
			),
			"426"=> JsonElement::String(
				"AWv1okmvm7ItO37ubnKytr0kPscHFvpjzzs7P6CeiL8F3H8GWj/lpk20ewECiAg3wfj7sCyajaw1ShWU0D+Qncg=".to_string(),
			),
			"107"=> JsonElement::String(
				"1720612041643".to_string(),
			),
			"587"=> JsonElement::String(
				"O1RT1m4-0s-0".to_string(),
			),
			"466"=> JsonElement::String(
				"".to_string(),
			),
			"1021"=> JsonElement::String(
				"0".to_string(),
			),
			"101"=> JsonElement::String(
				"0".to_string(),
			),
			"1307"=> JsonElement::String(
				"1".to_string(),
			),
			"1346"=> JsonElement::String(
				"AfrN1BgMCYxVksEHHVYnJCMrBK+59cgsu2S84Vvc57YbwV3NvuzFMXq8fMkTZB7vtLBiZdc2ZwLKrxTGwPWqk7w=".to_string(),
			),
			"1308"=>  JsonElement::Array(vec![JsonElement::Array(
				vec![
					JsonElement::String(
						"O1RT1m5-0--0".to_string(),
					),
					JsonElement::String(
						"O1RT2Dk----0".to_string(),
					),
				],
			)]),
		"1465"=> JsonElement::Array(vec![]),}
	}

	fn create_model_value(
		value_type: ValueType,
		encrypted: bool,
		cardinality: Cardinality,
	) -> ModelValue {
		ModelValue {
			id: AttributeId::from(426),
			name: "test".to_string(),
			value_type,
			cardinality,
			is_final: true,
			encrypted,
		}
	}
}
