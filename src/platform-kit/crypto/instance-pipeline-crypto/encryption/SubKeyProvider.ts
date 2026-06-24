import { lazyMemoized } from "@tutao/utils"
import { CryptoError } from "@tutao/crypto/error"
import { AesCbcThenHmacSubKeys, InstanceTypeId, SymmetricKeyDeriver } from "../../encryption/symmetric/SymmetricKeyDeriver"
import { SymmetricCipherVersion } from "../../encryption/symmetric/SymmetricCipherVersion"
import { ProgrammingError } from "@tutao/app-env"
import { AesKey, KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { VersionedKey } from "../../CryptoTypes"

export abstract class SubKeyInfo {
	protected constructor(public readonly cipherVersion: SymmetricCipherVersion) {}
}

export class SubKeyInfoWithSessionKey extends SubKeyInfo {
	constructor(
		cipherVersion: SymmetricCipherVersion,
		public readonly sessionKey: AesKey,
	) {
		super(cipherVersion)
		if (cipherVersion !== SymmetricCipherVersion.AesCbcThenHmac && cipherVersion !== SymmetricCipherVersion.AeadWithSessionKey) {
			throw new ProgrammingError("non session key cipher version")
		}
	}
}

export class SubKeyInfoWithoutSessionKey extends SubKeyInfo {
	constructor(cipherVersion: SymmetricCipherVersion) {
		super(cipherVersion)
		if (cipherVersion !== SymmetricCipherVersion.AesCbcThenHmac && cipherVersion !== SymmetricCipherVersion.AeadWithSessionKey) {
			throw new ProgrammingError("non session key cipher version")
		}
	}
}

export class SubKeyInfoWithGroupKey extends SubKeyInfo {
	constructor(
		cipherVersion: SymmetricCipherVersion,
		public readonly groupKey: VersionedKey,
		public readonly kdfNonce: KdfNonce,
	) {
		super(cipherVersion)
		if (cipherVersion !== SymmetricCipherVersion.AeadWithGroupKey) throw new ProgrammingError("non GroupKey cipher version")
	}
}

export class SubKeyProvider {
	constructor(
		private readonly subKeyInfo: SubKeyInfo,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly instanceTypeId: InstanceTypeId,
	) {}

	getSubKeys = lazyMemoized(() => {
		switch (this.subKeyInfo.cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
				throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a session key!`)
			case SymmetricCipherVersion.AesCbcThenHmac: {
				if (this.subKeyInfo instanceof SubKeyInfoWithSessionKey) {
					return this.symmetricKeyDeriver.deriveSubKeysAesCbcHmac(this.subKeyInfo.sessionKey) as AesCbcThenHmacSubKeys
				} else {
					throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a session key!`)
				}
			}
			case SymmetricCipherVersion.AeadWithGroupKey: {
				if (this.subKeyInfo instanceof SubKeyInfoWithGroupKey) {
					return this.symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(this.subKeyInfo.groupKey, this.subKeyInfo.kdfNonce, this.instanceTypeId)
				} else {
					throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a group key and KDF nonce!`)
				}
			}
			case SymmetricCipherVersion.AeadWithSessionKey: {
				if (this.subKeyInfo instanceof SubKeyInfoWithSessionKey) {
					return this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.subKeyInfo.sessionKey, this.instanceTypeId)
				} else {
					throw new CryptoError(`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} requires a session key!`)
				}
			}
		}
	})
}
