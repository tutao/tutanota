use crate::importer::importable_mail::ImportableMail;
use crate::importer::ImportStatus;
use mail_parser::mailbox::mbox::MessageIterator;
use mail_parser::MessageParser;
use std::io::{BufReader, Read};

pub struct FileImport {
	message_provider: ImportableMailProvider,
}

pub enum ImportableMailProvider {
	Mbox {
		message_iterator: MessageIterator<BufReader<std::fs::File>>,
	},

	UnitEml {
		// will be none after first read
		file_buffer: Option<BufReader<std::fs::File>>,
	},
}

impl ImportableMailProvider {
	pub fn is_single_import(&self) -> bool {
		matches!(self, ImportableMailProvider::UnitEml { file_buffer: _ })
	}

	pub fn is_multi_import(&self) -> bool {
		matches!(
			self,
			ImportableMailProvider::Mbox {
				message_iterator: _
			}
		)
	}
}

impl Iterator for ImportableMailProvider {
	type Item = Result<ImportableMail, FileIterationError>;

	fn next(&mut self) -> Option<Self::Item> {
		let message_contents = match self {
			ImportableMailProvider::Mbox { message_iterator } => {
				let next_message = match message_iterator.next()? {
					Ok(m) => m,
					Err(e) => {
						return Some(Err(FileIterationError::MboxParseError));
					},
				};
				next_message.unwrap_contents()
			},

			ImportableMailProvider::UnitEml {
				file_buffer: maybe_file_buffer,
			} => {
				let file_buffer = maybe_file_buffer.as_mut()?;
				let mut file_content = Vec::new();
				let read_res = file_buffer.read_to_end(&mut file_content);
				match read_res {
					Ok(_file_size) => {
						// remove file buffer, so next time, Iterator::next() will resolve to None
						// signaling end of iterator
						*maybe_file_buffer = None;
						file_content
					},
					Err(e) => return Some(Err(FileIterationError::FileReadError)),
				}
			},
		};

		let parsed_message = MessageParser::default()
			.parse(message_contents.as_slice())
			.expect(&format!(
				"Cannot parse: \n{}",
				String::from_utf8(message_contents.to_vec()).unwrap()
			));
		// {
		// 	Some(parsed_message) => parsed_message,
		// 	None => return Some(Err(FileIterationError::MessageParseError)),
		// };
		match ImportableMail::try_from(parsed_message) {
			Ok(importable_mail) => Some(Ok(importable_mail)),
			Err(e) => Some(Err(FileIterationError::NoImportableMail)),
		}
	}
}

impl FileImport {
	pub fn new(file_path: &str, is_mbox: bool) -> Self {
		let file_handle = std::fs::File::open(file_path).unwrap();
		let file_read_buffer = BufReader::new(file_handle);

		let message_provider = if is_mbox {
			ImportableMailProvider::Mbox {
				message_iterator: MessageIterator::new(file_read_buffer),
			}
		} else {
			ImportableMailProvider::UnitEml {
				file_buffer: Some(file_read_buffer),
			}
		};

		Self { message_provider }
	}
}

#[derive(Debug, Clone, PartialEq)]
pub enum FileIterationError {
	/// we have read all contents
	SourceEnd,

	/// cannot parse next item from mbox
	MboxParseError,

	/// File Read Error
	FileReadError,

	/// cannot parse raw content to message
	MessageParseError,

	/// Cannot convert the read message to, Importable Mail
	NoImportableMail,
}

impl FileImport {
	pub fn read_next_importable_mail(&mut self) -> Result<ImportableMail, FileIterationError> {
		self.message_provider
			.next()
			.ok_or(FileIterationError::SourceEnd)?
	}

	pub async fn continue_import(&mut self) -> ImportStatus {
		let mut failed_import_count = 0_usize;

		while let Some(maybe_importable_mail) = self.message_provider.next() {
			let importable_mail = match maybe_importable_mail {
				Ok(importable_mail) => importable_mail,
				Err(e) => {
					failed_import_count += 1;
					continue;
				},
			};

			let import_is_done = self.import_one_mail(importable_mail);
			if let Err(e) = import_is_done {
				failed_import_count += 1;
			}
		}

		if failed_import_count == 0 {
			todo!()
		} else {
			// we looped through everything, and there were no failed import recorded, yay!
			ImportStatus::Finished
		}
	}

	fn import_one_mail(&self, importable_mail: ImportableMail) -> Result<(), ()> {
		Ok(())
	}
}
