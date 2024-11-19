use crate::tuta_imap::utils::BufReadExtension;
use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{ClientConfig, ClientConnection, DigitallySignedStruct, Error, SignatureScheme};
use std::io::{BufReader, Read, Write};
use std::net::{SocketAddr, SocketAddrV4, TcpStream};
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

pub type SecuredStream = rustls::StreamOwned<ClientConnection, TcpStream>;

pub struct TlsStream {
	buffer_controller: BufReader<SecuredStream>,
}

impl TlsStream {
	pub fn new(address: &str, port: u16) -> Self {
		let tcp_address = SocketAddr::V4(SocketAddrV4::new(
			std::net::Ipv4Addr::from_str(address).unwrap(),
			port,
		));
		let tcp_stream = TcpStream::connect_timeout(&tcp_address, Duration::from_secs(10)).unwrap();

		let dangerous_config = ClientConfig::builder()
			.dangerous()
			.with_custom_certificate_verifier(Arc::new(MockSsl))
			.with_no_client_auth();
		let client_connection = rustls::ClientConnection::new(
			Arc::new(dangerous_config),
			address.to_string().try_into().unwrap(),
		)
		.unwrap();

		let buffer_controller = BufReader::new(SecuredStream::new(client_connection, tcp_stream));
		TlsStream { buffer_controller }
	}

	pub fn write_imap_command(&mut self, encoded_command: &[u8]) -> std::io::Result<usize> {
		let writer = self.buffer_controller.get_mut();
		let written = writer.write(encoded_command)?;
		writer.flush()?;
		Ok(written)
	}

	pub fn read_until_crlf(&mut self) -> std::io::Result<Vec<u8>> {
		let mut line_until_crlf = Vec::new();
		self.buffer_controller
			.read_until_slice(b"\r\n", &mut line_until_crlf)?;

		Ok(line_until_crlf)
	}

	pub fn read_exact(&mut self, target: &mut Vec<u8>) -> std::io::Result<()> {
		self.buffer_controller.read_exact(target)
	}
}

#[derive(Debug)]
pub struct MockSsl;

impl ServerCertVerifier for MockSsl {
	fn verify_server_cert(
		&self,
		_end_entity: &CertificateDer<'_>,
		_intermediates: &[CertificateDer<'_>],
		_server_name: &ServerName<'_>,
		_ocsp_response: &[u8],
		_now: UnixTime,
	) -> Result<ServerCertVerified, Error> {
		Ok(ServerCertVerified::assertion())
	}

	fn verify_tls12_signature(
		&self,
		_message: &[u8],
		_cert: &CertificateDer<'_>,
		_dss: &DigitallySignedStruct,
	) -> Result<HandshakeSignatureValid, Error> {
		Ok(HandshakeSignatureValid::assertion())
	}

	fn verify_tls13_signature(
		&self,
		_message: &[u8],
		_cert: &CertificateDer<'_>,
		_dss: &DigitallySignedStruct,
	) -> Result<HandshakeSignatureValid, Error> {
		Ok(HandshakeSignatureValid::assertion())
	}

	fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
		vec![
			SignatureScheme::RSA_PKCS1_SHA1,
			SignatureScheme::ECDSA_SHA1_Legacy,
			SignatureScheme::RSA_PKCS1_SHA256,
			SignatureScheme::ECDSA_NISTP256_SHA256,
			SignatureScheme::RSA_PKCS1_SHA384,
			SignatureScheme::ECDSA_NISTP384_SHA384,
			SignatureScheme::RSA_PKCS1_SHA512,
			SignatureScheme::ECDSA_NISTP521_SHA512,
			SignatureScheme::RSA_PSS_SHA256,
			SignatureScheme::RSA_PSS_SHA384,
			SignatureScheme::RSA_PSS_SHA512,
			SignatureScheme::ED25519,
			SignatureScheme::ED448,
		]
	}
}
