import { AesKey, decryptKey, VersionedKey } from "@tutao/crypto"

export class SessionKeyDecryptor {
	constructor(private readonly ownerKey: VersionedKey) {}

	decryptSessionKey(ownerEncSessionKey: Uint8Array<ArrayBuffer>): AesKey {
		return decryptKey(this.ownerKey.object, ownerEncSessionKey)
	}
}
