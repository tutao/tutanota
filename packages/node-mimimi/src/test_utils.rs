use crate::importer::file_reader::FileImport;
use crate::importer::Importer;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tutasdk::entities::generated::tutanota::MailFolder;
use tutasdk::folder_system::MailSetKind;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{LoggedInSdk, Sdk};

pub(super) struct CleanDir {
	pub dir: PathBuf,
}
impl Drop for CleanDir {
	fn drop(&mut self) {
		if self.dir.exists() {
			fs::remove_dir_all(&self.dir).unwrap();
		}
	}
}

pub fn get_test_id() -> u32 {
	static TEST_COUNTER: Mutex<u32> = Mutex::new(0);
	let mut old_count_guard = TEST_COUNTER.lock().expect("Mutex poisoned");
	let new_count = old_count_guard.checked_add(1).unwrap();
	*old_count_guard = new_count;
	drop(old_count_guard);
	new_count
}

pub fn write_big_sample_email(whither: &str) {
	let line = "Hello tutao! this is the first step to have email import.Want to see html 😀?<p style='color:red'>red</p>";
	let text: String = std::iter::repeat_n(line, 100_001).collect();
	let email = mail_builder::MessageBuilder::new()
		.from(("Matthias", "map@example.org"))
		.to(("Johannes", "jhm@example.org"))
		.subject("")
		.text_body(text)
		.write_to_string()
		.unwrap();
	fs::write(whither, email).unwrap();
}

pub const IMPORTED_MAIL_ADDRESS: &str = "map-premium@tutanota.de";
pub const IMPORTED_MAIL_ADDRESS_PASSKEY: &str = "map";

pub async fn init_file_importer(source_paths: Vec<&str>) -> Importer {
	let logged_in_sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(NativeRestClient::try_new().unwrap()),
	)
	.create_session(IMPORTED_MAIL_ADDRESS, IMPORTED_MAIL_ADDRESS_PASSKEY)
	.await
	.unwrap();
	let mailbox_id = logged_in_sdk
		.mail_facade()
		.load_user_mailbox()
		.await
		.unwrap()
		._id
		.as_ref()
		.unwrap()
		.clone();
	let target_mailset = get_test_import_folder_id(&logged_in_sdk, MailSetKind::Archive)
		.await
		._id
		.unwrap();
	let target_owner_group = logged_in_sdk
		.mail_facade()
		.get_group_id_for_mail_address(IMPORTED_MAIL_ADDRESS)
		.await
		.unwrap();

	let files = source_paths.into_iter().map(|file_name| {
		if file_name.starts_with('/') {
			PathBuf::from(file_name)
		} else {
			PathBuf::from(format!(
				"{}/tests/resources/testmail/{file_name}",
				env!("CARGO_MANIFEST_DIR")
			))
		}
	});
	let config_directory: PathBuf = format!("/tmp/import_test_{}", get_test_id()).into();

	FileImport::delete_dir_if_exists(&config_directory).unwrap();
	fs::create_dir_all(&config_directory).unwrap();

	let import_directory = FileImport::prepare_file_import(
		config_directory.to_str().unwrap(),
		mailbox_id.as_str(),
		files,
	)
	.unwrap();

	Importer::create_new_file_importer(
		logged_in_sdk,
		target_owner_group,
		target_mailset,
		import_directory,
	)
	.await
	.unwrap()
}

async fn get_test_import_folder_id(
	logged_in_sdk: &Arc<LoggedInSdk>,
	kind: MailSetKind,
) -> MailFolder {
	let mail_facade = logged_in_sdk.mail_facade();
	let mailbox = mail_facade.load_user_mailbox().await.unwrap();
	let folders = mail_facade
		.load_folders_for_mailbox(&mailbox)
		.await
		.unwrap();
	folders
		.system_folder_by_type(kind)
		.expect("inbox should exist")
		.clone()
}
