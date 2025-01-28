use crate::importer::filename_producer::FileNameProducer;
use crate::importer::importable_mail::ImportableMail;
use crate::importer::messages::{FileIterationError, PreparationError};
use crate::importer::{FAILED_MAILS_SUB_DIR, STATE_ID_FILE_NAME};
use mail_parser::mailbox::mbox::MessageIterator;
use mail_parser::MessageParser;
use std::fs;
use std::io::BufReader;
use std::path::{Path, PathBuf};

pub struct FileImport {
	queued_eml_paths: Vec<PathBuf>,
	message_parser: MessageParser,
}

impl FileImport {
	fn next_importable_mail(&mut self) -> Result<Option<ImportableMail>, FileIterationError> {
		let Some(eml_path) = self.queued_eml_paths.pop() else {
			return Ok(None);
		};

		let eml_content = fs::read(&eml_path)
			.map_err(|_read_err| FileIterationError::FileReadError(eml_path.clone()))?;
		let parsed_mail = self
			.message_parser
			.parse(eml_content.as_slice())
			.ok_or(FileIterationError::ParseError(eml_path.clone()))?;

		let importable_mail = ImportableMail::convert_from(&parsed_mail, Some(eml_path));
		Ok(Some(importable_mail))
	}
}

impl FileImport {
	pub fn new(eml_sources: Vec<PathBuf>) -> Self {
		let message_parser = MessageParser::default();
		Self {
			queued_eml_paths: eml_sources,
			message_parser,
		}
	}

	/// marking is done by moving the failed eml file in to a @FAILED_MAILS_SUB_DIR subdirectory,
	/// so that next time we start an import we don't pick it up again
	/// (we will pick up files only directly inside the import_dir) and also we don't have to delete them
	/// so user can always refer to the import dir and see what emails failed
	pub(crate) fn move_failed_eml_file(failed_eml_path: &Path) -> std::io::Result<()> {
		let filename = failed_eml_path
			.file_name()
			.expect("failed eml path will always have filename");
		let import_directory = failed_eml_path
			.parent()
			.ok_or(std::io::ErrorKind::NotADirectory)?;
		let new_failed_eml_path = import_directory.join(FAILED_MAILS_SUB_DIR).join(filename);

		fs::rename(failed_eml_path, new_failed_eml_path)
	}

	/// Convert mbox files to eml and copy all eml files to target_folder.
	/// During the import, eml files are deleted from target_folder after they were imported.
	/// so that we can keep track of files that failed to import and allow resuming the import.
	/// returns the import directory where the EMLs and the remote import state id is stored.
	pub(crate) fn prepare_file_import(
		config_directory: &str,
		mailbox_id: &str,
		source_paths: impl Iterator<Item = PathBuf>,
	) -> Result<PathBuf, PreparationError> {
		let import_directory_path =
			FileImport::make_import_directory_path(config_directory, mailbox_id);
		let failed_sub_directory_path = import_directory_path.join(FAILED_MAILS_SUB_DIR);
		let mut filename_producer = FileNameProducer::new(import_directory_path.as_path());

		// start clean import,
		// example: import_state id file is not there but some eml files are,
		// in that case we don't want to include those eml in this import
		FileImport::delete_dir_if_exists(&import_directory_path)
			.map_err(|_| PreparationError::CanNotDeleteImportDir)?;

		fs::create_dir_all(&import_directory_path)
			.map_err(|_| PreparationError::CanNotCreateImportDir)?;
		fs::create_dir_all(failed_sub_directory_path)
			.map_err(|_| PreparationError::CanNotCreateImportDir)?;

		for source_path in source_paths {
			let is_mbox_file = source_path.extension() == Some("mbox".as_ref());
			let is_eml_file = source_path.extension() == Some("eml".as_ref());

			if is_mbox_file {
				filename_producer.new_mbox(&source_path);

				let file_buf_reader =
					fs::File::open(&source_path)
						.map(BufReader::new)
						.map_err(|read_err| {
							log::error!("Can not read file: {source_path:?}. Error: {read_err:?}");
							PreparationError::FileReadError
						})?;

				let msg_iterator = MessageIterator::new(file_buf_reader);
				for parsed_message in msg_iterator {
					let eml_filepath = filename_producer.new_file_of_current_mbox();

					let parsed_message = parsed_message.map_err(|parse_err| {
						log::error!("Can not parse a message from mbox: {parse_err:?}");
						PreparationError::NotAValidEmailFile
					})?;

					fs::write(
						import_directory_path.join(eml_filepath.clone()),
						parsed_message.contents(),
					)
					.map_err(|write_e| {
						log::error!(
							"Can not write deconstructed eml: {eml_filepath:?}. Error: {write_e:?}"
						);
						PreparationError::EmlFileWriteFailure
					})?;
				}
			} else if is_eml_file {
				let target_eml_file_path = filename_producer.new_plain_eml(&source_path);

				fs::copy(&source_path, &target_eml_file_path).map_err(|copy_err| {
					log::error!("Can not copy eml: {source_path:?}. Error: {copy_err:?}");
					PreparationError::EmlFileWriteFailure
				})?;
			} else {
				// we're ignoring files that are not eml or mbox because we try to
				// configure the dialog to only allow selecting those.
				// user probably uses some weird setup.
			}
		}

		Ok(import_directory_path)
	}

