use std::sync::Arc;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::crypto::{Aes256Key, IV_BYTE_SIZE};
use tutasdk::entities::generated::sys::PushIdentifier;
use tutasdk::entities::generated::tutanota::Mail;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, ListLoadDirection, Sdk};

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn can_create_remote_instance() {
	let logged_in_sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(NativeRestClient::try_new().unwrap()),
	)
	.create_session("map-free@tutanota.de", "map")
	.await
	.expect("Can not create session");
	let randomizer = RandomizerFacade::from_core(rand_core::OsRng);
	let crypto_entity_client = logged_in_sdk.mail_facade().get_crypto_entity_client();

	let session_key = GenericAesKey::Aes256(Aes256Key::generate(&randomizer));
	let user_group_id = logged_in_sdk.get_user_group_id();
	let user_group_key = logged_in_sdk
		.get_current_sym_group_key(&user_group_id)
		.await
		.unwrap();

	let _owner_enc_session_key = user_group_key.encrypt_key(
		&session_key,
		Iv::from_bytes(&rand::random::<[u8; IV_BYTE_SIZE]>()).unwrap(),
	);
	let user_push_identifier_list_id = logged_in_sdk
		.get_user()
		.pushIdentifierList
		.as_ref()
		.unwrap()
		.list
		.clone();

	let mut push_identifier = PushIdentifier {
		_area: 0,
		_owner: user_group_id.clone(),
		_ownerGroup: Some(user_group_id),
		_ownerEncSessionKey: Some(_owner_enc_session_key.object),
		_ownerKeyVersion: Some(_owner_enc_session_key.version as i64),
		_id: Some(IdTupleGenerated {
			list_id: user_push_identifier_list_id.clone(),
			element_id: Default::default(),
		}),
		app: 1, // AppType.Mail
		disabled: false,
		displayName: "display name for push identifier".to_string(),
		identifier: "map-free@tutanota.de".to_string(),
		language: "en".to_string(),
		lastNotificationDate: None,
		lastUsageTime: Default::default(),
		pushServiceType: 2, // PushServiceType.EMAIL
		// when this is returned and deserialized, this will be set but empty
		_errors: Some(Default::default()),
		// none of these need to be set
		_permissions: Default::default(),
		_finalIvs: Default::default(),
		_format: 0,
	};

	let response = crypto_entity_client
		.create_instance(push_identifier.clone(), Some(session_key))
		.await
		.unwrap();

	push_identifier._id = Some(IdTupleGenerated {
		list_id: user_push_identifier_list_id,
		element_id: response
			.generatedId
			.expect("Expected server to return generatedId for elementId"),
	});
	push_identifier._permissions = response.permissionListId;

	let expected_mail_import_state = crypto_entity_client
		.load::<PushIdentifier, _>(push_identifier._id.as_ref().unwrap())
		.await
		.as_ref()
		.unwrap()
		.clone();
	assert_eq!(expected_mail_import_state, push_identifier);
}

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn can_update_remote_instance() {
	let logged_in_sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(NativeRestClient::try_new().unwrap()),
	)
	.create_session("map-free@tutanota.de", "map")
	.await
	.expect("Can not create session");
	let crypto_entity_client = logged_in_sdk.mail_facade().get_crypto_entity_client();

	let current_mailbag_mail_list = logged_in_sdk
		.mail_facade()
		.load_user_mailbox()
		.await
		.unwrap()
		.currentMailBag
		.as_ref()
		.unwrap()
		.mails
		.clone();
	let mut sample_mail = crypto_entity_client
		.load_range::<Mail, GeneratedId>(
			&current_mailbag_mail_list,
			&GeneratedId::max_id(),
			1,
			ListLoadDirection::DESC,
		)
		.await
		.unwrap()
		.first()
		.unwrap()
		.clone();
	sample_mail.unread = !sample_mail.unread;

	crypto_entity_client
		.update_instance(sample_mail.clone())
		.await
		.unwrap();

	let updated_mail: Mail = crypto_entity_client
		.load(sample_mail._id.as_ref().unwrap())
		.await
		.unwrap();
	assert_eq!(updated_mail, sample_mail);
}
