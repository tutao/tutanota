use rsa::{BigUint, Oaep};
use rsa::rand_core::CryptoRngCore;
use rsa::traits::{PrivateKeyParts, PublicKeyParts};
use sha2::Sha256;
use zeroize::{Zeroize, ZeroizeOnDrop};
use crate::join_slices;

pub struct RSAPublicKey(rsa::RsaPublicKey);

const RSA_PUBLIC_EXPONENT: u32 = 65537;

fn public_exponent() -> BigUint {
    BigUint::new(vec![RSA_PUBLIC_EXPONENT])
}

impl RSAPublicKey {
    /// Instantiate an RSAPublicKey from a modulus.
    ///
    /// Returns `Err` if the modulus is the wrong size.
    pub fn from_modulus(modulus: &[u8]) -> Result<Self, RSAKeyError> {
        rsa::RsaPublicKey::new(BigUint::from_bytes_be(modulus), public_exponent())
            .map(|o| Self(o))
            .map_err(|e| RSAKeyError { reason: format!("rsa public key parse error: {e}") })
    }

    /// Parse from encoded form.
    pub fn deserialize(bytes: &[u8]) -> Result<Self, RSAKeyError> {
        let [modulus] = decode_nibble_arrays(bytes)?;
        Self::from_modulus(modulus)
    }

    /// Convert to encoded form.
    pub fn serialize(&self) -> Vec<u8> {
        let mut modulus = self.0.n().to_bytes_be();
        let encoded = encode_nibble_arrays(&[modulus.as_slice()]).unwrap();
        modulus.zeroize();
        encoded
    }

    /// Encrypt with the given RNG provider.
    ///
    /// Returns `Err` if an error occurs.
    pub fn encrypt<R: CryptoRngCore>(&self, rng: &mut R, data: &[u8]) -> Result<Vec<u8>, RSAEncryptionError> {
        let padding = Oaep::new::<Sha256>();
        self.0
            .encrypt(rng, padding, data)
            .map_err(|e| RSAEncryptionError { reason: format!("encrypt error: {e}") })
    }
}

pub struct RSAPrivateKey(rsa::RsaPrivateKey);

impl RSAPrivateKey {
    /// Instantiate an RSAPrivateKey from its components.
    ///
    /// Returns `Err` if any components are not correct.
    pub fn from_components(modulus: &[u8], private_exponent: &[u8], prime_p: &[u8], prime_q: &[u8]) -> Result<Self, RSAKeyError> {
        rsa::RsaPrivateKey::from_components(
            BigUint::from_bytes_be(modulus),
            BigUint::new(vec![RSA_PUBLIC_EXPONENT]),
            BigUint::from_bytes_be(private_exponent),
            vec![BigUint::from_bytes_be(prime_p), BigUint::from_bytes_be(prime_q)]
        )
            .and_then(|v| {
                v.validate()?;
                Ok(Self(v))
            })
            .map_err(|e| RSAKeyError { reason: format!("rsa private key parse error: {e}") })
    }

    /// Convert to encoded form.
    pub fn serialize(&self) -> Vec<u8> {
        let calculated = RSAFields::calculate(&self.0);
        encode_nibble_arrays(&[
            calculated.modulus_bytes.as_slice(),
            calculated.private_exponent_bytes.as_slice(),
            calculated.prime_p_bytes.as_slice(),
            calculated.prime_q_bytes.as_slice(),
            calculated.exponent_p_bytes.as_slice(),
            calculated.exponent_q_bytes.as_slice(),
            calculated.crt_coefficient_bytes.as_slice()
        ]).unwrap()
    }

    /// Parse from encoded form.
    pub fn deserialize(bytes: &[u8]) -> Result<Self, RSAKeyError> {
        let [modulus, private_exponent, prime_p, prime_q, _exponent_p, _exponent_q, _crt_coefficient] = decode_nibble_arrays(bytes).unwrap();
        Self::from_components(modulus, private_exponent, prime_p, prime_q)
    }

