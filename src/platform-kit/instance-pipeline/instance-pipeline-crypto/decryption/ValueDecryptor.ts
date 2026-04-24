import { KeyVersion, Nullable } from "@tutao/utils"
import { AesKey, KdfNonce } from "../../../crypto/encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade, PaddingStandard } from "../../../crypto/encryption/symmetric/AesCbcFacade"
import { InstanceAeadSubKeyCache, InstanceAesSubKeyCache } from "./SubKeyCache"
import { InstanceTypeId, SymmetricKeyDeriver } from "../../../crypto/encryption/symmetric/SymmetricKeyDeriver"
import { AeadFacade } from "../../../crypto/encryption/symmetric/AeadFacade"
import { SymmetricCipherVersion } from "../../../crypto/encryption/symmetric/SymmetricCipherVersion"
import { CryptoError } from "@tutao/crypto/error"
import { ParsedCiphertextAeadWithGroupKey, ParsedCiphertextAeadWithSessionKey, ParsedCiphertextAesCbc } from "../../../crypto/encryption/symmetric/ParsedCiphertext"

/**
 * Decrypts one attribute of one given instance.
 */
export interface ValueDecryptor {
	readonly requiredGroupKeyVersion: "none" | KeyVersion
	getValue(key?: Nullable<AesKey>): Uint8Array
}

export class AesCbcDecryptor implements ValueDecryptor {
	readonly requiredGroupKeyVersion = "none" as const
	constructor(
		private readonly parsedCiphertext: ParsedCiphertextAesCbc,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly sessionKey: AesKey,
		private readonly instanceAesSubKeyCache: InstanceAesSubKeyCache,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}
	getValue(): Uint8Array {
		const instanceAesSubKeyCacheKey = {
			cipherVersion: this.parsedCiphertext.cipherVersion,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceAesSubKeyCache.get(instanceAesSubKeyCacheKey)
		if (subKeys === undefined) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeys(this.sessionKey, this.parsedCiphertext.cipherVersion)
			this.instanceAesSubKeyCache.set(instanceAesSubKeyCacheKey, subKeys)
		}
		return this.aesCbcFacade.decrypt(subKeys, this.parsedCiphertext, PaddingStandard.Pkcs5)
	}
}

export class AeadWithGroupKeyDecryptor implements ValueDecryptor {
	requiredGroupKeyVersion: KeyVersion
	constructor(
		private readonly parsedCiphertext: ParsedCiphertextAeadWithGroupKey,
		private readonly aeadFacade: AeadFacade,
		private readonly kdfNonce: KdfNonce,
		private readonly instanceTypeId: InstanceTypeId,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly associatedData: Uint8Array,
		private readonly instanceAeadSubKeyCache: InstanceAeadSubKeyCache,
	) {
		this.requiredGroupKeyVersion = parsedCiphertext.groupKeyVersion
	}

	getValue(key: Nullable<AesKey>): Uint8Array {
		if (key == null) {
			throw new CryptoError("AEAD decryption of a value failed because of a missing group key.")
		}
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithGroupKey,
			aesKey: key,
		}
		let subKeys = this.instanceAeadSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys === undefined) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(
				{ object: key, version: this.parsedCiphertext.groupKeyVersion },
				this.kdfNonce,
				this.instanceTypeId,
			)
			this.instanceAeadSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}

export class AeadWithSessionKeyDecryptor implements ValueDecryptor {
	readonly requiredGroupKeyVersion = "none" as const
	constructor(
		private readonly parsedCiphertext: ParsedCiphertextAeadWithSessionKey,
		private readonly aeadFacade: AeadFacade,
		private readonly sessionKey: AesKey,
		private readonly instanceTypeId: InstanceTypeId,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly associatedData: Uint8Array,
		private readonly instanceAeadSubKeyCache: InstanceAeadSubKeyCache,
	) {}
	getValue(): Uint8Array {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithSessionKey,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceAeadSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys === undefined) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.sessionKey, this.instanceTypeId)
			this.instanceAeadSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}
