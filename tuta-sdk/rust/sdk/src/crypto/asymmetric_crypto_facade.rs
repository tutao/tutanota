use crate::crypto::aes::Iv;
use crate::crypto::crypto_facade::CryptoProtocolVersion;
use crate::crypto::ecc::{EccKeyPair, EccPublicKey};
use crate::crypto::key::{AsymmetricKeyPair, AsymmetricPublicKey, GenericAesKey, KeyLoadError};
use crate::crypto::kyber::{KyberKeyError, KyberPublicKey};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::rsa::{RSAEccKeyPair, RSAEncryptionError, RSAKeyError, RSAPublicKey};
use crate::crypto::tuta_crypt::{PQError, PQMessage, TutaCryptPublicKeys};
use crate::crypto::Aes256Key;
#[mockall_double::double]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::tutanota_constants::PublicKeyIdentifierType;
use crate::util::ArrayCastingError;
use crate::util::Versioned;
use std::sync::Arc;
use zeroize::Zeroizing;

pub struct DecapsulatedAesKey {
	pub decrypted_aes_key: GenericAesKey,
	pub sender_identity_pub_key: Option<EccPublicKey>, // for authentication: None for rsa only
}

pub struct PublicKeyIdentifier {
	pub identifier: String,
	pub identifier_type: PublicKeyIdentifierType,
}

pub struct PubEncSymKey {
	pub_enc_sym_key_bytes: Vec<u8>,
	crypto_protocol_version: CryptoProtocolVersion,
	sender_key_version: Option<i64>,
	recipient_key_version: i64,
}

pub struct PublicKeys {
	pub_rsa_key: Option<Vec<u8>>,
	pub_ecc_key: Option<Vec<u8>>,
	pub_kyber_key: Option<Vec<u8>>,
}

#[derive(thiserror::Error, Debug)]
#[error("AsymmetricCryptoError")]
pub enum AsymmetricCryptoError {
	InvalidCryptoProtocolVersion(CryptoProtocolVersion),
	UnexpectedKeyType(AsymmetricKeyPair),
	RsaCrypto(RSAEncryptionError),
	PqCrypto(PQError),
	ArrayCasting(ArrayCastingError),
	KeyLoading(KeyLoadError),
	KeyParsing(String),
	RsaKey(RSAKeyError),
	KyberKey(KyberKeyError),
}
impl From<RSAEncryptionError> for AsymmetricCryptoError {
	fn from(err: RSAEncryptionError) -> Self {
		AsymmetricCryptoError::RsaCrypto(err)
	}
}
impl From<PQError> for AsymmetricCryptoError {
	fn from(err: PQError) -> Self {
		AsymmetricCryptoError::PqCrypto(err)
	}
}
impl From<ArrayCastingError> for AsymmetricCryptoError {
	fn from(err: ArrayCastingError) -> Self {
		AsymmetricCryptoError::ArrayCasting(err)
	}
}
impl From<KeyLoadError> for AsymmetricCryptoError {
	fn from(err: KeyLoadError) -> Self {
		AsymmetricCryptoError::KeyLoading(err)
	}
}
impl From<RSAKeyError> for AsymmetricCryptoError {
	fn from(err: RSAKeyError) -> Self {
		AsymmetricCryptoError::RsaKey(err)
	}
}
impl From<KyberKeyError> for AsymmetricCryptoError {
	fn from(err: KyberKeyError) -> Self {
		AsymmetricCryptoError::KyberKey(err)
	}
}

#[derive(uniffi::Object)]
pub struct AsymmetricCryptoFacade {
	key_loader_facade: Arc<KeyLoaderFacade>,
	randomizer_facade: RandomizerFacade,
}

#[cfg_attr(test, mockall::automock)]
impl AsymmetricCryptoFacade {
	pub fn new(
		key_loader_facade: Arc<KeyLoaderFacade>,
		randomizer_facade: RandomizerFacade,
	) -> Self {
		Self {
			key_loader_facade,
			randomizer_facade,
		}
	}

