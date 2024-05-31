use serde::{Deserialize, Deserializer, Serializer};
use base64::engine::{Engine, general_purpose::STANDARD as BASE64};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AesTest {
    #[serde(with = "Base64")]
    pub plain_text_base64: Vec<u8>,
    #[serde(with = "Base64")]
    pub iv_base64: Vec<u8>,
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
    #[serde(with = "Base64")]
    pub iv_base64: Vec<u8>,
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
pub struct Argon2Test {
    pub password: String,
    #[serde(with = "const_hex")]
    pub key_hex: Vec<u8>,
    #[serde(with = "const_hex")]
    pub salt_hex: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityTestData {
    pub aes128_tests: Vec<AesTest>,
    pub aes128_mac_tests: Vec<Aes128MacTest>,
    pub aes256_tests: Vec<AesTest>,
    pub hkdf_tests: Vec<HkdfTest>,
    pub argon2id_tests: Vec<Argon2Test>,
}

struct Base64;

impl Base64 {
    fn serialize<S: Serializer>(data: &[u8], serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&BASE64.encode(data))
    }

    fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Vec<u8>, D::Error> {
        let base64_str = <&str>::deserialize(deserializer)?;
        BASE64.decode(base64_str).map_err(serde::de::Error::custom)
    }
}

pub fn get_test_data() -> CompatibilityTestData {
    let data_json = include_str!("../../test_data/CompatibilityTestData.json");
    serde_json::from_str(data_json).unwrap()
}
