// when used externally by other crates the feature flag "test_utils" must be active
// should be declared in the dev dependencies
// maybe this compatibility test should be in its own crate too
#![cfg(feature = "test_utils")]

use base64::engine::{general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Deserializer, Serializer};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AesTest {
	#[serde(with = "Base64")]
	pub plain_text_base64: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "Base64")]
	pub cipher_text_base64: Vec<u8>,
	#[serde(with = "const_hex")]
	pub hex_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub key_to_encrypt256: Vec<u8>,
	#[serde(with = "const_hex")]
	pub key_to_encrypt128: Vec<u8>,
	#[serde(with = "Base64")]
	pub encrypted_key256: Vec<u8>,
	#[serde(with = "Base64")]
	pub encrypted_key128: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Aes128MacTest {
	#[serde(with = "Base64")]
	pub plain_text_base64: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "Base64")]
	pub cipher_text_base64: Vec<u8>,
	#[serde(with = "const_hex")]
	pub hex_key: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HkdfTest {
	#[serde(with = "const_hex")]
	pub salt_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub input_key_material_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub info_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub hkdf_hex: Vec<u8>,
	pub length_in_bytes: usize,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HmacTest {
	#[serde(with = "const_hex")]
	pub key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub data_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub hmac_sha256_tag_hex: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Argon2Test {
	pub password: String,
	#[serde(with = "const_hex")]
	pub key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub salt_hex: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct X25519Test {
	#[serde(with = "const_hex")]
	pub alice_private_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub alice_public_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub ephemeral_private_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub ephemeral_public_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub bob_private_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub bob_public_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub ephemeral_shared_secret_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub auth_shared_secret_hex: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ed25519Test {
	#[serde(with = "const_hex")]
	pub alice_private_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub alice_public_key_hex: Vec<u8>,
	#[serde(with = "const_hex")]
	pub message: Vec<u8>,
	#[serde(with = "const_hex")]
	pub signature: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "const_hex")]
	pub private_ecc_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub pub_ecc_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub private_kyber_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub pub_kyber_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub private_rsa_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub pub_rsa_key: Vec<u8>,
	pub key_pair_version: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KyberEncryptionTest {
	#[serde(with = "const_hex")]
	pub public_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub private_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "const_hex")]
	pub cipher_text: Vec<u8>,
	#[serde(with = "const_hex")]
	pub shared_secret: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RSAEncryptionTest {
	#[serde(with = "const_hex")]
	pub public_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub private_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub input: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "const_hex")]
	pub result: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PQCryptEncryptionTest {
	#[serde(with = "const_hex")]
	pub private_kyber_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub public_kyber_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub public_x25519_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub private_x25519_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub epheremal_public_x25519_key: Vec<u8>, // note: misspelling of "ephemeral"
	#[serde(with = "const_hex")]
	pub epheremal_private_x25519_key: Vec<u8>, // note: misspelling of "ephemeral"
	#[serde(with = "const_hex")]
	pub pq_message: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "const_hex")]
	pub bucket_key: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressionTestData {
	pub uncompressed_text: String,
	#[serde(with = "Base64")]
	pub compressed_base64_text_java: Vec<u8>,
	#[serde(with = "Base64")]
	pub compressed_base64_text_java_script: Vec<u8>,
	#[serde(with = "Base64")]
	pub compressed_base64_text_rust: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AeadTest {
	#[serde(with = "Base64")]
	pub plain_text_base64: Vec<u8>,
	#[serde(with = "const_hex")]
	pub seed: Vec<u8>,
	#[serde(with = "Base64")]
	pub cipher_text_base64: Vec<u8>,
	#[serde(with = "const_hex")]
	pub plaintext_key: Vec<u8>,
	#[serde(with = "const_hex")]
	pub encryption_key: Vec<u8>,
	#[serde(with = "Base64")]
	pub encrypted_key: Vec<u8>,
	#[serde(with = "Base64")]
	pub associated_data: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityTestData {
	pub aes128_tests: Vec<AesTest>,
	pub aes128_mac_tests: Vec<Aes128MacTest>,
	pub aes256_tests: Vec<AesTest>,
	pub hkdf_tests: Vec<HkdfTest>,
	pub hmac_sha256_tests: Vec<HmacTest>,
	pub argon2id_tests: Vec<Argon2Test>,
	pub x25519_tests: Vec<X25519Test>,
	pub ed25519_tests: Vec<Ed25519Test>,
	pub kyber_encryption_tests: Vec<KyberEncryptionTest>,
	pub rsa_encryption_tests: Vec<RSAEncryptionTest>,
	pub pqcrypt_encryption_tests: Vec<PQCryptEncryptionTest>,
	pub compression_tests: Vec<CompressionTestData>,
	pub aead_tests: Vec<AeadTest>,
}

struct Base64;

impl Base64 {
	#[allow(dead_code)]
	fn serialize<S: Serializer>(data: &[u8], serializer: S) -> Result<S::Ok, S::Error> {
		serializer.serialize_str(&BASE64.encode(data))
	}

	fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Vec<u8>, D::Error> {
		let base64_str = <&str>::deserialize(deserializer)?;
		BASE64.decode(base64_str).map_err(serde::de::Error::custom)
	}
}

pub fn get_compatibility_test_data() -> CompatibilityTestData {
	let data_json =
		include_str!("../../../../test/tests/api/worker/crypto/CompatibilityTestData.json");
	serde_json::from_str(data_json).unwrap()
}
