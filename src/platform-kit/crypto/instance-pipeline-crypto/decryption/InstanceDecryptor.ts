import { KeyVersion, Nullable } from "@tutao/utils"
import { KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade } from "../../encryption/symmetric/AesCbcFacade"
import { AeadFacade } from "../../encryption/symmetric/AeadFacade"
import { AeadSubKeys, AesCbcSubKeys, InstanceTypeId, SymmetricKeyDeriver } from "../../encryption/symmetric/SymmetricKeyDeriver"
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
import { AesKey } from "../../encryption/symmetric/AesKey"

export interface OwnerKeyProvider {
	(ownerKeyVersion: KeyVersion): Promise<AesKey>
}

export class InstanceDecryptor {
	private readonly instanceAesSubKeyCache = new InstanceSubKeyCache<AesCbcSubKeys>()
	private readonly instanceAeadSubKeyCache = new InstanceSubKeyCache<AeadSubKeys>()

	constructor(
		private readonly sessionKey: Nullable<AesKey>,
		private readonly kdfNonce: Nullable<KdfNonce>,
		private readonly instanceKey: Nullable<VersionedAes256Key>,
		private readonly ownerKeyProvider: Nullable<OwnerKeyProvider>,
		private readonly instanceTypeId: InstanceTypeId,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly aeadFacade: AeadFacade,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}

	async getValueDecryptor(versionedCiphertext: Uint8Array, fieldPath: string): Promise<ValueDecryptor> {
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext)
		if (parsedCiphertext instanceof ParsedCiphertextAesCbc) {
			if (this.sessionKey == null) {
				throw new SessionKeyNotFoundError("Missing session key")
			}
			return new AesCbcDecryptor(parsedCiphertext, this.symmetricKeyDeriver, this.instanceAesSubKeyCache, this.aesCbcFacade, this.sessionKey)
		} else if (parsedCiphertext instanceof ParsedCiphertextAeadWithInstanceKey) {
			if (this.instanceKey != null) {
				return new AeadWithInstanceKeyFromInstanceKeyDecryptor(
					parsedCiphertext,
					this.symmetricKeyDeriver,
					this.instanceAeadSubKeyCache,
					this.aeadFacade,
					this.instanceTypeId,
					fieldPath,
					this.instanceKey,
				)
			} else if (this.kdfNonce != null) {
				const groupKey = await this.getOwnerKey(parsedCiphertext.groupKeyVersion, this.ownerKeyProvider)
				return new AeadWithInstanceKeyFromGroupKeyDecryptor(
					parsedCiphertext,
					this.symmetricKeyDeriver,
					this.instanceAeadSubKeyCache,
					this.aeadFacade,
					this.instanceTypeId,
					fieldPath,
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
				this.instanceTypeId,
				fieldPath,
				this.sessionKey,
			)
		}
		throw new CryptoError(`Unsupported cipher version ${parsedCiphertext.cipherVersion.constructor.name}`)
	}

	canAttemptDecryption(): boolean {
		return this.sessionKey != null || (this.kdfNonce != null && this.ownerKeyProvider != null) || this.instanceKey != null
	}

	private async getOwnerKey(requiredOwnerKeyVersion: KeyVersion, ownerKeyProvider: Nullable<OwnerKeyProvider>): Promise<VersionedKey> {
		if (ownerKeyProvider == null) {
			throw new CryptoError("Cannot load owner key. Missing owner key provider.")
		}
		const ownerKey = await ownerKeyProvider(requiredOwnerKeyVersion)
		return { object: ownerKey, version: requiredOwnerKeyVersion }
	}
}
