import { CryptoWrapper, VersionedKey } from "../crypto/CryptoWrapper.js"
import { concat } from "@tutao/tutanota-utils"
import { Aes256Key } from "@tutao/tutanota-crypto"
import { assertWorkerOrNode } from "../../common/Env.js"
import { customIdToUint8array } from "../../common/utils/EntityUtils.js"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"

assertWorkerOrNode()

export class KeyAuthenticationFacade {
	constructor(private readonly cryptoWrapper: CryptoWrapper) {}

	public generateNewUserGroupKeyHash(newUserSymKey: VersionedKey) {
		const versionByte = Uint8Array.from([0])
		const hashData = concat(versionByte, Uint8Array.from([newUserSymKey.version]), Uint8Array.from(newUserSymKey.object))
		return this.cryptoWrapper.sha256Hash(hashData)
	}

	public generateAdminPubKeyHash(adminGroupKeyVersion: number, adminGroupId: string, pubEccKey: Uint8Array, pubKyberKey: Uint8Array) {
		const versionByte = Uint8Array.from([0])
		const adminKeyVersion = Uint8Array.from([adminGroupKeyVersion])
		const identifierType = Uint8Array.from([Number(PublicKeyIdentifierType.GROUP_ID)])
		const identifier = customIdToUint8array(adminGroupId) // also works for generated IDs
		//Format:  versionByte, pubEccKey, pubKyberKey, groupKeyVersion, identifier, identifierType
		const hashData = concat(versionByte, pubEccKey, pubKyberKey, adminKeyVersion, identifier, identifierType)
		return this.cryptoWrapper.sha256Hash(hashData)
	}

	public generatePubDistKeyHash(pubEccKey: Uint8Array, pubKyberKey: Uint8Array) {
		const versionByte = Uint8Array.from([0])
		const hashData = concat(versionByte, pubEccKey, pubKyberKey)
		return this.cryptoWrapper.sha256Hash(hashData)
	}

	public generateAdminSymKeyHash(adminSymKey: VersionedKey) {
		const versionByte = Uint8Array.from([0])
		const hashData = concat(versionByte, Uint8Array.from([adminSymKey.version]), Uint8Array.from(adminSymKey.object))
		return this.cryptoWrapper.sha256Hash(hashData)
	}

	public deriveTargetUserGroupKeyAuthKeyForNewAdminPubKeyHash(userGroupId: Id, userGroupKey: VersionedKey) {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: userGroupId,
			key: userGroupKey.object,
			context: "adminGroupKeyRotationHash",
		})
	}

	public deriveTargetUserGroupKeyAuthKeyForNewAdminSymKeyHash(
		adminGroupId: Id,
		userGroupId: Id,
		userGroupKey: VersionedKey,
		adminGroupKeyVersion: number,
	): Aes256Key {
		// when distributing the new admin group key to other admins we encrypt its hash with the targetUserGroupKeyAuthKey (derived from the recipients user group key)
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, userGroupKeyVersion: ${userGroupKey.version}, adminGroupKeyVersion: ${adminGroupKeyVersion}`,
			key: userGroupKey.object,
			context: "multiAdminKeyRotationNewAdminSymKeyHash",
		})
	}

	public deriveAdminPubDistAuthKey(adminGroupId: Id, userGroupId: Id, adminGroupKey: VersionedKey): Aes256Key {
		// when distributing the public key that will be used to encrypt the new admin group key
		// we authenticate that it comes from another admin with the current admin group key
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, adminGroupKeyVersion: ${adminGroupKey.version}`,
			key: adminGroupKey.object,
			context: "multiAdminKeyRotationPubDistKeyHash",
		})
	}

	public deriveUserRotationNewUserGroupKeyAuthKey(userGroupId: Id, userGroupKey: VersionedKey): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `userGroup: ${userGroupId}, userGroupKeyVersion: ${userGroupKey.version}`,
			key: userGroupKey.object,
			context: "multiUserKeyRotationNewUserSymKeyHash",
		})
	}
}
