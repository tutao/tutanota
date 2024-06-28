use std::sync::Arc;
use crate::element_value::{ParsedEntity};
use crate::entity_client::{EntityClientHandlers, IdType};
#[mockall_double::double]
use crate::entity_client::EntityClient;
use crate::{ApiCallError, IdTuple, ListLoadDirection, TypeRef};
#[mockall_double::double]
use crate::crypto::crypto_facade::CryptoFacade;
use crate::entities::entity_facade::EntityFacade;
use crate::id::Id;
use crate::json_element::RawEntity;
use crate::metamodel::TypeModel;


// A high level interface to manipulate encrypted entities/instances via the REST API
pub struct CryptoEntityClient {
    entity_client: Arc<EntityClient>,
    entity_facade: Arc<EntityFacade>,
    crypto_facade: Arc<CryptoFacade>,
}

impl CryptoEntityClient {
    pub fn new(entity_client: Arc<EntityClient>, entity_facade: Arc<EntityFacade>, crypto_facade: Arc<CryptoFacade>) -> Self {
        CryptoEntityClient { entity_client, entity_facade, crypto_facade }
    }
}

// TODO: remove this allowance after completing the implementation of `EntityClientHandlers`
#[allow(unused_variables)]
impl EntityClientHandlers for CryptoEntityClient {
    async fn load(&self, type_ref: &TypeRef, id: &IdType) -> Result<ParsedEntity, ApiCallError> {
        let type_model = self.entity_client.get_type_model(type_ref)?;
        let mut parsed_entity = self.entity_client.load(type_ref, id).await?;

        if type_model.encrypted {
            let possible_session_key = self.crypto_facade
                .resolve_session_key(&mut parsed_entity, type_model)
                .map_err(
                    |error| ApiCallError::InternalSdkError {
                        error_message: error.to_string()
                    }
                )?;
            match possible_session_key {
                Some(session_key) => {
                    Ok(self.entity_facade.decrypt_and_map(type_model, parsed_entity, &session_key)?)
                }
                // `resolve_session_key()` only returns none if the entity is unencrypted, so
                // no need to handle it
                None => { unreachable!() }
            }
        } else {
            Ok(parsed_entity)
        }
    }

    fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, ApiCallError> {
        self.entity_client.get_type_model(type_ref)
    }

    async fn load_all(&self, type_ref: &TypeRef, list_id: &IdTuple, start: Option<String>) -> Result<Vec<ParsedEntity>, ApiCallError> {
        todo!()
    }

    async fn load_range(&self, type_ref: &TypeRef, list_id: &IdTuple, start_id: &str, count: &str, list_load_direction: ListLoadDirection) -> Result<Vec<ParsedEntity>, ApiCallError> {
        todo!()
    }

    async fn setup_element(&self, type_ref: &TypeRef, entity: RawEntity) -> Vec<String> {
        todo!()
    }

    async fn setup_list_element(&self, type_ref: &TypeRef, list_id: &IdTuple, entity: RawEntity) -> Vec<String> {
        todo!()
    }

    async fn update(&self, type_ref: &TypeRef, entity: ParsedEntity, model_version: u32) -> Result<(), ApiCallError> {
        Ok(())
    }

    async fn erase_element(&self, type_ref: &TypeRef, id: &Id) -> Result<(), ApiCallError> {
        todo!()
    }

    async fn erase_list_element(&self, type_ref: &TypeRef, id: IdTuple) -> Result<(), ApiCallError> {
        todo!()
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
    use crate::entities::entity_facade::EntityFacade;
    use crate::entities::entity_facade_test_utils::generate_email_entity;
    use crate::entity_client::{MockEntityClient, EntityClientHandlers, IdType};
    use crate::metamodel::TypeModel;
    use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
    use crate::TypeRef;

    #[tokio::test]
    async fn can_load_mail() {
        // Generate an encrypted type to feed into a mock of the entity client
        let sk = GenericAesKey::Aes256(Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap());
        let iv = Iv::from_bytes(&random::<[u8; 16]>()).unwrap();
        let (encrypted_mail, plaintext_mail) = generate_email_entity(
            None,
            &sk,
            &iv,
            false,
            "Subject".to_owned(),
            "Sender".to_owned(),
            "Recipient".to_owned(),
        );

        // We cause a deliberate memory leak to convert the mail type's lifetime to static because
        // the callback to `returning` requires returned references to have a static lifetime
        let my_favorite_leak: &'static TypeModelProvider = Box::leak(
            Box::new(init_type_model_provider())
        );

        let mail_id = IdType::Tuple(encrypted_mail.get("_id").unwrap().assert_tuple_id().clone());
        let mail_type_ref = TypeRef { app: "tutanota".to_owned(), type_: "Mail".to_owned() };
        let mail_type_model: &'static TypeModel = my_favorite_leak
            .get_type_model(&mail_type_ref.app, &mail_type_ref.type_)
            .expect("Error in type_model_provider");

        // Set up the mock of the plain unencrypted entity client
        let mut mock_entity_client = MockEntityClient::default();
        mock_entity_client.expect_get_type_model().returning(|_| Ok(mail_type_model));
        mock_entity_client.expect_load().returning(move |_, _| Ok(encrypted_mail.clone()));

        // Set up the mock of the crypto facade
        let mut mock_crypto_facade = MockCryptoFacade::default();
        mock_crypto_facade.expect_resolve_session_key().returning(move |_, _| Ok(Some(sk.clone())));

        // TODO: it would be nice to mock this
        let type_model_provider = Arc::new(init_type_model_provider());

        // Use the real `EntityFacade` as it contains the actual decryption logic
        let entity_facade = EntityFacade::new(Arc::clone(&type_model_provider));

        let crypto_entity_client = CryptoEntityClient::new(
            Arc::new(mock_entity_client),
            Arc::new(entity_facade),
            Arc::new(mock_crypto_facade),
        );

        let result = crypto_entity_client.load(&mail_type_ref, &mail_id)
            .await
            .unwrap();

        assert_eq!(result, plaintext_mail);
    }
}
