import { assertWorkerOrNode } from "../../common/Env"
import {
	AesKey,
	AsymmetricKeyPair,
	bitArrayToUint8Array,
	isPqKeyPairs,
	isRsaOrRsaX25519KeyPair,
	isRsaX25519KeyPair,
	isVersionedPqPublicKey,
	isVersionedRsaOrRsaX25519PublicKey,
	isVersionedRsaX25519PublicKey,
	PQPublicKeys,
	PublicKey,
	RsaPrivateKey,
	uint8ArrayToBitArray,
	X25519KeyPair,
	X25519PublicKey,
} from "@tutao/tutanota-crypto"
import type { RsaImplementation } from "./RsaImplementation"
import { PQFacade } from "../facades/PQFacade.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import {
	asCryptoProtoocolVersion,
	CryptoProtocolVersion,
	EncryptionAuthStatus,
	EncryptionKeyVerificationState,
	PresentableKeyVerificationState,
} from "../../common/TutanotaConstants.js"
import { arrayEquals, assertNotNull, KeyVersion, lazy, Versioned } from "@tutao/tutanota-utils"
import { KeyLoaderFacade, parseKeyVersion } from "../facades/KeyLoaderFacade.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { createPublicKeyPutIn, PubEncKeyData } from "../../entities/sys/TypeRefs.js"
import { CryptoWrapper } from "./CryptoWrapper.js"
import { PublicKeyService } from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { PublicEncryptionKeyProvider, PublicKeyIdentifier } from "../facades/PublicEncryptionKeyProvider.js"
import { TypeId } from "../../common/EntityTypes"
import { Category, syncMetrics } from "../utils/SyncMetrics"
import { KeyVerificationMismatchError } from "../../common/error/KeyVerificationMismatchError"
import { AdminKeyLoaderFacade } from "../facades/AdminKeyLoaderFacade"

assertWorkerOrNode()

export type DecapsulatedAesKey = {
	decryptedAesKey: AesKey
	senderIdentityPubKey: X25519PublicKey | null // for authentication: null for rsa only
}

export type PubEncSymKey = {
	pubEncSymKeyBytes: Uint8Array
	cryptoProtocolVersion: CryptoProtocolVersion
	senderKeyVersion: KeyVersion | null
	recipientKeyVersion: KeyVersion
}

export type AuthenticateSenderReturnType = {
	authStatus: EncryptionAuthStatus
	verificationState: PresentableKeyVerificationState
}

/**
 * This class is responsible for asymmetric encryption and decryption.
 * It tries to hide the complexity behind handling different asymmetric protocol versions such as RSA and TutaCrypt.
 */
export class AsymmetricCryptoFacade {
	constructor(
		private readonly rsa: RsaImplementation,
		private readonly pqFacade: PQFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly publicKeyProvider: PublicEncryptionKeyProvider,
		private readonly adminKeyLoaderFacade: lazy<AdminKeyLoaderFacade>,
	) {}

	getSenderEccKey(publicKey: Versioned<PublicKey>): X25519PublicKey | null {
		if (isVersionedPqPublicKey(publicKey)) {
			return publicKey.object.x25519PublicKey
		} else if (isVersionedRsaX25519PublicKey(publicKey)) {
			return publicKey.object.publicEccKey
		} else {
			return null
		}
	}

	/**
	 * Verifies whether the key returned by the public key service and the pinned one are the same as the one used for encryption.
	 *
	 * @param identifier the identifier to load the public key to verify that it matches the one used in the protocol run.
	 * @param senderIdentityPubKey the senderIdentityPubKey that was used to encrypt/authenticate the data.
	 * @param senderKeyVersion the version of the senderIdentityPubKey.
	 */

