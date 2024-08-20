#![allow(unused)] // TODO: Remove this when implementing the crypto entity client
use std::borrow::Borrow;
use std::collections::HashMap;
use std::fmt::format;
use std::sync::Arc;
use std::time::SystemTime;

use crate::ApiCallError;
use crate::crypto::crypto_facade::ResolvedSessionKey;
use crate::crypto::{IV_BYTE_SIZE, PlaintextAndIv};
use crate::date::DateTime;
use crate::crypto::key::GenericAesKey;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::element_value::ElementValue::Bool;
use crate::entities::Errors;
use crate::metamodel::{AssociationType, Cardinality, ModelAssociation, ModelValue, TypeModel, ValueType};
use crate::type_model_provider::TypeModelProvider;

/// Provides high level functions to handle encryption/decryption of entities
#[derive(uniffi::Object)]
pub struct EntityFacade {
    type_model_provider: Arc<TypeModelProvider>,
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
impl EntityFacade {
    pub fn new(type_model_provider: Arc<TypeModelProvider>) -> Self {
        EntityFacade {
            type_model_provider
        }
    }
    pub fn decrypt_and_map(&self, type_model: &TypeModel, mut entity: ParsedEntity, resolved_session_key: ResolvedSessionKey) -> Result<ParsedEntity, ApiCallError> {
        let mut mapped_decrypted = self.decrypt_and_map_inner(&type_model, entity, &resolved_session_key.session_key)?;
        mapped_decrypted.insert("_ownerEncSessionKey".to_owned(), ElementValue::Bytes(resolved_session_key.owner_enc_session_key.clone()));
        Ok(mapped_decrypted)
    }

    fn decrypt_and_map_inner(&self, type_model: &TypeModel, mut entity: ParsedEntity, session_key: &GenericAesKey) -> Result<ParsedEntity, ApiCallError> {
        let mut mapped_decrypted: HashMap<String, ElementValue> = Default::default();
        let mut mapped_errors: Errors = Default::default();
        let mut mapped_ivs: HashMap<String, ElementValue> = Default::default();

        for (&key, model_value) in type_model.values.iter() {
            let stored_element = entity.remove(key).unwrap_or_else(|| ElementValue::Null);
            let MappedValue {value, iv, error } = self.map_value(stored_element, session_key, key, model_value)?;

            mapped_decrypted.insert(key.to_string(), value);
            if let Some(error) = error {
                mapped_errors.insert(key.to_string(), ElementValue::String(error));
            }
            if iv.is_some() {
                mapped_ivs.insert(key.to_string(), ElementValue::Bytes(iv.unwrap().to_vec()));
            }
        }

        for (&association_name, association_model) in type_model.associations.iter() {
            let association_entry = entity.remove(association_name).unwrap_or(ElementValue::Null);
            let (mapped_association, errors) = self.map_associations(type_model, association_entry, &session_key, &association_name, association_model)?;

            mapped_decrypted.insert(association_name.to_string(), mapped_association);
            if !errors.is_empty() {
                mapped_errors.insert(association_name.to_string(), ElementValue::Dict(errors));
            }
        }

        if type_model.encrypted {
            mapped_decrypted.insert("_errors".to_string(), ElementValue::Dict(mapped_errors));
            mapped_decrypted.insert("_finalIvs".to_string(), ElementValue::Dict(mapped_ivs));
        }
        Ok(mapped_decrypted)
    }

