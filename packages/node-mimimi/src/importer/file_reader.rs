use crate::importer::importable_mail::ImportableMail;
use mail_parser::mailbox::mbox::MessageIterator;
use mail_parser::MessageParser;
use std::ffi::OsStr;
use std::fs;
use std::io::{BufReader, Read};
use std::path::PathBuf;

pub struct FileImport {
	eml_sources: Vec<PathBuf>,

	message_parser: MessageParser,
}

#[derive(Debug)]
pub enum FileIterationError {
	/// We have read all contents
	SourceEnd,

	/// Cannot parse next item from mbox
	MboxParseError(mail_parser::mailbox::mbox::ParseError),

	/// File read error
	FileReadError(std::io::Error),

	/// Not a valid eml or mbox file
	UnsupportedFile,

	/// Cannot convert the read message to ImportableMail
	NoImportableMail,

	/// Can not parse file content to Message format
	NotAValidEmailFile,
	CantWriteToDisk(std::io::Error),
}

struct SourceEml {
	file_content: Vec<u8>,
	eml_file_path: PathBuf,
}

impl FileImport {
	fn next_eml_contents(&mut self) -> Result<SourceEml, FileIterationError> {
		let eml_file_path = self
			.eml_sources
			.pop()
			.ok_or(FileIterationError::SourceEnd)?;
		let file_content = fs::read(&eml_file_path).map_err(FileIterationError::FileReadError)?;
		Ok(SourceEml {
			file_content,
			eml_file_path,
		})
	}
}

impl FileImport {
	pub fn new(eml_sources: Vec<PathBuf>) -> Result<Self, FileIterationError> {
		let message_parser = MessageParser::default();
		Ok(Self {
			eml_sources,
			message_parser,
		})
	}

	/// Convert mbox files to eml and copy all eml files to target_folder.
	/// During the import, eml files are deleted from target_folder after they were imported.
	/// so that we can keep track of files that failed to import and allow resuming the import.
	pub(crate) fn prepare_import(
		target_folder: PathBuf,
		source_paths: Vec<PathBuf>,
	) -> Result<Vec<PathBuf>, FileIterationError> {
		fs::create_dir_all(&target_folder).map_err(FileIterationError::CantWriteToDisk)?;
		let mut target_paths: Vec<PathBuf> = vec![];
		let mut file_counter = 0;
		for source_path in source_paths {
			let file_buf_reader = std::fs::File::open(&source_path)
				.map(BufReader::new)
				.map_err(FileIterationError::FileReadError)?;
			let is_mbox_file = source_path.extension() == Some("mbox".as_ref());
			let is_eml_file = source_path.extension() == Some("eml".as_ref());
			if is_mbox_file {
				let msg_iterator = MessageIterator::new(file_buf_reader);
				for result in msg_iterator {
					let mut eml_path = target_folder.to_path_buf();
					eml_path.push(file_counter.to_string() + ".eml");
					if let Ok(message) = result {
						fs::write(&eml_path, message.contents()).unwrap();
						target_paths.push(eml_path);
						file_counter += 1;
					} else {
						return Err(FileIterationError::NotAValidEmailFile);
					}
				}
			} else if is_eml_file {
				let mut eml_path = target_folder.to_path_buf();
				eml_path.push(file_counter.to_string() + ".eml");
				fs::copy(&source_path, &eml_path).map_err(FileIterationError::FileReadError)?;
				file_counter += 1;
				target_paths.push(eml_path);
			} else {
				return Err(FileIterationError::UnsupportedFile);
			}
		}
		Ok(target_paths)
	}

	/// Get next importable mail form sources,
	/// will try to exhaust eml_sources first
	pub fn get_next_importable_mail(&mut self) -> Result<ImportableMail, FileIterationError> {
		// Get next item from eml source first. once all eml sources are exhausted,
		// move to next mbox sources,
		let mut eml = self.next_eml_contents()?;

		let parsed_message = self
			.message_parser
			.parse(eml.file_content.as_slice())
			.ok_or_else(|| FileIterationError::NotAValidEmailFile)?;
		let importable_mail =
			ImportableMail::convert_from(&parsed_message, Some(eml.eml_file_path))
				.map_err(|e| FileIterationError::NoImportableMail)?;
		Ok(importable_mail)
	}
}

mod test {
	use crate::importer::file_reader::FileImport;
	use std::fs;
	use std::fs::File;
	use std::io::Write;
	use std::path::PathBuf;
	use std::sync::Mutex;

	struct Setup {
		reply_path: PathBuf,
		msg_path: PathBuf,
		mbox_path: PathBuf,
		src_folder: PathBuf,
		target_folder: PathBuf,
	}

