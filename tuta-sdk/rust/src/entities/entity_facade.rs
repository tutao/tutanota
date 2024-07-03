#![allow(unused)] // TODO: Remove this when implementing the crypto entity client
use std::borrow::Borrow;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::SystemTime;

use crate::ApiCallError;
use crate::crypto::IV_BYTE_SIZE;
use crate::date::DateTime;
use crate::crypto::key::GenericAesKey;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::element_value::ElementValue::Bool;
use crate::metamodel::{AssociationType, Cardinality, ModelAssociation, ModelValue, TypeModel, ValueType};
use crate::type_model_provider::TypeModelProvider;

/// Provides high level functions to handle encryption/decryption of entities
#[derive(uniffi::Object)]
pub struct EntityFacade {
    type_model_provider: Arc<TypeModelProvider>,
}

#[cfg_attr(test, mockall::automock)]
impl EntityFacade {
    pub fn new(type_model_provider: Arc<TypeModelProvider>) -> Self {
        EntityFacade {
            type_model_provider
        }
    }
    pub fn decrypt_and_map(&self, type_model: &TypeModel, mut entity: ParsedEntity, session_key: &GenericAesKey) -> Result<ParsedEntity, ApiCallError> {
        let mut mapped_decrypted: HashMap<String, ElementValue> = Default::default();
        let mut mapped_errors: HashMap<String, ElementValue> = Default::default();
        let mut mapped_ivs: HashMap<String, ElementValue> = Default::default();

        for (&key, model_value) in type_model.values.iter() {
            let stored_element = entity.remove(key).unwrap_or_else(|| ElementValue::Null);
            let (decrypted, ivs, errors) = self.map_value(stored_element, session_key, key, model_value)?;

            mapped_decrypted.insert(key.to_string(), decrypted);
            if errors.is_some() {
                mapped_errors.insert(key.to_string(), ElementValue::Dict(errors.unwrap()));
            }
            if ivs.is_some() {
                mapped_ivs.insert(key.to_string(), ElementValue::Bytes(ivs.unwrap().to_vec()));
            }
        }

        for (&association_name, association_model) in type_model.associations.iter() {
            let association_entry = entity.remove(association_name).unwrap_or(ElementValue::Null);
            let (mapped_association, errors) = self.map_associations(type_model, association_entry, session_key, &association_name, association_model)?;

            mapped_decrypted.insert(association_name.to_string(), mapped_association);
            mapped_errors.insert(association_name.to_string(), ElementValue::Dict(errors));
        }

        mapped_decrypted.insert("errors".to_string(), ElementValue::Dict(mapped_errors));
        mapped_decrypted.insert("final_ivs".to_string(), ElementValue::Dict(mapped_ivs));
        Ok(mapped_decrypted)
    }

