use std::borrow::Borrow;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::crypto::{Aes256Key, IV_BYTE_SIZE};
use tutasdk::entities::generated::tutanota::{ImportMailState, Mail};
use tutasdk::folder_system::MailSetKind;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, IdTupleGenerated, ListLoadDirection, Sdk};

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

	let mailbox = logged_in_sdk
		.mail_facade()
		.load_user_mailbox()
		.await
		.unwrap();

	let inbox_mailset = logged_in_sdk
		.mail_facade()
		.load_folders_for_mailbox(&mailbox)
		.await
		.unwrap()
		.system_folder_by_type(MailSetKind::Inbox)
		.ok_or("cannot find inbox folder")
		.unwrap()
		.clone();

	let session_key = GenericAesKey::Aes256(Aes256Key::generate(&randomizer));
	let mail_group_key = logged_in_sdk
		.get_current_sym_group_key(mailbox._ownerGroup.unwrap())
		.await
		.unwrap();

	let owner_enc_session_key = mail_group_key.encrypt_key(
		&session_key,
		Iv::from_bytes(&rand::random::<[u8; IV_BYTE_SIZE]>()).unwrap(),
	);
	let mut mail_import_state = ImportMailState {
		_format: 0,
		_id: Some(IdTupleGenerated {
			list_id: mailbox.mailImportStates.clone(),
			element_id: Default::default(),
		}),
		_permissions: mailbox._permissions,
		_ownerGroup: Some(mailbox_owner_group),
		_ownerEncSessionKey: Some(owner_enc_session_key.object),
		_ownerKeyVersion: Some(owner_enc_session_key.version),
		status: 1,
		targetFolder: inbox_mailset._id.as_ref().unwrap().clone(),
		_errors: Some(Default::default()),
		_finalIvs: Default::default(),
	};

	let response = crypto_entity_client
		.create_instance(mail_import_state.clone(), Some(&session_key))
		.await
		.unwrap();

	mail_import_state._id = Some(IdTupleGenerated {
		list_id: mailbox.mailImportStates,
		element_id: response
			.generatedId
			.expect("Expected server to return generatedId for elementId"),
	});
	mail_import_state._permissions = response.permissionListId;

	let expected_mail_import_state = crypto_entity_client
		.load::<ImportMailState, _>(mail_import_state._id.as_ref().unwrap())
		.await
		.as_ref()
		.unwrap()
		.clone();
	assert_eq!(expected_mail_import_state, mail_import_state)
}

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
		.load_range::<Mail>(
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