    fn map_associations(&self, type_model: &TypeModel, association_data: ElementValue, session_key: &GenericAesKey, association_name: &str, association_model: &ModelAssociation) -> Result<(ElementValue, Errors), ApiCallError> {
        let mut errors: Errors = Default::default();
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
                                let mut decrypted_aggregate = self.decrypt_and_map_inner(aggregate_type_model, entity, session_key)?;

                                // Errors should be grouped inside the top-most object, so they should be
                                // extracted and removed from aggregates
                                if decrypted_aggregate.get("_errors").is_some() {
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
                    let decrypted_aggregate = self.decrypt_and_map_inner(aggregate_type_model, dict, session_key);
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

    fn extract_errors(&self, association_name: &str, errors: &mut Errors, dec_aggregate: &mut ParsedEntity) {
        match dec_aggregate.remove("errors") {
            Some(ElementValue::Dict(err_dict)) => {
                if !err_dict.is_empty() {
                    errors.insert(association_name.to_string(), ElementValue::Dict(err_dict));
                }
            }
            _ => ()
        }
    }

    fn map_value(&self, value: ElementValue, session_key: &GenericAesKey, key: &str, model_value: &ModelValue) -> Result<MappedValue, ApiCallError> {
        match (&model_value.cardinality, &model_value.encrypted, value) {
            (Cardinality::One | Cardinality::ZeroOrOne, true, ElementValue::String(s)) if s == "" => {
                // If the value is default-encrypted (empty string) then return default value and
                // empty IV. When re-encrypting we should put the empty value back to not increase
                // used storage.
                let value = self.resolve_default_value(&model_value.value_type);
                return Ok(MappedValue {
                    value,
                    iv: Some(Vec::new()),
                    error: None,
                });
            }
            (Cardinality::ZeroOrOne, _, ElementValue::Null) => {
                // If it's null, and it's permissible then we keep it as such
                Ok(MappedValue {value: ElementValue::Null, iv: None, error: None})
            },
            (Cardinality::One | Cardinality::ZeroOrOne, true, ElementValue::Bytes(bytes)) => {
                // If it's a proper encrypted value then we need to decrypt it, parse it and
                // possibly record the IV.
                let PlaintextAndIv { data: plaintext, iv } = session_key.decrypt_data_and_iv(bytes.as_slice())
                    .map_err(|e| ApiCallError::InternalSdkError { error_message: e.to_string() })?;

                match self.parse_decrypted_value(model_value.value_type.to_owned(), plaintext) {
                    Ok(value) => {
                        // We want to ensure we use the same IV for final encrypted values, as this
                        // will guarantee we get the same value back when we encrypt it.
                        let iv = if model_value.is_final { Some(iv.to_vec()) } else { None };
                        Ok(MappedValue {value, iv, error: None})
                    },
                    Err(err) => {
                        Ok(MappedValue {
                            value: self.resolve_default_value(&model_value.value_type),
                            iv: None,
                            error: Some(format!("Failed to decrypt {key}. {err}")),
                        })
                    }
                }
            },
            (Cardinality::One | Cardinality::ZeroOrOne, false, value) => {
                Ok(MappedValue { value, iv: None, error: None })
            },
            _ => Err(ApiCallError::internal(format!("Invalid value/cardinality combination for key `{key}`")))
        }
    }

    fn resolve_default_value(&self, value_type: &ValueType) -> ElementValue {
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

    fn parse_decrypted_value(&self, value_type: ValueType, bytes: Vec<u8>) -> Result<ElementValue, ApiCallError> {
        return match value_type {
            ValueType::String => {
                let string = String::from_utf8(bytes)
                    .map_err(|e| ApiCallError::internal_with_err(e, "Invalid string"))?;
                Ok(ElementValue::String(string))
            },
            ValueType::Number => {
                if bytes.len().eq(&0) {
                    return Ok(ElementValue::Null);
                } else {
                    // Encrypted numbers are encrypted strings.
                    let string = String::from_utf8(bytes)
                        .map_err(|e| ApiCallError::internal_with_err(e, "Invalid string"))?;
                    let number = string.parse()
                        .map_err(|e| ApiCallError::internal_with_err(e, "Invalid number"))?;

                    Ok(ElementValue::Number(number))
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
                let value = if bytes.eq("1".as_bytes()) {
                    true
                } else if bytes.eq("0".as_bytes()) {
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
    use std::time::SystemTime;

    use rand::random;
    use crate::crypto::{Aes256Key, Iv, IV_BYTE_SIZE};

    use crate::crypto::key::GenericAesKey;
    use crate::date::DateTime;
    use crate::element_value::{ElementValue, ParsedEntity};
    use crate::entities::entity_facade::EntityFacade;
    use crate::type_model_provider::init_type_model_provider;
    use crate::{collection, IdTuple, TypeRef};
    use crate::crypto::crypto_facade::ResolvedSessionKey;
    use crate::entities::Entity;
    use crate::entities::tutanota::Mail;
    use crate::generated_id::GeneratedId;
    use crate::instance_mapper::InstanceMapper;
    use crate::json_element::{JsonElement, RawEntity};
    use crate::json_serializer::JsonSerializer;

    #[test]
    fn test_decrypt_mail() {
        let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(vec![83, 168, 168, 203, 48, 91, 246, 102, 175, 252, 39, 110, 36, 141, 4, 216, 135, 201, 226, 134, 182, 175, 15, 152, 117, 216, 81, 1, 120, 134, 116, 143].as_slice()).unwrap());
        let owner_enc_session_key = vec![0, 1, 2];
        let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
        let type_model_provider = Arc::new(init_type_model_provider());
        let raw_entity: RawEntity = make_json_entity();
        let json_serializer = JsonSerializer::new(type_model_provider.clone());
        let encrypted_mail: ParsedEntity = json_serializer.parse(&Mail::type_ref(), raw_entity).unwrap();

        let entity_facade = EntityFacade::new(Arc::clone(&type_model_provider));
        let type_ref = Mail::type_ref();
        let type_model = type_model_provider.get_type_model(&type_ref.app, &type_ref.type_)
            .unwrap();

        let decrypted_mail = entity_facade.decrypt_and_map(type_model, encrypted_mail, ResolvedSessionKey { session_key: sk, owner_enc_session_key }).unwrap();
        let instance_mapper = InstanceMapper::new();
        let mail: Mail = instance_mapper.parse_entity(decrypted_mail.clone()).unwrap();

        assert_eq!(&DateTime::from_millis(1720612041643), decrypted_mail.get("receivedDate").unwrap().assert_date());
        assert_eq!(true, decrypted_mail.get("confidential").unwrap().assert_bool());
        assert_eq!("Html email features", decrypted_mail.get("subject").unwrap().assert_str());
        assert_eq!("Matthias", decrypted_mail.get("sender").unwrap().assert_dict().get("name").unwrap().assert_str());
        assert_eq!("map-free@tutanota.de", decrypted_mail.get("sender").unwrap().assert_dict().get("address").unwrap().assert_str());
        assert!(decrypted_mail.get("attachments").unwrap().assert_array().is_empty());
        assert_eq!(
            decrypted_mail
                .get("_finalIvs")
                .expect("has_final_ivs")
                .assert_dict()
                .get("subject")
                .expect("has_subject")
                .assert_bytes(),
            vec![0x54, 0x58, 0x02, 0x8b, 0x82, 0xca, 0xb8, 0xa2, 0xd2, 0x01, 0x94, 0xa5, 0x0f, 0x53, 0x72, 0x06],
        );
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
            "sets"=> JsonElement::Array(vec![]),
        }
    }
}
