use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::crypto::kyber::{KyberKeyPair, KyberPrivateKey, KyberPublicKey};
use crate::crypto::rsa::{RSAKeyPair, RSAPrivateKey, RSAPublicKey, RSAX25519KeyPair};
use crate::crypto::tuta_crypt::TutaCryptKeyPairs;
use crate::crypto::x25519::{X25519KeyPair, X25519PrivateKey, X25519PublicKey};
use crate::entities::generated::sys::KeyPair;
use crate::ApiCallError;
use zeroize::Zeroizing;

pub fn decrypt_key_pair(
	encryption_key: &GenericAesKey,
	key_pair: &KeyPair,
) -> Result<AsymmetricKeyPair, KeyLoadError> {
	match key_pair.symEncPrivRsaKey {
		Some(_) => decrypt_rsa_or_rsa_x25519_key_pair(encryption_key, key_pair),
		None => decrypt_tuta_crypt_key_pair(encryption_key, key_pair),
	}
}

fn mapped_error<E: std::error::Error>(e: E) -> ApiCallError {
	ApiCallError::InternalSdkError {
		error_message: e.to_string(),
	}
}

fn require_field<'a>(field: &'a Option<Vec<u8>>, name: &str) -> Result<&'a [u8], KeyLoadError> {
	field
		.as_ref()
		.ok_or_else(|| KeyLoadError {
			reason: format!("Missing field `{name}`"),
		})
		.map(|k| k.as_slice())
}

macro_rules! require_field {
	($object:expr) => {
		$object
			.as_ref()
			.ok_or_else(|| KeyLoadError {
				reason: format!("Missing field `{}`", stringify!($object)),
			})
			.map(|k| k.as_slice())
	};
}

fn decrypt_tuta_crypt_key_pair(
	encryption_key: &GenericAesKey,
	key_pair: &KeyPair,
) -> Result<AsymmetricKeyPair, KeyLoadError> {
	if !matches!(encryption_key, GenericAesKey::Aes256(_)) {
		return Err(KeyLoadError {
			reason: "Invalid AES key length for TutaCrypt key pair".to_owned(),
		});
	}

	let x25519_public_key = require_field!(key_pair.pubEccKey)?;
	let x25519_private_key_enc = require_field!(key_pair.symEncPrivEccKey)?;
	let x25519_private_key = Zeroizing::new(encryption_key.decrypt_data(x25519_private_key_enc)?);

	let kyber_public_key =
		KyberPublicKey::deserialize(require_field!(key_pair.pubKyberKey)?).map_err(mapped_error)?;
	let kyber_private_key_enc = require_field!(key_pair.symEncPrivKyberKey)?;
	let kyber_private_key_raw = Zeroizing::new(encryption_key.decrypt_data(kyber_private_key_enc)?);
	let kyber_private_key =
		KyberPrivateKey::deserialize(kyber_private_key_raw.as_slice()).map_err(mapped_error)?;

	Ok(AsymmetricKeyPair::TutaCryptKeyPairs(TutaCryptKeyPairs {
		x25519_keys: X25519KeyPair {
			public_key: X25519PublicKey::from_bytes(x25519_public_key).map_err(mapped_error)?,
			private_key: X25519PrivateKey::from_bytes(x25519_private_key.as_slice())
				.map_err(mapped_error)?,
		},
		kyber_keys: KyberKeyPair {
			public_key: kyber_public_key,
			private_key: kyber_private_key,
		},
	}))
}