	/**
	 * Decrypts the pub_enc_sym_key with the recipientKeyPair.
	 * @param pub_enc_sym_key the asymmetrically encrypted session key
	 * @param crypto_protocol_version asymmetric protocol to decrypt pub_enc_sym_key (RSA or TutaCrypt)
	 * @param recipient_key_pair the recipientKeyPair. Must match the crypto_protocol_version.
	 */
	pub fn decrypt_sym_key_with_key_pair(
		recipient_key_pair: AsymmetricKeyPair,
		crypto_protocol_version: CryptoProtocolVersion,
		pub_enc_sym_key: &Vec<u8>,
	) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
		match crypto_protocol_version {
			CryptoProtocolVersion::Rsa => match recipient_key_pair {
				AsymmetricKeyPair::RSAEccKeyPair(RSAEccKeyPair {
					rsa_key_pair: k, ..
				})
				| AsymmetricKeyPair::RSAKeyPair(k) => {
					let sym_key_bytes = Zeroizing::new(k.private_key.decrypt(pub_enc_sym_key)?);
					let decrypted_aes_key = GenericAesKey::from_bytes(sym_key_bytes.as_slice())?;
					Ok(DecapsulatedAesKey {
						decrypted_aes_key,
						sender_identity_pub_key: None,
					})
				},
				_ => Err(AsymmetricCryptoError::UnexpectedKeyType(recipient_key_pair)),
			},
			CryptoProtocolVersion::TutaCrypt => match recipient_key_pair {
				AsymmetricKeyPair::PQKeyPairs(k) => {
					let decapsulated_sym_key =
						PQMessage::deserialize(pub_enc_sym_key)?.decapsulate(&k)?;
					Ok(DecapsulatedAesKey {
						decrypted_aes_key: decapsulated_sym_key.decrypted_sym_key_bytes.into(),
						sender_identity_pub_key: Some(decapsulated_sym_key.sender_identity_pub_key),
					})
				},
				_ => Err(AsymmetricCryptoError::UnexpectedKeyType(recipient_key_pair)),
			},
			_ => Err(AsymmetricCryptoError::InvalidCryptoProtocolVersion(
				crypto_protocol_version,
			)),
		}
	}

	// /**
	//  * Loads the recipient_key_pair in the required version and decrypts the pub_enc_sym_key with it.
	//  */
	// async fn load_key_pair_and_decrypt_sym_key(
	// 	&self,
	// 	recipient_key_pair_group_id: &GeneratedId,
	// 	recipient_key_version: i64,
	// 	crypto_protocol_version: CryptoProtocolVersion,
	// 	pub_enc_sym_key: &Vec<u8>,
	// ) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
	// 	let key_pair = self
	// 		.key_loader_facade
	// 		.load_key_pair(recipient_key_pair_group_id, recipient_key_version)
	// 		.await?;
	// 	AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
	// 		key_pair,
	// 		crypto_protocol_version,
	// 		pub_enc_sym_key,
	// 	)
	// }

	// /**
	//  * Encrypts the symKey asymmetrically with the provided public keys.
	//  * @param symKey the symmetric key  to be encrypted
	//  * @param recipientPublicKeys the public key(s) of the recipient in the current version
	//  * @param senderGroupId the group id of the sender. will only be used in case we also need the sender's key pair, e.g. with TutaCrypt.
	//  */
	// pub async fn asym_encrypt_sym_key(
	// 	&self,
	// 	sym_key: GenericAesKey,
	// 	versioned_recipient_public_keys: Versioned<PublicKeys>,
	// 	sender_group_id: &GeneratedId,
	// ) -> Result<PubEncSymKey, AsymmetricCryptoError> {
	// 	let recipient_public_key = AsymmetricCryptoFacade::extract_recipient_public_key(
	// 		versioned_recipient_public_keys.object,
	// 	)?;
	//
	// 	match recipient_public_key {
	// 		AsymmetricPublicKey::RsaPublicKey(rsaPubKey) => {
	// 			let pub_enc_sym_key_bytes =
	// 				RSAPublicKey::encrypt(&rsaPubKey, &self.randomizer_facade, sym_key.as_bytes())?;
	// 			Ok(PubEncSymKey {
	// 				pub_enc_sym_key_bytes,
	// 				crypto_protocol_version: CryptoProtocolVersion::Rsa,
	// 				sender_key_version: None,
	// 				recipient_key_version: versioned_recipient_public_keys.version,
	// 			})
	// 		},
	// 		AsymmetricPublicKey::PqPublicKeys(pqPubKeys) => {
	// 			let sender_key_pair = self
	// 				.key_loader_facade
	// 				.load_key_pair(sender_group_id) // TODO implement load_current_key_pair
	// 				.await?;
	// 			let sender_ecc_key_pair = EccKeyPair::generate(&self.randomizer_facade); // TODO self.getOrMakeSenderIdentityKeyPair(sender_key_pair.object, sender_group_id).await;
	// 			Ok(self.tuta_crypt_encrypt_sym_key_impl(
	// 				Versioned {
	// 					object: pqPubKeys,
	// 					version: versioned_recipient_public_keys.version,
	// 				},
	// 				sym_key.into(),
	// 				Versioned {
	// 					object: sender_ecc_key_pair,
	// 					version: sender_key_pair.version,
	// 				},
	// 			)?)
	// 		},
	// 	}
	// }

	// /**
	//  * Encrypts the symKey asymmetrically with the provided public keys using the TutaCrypt protocol.
	//  * @param symKey the key to be encrypted
	//  * @param recipientPublicKeys MUST be a pq key pair
	//  * @param senderEccKeyPair the sender's key pair (needed for authentication)
	//  * @throws ProgrammingError if the recipientPublicKeys are not suitable for TutaCrypt
	//  */
	// pub async fn tutaCryptEncryptSymKey(symKey: AesKey, recipientPublicKeys: Versioned<PublicKeys>, senderEccKeyPair: Versioned<EccKeyPair>): Promise<PubEncSymKey> {
	// let recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object)
	// if (!isPqPublicKey(recipientPublicKey)) {
	// throw new ProgrammingError("the recipient does not have pq key pairs")
	// }
	// return this.tutaCryptEncryptSymKeyImpl(
	// {
	// object: recipientPublicKey,
	// version: recipientPublicKeys.version,
	// },
	// symKey,
	// senderEccKeyPair,
	// )
	// }

	fn tuta_crypt_encrypt_sym_key_impl(
		&self,
		recipient_public_key: Versioned<TutaCryptPublicKeys>,
		sym_key: Aes256Key, // TODO make generic aes key
		sender_ecc_key_pair: Versioned<EccKeyPair>,
	) -> Result<PubEncSymKey, AsymmetricCryptoError> {
		let ephemeral_key_pair = EccKeyPair::generate(&self.randomizer_facade);
		let encapsulation_iv = Iv::generate(&self.randomizer_facade); // TODO do not pass iv but always generate it in encapsulate. mock randomizer for tests
		let pub_enc_sym_key_bytes = PQMessage::encapsulate(
			&sender_ecc_key_pair.object,
			&ephemeral_key_pair,
			&recipient_public_key.object.ecc_public_key,
			&recipient_public_key.object.kyber_public_key,
			&sym_key,
			encapsulation_iv,
		)?
		.serialize();
		Ok(PubEncSymKey {
			pub_enc_sym_key_bytes,
			crypto_protocol_version: CryptoProtocolVersion::TutaCrypt,
			sender_key_version: Some(sender_ecc_key_pair.version),
			recipient_key_version: recipient_public_key.version,
		})
	}

	fn extract_recipient_public_key(
		public_keys: PublicKeys,
	) -> Result<AsymmetricPublicKey, AsymmetricCryptoError> {
		if Option::is_some(&public_keys.pub_rsa_key) {
			// we ignore ecc keys as this is only used for the recipient keys
			Ok(AsymmetricPublicKey::RsaPublicKey(
				RSAPublicKey::deserialize(public_keys.pub_rsa_key.unwrap().as_slice())?,
			))
		} else if Option::is_some(&public_keys.pub_ecc_key)
			&& Option::is_some(&public_keys.pub_kyber_key)
		{
			let kyber_public_key =
				KyberPublicKey::deserialize(public_keys.pub_kyber_key.unwrap().as_slice())?;
			let ecc_public_key =
				EccPublicKey::from_bytes(public_keys.pub_ecc_key.unwrap().as_slice())?;
			return Ok(AsymmetricPublicKey::PqPublicKeys(TutaCryptPublicKeys {
				ecc_public_key,
				kyber_public_key,
			}));
		} else {
			Err(AsymmetricCryptoError::KeyParsing(
				"Got an unparseable public key".to_string(),
			))
		}
	}

	// FIXME: the following functions depend on service invocations and are still missing from our implementation

	// /**
	// * Verifies whether the key that the public key service returns is the same as the one used for encryption.
	// * When we have key verification we should stop verifying against the PublicKeyService but against the verified key.
	// *
	// * @param identifier the identifier to load the public key to verify that it matches the one used in the protocol run.
	// * @param sender_identity_pub_key the sender_identity_pub_key that was used to encrypt/authenticate the data.
	// * @param sender_key_version the version of the sender_identity_pub_key.
	// */
	// async authenticateSender(identifier: PublicKeyIdentifier, sender_identity_pub_key: uint8array, sender_key_version: number): Promise<EncryptionAuthStatus>

	// /**
	//  * Decrypts the pubEncSymKey with the recipientKeyPair and authenticates it if the protocol supports authentication.
	//  * If the protocol does not support authentication this method will only decrypt.
	//  * @param recipientKeyPair the recipientKeyPair. Must match the crypto_protocol_version and must be of the required recipient_key_version.
	//  * @param pubEncKeyData the encrypted symKey with the metadata (versions, group identifier etc.) for decryption and authentication.
	//  * @param senderIdentifier the identifier for the sender's key group
	//  * @throws CryptoError in case the authentication fails.
	//  */
	// async decryptSymKeyWithKeyPairAndAuthenticate(
	// recipientKeyPair: AsymmetricKeyPair,
	// pubEncKeyData: PubEncKeyData,
	// senderIdentifier: PublicKeyIdentifier,
	// )

	// /**
	//  * Returns the SenderIdentityKeyPair that is either already on the KeyPair that is being passed in,
	//  * or creates a new one and writes it to the respective Group.
	//  * @param senderKeyPair
	//  * @param keyGroupId Id for the Group that Public Key Service might write a new IdentityKeyPair for.
	//  * 						This is necessary as a User might send an E-Mail from a shared mailbox,
	//  * 						for which the KeyPair should be created.
	//  */
	// private async getOrMakeSenderIdentityKeyPair(senderKeyPair: AsymmetricKeyPair, keyGroupId: Id): Promise<EccKeyPair>
}

// TODO tests
#[cfg(test)]
mod test {}