	pub fn get_next_importable_mail(&mut self) -> Option<ImportableMail> {
		// try to get next mail from sources,
		// if it fails put the error in list ( which also contains the path itself )
		// and try to get next one again until we run out of all sources
		loop {
			match self.next_importable_mail() {
				Ok(maybe_importable_mail) => return maybe_importable_mail,
				Err(FileIterationError::FileReadError(_)) => {
					// we don't have to do anything here,
					// if user restarts the app, this file will be picked up again and retried
					// if use do not restart app, they will have option to open the import directory,
					// they can see for themselves
				},
				Err(FileIterationError::ParseError(malformed_file)) => {
					Self::move_failed_eml_file(&malformed_file).ok();
				},
			}
		}
	}

	/// recursively deletes the given directory and its contents
	pub fn delete_dir_if_exists(target_dir: &PathBuf) -> std::io::Result<()> {
		target_dir
			.exists()
			.then(|| fs::remove_dir_all(target_dir))
			.unwrap_or(Ok(()))
	}

	/// makes a best-effort attempt to make the state in the given target directory
	/// look like there is no ongoing import anymore, but will ignore errors.
	/// if there were malformed files, they will remain behind to be inspected until a new import starts.
	pub fn delete_state_file(import_dir: &Path) -> std::io::Result<()> {
		fs::remove_file(import_dir.join(STATE_ID_FILE_NAME))
	}

