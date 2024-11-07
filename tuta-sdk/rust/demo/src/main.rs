use std::collections::HashMap;
use std::error::Error;
use std::sync::Arc;

use async_trait::async_trait;

use tutasdk::folder_system::MailSetKind;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::rest_client::{
	HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
};
use tutasdk::GeneratedId;
use tutasdk::Sdk;

struct ReqwestHttpClient {
	client: reqwest::Client,
}

#[async_trait]
impl RestClient for ReqwestHttpClient {
	async fn request_binary(
		&self,
		url: String,
		method: HttpMethod,
		options: RestClientOptions,
	) -> Result<RestResponse, RestClientError> {
		self.request_inner(url, method, options).await.map_err(|e| {
			eprintln!("Network request failed! {:?}", e);
			RestClientError::NetworkError
		})
	}
}

impl ReqwestHttpClient {
	fn new() -> Self {
		ReqwestHttpClient {
			client: reqwest::Client::new(),
		}
	}
	async fn request_inner(
		&self,
		url: String,
		method: HttpMethod,
		options: RestClientOptions,
	) -> Result<RestResponse, Box<dyn Error>> {
		use reqwest::header::{HeaderMap, HeaderName};
		let mut req = self.client.request(http_method(method), url);
		if let Some(body) = options.body {
			req = req.body(body);
		}
		let mut headers: HeaderMap = HeaderMap::with_capacity(options.headers.len());
		for (key, value) in options.headers {
			headers.insert(HeaderName::from_bytes(key.as_bytes())?, value.try_into()?);
		}
		let res = req.headers(headers).send().await?;

		let mut ret_headers = HashMap::with_capacity(res.headers().len());
		// for some reason collect() does not work
		for (key, value) in res.headers() {
			ret_headers.insert(key.to_string(), value.to_str()?.to_owned());
		}
		Ok(RestResponse {
			status: res.status().as_u16() as u32,
			headers: ret_headers,
			body: Some(
				res.bytes()
					.await
					.expect("assuming response has a body")
					.into(),
			),
		})
	}
}

fn http_method(http_method: HttpMethod) -> reqwest::Method {
	use reqwest::Method;
	match http_method {
		HttpMethod::GET => Method::GET,
		HttpMethod::POST => Method::POST,
		HttpMethod::PUT => Method::PUT,
		HttpMethod::DELETE => Method::DELETE,
	}
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	use base64::prelude::*;

	// replace with real values
	let host = "http://localhost:9000";
	let credentials = Credentials {
		login: "bed-free@tutanota.de".to_owned(),
		access_token: "access_token".to_owned(),
		credential_type: CredentialType::Internal,
		user_id: GeneratedId("user_id".to_owned()),
		encrypted_passphrase_key: BASE64_STANDARD.decode("encrypted_passphrase_key").unwrap(),
	};

	let rest_client = ReqwestHttpClient::new();
	let sdk = Sdk::new(host.to_owned(), Arc::new(rest_client));
	let session = sdk.login(credentials).await?;
	let mail_facade = session.mail_facade();

	let mailbox = mail_facade.load_user_mailbox().await?;

	let folders = mail_facade.load_folders_for_mailbox(&mailbox).await?;
	let inbox = folders
		.system_folder_by_type(MailSetKind::Inbox)
		.expect("inbox exists");
	let inbox_mails = mail_facade.load_mails_in_folder(inbox).await?;

	println!("Inbox:");
	for mail in inbox_mails {
		let sender_arg = if mail.sender.name.is_empty() {
			format!("<{}>", mail.sender.address)
		} else {
			format!("{} <{}>", mail.sender.name, mail.sender.address)
		};
		println!("{0: <40}\t{1: <40}", sender_arg, mail.subject)
	}
	Ok(())
}
