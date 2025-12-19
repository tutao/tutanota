//! Contains functions to perform hashing via SHA
use sha2::Digest;
use sha3::Sha3_256;

/// Generates a SHA2-256 hash of `data`
#[must_use]
pub fn sha256(data: &[u8]) -> Vec<u8> {
	let mut hasher = sha2::Sha256::new();
	hasher.update(data);
	hasher.finalize().to_vec()
}

/// Generates a SHA512 hash of `data`
pub fn sha512(data: &[u8]) -> Vec<u8> {
	let mut hasher = sha2::Sha512::new();
	hasher.update(data);
	hasher.finalize().to_vec()
}

/// Returns a SHA3-256 hash of data
pub fn sha3_256(data: &[u8]) -> Vec<u8> {
	let mut hasher = Sha3_256::new();
	hasher.update(data);
	hasher.finalize().to_vec()
}
