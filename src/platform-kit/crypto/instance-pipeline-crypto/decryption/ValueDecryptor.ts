import { KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade, PaddingStandard } from "../../encryption/symmetric/AesCbcFacade"
import { AeadSubKeys, AesCbcSubKeys, InstanceTypeId, SymmetricKeyDeriver, SymmetricSubKeys } from "../../encryption/symmetric/SymmetricKeyDeriver"
import { AeadFacade } from "../../encryption/symmetric/AeadFacade"
import {
	ParsedCiphertext,
	ParsedCiphertextAead,
	ParsedCiphertextAeadWithInstanceKey,
	ParsedCiphertextAeadWithSessionKey,
	ParsedCiphertextAesCbc,
} from "../../encryption/symmetric/ParsedCiphertext"
import { InstanceSubKeyCache } from "./SubKeyCache"
import { SymmetricCipherVersion } from "../../encryption/symmetric/SymmetricCipherVersion"
import {
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN,
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN,
	AesKey,
	VersionedAes256Key,
	VersionedKey,
} from "@tutao/crypto"
import { ProgrammingError } from "@tutao/app-env"
import { stringToUtf8Uint8Array } from "@tutao/utils"

/**`
 * Decrypts one attribute of one given instance.
 */
export abstract class ValueDecryptor {
	protected constructor(
		protected readonly parsedCiphertext: ParsedCiphertext,
		protected readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		protected readonly instanceSubKeyCache: InstanceSubKeyCache<SymmetricSubKeys>,
	) {}

	abstract getValue(): Uint8Array
}

export abstract class AeadValueDecryptor extends ValueDecryptor {
	protected constructor(
		protected override readonly parsedCiphertext: ParsedCiphertextAead,
		symmetricKeyDeriver: SymmetricKeyDeriver,
		protected override readonly instanceSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
		protected readonly aeadFacade: AeadFacade,
		protected readonly instanceTypeId: InstanceTypeId,
		protected readonly associatedData: Uint8Array,
	) {
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache)
	}
}

export class AesCbcDecryptor extends ValueDecryptor {
	constructor(
		parsedCiphertext: ParsedCiphertextAesCbc,
		symmetricKeyDeriver: SymmetricKeyDeriver,
		instanceSubKeyCache: InstanceSubKeyCache<AesCbcSubKeys>,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly sessionKey: AesKey,
	) {
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache)
	}

	getValue(): Uint8Array {
		const cipherVersion = this.parsedCiphertext.cipherVersion
		const instanceAesSubKeyCacheKey = {
			cipherVersion,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAesSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAesCbc(this.sessionKey, cipherVersion)
			this.instanceSubKeyCache.set(instanceAesSubKeyCacheKey, subKeys)
		}
		return this.aesCbcFacade.decrypt(subKeys, this.parsedCiphertext, PaddingStandard.Pkcs5)
	}
}

export class AeadWithInstanceKeyFromGroupKeyDecryptor extends AeadValueDecryptor {
	constructor(
		protected override readonly parsedCiphertext: ParsedCiphertextAeadWithInstanceKey,
		symmetricKeyDeriver: SymmetricKeyDeriver,
		instanceSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
		aeadFacade: AeadFacade,
		instanceTypeId: InstanceTypeId,
		fieldPath: string,
		private readonly kdfNonce: KdfNonce,
		private readonly groupKey: VersionedKey,
	) {
		if (parsedCiphertext.groupKeyVersion !== groupKey.version) {
			throw new ProgrammingError("Provided group key doesn't match the required version.")
		}
		const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN + fieldPath)
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache, aeadFacade, instanceTypeId, associatedData)
	}

	getValue(): Uint8Array {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
			aesKey: this.groupKey.object,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(this.groupKey, this.kdfNonce, this.instanceTypeId)
			this.instanceSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}

export class AeadWithInstanceKeyFromInstanceKeyDecryptor extends AeadValueDecryptor {
	constructor(
		protected override readonly parsedCiphertext: ParsedCiphertextAeadWithInstanceKey,
		symmetricKeyDeriver: SymmetricKeyDeriver,
		instanceSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
		aeadFacade: AeadFacade,
		instanceTypeId: InstanceTypeId,
		fieldPath: string,
		private readonly instanceKey: VersionedAes256Key,
	) {
		const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN + fieldPath)
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache, aeadFacade, instanceTypeId, associatedData)
	}

	getValue(): Uint8Array {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
			aesKey: this.instanceKey.object,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(this.instanceKey, this.instanceTypeId)
			this.instanceSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}

export class AeadWithSessionKeyDecryptor extends AeadValueDecryptor {
	constructor(
		protected override readonly parsedCiphertext: ParsedCiphertextAeadWithSessionKey,
		symmetricKeyDeriver: SymmetricKeyDeriver,
		instanceSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
		aeadFacade: AeadFacade,
		instanceTypeId: InstanceTypeId,
		fieldPath: string,
		private readonly sessionKey: AesKey,
	) {
		const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN + fieldPath)
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache, aeadFacade, instanceTypeId, associatedData)
	}
	getValue(): Uint8Array {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithSessionKey,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(this.sessionKey, this.instanceTypeId)
			this.instanceSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}
