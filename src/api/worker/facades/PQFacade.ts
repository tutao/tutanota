import { KyberFacade } from "./KyberFacade.js"
import {
	Aes256Key,
	aesDecrypt,
	aesEncrypt,
	eccDecapsulate,
	eccEncapsulate,
	EccKeyPair,
	EccPublicKey,
	EccSharedSecrets,
	generateEccKeyPair,
	kyberPublicKeyToBytes,
	PQKeyPairs,
	PQPublicKeys,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import { concat, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto/dist/encryption/Aes.js"
import { PQMessage, PQMESSAGE_VERSION } from "./PQMessage.js"
import { hkdf } from "@tutao/tutanota-crypto/dist/hashes/HKDF.js"

export class PQFacade {
	private kyberFacade: KyberFacade

	constructor(kyberFacade: KyberFacade) {
		this.kyberFacade = kyberFacade
	}

	public async generateKeyPairs(): Promise<PQKeyPairs> {
		return new PQKeyPairs(generateEccKeyPair(), await this.kyberFacade.generateKeypair())
	}

	public async encapsulate(
		senderIdentityKeyPair: EccKeyPair,
		ephemeralKeyPair: EccKeyPair,
		recipientPublicKeys: PQPublicKeys,
		bucketKey: Uint8Array,
	): Promise<PQMessage> {
		const eccSharedSecret = eccEncapsulate(senderIdentityKeyPair.privateKey, ephemeralKeyPair.privateKey, recipientPublicKeys.eccPublicKey)
		const kyberEncapsulation = await this.kyberFacade.encapsulate(recipientPublicKeys.kyberPublicKey)
		const kyberCipherText = kyberEncapsulation.ciphertext
		const version = PQMESSAGE_VERSION

		const kek = this.derivePQKEK(
			senderIdentityKeyPair.publicKey,
			ephemeralKeyPair.publicKey,
			recipientPublicKeys,
			kyberCipherText,
			kyberEncapsulation.sharedSecret,
			eccSharedSecret,
			version,
		)

		const kekEncBucketKey = aesEncrypt(kek, bucketKey)
		return {
			version,
			senderIdentityPubKey: senderIdentityKeyPair.publicKey,
			ephemeralPubKey: ephemeralKeyPair.publicKey,
			encapsulation: {
				kyberCipherText,
				kekEncBucketKey: kekEncBucketKey,
			},
		}
	}

	public async decapsulate(message: PQMessage, recipientKeys: PQKeyPairs): Promise<Uint8Array> {
		const kyberCipherText = message.encapsulation.kyberCipherText
		const eccSharedSecret = eccDecapsulate(message.senderIdentityPubKey, message.ephemeralPubKey, recipientKeys.eccKeyPair.privateKey)
		const kyberSharedSecret = await this.kyberFacade.decapsulate(recipientKeys.kyberKeyPair.privateKey, kyberCipherText)

		const kek = this.derivePQKEK(
			message.senderIdentityPubKey,
			message.ephemeralPubKey,
			recipientKeys.toPublicKeys(),
			kyberCipherText,
			kyberSharedSecret,
			eccSharedSecret,
			message.version,
		)

		return aesDecrypt(kek, message.encapsulation.kekEncBucketKey)
	}

	private derivePQKEK(
		senderIdentityPublicKey: EccPublicKey,
		ephemeralPublicKey: EccPublicKey,
		recipientPublicKeys: PQPublicKeys,
		kyberCipherText: Uint8Array,
		kyberSharedSecret: Uint8Array,
		eccSharedSecret: EccSharedSecrets,
		pqMessageVersion: number,
	): Aes256Key {
		var context = concat(
			senderIdentityPublicKey,
			ephemeralPublicKey,
			recipientPublicKeys.eccPublicKey,
			kyberPublicKeyToBytes(recipientPublicKeys.kyberPublicKey),
			kyberCipherText,
			new Uint8Array([pqMessageVersion]),
		)

		var inputKeyMaterial = concat(eccSharedSecret.ephemeralSharedSecret, eccSharedSecret.authSharedSecret, kyberSharedSecret)

		const kekBytes = hkdf(context, inputKeyMaterial, stringToUtf8Uint8Array("kek"), KEY_LENGTH_BYTES_AES_256)
		return uint8ArrayToKey(kekBytes)
	}
}
