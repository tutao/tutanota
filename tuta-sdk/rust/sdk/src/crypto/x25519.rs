use crypto_primitives::randomizer_facade::RandomizerFacade;
use util::array::{array_cast_slice, ArrayCastingError};
use x25519_dalek::{PublicKey, SharedSecret, StaticSecret};
use zeroize::*;

const X25519_KEY_SIZE: usize = 32;

/// Error occurred when computing DH with x25519. Got identity element.
#[derive(thiserror::Error, Debug)]
#[error("Shared Secret is identity element")]
pub struct X25519Error {}

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct X25519PrivateKey([u8; X25519_KEY_SIZE]);

impl X25519PrivateKey {
	/// Get a reference to the underlying bytes.
	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}
	pub fn as_static_secret(&self) -> StaticSecret {
		StaticSecret::from(self.0)
	}

	/// Calculate the public key for this private key.
	pub fn derive_public_key(&self) -> X25519PublicKey {
		PublicKey::from(&self.as_static_secret()).into()
	}

	pub fn diffie_hellman(
		&self,
		remote_public_key: &X25519PublicKey,
	) -> Result<SharedSecret, X25519Error> {
		let shared_secret = self
			.as_static_secret()
			.diffie_hellman(&remote_public_key.as_public_key());
		if shared_secret.was_contributory() {
			Ok(shared_secret)
		} else {
			// this should never happen. only in case of attacks
			Err(X25519Error {})
		}
	}

	/// Attempt to convert a slice of bytes into an X25519 key.
	///
	/// Returns `Err` on failure.
	pub fn from_slice(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
		use curve25519_dalek::scalar::clamp_integer;
		Ok(Self(clamp_integer(array_cast_slice(
			bytes,
			"X25519PrivateKey",
		)?)))
	}
	pub fn from_array(bytes: [u8; X25519_KEY_SIZE]) -> Self {
		use curve25519_dalek::scalar::clamp_integer;
		Self(clamp_integer(bytes))
	}
}

impl From<StaticSecret> for X25519PrivateKey {
	fn from(static_secret: StaticSecret) -> Self {
		Self::from_array(static_secret.to_bytes())
	}
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct X25519KeyPair {
	pub public_key: X25519PublicKey,
	pub private_key: X25519PrivateKey,
}

impl X25519KeyPair {
	/// Generate a keypair with the given random number generator.
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		let random_seed: [u8; X25519_KEY_SIZE] = randomizer_facade.generate_random_array();

		let private_key = X25519PrivateKey::from_array(random_seed);
		let public_key = private_key.derive_public_key();

		Self {
			public_key,
			private_key,
		}
	}
}

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))]
pub struct X25519PublicKey(pub [u8; X25519_KEY_SIZE]);

impl X25519PublicKey {
	/// Get a reference to the underlying bytes.
	#[must_use]
	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}

	/// Attempt to convert a slice of bytes into an X25519 key.
	///
	/// Returns `Err` on failure.
	pub fn from_bytes(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
		Ok(Self(array_cast_slice(bytes, "X25519PublicKey")?))
	}

	#[must_use]
	pub fn as_public_key(&self) -> PublicKey {
		PublicKey::from(self.0)
	}

	/// Convert an array of bytes into an X25519 key.
	#[cfg(test)]
	#[must_use]
	pub const fn from_array(bytes: [u8; X25519_KEY_SIZE]) -> Self {
		Self(bytes)
	}
}

impl From<PublicKey> for X25519PublicKey {
	fn from(public_key: PublicKey) -> Self {
		Self(public_key.to_bytes())
	}
}

/// Describes shared secrets for encrypting/decrypting a message and verifying authenticity.
pub struct X25519SharedSecrets {
	pub ephemeral_shared_secret: SharedSecret,
	pub auth_shared_secret: SharedSecret,
}

/// Generate a shared secret using the sender's identity key, an ephemeral key, and the recipient's public key.
pub fn x25519_encapsulate(
	sender_key: &X25519PrivateKey,
	ephemeral_key: &X25519PrivateKey,
	recipient_key: &X25519PublicKey,
) -> Result<X25519SharedSecrets, X25519Error> {
	Ok(X25519SharedSecrets {
		ephemeral_shared_secret: ephemeral_key.diffie_hellman(recipient_key)?,
		auth_shared_secret: sender_key.diffie_hellman(recipient_key)?,
	})
}

