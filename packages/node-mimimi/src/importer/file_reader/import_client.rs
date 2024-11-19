use crate::importer::importable_mail::ImportableMail;
use mail_parser::mailbox::mbox::MessageIterator;
use mail_parser::MessageParser;
use std::io::{BufReader, Read};

pub struct FileImport {
	mbox_sources: Vec<MessageIterator<BufReader<std::fs::File>>>,
	eml_sources: Vec<BufReader<std::fs::File>>,

	message_parser: MessageParser,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FileIterationError {
	/// We have read all contents
	SourceEnd,

	/// Cannot parse next item from mbox
	MboxParseError,

	/// File read error
	FileReadError,

	/// Cannot parse raw content to message
	MessageParseError(String),

	/// Cannot convert the read message to ImportableMail
	NoImportableMail,
}

impl FileImport {
	fn next_eml_contents(&mut self) -> Result<Vec<u8>, FileIterationError> {
		let mut eml_file_source = self
			.eml_sources
			.pop()
			.ok_or(FileIterationError::SourceEnd)?;
		let mut file_content = Vec::new();
		eml_file_source
			.read_to_end(&mut file_content)
			.map_err(|_| FileIterationError::FileReadError)?;

		Ok(file_content)
	}

	fn next_mbox_item_contents(&mut self) -> Result<Vec<u8>, FileIterationError> {
		let mbox_source = self
			.mbox_sources
			.last_mut()
			.ok_or(FileIterationError::SourceEnd)?;
		match mbox_source.next() {
			Some(Ok(mbox_item)) => Ok(mbox_item.unwrap_contents()),

			Some(Err(_e)) => Err(FileIterationError::MboxParseError),

			None => {
				self.mbox_sources.pop();
				self.next_mbox_item_contents()
			},
		}
	}
}

impl FileImport {
	pub fn new(source_paths: Vec<String>) -> Result<Self, FileIterationError> {
		let mut mbox_sources = Vec::new();
		let mut eml_sources = Vec::new();

		for source_path in source_paths {
			let file_buf_reader = std::fs::File::open(source_path.as_str())
				.map(BufReader::new)
				.map_err(|_| FileIterationError::FileReadError)?;

			let is_mbox_file = source_path.ends_with(".mbox");
			let is_eml_file = source_path.ends_with(".eml");

			if is_eml_file {
				eml_sources.push(file_buf_reader);
			} else if is_mbox_file {
				mbox_sources.push(MessageIterator::new(file_buf_reader));
			} else {
				Err(FileIterationError::FileReadError)?
			}
		}

		let message_parser = MessageParser::default();
		Ok(Self {
			mbox_sources,
			eml_sources,
			message_parser,
		})
	}

	/// Get next importable mail form sources,
	/// will try to exhaust eml_sources first
	pub fn get_next_importable_mail(&mut self) -> Result<ImportableMail, FileIterationError> {
		// Get next item from eml source first. once all eml sources are exhausted,
		// move to next mbox sources,
		let mut email_contents_res = self.next_eml_contents();
		if email_contents_res == Err(FileIterationError::SourceEnd) {
			email_contents_res = self.next_mbox_item_contents();
		}
		let email_contents = email_contents_res?;

		let parsed_message = self
			.message_parser
			.parse(email_contents.as_slice())
			.ok_or_else(|| FileIterationError::MessageParseError("todo1".to_string()))?;
		let importable_mail = ImportableMail::try_from(&parsed_message)
			.map_err(|e| FileIterationError::MessageParseError(format!("{e:?}")))?;
		Ok(importable_mail)
	}
}
