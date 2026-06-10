import { lazyMemoized, Nullable } from "@tutao/utils"
import { AesCbcThenHmacSubKeys, AesKey, InstanceTypeId, KdfNonce, SymmetricCipherVersion, VersionedKey } from "@tutao/crypto"
import { CryptoError } from "@tutao/crypto/error"
import { SymmetricKeyDeriver } from "../../encryption/symmetric/SymmetricKeyDeriver"

export type SessionKeyInfo = {
	cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac | typeof SymmetricCipherVersion.AeadWithSessionKey
	sessionKey: Nullable<AesKey>
}

export type SubKeyInfo = Nullable<
	| SessionKeyInfo
	| {
			cipherVersion: typeof SymmetricCipherVersion.AeadWithGroupKey
			groupKey: Nullable<VersionedKey>
			kdfNonce: Nullable<KdfNonce>
	  }
>

export class SubKeyProvider {
	constructor(
		private readonly subKeyInfo: SubKeyInfo,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly instanceTypeId: InstanceTypeId,
	) {}

	getSubKeys = lazyMemoized(() => {
		if (this.subKeyInfo == null) {
			throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a cipher version and a key!`)
		}
		switch (this.subKeyInfo.cipherVersion) {
			case SymmetricCipherVersion.AesCbcThenHmac: {
				if (this.subKeyInfo.sessionKey == null) {
					throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a session key!`)
				}
				return this.symmetricKeyDeriver.deriveSubKeys(this.subKeyInfo.sessionKey, SymmetricCipherVersion.AesCbcThenHmac) as AesCbcThenHmacSubKeys
			}
			case SymmetricCipherVersion.AeadWithGroupKey: {
				if (this.subKeyInfo.groupKey == null || this.subKeyInfo.kdfNonce == null) {
					throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a group key and KDF nonce!`)
				}
				return this.symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(this.subKeyInfo.groupKey, this.subKeyInfo.kdfNonce, this.instanceTypeId)
			}
			case SymmetricCipherVersion.AeadWithSessionKey: {
				if (this.subKeyInfo.sessionKey == null) {
					throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a session key!`)
				}
				return this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.subKeyInfo.sessionKey, this.instanceTypeId)
			}
		}
	})
}