	async authenticateSender(
		identifier: PublicKeyIdentifier,
		senderIdentityPubKey: Uint8Array,
		senderKeyVersion: KeyVersion,
	): Promise<AuthenticateSenderReturnType> {
		let authenticated = false

		try {
			const publicKey = await this.publicKeyProvider.loadPublicEncryptionKey(identifier, senderKeyVersion)
			const publicEccKey = this.getSenderEccKey(publicKey.publicEncryptionKey)
			if (publicEccKey != null && arrayEquals(publicEccKey, senderIdentityPubKey)) {
				authenticated = true

				if (publicKey.verificationState === EncryptionKeyVerificationState.VERIFIED_MANUAL) {
					return {
						authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
						verificationState: PresentableKeyVerificationState.SECURE,
					}
				}
			}
		} catch (e) {
			if (e instanceof KeyVerificationMismatchError) {
				console.log(`KeyVerificationMismatchError. identifier: ${identifier}, senderKeyVersion: ${senderKeyVersion}`)
				authenticated = false
			} else {
				console.log(`Error while authenticating sender. identifier: ${identifier}, senderKeyVersion: ${senderKeyVersion}, error: ${e}`)
				throw e
			}
		}
		if (authenticated) {
			return {
				authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
				verificationState: PresentableKeyVerificationState.NONE,
			}
		} else {
			return {
				authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED,
				verificationState: PresentableKeyVerificationState.ALERT,
			}
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
	async decryptSymKeyWithKeyPairAndAuthenticate(
		recipientKeyPair: AsymmetricKeyPair,
		pubEncKeyData: PubEncKeyData,
		senderIdentifier: PublicKeyIdentifier,
	): Promise<DecapsulatedAesKey> {
		const cryptoProtocolVersion = asCryptoProtoocolVersion(pubEncKeyData.protocolVersion)
		const decapsulatedAesKey = await this.decryptSymKeyWithKeyPair(recipientKeyPair, cryptoProtocolVersion, pubEncKeyData.pubEncSymKey)
		if (cryptoProtocolVersion === CryptoProtocolVersion.TUTA_CRYPT) {
			const { authStatus } = await this.authenticateSender(
				senderIdentifier,
				assertNotNull(decapsulatedAesKey.senderIdentityPubKey),
				parseKeyVersion(assertNotNull(pubEncKeyData.senderKeyVersion)),
			)
			if (authStatus !== EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED) {
				throw new CryptoError("the provided public key could not be authenticated")
			}
		}
		return decapsulatedAesKey
	}

	/**
	 * Decrypts the pubEncSymKey with the recipientKeyPair.
	 * @param pubEncSymKey the asymmetrically encrypted session key
	 * @param cryptoProtocolVersion asymmetric protocol to decrypt pubEncSymKey (RSA or TutaCrypt)
	 * @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion.
	 */
	async decryptSymKeyWithKeyPair(
		recipientKeyPair: AsymmetricKeyPair,
		cryptoProtocolVersion: CryptoProtocolVersion,
		pubEncSymKey: Uint8Array,
	): Promise<DecapsulatedAesKey> {
		switch (cryptoProtocolVersion) {
			case CryptoProtocolVersion.RSA: {
				if (!isRsaOrRsaX25519KeyPair(recipientKeyPair)) {
					throw new CryptoError("wrong key type. expected rsa. got " + recipientKeyPair.keyPairType)
				}
				const privateKey: RsaPrivateKey = recipientKeyPair.privateKey
				const decryptedSymKey = await this.rsa.decrypt(privateKey, pubEncSymKey)
				return {
					decryptedAesKey: uint8ArrayToBitArray(decryptedSymKey),
					senderIdentityPubKey: null,
				}
			}
			case CryptoProtocolVersion.TUTA_CRYPT: {
				if (!isPqKeyPairs(recipientKeyPair)) {
					throw new CryptoError("wrong key type. expected TutaCrypt. got " + recipientKeyPair.keyPairType)
				}
				const { decryptedSymKeyBytes, senderIdentityPubKey } = await this.pqFacade.decapsulateEncoded(pubEncSymKey, recipientKeyPair)
				return {
					decryptedAesKey: uint8ArrayToBitArray(decryptedSymKeyBytes),
					senderIdentityPubKey,
				}
			}
			default:
				throw new CryptoError("invalid cryptoProtocolVersion: " + cryptoProtocolVersion)
		}
	}

	/**
	 * Loads the recipient key pair in the required version and decrypts the pubEncSymKey with it.
	 */
	async loadKeyPairAndDecryptSymKey(
		recipientKeyPairGroupId: Id,
		recipientKeyVersion: KeyVersion,
		cryptoProtocolVersion: CryptoProtocolVersion,
		pubEncSymKey: Uint8Array,
		forTypeId: TypeId = -1,
	): Promise<DecapsulatedAesKey> {
		const tm = syncMetrics?.beginMeasurement(Category.Decrypt)
		try {
			const keyPair: AsymmetricKeyPair = await this.keyLoaderFacade.loadKeypair(recipientKeyPairGroupId, recipientKeyVersion, forTypeId)
			return await this.decryptSymKeyWithKeyPair(keyPair, cryptoProtocolVersion, pubEncSymKey)
		} finally {
			tm?.endMeasurement()
		}
	}

	/**
	 * Encrypts the symKey asymmetrically with the provided public keys.
	 * @param symKey the symmetric key  to be encrypted
	 * @param recipientPublicKey the public key(s) of the recipient in the current version
	 * @param senderGroupId the group id of the sender. will only be used in case we also need the sender's key pair, e.g. with TutaCrypt.
	 */
	async asymEncryptSymKey(symKey: AesKey, recipientPublicKey: Versioned<PublicKey>, senderGroupId: Id): Promise<PubEncSymKey> {
		if (isVersionedPqPublicKey(recipientPublicKey)) {
			const senderKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(senderGroupId)
			const senderEccKeyPair = await this.getOrMakeSenderX25519KeyPair(senderKeyPair.object, senderGroupId)
			return this.tutaCryptEncryptSymKeyImpl(recipientPublicKey, symKey, {
				object: senderEccKeyPair,
				version: senderKeyPair.version,
			})
		} else if (isVersionedRsaOrRsaX25519PublicKey(recipientPublicKey)) {
			const pubEncSymKeyBytes = await this.rsa.encrypt(recipientPublicKey.object, bitArrayToUint8Array(symKey))
			return {
				pubEncSymKeyBytes,
				cryptoProtocolVersion: CryptoProtocolVersion.RSA,
				senderKeyVersion: null,
				recipientKeyVersion: recipientPublicKey.version,
			}
		}
		throw new CryptoError("unknown public key type: " + recipientPublicKey.object.keyPairType)
	}

	/**
	 * Encrypts the symKey asymmetrically with the provided public keys using the TutaCrypt protocol.
	 * @param symKey the key to be encrypted
	 * @param recipientPublicKey MUST be a pq key pair
	 * @param senderEccKeyPair the sender's key pair (needed for authentication)
	 * @throws ProgrammingError if the recipientPublicKeys are not suitable for TutaCrypt
	 */
	async tutaCryptEncryptSymKey(symKey: AesKey, recipientPublicKey: Versioned<PublicKey>, senderEccKeyPair: Versioned<X25519KeyPair>): Promise<PubEncSymKey> {
		if (!isVersionedPqPublicKey(recipientPublicKey)) {
			throw new ProgrammingError("the recipient does not have pq key pairs")
		}
		return this.tutaCryptEncryptSymKeyImpl(recipientPublicKey, symKey, senderEccKeyPair)
	}

	private async tutaCryptEncryptSymKeyImpl(
		recipientPublicKey: Versioned<PQPublicKeys>,
		symKey: AesKey,
		senderEccKeyPair: Versioned<X25519KeyPair>,
	): Promise<PubEncSymKey> {
		const ephemeralKeyPair = this.cryptoWrapper.generateEccKeyPair()
		const pubEncSymKeyBytes = await this.pqFacade.encapsulateAndEncode(
			senderEccKeyPair.object,
			ephemeralKeyPair,
			recipientPublicKey.object,
			bitArrayToUint8Array(symKey),
		)
		const senderKeyVersion = senderEccKeyPair.version
		return {
			pubEncSymKeyBytes,
			cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
			senderKeyVersion,
			recipientKeyVersion: recipientPublicKey.version,
		}
	}

	/**
	 * Returns the SenderIdentityKeyPair that is either already on the KeyPair that is being passed in,
	 * or creates a new one and writes it to the respective Group.
	 * @param senderKeyPair
	 * @param keyGroupId Id for the Group that Public Key Service might write a new IdentityKeyPair for.
	 *                        This is necessary as a User might send an E-Mail from a shared mailbox,
	 *                        for which the KeyPair should be created.
	 */
	async getOrMakeSenderX25519KeyPair(senderKeyPair: AsymmetricKeyPair, keyGroupId: Id): Promise<X25519KeyPair> {
		const algo = senderKeyPair.keyPairType
		if (isPqKeyPairs(senderKeyPair)) {
			return senderKeyPair.x25519KeyPair
		} else if (isRsaX25519KeyPair(senderKeyPair)) {
			return { publicKey: senderKeyPair.publicEccKey, privateKey: senderKeyPair.privateEccKey }
		} else if (isRsaOrRsaX25519KeyPair(senderKeyPair)) {
			// there is no ecc key pair yet, so we have to generate and upload one
			return this.createNewX25519KeyPair(keyGroupId)
		} else {
			throw new CryptoError("unknown key pair type: " + algo)
		}
	}

	private async createNewX25519KeyPair(keyGroupId: string): Promise<X25519KeyPair> {
		// If the group is a team group, it may be the case that the admin is not a member of it, so we try to get via
		// admin key. This works for non-admins too because internally the method tries to get via membership first anyway.
		const symGroupKey = await this.adminKeyLoaderFacade().getCurrentGroupKeyViaAdminEncGKey(keyGroupId)
		const newX25519KeyPair = this.cryptoWrapper.generateEccKeyPair()
		const symEncPrivEccKey = this.cryptoWrapper.encryptX25519Key(symGroupKey.object, newX25519KeyPair.privateKey)
		const data = createPublicKeyPutIn({
			pubEccKey: newX25519KeyPair.publicKey,
			symEncPrivEccKey,
			keyGroup: keyGroupId,
		})
		await this.serviceExecutor.put(PublicKeyService, data)
		return newX25519KeyPair
	}
}