fn decrypt_rsa_or_rsa_x25519_key_pair(
	encryption_key: &GenericAesKey,
	key_pair: &KeyPair,
) -> Result<AsymmetricKeyPair, KeyLoadError> {
	let public_key = RSAPublicKey::deserialize(require_field!(key_pair.pubRsaKey)?)?;
	let sym_enc_priv_rsa_key = require_field!(key_pair.symEncPrivRsaKey)?;
	let private_key = RSAPrivateKey::deserialize(
		encryption_key
			.decrypt_data(sym_enc_priv_rsa_key)?
			.as_slice(),
	)?;

	let rsa_key_pair = RSAKeyPair {
		public_key,
		private_key,
	};

	if let Some(encrypted_x25519_private_key) = key_pair.symEncPrivEccKey.as_ref() {
		let public_x25519_key = require_field!(key_pair.pubEccKey)?;
		let private_x25519_key =
			Zeroizing::new(encryption_key.decrypt_data(encrypted_x25519_private_key)?);
		Ok(AsymmetricKeyPair::RSAX25519KeyPair(RSAX25519KeyPair {
			rsa_key_pair,
			x25519_key_pair: X25519KeyPair {
				public_key: X25519PublicKey::from_bytes(public_x25519_key)?,
				private_key: X25519PrivateKey::from_bytes(private_x25519_key.as_slice())?,
			},
		}))
	} else {
		Ok(AsymmetricKeyPair::RSAKeyPair(rsa_key_pair))
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
	use crate::crypto::x25519::X25519KeyPair;
	use crate::crypto::{aes::Iv, Aes256Key, TutaCryptKeyPairs};
	use crate::entities::generated::sys::KeyPair;
	use crate::util::test_utils::generate_random_string;

	#[test]
	fn tuta_crypt_roundtrip() {
		let randomizer = make_thread_rng_facade();
		let tuta_crypt_key_pair = TutaCryptKeyPairs::generate(&randomizer);
		let parent_key: GenericAesKey = Aes256Key::generate(&randomizer).into();

		let junk_x25519_pair = X25519KeyPair::generate(&randomizer);
		let encrypted_key_pair = KeyPair {
			_id: Default::default(),
			pubEccKey: Some(
				tuta_crypt_key_pair
					.x25519_keys
					.public_key
					.as_bytes()
					.to_vec(),
			),
			pubKyberKey: Some(tuta_crypt_key_pair.kyber_keys.public_key.serialize()),
			pubRsaKey: Some(generate_random_string::<17>().as_bytes().to_vec()),
			symEncPrivEccKey: Some(
				parent_key
					.encrypt_data(
						junk_x25519_pair.private_key.as_bytes(),
						Iv::generate(&randomizer),
					)
					.unwrap(),
			),
			symEncPrivKyberKey: Some(
				parent_key
					.encrypt_data(
						&tuta_crypt_key_pair.kyber_keys.private_key.serialize(),
						Iv::generate(&randomizer),
					)
					.unwrap(),
			),
			symEncPrivRsaKey: Some(generate_random_string::<17>().as_bytes().to_vec()),
		};

		let decrypted_key_pair =
			decrypt_tuta_crypt_key_pair(&parent_key, &encrypted_key_pair).unwrap();

		match decrypted_key_pair {
			AsymmetricKeyPair::TutaCryptKeyPairs(decrypted_key_pair) => {
				assert_eq!(
					tuta_crypt_key_pair.kyber_keys.public_key,
					decrypted_key_pair.kyber_keys.public_key
				);
				assert_eq!(
					tuta_crypt_key_pair.kyber_keys.private_key,
					decrypted_key_pair.kyber_keys.private_key
				);
			},
			_ => panic!(),
		}
	}

	#[test]
	fn rsa_roundtrip() {
		let randomizer = make_thread_rng_facade();
		let rsa_key_pair = RSAKeyPair::generate(&randomizer);
		let parent_key: GenericAesKey = Aes256Key::generate(&randomizer).into();

		let encrypted_key_pair = KeyPair {
			_id: Default::default(),
			pubEccKey: None,
			pubKyberKey: None,
			pubRsaKey: Some(rsa_key_pair.public_key.serialize()),
			symEncPrivEccKey: None,
			symEncPrivKyberKey: None,
			symEncPrivRsaKey: Some(
				parent_key
					.encrypt_data(
						rsa_key_pair.private_key.serialize().as_slice(),
						Iv::generate(&randomizer),
					)
					.unwrap(),
			),
		};

		let decrypted_key_pair =
			decrypt_rsa_or_rsa_x25519_key_pair(&parent_key, &encrypted_key_pair).unwrap();

		match decrypted_key_pair {
			AsymmetricKeyPair::RSAKeyPair(decrypted_key_pair) => {
				assert_eq!(rsa_key_pair.public_key, decrypted_key_pair.public_key);
				assert_eq!(rsa_key_pair.private_key, decrypted_key_pair.private_key);
			},
			_ => panic!(),
		}
	}

	#[test]
	fn rsa_x25519_roundtrip() {
		let randomizer = make_thread_rng_facade();
		let rsa_x25519_key_pair = RSAX25519KeyPair::generate(&randomizer);
		let parent_key: GenericAesKey = Aes256Key::generate(&randomizer).into();

		let encrypted_key_pair = KeyPair {
			_id: Default::default(),
			pubEccKey: Some(
				rsa_x25519_key_pair
					.x25519_key_pair
					.public_key
					.as_bytes()
					.to_vec(),
			),
			pubKyberKey: None,
			pubRsaKey: Some(rsa_x25519_key_pair.rsa_key_pair.public_key.serialize()),
			symEncPrivEccKey: Some(
				parent_key
					.encrypt_data(
						rsa_x25519_key_pair.x25519_key_pair.private_key.as_bytes(),
						Iv::generate(&randomizer),
					)
					.unwrap(),
			),
			symEncPrivKyberKey: None,
			symEncPrivRsaKey: Some(
				parent_key
					.encrypt_data(
						rsa_x25519_key_pair
							.rsa_key_pair
							.private_key
							.serialize()
							.as_slice(),
						Iv::generate(&randomizer),
					)
					.unwrap(),
			),
		};

		let decrypted_key_pair =
			decrypt_rsa_or_rsa_x25519_key_pair(&parent_key, &encrypted_key_pair).unwrap();

		match decrypted_key_pair {
			AsymmetricKeyPair::RSAX25519KeyPair(decrypted_key_pair) => {
				assert_eq!(
					rsa_x25519_key_pair.rsa_key_pair.public_key,
					decrypted_key_pair.rsa_key_pair.public_key
				);
				assert_eq!(
					rsa_x25519_key_pair.rsa_key_pair.private_key,
					decrypted_key_pair.rsa_key_pair.private_key
				);
				assert_eq!(
					rsa_x25519_key_pair.x25519_key_pair.public_key,
					decrypted_key_pair.x25519_key_pair.public_key
				);
				assert_eq!(
					rsa_x25519_key_pair.x25519_key_pair.private_key,
					decrypted_key_pair.x25519_key_pair.private_key
				);
			},
			_ => panic!(),
		}
	}
}
