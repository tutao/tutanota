use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};

use crate::ApiCallError;
use crate::crypto::aes::{aes_128_decrypt, aes_256_decrypt, IV_BYTE_SIZE};
use crate::crypto::entity_facade_test_utils::AesKey;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::element_value::ElementValue::Bool;
use crate::metamodel::{AssociationType, Cardinality, ModelAssociation, ModelValue, TypeModel, ValueType};
use crate::type_model_provider::TypeModelProvider;

/// Provides high level functions to handle encryption/decryption of entities
#[derive(uniffi::Object)]
pub struct EntityFacade {
    type_model_provider: Arc<TypeModelProvider>,
}

impl EntityFacade {
    pub fn new(type_model_provider: Arc<TypeModelProvider>) -> Self {
        EntityFacade {
            type_model_provider
        }
    }
}

impl EntityFacade {
    pub fn decrypt_and_map(&self, type_model: &TypeModel, entity: ParsedEntity, session_key: &AesKey) -> Result<ParsedEntity, ApiCallError> {
        let mut mapped_decrypted: HashMap<String, ElementValue> = Default::default();
        mapped_decrypted.insert("errors".to_string(), ElementValue::Dict(Default::default()));
        mapped_decrypted.insert("final_ivs".to_string(), ElementValue::Dict(Default::default()));
        for (key, model_value) in type_model.values.iter().clone().into_iter() {
            let element_value = self.map_value(entity.clone(), session_key, key, model_value);
            match element_value {
                Ok((decrypted, ivs, errors)) => {
                    mapped_decrypted.insert(key.to_string(), decrypted);
                    mapped_decrypted.get("errors").unwrap().assert_dict().insert(key.to_string(), ElementValue::Dict(errors));
                    mapped_decrypted.get("final_ivs").unwrap().assert_dict().insert(key.to_string(), ElementValue::Dict(ivs))
                }
                Err(err) => return Err(err)
            };
        }

        let model_name = &type_model.name;
        for (association_name, association_model) in type_model.associations.clone().into_iter() {
            let association = self.map_associations(type_model, entity.to_owned(), session_key, model_name, &association_name, association_model);
            match association {
                Ok((mapped_association, errors)) => {
                    mapped_decrypted.insert(association_name.to_string(), mapped_association);
                    mapped_decrypted.get("errors").unwrap().assert_dict().insert(association_name.to_string(), ElementValue::Dict(errors));
                }
                Err(err) => return Err(err)
            }
        }

        Ok(mapped_decrypted)
    }

    fn map_associations(&self, type_model: &TypeModel, entity: ParsedEntity, session_key: &AesKey, model_name: &String, association_name: &String, association_model: ModelAssociation) -> Result<(ElementValue, HashMap<String, ElementValue>), ApiCallError> {
        let mut errors: HashMap<String, ElementValue> = Default::default();
        let dependency = match association_model.dependency {
            Some(dep) => dep,
            None => type_model.app.clone()
        };

        let aggregate_type_model = match self.type_model_provider.get_type_model(&dependency, association_model.ref_type.as_str()) {
            Some(type_model) => type_model,
            // Undefined type model or type ref should be treated as panic as the system isn't
            // capable of dealing with unknown types
            None => return panic!("Undefined type_model {}", association_model.ref_type)
        };

        return if let AssociationType::Aggregation = association_model.association_type {
            let association_data = entity.get(association_name);
            if association_model.cardinality == Cardinality::ZeroOrOne && association_data.is_none() {
                Ok((ElementValue::Null, errors))
            } else if association_data.is_none() {
                Err(ApiCallError::InternalSdkError { error_message: format!("Undefined aggregation {model_name}:{association_name}") })
            } else if association_model.cardinality == Cardinality::Any {
                let mut aggregate_vec: Vec<ElementValue> = Vec::new();
                for aggregate in association_data.unwrap().assert_array().into_iter() {
                    let aggregate_dict = aggregate.assert_dict();
                    let mut decrypted_aggregate = match self.decrypt_and_map(aggregate_type_model, aggregate_dict, session_key) {
                        Ok(dec_aggregate) => dec_aggregate,
                        Err(_) => {
                            // Decryption errors are tolerated, so instead of panicking, we just
                            // collect them for further handling
                            errors.insert(association_name.to_string(), ElementValue::String(format!("Failed to decrypt association {association_name}")));
                            continue;
                        }
                    };

                    // Errors should be grouped inside the top-most object, so they should be
                    // extracted and removed from aggregates
                    if (decrypted_aggregate.get("errors").is_some()) {
                        self.extract_errors(association_name, &mut errors, &mut decrypted_aggregate);
                    }

                    aggregate_vec.push(ElementValue::Dict(decrypted_aggregate));
                }

                Ok((ElementValue::Array(aggregate_vec), errors))
            } else {
                let decrypted_aggregate = match association_data {
                    Some(association) => {
                        if let ElementValue::Null = association {
                            ElementValue::Null
                        } else {
                            let decrypted_aggregate = self.decrypt_and_map(aggregate_type_model, association.assert_dict(), session_key);
                            match decrypted_aggregate {
                                Ok(dec_aggregate) => {
                                    let mut aggregate = dec_aggregate.clone();
                                    self.extract_errors(association_name, &mut errors, &mut aggregate);
                                    ElementValue::Dict(aggregate)
                                }
                                Err(_) => {
                                    return Err(ApiCallError::InternalSdkError { error_message: format!("Failed to decrypt association {association_name}") });
                                }
                            }
                        }
                    }
                    None => ElementValue::Null
                };

                Ok((decrypted_aggregate, errors))
            }
        } else {
            let value = entity.get(association_name).unwrap_or(&ElementValue::Null);
            Ok((value.clone(), errors))
        };
    }

