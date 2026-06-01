use crate::aes::InitializationVector;
use crate::key::GenericAesKey;

#[derive(Clone, PartialEq)]
#[cfg_attr(any(test, feature = "test_utils"), derive(Debug))] // only allow Debug in tests because this might print a key
pub struct Versioned<T> {
	pub object: T,
	pub version: u64,
}

impl<T> Versioned<T> {
	pub fn new(object: T, version: u64) -> Versioned<T> {
		Versioned { object, version }
	}
	pub fn as_ref(&self) -> Versioned<&T> {
		Versioned {
			object: &self.object,
			version: self.version,
		}
	}
}

pub type VersionedAesKey = Versioned<GenericAesKey>;

impl VersionedAesKey {
	#[must_use]
	pub fn encrypt_key(
		&self,
		key_to_encrypt: &GenericAesKey,
		iv: InitializationVector,
	) -> Versioned<Vec<u8>> {
		let encrypted_key = self.object.encrypt_key(key_to_encrypt, iv);
		// todo: this looks like the vec<u8> has the version which is not true
		Versioned::new(encrypted_key, self.version)
	}
}