	fn get_test_id() -> u32 {
		static TEST_COUNTER: Mutex<u32> = Mutex::new(0);
		let mut old_count_guard = TEST_COUNTER.lock().expect("Mutex poisoned");
		let new_count = old_count_guard.checked_add(1).unwrap();
		*old_count_guard = new_count;
		drop(old_count_guard);
		new_count
	}
	impl Setup {
		fn new() -> Setup {
			let test_id = get_test_id();
			let src_folder: PathBuf = format!("/tmp/import_src_{:?}", test_id).into();
			let target_folder: PathBuf = format!("/tmp/import_target_{:?}", test_id).into();
			fs::create_dir_all(&src_folder).unwrap();
			let mut msg_path = src_folder.clone();
			msg_path.push("msg.eml");
			File::create(&msg_path)
				.unwrap()
				.write(EML_MSG.as_bytes())
				.unwrap();
			let mut reply_path = src_folder.clone();
			reply_path.push("reply.eml");
			File::create(&reply_path)
				.unwrap()
				.write(EML_REPLY.as_bytes())
				.unwrap();
			let mut mbox_path = src_folder.clone();
			mbox_path.push("mbox.mbox");
			let mbox_contents = "From vr@tuta.io  Fri Feb  2 20:57:39 2024\n".to_string()
				+ EML_MSG
				+ "\n\nFrom freepancakes@tutanota.com  Fri Feb  2 21:03:27 2024\n"
				+ EML_REPLY;
			File::create(&mbox_path)
				.unwrap()
				.write(mbox_contents.as_bytes())
				.unwrap();
			Setup {
				src_folder,
				target_folder,
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
				Err(e) => println!("can't delete src_folder {:?}", self.src_folder),
			}
			fs::remove_dir_all(self.target_folder.clone())
				.map_err(|e| println!("can't delete target_folder {:?}", self.target_folder))
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
		let eml_files = FileImport::prepare_import(
			s.target_folder.clone(),
			vec![s.msg_path.clone(), s.reply_path.clone()],
		)
		.unwrap();
		if let [msg_path, reply_path] = eml_files.as_slice() {
			verify_file_contents(
				msg_path,
				&[&s.target_folder, &"0.eml".into()].into_iter().collect(),
				EML_MSG,
			);
			verify_file_contents(
				reply_path,
				&[&s.target_folder, &"1.eml".into()].iter().collect(),
				EML_REPLY,
			);
		} else {
			panic!("unexpected eml files {:?}", eml_files);
		}
	}

	#[test]
	pub fn prepare_import_mbox() {
		let s = Setup::new();
		let eml_files = FileImport::prepare_import(
			s.target_folder.clone(),
			vec![s.msg_path.clone(), s.reply_path.clone()],
		)
		.unwrap();

		if let [msg_path, reply_path] = eml_files.as_slice() {
			verify_file_contents(
				msg_path,
				&[&s.target_folder, &"0.eml".into()].into_iter().collect(),
				EML_MSG,
			);
			verify_file_contents(
				reply_path,
				&[&s.target_folder, &"1.eml".into()].iter().collect(),
				EML_REPLY,
			);
		} else {
			panic!("unexpected eml files {:?}", eml_files);
		}
	}

	#[test]
	pub fn prepare_import_eml_and_mbox() {
		let s = Setup::new();
		let eml_files = FileImport::prepare_import(
			s.target_folder.clone(),
			vec![
				s.reply_path.clone(),
				s.mbox_path.clone(),
				s.msg_path.clone(),
			],
		)
		.unwrap();
		if let [reply_path, mbox_msg_path, mbox_reply_path, msg_path] = eml_files.as_slice() {
			verify_file_contents(
				reply_path,
				&[&s.target_folder, &"0.eml".into()].iter().collect(),
				EML_REPLY,
			);
			verify_file_contents(
				mbox_msg_path,
				&[&s.target_folder, &"1.eml".into()].into_iter().collect(),
				EML_MSG,
			);
			verify_file_contents(
				mbox_reply_path,
				&[&s.target_folder, &"2.eml".into()].iter().collect(),
				EML_REPLY,
			);
			verify_file_contents(
				msg_path,
				&[&s.target_folder, &"3.eml".into()].into_iter().collect(),
				EML_MSG,
			);
		} else {
			panic!("unexpected eml files {:?}", eml_files);
		}
	}

	fn verify_file_contents(
		actual_path: &PathBuf,
		expected_path: &PathBuf,
		expected_contents: &str,
	) {
		assert_eq!(expected_path, actual_path);
		let msg = String::from_utf8(fs::read(actual_path).unwrap()).unwrap();
		assert_eq!(expected_contents.trim(), msg.trim());
	}
}
