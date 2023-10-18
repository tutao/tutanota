import { KyberFacade } from "./KyberFacade.js"
import {
	Aes256Key,
	aesDecrypt,
	aesEncrypt,
	KyberPublicKey,
	kyberPublicKeyToHex,
	PQKeyPairs,
	PQPublicKeys,
	uint8ArrayToKey,
	x25519decapsulate,
	x25519encapsulate,
	x25519generateKeyPair,
	X25519KeyPair,
	X25519Public,
	X25519SharedSecrets,
} from "@tutao/tutanota-crypto"
import { concat, hexToUint8Array, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { KEY_LENGTH_BYTES_AES_256 } from "@tutao/tutanota-crypto/dist/encryption/Aes.js"
import { PQMessage } from "./PQMessage.js"
import { hkdf } from "@tutao/tutanota-crypto/dist/hashes/HKDF.js"

export class PQFacade {
	private kyberFacade: KyberFacade

	constructor(kyberFacade: KyberFacade) {
		this.kyberFacade = kyberFacade
	}

	public async generateKeyPairs(): Promise<PQKeyPairs> {
		return new PQKeyPairs(x25519generateKeyPair(), await this.kyberFacade.generateKeypair())
	}

	public async encapsulate(
		senderIdentityKeyPair: X25519KeyPair,
		ephemeralKeyPair: X25519KeyPair,
		recipientKeys: PQPublicKeys,
		bucketKey: Uint8Array,
	): Promise<PQMessage> {
		const eccSharedSecret = x25519encapsulate(senderIdentityKeyPair.priv, ephemeralKeyPair.priv, recipientKeys.eccPublicKey)
		const kyberSharedSecret = await this.kyberFacade.encapsulate(recipientKeys.kyberPublicKey)
		const kyberCipherText = kyberSharedSecret.ciphertext

		const kek = this.derivePQKEK(
			senderIdentityKeyPair.pub,
			ephemeralKeyPair.pub,
			recipientKeys.eccPublicKey,
			recipientKeys.kyberPublicKey,
			kyberCipherText,
			kyberSharedSecret.sharedSecret,
			eccSharedSecret,
		)

		const bucketKeyCipherText = aesEncrypt(kek, bucketKey)
		return {
			senderIdentityPubKey: senderIdentityKeyPair.pub,
			ephemeralPubKey: ephemeralKeyPair.pub,
			encapsulation: {
				kyberCipherText,
				bucketKeyCipherText,
			},
		}
	}

	public async decapsulate(message: PQMessage, recipientKeys: PQKeyPairs): Promise<Uint8Array> {
		const kyberCipherText = message.encapsulation.kyberCipherText
		const eccSharedSecret = x25519decapsulate(message.senderIdentityPubKey, message.ephemeralPubKey, recipientKeys.x25519KeyPair.priv)
		const kyberSharedSecret = await this.kyberFacade.decapsulate(recipientKeys.kyberKeyPair.privateKey, kyberCipherText)

		const kek = this.derivePQKEK(
			message.senderIdentityPubKey,
			message.ephemeralPubKey,
			recipientKeys.x25519KeyPair.pub,
			recipientKeys.kyberKeyPair.publicKey,
			kyberCipherText,
			kyberSharedSecret,
			eccSharedSecret,
		)

		return aesDecrypt(kek, message.encapsulation.bucketKeyCipherText)
	}

	private derivePQKEK(
		senderIdentityPublicKey: X25519Public,
		ephemeralPublicKey: X25519Public,
		eccRecipientPublicKey: X25519Public,
		kyberRecipientPublicKey: KyberPublicKey,
		kyberCipherText: Uint8Array,
		kyberSharedSecret: Uint8Array,
		eccSharedSecret: X25519SharedSecrets,
	): Aes256Key {
		var context = concat(
			senderIdentityPublicKey,
			ephemeralPublicKey,
			eccRecipientPublicKey,
			hexToUint8Array(kyberPublicKeyToHex(kyberRecipientPublicKey)),
			kyberCipherText,
		)

		var inputKeyMaterial = concat(eccSharedSecret.ephemeralSharedSecret, eccSharedSecret.authSharedSecret, kyberSharedSecret)

		const kekBytes = hkdf(context, inputKeyMaterial, stringToUtf8Uint8Array("kek"), KEY_LENGTH_BYTES_AES_256)
		return uint8ArrayToKey(kekBytes)
	}
}
