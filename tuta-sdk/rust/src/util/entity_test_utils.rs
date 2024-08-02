use std::collections::HashMap;
use crate::crypto::Iv;
use crate::crypto::key::GenericAesKey;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::generated_id::GeneratedId;
use crate::IdTuple;

/// Asserts whether the encrypted fields in the mail entity `result` were decrypted
pub fn assert_decrypted_mail(result: &ParsedEntity, plaintext_mail: &ParsedEntity) {
    // Decrypting the mail generates extra fields, so we only compare the ones in the plaintext
    // email. Some errors are tolerated in the decrypted fields.
    assert_eq!(result.get("receivedDate").unwrap(), plaintext_mail.get("receivedDate").unwrap());
    assert_eq!(result.get("sentDate").unwrap(), plaintext_mail.get("sentDate").unwrap());
    assert_eq!(result.get("confidential").unwrap(), plaintext_mail.get("confidential").unwrap());
    assert_eq!(result.get("subject").unwrap(), plaintext_mail.get("subject").unwrap());
    assert_eq!(result.get("sender").unwrap().assert_dict().get("name").unwrap(), plaintext_mail.get("sender").unwrap().assert_dict().get("name").unwrap());
    assert_eq!(result.get("sender").unwrap().assert_dict().get("address").unwrap(), plaintext_mail.get("sender").unwrap().assert_dict().get("address").unwrap());
    assert_eq!(result.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("name").unwrap(), plaintext_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("name").unwrap());
    assert_eq!(result.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("address").unwrap(), plaintext_mail.get("toRecipients").unwrap().assert_array()[0].assert_dict().get("address").unwrap());
}

pub fn encrypt_bytes(encryption_key: &GenericAesKey, bytes: &[u8], iv: &Iv) -> Vec<u8> {
    encryption_key.encrypt_data(bytes, iv.to_owned()).unwrap()
}

