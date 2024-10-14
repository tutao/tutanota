use crate::crypto::aes::{
	aes_256_decrypt, aes_256_encrypt, Aes256Key, AesDecryptError, AesEncryptError, Iv, PaddingMode,
};
use crate::crypto::ecc::{
	ecc_decapsulate, ecc_encapsulate, EccKeyPair, EccPublicKey, EccSharedSecrets,
};
use crate::crypto::hkdf::hkdf;
use crate::crypto::kyber::{
	KyberCiphertext, KyberDecapsulationError, KyberKeyPair, KyberPublicKey, KyberSharedSecret,
};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::join_slices;
use crate::util::{decode_byte_arrays, encode_byte_arrays, ArrayCastingError};
use zeroize::{ZeroizeOnDrop, Zeroizing};

/// An encapsulated post quantum message using the Tuta Crypt protocol.
#[derive(ZeroizeOnDrop)]
pub struct PQMessage {
	sender_identity_public_key: EccPublicKey,
	ephemeral_public_key: EccPublicKey,
	encapsulation: PQBucketKeyEncapsulation,
}

impl PQMessage {
	/// Deserialized from encoded form.
	///
	/// Returns `Err` if invalid.
	pub fn deserialize(data: &[u8]) -> Result<PQMessage, PQError> {
		let [sender_identity_pub_key_bytes, ephemeral_pub_key_bytes, kyber_cipher_text_bytes, kek_enc_bucket_key_bytes] =
			decode_byte_arrays(data).map_err(|reason| PQError {
				reason: format!("Can't deserialize PQBucketKey: {reason}"),
			})?;

		let sender_identity_public_key = EccPublicKey::from_bytes(sender_identity_pub_key_bytes)?;
		let ephemeral_public_key = EccPublicKey::from_bytes(ephemeral_pub_key_bytes)?;
		let kyber_ciphertext = kyber_cipher_text_bytes.try_into()?;
		let kek_enc_bucket_key = kek_enc_bucket_key_bytes.to_owned();

		Ok(Self {
			sender_identity_public_key,
			ephemeral_public_key,
			encapsulation: PQBucketKeyEncapsulation {
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

	/// Decapsulate the PQ message with the given keys.
	pub fn decapsulate(&self, recipient_keys: &PQKeyPairs) -> Result<Aes256Key, PQError> {
		let PQKeyPairs {
			ecc_keys,
			kyber_keys,
		} = recipient_keys;

		let ecc_shared_secret = ecc_decapsulate(
			&self.sender_identity_public_key,
			&self.ephemeral_public_key,
			&ecc_keys.private_key,
		);
		let kyber_shared_secret = kyber_keys
			.private_key
			.decapsulate(&self.encapsulation.kyber_ciphertext)?;

		let kek = derive_pq_kek(
			&self.sender_identity_public_key,
			&self.ephemeral_public_key,
			&ecc_keys.public_key,
			&kyber_keys.public_key,
			&self.encapsulation.kyber_ciphertext,
			&kyber_shared_secret,
			&ecc_shared_secret,
			CryptoProtocolVersion::TutaCrypt,
		);

		let bucket_key = aes_256_decrypt(&kek, &self.encapsulation.kek_enc_bucket_key)?.data;
		Ok(Aes256Key::try_from(bucket_key)?)
	}

	/// Construct a `PQMessage` containing an AES key from the given keys.
	pub fn encapsulate(
		sender_ecc_keypair: &EccKeyPair,
		ephemeral_ecc_keypair: &EccKeyPair,
		recipient_ecc_key: &EccPublicKey,
		recipient_kyber_key: &KyberPublicKey,
		bucket_key: &Aes256Key,
		iv: Iv,
	) -> Result<Self, PQError> {
		let ecc_shared_secret = ecc_encapsulate(
			&sender_ecc_keypair.private_key,
			&ephemeral_ecc_keypair.private_key,
			recipient_ecc_key,
		);
		let encapsulation = recipient_kyber_key.encapsulate();

		let kek = derive_pq_kek(
			&sender_ecc_keypair.public_key,
			&ephemeral_ecc_keypair.public_key,
			recipient_ecc_key,
			recipient_kyber_key,
			&encapsulation.ciphertext,
			&encapsulation.shared_secret,
			&ecc_shared_secret,
			CryptoProtocolVersion::TutaCrypt,
		);

		let kek_enc_bucket_key =
			aes_256_encrypt(&kek, bucket_key.as_bytes(), &iv, PaddingMode::WithPadding)?;

		Ok(Self {
			sender_identity_public_key: sender_ecc_keypair.public_key.clone(),
			ephemeral_public_key: ephemeral_ecc_keypair.public_key.clone(),
			encapsulation: PQBucketKeyEncapsulation {
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

fn derive_pq_kek(
	sender_identity_public_key: &EccPublicKey,
	ephemeral_public_key: &EccPublicKey,
	recipient_ecc_public_key: &EccPublicKey,
	recipient_kyber_public_key: &KyberPublicKey,
	kyber_ciphertext: &KyberCiphertext,
	kyber_shared_secret: &KyberSharedSecret,
	ecc_shared_secrets: &EccSharedSecrets,
	crypto_protocol_version: CryptoProtocolVersion,
) -> Aes256Key {
	let context = Zeroizing::new(join_slices!(
		sender_identity_public_key.as_bytes(),
		ephemeral_public_key.as_bytes(),
		recipient_ecc_public_key.as_bytes(),
		Zeroizing::new(recipient_kyber_public_key.serialize()).as_slice(),
		kyber_ciphertext.as_bytes(),
		&[crypto_protocol_version as u8]
	));

	let input_key_material = Zeroizing::new(join_slices!(
		ecc_shared_secrets.ephemeral_shared_secret.as_bytes(),
		ecc_shared_secrets.auth_shared_secret.as_bytes(),
		kyber_shared_secret.as_bytes()
	));

	let kek_bytes = hkdf(&context, input_key_material.as_slice(), b"kek", 32);
	Aes256Key::try_from(kek_bytes).unwrap()
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct PQKeyPairs {
	pub ecc_keys: EccKeyPair,
	pub kyber_keys: KyberKeyPair,
}

impl PQKeyPairs {
	/// Generate a keypair with the given random number generator.
	#[must_use]
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		let ecc_keys = EccKeyPair::generate(randomizer_facade);
		let kyber_keys = KyberKeyPair::generate();
		Self {
			ecc_keys,
			kyber_keys,
		}
	}
}

#[derive(ZeroizeOnDrop)]
pub struct PQBucketKeyEncapsulation {
	kyber_ciphertext: KyberCiphertext,
	kek_enc_bucket_key: Vec<u8>,
}

/// Error that occurs when parsing RSA keys.
#[derive(thiserror::Error, Debug)]
#[error("PQ error: {reason}")]
pub struct PQError {
	reason: String,
}

trait PQErrorType: ToString {}

impl<T: PQErrorType> From<T> for PQError {
	fn from(reason: T) -> Self {
		Self {
			reason: reason.to_string(),
		}
	}
}

impl PQErrorType for ArrayCastingError {}

impl PQErrorType for KyberDecapsulationError {}

impl PQErrorType for AesDecryptError {}

impl PQErrorType for AesEncryptError {}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::{get_test_data, PQCryptEncryptionTest};
	use crate::crypto::ecc::EccPrivateKey;
	use crate::crypto::kyber::KyberPrivateKey;

	#[test]
	fn test_bucket_key_serialize_roundtrip() {
		let tests = get_test_data();
		for i in tests.pqcrypt_encryption_tests {
			let pq_message = PQMessage::deserialize(&i.pq_message).unwrap();
			let serialized = pq_message.serialize();
			assert_eq!(i.pq_message, serialized);
		}
	}

	#[test]
	fn test_bucket_key_serialize_decapsulate() {
		let tests = get_test_data();
		for i in tests.pqcrypt_encryption_tests {
			let pq_message = PQMessage::deserialize(&i.pq_message).unwrap();
			let recipient_keys = get_recipient_keys(&i);
			let key = pq_message.decapsulate(&recipient_keys).unwrap();
			assert_eq!(i.bucket_key, key.as_bytes());
		}
	}

	#[test]
	fn test_bucket_key_serialize_encapsulate_roundtrip() {
		let tests = get_test_data();
		for i in tests.pqcrypt_encryption_tests {
			let recipient_keys = get_recipient_keys(&i);
			let PQKeyPairs {
				ecc_keys,
				kyber_keys,
			} = &recipient_keys;

			// Note that the test data uses sender keys as recipient keys, so we are basically just simulating sending mail to ourselves.
			let sender_ecc_keypair = ecc_keys;
			let ephemeral_ecc_keypair = EccKeyPair {
				private_key: EccPrivateKey::from_bytes(&i.epheremal_private_x25519_key).unwrap(),
				public_key: EccPublicKey::from_bytes(&i.epheremal_public_x25519_key).unwrap(),
			};

			let bucket_key = Aes256Key::try_from(i.bucket_key).unwrap();
			let iv = Iv::from_bytes(&i.seed[i.seed.len() - 16..]).unwrap();

			let encapsulation = PQMessage::encapsulate(
				sender_ecc_keypair,
				&ephemeral_ecc_keypair,
				&ecc_keys.public_key,
				&kyber_keys.public_key,
				&bucket_key,
				iv,
			)
			.unwrap();

			// NOTE: This will generally not match the test data, because we cannot inject randomness into Kyber.
			//
			// However, since we can test decapsulation separately, we can prove that encapsulation is accurate if we can decapsulate it as well.
			//
			// assert_eq!(i.pq_message, encapsulation.serialize());

			let decapsulation = encapsulation.decapsulate(&recipient_keys).unwrap();
			assert_eq!(bucket_key.as_bytes(), decapsulation.as_bytes());

			// Should be able to serialize/deserialize and still decapsulate it.
			let reloaded = PQMessage::deserialize(&encapsulation.serialize()).unwrap();
			assert_eq!(
				bucket_key.as_bytes(),
				reloaded.decapsulate(&recipient_keys).unwrap().as_bytes()
			);
		}
	}

	fn get_recipient_keys(test: &PQCryptEncryptionTest) -> PQKeyPairs {
		let ecc_private = EccPrivateKey::from_bytes(test.private_x25519_key.as_slice()).unwrap();
		let ecc_public = EccPublicKey::from_bytes(test.public_x25519_key.as_slice()).unwrap();
		let kyber_private =
			KyberPrivateKey::deserialize(test.private_kyber_key.as_slice()).unwrap();
		let kyber_public = KyberPublicKey::deserialize(test.public_kyber_key.as_slice()).unwrap();

		PQKeyPairs {
			ecc_keys: EccKeyPair {
				public_key: ecc_public,
				private_key: ecc_private,
			},
			kyber_keys: KyberKeyPair {
				public_key: kyber_public,
				private_key: kyber_private,
			},
		}
	}
}
