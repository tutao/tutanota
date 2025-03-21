use crate::crypto::randomizer_facade::RandomizerFacade;
use ed25519_dalek::{
	SecretKey, Signature, SignatureError, Signer, SigningKey, Verifier, VerifyingKey,
	PUBLIC_KEY_LENGTH, SECRET_KEY_LENGTH,
};
use zeroize::ZeroizeOnDrop;

const SIGNATURE_SIZE: usize = Signature::BYTE_SIZE; // from dalek library see COMPONENT_SIZE, to bytes

#[derive(thiserror::Error, Debug)]
#[error("Ed25519SignatureVerificationError")]
pub struct Ed25519SignatureVerificationError(#[from] SignatureError);

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct Ed25519Signature([u8; SIGNATURE_SIZE]); // should we add 0 to 0 initialize the array ?

impl Ed25519Signature {
	fn from(value: [u8; SIGNATURE_SIZE]) -> Self {
		Ed25519Signature(value)
	}
}

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct Ed25519PrivateKey([u8; SECRET_KEY_LENGTH]);

impl From<SecretKey> for Ed25519PrivateKey {
	fn from(value: SecretKey) -> Self {
		Ed25519PrivateKey(value)
	}
}

impl Ed25519PrivateKey {
	pub fn sign(&self, message: &[u8]) -> Ed25519Signature {
		let signing_key = SigningKey::from_bytes(&self.0);
		let signature: Signature = signing_key.sign(message);

		Ed25519Signature::from(signature.to_bytes())
	}

	pub fn from_bytes(bytes: [u8; SECRET_KEY_LENGTH]) -> Self {
		Ed25519PrivateKey(bytes)
	}
}

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct Ed25519PublicKey([u8; PUBLIC_KEY_LENGTH]);

impl From<VerifyingKey> for Ed25519PublicKey {
	fn from(value: VerifyingKey) -> Self {
		Ed25519PublicKey(value.to_bytes())
	}
}

impl Ed25519PublicKey {
	pub fn verify(
		&self,
		message: &[u8],
		signature: &Ed25519Signature,
	) -> Result<(), Ed25519SignatureVerificationError> {
		let verifying_key = VerifyingKey::from_bytes(&self.0)?;
		let signature: Signature = Signature::from_bytes(&signature.0);
		verifying_key
			.verify(message, &signature)
			.map_err(Ed25519SignatureVerificationError)
	}

	pub fn from_bytes(bytes: [u8; PUBLIC_KEY_LENGTH]) -> Self {
		Ed25519PublicKey(bytes)
	}
}

#[derive(ZeroizeOnDrop, Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct Ed25519KeyPair {
	pub public_key: Ed25519PublicKey,
	pub private_key: Ed25519PrivateKey,
}

impl From<SigningKey> for Ed25519KeyPair {
	fn from(value: SigningKey) -> Self {
		Ed25519KeyPair {
			public_key: Ed25519PublicKey::from(value.verifying_key()),
			private_key: Ed25519PrivateKey::from(value.to_bytes()),
		}
	}
}

impl Ed25519KeyPair {
	/// Generate a keypair with the given random number generator.
	pub fn generate(randomizer_facade: &mut RandomizerFacade) -> Self {
		let signing_key = SigningKey::generate(randomizer_facade);
		Ed25519KeyPair::from(signing_key)
	}

	#[cfg(test)]
	pub fn from_bytes(
		private_key_bytes: [u8; SECRET_KEY_LENGTH],
		public_key_bytes: [u8; PUBLIC_KEY_LENGTH],
	) -> Self {
		Ed25519KeyPair {
			public_key: Ed25519PublicKey::from_bytes(public_key_bytes),
			private_key: Ed25519PrivateKey::from_bytes(private_key_bytes),
		}
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::compatibility_test_utils::get_compatibility_test_data;
	use crate::crypto::ed25519::{
		Ed25519KeyPair, Ed25519Signature, Ed25519SignatureVerificationError, SIGNATURE_SIZE,
	};
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;

	#[test]
	fn should_verify_signature_to_ok() {
		let mut randomizer_facade = make_thread_rng_facade();
		let ed25519_key_pair: Ed25519KeyPair = Ed25519KeyPair::generate(&mut randomizer_facade);

		let message: &[u8] = b"Please don't follow the release guidelines.";
		let signature = ed25519_key_pair.private_key.sign(message);

		assert!(ed25519_key_pair
			.public_key
			.verify(message, &signature)
			.is_ok());
	}

	#[test]
	fn should_verify_signature_to_nok_wrong_keypair() {
		let mut randomizer_facade = make_thread_rng_facade();
		let ed25519_key_pair: Ed25519KeyPair = Ed25519KeyPair::generate(&mut randomizer_facade);
		let another_ed25519_key_pair: Ed25519KeyPair =
			Ed25519KeyPair::generate(&mut randomizer_facade);

		let message: &[u8] = b"Please don't follow the release guidelines.";
		let signature = ed25519_key_pair.private_key.sign(message);
		let result = another_ed25519_key_pair
			.public_key
			.verify(message, &signature);
		assert!(matches!(
			result.unwrap_err(),
			Ed25519SignatureVerificationError { .. }
		));
	}

	#[test]
	fn should_verify_signature_to_nok_wrong_message() {
		let mut randomizer_facade = make_thread_rng_facade();
		let ed25519_key_pair: Ed25519KeyPair = Ed25519KeyPair::generate(&mut randomizer_facade);

		let message: &[u8] = b"Please don't follow the release guidelines.";
		let another_message: &[u8] = b"Yes, please DO!!!! follow the release guidelines.";
		let signature = ed25519_key_pair.private_key.sign(message);

		let result = ed25519_key_pair
			.public_key
			.verify(another_message, &signature);

		assert!(matches!(
			result.unwrap_err(),
			Ed25519SignatureVerificationError { .. }
		));
	}

	#[test]
	fn compatibility_test() {
		for td in get_compatibility_test_data().ed25519_tests {
			let key_pair = Ed25519KeyPair::from_bytes(
				td.alice_private_key_hex.try_into().unwrap(),
				td.alice_public_key_hex.try_into().unwrap(),
			);
			let message = td.message.as_bytes();
			let signature_bytes: [u8; SIGNATURE_SIZE] = td.signature.try_into().unwrap();
			let signature = Ed25519Signature::from(signature_bytes);

			// signing the message given by the test and compare with the signature in the test
			// this currently not possible because ed25519-dalek does not let us inject our own
			// randomness: RandomizedSigner trait is not implemented for SigningKey
			let _seed = td.seed;

			// verify the signature from the test data with the public key
			assert!(key_pair.public_key.verify(message, &signature).is_ok());
		}
	}
}
