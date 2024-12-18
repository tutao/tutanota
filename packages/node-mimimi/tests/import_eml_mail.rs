#[cfg(not(feature = "javascript"))]
#[tokio::test]
async fn can_import_multiple_emls() {
	use std::sync::Arc;
	use tutao_node_mimimi::importer::ImportError;
	use tutao_node_mimimi::importer::ImportStatus;
	use tutao_node_mimimi::importer::Importer;
	use tutao_node_mimimi::importer::StateCallbackResponse;
	use tutasdk::folder_system::MailSetKind;
	use tutasdk::net::native_rest_client::NativeRestClient;
	use tutasdk::Sdk;

	let logged_in_sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(NativeRestClient::try_new().unwrap()),
	)
	.create_session("map-premium@tutanota.de", "map")
	.await
	.unwrap();

	let mail_facade = logged_in_sdk.mail_facade();
	let mailbox = mail_facade.load_user_mailbox().await.unwrap();
	let folders = mail_facade
		.load_folders_for_mailbox(&mailbox)
		.await
		.unwrap();
	let target_mailset = folders
		.system_folder_by_type(MailSetKind::Inbox)
		.as_ref()
		.expect("inbox should exist")
		._id
		.as_ref()
		.unwrap()
		.clone();

	let Ok(paths) = std::fs::read_dir(concat!(
		env!("CARGO_MANIFEST_DIR"),
		"/tests/resources/testmail"
	)) else {
		panic!("could not load test mail files names, are you in the node-mimimi project root?")
	};
	let file_paths = paths
		.map(|path| path.unwrap().path().to_str().unwrap().to_owned())
		.collect();

	let mut importer = Importer::create_file_importer(
		logged_in_sdk,
		mailbox._ownerGroup.unwrap(),
		target_mailset,
		file_paths,
		None,
	)
	.await
	.unwrap();

	let default_resolver =
		|_| async { Result::<_, ImportError>::Ok(StateCallbackResponse { should_stop: false }) };
	importer
		.start_stateful_import(default_resolver)
		.await
		.expect("Cannot complete import");
	let remote_state = importer.get_remote_state_id().await.unwrap();
	assert_eq!(ImportStatus::Finished as i64, remote_state.status);
	assert_eq!(14, remote_state.successfulMails);
	assert_eq!(0, remote_state.failedMails);
}

#[cfg(feature = "javascript")]
#[test]
#[ignore = "need re-run without javascript feature"]
fn can_import_multiple_emls() {
	panic!("This test should be run without javascript feature")
}
