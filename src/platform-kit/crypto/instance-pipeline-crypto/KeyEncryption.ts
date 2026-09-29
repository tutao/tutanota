import { Aes } from "./Aes.js"
import { assertNotNull, hexToUint8Array, uint8ArrayToHex } from "@tutao/utils"
import { hexToRsaPrivateKey, hexToRsaPublicKey, rsaPrivateKeyToHex } from "../encryption/Rsa.js"
import { RsaKeyPair, RsaPrivateKey, RsaX25519KeyPair } from "../encryption/RsaKeyPair.js"
import { bytesToKyberPrivateKey, bytesToKyberPublicKey, KyberPrivateKey, kyberPrivateKeyToBytes } from "../encryption/Liboqs/KyberKeyPair.js"
import { X25519PrivateKey } from "../encryption/X25519.js"
import { AsymmetricKeyPair } from "../encryption/AsymmetricKeyPair.js"
import { Aes128Key, Aes256Key, AesKey, AesKeyLength, assert256BitKey, getKeyLengthInBytes } from "../encryption/symmetric/AesKey.js"
import { ProgrammingError } from "@tutao/app-env"
import { EncryptedKeyPairs, EncryptedPqKeyPairs, EncryptedRsaKeyPairs, EncryptedRsaX25519KeyPairs } from "../encryption/EncryptedKeyPairs"
import { PQKeyPairs } from "../encryption/PQKeyPairs"
import { SymmetricCipherFacade } from "./SymmetricCipherFacade"

export class KeyEncryption {
	constructor(
		private readonly symmetricCipherFacade: SymmetricCipherFacade,
		private readonly aes: Aes,
	) {}

	encryptKey(encryptionKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptKey(encryptionKey, keyToBeEncrypted)
	}

	decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array<ArrayBuffer>): AesKey
	decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array<ArrayBuffer>, acceptedBitLengths: typeof AesKeyLength.Aes256): Aes256Key
	decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array<ArrayBuffer>, acceptedBitLengths: typeof AesKeyLength.Aes128): Aes128Key
	decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array<ArrayBuffer>, acceptedBitLength?: AesKeyLength): AesKey {
		return this.symmetricCipherFacade.decryptKey(encryptionKey, keyToBeDecrypted, acceptedBitLength)
	}

	/**
	 * @deprecated
	 */
	decryptKeyUnauthenticatedWithDeviceKeyChain(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): AesKey {
		return this.symmetricCipherFacade.decryptKeyDeprecatedUnauthenticated(key, encryptedBytes)
	}

	aes256DecryptWithRecoveryKey(encryptionKey: Aes256Key, keyToBeDecrypted: Uint8Array<ArrayBuffer>): AesKey {
		// legacy case: recovery code with fixed initialization vector and without mac
		if (keyToBeDecrypted.length === getKeyLengthInBytes(AesKeyLength.Aes128)) {
			return this.symmetricCipherFacade.decryptKeyDeprecatedUnauthenticatedFixedInitializationVector(encryptionKey, keyToBeDecrypted)
		} else {
			return this.symmetricCipherFacade.decryptKey(encryptionKey, keyToBeDecrypted)
		}
	}

	encryptRsaKey(encryptionKey: AesKey, privateKey: RsaPrivateKey): Uint8Array<ArrayBuffer> {
		return this.aes.aesEncrypt(encryptionKey, hexToUint8Array(rsaPrivateKeyToHex(privateKey)))
	}

	encryptX25519Key(encryptionKey: AesKey, privateKey: X25519PrivateKey): Uint8Array<ArrayBuffer> {
		return this.aes.aesEncrypt(encryptionKey, privateKey) // passing the initialization vector as undefined here is fine, as it will generate a new one for each encryption
	}

	encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array<ArrayBuffer> {
		return this.aes.aesEncrypt(encryptionKey, kyberPrivateKeyToBytes(privateKey)) // passing the initialization vector as undefined here is fine, as it will generate a new one for each encryption
	}

	decryptRsaKey(encryptionKey: AesKey, encryptedPrivateKey: Uint8Array<ArrayBuffer>): RsaPrivateKey {
		return hexToRsaPrivateKey(uint8ArrayToHex(this.aes.aesDecrypt(encryptionKey, encryptedPrivateKey)))
	}

	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
		if (keyPair instanceof EncryptedRsaKeyPairs) {
			return this.decryptRsaOrRsaX25519KeyPair(encryptionKey, keyPair)
		} else if (keyPair instanceof EncryptedPqKeyPairs) {
			return this.decryptPQKeyPair(assert256BitKey(encryptionKey), keyPair)
		} else {
			throw new ProgrammingError("unsupported keypair")
		}
	}

	private decryptRsaOrRsaX25519KeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaKeyPairs): RsaKeyPair {
		const publicKey = hexToRsaPublicKey(uint8ArrayToHex(assertNotNull(keyPair.pubRsaKey)))
		const privateKey = hexToRsaPrivateKey(uint8ArrayToHex(this.aes.aesDecrypt(encryptionKey, keyPair.symEncPrivRsaKey!)))
		if (keyPair instanceof EncryptedRsaX25519KeyPairs) {
			const publicEccKey = assertNotNull(keyPair.pubEccKey)
			const privateEccKey = this.aes.aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey))
			return new RsaX25519KeyPair(publicKey, privateKey, publicEccKey, privateEccKey)
		} else {
			return new RsaKeyPair(publicKey, privateKey)
		}
	}

	private decryptPQKeyPair(encryptionKey: Aes256Key, keyPair: EncryptedPqKeyPairs): PQKeyPairs {
		const eccPublicKey = assertNotNull(keyPair.pubEccKey, "expected pub ecc key for PQ keypair")
		const eccPrivateKey = this.aes.aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey, "expected priv ecc key for PQ keypair"))
		const kyberPublicKey = bytesToKyberPublicKey(assertNotNull(keyPair.pubKyberKey, "expected pub kyber key for PQ keypair"))
		const kyberPrivateKey = bytesToKyberPrivateKey(
			this.aes.aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivKyberKey, "expected enc priv kyber key for PQ keypair")),
		)

		return new PQKeyPairs(
			{
				publicKey: eccPublicKey,
				privateKey: eccPrivateKey,
			},
			{
				publicKey: kyberPublicKey,
				privateKey: kyberPrivateKey,
			},
		)
	}
}
