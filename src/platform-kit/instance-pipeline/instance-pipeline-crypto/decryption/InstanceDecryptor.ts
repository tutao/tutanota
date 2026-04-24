import { Nullable, stringToUtf8Uint8Array } from "@tutao/utils"
import { AesKey, KdfNonce } from "../../../crypto/encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade } from "../../../crypto/encryption/symmetric/AesCbcFacade"
import { AeadFacade } from "../../../crypto/encryption/symmetric/AeadFacade"
import { InstanceTypeId, SymmetricKeyDeriver } from "../../../crypto/encryption/symmetric/SymmetricKeyDeriver"
import { SymmetricCipherVersion } from "../../../crypto/encryption/symmetric/SymmetricCipherVersion"
import { CryptoError } from "@tutao/crypto/error"
import { InstanceAeadSubKeyCache, InstanceAesSubKeyCache, serializeInstanceSubKeyCacheKey, subKeyCache } from "./SubKeyCache"
import { AeadWithGroupKeyDecryptor, AeadWithSessionKeyDecryptor, AesCbcDecryptor, ValueDecryptor } from "./ValueDecryptor"
import { parseVersionedCiphertext } from "../../../crypto/encryption/symmetric/ParsedCiphertext"
import { DomainSeparator, UNIT_SEPARATOR_CHAR } from "../../../crypto/CryptoTypes"

export const MissingSessionKey = "missing session key" as const
export type MissingSessionKey = typeof MissingSessionKey

export const AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN: DomainSeparator = `attributeEncGK${UNIT_SEPARATOR_CHAR}`
export const AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN: DomainSeparator = `attributeEncSK${UNIT_SEPARATOR_CHAR}`

export class InstanceDecryptor {
	private readonly instanceAesSubKeyCache: InstanceAesSubKeyCache = subKeyCache(serializeInstanceSubKeyCacheKey)
	private readonly instanceAeadSubKeyCache: InstanceAeadSubKeyCache = subKeyCache(serializeInstanceSubKeyCacheKey)

	constructor(
		private readonly sessionKey: Nullable<AesKey>,
		private readonly kdfNonce: Nullable<KdfNonce>,
		private readonly instanceTypeId: InstanceTypeId,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly aeadFacade: AeadFacade,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}

	getValueDecryptor(versionedCiphertext: Uint8Array, fieldPath: string): ValueDecryptor | MissingSessionKey {
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext)
		switch (parsedCiphertext.cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				if (this.sessionKey == null) {
					return MissingSessionKey
				}
				return new AesCbcDecryptor(parsedCiphertext, this.aesCbcFacade, this.sessionKey, this.instanceAesSubKeyCache, this.symmetricKeyDeriver)
			}
			case SymmetricCipherVersion.AeadWithGroupKey: {
				if (this.kdfNonce == null) {
					throw new CryptoError("no kdf nonce for group key encrypted value")
				}
				const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN + fieldPath)
				return new AeadWithGroupKeyDecryptor(
					parsedCiphertext,
					this.aeadFacade,
					this.kdfNonce,
					this.instanceTypeId,
					this.symmetricKeyDeriver,
					associatedData,
					this.instanceAeadSubKeyCache,
				)
			}
			case SymmetricCipherVersion.AeadWithSessionKey: {
				if (this.sessionKey == null) {
					return MissingSessionKey
				}
				const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN + fieldPath)
				return new AeadWithSessionKeyDecryptor(
					parsedCiphertext,
					this.aeadFacade,
					this.sessionKey,
					this.instanceTypeId,
					this.symmetricKeyDeriver,
					associatedData,
					this.instanceAeadSubKeyCache,
				)
			}
		}
	}

	canAttemptDecryption(): boolean {
		return this.sessionKey != null || this.kdfNonce != null
	}
}
