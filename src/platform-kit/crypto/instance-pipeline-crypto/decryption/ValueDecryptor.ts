import { KeyVersion, Nullable } from "@tutao/utils"
import { AesKey, KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade, PaddingStandard } from "../../encryption/symmetric/AesCbcFacade"
import { AeadSubKeys, AesCbcSubKeys, InstanceTypeId, SymmetricKeyDeriver } from "../../encryption/symmetric/SymmetricKeyDeriver"
import { AeadFacade } from "../../encryption/symmetric/AeadFacade"
import { ParsedCiphertextAeadWithGroupKey, ParsedCiphertextAeadWithSessionKey, ParsedCiphertextAesCbc } from "../../encryption/symmetric/ParsedCiphertext"
import { CryptoError } from "@tutao/crypto/error"
import { InstanceSubKeyCache } from "./SubKeyCache"
import { SymmetricCipherVersion } from "../../encryption/symmetric/SymmetricCipherVersion"

/**`
 * Decrypts one attribute of one given instance.
 */
export interface ValueDecryptor {
	readonly requiredGroupKeyVersion: Nullable<KeyVersion>
	getValue(key?: Nullable<AesKey>): Uint8Array
}

export class AesCbcDecryptor implements ValueDecryptor {
	readonly requiredGroupKeyVersion = null
	constructor(
		private readonly parsedCiphertext: ParsedCiphertextAesCbc,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly sessionKey: AesKey,
		private readonly instanceAesSubKeyCache: InstanceSubKeyCache<AesCbcSubKeys>,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}
	getValue(): Uint8Array {
		const instanceAesSubKeyCacheKey = {
			cipherVersion: this.parsedCiphertext.cipherVersion,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceAesSubKeyCache.get(instanceAesSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAesCbcHmac(this.sessionKey)
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
		private readonly instanceAeadSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
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
		if (subKeys == null) {
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
	readonly requiredGroupKeyVersion = null
	constructor(
		private readonly parsedCiphertext: ParsedCiphertextAeadWithSessionKey,
		private readonly aeadFacade: AeadFacade,
		private readonly sessionKey: AesKey,
		private readonly instanceTypeId: InstanceTypeId,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly associatedData: Uint8Array,
		private readonly instanceAeadSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
	) {}
	getValue(): Uint8Array {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithSessionKey,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceAeadSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.sessionKey, this.instanceTypeId)
			this.instanceAeadSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}
