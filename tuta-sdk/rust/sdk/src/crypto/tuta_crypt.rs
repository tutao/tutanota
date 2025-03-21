use crate::crypto::aes::{
	aes_256_decrypt, aes_256_encrypt, Aes256Key, AesDecryptError, AesEncryptError, Iv, PaddingMode,
};
use crate::crypto::hkdf::hkdf;
use crate::crypto::kyber::{
	KyberCiphertext, KyberDecapsulationError, KyberKeyPair, KyberPublicKey, KyberSharedSecret,
};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::x25519::{
	x25519_decapsulate, x25519_encapsulate, X25519KeyPair, X25519PublicKey, X25519SharedSecrets,
};
use crate::join_slices;
use crate::util::{decode_byte_arrays, encode_byte_arrays, ArrayCastingError};
use zeroize::{ZeroizeOnDrop, Zeroizing};

#[cfg_attr(test, derive(Debug))]
pub struct DecapsulatedSymKey {
	pub sender_identity_pub_key: X25519PublicKey,
	pub decrypted_sym_key_bytes: Aes256Key,
}

#[cfg_attr(test, derive(Debug))]
pub struct TutaCryptPublicKeys {
	pub x25519_public_key: X25519PublicKey,
	pub kyber_public_key: KyberPublicKey,
}

/// An encapsulated post quantum message using the Tuta Crypt protocol.
#[derive(ZeroizeOnDrop)]
pub struct TutaCryptMessage {
	sender_identity_public_key: X25519PublicKey,
	ephemeral_public_key: X25519PublicKey,
	encapsulation: TutaCryptBucketKeyEncapsulation,
}

impl TutaCryptMessage {
	/// Deserialized from encoded form.
	///
	/// Returns `Err` if invalid.
	pub fn deserialize(data: &[u8]) -> Result<TutaCryptMessage, TutaCryptError> {
		let [sender_identity_pub_key_bytes, ephemeral_pub_key_bytes, kyber_cipher_text_bytes, kek_enc_bucket_key_bytes] =
			decode_byte_arrays(data).map_err(|reason| TutaCryptError {
				reason: format!("Can't deserialize TutaCryptBucketKey: {reason}"),
			})?;

		let sender_identity_public_key =
			X25519PublicKey::from_bytes(sender_identity_pub_key_bytes)?;
		let ephemeral_public_key = X25519PublicKey::from_bytes(ephemeral_pub_key_bytes)?;
		let kyber_ciphertext = kyber_cipher_text_bytes.try_into()?;
		let kek_enc_bucket_key = kek_enc_bucket_key_bytes.to_owned();

		Ok(Self {
			sender_identity_public_key,
			ephemeral_public_key,
			encapsulation: TutaCryptBucketKeyEncapsulation {
				kyber_ciphertext,
				kek_enc_bucket_key,
			},
		})
	}

	/// Serialize into encoded form.
	pub fn serialize(&self) -> Vec<u8> {
		encode_byte_arrays(&[
			self.sender_identity_public_key.as_bytes(),
			self.ephemeral_public_key.as_bytes(),
			self.encapsulation.kyber_ciphertext.as_bytes(),
			self.encapsulation.kek_enc_bucket_key.as_slice(),
		])
		.unwrap()
	}

	/// Decapsulate the TutaCrypt message with the given keys.
	pub fn decapsulate(
		&self,
		recipient_keys: &TutaCryptKeyPairs,
	) -> Result<DecapsulatedSymKey, TutaCryptError> {
		let TutaCryptKeyPairs {
			x25519_keys,
			kyber_keys,
		} = recipient_keys;

		let x25519_shared_secret = x25519_decapsulate(
			&self.sender_identity_public_key,
			&self.ephemeral_public_key,
			&x25519_keys.private_key,
		);
		let kyber_shared_secret = kyber_keys
			.private_key
			.decapsulate(&self.encapsulation.kyber_ciphertext)?;

		let kek = derive_tuta_crypt_kek(
			&self.sender_identity_public_key,
			&self.ephemeral_public_key,
			&x25519_keys.public_key,
			&kyber_keys.public_key,
			&self.encapsulation.kyber_ciphertext,
			&kyber_shared_secret,
			&x25519_shared_secret,
			CryptoProtocolVersion::TutaCrypt,
		);

		let bucket_key = aes_256_decrypt(&kek, &self.encapsulation.kek_enc_bucket_key)?.data;
		Ok(DecapsulatedSymKey {
			decrypted_sym_key_bytes: Aes256Key::try_from(bucket_key)?,
			sender_identity_pub_key: self.sender_identity_public_key.clone(),
		})
	}