/// Generate a shared secret using the sender's identity key, an ephemeral key, and the recipient's private key.
pub fn x25519_decapsulate(
	sender_key: &X25519PublicKey,
	ephemeral_key: &X25519PublicKey,
	recipient_key: &X25519PrivateKey,
) -> Result<X25519SharedSecrets, X25519Error> {
	Ok(X25519SharedSecrets {
		ephemeral_shared_secret: recipient_key.diffie_hellman(ephemeral_key)?,
		auth_shared_secret: recipient_key.diffie_hellman(sender_key)?,
	})
}

#[cfg(test)]
mod tests {
	use super::*;
	use crypto_primitives::compatibility_test_utils::get_compatibility_test_data;
	use crypto_primitives::randomizer_facade::test_util::make_thread_rng_facade;

	#[test]
	fn test_identity_element_fails() {
		let randomizer_facade = make_thread_rng_facade();
		let sender_ephemeral_keypair = X25519KeyPair::generate(&randomizer_facade);
		let sender_static_keypair = X25519KeyPair::generate(&randomizer_facade);
		let identity_public_key = X25519PublicKey::from_array([0u8; X25519_KEY_SIZE]);
		let result_encaps = x25519_encapsulate(
			&sender_static_keypair.private_key,
			&sender_ephemeral_keypair.private_key,
			&identity_public_key,
		);
		assert!(result_encaps.is_err());
		let result_decaps_identity = x25519_decapsulate(
			&identity_public_key,
			&sender_ephemeral_keypair.public_key,
			&sender_static_keypair.private_key,
		);
		assert!(result_decaps_identity.is_err());
		let result_decaps_ephemeral = x25519_decapsulate(
			&sender_ephemeral_keypair.public_key,
			&identity_public_key,
			&sender_static_keypair.private_key,
		);
		assert!(result_decaps_ephemeral.is_err());
	}

	#[test]
	fn compatibility_test_x25519() {
		let data = get_compatibility_test_data();
		for i in data.x25519_tests {
			let alice_private_key = X25519PrivateKey(i.alice_private_key_hex.try_into().unwrap());
			let alice_public_key = X25519PublicKey(i.alice_public_key_hex.try_into().unwrap());
			let ephemeral_private_key =
				X25519PrivateKey(i.ephemeral_private_key_hex.try_into().unwrap());
			let ephemeral_public_key =
				X25519PublicKey(i.ephemeral_public_key_hex.try_into().unwrap());
			let bob_private_key = X25519PrivateKey(i.bob_private_key_hex.try_into().unwrap());
			let bob_public_key = X25519PublicKey(i.bob_public_key_hex.try_into().unwrap());

			assert_eq!(
				alice_public_key.as_bytes(),
				alice_private_key.derive_public_key().as_bytes()
			);
			assert_eq!(
				ephemeral_public_key.as_bytes(),
				ephemeral_private_key.derive_public_key().as_bytes()
			);
			assert_eq!(
				bob_public_key.as_bytes(),
				bob_private_key.derive_public_key().as_bytes()
			);

			let ephemeral_secret = i.ephemeral_shared_secret_hex;
			let auth_secret = i.auth_shared_secret_hex;

			let encapsulation =
				x25519_encapsulate(&alice_private_key, &ephemeral_private_key, &bob_public_key)
					.expect("not the identity");
			assert_eq!(
				ephemeral_secret.as_slice(),
				encapsulation.ephemeral_shared_secret.as_bytes(),
				"encaps: ephemeral shared secret mismatch"
			);
			assert_eq!(
				auth_secret.as_slice(),
				encapsulation.auth_shared_secret.as_bytes(),
				"encaps: auth shared secret mismatch"
			);

			let decapsulation =
				x25519_decapsulate(&alice_public_key, &ephemeral_public_key, &bob_private_key)
					.expect("not the identity");
			assert_eq!(
				ephemeral_secret.as_slice(),
				decapsulation.ephemeral_shared_secret.as_bytes(),
				"decaps: ephemeral shared secret mismatch"
			);
			assert_eq!(
				auth_secret.as_slice(),
				decapsulation.auth_shared_secret.as_bytes(),
				"decaps: auth shared secret mismatch"
			);
		}
	}
}
