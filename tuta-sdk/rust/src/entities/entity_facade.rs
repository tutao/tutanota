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

pub type Errors = HashMap<String, ElementValue>;

#[cfg_attr(test, mockall::automock)]
impl EntityFacade {
    pub fn new(type_model_provider: Arc<TypeModelProvider>) -> Self {
        EntityFacade {
            type_model_provider
        }
    }
    pub fn decrypt_and_map(&self, type_model: &TypeModel, mut entity: ParsedEntity, session_key: &GenericAesKey) -> Result<ParsedEntity, ApiCallError> {
        log::debug!("EntityFacade: decrypt_and_map: entity: {:#?}", entity);
        log::debug!("EntityFacade: decrypt_and_map: session_key: {:?}", session_key.as_bytes());

        let mut mapped_decrypted: HashMap<String, ElementValue> = Default::default();
        let mut mapped_errors: Errors = Default::default();
        let mut mapped_ivs: HashMap<String, ElementValue> = Default::default();

        for (&key, model_value) in type_model.values.iter() {
            let stored_element = entity.remove(key).unwrap_or_else(|| ElementValue::Null);
            let (decrypted, ivs, error) = self.map_value(stored_element, session_key, key, model_value)?;

            mapped_decrypted.insert(key.to_string(), decrypted);
            if let Some(error) = error {
                mapped_errors.insert(key.to_string(), ElementValue::String(error));
            }
            if ivs.is_some() {
                mapped_ivs.insert(key.to_string(), ElementValue::Bytes(ivs.unwrap().to_vec()));
            }
        }

        for (&association_name, association_model) in type_model.associations.iter() {
            let association_entry = entity.remove(association_name).unwrap_or(ElementValue::Null);
            let (mapped_association, errors) = self.map_associations(type_model, association_entry, session_key, &association_name, association_model)?;

            mapped_decrypted.insert(association_name.to_string(), mapped_association);
            if !errors.is_empty() {
                mapped_errors.insert(association_name.to_string(), ElementValue::Dict(errors));
            }
        }

        mapped_decrypted.insert("errors".to_string(), ElementValue::Dict(mapped_errors));
        // mapped_decrypted.insert("final_ivs".to_string(), ElementValue::Dict(mapped_ivs));
        Ok(mapped_decrypted)
    }