    /// Decrypt the ciphertext.
    ///
    /// Returns `Err` if an error occurs.
    pub fn decrypt(&self, ciphertext: &[u8]) -> Result<Vec<u8>, RSAEncryptionError> {
        let padding = Oaep::new::<Sha256>();
        self.0
            .decrypt(padding, ciphertext)
            .map_err(|e| RSAEncryptionError { reason: format!("decrypt error: {e}") })
    }
}

/// Decode the encoded byte arrays.
///
/// We encode multiple byte arrays into one by prefixing each byte array with the length as a 16-bit integer (in big endian byte order).
///
/// Returns `Err` if this is invalid.
fn decode_nibble_arrays<const SIZE: usize>(arrays: &[u8]) -> Result<[&[u8]; SIZE], RSAKeyError> {
    let mut result = [[0u8; 0].as_slice(); SIZE];
    let mut remaining = arrays;

    for i in 0..SIZE {
        if remaining.len() < 2 {
            return Err(RSAKeyError { reason: format!("invalid encoded RSA key (only got {i} array(s), expected {SIZE})") })
        }
        let (len_bytes, after) = remaining.split_at(2);

        let length = (u16::from_be_bytes(len_bytes.try_into().unwrap()) as usize) / 2;
        if after.len() < length {
            return Err(RSAKeyError { reason: format!("invalid encoded RSA key (size {length} is too large)") })
        }
        let (arr, new_remaining) = after.split_at(length);

        result[i] = arr;
        remaining = new_remaining;
    }

    if !remaining.is_empty() {
        return Err(RSAKeyError { reason: format!("extraneous {} byte(s) detected - incorrect size?", remaining.len()) })
    }

    Ok(result)
}

/// Encode the byte arrays into one.
///
/// We encode multiple byte arrays into one by prefixing each byte array with the length as a 16-bit integer (in big endian byte order).
///
/// Returns `Err` if anything is bigger than a 16-bit integer.
fn encode_nibble_arrays<const SIZE: usize>(arrays: &[&[u8]; SIZE]) -> Result<Vec<u8>, RSAKeyError> {
    let mut expected_size = 0usize;
    for &i in arrays {
        let len = i.len() * 2;
        if len > u16::MAX as usize {
            return Err(RSAKeyError { reason: format!("nibble array length {len} exceeds 16-bit limit") })
        }
        expected_size += 2 + i.len();
    }

    let mut v = Vec::with_capacity(expected_size);
    for &i in arrays {
        v.extend_from_slice(&((i.len() * 2) as u16).to_be_bytes());
        v.extend_from_slice(i);
    }

    Ok(v)
}

/// Error that occurs when parsing RSA keys.
#[derive(thiserror::Error, Debug)]
#[error("RSA error: {reason}")]
pub struct RSAKeyError {
    reason: String
}

/// Error that occurs when using rsa encrypt/decrypt.
#[derive(thiserror::Error, Debug)]
#[error("RSA error: {reason}")]
pub struct RSAEncryptionError {
    reason: String
}

/// Required for serializing to maintain compatibility with tutanota's javascript RSA.
///
/// This contains all values to allow it to be zeroized on drop efficiently.
#[derive(Zeroize, ZeroizeOnDrop)]
struct RSAFields {
    p1: BigUint,
    q1: BigUint,
    exponent_p: BigUint,
    exponent_q: BigUint,
    crt_coefficient: BigUint,

