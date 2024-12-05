use std::error::Error;
use std::sync::Arc;
use tutasdk::blobs::blob_facade::FileData;
use tutasdk::crypto::key::GenericAesKey;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::tutanota_constants::ArchiveDataType;
use tutasdk::Sdk;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	let rest_client = Arc::new(NativeRestClient::try_new().unwrap());

	// this test expect local server with matching model versions to be live at: http://localhost:9000
	let sdk = Sdk::new("http://localhost:9000".to_string(), rest_client.clone());

	let logged_in_sdk = sdk
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();

	let mail_facade = logged_in_sdk.mail_facade();
	let user_mailbox = mail_facade.load_user_mailbox().await.unwrap();
	let owner_group_id = user_mailbox._ownerGroup.unwrap();

	let randomizer_facade = RandomizerFacade::from_core(rand_core::OsRng);

	let new_aes_256_key_1 = GenericAesKey::from_bytes(
		randomizer_facade
			.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
			.as_slice(),
	)
	.unwrap();
	let new_aes_256_key_2 = GenericAesKey::from_bytes(
		randomizer_facade
			.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
			.as_slice(),
	)
	.unwrap();
	let new_aes_256_key_3 = GenericAesKey::from_bytes(
		randomizer_facade
			.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
			.as_slice(),
	)
	.unwrap();
	let new_aes_256_key_4 = GenericAesKey::from_bytes(
		randomizer_facade
			.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
			.as_slice(),
	)
	.unwrap();
	let new_aes_256_key_5 = GenericAesKey::from_bytes(
		randomizer_facade
			.generate_random_array::<{ tutasdk::crypto::aes::AES_256_KEY_SIZE }>()
			.as_slice(),
	)
	.unwrap();

	let file_data1 = FileData {
		session_key: new_aes_256_key_1,
		data: vec![0; 24 * 1024 * 1024],
	};
	let file_data2 = FileData {
		session_key: new_aes_256_key_2,
		data: vec![0; 4 * 1024 * 1024],
	};
	let file_data3 = FileData {
		session_key: new_aes_256_key_3,
		data: vec![0; 2 * 1024 * 1024],
	};
	let file_data4 = FileData {
		session_key: new_aes_256_key_4,
		data: vec![0; 1024],
	};
	let file_data5 = FileData {
		session_key: new_aes_256_key_5,
		data: vec![0; 2048],
	};
	let file_data = vec![
		&file_data1,
		&file_data2,
		&file_data3,
		&file_data4,
		&file_data5,
	];

	let result = logged_in_sdk
		.blob_facade()
		.encrypt_and_upload_multiple(ArchiveDataType::Attachments, &owner_group_id, file_data)
		.await?;
	for (index, token_vector_per_file_data) in result.iter().enumerate() {
		println!("tokens for file {} :", index + 1);
		for token in token_vector_per_file_data {
			println!("{:?}", token.blobReferenceToken)
		}
	}
	Ok(())
}