    fn map_associations(&self, type_model: &TypeModel, association_data: ElementValue, session_key: &GenericAesKey, association_name: &str, association_model: &ModelAssociation) -> Result<(ElementValue, HashMap<String, ElementValue>), ApiCallError> {
        let mut errors: HashMap<String, ElementValue> = Default::default();
        let dependency = match association_model.dependency {
            Some(ref dep) => dep,
            None => type_model.app
        };

        let aggregate_type_model = match self.type_model_provider.get_type_model(dependency, association_model.ref_type) {
            Some(type_model) => type_model,
            // Undefined type model or type ref should be treated as panic as the system isn't
            // capable of dealing with unknown types
            None => panic!("Undefined type_model {}", association_model.ref_type)
        };

        return if let AssociationType::Aggregation = association_model.association_type {
            match (association_data, association_model.cardinality.borrow()) {
                (ElementValue::Null, Cardinality::ZeroOrOne) => Ok((ElementValue::Null, errors)),
                (ElementValue::Null, Cardinality::One) => Err(ApiCallError::InternalSdkError { error_message: format!("Value {association_name} with cardinality ONE can't be null") }),
                (ElementValue::Array(arr), Cardinality::Any) => {
                    let mut aggregate_vec: Vec<ElementValue> = Vec::with_capacity(arr.len());
                    for (index, aggregate) in arr.into_iter().enumerate() {
                        match aggregate {
                            ElementValue::Dict(entity) => {
                                let mut decrypted_aggregate = self.decrypt_and_map(aggregate_type_model, entity, session_key)?;

                                // Errors should be grouped inside the top-most object, so they should be
                                // extracted and removed from aggregates
                                if decrypted_aggregate.get("errors").is_some() {
                                    let error_key = &format!("{}_{}", association_name, index);
                                    self.extract_errors(error_key, &mut errors, &mut decrypted_aggregate);
                                }

                                aggregate_vec.push(ElementValue::Dict(decrypted_aggregate));
                            }
                            _ => return Err(ApiCallError::InternalSdkError { error_message: format!("Invalid aggregate format. {} isn't a dict", association_name) })
                        }
                    };

                    Ok((ElementValue::Array(aggregate_vec), errors))
                }
                (ElementValue::Dict(dict), Cardinality::One | Cardinality::ZeroOrOne) => {
                    let decrypted_aggregate = self.decrypt_and_map(aggregate_type_model, dict, session_key);
                    match decrypted_aggregate {
                        Ok(mut dec_aggregate) => {
                            self.extract_errors(association_name, &mut errors, &mut dec_aggregate);
                            Ok((ElementValue::Dict(dec_aggregate), errors))
                        }
                        Err(_) => {
                            return Err(ApiCallError::InternalSdkError { error_message: format!("Failed to decrypt association {association_name}") });
                        }
                    }
                }
                _ => Err(ApiCallError::InternalSdkError { error_message: format!("Invalid association {association_name}") })
            }
        } else {
            Ok((association_data, errors))
        };
    }

    fn extract_errors(&self, association_name: &str, errors: &mut HashMap<String, ElementValue>, dec_aggregate: &mut ParsedEntity) {
        match dec_aggregate.remove("errors") {
            Some(ElementValue::Dict(err_dict)) => {
                errors.insert(association_name.to_string(), ElementValue::Dict(err_dict));
            }
            _ => ()
        }
    }

    fn map_value(&self, value: ElementValue, session_key: &GenericAesKey, key: &str, model_value: &ModelValue) -> Result<(ElementValue, Option<[u8; IV_BYTE_SIZE]>, Option<HashMap<String, ElementValue>>), ApiCallError> {
        let mut final_iv: Option<[u8; IV_BYTE_SIZE]> = None;

        if model_value.encrypted && model_value.is_final {
            match &value {
                ElementValue::Bytes(bytes) => final_iv = Some(self.extract_iv(bytes.as_slice())),
                ElementValue::Null => (),
                _ => return Err(ApiCallError::InternalSdkError { error_message: format!("Invalid encrypted data {key}. Not bytes") })
            };
        }

        if value == ElementValue::Null {
            if model_value.cardinality != Cardinality::ZeroOrOne {
                return Err(ApiCallError::InternalSdkError { error_message: format!("Value {key} with cardinality ONE can't be null") });
            }

            return Ok((ElementValue::Null, final_iv, None));
        } else if model_value.cardinality == Cardinality::One && value == ElementValue::String(String::new()) {
            return Ok((self.resolve_default_value(model_value.value_type.to_owned()), final_iv, None));
        }

        if model_value.encrypted {
            let decrypted_value = session_key.decrypt_data(value.assert_bytes().as_slice());

            let mut errors: HashMap<String, ElementValue> = Default::default();
            let element_value = match decrypted_value {
                Ok(value) => {
                    let decrypted_value = self.parse_decrypted_value(model_value.value_type.to_owned(), value.as_slice());

                    match decrypted_value {
                        Ok(value) => {
                            if !model_value.is_final && value == ElementValue::String("".to_string()) {
                                final_iv = Some(self.extract_iv(value.assert_bytes().as_slice()));
                            }
                            value
                        }
                        Err(err) => {
                            errors.insert(key.to_string(), ElementValue::String(format!("Failed to decrypt {key}. {err}")));
                            self.resolve_default_value(model_value.value_type.to_owned())
                        }
                    }
                }
                Err(err) => {
                    errors.insert(key.to_string(), ElementValue::String(format!("Failed to decrypt {key}. {err}")));
                    self.resolve_default_value(model_value.value_type.to_owned())
                }
            };

            Ok((element_value, final_iv, Some(errors)))
        } else {
            Ok((value, final_iv, None))
        }
    }

