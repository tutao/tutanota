import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	decryptKey,
	EccPrivateKey,
	encryptEccKey,
	encryptKey,
	encryptKyberKey,
	KyberPrivateKey,
	KyberPublicKey,
	kyberPublicKeyToBytes,
} from "@tutao/tutanota-crypto"
import { encryptKeyWithVersionedKey, VersionedEncryptedKey, VersionedKey } from "./CryptoFacade.js"

export interface CryptoWrapper {
	aes256RandomKey(): Aes256Key

	aesEncrypt(key: AesKey, bytes: Uint8Array, iv?: Uint8Array, usePadding?: boolean, useMac?: boolean): Uint8Array

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array

	encryptKey(encryptingKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array

	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey

	encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey

	encryptEccKey(encryptionKey: AesKey, privateKey: EccPrivateKey): Uint8Array

	encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array

	kyberPublicKeyToBytes(kyberPublicKey: KyberPublicKey): Uint8Array
}

export const cryptoWrapper: CryptoWrapper = {
	aes256RandomKey(): Aes256Key {
		return aes256RandomKey()
	},
	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array {
		return aesDecrypt(key, encryptedBytes, usePadding)
	},
	aesEncrypt(key: AesKey, bytes: Uint8Array, iv?: Uint8Array, usePadding?: boolean, useMac?: boolean): Uint8Array {
		return aesEncrypt(key, bytes, iv, usePadding, useMac)
	},
	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey {
		return decryptKey(encryptionKey, key)
	},
	encryptEccKey(encryptionKey: AesKey, privateKey: EccPrivateKey): Uint8Array {
		return encryptEccKey(encryptionKey, privateKey)
	},
	encryptKey(encryptingKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array {
		return encryptKey(encryptingKey, keyToBeEncrypted)
	},
	encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
		return encryptKeyWithVersionedKey(encryptingKey, key)
	},
	encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array {
		return encryptKyberKey(encryptionKey, privateKey)
	},
	kyberPublicKeyToBytes(kyberPublicKey: KyberPublicKey): Uint8Array {
		return kyberPublicKeyToBytes(kyberPublicKey)
	},
}