	/// Construct a `TutaCryptMessage` containing an AES key from the given keys.
	pub fn encapsulate(
		sender_x25519_keypair: &X25519KeyPair,
		ephemeral_x25519_keypair: &X25519KeyPair, //TODO this is error prone and dangerous, we should generate the key pair inside
		recipient_x25519_key: &X25519PublicKey,
		recipient_kyber_key: &KyberPublicKey,
		bucket_key: &Aes256Key,
		iv: Iv, //TODO this is error prone and dangerous, we should generate the iv inside the aes implementation
	) -> Result<Self, TutaCryptError> {
		let x25519_shared_secret = x25519_encapsulate(
			&sender_x25519_keypair.private_key,
			&ephemeral_x25519_keypair.private_key,
			recipient_x25519_key,
		);
		let encapsulation = recipient_kyber_key.encapsulate();

		let kek = derive_tuta_crypt_kek(
			&sender_x25519_keypair.public_key,
			&ephemeral_x25519_keypair.public_key,
			recipient_x25519_key,
			recipient_kyber_key,
			&encapsulation.ciphertext,
			&encapsulation.shared_secret,
			&x25519_shared_secret,
			CryptoProtocolVersion::TutaCrypt,
		);

		let kek_enc_bucket_key =
			aes_256_encrypt(&kek, bucket_key.as_bytes(), &iv, PaddingMode::WithPadding)?;

		Ok(Self {
			sender_identity_public_key: sender_x25519_keypair.public_key.clone(),
			ephemeral_public_key: ephemeral_x25519_keypair.public_key.clone(),
			encapsulation: TutaCryptBucketKeyEncapsulation {
				kyber_ciphertext: encapsulation.ciphertext,
				kek_enc_bucket_key,
			},
		})
	}
}

#[derive(Copy, Clone)]
#[repr(u8)]
enum CryptoProtocolVersion {
	Rsa = 0,
	SymmetricEncryption = 1,
	TutaCrypt = 2,
}

fn derive_tuta_crypt_kek(
	sender_identity_public_key: &X25519PublicKey,
	ephemeral_public_key: &X25519PublicKey,
	recipient_x25519_public_key: &X25519PublicKey,
	recipient_kyber_public_key: &KyberPublicKey,
	kyber_ciphertext: &KyberCiphertext,
	kyber_shared_secret: &KyberSharedSecret,
	x25519_shared_secrets: &X25519SharedSecrets,
	crypto_protocol_version: CryptoProtocolVersion,
) -> Aes256Key {
	let context = Zeroizing::new(join_slices!(
		sender_identity_public_key.as_bytes(),
		ephemeral_public_key.as_bytes(),
		recipient_x25519_public_key.as_bytes(),
		Zeroizing::new(recipient_kyber_public_key.serialize()).as_slice(),
		kyber_ciphertext.as_bytes(),
		&[crypto_protocol_version as u8]
	));

	let input_key_material = Zeroizing::new(join_slices!(
		x25519_shared_secrets.ephemeral_shared_secret.as_bytes(),
		x25519_shared_secrets.auth_shared_secret.as_bytes(),
		kyber_shared_secret.as_bytes()
	));

	let kek_bytes = hkdf(&context, input_key_material.as_slice(), b"kek", 32);
	Aes256Key::try_from(kek_bytes).unwrap()
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct TutaCryptKeyPairs {
	pub x25519_keys: X25519KeyPair,
	pub kyber_keys: KyberKeyPair,
}

impl TutaCryptKeyPairs {
	/// Generate a keypair with the given random number generator.
	#[must_use]
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		let x25519_keys = X25519KeyPair::generate(randomizer_facade);
		let kyber_keys = KyberKeyPair::generate();
		Self {
			x25519_keys,
			kyber_keys,
		}
	}
}

#[derive(ZeroizeOnDrop)]
pub struct TutaCryptBucketKeyEncapsulation {
	kyber_ciphertext: KyberCiphertext,
	kek_enc_bucket_key: Vec<u8>,
}

/// Error that occurs when parsing RSA keys.
#[derive(thiserror::Error, Debug)]
#[error("TutaCrypt error: {reason}")]
pub struct TutaCryptError {
	reason: String,
}

trait TutaCryptErrorType: ToString {}

impl<T: TutaCryptErrorType> From<T> for TutaCryptError {
	fn from(reason: T) -> Self {
		Self {
			reason: reason.to_string(),
		}
	}
}

impl TutaCryptErrorType for ArrayCastingError {}

impl TutaCryptErrorType for KyberDecapsulationError {}

impl TutaCryptErrorType for AesDecryptError {}

