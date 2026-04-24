import { lazyMemoized, Nullable } from "@tutao/utils"
import { AesCbcThenHmacSubKeys, AesKey, InstanceTypeId, KdfNonce, SymmetricCipherVersion, SymmetricKeyDeriver, VersionedKey } from "@tutao/crypto"
import { CryptoError } from "@tutao/crypto/error"
import { ClientTypeModel } from "@tutao/meta"

export type SubKeyInfo = Nullable<
	| {
			cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac | typeof SymmetricCipherVersion.AeadWithSessionKey
			sessionKey: Nullable<AesKey>
	  }
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
		private readonly clientTypeModel: ClientTypeModel,
	) {}

	getSubKeys = lazyMemoized(() => {
		if (this.subKeyInfo == null) {
			throw new CryptoError(`Encrypting ${this.clientTypeModel.app}/${this.clientTypeModel.name} requires a cipher version and a key!`)
		}
		switch (this.subKeyInfo.cipherVersion) {
			case SymmetricCipherVersion.AesCbcThenHmac: {
				if (this.subKeyInfo.sessionKey == null) {
					throw new CryptoError(`Encrypting ${this.clientTypeModel.app}/${this.clientTypeModel.name} requires a session key!`)
				}
				return this.symmetricKeyDeriver.deriveSubKeys(this.subKeyInfo.sessionKey, SymmetricCipherVersion.AesCbcThenHmac) as AesCbcThenHmacSubKeys
			}
			case SymmetricCipherVersion.AeadWithGroupKey: {
				if (this.subKeyInfo.groupKey == null || this.subKeyInfo.kdfNonce == null) {
					throw new CryptoError(`Encrypting ${this.clientTypeModel.app}/${this.clientTypeModel.name} requires a group key and KDF nonce!`)
				}
				const instanceTypeId: InstanceTypeId = {
					applicationName: this.clientTypeModel.app,
					typeId: this.clientTypeModel.id,
				}
				return this.symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(this.subKeyInfo.groupKey, this.subKeyInfo.kdfNonce, instanceTypeId)
			}
			case SymmetricCipherVersion.AeadWithSessionKey: {
				if (this.subKeyInfo.sessionKey == null) {
					throw new CryptoError(`Encrypting ${this.clientTypeModel.app}/${this.clientTypeModel.name} requires a session key!`)
				}
				const instanceTypeId: InstanceTypeId = {
					applicationName: this.clientTypeModel.app,
					typeId: this.clientTypeModel.id,
				}
				return this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.subKeyInfo.sessionKey, instanceTypeId)
			}
		}
	})
}
