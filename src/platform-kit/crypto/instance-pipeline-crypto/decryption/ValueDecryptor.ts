import { KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade, PaddingStandard } from "../../encryption/symmetric/AesCbcFacade"
import { AeadSubKeys, AesCbcSubKeys, SymmetricKeyDeriver, SymmetricSubKeys } from "../../encryption/symmetric/SymmetricKeyDeriver"
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
import { AesKey, KeyDerivationContext, MaybeSessionKeySomeday, VersionedAes256Key, VersionedKey } from "@tutao/crypto"
import { ProgrammingError } from "@tutao/app-env"
import { AssociatedData } from "../../encryption/symmetric/AssociatedData"

/**`
 * Decrypts one attribute of one given instance.
 */
export abstract class ValueDecryptor {
	protected constructor(
		protected readonly parsedCiphertext: ParsedCiphertext,
		protected readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		protected readonly instanceSubKeyCache: InstanceSubKeyCache<SymmetricSubKeys>,
	) {}

	abstract getValue(): Promise<Uint8Array<ArrayBuffer>>
}

export abstract class AeadValueDecryptor extends ValueDecryptor {
	protected constructor(
		protected override readonly parsedCiphertext: ParsedCiphertextAead,
		symmetricKeyDeriver: SymmetricKeyDeriver,
		protected override readonly instanceSubKeyCache: InstanceSubKeyCache<AeadSubKeys>,
		protected readonly aeadFacade: AeadFacade,
		protected readonly keyDerivationContext: KeyDerivationContext,
		protected readonly associatedData: AssociatedData,
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
		private readonly sessionKey: MaybeSessionKeySomeday,
	) {
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache)
	}

	async getValue(): Promise<Uint8Array<ArrayBuffer>> {
		const cipherVersion = this.parsedCiphertext.cipherVersion
		if (this.sessionKey == null) {
			throw new ProgrammingError("needed a session key, but one was not provided")
		}
		let sessionKey: AesKey
		try {
			sessionKey = await this.sessionKey()
		} catch (e) {
			if (e instanceof TypeError) {
				console.log(`this.sessionKey: ${this.sessionKey}`, e)
			}
			throw e
		}
		const instanceAesSubKeyCacheKey = {
			cipherVersion,
			aesKey: sessionKey,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAesSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAesCbc(sessionKey, cipherVersion)
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
		keyDerivationContext: KeyDerivationContext,
		associatedData: AssociatedData,
		private readonly kdfNonce: KdfNonce,
		private readonly groupKey: VersionedKey,
	) {
		if (parsedCiphertext.groupKeyVersion !== groupKey.version) {
			throw new ProgrammingError("Provided group key doesn't match the required version.")
		}
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache, aeadFacade, keyDerivationContext, associatedData)
	}

	async getValue(): Promise<Uint8Array<ArrayBuffer>> {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
			aesKey: this.groupKey.object,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(this.groupKey, this.kdfNonce, this.keyDerivationContext)
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
		keyDerivationContext: KeyDerivationContext,
		associatedData: AssociatedData,
		private readonly instanceKey: VersionedAes256Key,
	) {
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache, aeadFacade, keyDerivationContext, associatedData)
	}

	async getValue(): Promise<Uint8Array<ArrayBuffer>> {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
			aesKey: this.instanceKey.object,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(this.instanceKey, this.keyDerivationContext)
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
		keyDerivationContext: KeyDerivationContext,
		associatedData: AssociatedData,
		private readonly sessionKey: MaybeSessionKeySomeday,
	) {
		super(parsedCiphertext, symmetricKeyDeriver, instanceSubKeyCache, aeadFacade, keyDerivationContext, associatedData)
	}
	async getValue(): Promise<Uint8Array<ArrayBuffer>> {
		if (this.sessionKey == null) {
			throw new ProgrammingError("needed a session key, but one was not provided")
		}
		const sessionKey = await this.sessionKey()
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithSessionKey,
			aesKey: sessionKey,
		}
		let subKeys = this.instanceSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys == null) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(sessionKey, this.keyDerivationContext)
			this.instanceSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.parsedCiphertext, this.associatedData)
	}
}