impl TutaCryptErrorType for AesEncryptError {}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::{
		get_compatibility_test_data, PQCryptEncryptionTest,
	};
	use crate::crypto::kyber::KyberPrivateKey;
	use crate::crypto::x25519::X25519PrivateKey;

	#[test]
	fn test_bucket_key_serialize_roundtrip() {
		let tests = get_compatibility_test_data();
		for i in tests.pqcrypt_encryption_tests {
			let tuta_crypt_message = TutaCryptMessage::deserialize(&i.pq_message).unwrap();
			let serialized = tuta_crypt_message.serialize();
			assert_eq!(i.pq_message, serialized);
		}
	}

	#[test]
	fn test_bucket_key_serialize_decapsulate() {
		let tests = get_compatibility_test_data();
		for i in tests.pqcrypt_encryption_tests {
			let tuta_crypt_message = TutaCryptMessage::deserialize(&i.pq_message).unwrap();
			let recipient_keys = get_recipient_keys(&i);
			let decapsulated_sym_key = tuta_crypt_message.decapsulate(&recipient_keys).unwrap();
			assert_eq!(
				i.bucket_key,
				decapsulated_sym_key.decrypted_sym_key_bytes.as_bytes()
			);
			assert_eq!(
				i.public_x25519_key,
				decapsulated_sym_key.sender_identity_pub_key.as_bytes()
			);
		}
	}

	#[test]
	fn test_bucket_key_serialize_encapsulate_roundtrip() {
		let tests = get_compatibility_test_data();
		for i in tests.pqcrypt_encryption_tests {
			let recipient_keys = get_recipient_keys(&i);
			let TutaCryptKeyPairs {
				x25519_keys,
				kyber_keys,
			} = &recipient_keys;

			// Note that the test data uses sender keys as recipient keys, so we are basically just simulating sending mail to ourselves.
			let sender_x25519_keypair = x25519_keys;
			let ephemeral_x25519_keypair = X25519KeyPair {
				private_key: X25519PrivateKey::from_bytes(&i.epheremal_private_x25519_key).unwrap(),
				public_key: X25519PublicKey::from_bytes(&i.epheremal_public_x25519_key).unwrap(),
			};

			let bucket_key = Aes256Key::try_from(i.bucket_key).unwrap();
			let iv = Iv::from_bytes(&i.seed[i.seed.len() - 16..]).unwrap();

			let encapsulation = TutaCryptMessage::encapsulate(
				sender_x25519_keypair,
				&ephemeral_x25519_keypair,
				&x25519_keys.public_key,
				&kyber_keys.public_key,
				&bucket_key,
				iv,
			)
			.unwrap();

			// NOTE: This will generally not match the test data, because we cannot inject randomness into Kyber.
			//
			// However, since we can test decapsulation separately, we can prove that encapsulation is accurate if we can decapsulate it as well.
			//
			// assert_eq!(i.tuta_crypt_message, encapsulation.serialize());

			let decapsulation = encapsulation.decapsulate(&recipient_keys).unwrap();
			assert_eq!(
				bucket_key.as_bytes(),
				decapsulation.decrypted_sym_key_bytes.as_bytes()
			);
			assert_eq!(
				sender_x25519_keypair.public_key,
				decapsulation.sender_identity_pub_key
			);

			// Should be able to serialize/deserialize and still decapsulate it.
			let reloaded = TutaCryptMessage::deserialize(&encapsulation.serialize()).unwrap();
			let decapsulated_sym_key = reloaded.decapsulate(&recipient_keys).unwrap();
			assert_eq!(
				bucket_key.as_bytes(),
				decapsulated_sym_key.decrypted_sym_key_bytes.as_bytes()
			);
			assert_eq!(
				sender_x25519_keypair.public_key,
				decapsulated_sym_key.sender_identity_pub_key
			);
		}
	}

	fn get_recipient_keys(test: &PQCryptEncryptionTest) -> TutaCryptKeyPairs {
		let x25519_private =
			X25519PrivateKey::from_bytes(test.private_x25519_key.as_slice()).unwrap();
		let x25519_public = X25519PublicKey::from_bytes(test.public_x25519_key.as_slice()).unwrap();
		let kyber_private =
			KyberPrivateKey::deserialize(test.private_kyber_key.as_slice()).unwrap();
		let kyber_public = KyberPublicKey::deserialize(test.public_kyber_key.as_slice()).unwrap();

		TutaCryptKeyPairs {
			x25519_keys: X25519KeyPair {
				public_key: x25519_public,
				private_key: x25519_private,
			},
			kyber_keys: KyberKeyPair {
				public_key: kyber_public,
				private_key: kyber_private,
			},
		}
	}
}
