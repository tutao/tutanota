use std::sync::Arc;
use serde::Deserialize;
use crate::entity_client::IdType;
#[mockall_double::double]
use crate::entity_client::EntityClient;
use crate::ApiCallError;
#[mockall_double::double]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::entities::Entity;
use crate::entities::entity_facade::EntityFacade;
#[mockall_double::double]
use crate::instance_mapper::InstanceMapper;


// A high level interface to manipulate encrypted entities/instances via the REST API
pub struct CryptoEntityClient {
    entity_client: Arc<EntityClient>,
    entity_facade: Arc<EntityFacade>,
    crypto_facade: Arc<CryptoFacade>,
    instance_mapper: Arc<InstanceMapper>,
}

impl CryptoEntityClient {
    pub fn new(
        entity_client: Arc<EntityClient>,
        entity_facade: Arc<EntityFacade>,
        crypto_facade: Arc<CryptoFacade>,
        instance_mapper: Arc<InstanceMapper>,
    ) -> Self {
        CryptoEntityClient { entity_client, entity_facade, crypto_facade, instance_mapper }
    }
    pub async fn load<T: Entity + Deserialize<'static>, ID: IdType + 'static>(
        &self,
        id: &ID,
    ) -> Result<T, ApiCallError> {
        let type_ref = T::type_ref();
        let type_model = self.entity_client.get_type_model(&type_ref)?;
        let mut parsed_entity = self.entity_client.load(&type_ref, id).await?;

        if type_model.encrypted {
            let possible_session_key = self.crypto_facade
                .resolve_session_key(&mut parsed_entity, type_model)
                .map_err(|error|
                    ApiCallError::InternalSdkError {
                        error_message: format!(
                            "Failed to resolve session key for entity '{}' with ID: {}; {}",
                            type_model.name,
                            type_model.id,
                            error
                        )
                    }
                )?;
            match possible_session_key {
                Some(session_key) => {
                    let decrypted_entity = self.entity_facade.decrypt_and_map(type_model, parsed_entity, &session_key)?;
                    let typed_entity = self.instance_mapper.parse_entity::<T>(decrypted_entity)
                        .map_err(|e|
                            ApiCallError::InternalSdkError {
                                error_message: format!(
                                    "Failed to parse encrypted entity into proper types: {}",
                                    e
                                )
                            }
                        )?;
                    Ok(typed_entity)
                }
                // `resolve_session_key()` only returns none if the entity is unencrypted, so
                // no need to handle it
                None => { unreachable!() }
            }
        } else {
            let typed_entity = self.instance_mapper.parse_entity::<T>(parsed_entity)
                .map_err(|error|
                    ApiCallError::InternalSdkError {
                        error_message: format!(
                            "Failed to parse unencrypted entity into proper types: {}",
                            error
                        )
                    }
                )?;
            Ok(typed_entity)
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use rand::random;
    use crate::crypto::aes::{Aes256Key, Iv};
    use crate::crypto::crypto_facade::MockCryptoFacade;
    use crate::crypto::key::GenericAesKey;
    use crate::crypto_entity_client::CryptoEntityClient;
    use crate::date::DateTime;
    use crate::entities::entity_facade::EntityFacade;
    use crate::entities::tutanota::{Mail, MailAddress};
    use crate::util::entity_test_utils::generate_email_entity;
    use crate::entity_client::MockEntityClient;
    use crate::instance_mapper::MockInstanceMapper;
    use crate::metamodel::TypeModel;
    use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
    use crate::{IdTuple, TypeRef};
    use crate::custom_id::CustomId;
    use crate::generated_id::GeneratedId;

    #[tokio::test]
    async fn can_load_mail() {
        // Generate an encrypted type to feed into a mock of the entity client
        let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
        let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
        let is_confidential = false;
        const SUBJECT: &str = "Subject";
        const SENDER_NAME: &str = "Sender";
        const RECIPIENT_NAME: &str = "Recipient";
        let test_date = DateTime::from_millis(1470039025474);
        let (encrypted_mail, _) = generate_email_entity(
            None,
            &sk,
            &iv,
            is_confidential,
            SUBJECT.to_owned(),
            SENDER_NAME.to_owned(),
            RECIPIENT_NAME.to_owned(),
        );

        // We cause a deliberate memory leak to convert the mail type's lifetime to static because
        // the callback to `returning` requires returned references to have a static lifetime
        let my_favorite_leak: &'static TypeModelProvider = Box::leak(
            Box::new(init_type_model_provider())
        );

        let raw_mail_id = encrypted_mail.get("_id").unwrap().assert_tuple_id();
        let mail_id = IdTuple::new(
            raw_mail_id.list_id.clone(),
            raw_mail_id.element_id.clone(),
        );
        let mail_type_ref = TypeRef { app: "tutanota", type_: "Mail" };
        let mail_type_model: &'static TypeModel = my_favorite_leak
            .get_type_model(&mail_type_ref.app, &mail_type_ref.type_)
            .expect("Error in type_model_provider");

        // Set up the mock of the plain unencrypted entity client
        let mut mock_entity_client = MockEntityClient::default();
        mock_entity_client.expect_get_type_model().returning(|_| Ok(mail_type_model));
        mock_entity_client.expect_load().returning(move |_, _: &IdTuple| Ok(encrypted_mail.clone()));

        // Set up the mock of the crypto facade
        let mut mock_crypto_facade = MockCryptoFacade::default();
        mock_crypto_facade.expect_resolve_session_key().returning(move |_, _| Ok(Some(sk.clone())));

        // TODO: it would be nice to mock this
        let type_model_provider = Arc::new(init_type_model_provider());

        // Use the real `EntityFacade` as it contains the actual decryption logic
        let entity_facade = EntityFacade::new(Arc::clone(&type_model_provider));

        let mut mock_instance_mapper = MockInstanceMapper::new();
        {
            mock_instance_mapper.expect_parse_entity().returning(move |_| {
                Ok(Mail {
                    _format: 0,
                    _id: IdTuple::new(GeneratedId("mail_list_id".to_owned()), GeneratedId("mail_id".to_owned())),
                    _ownerEncSessionKey: None,
                    _ownerGroup: Some(GeneratedId("ownerGroupId".to_owned())),
                    _ownerKeyVersion: None, // Missing in `generate_email_entity()`
                    _permissions: GeneratedId("permissionListId".to_owned()),
                    authStatus: Some(0),
                    confidential: is_confidential.clone(),
                    differentEnvelopeSender: None,
                    encryptionAuthStatus: None,
                    listUnsubscribe: false,
                    method: 0, // Empty in `generate_email_entity()`
                    movedTime: None,
                    phishingStatus: 0,
                    receivedDate: test_date.clone(),
                    recipientCount: 0,
                    replyType: 0, // Empty in `generate_email_entity()`
                    sentDate: Some(test_date.clone()),
                    state: 0, // Empty in `generate_email_entity()`
                    subject: SUBJECT.to_owned(),
                    unread: true,
                    attachments: vec![], // Missing in `generate_email_entity()`
                    bccRecipients: vec![],
                    body: None, // Missing in `generate_email_entity()`
                    bucketKey: None,
                    ccRecipients: vec![],
                    conversationEntry: IdTuple {
                        list_id: GeneratedId::test_random(),
                        element_id: GeneratedId::test_random(),
                    }, // Missing in `generate_email_entity()`
                    firstRecipient: None, // Missing in `generate_email_entity()`
                    headers: None, // Missing in `generate_email_entity()`
                    mailDetails: None, // Missing in `generate_email_entity()`
                    mailDetailsDraft: None, // Missing in `generate_email_entity()`
                    replyTos: vec![],
                    sender: MailAddress {
                        _id: CustomId("senderId".to_owned()),
                        address: "hello@tutao.de".to_owned(),
                        name: SENDER_NAME.to_owned(),
                        contact: None, // Missing in `generate_email_entity()`
                    },
                    toRecipients: vec![MailAddress {
                        _id: CustomId("recipientId".to_owned()),
                        address: "support@yahoo.com".to_owned(),
                        name: RECIPIENT_NAME.to_string(),
                        contact: None, // Missing in `generate_email_entity()`
                    }],
                })
            });
        }


        let crypto_entity_client = CryptoEntityClient::new(
            Arc::new(mock_entity_client),
            Arc::new(entity_facade),
            Arc::new(mock_crypto_facade),
            Arc::new(mock_instance_mapper),
        );

        let result: Mail = crypto_entity_client.load(&mail_id)
            .await
            .unwrap();

        assert_eq!(result.receivedDate, test_date);
        assert_eq!(result.sentDate, Some(test_date));
        assert_eq!(result.confidential, is_confidential);
        assert_eq!(result.subject, SUBJECT.to_owned());
        assert_eq!(result.sender.name, SENDER_NAME.to_owned());
        assert_eq!(result.sender.address, "hello@tutao.de".to_owned());
        assert_eq!(result.toRecipients[0].name, RECIPIENT_NAME.to_owned());
        assert_eq!(result.toRecipients[0].address, "support@yahoo.com".to_owned());
    }
}
