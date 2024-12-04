//! keep in sync with MimeToolsTestMessages.java

use crate::importer::importable_mail::plain_text_to_html_converter::plain_text_to_html;
use crate::importer::importable_mail::{ImportableMail, ImportableMailAttachment, MailContact};
use mail_parser::decoders::base64::base64_decode;
use serde::Deserialize;
use std::collections::HashSet;
use std::io::Read;
use tutasdk::date::DateTime;

#[test]
fn mime_tools_test_messages() {
	const DATA_DIR: &'static str = concat!(
		env!("CARGO_MANIFEST_DIR"),
		"/tests/resources/mimetools-testmsgs"
	);
	let source_message_paths = std::fs::read_dir(DATA_DIR)
		.unwrap()
		.map(Result::unwrap)
		.filter(|p| {
			p.path()
				.into_os_string()
				.into_string()
				.unwrap()
				.ends_with(".msg")
		});

	let ignored_files = [
		// encoding not specified so we are falling back to us-ascii but message contains chars encoded in different charset
		"infinite.msg",
		// body correctly interpreted as message/rfc822 (due to multipart/digest) whereas the server seems to default to plain/text even for multipart/digest
		"multi-digest.msg",
		// first part is not ignored because of duplicate content-type header, java parser opts for first content-type whereas rust mime-parser uses second content-type header
		"multi-bad.msg",
		// for some reason, we expect 2 out of 3 boundaries-like text to be included in attachment content
		// parsing of frag.msg is currently broken on client and server side as attachment body
		// can not be converted to a valid byte array
		"frag.msg",
		// double encoded .eml
		"multi-2gifs-base64.msg",
	]
	.into_iter()
	.collect::<HashSet<_>>();

	for message_file_path in source_message_paths {
		let message_filename = message_file_path.file_name().into_string().unwrap();
		if ignored_files.contains(message_filename.as_str()) {
			eprintln!("File: {message_filename}. --> ignored..");
			continue;
		}
		eprintln!("File: {message_filename} --> testing");

		let mut message_file_content = vec![];
		std::fs::File::open(message_file_path.path())
			.unwrap()
			.read_to_end(&mut message_file_content)
			.unwrap();
		let parsed_message = mail_parser::MessageParser::default()
			.parse(message_file_content.as_slice())
			.unwrap();

		let expected_json_file_name = format!(
			"{DATA_DIR}/{}",
			message_filename.replace(".msg", "-expected.json")
		);
		let FileContent {
			result: expected_result,
			exception: _,
		} = FileContent::read_from_file(expected_json_file_name.as_str()).unwrap();
		let parsed_message_result = ImportableMail::try_from(&parsed_message);

		if expected_result.is_none() {
			eprintln!("above file has `error` field set in in -expected.json ......");
			continue;
		}

		let mut parsed_message = parsed_message_result.unwrap();
		let mut expected_importable_mail: ImportableMail = expected_result.unwrap().into();

		// we import raw headers and there is no need to compare them
		parsed_message.headers_string.clear();
		expected_importable_mail.headers_string.clear();

		// we don't cover date headers in server as well.
		// .msg and -expected.json do not share same date seems like
		parsed_message.date = None;
		expected_importable_mail.date = None;

		// todo:
		// we don't have different envelope sender in -expected.json
		parsed_message.different_envelope_sender = None;

		for i in 0..std::cmp::max(
			parsed_message.attachments.len(),
			expected_importable_mail.attachments.len(),
		) {
			let a = &mut parsed_message.attachments[i];
			let b = &mut expected_importable_mail.attachments[i];

			// since headers might have more attribute in actual message
			// and in expected message we only have mime-type;charset
			// we can make sure the first part ( i.e mime-type;charset ) is same
			assert!(a
				.content_type
				.to_ascii_lowercase()
				.starts_with(b.content_type.to_ascii_lowercase().as_str()));
			a.content_type.clear();
			b.content_type.clear();

			// assert_eq!(
			// 	String::from_utf8_lossy(a.content.as_slice()),
			// 	String::from_utf8_lossy(b.content.as_slice())
			// );
		}

		assert_eq!(parsed_message, expected_importable_mail);
	}
}

