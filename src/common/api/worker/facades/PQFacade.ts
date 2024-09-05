import { KyberFacade } from "./KyberFacade.js"
import {
	Aes256Key,
	aesEncrypt,
	authenticatedAesDecrypt,
	eccDecapsulate,
	eccEncapsulate,
	EccKeyPair,
	EccPublicKey,
	EccSharedSecrets,
	generateEccKeyPair,
	hkdf,
	KEY_LENGTH_BYTES_AES_256,
	KeyPairType,
	kyberPublicKeyToBytes,
	PQKeyPairs,
	pqKeyPairsToPublicKeys,
	PQPublicKeys,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import { concat, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { decodePQMessage, encodePQMessage, PQMessage } from "./PQMessage.js"
import { CryptoProtocolVersion } from "../../common/TutanotaConstants.js"

export type DecapsulatedSymKey = {
	senderIdentityPubKey: EccPublicKey
	decryptedSymKeyBytes: Uint8Array
}

export class PQFacade {
	constructor(private readonly kyberFacade: KyberFacade) {}

	public async generateKeyPairs(): Promise<PQKeyPairs> {
		return {
			keyPairType: KeyPairType.TUTA_CRYPT,
			eccKeyPair: generateEccKeyPair(),
			kyberKeyPair: await this.kyberFacade.generateKeypair(),
		}
	}

	public async encapsulateAndEncode(
		senderIdentityKeyPair: EccKeyPair,
		ephemeralKeyPair: EccKeyPair,
		recipientPublicKeys: PQPublicKeys,
		bucketKey: Uint8Array,
	): Promise<Uint8Array> {
		const encapsulated = await this.encapsulate(senderIdentityKeyPair, ephemeralKeyPair, recipientPublicKeys, bucketKey)
		return encodePQMessage(encapsulated)
	}

	/**
	 * @VisibleForTesting
	 */
	async encapsulate(
		senderIdentityKeyPair: EccKeyPair,
		ephemeralKeyPair: EccKeyPair,
		recipientPublicKeys: PQPublicKeys,
		bucketKey: Uint8Array,
	): Promise<PQMessage> {
		const eccSharedSecret = eccEncapsulate(senderIdentityKeyPair.privateKey, ephemeralKeyPair.privateKey, recipientPublicKeys.eccPublicKey)
		const kyberEncapsulation = await this.kyberFacade.encapsulate(recipientPublicKeys.kyberPublicKey)
		const kyberCipherText = kyberEncapsulation.ciphertext

		const kek = this.derivePQKEK(
			senderIdentityKeyPair.publicKey,
			ephemeralKeyPair.publicKey,
			recipientPublicKeys,
			kyberCipherText,
			kyberEncapsulation.sharedSecret,
			eccSharedSecret,
			CryptoProtocolVersion.TUTA_CRYPT,
		)

		const kekEncBucketKey = aesEncrypt(kek, bucketKey)
		return {
			senderIdentityPubKey: senderIdentityKeyPair.publicKey,
			ephemeralPubKey: ephemeralKeyPair.publicKey,
			encapsulation: {
				kyberCipherText,
				kekEncBucketKey: kekEncBucketKey,
			},
		}
	}

	public async decapsulateEncoded(encodedPQMessage: Uint8Array, recipientKeys: PQKeyPairs): Promise<DecapsulatedSymKey> {
		const decoded = decodePQMessage(encodedPQMessage)
		return { decryptedSymKeyBytes: await this.decapsulate(decoded, recipientKeys), senderIdentityPubKey: decoded.senderIdentityPubKey }
	}

	/**
	 * @VisibleForTesting
	 */
	async decapsulate(message: PQMessage, recipientKeys: PQKeyPairs): Promise<Uint8Array> {
		const kyberCipherText = message.encapsulation.kyberCipherText
		const eccSharedSecret = eccDecapsulate(message.senderIdentityPubKey, message.ephemeralPubKey, recipientKeys.eccKeyPair.privateKey)
		const kyberSharedSecret = await this.kyberFacade.decapsulate(recipientKeys.kyberKeyPair.privateKey, kyberCipherText)

		const kek = this.derivePQKEK(
			message.senderIdentityPubKey,
			message.ephemeralPubKey,
			pqKeyPairsToPublicKeys(recipientKeys),
			kyberCipherText,
			kyberSharedSecret,
			eccSharedSecret,
			CryptoProtocolVersion.TUTA_CRYPT,
		)

		return authenticatedAesDecrypt(kek, message.encapsulation.kekEncBucketKey)
	}

	private derivePQKEK(
		senderIdentityPublicKey: EccPublicKey,
		ephemeralPublicKey: EccPublicKey,
		recipientPublicKeys: PQPublicKeys,
		kyberCipherText: Uint8Array,
		kyberSharedSecret: Uint8Array,
		eccSharedSecret: EccSharedSecrets,
		cryptoProtocolVersion: CryptoProtocolVersion,
	): Aes256Key {
		var context = concat(
			senderIdentityPublicKey,
			ephemeralPublicKey,
			recipientPublicKeys.eccPublicKey,
			kyberPublicKeyToBytes(recipientPublicKeys.kyberPublicKey),
			kyberCipherText,
			new Uint8Array([Number(cryptoProtocolVersion)]),
		)

		var inputKeyMaterial = concat(eccSharedSecret.ephemeralSharedSecret, eccSharedSecret.authSharedSecret, kyberSharedSecret)

		const kekBytes = hkdf(context, inputKeyMaterial, stringToUtf8Uint8Array("kek"), KEY_LENGTH_BYTES_AES_256)
		return uint8ArrayToKey(kekBytes)
	}
}
