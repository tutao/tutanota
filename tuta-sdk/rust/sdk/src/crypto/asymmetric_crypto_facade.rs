use crate::crypto::aes::{AesEncryptError, Iv};
use crate::crypto::crypto_facade::CryptoProtocolVersion;
use crate::crypto::ecc::{EccKeyPair, EccPublicKey};
use crate::crypto::key::{AsymmetricKeyPair, AsymmetricPublicKey, GenericAesKey, KeyLoadError};
use crate::crypto::kyber::{KyberKeyError, KyberPublicKey};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::rsa::{RSAEccKeyPair, RSAEncryptionError, RSAKeyError, RSAPublicKey};
use crate::crypto::tuta_crypt::{PQError, PQMessage, TutaCryptPublicKeys};
use crate::crypto::Aes256Key;
use crate::entities::sys::{PubEncKeyData, PublicKeyGetIn, PublicKeyPutIn};
use crate::generated_id::GeneratedId;
#[cfg_attr(test, mockall_double::double)]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::key_loader_facade::VersionedAesKey;
use crate::services::service_executor::ServiceExecutor;
use crate::services::sys::PublicKeyService;
use crate::services::ExtraServiceParams;
use crate::tutanota_constants::{EncryptionAuthStatus, PublicKeyIdentifierType};
use crate::util::Versioned;
use crate::util::{vector_equals, ArrayCastingError};
use crate::ApiCallError;
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
	UnexpectedAsymmetricKeyPairType(AsymmetricKeyPair),
	UnexpectedPublicKeyPairType(AsymmetricPublicKey),
	UnexpectedSymmetricKeyType(GenericAesKey),
	RsaEncrypt(#[from] RSAEncryptionError),
	PqCrypto(#[from] PQError),
	ArrayCasting(#[from] ArrayCastingError),
	KeyLoading(#[from] KeyLoadError),
	KeyParsing(String),
	RsaKey(#[from] RSAKeyError),
	KyberKey(#[from] KyberKeyError),
	AesEncrypt(#[from] AesEncryptError),
	ApiCall(#[from] ApiCallError),
	AuthenticationError(EncryptionAuthStatus),
}

#[derive(uniffi::Object)]
pub struct AsymmetricCryptoFacade {
	key_loader_facade: Arc<KeyLoaderFacade>,
	randomizer_facade: RandomizerFacade,
	service_executor: Arc<ServiceExecutor>,
}

#[cfg_attr(test, mockall::automock)]
impl AsymmetricCryptoFacade {
	pub fn new(
		key_loader_facade: Arc<KeyLoaderFacade>,
		randomizer_facade: RandomizerFacade,
		service_executor: Arc<ServiceExecutor>,
	) -> Self {
		Self {
			key_loader_facade,
			randomizer_facade,
			service_executor,
		}
	}

	/**
	 * Verifies whether the key that the public key service returns is the same as the one used for encryption.
	 * When we have key verification we should stop verifying against the PublicKeyService but against the verified key.
	 *
	 * @param identifier the identifier to load the public key to verify that it matches the one used in the protocol run.
	 * @param senderIdentityPubKey the senderIdentityPubKey that was used to encrypt/authenticate the data.
	 * @param senderKeyVersion the version of the senderIdentityPubKey.
	 */
	pub async fn authenticate_sender(
		&self,
		identifier: PublicKeyIdentifier,
		sender_identity_pub_key: &Vec<u8>,
		sender_key_version: i64,
	) -> Result<EncryptionAuthStatus, AsymmetricCryptoError> {
		let identifier_type: i64 = identifier.identifier_type.into();
		let key_data = PublicKeyGetIn {
			_format: 0,
			identifier: identifier.identifier,
			identifierType: identifier_type,
			version: Some(sender_key_version),
		};
		let public_key_get_out = self
			.service_executor
			.get::<PublicKeyService>(key_data, ExtraServiceParams::default())
			.await?;
		if Option::is_some(&public_key_get_out.pubEccKey)
			&& vector_equals(
				&public_key_get_out.pubEccKey.unwrap(),
				sender_identity_pub_key,
			) {
			Ok(EncryptionAuthStatus::TutacryptAuthenticationSucceeded)
		} else {
			Ok(EncryptionAuthStatus::TutacryptAuthenticationFailed)
		}
	}

	/**
	 * Decrypts the pubEncSymKey with the recipientKeyPair and authenticates it if the protocol supports authentication.
	 * If the protocol does not support authentication this method will only decrypt.
	 * @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion and must be of the required recipientKeyVersion.
	 * @param pubEncKeyData the encrypted symKey with the metadata (versions, group identifier etc.) for decryption and authentication.
	 * @param senderIdentifier the identifier for the sender's key group
	 * @throws CryptoError in case the authentication fails.
	 */
	pub async fn decrypt_sym_key_with_key_pair_and_authenticate(
		&self,
		recipient_key_pair: AsymmetricKeyPair,
		pub_enc_key_data: PubEncKeyData,
		sender_identifier: PublicKeyIdentifier,
	) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
		let crypto_protocol_version: CryptoProtocolVersion =
			CryptoProtocolVersion::try_from(pub_enc_key_data.protocol_version).unwrap();
		let decapsulated_aes_key = Self::decrypt_sym_key_with_key_pair(
			recipient_key_pair,
			crypto_protocol_version,
			&pub_enc_key_data.pub_enc_sym_key,
		)?;
		if crypto_protocol_version == CryptoProtocolVersion::TutaCrypt {
			let encryption_auth_status = self
				.authenticate_sender(
					sender_identifier,
					&decapsulated_aes_key
						.sender_identity_pub_key
						.as_ref()
						.unwrap()
						.as_bytes()
						.to_vec(),
					pub_enc_key_data.sender_key_version.unwrap(),
				)
				.await?;
			if encryption_auth_status != EncryptionAuthStatus::TutacryptAuthenticationSucceeded {
				//the provided public key could not be authenticated
				return Err(AsymmetricCryptoError::AuthenticationError(
					encryption_auth_status,
				));
			}
		}
		Ok(decapsulated_aes_key)
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
				_ => Err(AsymmetricCryptoError::UnexpectedAsymmetricKeyPairType(
					recipient_key_pair,
				)),
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
				_ => Err(AsymmetricCryptoError::UnexpectedAsymmetricKeyPairType(
					recipient_key_pair,
				)),
			},
			_ => Err(AsymmetricCryptoError::InvalidCryptoProtocolVersion(
				crypto_protocol_version,
			)),
		}
	}

	/**
	 * Loads the recipient_key_pair in the required version and decrypts the pub_enc_sym_key with it.
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
		Self::decrypt_sym_key_with_key_pair(key_pair, crypto_protocol_version, pub_enc_sym_key)
	}

	/**
	 * Encrypts the symKey asymmetrically with the provided public keys.
	 * @param symKey the symmetric key  to be encrypted
	 * @param recipientPublicKeys the public key(s) of the recipient in the current version
	 * @param senderGroupId the group id of the sender. will only be used in case we also need the sender's key pair, e.g. with TutaCrypt.
	 */
	pub async fn asym_encrypt_sym_key(
		&self,
		sym_key: GenericAesKey,
		versioned_recipient_public_keys: Versioned<PublicKeys>,
		sender_group_id: &GeneratedId,
	) -> Result<PubEncSymKey, AsymmetricCryptoError> {
		let recipient_public_key = AsymmetricCryptoFacade::extract_recipient_public_key(
			versioned_recipient_public_keys.object,
		)?;

		match recipient_public_key {
			AsymmetricPublicKey::RsaPublicKey(rsa_pub_key) => {
				let pub_enc_sym_key_bytes = RSAPublicKey::encrypt(
					&rsa_pub_key,
					&self.randomizer_facade,
					sym_key.as_bytes(),
				)?;
				Ok(PubEncSymKey {
					pub_enc_sym_key_bytes,
					crypto_protocol_version: CryptoProtocolVersion::Rsa,
					sender_key_version: None,
					recipient_key_version: versioned_recipient_public_keys.version,
				})
			},
			AsymmetricPublicKey::PqPublicKeys(pq_pub_keys) => {
				let sender_key_pair: Versioned<AsymmetricKeyPair> = self
					.key_loader_facade
					.load_current_key_pair(sender_group_id) // TODO implement load_current_key_pair
					.await?;
				let sender_ecc_key_pair = self
					.get_or_make_sender_identity_key_pair(sender_key_pair.object, sender_group_id)
					.await?;
				match sym_key {
					GenericAesKey::Aes128(_) => {
						Err(AsymmetricCryptoError::UnexpectedSymmetricKeyType(sym_key))
					},
					GenericAesKey::Aes256(aes256_sym_key) => Ok(self
						.tuta_crypt_encrypt_sym_key_impl(
							Versioned {
								object: pq_pub_keys,
								version: versioned_recipient_public_keys.version,
							},
							aes256_sym_key,
							Versioned {
								object: sender_ecc_key_pair,
								version: sender_key_pair.version,
							},
						)?),
				}
			},
		}
	}

	/**
	 * Encrypts the symKey asymmetrically with the provided public keys using the TutaCrypt protocol.
	 * @param symKey the key to be encrypted
	 * @param recipientPublicKeys MUST be a pq key pair
	 * @param senderEccKeyPair the sender's key pair (needed for authentication)
	 * @throws ProgrammingError if the recipientPublicKeys are not suitable for TutaCrypt
	 */
	pub async fn tuta_crypt_encrypt_sym_key(
		&self,
		sym_key: GenericAesKey,
		recipient_public_keys: Versioned<PublicKeys>,
		sender_ecc_key_pair: Versioned<EccKeyPair>,
	) -> Result<PubEncSymKey, AsymmetricCryptoError> {
		let recipient_public_key =
			AsymmetricCryptoFacade::extract_recipient_public_key(recipient_public_keys.object)?;
		match recipient_public_key {
			AsymmetricPublicKey::RsaPublicKey(_) => Err(
				AsymmetricCryptoError::UnexpectedPublicKeyPairType(recipient_public_key),
			),
			AsymmetricPublicKey::PqPublicKeys(pq_pub_keys) => match sym_key {
				GenericAesKey::Aes128(_) => {
					Err(AsymmetricCryptoError::UnexpectedSymmetricKeyType(sym_key))
				},
				GenericAesKey::Aes256(aes256_sym_key) => Ok(self.tuta_crypt_encrypt_sym_key_impl(
					Versioned {
						object: pq_pub_keys,
						version: recipient_public_keys.version,
					},
					aes256_sym_key,
					sender_ecc_key_pair,
				)?),
			},
		}
	}

	fn tuta_crypt_encrypt_sym_key_impl(
		&self,
		recipient_public_key: Versioned<TutaCryptPublicKeys>,
		sym_key: Aes256Key,
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

	/**
		* Returns the SenderIdentityKeyPair that is either already on the KeyPair that is being passed in,
		* or creates a new one and writes it to the respective Group.
		* @param senderKeyPair
		* @param keyGroupId Id for the Group that Public Key Service might write a new IdentityKeyPair for.
		* 						This is necessary as a User might send an E-Mail from a shared mailbox,
		* 						for which the KeyPair should be created.
		*/
	async fn get_or_make_sender_identity_key_pair(
		&self,
		sender_key_pair: AsymmetricKeyPair,
		key_group_id: &GeneratedId,
	) -> Result<EccKeyPair, AsymmetricCryptoError> {
		match sender_key_pair {
			AsymmetricKeyPair::PQKeyPairs(pq_pairs) => Ok(pq_pairs.ecc_keys),
			AsymmetricKeyPair::RSAEccKeyPair(rsa_ecc_pairs) => Ok(rsa_ecc_pairs.ecc_key_pair),
			AsymmetricKeyPair::RSAKeyPair(_rsa_pair) => {
				// there is no ecc key pair yet, so we have to generate and upload one
				let sym_group_key: VersionedAesKey = self
					.key_loader_facade
					.get_current_sym_group_key(key_group_id)
					.await?;
				let new_identity_key_pair = EccKeyPair::generate(&self.randomizer_facade);
				let sym_enc_priv_ecc_key = sym_group_key.object.encrypt_data(
					new_identity_key_pair.private_key.as_bytes(),
					Iv::generate(&self.randomizer_facade),
				)?;

				let data = PublicKeyPutIn {
					_format: 0,
					pubEccKey: new_identity_key_pair.public_key.as_bytes().to_vec(),
					symEncPrivEccKey: sym_enc_priv_ecc_key,
					keyGroup: key_group_id.to_owned(),
				};
				self.service_executor
					.put::<PublicKeyService>(data, ExtraServiceParams::default())
					.await?;
				Ok(new_identity_key_pair)
			},
		}
	}
}

// TODO tests
#[cfg(test)]
mod test {
	use crate::crypto::asymmetric_crypto_facade::AsymmetricCryptoFacade;
	use crate::crypto::ecc::EccKeyPair;
	use crate::entities::sys::PublicKeyGetOut;
	use crate::services::service_executor::MockResolvingServiceExecutor;
	use crate::services::sys::PublicKeyService;
	use std::sync::Arc;
	// let rsa: RsaImplementation
	// let pqFacade: PQFacade
	// let keyLoaderFacade: KeyLoaderFacade
	// let cryptoWrapper: CryptoWrapper
	// let serviceExecutor: IServiceExecutor
	//
	// let asymmetricCryptoFacade: AsymmetricCryptoFacade
	//
	// o.beforeEach(function () {
	// rsa = object()
	// pqFacade = object()
	// keyLoaderFacade = object()
	// cryptoWrapper = object()
	// serviceExecutor = object()
	// asymmetricCryptoFacade = new AsymmetricCryptoFacade(rsa, pqFacade, keyLoaderFacade, cryptoWrapper, serviceExecutor)
	// })
	//
	// o.spec("authenticateSender", function () {
	// let identifier: string
	// let identifierType: PublicKeyIdentifierType
	// let senderIdentityPubKey: Uint8Array
	// let senderKeyVersion: number
	// let keyData: PublicKeyGetIn
	//
	// o.beforeEach(() => {
	// identifier = object<string>()
	// identifierType = object<PublicKeyIdentifierType>()
	// senderIdentityPubKey = new Uint8Array([1, 2, 3])
	// senderKeyVersion = 0
	// keyData = createPublicKeyGetIn({
	// identifier,
	// identifierType,
	// version: senderKeyVersion.toString(),
	// })
	// })

	fn make_asymmetric_crypto_facade<T: Into<AsymmetricKeyPair> + Clone + Send + Sync + 'static>(
		randomizer_facade: RandomizerFacade,
		group_key: GenericAesKey,
		sender_key_version: i64,
		asymmetric_keypair: T,
		ServiceExecutor: service_executor,
	) -> CryptoFacade {
		let group_key = group_key.clone();

		let mut key_loader = MockKeyLoaderFacade::default();
		key_loader
			.expect_get_current_sym_group_key()
			.returning(move |_| {
				Ok(VersionedAesKey {
					version: sender_key_version,
					object: group_key.clone(),
				})
			})
			.once();
		key_loader
			.expect_load_key_pair()
			.returning(move |_, _| Ok(asymmetric_keypair.clone().into()))
			.once();

		AsymmetricCryptoFacade {
			key_loader_facade: Arc::new(key_loader),
			randomizer_facade,
			service_executor: Arc::new(service_executor),
		}
	}
	#[tokio::test]
	async fn should_return_TUTACRYPT_AUTHENTICATION_SUCCEEDED_if_the_key_matches() {
		let mut servive_executor = MockResolvingServiceExecutor::default();
		// when(serviceExecutor.get(PublicKeyService, keyData)).thenResolve({ pubEccKey: senderIdentityPubKey })
		let sender_identity_keys: EccKeyPair = EccKeyPair::generate(&randomizer_facade);

		servive_executor
			.expect_get::<PublicKeyService>()
			.with(eq(first_invocation), always())
			.returning(|_, _| {
				Ok(PublicKeyGetOut {
					_format: 0,
					pubEccKey: Some(sender_identity_keys.public_key.as_bytes().to_vec()),
					pubKeyVersion: 0 as i64,
					pubKyberKey: Some(vec![1, 2, 3]),
					pubRsaKey: Some(vec![1, 2, 3]),
				})
			});

		let randomizer_facade = make_thread_rng_facade();
		let constants = BucketKeyConstants::new(&randomizer_facade);
		let ephemeral_keys = EccKeyPair::generate(&randomizer_facade);
		let asymmetric_keypair = PQKeyPairs::generate(&randomizer_facade);

		let asymmetric_crypto_facade = make_asymmetric_crypto_facade(
			randomizer_facade.clone(),
			constants.group_key.clone(),
			constants.sender_key_version,
			asymmetric_keypair.clone(),
			servive_executor.clone(),
		);

		// const result = await asymmetricCryptoFacade.authenticateSender({ identifier, identifierType }, senderIdentityPubKey, senderKeyVersion)
		//
		// o(result).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
	}

	// o("should return TUTACRYPT_AUTHENTICATION_FAILED if sender does not have an ecc identity key in the requested version", async function () {
	// when(serviceExecutor.get(PublicKeyService, keyData)).thenResolve({ pubEccKey: null, pubRsaKey: new Uint8Array([4, 5, 6]), pubKyberKey: null })
	//
	// const result = await asymmetricCryptoFacade.authenticateSender({ identifier, identifierType }, senderIdentityPubKey, senderKeyVersion)
	//
	// o(result).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)
	// })
	//
	// o("should return TUTACRYPT_AUTHENTICATION_FAILED if the key does not match", async function () {
	// when(serviceExecutor.get(PublicKeyService, keyData)).thenResolve({ pubEccKey: new Uint8Array([4, 5, 6]) })
	//
	// const result = await asymmetricCryptoFacade.authenticateSender({ identifier, identifierType }, senderIdentityPubKey, senderKeyVersion)
	//
	// o(result).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)
	// })
	// })
	//
	// o.spec("decryptSymKeyWithKeyPairAndAuthenticate", function () {
	// o("should throw CryptoError if authentication fails", async function () {
	// const pubEncSymKey: Uint8Array = object()
	// const symKey = new Uint8Array([1, 2, 3, 4])
	// const keyPair = object<PQKeyPairs>()
	// keyPair.keyPairType = KeyPairType.TUTA_CRYPT
	//
	// const senderKeyVersion = "1"
	// const senderIdentifier = object<string>()
	// const senderIdentifierType = PublicKeyIdentifierType.GROUP_ID
	// const recipientIdentifier = object<string>()
	// const recipientIdentifierType = PublicKeyIdentifierType.MAIL_ADDRESS
	// const pubEncKeyData: PubEncKeyData = createTestEntity(PubEncKeyDataTypeRef, {
	// pubEncSymKey,
	// protocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
	// senderKeyVersion,
	// recipientIdentifier,
	// recipientIdentifierType,
	// })
	// when(pqFacade.decapsulateEncoded(pubEncSymKey, keyPair)).thenResolve({
	// decryptedSymKeyBytes: symKey,
	// senderIdentityPubKey: object(),
	// })
	// when(
	// serviceExecutor.get(
	// PublicKeyService,
	// createPublicKeyGetIn({
	// version: senderKeyVersion,
	// identifierType: senderIdentifierType,
	// identifier: senderIdentifier,
	// }),
	// ),
	// ).thenResolve({ pubEccKey: new Uint8Array([4, 5, 6]) })
	//
	// await assertThrows(CryptoError, () =>
	// asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(keyPair, pubEncKeyData, {
	// identifier: senderIdentifier,
	// identifierType: senderIdentifierType,
	// }),
	// )
	// })
	//
	// o("should not try authentication when protocol is not TutaCrypt", async function () {
	// const pubEncSymKey: Uint8Array = object()
	// const pubEncKeyData: PubEncKeyData = createTestEntity(PubEncKeyDataTypeRef, {
	// pubEncSymKey,
	// protocolVersion: CryptoProtocolVersion.RSA,
	// senderKeyVersion: null,
	// })
	//
	// const senderIdentifier = object<string>()
	// const senderIdentifierType = PublicKeyIdentifierType.GROUP_ID
	//
	// const symKey = new Uint8Array([1, 2, 3, 4])
	// when(rsa.decrypt(RSA_TEST_KEYPAIR.privateKey, pubEncSymKey)).thenResolve(symKey)
	//
	// const result = await asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(RSA_TEST_KEYPAIR, pubEncKeyData, {
	// identifier: senderIdentifier,
	// identifierType: senderIdentifierType,
	// })
	//
	// verify(serviceExecutor.get(PublicKeyService, matchers.anything()), { times: 0 })
	// o(result).deepEquals({ senderIdentityPubKey: null, decryptedAesKey: uint8ArrayToBitArray(symKey) })
	// })
	// })
	//
	// o.spec("decryptSymKeyWithKeyPair", function () {
	// o("should raise a CryptoError when the protocol version is unknown", async function () {
	// await assertThrows(CryptoError, async function () {
	// await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(object(), "unknown" as CryptoProtocolVersion, object())
	// })
	// })
	//
	// o("should call RSA decryption when the protocol version is set to RSA", async function () {
	// const pubEncSymKey: Uint8Array = object()
	//
	// when(rsa.decrypt(RSA_TEST_KEYPAIR.privateKey, pubEncSymKey)).thenResolve(new Uint8Array([1, 2, 3, 4]))
	//
	// await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(RSA_TEST_KEYPAIR, CryptoProtocolVersion.RSA, pubEncSymKey)
	//
	// verify(rsa.decrypt(RSA_TEST_KEYPAIR.privateKey, pubEncSymKey), { times: 1 })
	// })
	//
	// o("should raise a Crypto Error when trying to decypher a RSA that is not an RSA KeyPair", async function () {
	// const pubEncSymKey: Uint8Array = object()
	// const keyPair = object<PQKeyPairs>()
	// keyPair.keyPairType = KeyPairType.TUTA_CRYPT
	// await assertThrows(CryptoError, async function () {
	// await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keyPair, CryptoProtocolVersion.RSA, pubEncSymKey)
	// })
	// })
	//
	// o("should call tuta crypt decryption when the protocol version is set to TUTA_CRYPT", async function () {
	// const pubEncSymKey: Uint8Array = object()
	// const keyPair = object<PQKeyPairs>()
	// keyPair.keyPairType = KeyPairType.TUTA_CRYPT
	//
	// when(pqFacade.decapsulateEncoded(pubEncSymKey, keyPair)).thenResolve({
	// decryptedSymKeyBytes: new Uint8Array([1, 2, 3, 4]),
	// senderIdentityPubKey: object(),
	// })
	//
	// await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keyPair, CryptoProtocolVersion.TUTA_CRYPT, pubEncSymKey)
	//
	// verify(pqFacade.decapsulateEncoded(pubEncSymKey, keyPair), { times: 1 })
	// })
	//
	// o("should raise a Crypto Error when trying to decypher a TutaCrypt that is not an TutaCrypt KeyPair", async function () {
	// const pubEncSymKey: Uint8Array = object()
	// const keyPair = object<RsaKeyPair>()
	// keyPair.keyPairType = KeyPairType.RSA
	// await assertThrows(CryptoError, async function () {
	// await asymmetricCryptoFacade.decryptSymKeyWithKeyPair(keyPair, CryptoProtocolVersion.TUTA_CRYPT, pubEncSymKey)
	// })
	// })
	// })
	//
	// o.spec("encryptPubSymKey", function () {
	// const recipientKeyVersion = 1
	// const senderKeyVersion = 2
	// const senderGroupId = "senderGroupId"
	// let symKey: AesKey
	// let pubEncSymKeyBytes: Uint8Array
	// let recipientKyberPublicKey: KyberPublicKey
	// let senderPqKeyPair: Versioned<PQKeyPairs>
	// let ephemeralKeyPair: EccKeyPair
	//
	// o.beforeEach(function () {
	// recipientKyberPublicKey = object<KyberPublicKey>()
	// symKey = [1, 2, 3, 4]
	// pubEncSymKeyBytes = object<Uint8Array>()
	// senderPqKeyPair = {
	// object: { keyPairType: KeyPairType.TUTA_CRYPT, eccKeyPair: object(), kyberKeyPair: object() },
	// version: senderKeyVersion,
	// }
	// ephemeralKeyPair = object()
	// when(cryptoWrapper.generateEccKeyPair()).thenReturn(ephemeralKeyPair)
	// when(keyLoaderFacade.loadCurrentKeyPair(senderGroupId)).thenResolve(senderPqKeyPair)
	// })
	//
	// o("should raise a CryptoError when the key pair type is unknown", async function () {
	// await assertThrows(CryptoError, async function () {
	// await asymmetricCryptoFacade.asymEncryptSymKey(symKey, object(), senderGroupId)
	// })
	// })
	//
	// o("should encrypt the sym key with the recipient PQ public key", async function () {
	// const pubKyberKey = new Uint8Array([1, 2, 3, 4])
	// const eccPublicKey = new Uint8Array([5, 6, 7, 8])
	// const recipientPublicKeys: Versioned<PublicKeys> = {
	// object: {
	// pubKyberKey,
	// pubEccKey: eccPublicKey,
	// pubRsaKey: null,
	// },
	// version: recipientKeyVersion,
	// }
	// when(cryptoWrapper.bytesToKyberPublicKey(pubKyberKey)).thenReturn(recipientKyberPublicKey)
	// when(
	// pqFacade.encapsulateAndEncode(
	// senderPqKeyPair.object.eccKeyPair,
	// ephemeralKeyPair,
	// {
	// eccPublicKey,
	// kyberPublicKey: recipientKyberPublicKey,
	// keyPairType: KeyPairType.TUTA_CRYPT,
	// },
	// matchers.anything(),
	// ),
	// ).thenResolve(pubEncSymKeyBytes)
	//
	// const pubEncSymKey = await asymmetricCryptoFacade.asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId)
	//
	// o(pubEncSymKey).deepEquals({
	// pubEncSymKeyBytes,
	// recipientKeyVersion,
	// senderKeyVersion,
	// cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
	// })
	// })
	//
	// o(
	// "should encrypt the sym key with the recipient PQ public key and generate new sender ecc identity key pair (sender has only RSA key pair)",
	// async function () {
	// const newIdentityEccPair: EccKeyPair = { publicKey: object(), privateKey: object() }
	// when(cryptoWrapper.generateEccKeyPair()).thenReturn(newIdentityEccPair, ephemeralKeyPair)
	// const senderRsaKeyPair: Versioned<RsaKeyPair> = { object: RSA_TEST_KEYPAIR, version: senderKeyVersion }
	// when(keyLoaderFacade.loadCurrentKeyPair(senderGroupId)).thenResolve(senderRsaKeyPair)
	// const pubKyberKey = new Uint8Array([1, 2, 3, 4])
	// const eccPublicKey = new Uint8Array([5, 6, 7, 8])
	// const recipientPublicKeys: Versioned<PublicKeys> = {
	// object: {
	// pubKyberKey,
	// pubEccKey: eccPublicKey,
	// pubRsaKey: null,
	// },
	// version: recipientKeyVersion,
	// }
	// when(cryptoWrapper.bytesToKyberPublicKey(pubKyberKey)).thenReturn(recipientKyberPublicKey)
	// when(
	// pqFacade.encapsulateAndEncode(
	// newIdentityEccPair,
	// ephemeralKeyPair,
	// {
	// eccPublicKey,
	// kyberPublicKey: recipientKyberPublicKey,
	// keyPairType: KeyPairType.TUTA_CRYPT,
	// },
	// matchers.anything(),
	// ),
	// ).thenResolve(pubEncSymKeyBytes)
	// const senderUserGroupKey = object<AesKey>()
	// when(keyLoaderFacade.getCurrentSymGroupKey(senderGroupId)).thenResolve({ object: senderUserGroupKey, version: senderKeyVersion })
	// const encryptedEccSenderPrivateKey = object<Uint8Array>()
	// when(cryptoWrapper.encryptEccKey(senderUserGroupKey, newIdentityEccPair.privateKey)).thenReturn(encryptedEccSenderPrivateKey)
	//
	// const pubEncSymKey = await asymmetricCryptoFacade.asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId)
	//
	// o(pubEncSymKey).deepEquals({
	// pubEncSymKeyBytes,
	// recipientKeyVersion,
	// senderKeyVersion,
	// cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
	// })
	// verify(
	// serviceExecutor.put(
	// PublicKeyService,
	// matchers.argThat((arg: PublicKeyPutIn) => {
	// return (
	// arg.pubEccKey === newIdentityEccPair.publicKey &&
	// arg.symEncPrivEccKey === encryptedEccSenderPrivateKey &&
	// arg.keyGroup === senderGroupId
	// )
	// }),
	// ),
	// )
	// },
	// )
	//
	// o("should encrypt the sym key with the recipient RSA public key", async function () {
	// const recipientPublicKeys: Versioned<PublicKeys> = {
	// object: {
	// pubKyberKey: null,
	// pubEccKey: null,
	// pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
	// },
	// version: recipientKeyVersion,
	// }
	//
	// when(
	// rsa.encrypt(
	// matchers.argThat((arg) => arg.keyPairType === KeyPairType.RSA),
	// bitArrayToUint8Array(symKey),
	// ),
	// ).thenResolve(pubEncSymKeyBytes)
	//
	// const pubEncSymKey = await asymmetricCryptoFacade.asymEncryptSymKey(symKey, recipientPublicKeys, senderGroupId)
	//
	// o(pubEncSymKey).deepEquals({
	// pubEncSymKeyBytes,
	// recipientKeyVersion,
	// senderKeyVersion: null,
	// cryptoProtocolVersion: CryptoProtocolVersion.RSA,
	// })
	// })
	//
	// o("raise a ProgrammingError when passing an RSA public key", async function () {
	// await assertThrows(ProgrammingError, async function () {
	// await asymmetricCryptoFacade.tutaCryptEncryptSymKey(
	// object(),
	// {
	// object: {
	// pubKyberKey: null,
	// pubEccKey: null,
	// pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
	// },
	// version: 2,
	// },
	// object(),
	// )
	// })
	// })
}
