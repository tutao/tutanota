use std::borrow::Borrow;
use std::sync::Arc;
use tutasdk::crypto::aes::Iv;
use tutasdk::crypto::crypto_facade::ResolvedSessionKey;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::{AES_256_KEY_SIZE, IV_BYTE_SIZE};
use tutasdk::crypto_entity_client::CryptoEntityClient;
use tutasdk::entities::entity_facade::EntityFacade;
use tutasdk::entities::generated::tutanota::{ImportMailState, Mail};
use tutasdk::entities::Entity;
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

	let mailbox = logged_in_sdk
		.mail_facade()
		.load_user_mailbox()
		.await
		.unwrap();

	let folders = logged_in_sdk
		.mail_facade()
		.load_folders_for_mailbox(&mailbox)
		.await
		.unwrap();
	let inbox_mailset = folders
		.system_folder_by_type(MailSetKind::Inbox)
		.ok_or("cannot find inbox folder")
		.unwrap();

	let owner_enc_session_key = logged_in_sdk
		.get_current_sym_group_key(&logged_in_sdk.get_user_group_id())
		.await
		.unwrap()
		.encrypt_key(
			&GenericAesKey::from_bytes(&rand::random::<[u8; AES_256_KEY_SIZE]>()).unwrap(),
			Iv::from_bytes(&rand::random::<[u8; IV_BYTE_SIZE]>()).unwrap(),
		);
	let mut mail_import_state = ImportMailState {
		_format: 0,
		_id: Some(IdTupleGenerated {
			list_id: mailbox.mailImportStates.clone(),
			element_id: Default::default(),
		}),
		_permissions: mailbox._permissions,
		_ownerGroup: Some(mailbox._ownerGroup.unwrap()),
		_ownerEncSessionKey: Some(owner_enc_session_key.object),
		_ownerKeyVersion: Some(owner_enc_session_key.version),
		status: 1,
		targetFolder: inbox_mailset._id.as_ref().unwrap().clone(),
		_errors: None,
		_finalIvs: Default::default(),
	};

	let type_ref = ImportMailState::type_ref();
	let session_key = GenericAesKey::from_bytes(&rand::random::<[u8; AES_256_KEY_SIZE]>()).unwrap();
	let parsed_entity = logged_in_sdk
		.serialize_entity(mail_import_state.clone(), &session_key)
		.unwrap();

	let response = logged_in_sdk
		.get_entity_client()
		.create_instance(
			&type_ref,
			parsed_entity,
			logged_in_sdk.instance_mapper.borrow(),
		)
		.await
		.unwrap();

	mail_import_state._id = Some(IdTupleGenerated {
		list_id: mailbox.mailImportStates,
		element_id: response
			.generatedId
			.expect("Expected server to return generatedId for elementId"),
	});
	mail_import_state._permissions = response.permissionListId;

	// todo: load the state from server and assert it everything is same exec
	let crypto_entity_client: Arc<CryptoEntityClient> =
		logged_in_sdk.mail_facade().get_crypto_entity_client();
	eprintln!(
		"list id: {:?}",
		mail_import_state._id.as_ref().unwrap().list_id
	);
	let expected_mail_import_state = crypto_entity_client
		.load_range::<ImportMailState>(
			&mail_import_state._id.as_ref().unwrap().list_id,
			&GeneratedId::min_id(),
			1,
			ListLoadDirection::ASC,
		)
		.await
		.as_ref()
		.unwrap()
		.first()
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
	let crypto_entity_client: Arc<CryptoEntityClient> =
		logged_in_sdk.mail_facade().get_crypto_entity_client();

	let load_latest_mail_from_inbox = || async {
		let mailbox = logged_in_sdk
			.mail_facade()
			.load_user_mailbox()
			.await
			.unwrap();
		let current_mailbag_mail_list_id = &mailbox.currentMailBag.as_ref().unwrap().mails;

		let mail = crypto_entity_client
			.load_range::<Mail>(
				current_mailbag_mail_list_id,
				&GeneratedId::max_id(),
				1,
				ListLoadDirection::DESC,
			)
			.await
			.unwrap()
			.first()
			.expect(
				format!(
					"No mails found in list Id: {}",
					current_mailbag_mail_list_id
				)
				.as_str(),
			)
			.clone();
		mail
	};

	let mut sample_mail = load_latest_mail_from_inbox().await;
	eprintln!("Downaloaded sample mail...............");
	sample_mail.unread = !sample_mail.unread;

	let type_ref = Mail::type_ref();
	let type_model = logged_in_sdk
		.type_model_provider
		.resolve_type_ref(&type_ref)
		.unwrap();

	let parsed_entity = {
		let parsed_entity = logged_in_sdk
			.instance_mapper
			.serialize_entity(sample_mail.clone())
			.unwrap();
		let resolved_session_key: ResolvedSessionKey = crypto_entity_client
			.get_crypto_facade()
			.resolve_session_key(&parsed_entity, &type_model)
			.await
			.unwrap()
			.unwrap();
		logged_in_sdk
			.encrypt_and_map(
				&type_model,
				&parsed_entity,
				&resolved_session_key.session_key,
			)
			.unwrap()
	};

	logged_in_sdk
		.get_entity_client()
		.update_instance(&type_ref, parsed_entity)
		.await
		.unwrap();
	eprintln!("Updated mail: {:?}", sample_mail._id.as_ref().unwrap());

	let updated_mail = load_latest_mail_from_inbox().await;
	assert_eq!(updated_mail, sample_mail);
}
