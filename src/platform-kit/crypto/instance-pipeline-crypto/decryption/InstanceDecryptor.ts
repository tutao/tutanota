import { Nullable, stringToUtf8Uint8Array } from "@tutao/utils"
import { AesKey, KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { AesCbcFacade } from "../../encryption/symmetric/AesCbcFacade"
import { AeadFacade } from "../../encryption/symmetric/AeadFacade"
import { AeadSubKeys, AesCbcSubKeys, InstanceTypeId, SymmetricKeyDeriver } from "../../encryption/symmetric/SymmetricKeyDeriver"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import { AeadWithGroupKeyDecryptor, AeadWithSessionKeyDecryptor, AesCbcDecryptor, ValueDecryptor } from "./ValueDecryptor"
import {
	ParsedCiphertextAeadWithGroupKey,
	ParsedCiphertextAeadWithSessionKey,
	ParsedCiphertextAesCbc,
	parseVersionedCiphertext,
} from "../../encryption/symmetric/ParsedCiphertext"
import { AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN, AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN } from "../../CryptoTypes"
import { InstanceSubKeyCache } from "./SubKeyCache"

export class InstanceDecryptor {
	private readonly instanceAesSubKeyCache = new InstanceSubKeyCache<AesCbcSubKeys>()
	private readonly instanceAeadSubKeyCache = new InstanceSubKeyCache<AeadSubKeys>()

	constructor(
		private readonly sessionKey: Nullable<AesKey>,
		private readonly kdfNonce: Nullable<KdfNonce>,
		private readonly instanceTypeId: InstanceTypeId,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly aeadFacade: AeadFacade,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}

	getValueDecryptor(versionedCiphertext: Uint8Array, fieldPath: string): ValueDecryptor {
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext)
		if (parsedCiphertext instanceof ParsedCiphertextAesCbc) {
			if (this.sessionKey == null) {
				throw new SessionKeyNotFoundError("Missing session key")
			}
			return new AesCbcDecryptor(parsedCiphertext, this.aesCbcFacade, this.sessionKey, this.instanceAesSubKeyCache, this.symmetricKeyDeriver)
		} else if (parsedCiphertext instanceof ParsedCiphertextAeadWithGroupKey) {
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
		} else if (parsedCiphertext instanceof ParsedCiphertextAeadWithSessionKey) {
			if (this.sessionKey == null) {
				throw new SessionKeyNotFoundError("Missing session key")
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
		throw new CryptoError(`Unsupported cipher version ${parsedCiphertext.cipherVersion.constructor.name}`)
	}

	canAttemptDecryption(): boolean {
		return this.sessionKey != null || this.kdfNonce != null
	}
}
