use crate::crypto::crypto_facade::CryptoProtocolVersion;
use crate::crypto::ecc::EccPublicKey;
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::crypto::rsa::{RSAEccKeyPair, RSAEncryptionError};
use crate::crypto::tuta_crypt::{PQError, PQMessage};
use crate::generated_id::GeneratedId;
#[mockall_double::double]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::tutanota_constants::PublicKeyIdentifierType;
use crate::util::ArrayCastingError;
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

#[derive(thiserror::Error, Debug)]
#[error("AsymmetricCryptoError")]
pub enum AsymmetricCryptoError {
	InvalidCryptoProtocolVersion(CryptoProtocolVersion),
	UnexpectedKeyType(AsymmetricKeyPair),
	RsaCrypto(RSAEncryptionError),
	PqCrypto(PQError),
	ArrayCasting(ArrayCastingError),
	KeyLoading(KeyLoadError),
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

#[derive(uniffi::Object)]
pub struct AsymmetricCryptoFacade {
	key_loader_facade: Arc<KeyLoaderFacade>,
}

#[cfg_attr(test, mockall::automock)]
impl AsymmetricCryptoFacade {
	pub fn new(key_loader_facade: Arc<KeyLoaderFacade>) -> Self {
		Self { key_loader_facade }
	}

	/**
	 * Decrypts the pub_enc_sym_key with the recipientKeyPair.
	 * @param pub_enc_sym_key the asymmetrically encrypted session key
	 * @param cryptoProtocolVersion asymmetric protocol to decrypt pub_enc_sym_key (RSA or TutaCrypt)
	 * @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion.
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

	/**
	 * Loads the recipient key pair in the required version and decrypts the pub_enc_sym_key with it.
	 */
	async fn load_key_pair_and_decrypt_sym_key(
		&self,
		recipient_key_pair_group_id: &GeneratedId,
		recipient_key_version: i64,
		crypto_protocol_version: CryptoProtocolVersion,
		pub_enc_sym_key: &Vec<u8>,
	) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
		let key_pair = self
			.key_loader_facade
			.load_key_pair(recipient_key_pair_group_id, recipient_key_version)
			.await?;
		AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
			key_pair,
			crypto_protocol_version,
			pub_enc_sym_key,
		)
	}

	// /**
	//  * Encrypts the symKey asymmetrically with the provided public keys.
	//  * @param symKey the symmetric key  to be encrypted
	//  * @param recipientPublicKeys the public key(s) of the recipient in the current version
	//  * @param senderGroupId the group id of the sender. will only be used in case we also need the sender's key pair, e.g. with TutaCrypt.
	//  */
	// async asymEncryptSymKey(symKey: AesKey, recipientPublicKeys: Versioned<PublicKeys>, senderGroupId: Id): Promise<PubEncSymKey> {
	// const recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object)
	// const keyPairType = recipientPublicKey.keyPairType
	//
	// if (isPqPublicKey(recipientPublicKey)) {
	// const senderKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(senderGroupId)
	// const senderEccKeyPair = await this.getOrMakeSenderIdentityKeyPair(senderKeyPair.object, senderGroupId)
	// return this.tutaCryptEncryptSymKeyImpl({ object: recipientPublicKey, version: recipientPublicKeys.version }, symKey, {
	// object: senderEccKeyPair,
	// version: senderKeyPair.version,
	// })
	// } else if (isRsaPublicKey(recipientPublicKey)) {
	// const pubEncSymKeyBytes = await this.rsa.encrypt(recipientPublicKey, bitArrayToUint8Array(symKey))
	// return {
	// pubEncSymKeyBytes,
	// cryptoProtocolVersion: CryptoProtocolVersion.RSA,
	// senderKeyVersion: null,
	// recipientKeyVersion: recipientPublicKeys.version,
	// }
	// }
	// throw new CryptoError("unknown public key type: " + keyPairType)
	// }
	//
	// /**
	//  * Encrypts the symKey asymmetrically with the provided public keys using the TutaCrypt protocol.
	//  * @param symKey the key to be encrypted
	//  * @param recipientPublicKeys MUST be a pq key pair
	//  * @param senderEccKeyPair the sender's key pair (needed for authentication)
	//  * @throws ProgrammingError if the recipientPublicKeys are not suitable for TutaCrypt
	//  */
	// async tutaCryptEncryptSymKey(symKey: AesKey, recipientPublicKeys: Versioned<PublicKeys>, senderEccKeyPair: Versioned<EccKeyPair>): Promise<PubEncSymKey> {
	// const recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object)
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
	//
	// private async tutaCryptEncryptSymKeyImpl(
	// recipientPublicKey: Versioned<PQPublicKeys>,
	// symKey: AesKey,
	// senderEccKeyPair: Versioned<EccKeyPair>,
	// ): Promise<PubEncSymKey> {
	// const ephemeralKeyPair = this.cryptoWrapper.generateEccKeyPair()
	// const pubEncSymKeyBytes = await this.pqFacade.encapsulateAndEncode(
	// senderEccKeyPair.object,
	// ephemeralKeyPair,
	// recipientPublicKey.object,
	// bitArrayToUint8Array(symKey),
	// )
	// const senderKeyVersion = senderEccKeyPair.version
	// return { pubEncSymKeyBytes, cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT, senderKeyVersion, recipientKeyVersion: recipientPublicKey.version }
	// }
	//
	// private extractRecipientPublicKey(publicKeys: PublicKeys): AsymmetricPublicKey {
	// if (publicKeys.pubRsaKey) {
	// // we ignore ecc keys as this is only used for the recipient keys
	// return hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey))
	// } else if (publicKeys.pubKyberKey && publicKeys.pubEccKey) {
	// const eccPublicKey = publicKeys.pubEccKey
	// const kyberPublicKey = this.cryptoWrapper.bytesToKyberPublicKey(publicKeys.pubKyberKey)
	// return {
	// keyPairType: KeyPairType.TUTA_CRYPT,
	// eccPublicKey,
	// kyberPublicKey,
	// }
	// } else {
	// throw new Error("Inconsistent Keypair")
	// }
	// }
	//

	// FIXME: the following functions depend on service invocations and are still missing from our implementation

	// /**
	// * Verifies whether the key that the public key service returns is the same as the one used for encryption.
	// * When we have key verification we should stop verifying against the PublicKeyService but against the verified key.
	// *
	// * @param identifier the identifier to load the public key to verify that it matches the one used in the protocol run.
	// * @param sender_identity_pub_key the sender_identity_pub_key that was used to encrypt/authenticate the data.
	// * @param senderKeyVersion the version of the sender_identity_pub_key.
	// */
	// async authenticateSender(identifier: PublicKeyIdentifier, sender_identity_pub_key: Uint8Array, senderKeyVersion: number): Promise<EncryptionAuthStatus>

	// /**
	//  * Decrypts the pubEncSymKey with the recipientKeyPair and authenticates it if the protocol supports authentication.
	//  * If the protocol does not support authentication this method will only decrypt.
	//  * @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion and must be of the required recipientKeyVersion.
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
