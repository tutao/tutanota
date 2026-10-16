import { AesKey, KeyEncryption, VersionedKey } from "@tutao/crypto"

export class SessionKeyDecryptor {
	constructor(
		private readonly ownerKey: VersionedKey,
		private readonly keyEncryption: KeyEncryption,
	) {}

	decryptSessionKey(ownerEncSessionKey: Uint8Array<ArrayBuffer>): AesKey {
		return this.keyEncryption.decryptKey(this.ownerKey.object, ownerEncSessionKey)
	}
}
