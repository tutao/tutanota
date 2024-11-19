use j4rs::{Instance, InvocationArg, Jvm};
use std::collections::HashMap;

pub mod jvm_singeleton;
pub mod utils;

pub const GREENMAIL_TEST_SERVER_JAR: &str = env!("GREENMAIL_TEST_SERVER_JAR");
pub const IMAPS_STARTING_PORT: i32 = 3993;

pub struct GreenMailTestServer {
	pub jvm: Jvm,
	pub server: Instance,

	pub imaps_address: (String, u32),

	pub users: HashMap<&'static str, Instance>,
	pub imaps_port: i32,
}

impl GreenMailTestServer {
	pub fn new() -> Self {
		let this_jvm_id = jvm_singeleton::start_or_attach_to_jvm();
		let imaps_port = this_jvm_id + IMAPS_STARTING_PORT;
		let jvm = Jvm::attach_thread().unwrap();

		let imaps_host = jvm
			.static_class_field("greenmailserver.GreenMailServer", "imapsHost")
			.map(|v| jvm.to_rust(v))
			.unwrap()
			.unwrap();
		let imaps_address = (imaps_host, imaps_port as u32);

		let server = jvm
			.create_instance(
				"greenmailserver.GreenMailServer",
				&[InvocationArg::try_from(imaps_port).unwrap()],
			)
			.unwrap();

		let mut users = HashMap::new();
		users.insert("map", jvm.field(&server, "userMap").unwrap());
		users.insert("sug", jvm.field(&server, "userSug").unwrap());

		Self {
			users,
			jvm,
			server,
			imaps_address,
			imaps_port,
		}
	}

	pub fn stop(self) {
		self.stop_greenmail_server();
	}

	fn stop_greenmail_server(&self) {
		self.jvm
			.invoke(&self.server, "stop", InvocationArg::empty())
			.unwrap();
	}

	pub fn store_mail(&self, receiver: &str, mime_message: &str) {
		self.jvm
			.invoke(
				&self.server,
				"store_mail",
				&[
					&InvocationArg::try_from(receiver).unwrap(),
					&mime_message.try_into().unwrap(),
				],
			)
			.unwrap();
	}
}

impl Drop for GreenMailTestServer {
	fn drop(&mut self) {
		self.stop_greenmail_server()
	}
}

#[cfg(test)]
pub mod greenmail_interaction {
	use super::*;
	use std::process::Command;

	#[test]
	pub fn ensure_imap_server_running() {
		let test_server = GreenMailTestServer::new();
		let (imaps_host, imaps_port) = &test_server.imaps_address;

		let output = Command::new("curl")
			.args([
				format!("imaps://{imaps_host}:{imaps_port}").as_str(),
				"--request",
				"CAPABILITY",
				"-k",
			])
			.output()
			.unwrap();

		assert!(output.status.success());
		assert_eq!(
			b"* CAPABILITY IMAP4rev1 LITERAL+ UIDPLUS SORT IDLE MOVE QUOTA\r\n",
			output.stdout.as_slice()
		);
	}

	#[test]
	pub fn ensure_can_store_mail() {
		let test_server = GreenMailTestServer::new();
		let (imaps_host, imaps_port) = &test_server.imaps_address;

		test_server.store_mail(
			"sug@example.org",
			r#"From: Some One <someone@example.com>
MIME-Version: 1.0
Content-Type: multipart/mixed;
        boundary="XXXXboundary text"

This is a multipart message in MIME format.

--XXXXboundary text
Content-Type: text/plain

this is the body text

--XXXXboundary text
Content-Type: text/plain;
Content-Disposition: attachment;
        filename="test.txt"

this is the attachment text

--XXXXboundary text--"#,
		);

		let output = Command::new("curl")
			.args([
				format!("imaps://{imaps_host}:{imaps_port}/INBOX").as_str(),
				"--request",
				"LIST \"\" *",
				"--user",
				"sug@example.org:sug",
				"--request",
				"FETCH 1 BODY[HEADER]",
				"-k",
			])
			.output()
			.unwrap();

		assert!(output.status.success());
		assert_eq!(
			b"* 1 FETCH (FLAGS (\\Seen) BODY[HEADER] {127}\r\n",
			output.stdout.as_slice(),
			"{}",
			String::from_utf8(output.stdout.to_vec()).unwrap()
		);
	}
}
