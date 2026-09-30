import { KeyVersion, Nullable } from "@tutao/utils"
import { KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade } from "../../encryption/symmetric/AesCbcFacade"
import { AeadFacade } from "../../encryption/symmetric/AeadFacade"
import { AeadSubKeys, AesCbcSubKeys, SymmetricKeyDeriver } from "../../encryption/symmetric/SymmetricKeyDeriver"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import {
	AeadWithInstanceKeyFromGroupKeyDecryptor,
	AeadWithInstanceKeyFromInstanceKeyDecryptor,
	AeadWithSessionKeyDecryptor,
	AesCbcDecryptor,
	ValueDecryptor,
} from "./ValueDecryptor"
import {
	ParsedCiphertextAeadWithInstanceKey,
	ParsedCiphertextAeadWithSessionKey,
	ParsedCiphertextAesCbc,
	parseVersionedCiphertext,
} from "../../encryption/symmetric/ParsedCiphertext"
import { VersionedAes256Key, VersionedKey } from "../../CryptoTypes"
import { InstanceSubKeyCache } from "./SubKeyCache"
import { Aes256Key, AesKey } from "../../encryption/symmetric/AesKey"
import { AssociatedData, KeyDerivationContext } from "../../encryption/symmetric/AssociatedData"

export interface OwnerKeyProvider {
	(ownerKeyVersion: KeyVersion): Promise<AesKey>
}

export interface InstanceKeyProvider {
	(instanceKeyVersion: KeyVersion): Promise<Nullable<Aes256Key>>
}

export class InstanceDecryptor {
	private readonly instanceAesSubKeyCache = new InstanceSubKeyCache<AesCbcSubKeys>()
	private readonly instanceAeadSubKeyCache = new InstanceSubKeyCache<AeadSubKeys>()

	constructor(
		private readonly sessionKey: Nullable<AesKey>,
		private readonly kdfNonce: Nullable<KdfNonce>,
		private readonly instanceKeyProvider: Nullable<InstanceKeyProvider>,
		private readonly ownerKeyProvider: Nullable<OwnerKeyProvider>,
		private readonly keyDerivationContext: KeyDerivationContext,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly aeadFacade: AeadFacade,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}

	async getValueDecryptor(versionedCiphertext: Uint8Array<ArrayBuffer>, associatedData: AssociatedData): Promise<ValueDecryptor> {
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext)
		if (parsedCiphertext instanceof ParsedCiphertextAesCbc) {
			if (this.sessionKey == null) {
				throw new SessionKeyNotFoundError("Missing session key")
			}
			return new AesCbcDecryptor(parsedCiphertext, this.symmetricKeyDeriver, this.instanceAesSubKeyCache, this.aesCbcFacade, this.sessionKey)
		} else if (parsedCiphertext instanceof ParsedCiphertextAeadWithInstanceKey) {
			if (this.instanceKeyProvider != null) {
				const instanceKey = await this.getInstanceKey(parsedCiphertext.groupKeyVersion, this.instanceKeyProvider)
				return new AeadWithInstanceKeyFromInstanceKeyDecryptor(
					parsedCiphertext,
					this.symmetricKeyDeriver,
					this.instanceAeadSubKeyCache,
					this.aeadFacade,
					this.keyDerivationContext,
					associatedData,
					instanceKey,
				)
			} else if (this.kdfNonce != null) {
				const groupKey = await this.getOwnerKey(parsedCiphertext.groupKeyVersion, this.ownerKeyProvider)
				return new AeadWithInstanceKeyFromGroupKeyDecryptor(
					parsedCiphertext,
					this.symmetricKeyDeriver,
					this.instanceAeadSubKeyCache,
					this.aeadFacade,
					this.keyDerivationContext,
					associatedData,
					this.kdfNonce,
					groupKey,
				)
			} else {
				throw new CryptoError("no kdf nonce or instance key for Aead with instance key encrypted value")
			}
		} else if (parsedCiphertext instanceof ParsedCiphertextAeadWithSessionKey) {
			if (this.sessionKey == null) {
				throw new SessionKeyNotFoundError("Missing session key")
			}
			return new AeadWithSessionKeyDecryptor(
				parsedCiphertext,
				this.symmetricKeyDeriver,
				this.instanceAeadSubKeyCache,
				this.aeadFacade,
				this.keyDerivationContext,
				associatedData,
				this.sessionKey,
			)
		}
		throw new CryptoError(`Unsupported cipher version ${parsedCiphertext.cipherVersion.constructor.name}`)
	}

	canAttemptDecryption(): boolean {
		return this.sessionKey != null || (this.kdfNonce != null && this.ownerKeyProvider != null) || this.instanceKeyProvider != null
	}

	private async getOwnerKey(requiredOwnerKeyVersion: KeyVersion, ownerKeyProvider: Nullable<OwnerKeyProvider>): Promise<VersionedKey> {
		if (ownerKeyProvider == null) {
			throw new CryptoError("Cannot load owner key. Missing owner key provider.")
		}
		const ownerKey = await ownerKeyProvider(requiredOwnerKeyVersion)
		return { object: ownerKey, version: requiredOwnerKeyVersion }
	}

	private async getInstanceKey(requiredInstanceKeyVersion: KeyVersion, instanceKeyProvider: Nullable<InstanceKeyProvider>): Promise<VersionedAes256Key> {
		if (instanceKeyProvider == null) {
			throw new CryptoError("Cannot get instance key. Missing instance key provider.")
		}
		const instanceKey = await instanceKeyProvider(requiredInstanceKeyVersion)
		return { object: instanceKey, version: requiredInstanceKeyVersion }
	}

	public async updateForTransferAggregatedType(keyDerivationContext: KeyDerivationContext): Promise<InstanceDecryptor> {
		return new InstanceDecryptor(
			this.sessionKey,
			this.kdfNonce,
			this.instanceKeyProvider,
			this.ownerKeyProvider,
			keyDerivationContext,
			this.aesCbcFacade,
			this.aeadFacade,
			this.symmetricKeyDeriver,
		)
	}
}
