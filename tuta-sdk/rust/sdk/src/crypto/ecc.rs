use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::util::{array_cast_slice, ArrayCastingError};
use std::ops::Deref;
use zeroize::*;

const ECC_KEY_SIZE: usize = 32;

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct EccPrivateKey([u8; ECC_KEY_SIZE]);

impl EccPrivateKey {
	/// Get a reference to the underlying bytes.
	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}

	/// Calculate the public key for this private key.
	pub fn derive_public_key(&self) -> EccPublicKey {
		use curve25519_dalek::montgomery::MontgomeryPoint;
		use curve25519_dalek::Scalar;

		// public key = private key * base point
		let public_key = Zeroizing::new(MontgomeryPoint::mul_base(
			Zeroizing::new(Scalar::from_bytes_mod_order(self.0)).deref(),
		));

		EccPublicKey(public_key.0)
	}

	/// Attempt to convert a slice of bytes into an ECC key.
	///
	/// Returns `Err` on failure.
	pub fn from_bytes(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
		Ok(Self(array_cast_slice(bytes, "EccPrivateKey")?))
	}

	fn from_bytes_clamped(bytes: [u8; 32]) -> Self {
		let clamped = curve25519_dalek::scalar::clamp_integer(bytes);
		Self(clamped)
	}
}

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct EccPublicKey([u8; ECC_KEY_SIZE]);

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct EccKeyPair {
	pub public_key: EccPublicKey,
	pub private_key: EccPrivateKey,
}

impl EccKeyPair {
	/// Generate a keypair with the given random number generator.
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		let seed: [u8; 32] = randomizer_facade.generate_random_array();

		let private_key = EccPrivateKey::from_bytes_clamped(seed);
		let public_key = private_key.derive_public_key();

		Self {
			public_key,
			private_key,
		}
	}
}

impl EccPublicKey {
	/// Get a reference to the underlying bytes.
	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}

	/// Attempt to convert a slice of bytes into an ECC key.
	///
	/// Returns `Err` on failure.
	pub fn from_bytes(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
		Ok(Self(array_cast_slice(bytes, "EccPublicKey")?))
	}
}

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct EccSharedSecret([u8; ECC_KEY_SIZE]);

impl EccSharedSecret {
	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}
}

/// Describes shared secrets for encrypting/decrypting a message and verifying authenticity.
pub struct EccSharedSecrets {
	pub ephemeral_shared_secret: EccSharedSecret,
	pub auth_shared_secret: EccSharedSecret,
}

/// Generate a shared secret using the sender's identity key, an ephemeral key, and the recipient's public key.
pub fn ecc_encapsulate(
	sender_key: &EccPrivateKey,
	ephemeral_key: &EccPrivateKey,
	recipient_key: &EccPublicKey,
) -> EccSharedSecrets {
	EccSharedSecrets {
		ephemeral_shared_secret: generate_shared_secret(ephemeral_key, recipient_key),
		auth_shared_secret: generate_shared_secret(sender_key, recipient_key),
	}
}

/// Generate a shared secret using the sender's identity key, an ephemeral key, and the recipient's private key.
pub fn ecc_decapsulate(
	sender_key: &EccPublicKey,
	ephemeral_key: &EccPublicKey,
	recipient_key: &EccPrivateKey,
) -> EccSharedSecrets {
	EccSharedSecrets {
		ephemeral_shared_secret: generate_shared_secret(recipient_key, ephemeral_key),
		auth_shared_secret: generate_shared_secret(recipient_key, sender_key),
	}
}

fn generate_shared_secret(local_key: &EccPrivateKey, remote_key: &EccPublicKey) -> EccSharedSecret {
	use curve25519_dalek::montgomery::MontgomeryPoint;
	use curve25519_dalek::Scalar;

	let point = Zeroizing::new(MontgomeryPoint(remote_key.0));
	let scalar = Zeroizing::new(Scalar::from_bytes_mod_order(local_key.0));
	let secret = (point.deref() * scalar.deref()).0;

	EccSharedSecret(secret)
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::get_test_data;

	#[test]
	fn test_x25519() {
		let data = get_test_data();
		for i in data.x25519_tests {
			let alice_private_key = EccPrivateKey(i.alice_private_key_hex.try_into().unwrap());
			let alice_public_key = EccPublicKey(i.alice_public_key_hex.try_into().unwrap());
			let ephemeral_private_key =
				EccPrivateKey(i.ephemeral_private_key_hex.try_into().unwrap());
			let ephemeral_public_key = EccPublicKey(i.ephemeral_public_key_hex.try_into().unwrap());
			let bob_private_key = EccPrivateKey(i.bob_private_key_hex.try_into().unwrap());
			let bob_public_key = EccPublicKey(i.bob_public_key_hex.try_into().unwrap());

			assert_eq!(alice_public_key.0, alice_private_key.derive_public_key().0);
			assert_eq!(
				ephemeral_public_key.0,
				ephemeral_private_key.derive_public_key().0
			);
			assert_eq!(bob_public_key.0, bob_private_key.derive_public_key().0);

			let ephemeral_secret =
				EccSharedSecret(i.ephemeral_shared_secret_hex.try_into().unwrap());
			let auth_secret = EccSharedSecret(i.auth_shared_secret_hex.try_into().unwrap());

			let encapsulation =
				ecc_encapsulate(&alice_private_key, &ephemeral_private_key, &bob_public_key);
			assert_eq!(
				ephemeral_secret.0, encapsulation.ephemeral_shared_secret.0,
				"encaps: ephemeral shared secret mismatch"
			);
			assert_eq!(
				auth_secret.0, encapsulation.auth_shared_secret.0,
				"encaps: auth shared secret mismatch"
			);

			let decapsulation =
				ecc_decapsulate(&alice_public_key, &ephemeral_public_key, &bob_private_key);
			assert_eq!(
				ephemeral_secret.0, decapsulation.ephemeral_shared_secret.0,
				"decaps: ephemeral shared secret mismatch"
			);
			assert_eq!(
				auth_secret.0, decapsulation.auth_shared_secret.0,
				"decaps: auth shared secret mismatch"
			);
		}
	}
}