    modulus_bytes: Vec<u8>,
    private_exponent_bytes: Vec<u8>,
    prime_p_bytes: Vec<u8>,
    prime_q_bytes: Vec<u8>,
    exponent_p_bytes: Vec<u8>,
    exponent_q_bytes: Vec<u8>,
    crt_coefficient_bytes: Vec<u8>,
}
impl RSAFields {
    fn calculate(key: &rsa::RsaPrivateKey) -> Self {
        let one = BigUint::new(vec![1]);
        let crt_coefficient = key.crt_coefficient().unwrap();
        let [prime_p, prime_q] = key.primes() else { unreachable!() };
        let modulus = key.n();
        let private_exponent = key.d();

        // Note: We have to store p-1 and q-1 to ensure we zeroize them later
        let p1 = prime_p - &one;
        let q1 = prime_q - &one;
        let exponent_p = private_exponent % &p1;
        let exponent_q = private_exponent % &q1;

        // For efficiently padding to 256 bytes
        let mut zeroes = Vec::with_capacity(256);
        let mut resize = |mut bytes: Vec<u8>| -> Vec<u8> {
            if bytes.len() < 256 {
                zeroes.resize(256 - bytes.len(), 0); // resize the same byte array so we don't have to re-allocate
                let new_val = join_slices!(&zeroes, bytes.as_slice());
                bytes.zeroize();
                new_val
            } else {
                bytes
            }
        };

        let modulus_bytes = modulus.to_bytes_be();
        let private_exponent_bytes = private_exponent.to_bytes_be();
        let prime_p_bytes = resize(prime_p.to_bytes_be());
        let prime_q_bytes = resize(prime_q.to_bytes_be());
        let exponent_p_bytes = resize(exponent_p.to_bytes_be());
        let exponent_q_bytes = resize(exponent_q.to_bytes_be());
        let crt_coefficient_bytes = resize(crt_coefficient.to_bytes_be());

        Self {
            p1,
            q1,
            exponent_p,
            exponent_q,
            crt_coefficient,
            modulus_bytes,
            private_exponent_bytes,
            prime_p_bytes,
            prime_q_bytes,
            exponent_p_bytes,
            exponent_q_bytes,
            crt_coefficient_bytes,
        }
    }
}

#[cfg(test)]
mod tests {
    use rsa::rand_core::{CryptoRng, Error, RngCore};
    use rsa::rand_core::impls::next_u64_via_fill;
    use rsa::rand_core::impls::next_u32_via_fill;

    use crate::crypto::compatibility_test_utils::get_test_data;
    use super::*;

    #[test]
    fn test_rsa_encryption() {
        let test_data = get_test_data();
        for i in test_data.rsa_encryption_tests {
            let public_key = RSAPublicKey::deserialize(&i.public_key).unwrap();
            let ciphertext = public_key.encrypt(&mut SeedBufferRng::new(&i.seed), &i.input).unwrap();
            assert_eq!(i.result, ciphertext);
        }
    }

    #[test]
    fn test_rsa_decryption() {
        let test_data = get_test_data();
        for i in test_data.rsa_encryption_tests {
            let private_key = RSAPrivateKey::deserialize(&i.private_key).unwrap();
            let data = private_key.decrypt(&i.result).unwrap();
            assert_eq!(i.input, data);
        }
    }

    #[test]
    fn test_rsa_serialize_roundtrip() {
        let test_data = get_test_data();
        for i in test_data.rsa_encryption_tests {
            let public_key = RSAPublicKey::deserialize(&i.public_key).unwrap();
            assert_eq!(i.public_key, public_key.serialize());
            let private_key = RSAPrivateKey::deserialize(&i.private_key).unwrap();
            assert_eq!(i.private_key, private_key.serialize());
        }
    }

    /// Used for providing a string of bytes as a random number generator.
    ///
    /// # Panics
    ///
    /// This will panic if not enough bytes have been passed into the random number generator.
    struct SeedBufferRng<'a> {
        buff: &'a [u8]
    }

    impl<'a> SeedBufferRng<'a> {
        pub fn new(buff: &'a [u8]) -> SeedBufferRng<'a> {
            SeedBufferRng { buff }
        }
    }

    impl<'a> RngCore for SeedBufferRng<'a> {
        fn next_u32(&mut self) -> u32 {
            next_u32_via_fill(self)
        }

        fn next_u64(&mut self) -> u64 {
            next_u64_via_fill(self)
        }

        fn fill_bytes(&mut self, dest: &mut [u8]) {
            let (copied, remaining) = self.buff.split_at(dest.len());
            dest.copy_from_slice(copied);
            self.buff = remaining;
        }

        fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), Error> {
            Ok(self.fill_bytes(dest))
        }
    }

    impl<'a> CryptoRng for SeedBufferRng<'a> {}
}