    fn map_associations(&self, type_model: &TypeModel, association_data: ElementValue, session_key: &GenericAesKey, association_name: &str, association_model: &ModelAssociation) -> Result<(ElementValue, Errors), ApiCallError> {
        log::debug!("EntityFacade: map_associations 0: name: {}", association_name);
        println!("EntityFacade: map_associations 0: name: {}", association_name);
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

    fn map_value(&self, value: ElementValue, session_key: &GenericAesKey, key: &str, model_value: &ModelValue) -> Result<(ElementValue, Option<[u8; IV_BYTE_SIZE]>, Option<String>), ApiCallError> {
        log::debug!("EntityFacade: map_value 0: name: {}", key);
        println!("EntityFacade: map_value 0: name: {}", key);

        let final_iv: Option<[u8; IV_BYTE_SIZE]> = if model_value.encrypted && model_value.is_final {
            match &value {
                ElementValue::Bytes(bytes) => Some(self.extract_iv(bytes.as_slice())),
                ElementValue::Null => None,
                ElementValue::String(s) if s == "" => return Ok((self.resolve_default_value(&model_value.value_type), None, None)),
                _ => return Err(ApiCallError::InternalSdkError { error_message: format!("Invalid encrypted data {key}. Not bytes, value: {:?}", value) })
            }
        } else {
            None
        };

        if value == ElementValue::Null {
            if model_value.cardinality != Cardinality::ZeroOrOne {
                return Err(ApiCallError::InternalSdkError { error_message: format!("Value {key} with cardinality ONE can't be null") });
            }

            return Ok((ElementValue::Null, final_iv, None));
        } else if model_value.cardinality == Cardinality::One && value == ElementValue::String(String::new()) {
            return Ok((self.resolve_default_value(&model_value.value_type), final_iv, None));
        }

        if model_value.encrypted {
            let decrypted_value = session_key.decrypt_data(value.assert_bytes().as_slice())
                .map_err(|e| ApiCallError::InternalSdkError { error_message: e.to_string() });

            match decrypted_value {
                Ok(dec_value) => {
                    match self.parse_decrypted_value(model_value.value_type.to_owned(), dec_value) {
                        Ok(p_dec_value) => {
                            let final_iv = if !model_value.is_final && p_dec_value != ElementValue::String(String::new()) {
                                Some(self.extract_iv(p_dec_value.assert_bytes().as_slice()))
                            } else { None };
                            Ok((p_dec_value, final_iv, None))
                        }
                        Err(err) => {
                            Ok((self.resolve_default_value(&model_value.value_type), None, Some(format!("Failed to decrypt {key}. {err}"))))
                        }
                    }
                }
                Err(err) => {
                    Ok((self.resolve_default_value(&model_value.value_type), None, Some(format!("Failed to decrypt {key}. {err}"))))
                }
            }
        } else {
            Ok((value, final_iv, None))
        }
    }

    fn extract_iv(&self, encrypted_data: &[u8]) -> [u8; IV_BYTE_SIZE] {
        let mut iv_bytes: [u8; IV_BYTE_SIZE] = Default::default();
        iv_bytes.clone_from_slice(&encrypted_data[0..IV_BYTE_SIZE]);
        iv_bytes
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
    use wasm_bindgen_futures::js_sys::Array;
    use crate::crypto::{Aes256Key, Iv};

    use crate::crypto::key::GenericAesKey;
    use crate::date::DateTime;
    use crate::element_value::{ElementValue, ParsedEntity};
    use crate::entities::entity_facade::EntityFacade;
    use crate::util::entity_test_utils::{assert_decrypted_mail, generate_email_entity};
    use crate::type_model_provider::init_type_model_provider;
    use crate::{IdTuple, TypeRef};
    use crate::entities::Entity;
    use crate::entities::tutanota::Mail;
    use crate::generated_id::GeneratedId;
    use crate::instance_mapper::InstanceMapper;
    use crate::json_element::{JsonElement, RawEntity};
    use crate::json_serializer::JsonSerializer;

    macro_rules! collection {
        // map-like
        ($($k:expr => $v:expr),* $(,)?) => {{
            core::convert::From::from([$(($k.to_string(), $v),)*])
        }};
        // set-like
        ($($v:expr),* $(,)?) => {{
            core::convert::From::from([$($v,)*])
        }};
    }

    #[test]
    fn test_decrypt_mail() {
        let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(vec![83, 168, 168, 203, 48, 91, 246, 102, 175, 252, 39, 110, 36, 141, 4, 216, 135, 201, 226, 134, 182, 175, 15, 152, 117, 216, 81, 1, 120, 134, 116, 143].as_slice()).unwrap());
        let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
        let type_model_provider = Arc::new(init_type_model_provider());
        let raw_entity: RawEntity = make_json_entity();
        let json_serializer = JsonSerializer::new(type_model_provider.clone());
        let encrypted_mail: ParsedEntity = json_serializer.parse(&Mail::type_ref(), raw_entity).unwrap();
        // let encrypted_mail: ParsedEntity = make_email_entity();

        // let (encrypted_mail, original_mail) = generate_email_entity(
        //     None,
        //     &sk,
        //     &iv,
        //     false,
        //     "Subject".to_string(),
        //     "Sender".to_string(),
        //     "Recipient".to_string(),
        // );

        let entity_facade = EntityFacade::new(Arc::clone(&type_model_provider));

        let type_ref = Mail::type_ref();

        let type_model = type_model_provider.get_type_model(&type_ref.app, &type_ref.type_)
            .unwrap();

        let decrypted_mail = entity_facade.decrypt_and_map(type_model, encrypted_mail, &sk).unwrap();

        println!("{:#?}", decrypted_mail);

        let instance_mapper = InstanceMapper::new();
        let mail: Mail = instance_mapper.parse_entity(decrypted_mail).unwrap();

        println!("mail: {:#?}", mail);

        // assert_eq!(decrypted_mail.get("receivedDate").unwrap(), original_mail.get("receivedDate").unwrap());
        // assert_eq!(decrypted_mail.get("sentDate").unwrap(), original_mail.get("sentDate").unwrap());
        // assert_eq!(decrypted_mail.get("confidential").unwrap(), original_mail.get("confidential").unwrap());
        // assert_eq!(decrypted_mail.get("subject").unwrap(), original_mail.get("subject").unwrap());
        // assert_eq!(decrypted_mail.get("sender").unwrap().assert_dict().get("name").unwrap(), original_mail.get("sender").unwrap().assert_dict().get("name").unwrap());
        // assert_eq!(decrypted_mail.get("sender").unwrap().assert_dict().get("address").unwrap(), original_mail.get("sender").unwrap().assert_dict().get("address").unwrap());
        // assert_eq!(decrypted_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("name").unwrap(), original_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("name").unwrap());
        // assert_eq!(decrypted_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("address").unwrap(), original_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("address").unwrap());
    }

    fn make_email_entity() -> ParsedEntity {
        let entity: ParsedEntity = collection! {
            "movedTime"=> ElementValue::Date(
                DateTime::from_millis(1720612041)
            ),
            "_id"=> ElementValue::IdTupleId(
                IdTuple {
                    list_id: GeneratedId("O1RT1m6-0R-0".to_string()),
                    element_id: GeneratedId("O1RT2Dj----0".to_string()),
                }
            ),
            "confidential"=> ElementValue::Bytes(
                vec![
                    1,
                    107,
                    245,
                    162,
                    73,
                    175,
                    155,
                    178,
                    45,
                    59,
                    126,
                    238,
                    110,
                    114,
                    178,
                    182,
                    189,
                    36,
                    62,
                    199,
                    7,
                    22,
                    250,
                    99,
                    207,
                    59,
                    59,
                    63,
                    160,
                    158,
                    136,
                    191,
                    5,
                    220,
                    127,
                    6,
                    90,
                    63,
                    229,
                    166,
                    77,
                    180,
                    123,
                    1,
                    2,
                    136,
                    8,
                    55,
                    193,
                    248,
                    251,
                    176,
                    44,
                    154,
                    141,
                    172,
                    53,
                    74,
                    21,
                    148,
                    208,
                    63,
                    144,
                    157,
                    200,
                ],
            ),
            "_ownerEncSessionKey"=> ElementValue::Bytes(
                vec![
                    1,
                    178,
                    184,
                    60,
                    238,
                    29,
                    10,
                    137,
                    206,
                    123,
                    14,
                    35,
                    94,
                    222,
                    212,
                    114,
                    98,
                    253,
                    35,
                    189,
                    243,
                    212,
                    208,
                    53,
                    224,
                    72,
                    27,
                    164,
                    17,
                    48,
                    240,
                    159,
                    98,
                    166,
                    8,
                    195,
                    222,
                    47,
                    118,
                    73,
                    169,
                    32,
                    2,
                    254,
                    210,
                    21,
                    115,
                    132,
                    231,
                    213,
                    101,
                    89,
                    14,
                    93,
                    195,
                    124,
                    33,
                    170,
                    164,
                    179,
                    147,
                    10,
                    16,
                    106,
                    245,
                    150,
                    144,
                    55,
                    137,
                    122,
                    157,
                    73,
                    205,
                    211,
                    248,
                    103,
                    44,
                    205,
                    20,
                    195,
                    187,
                ],
            ),
            "_format"=> ElementValue::Number(0),
            "ccRecipients"=> ElementValue::Array(
                vec![],
            ),
            "_permissions"=> ElementValue::IdGeneratedId(
                GeneratedId("O1RT2Dj--g-0".to_string()),
            ),
            "encryptionAuthStatus"=> ElementValue::Bytes(
                vec![
                    1,
                    250,
                    205,
                    212,
                    24,
                    12,
                    9,
                    140,
                    85,
                    146,
                    193,
                    7,
                    29,
                    86,
                    39,
                    36,
                    35,
                    43,
                    4,
                    175,
                    185,
                    245,
                    200,
                    44,
                    187,
                    100,
                    188,
                    225,
                    91,
                    220,
                    231,
                    182,
                    27,
                    193,
                    93,
                    205,
                    190,
                    236,
                    197,
                    49,
                    122,
                    188,
                    124,
                    201,
                    19,
                    100,
                    30,
                    239,
                    180,
                    176,
                    98,
                    101,
                    215,
                    54,
                    103,
                    2,
                    202,
                    175,
                    20,
                    198,
                    192,
                    245,
                    170,
                    147,
                    188,
                ],
            ),
            "listUnsubscribe"=> ElementValue::String("".to_string()),
            "headers"=> ElementValue::Null,
            "firstRecipient"=> ElementValue::Dict(
            collection! {
                "_id"=> ElementValue::String(
                "yPeInQ".to_string(),
                ),
                "address"=> ElementValue::String(
                "bed-free@tutanota.de".to_string(),
                ),
                "name"=> ElementValue::Bytes(
                    vec![
                        1,
                        192,
                        128,
                        231,
                        215,
                        80,
                        142,
                        173,
                        50,
                        223,
                        108,
                        203,
                        98,
                        208,
                        88,
                        189,
                        150,
                        124,
                        224,
                        53,
                        222,
                        221,
                        251,
                        103,
                        225,
                        240,
                        105,
                        148,
                        251,
                        125,
                        40,
                        9,
                        29,
                        68,
                        22,
                        174,
                        33,
                        162,
                        141,
                        218,
                        56,
                        146,
                        168,
                        214,
                        187,
                        194,
                        247,
                        27,
                        229,
                        52,
                        242,
                        120,
                        188,
                        251,
                        181,
                        212,
                        237,
                        246,
                        194,
                        178,
                        51,
                        214,
                        62,
                        183,
                        29,
                    ],
                ),
                "contact"=> ElementValue::Null,
            },
            ),
            "unread"=> ElementValue::Bool(
            false,
            ),
            "_ownerKeyVersion"=> ElementValue::Number(
            0,
            ),
            "_ownerGroup"=> ElementValue::IdGeneratedId(
                GeneratedId("O1RT1m4-0s-0".to_string()),
            ),
            "conversationEntry"=> ElementValue::IdTupleId(
                IdTuple {
                    list_id: GeneratedId("O1RT2Dj--3-0".to_string()),
                    element_id: GeneratedId("O1RT2Dj--7-0".to_string()),
                },
            ),
            "bccRecipients"=> ElementValue::Array(
                vec![],
            ),
            "method"=> ElementValue::Bytes(
                vec![
                    1,
                    19,
                    144,
                    53,
                    191,
                    141,
                    223,
                    121,
                    196,
                    147,
                    223,
                    130,
                    249,
                    240,
                    174,
                    203,
                    75,
                    207,
                    192,
                    197,
                    179,
                    168,
                    55,
                    39,
                    100,
                    254,
                    60,
                    74,
                    221,
                    137,
                    155,
                    90,
                    27,
                    2,
                    242,
                    174,
                    199,
                    124,
                    89,
                    194,
                    122,
                    181,
                    153,
                    218,
                    169,
                    102,
                    103,
                    20,
                    64,
                    69,
                    11,
                    221,
                    68,
                    176,
                    98,
                    130,
                    124,
                    208,
                    71,
                    252,
                    130,
                    106,
                    166,
                    22,
                    9,
                ],
            ),
            "receivedDate"=> ElementValue::Date(
                DateTime::from_millis(1720612041),
            ),
            "mailDetails"=> ElementValue::Array(
                vec![
                    ElementValue::String("O1RT1m5-0--0".to_string()),
                    ElementValue::String("O1RT2Dk----0".to_string()),
                ],
            ),
            "body"=> ElementValue::Null,
            "replyType"=> ElementValue::String(
            "".to_string(),
            ),
            "state"=> ElementValue::Number(
            2,
            ),
            "authStatus"=> ElementValue::Null,
            "recipientCount"=> ElementValue::Number(
            1,
            ),
            "bucketKey"=> ElementValue::Null,
            "phishingStatus"=> ElementValue::Number(
            0,
            ),
            "mailDetailsDraft"=> ElementValue::Null,
            "replyTos"=> ElementValue::Array(
                vec![],
            ),
            "attachments"=> ElementValue::Array(
                vec![],
            ),
            "sender"=> ElementValue::Dict(
            collection! {
                "address"=> ElementValue::String(
                "map-free@tutanota.de".to_string(),
                ),
                "name"=> ElementValue::Bytes(
                    vec![
                        1,
                        2,
                        199,
                        60,
                        151,
                        190,
                        120,
                        54,
                        36,
                        233,
                        228,
                        109,
                        6,
                        201,
                        173,
                        164,
                        208,
                        70,
                        150,
                        81,
                        115,
                        54,
                        247,
                        219,
                        238,
                        5,
                        46,
                        50,
                        60,
                        108,
                        136,
                        145,
                        162,
                        157,
                        128,
                        18,
                        182,
                        222,
                        39,
                        28,
                        238,
                        11,
                        212,
                        242,
                        194,
                        133,
                        54,
                        75,
                        235,
                        120,
                        159,
                        201,
                        151,
                        124,
                        236,
                        138,
                        137,
                        236,
                        58,
                        85,
                        52,
                        89,
                        41,
                        60,
                        212,
                    ],
                ),
                "contact"=> ElementValue::Null,
                "_id"=> ElementValue::String(
                    "0y7Pgw".to_string(),
                ),
            },
            ),
            "differentEnvelopeSender"=> ElementValue::Null,
            "sentDate"=> ElementValue::Null,
            "subject"=> ElementValue::Bytes(
                vec![
                    1,
                    84,
                    88,
                    2,
                    139,
                    130,
                    202,
                    184,
                    162,
                    210,
                    1,
                    148,
                    165,
                    15,
                    83,
                    114,
                    6,
                    193,
                    119,
                    52,
                    34,
                    21,
                    71,
                    60,
                    159,
                    66,
                    55,
                    217,
                    243,
                    185,
                    164,
                    13,
                    48,
                    147,
                    237,
                    34,
                    234,
                    243,
                    100,
                    123,
                    203,
                    140,
                    47,
                    155,
                    207,
                    203,
                    79,
                    77,
                    64,
                    76,
                    212,
                    138,
                    140,
                    235,
                    73,
                    128,
                    229,
                    221,
                    177,
                    51,
                    28,
                    39,
                    107,
                    15,
                    218,
                    227,
                    66,
                    11,
                    235,
                    38,
                    22,
                    178,
                    129,
                    152,
                    128,
                    23,
                    150,
                    239,
                    241,
                    229,
                    255,
                ],
            ),
            "toRecipients"=> ElementValue::Array(
                vec![],
            ),
        };
        entity
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
            "bccRecipients"=> JsonElement::Array(
                vec![],
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
            "ccRecipients"=> JsonElement::Array(
                vec![],
            ),
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
            "toRecipients"=> JsonElement::Array(
                vec![],
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
        }
    }
}