    fn extract_errors(&self, association_name: &String, errors: &mut HashMap<String, ElementValue>, dec_aggregate: &mut ParsedEntity) {
        if dec_aggregate.get("errors").is_some() {
            errors.insert(association_name.to_string(), ElementValue::Dict(dec_aggregate.get("errors").unwrap().assert_dict()));
            dec_aggregate.remove("errors");
        }
    }

    fn map_value(&self, entity: ParsedEntity, session_key: &AesKey, key: &String, model_value: &ModelValue) -> Result<(ElementValue, HashMap<String, ElementValue>, HashMap<String, ElementValue>), ApiCallError> {
        let mut final_ivs: HashMap<String, ElementValue> = Default::default();
        let mut errors: HashMap<String, ElementValue> = Default::default();

        let value = entity.get(key.as_str()).unwrap_or_else(|| &ElementValue::Null);

        if model_value.encrypted && model_value.is_final && value != &ElementValue::Null {
            final_ivs.insert(key.to_string(), ElementValue::Bytes(self.extract_iv(value.assert_bytes().as_slice()).to_vec()));
        }

        if value == &ElementValue::Null {
            if model_value.cardinality != Cardinality::ZeroOrOne {
                return Err(ApiCallError::InternalSdkError { error_message: format!("Value {key} with cardinality ONE can't be null") });
            }

            return Ok((ElementValue::Null, final_ivs, errors));
        } else if model_value.cardinality == Cardinality::One && value == &ElementValue::String(String::new()) {
            return Ok((self.resolve_default_value(model_value.value_type.to_owned()), final_ivs, errors));
        }

        if model_value.encrypted {
            let decrypted_value = match session_key {
                AesKey::Aes128(k) => aes_128_decrypt(k, value.assert_bytes().as_slice()),
                AesKey::Aes256(k) => aes_256_decrypt(k, value.assert_bytes().as_slice())
            };

            let element_value = match decrypted_value {
                Ok(value) => {
                    let decrypted_value = self.parse_decrypted_value(model_value.value_type.to_owned(), value.as_slice());

                    match decrypted_value {
                        Ok(value) => {
                            if !model_value.is_final && value == ElementValue::String("".to_string()) {
                                final_ivs.insert(key.to_string(), ElementValue::Bytes(self.extract_iv(value.assert_bytes().as_slice()).to_vec()));
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

            return Ok((element_value, final_ivs, errors));
        }

        return Ok((value.clone(), final_ivs, errors));
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
            ValueType::Date => ElementValue::Date(SystemTime::UNIX_EPOCH),
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
                Ok(ElementValue::Date(SystemTime::UNIX_EPOCH + Duration::from_millis(u64::from_be_bytes(bytes))))
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
            ValueType::CompressedString => Ok(ElementValue::String(String::from_utf8_lossy(bytes).to_string())),
            _ => panic!("Failed to parse bytes into ElementValue")
        };
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rand::random;

    use crate::crypto::aes::{Aes256Key, Iv};
    use crate::crypto::entity_facade::{AesKey, EntityFacade};
    use crate::crypto::entity_facade_test_utils::generate_email_entity;
    use crate::type_model_provider::init_type_model_provider;
    use crate::TypeRef;

    #[test]
    fn test_decrypt_mail() {
        let sk = AesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
        let iv = Iv::from_bytes(random::<[u8; 16]>());

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
            app: "tutanota".to_owned(),
            type_: "Mail".to_owned(),
        };

        let type_model = type_model_provider.get_type_model(&type_ref.app, &type_ref.type_)
            .unwrap();

        let decrypted_mail = entity_facade.decrypt_and_map(type_model, encrypted_mail, &sk).unwrap();

        assert_eq!(decrypted_mail.get("receivedDate").unwrap(), original_mail.get("receivedDate").unwrap());
        assert_eq!(decrypted_mail.get("sentDate").unwrap(), original_mail.get("sentDate").unwrap());
        assert_eq!(decrypted_mail.get("confidential").unwrap(), original_mail.get("confidential").unwrap());
        assert_eq!(decrypted_mail.get("subject").unwrap(), original_mail.get("subject").unwrap());
        assert_eq!(decrypted_mail.get("sender").unwrap().assert_dict().get("name").unwrap(), original_mail.get("sender").unwrap().assert_dict().get("name").unwrap());
        assert_eq!(decrypted_mail.get("sender").unwrap().assert_dict().get("address").unwrap(), original_mail.get("sender").unwrap().assert_dict().get("address").unwrap());
        assert_eq!(decrypted_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("name").unwrap(), original_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("name").unwrap());
        assert_eq!(decrypted_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("address").unwrap(), original_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("address").unwrap());
    }
}