import { lazyMemoized, Nullable } from "@tutao/utils"
import { InstanceTypeId, SymmetricKeyDeriver, SymmetricSubKeys } from "../../encryption/symmetric/SymmetricKeyDeriver"
import { SymmetricCipherVersion } from "../../encryption/symmetric/SymmetricCipherVersion"
import { KdfNonce } from "../../encryption/symmetric/SymmetricCipherUtils"
import { VersionedKey } from "../../CryptoTypes"
import { ProgrammingError } from "@tutao/app-env"
import { AesKey } from "../../encryption/symmetric/AesKey"

/**
 * Dummy class that can either hold SubKeyInfo or SubKeyProvider. As both are suitable to get the actual subkeys.
 */
export abstract class SubKeyFactory {}

export abstract class SubKeyInfo extends SubKeyFactory {
	public abstract readonly cipherVersion: SymmetricCipherVersion
	protected constructor() {
		super()
	}
}

abstract class SubKeyInfoWithSessionKey extends SubKeyInfo {
	protected constructor(public readonly sessionKey: AesKey) {
		super()
	}
}

export class SubKeyInfoWithSessionKeyCbcThenHmac extends SubKeyInfoWithSessionKey {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac = SymmetricCipherVersion.AesCbcThenHmac
	constructor(sessionKey: AesKey) {
		super(sessionKey)
	}
}

export class SubKeyInfoWithSessionKeyAead extends SubKeyInfoWithSessionKey {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.AeadWithSessionKey = SymmetricCipherVersion.AeadWithSessionKey
	constructor(sessionKey: AesKey) {
		super(sessionKey)
	}
}

export class SubKeyInfoWithGroupKeyAead extends SubKeyInfo {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.AeadWithGroupKey = SymmetricCipherVersion.AeadWithGroupKey
	constructor(
		public readonly groupKey: VersionedKey,
		public readonly kdfNonce: KdfNonce,
	) {
		super()
	}
}

export class SubKeyProvider extends SubKeyFactory {
	private readonly subKeyInfo: SubKeyInfo
	constructor(
		subKeyFactory: SubKeyFactory,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly instanceTypeId: InstanceTypeId,
	) {
		super()
		if (subKeyFactory instanceof SubKeyInfo) {
			this.subKeyInfo = subKeyFactory
		} else if (subKeyFactory instanceof SubKeyProvider) {
			this.subKeyInfo = subKeyFactory.subKeyInfo
		} else {
			throw new ProgrammingError("unexpected sub-key factory")
		}
	}

	getSubKeys = lazyMemoized((): SymmetricSubKeys => {
		switch (this.subKeyInfo.cipherVersion) {
			case SymmetricCipherVersion.AesCbcThenHmac: {
				if (this.subKeyInfo instanceof SubKeyInfoWithSessionKeyCbcThenHmac) {
					return this.symmetricKeyDeriver.deriveSubKeysAesCbc(this.subKeyInfo.sessionKey, this.subKeyInfo.cipherVersion)
				}
				break
			}
			case SymmetricCipherVersion.AeadWithGroupKey: {
				if (this.subKeyInfo instanceof SubKeyInfoWithGroupKeyAead) {
					return this.symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(this.subKeyInfo.groupKey, this.subKeyInfo.kdfNonce, this.instanceTypeId)
				}
				break
			}
			case SymmetricCipherVersion.AeadWithSessionKey: {
				if (this.subKeyInfo instanceof SubKeyInfoWithSessionKeyAead) {
					return this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.subKeyInfo.sessionKey, this.instanceTypeId)
				}
				break
			}
		}
		throw new ProgrammingError(
			`Encrypting ${this.instanceTypeId.app}/${this.instanceTypeId.name} with wrong subKeyInfo or with unsupported cipher version ${this.subKeyInfo.cipherVersion}`,
		)
	})
}

export function makeNullableSubKeyInfoWithSessionKeyCbcThenHmac(sessionKey: AesKey | null): Nullable<SubKeyInfoWithSessionKeyCbcThenHmac> {
	if (sessionKey != null) {
		return new SubKeyInfoWithSessionKeyCbcThenHmac(sessionKey)
	} else {
		return null
	}
}