/// Generates and returns an encrypted Mail ParsedEntity. It also returns the decrypted Mail for comparison
pub fn generate_email_entity(owner_group_key: Option<&GenericAesKey>, session_key: &GenericAesKey, iv: &Iv, confidential: bool, subject: String, sender_name: String, recipient_name: String) -> (ParsedEntity, ParsedEntity) {
    let confidential_bytes;

    if confidential {
        confidential_bytes = "1".as_bytes();
    } else {
        confidential_bytes = "0".as_bytes();
    }

    let encrypted_mail: HashMap<String, ElementValue> = HashMap::from([
        ("_format".to_string(), ElementValue::String("0".to_string())),
        ("_area".to_string(), ElementValue::String("0".to_string())),
        ("_owner".to_string(), ElementValue::String("ownerId".to_string())),
        ("_ownerGroup".to_string(), ElementValue::String("ownerGroupId".to_string())),
        ("_ownerEncSessionKey".to_string(), match owner_group_key {
            Some(_) => ElementValue::Bytes(Default::default()),
            None => ElementValue::Null
        }),
        ("_id".to_string(), ElementValue::IdTupleId(IdTuple { list_id: GeneratedId("mail_list_id".to_owned()), element_id: GeneratedId("mail_id".to_owned()) })),
        ("_permissions".to_string(), ElementValue::IdGeneratedId(GeneratedId("permissionListId".to_owned()))),
        ("receivedDate".to_string(), ElementValue::String("1470039025474".to_string())),
        ("sentDate".to_string(), ElementValue::String("1470039021474".to_string())),
        ("state".to_string(), ElementValue::String("".to_string())),
        ("trashed".to_string(), ElementValue::Bool(false)),
        ("unread".to_string(), ElementValue::Bool(true)),
        ("subject".to_string(), ElementValue::Bytes(encrypt_bytes(session_key, subject.as_bytes(), iv))),
        ("replyType".to_string(), ElementValue::String("".to_string())),
        ("confidential".to_string(), ElementValue::Bytes(encrypt_bytes(session_key, confidential_bytes, iv))),
        ("sender".to_string(), ElementValue::Dict(HashMap::from([
            ("_id".to_string(), ElementValue::String("senderId".to_string())),
            ("address".to_string(), ElementValue::String("hello@tutao.de".to_string())),
            ("name".to_string(), ElementValue::Bytes(encrypt_bytes(session_key, sender_name.to_string().as_bytes(), iv)))
        ]))),
        ("bccRecipients".to_string(), ElementValue::Array(Vec::new())),
        ("ccRecipients".to_string(), ElementValue::Array(Vec::new())),
        ("toRecipients".to_string(), ElementValue::Array(
            Vec::from([
                ElementValue::Dict(HashMap::from([
                    ("_id".to_string(), ElementValue::String("recipientId".to_string())),
                    ("address".to_string(), ElementValue::String("support@yahoo.com".to_string())),
                    ("name".to_string(), ElementValue::Bytes(encrypt_bytes(session_key, recipient_name.as_bytes(), iv)))
                ]))
            ])
        )),
        ("replyTos".to_string(), ElementValue::Array(Vec::new())),
        ("bucketKey".to_string(), ElementValue::Null),
        ("attachmentCount".to_string(), ElementValue::String("0".to_string())),
        ("authStatus".to_string(), ElementValue::String("0".to_string())),
        ("listUnsubscribe".to_string(), ElementValue::Bytes(encrypt_bytes(session_key, "0".to_string().as_bytes(), iv))),
        ("method".to_string(), ElementValue::Bytes(encrypt_bytes(session_key, "".to_string().as_bytes(), iv))),
        ("phishingStatus".to_string(), ElementValue::String("0".to_string())),
        ("recipientCount".to_string(), ElementValue::String("0".to_string()))
    ]);

    let original_mail: HashMap<String, ElementValue> = HashMap::from([
        ("_format".to_string(), ElementValue::String("0".to_string())),
        ("_area".to_string(), ElementValue::String("0".to_string())),
        ("_owner".to_string(), ElementValue::String("ownerId".to_string())),
        ("_ownerGroup".to_string(), ElementValue::String("ownerGroupId".to_string())),
        ("_ownerEncSessionKey".to_string(), match owner_group_key {
            Some(_) => ElementValue::Bytes(Default::default()),
            None => ElementValue::Null
        }),
        ("_id".to_string(), ElementValue::IdTupleId(IdTuple { list_id: GeneratedId("mail_list_id".to_owned()), element_id: GeneratedId("mail_id".to_owned()) })),
        ("_permissions".to_string(), ElementValue::IdGeneratedId(GeneratedId("permissionListId".to_owned()))),
        ("receivedDate".to_string(), ElementValue::String("1470039025474".to_string())),
        ("sentDate".to_string(), ElementValue::String("1470039021474".to_string())),
        ("state".to_string(), ElementValue::String("".to_string())),
        ("trashed".to_string(), ElementValue::Bool(false)),
        ("unread".to_string(), ElementValue::Bool(true)),
        ("subject".to_string(), ElementValue::String(subject)),
        ("replyType".to_string(), ElementValue::String("".to_string())),
        ("confidential".to_string(), ElementValue::Bool(confidential)),
        ("sender".to_string(), ElementValue::Dict(HashMap::from([
            ("_id".to_string(), ElementValue::String("senderId".to_string())),
            ("address".to_string(), ElementValue::String("hello@tutao.de".to_string())),
            ("name".to_string(), ElementValue::String(sender_name.to_string()))
        ]))),
        ("bccRecipients".to_string(), ElementValue::Array(Vec::new())),
        ("ccRecipients".to_string(), ElementValue::Array(Vec::new())),
        ("toRecipients".to_string(), ElementValue::Array(
            Vec::from([
                ElementValue::Dict(HashMap::from([
                    ("_id".to_string(), ElementValue::String("recipientId".to_string())),
                    ("address".to_string(), ElementValue::String("support@yahoo.com".to_string())),
                    ("name".to_string(), ElementValue::String(recipient_name))
                ]))
            ])
        )),
        ("replyTos".to_string(), ElementValue::Array(Vec::new())),
        ("bucketKey".to_string(), ElementValue::Null),
        ("attachmentCount".to_string(), ElementValue::String("0".to_string())),
        ("authStatus".to_string(), ElementValue::String("0".to_string())),
        ("listUnsubscribe".to_string(), ElementValue::Bool(false)),
        ("method".to_string(), ElementValue::String("".to_string())),
        ("phishingStatus".to_string(), ElementValue::String("0".to_string())),
        ("recipientCount".to_string(), ElementValue::String("0".to_string()))
    ]);

    return (encrypted_mail, original_mail);
}
