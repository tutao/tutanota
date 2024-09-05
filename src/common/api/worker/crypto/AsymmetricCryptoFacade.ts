import { assertWorkerOrNode } from "../../common/Env"
import {
	AesKey,
	AsymmetricKeyPair,
	AsymmetricPublicKey,
	bitArrayToUint8Array,
	EccKeyPair,
	EccPublicKey,
	hexToRsaPublicKey,
	isPqKeyPairs,
	isPqPublicKey,
	isRsaEccKeyPair,
	isRsaOrRsaEccKeyPair,
	isRsaPublicKey,
	KeyPairType,
	PQPublicKeys,
	RsaPrivateKey,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import type { RsaImplementation } from "./RsaImplementation"
import { PQFacade } from "../facades/PQFacade.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { CryptoProtocolVersion } from "../../common/TutanotaConstants.js"
import { uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { PubEncSymKey, PublicKeys } from "./CryptoFacade.js"
import { KeyLoaderFacade } from "../facades/KeyLoaderFacade.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { createPublicKeyPutIn, type PublicKeyGetOut } from "../../entities/sys/TypeRefs.js"
import { CryptoWrapper } from "./CryptoWrapper.js"
import { PublicKeyService } from "../../entities/sys/Services.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"

assertWorkerOrNode()

export type DecapsulatedAesKey = {
	decryptedAesKey: AesKey
	senderIdentityPubKey: EccPublicKey | null // null for rsa only
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
	) {}

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
				if (!isRsaOrRsaEccKeyPair(recipientKeyPair)) {
					throw new CryptoError("wrong key type. expecte rsa. got " + recipientKeyPair.keyPairType)
				}
				const privateKey: RsaPrivateKey = recipientKeyPair.privateKey
				const decryptedBucketKey = await this.rsa.decrypt(privateKey, pubEncSymKey)
				return {
					decryptedAesKey: uint8ArrayToBitArray(decryptedBucketKey),
					senderIdentityPubKey: null,
				}
			}
			case CryptoProtocolVersion.TUTA_CRYPT: {
				if (!isPqKeyPairs(recipientKeyPair)) {
					throw new CryptoError("wrong key type. expected tuta-crypt. got " + recipientKeyPair.keyPairType)
				}
				const decryptedSymKey = await this.pqFacade.decapsulateEncoded(pubEncSymKey, recipientKeyPair)
				return {
					decryptedAesKey: uint8ArrayToBitArray(decryptedSymKey.decryptedSymKeyBytes),
					senderIdentityPubKey: decryptedSymKey.senderIdentityPubKey,
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
		recipientKeyVersion: number,
		cryptoProtocolVersion: CryptoProtocolVersion,
		pubEncSymKey: Uint8Array,
	): Promise<DecapsulatedAesKey> {
		const keyPair: AsymmetricKeyPair = await this.keyLoaderFacade.loadKeypair(recipientKeyPairGroupId, recipientKeyVersion)
		return await this.decryptSymKeyWithKeyPair(keyPair, cryptoProtocolVersion, pubEncSymKey)
	}

	async encryptPubSymKey(symKey: AesKey, recipientPublicKeys: Versioned<PublicKeys>, senderGroupId: Id): Promise<PubEncSymKey> {
		const recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object)
		const keyPairType = recipientPublicKey.keyPairType

		if (isPqPublicKey(recipientPublicKey)) {
			const senderKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(senderGroupId)
			const senderEccKeyPair = await this.getOrMakeSenderIdentityKeyPair(senderKeyPair.object, senderGroupId)
			return this.pqEncryptPubSymKeyImpl({ object: recipientPublicKey, version: recipientPublicKeys.version }, symKey, {
				object: senderEccKeyPair,
				version: senderKeyPair.version,
			})
		} else if (isRsaPublicKey(recipientPublicKey)) {
			const pubEncSymKeyBytes = await this.rsa.encrypt(recipientPublicKey, bitArrayToUint8Array(symKey))
			return {
				pubEncSymKeyBytes,
				cryptoProtocolVersion: CryptoProtocolVersion.RSA,
				senderKeyVersion: null,
				recipientKeyVersion: recipientPublicKeys.version,
			}
		}
		throw new CryptoError("unknown public key type: " + keyPairType)
	}

	/**
	 *
	 * @param symKey the key to be encrypted
	 * @param recipientPublicKeys MUST be a pq key pair
	 * @param senderEccKeyPair the sender's key pair (needed for authentication)
	 */
	async pqEncryptPubSymKey(symKey: AesKey, recipientPublicKeys: Versioned<PublicKeys>, senderEccKeyPair: Versioned<EccKeyPair>): Promise<PubEncSymKey> {
		const recipientPublicKey = this.extractRecipientPublicKey(recipientPublicKeys.object)
		if (!isPqPublicKey(recipientPublicKey)) {
			throw new ProgrammingError("the recipient does not have pq key pairs")
		}
		return this.pqEncryptPubSymKeyImpl(
			{
				object: recipientPublicKey,
				version: recipientPublicKeys.version,
			},
			symKey,
			senderEccKeyPair,
		)
	}

	private async pqEncryptPubSymKeyImpl(
		recipientPublicKey: Versioned<PQPublicKeys>,
		symKey: AesKey,
		senderEccKeyPair: Versioned<EccKeyPair>,
	): Promise<PubEncSymKey> {
		const ephemeralKeyPair = this.cryptoWrapper.generateEccKeyPair()
		const pubEncSymKeyBytes = await this.pqFacade.encapsulateAndEncode(
			senderEccKeyPair.object,
			ephemeralKeyPair,
			recipientPublicKey.object,
			bitArrayToUint8Array(symKey),
		)
		const senderKeyVersion = senderEccKeyPair.version
		return { pubEncSymKeyBytes, cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT, senderKeyVersion, recipientKeyVersion: recipientPublicKey.version }
	}

	private extractRecipientPublicKey(publicKeys: PublicKeys): AsymmetricPublicKey {
		if (publicKeys.pubRsaKey) {
			// we ignore ecc keys as this is only used for the recipient keys
			return hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey))
		} else if (publicKeys.pubKyberKey && publicKeys.pubEccKey) {
			const eccPublicKey = publicKeys.pubEccKey
			const kyberPublicKey = this.cryptoWrapper.bytesToKyberPublicKey(publicKeys.pubKyberKey)
			return {
				keyPairType: KeyPairType.TUTA_CRYPT,
				eccPublicKey,
				kyberPublicKey,
			}
		} else {
			throw new Error("Inconsistent Keypair")
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
	private async getOrMakeSenderIdentityKeyPair(senderKeyPair: AsymmetricKeyPair, keyGroupId: Id): Promise<EccKeyPair> {
		const algo = senderKeyPair.keyPairType
		if (isPqKeyPairs(senderKeyPair)) {
			return senderKeyPair.eccKeyPair
		} else if (isRsaEccKeyPair(senderKeyPair)) {
			return { publicKey: senderKeyPair.publicEccKey, privateKey: senderKeyPair.privateEccKey }
		} else if (isRsaOrRsaEccKeyPair(senderKeyPair)) {
			// there is no ecc key pair yet, so we have to genrate and upload one
			const symGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(keyGroupId)
			const newIdentityKeyPair = this.cryptoWrapper.generateEccKeyPair()
			const symEncPrivEccKey = this.cryptoWrapper.encryptEccKey(symGroupKey.object, newIdentityKeyPair.privateKey)
			const data = createPublicKeyPutIn({ pubEccKey: newIdentityKeyPair.publicKey, symEncPrivEccKey, keyGroup: keyGroupId })
			await this.serviceExecutor.put(PublicKeyService, data)
			return newIdentityKeyPair
		} else {
			throw new CryptoError("unknow key pair type: " + algo)
		}
	}
}

export function convertToVersionedPublicKeys(publicKeyGetOut: PublicKeyGetOut): Versioned<PublicKeys> {
	return {
		object: {
			pubRsaKey: publicKeyGetOut.pubRsaKey,
			pubKyberKey: publicKeyGetOut.pubKyberKey,
			pubEccKey: publicKeyGetOut.pubEccKey,
		},
		version: Number(publicKeyGetOut.pubKeyVersion),
	}
}
