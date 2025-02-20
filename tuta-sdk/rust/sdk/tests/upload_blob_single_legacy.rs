use std::error::Error;
use std::sync::Arc;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::tutanota_constants::ArchiveDataType;
use tutasdk::Sdk;
#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn sdk_can_upload_single_blob_legacy() -> Result<(), Box<dyn Error>> {
	let rest_client = Arc::new(NativeRestClient::try_new().unwrap());

	// this test expects local server with matching model versions to be live at: http://localhost:9000
	let sdk = Sdk::new("http://localhost:9000".to_string(), rest_client.clone());

	let logged_in_sdk = sdk
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();

	let mail_facade = logged_in_sdk.mail_facade();
	let user_mailbox = mail_facade.load_user_mailbox().await.unwrap();
	let owner_group_id = user_mailbox._ownerGroup.unwrap();

	let randomizer_facade = RandomizerFacade::from_core(rand_core::OsRng);

	let new_aes_256_key = GenericAesKey::from_bytes(
		randomizer_facade
			.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
			.as_slice(),
	)
	.unwrap();
	let result = logged_in_sdk
		.blob_facade()
		.encrypt_and_upload_single_legacy(
			ArchiveDataType::Attachments,
			&owner_group_id,
			&new_aes_256_key,
			&vec![0; 1024],
		)
		.await?;
	for tw in result {
		println!("{:?}", tw.blobReferenceToken)
	}
	Ok(())
}