	pub fn make_import_directory_path(config_directory: &str, mailbox_id: &str) -> PathBuf {
		[
			config_directory.to_string(),
			"current_imports".into(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect()
	}
}

#[cfg(test)]
mod test {
	use crate::importer::file_reader::FileImport;
	use crate::importer::{Importer, STATE_ID_FILE_NAME};
	use crate::test_utils::get_test_id;
	use std::fs;
	use std::fs::File;
	use std::io::Write;
	use std::path::PathBuf;
	use tutasdk::{GeneratedId, IdTupleGenerated};

	/// this is a macro because putting asserts in a function will not show where exactly the failure occured.
	macro_rules! verify_file_contents {
		($expected_path:expr, $actual_path:expr, $expected_contents:expr) => {{
			assert_eq!($expected_path.to_owned(), $actual_path.to_owned());
			let msg = std::string::String::from_utf8(fs::read(&$actual_path).unwrap()).unwrap();
			assert_eq!($expected_contents.trim(), msg.trim());
		}};
	}

	struct Setup {
		reply_path: PathBuf,
		msg_path: PathBuf,
		mbox_path: PathBuf,
		src_folder: PathBuf,
		config_directory: PathBuf,
	}

	impl Setup {
		fn new() -> Setup {
			let test_id = get_test_id();
			let src_folder: PathBuf = format!("/tmp/import_src_{:?}", test_id).into();
			let config_directory: PathBuf = format!("/tmp/import_target_{:?}", test_id).into();

			fs::create_dir_all(&src_folder).unwrap();
			let mut msg_path = src_folder.clone();
			msg_path.push("msg.eml");
			File::create(&msg_path)
				.unwrap()
				.write_all(EML_MSG.as_bytes())
				.unwrap();
			let mut reply_path = src_folder.clone();
			reply_path.push("reply.eml");
			File::create(&reply_path)
				.unwrap()
				.write_all(EML_REPLY.as_bytes())
				.unwrap();
			let mut mbox_path = src_folder.clone();
			mbox_path.push("mbox.mbox");
			let mbox_contents = "From vr@tuta.io  Fri Feb  2 20:57:39 2024\n".to_string()
				+ EML_MSG
				+ "\n\nFrom freepancakes@tutanota.com  Fri Feb  2 21:03:27 2024\n"
				+ EML_REPLY;
			File::create(&mbox_path)
				.unwrap()
				.write_all(mbox_contents.as_bytes())
				.unwrap();
			Setup {
				src_folder,
				config_directory,
				msg_path,
				reply_path,
				mbox_path,
			}
		}
	}
	impl Drop for Setup {
		fn drop(&mut self) {
			match fs::remove_dir_all(self.src_folder.clone()) {
				Ok(_) => {},
				Err(_e) => println!("can't delete src_folder {:?}", self.src_folder),
			}
			fs::remove_dir_all(self.config_directory.clone())
				.map_err(|_e| println!("can't delete target_folder {:?}", self.config_directory))
				.unwrap();
		}
	}

	const EML_MSG: &str = r#"From: vr@tuta.io
MIME-Version: 1.0
Subject: Virtual Reality Food
Date: Fri, 25 Oct 2024 08:15:39 +0000
Content-Type: text/plain; charset=UTF-8

Did you already try the new street food in VR?
		"#;

	const EML_REPLY: &str = r#"From: freepancakes@tutanota.com
MIME-Version: 1.0
Subject: RE: Virtual Reality Food
Date: Fri, 25 Oct 2024 08:15:39 +0000
Content-Type: text/plain; charset=UTF-8

> Did you already try the new street food in VR?

Yeah, but I really did not like it. Had higher hopes after watching that Simpsons episode...
		"#;

	#[test]
	pub fn prepare_import_eml() {
		let s = Setup::new();
		let import_directory = FileImport::prepare_file_import(
			s.config_directory.to_string_lossy().as_ref(),
			"someId",
			vec![s.msg_path.clone(), s.reply_path.clone()].into_iter(),
		)
		.unwrap();
		let mut eml_files = Importer::eml_files_in_directory(&import_directory).unwrap();
		eml_files.sort();
		if let [msg_path, reply_path] = eml_files.as_slice() {
			verify_file_contents!(
				msg_path,
				import_directory.clone().join("msg-0.eml"),
				EML_MSG
			);
			verify_file_contents!(
				reply_path,
				import_directory.clone().join("reply-1.eml"),
				EML_REPLY
			);
		} else {
			panic!("unexpected eml files {:?}", eml_files);
		}
	}

	#[test]
	pub fn prepare_import_mbox() {
		let s = Setup::new();
		let import_directory = FileImport::prepare_file_import(
			s.config_directory.to_string_lossy().as_ref(),
			"anotherId",
			vec![s.msg_path.clone(), s.reply_path.clone()].into_iter(),
		)
		.unwrap();

		let mut eml_files = Importer::eml_files_in_directory(&import_directory).unwrap();
		eml_files.sort();
		if let [msg_path, reply_path] = eml_files.as_slice() {
			verify_file_contents!(
				msg_path,
				import_directory.clone().join("msg-0.eml"),
				EML_MSG
			);
			verify_file_contents!(
				reply_path,
				import_directory.clone().join("reply-1.eml"),
				EML_REPLY
			);
		} else {
			panic!("unexpected eml files {:?}", eml_files);
		}
	}

	#[test]
	pub fn prepare_import_eml_and_mbox() {
		let s = Setup::new();
		let import_directory = FileImport::prepare_file_import(
			s.config_directory.to_string_lossy().as_ref(),
			"thirdId",
			vec![
				s.reply_path.clone(),
				s.mbox_path.clone(),
				s.msg_path.clone(),
			]
			.into_iter(),
		)
		.unwrap();
		let mut eml_files = Importer::eml_files_in_directory(&import_directory).unwrap();
		eml_files.sort();
		if let [mbox_msg_path, mbox_reply_path, msg_path, reply_path] = eml_files.as_slice() {
			verify_file_contents!(
				import_directory.clone().join("mbox-0.mbox-item-0.eml"),
				mbox_msg_path,
				EML_MSG
			);
			verify_file_contents!(
				import_directory.clone().join("mbox-0.mbox-item-1.eml"),
				mbox_reply_path,
				EML_REPLY
			);
			verify_file_contents!(
				import_directory.clone().join("msg-1.eml"),
				msg_path,
				EML_MSG
			);
			verify_file_contents!(
				import_directory.clone().join("reply-0.eml"),
				reply_path,
				EML_REPLY
			);
		} else {
			panic!("unexpected eml files {:?}", eml_files);
		}
	}

	#[tokio::test]
	async fn should_remove_previous_emls_while_preparing_new_import() {
		let config_dir_string = "/tmp/should_remove_previous_emls_while_preparing_new_import";
		let mailbox_id = "some_mailbox_id";
		let import_dir: PathBuf = [
			config_dir_string.to_string(),
			"current_imports".to_string(),
			mailbox_id.to_string(),
		]
		.iter()
		.collect();

		fs::create_dir_all(&import_dir).unwrap();

		let leftover_eml = import_dir.join("old-1.eml");
		let state_file = import_dir.join(STATE_ID_FILE_NAME);
		fs::write(&state_file, "list-id/element-id").unwrap();
		fs::write(leftover_eml.as_path(), "sample mail").unwrap();

		let result = Importer::get_existing_import_id(&import_dir).unwrap();
		assert_eq!(
			result,
			Some(IdTupleGenerated::new(
				GeneratedId(String::from("list-id")),
				GeneratedId(String::from("element-id"))
			))
		);

		FileImport::prepare_file_import(config_dir_string, mailbox_id, std::iter::empty()).unwrap();

		assert!(!state_file.exists());
		assert!(!leftover_eml.exists());
	}
}