    fn extract_iv(&self, encrypted_data: &[u8]) -> [u8; IV_BYTE_SIZE] {
        let mut iv_bytes: [u8; IV_BYTE_SIZE] = Default::default();
        iv_bytes.clone_from_slice(&encrypted_data[0..IV_BYTE_SIZE]);
        iv_bytes
    }

    fn resolve_default_value(&self, value_type: ValueType) -> ElementValue {
        return match value_type {
            ValueType::String => ElementValue::String(String::new()),
            ValueType::Number => ElementValue::Number(0),
            ValueType::Bytes => ElementValue::Bytes(Vec::new()),
            ValueType::Date => ElementValue::Date(DateTime::new(SystemTime::UNIX_EPOCH)),
            ValueType::Boolean => Bool(false),
            ValueType::CompressedString => ElementValue::String(String::new()),
            _ => panic!("Invalid type")
        };
    }

    fn parse_decrypted_value(&self, value_type: ValueType, bytes: &[u8]) -> Result<ElementValue, ApiCallError> {
        return match value_type {
            ValueType::String => Ok(ElementValue::String(String::from_utf8_lossy(bytes).to_string())),
            ValueType::Number => {
                if bytes.len().eq(&0) {
                    return Ok(ElementValue::Null);
                } else {
                    let bytes = match bytes.try_into() {
                        Ok(bytes) => bytes,
                        Err(_) => return Err(ApiCallError::InternalSdkError { error_message: "Failed to parse bytes slice".to_string() })
                    };
                    Ok(ElementValue::Number(i64::from_be_bytes(bytes)))
                }
            }
            ValueType::Bytes => Ok(ElementValue::Bytes(bytes.to_vec())),
            ValueType::Date => {
                let bytes = match bytes.try_into() {
                    Ok(bytes) => bytes,
                    Err(_) => return Err(ApiCallError::InternalSdkError { error_message: "Failed to parse bytes slice".to_string() })
                };
                Ok(ElementValue::Date(DateTime::from_millis(u64::from_be_bytes(bytes))))
            }
            ValueType::Boolean => {
                let value = if bytes.eq(&[0x01]) {
                    true
                } else if bytes.eq(&[0x00]) {
                    false
                } else {
                    return Err(ApiCallError::InternalSdkError { error_message: "Failed to parse boolean bytes".to_string() });
                };

                Ok(Bool(value))
            }
            ValueType::CompressedString => unimplemented!("compressed string"),
            _ => panic!("Failed to parse bytes into ElementValue")
        };
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rand::random;

    use crate::crypto::{Aes256Key, Iv};
    use crate::crypto::key::GenericAesKey;
    use crate::entities::entity_facade::EntityFacade;
    use crate::util::entity_test_utils::{assert_decrypted_mail, generate_email_entity};
    use crate::type_model_provider::init_type_model_provider;
    use crate::TypeRef;

    #[test]
    fn test_decrypt_mail() {
        let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
        let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();

        let (encrypted_mail, original_mail) = generate_email_entity(
            None,
            &sk,
            &iv,
            false,
            "Subject".to_string(),
            "Sender".to_string(),
            "Recipient".to_string(),
        );

        let type_model_provider = Arc::new(init_type_model_provider());
        let entity_facade = EntityFacade::new(Arc::clone(&type_model_provider));

        let type_ref = TypeRef {
            app: "tutanota",
            type_: "Mail",
        };

        let type_model = type_model_provider.get_type_model(&type_ref.app, &type_ref.type_)
            .unwrap();

        let decrypted_mail = entity_facade.decrypt_and_map(type_model, encrypted_mail, &sk).unwrap();

        assert_decrypted_mail(&decrypted_mail, &original_mail);
    }
}