impl From<TestMailAddress> for MailContact {
	fn from(value: TestMailAddress) -> Self {
		let TestMailAddress {
			name,
			mail_address,
			valid: _,
		} = value;
		Self { mail_address, name }
	}
}

impl From<ExpectedMessage> for ImportableMail {
	fn from(expected_message: ExpectedMessage) -> Self {
		ImportableMail {
			headers_string: expected_message.mail_headers,
			subject: expected_message.subject,
			html_body_text: expected_message.html_body_text.clone().unwrap_or(
				expected_message
					.plain_body_text
					.map(|plain| plain_text_to_html(&plain))
					.unwrap_or_default(),
			),
			attachments: expected_message
				.attached_files
				.into_iter()
				.map(|f| ImportableMailAttachment {
					filename: f.name,
					content_id: if f.content_id.is_empty() {
						None
					} else {
						Some(f.content_id)
					},
					content_type: {
						let mut content_type = String::new();

						if !f.mime_type.is_empty() {
							content_type.push_str(f.mime_type.as_str());
						}
						if let Some(charset) = f.charset {
							content_type.push_str(";");
							content_type.push_str(&format!("charset=\"{charset}\""));
						}

						content_type
					},
					content: base64_decode(f.data.as_bytes()).unwrap(),
				})
				.collect(),
			date: expected_message
				.sent_date
				.map(|timestamp| DateTime::from_millis(timestamp as u64)),
			different_envelope_sender: None,
			from_addresses: {
				let sender = expected_message.sender;
				if sender.name.is_empty() && sender.mail_address.is_empty() {
					vec![]
				} else {
					vec![sender.into()]
				}
			},
			to_addresses: expected_message
				.to_recipients
				.into_iter()
				.map(Into::into)
				.collect(),
			cc_addresses: expected_message
				.cc_recipients
				.into_iter()
				.map(Into::into)
				.collect(),
			bcc_addresses: expected_message
				.bcc_recipients
				.into_iter()
				.map(Into::into)
				.collect(),
			reply_to_addresses: expected_message
				.reply_to
				.into_iter()
				.map(Into::into)
				.collect(),
			ical_type: Default::default(),
			reply_type: Default::default(),
			mail_state: Default::default(),
			is_phishing: false,
			unread: false,
			message_id: expected_message.id,
			in_reply_to: expected_message.in_reply_to,
			references: expected_message.references,
		}
	}
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestMailAddress {
	name: String,
	mail_address: String,
	valid: bool,
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedAttachedFile {
	name: String,
	data: String,
	mime_type: String,
	charset: Option<String>,
	content_id: String,
	calender_method: Option<()>,
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedMessage {
	id: Option<String>,
	boundary: Option<String>,
	alternative_boundary: Option<String>,
	sender: TestMailAddress,
	to_recipients: Vec<TestMailAddress>,
	cc_recipients: Vec<TestMailAddress>,
	bcc_recipients: Vec<TestMailAddress>,
	reply_to: Vec<TestMailAddress>,
	in_reply_to: Option<String>,
	references: Vec<String>,
	auto_submitted: Option<()>,
	sent_date: Option<i64>,
	subject: String,
	plain_body_text: Option<String>,
	html_body_text: Option<String>,
	attached_messages: Vec<()>,
	attached_files: Vec<ExpectedAttachedFile>,
	mail_headers: String,
	spf_result: String,
	list_unsubscribe: bool,
	mail_authentication_result: Option<()>,
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Exception {
	clazz: String,
	message: String,
}

#[derive(Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
	exception: Option<Exception>,
	result: Option<ExpectedMessage>,
}

impl FileContent {
	fn read_from_file(file_path: &str) -> Result<Self, String> {
		let file_content = std::fs::read_to_string(file_path)
			.map_err(|_| format!("Cannot read content of: {file_path}"))?;
		serde_json::from_str::<FileContent>(file_content.as_str())
			.map_err(|e| format!("Cannot read to valid ExpectedMessage struct. Error: {e:?}"))
	}
}
