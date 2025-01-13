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

	/**
	 * When sharing the new admin public key to other users we encrypt its public key hash with this auth key derived from the recipients user group key
	 * it should prove to the recipient that the new admin group key comes from a valid admin since only admin have access to their user group key
	 * and is safe to use for whatever use case (ex: encrypting their new user group key and share it with the admin)
	 *
	 * @param userGroupId user group id of the user that will use this new admin public key
	 * @param userGroupKey user group key of the user that will use this new admin public key
	 */
	public deriveAdminGroupAuthKeyForNewAdminPubKeyHash(userGroupId: Id, userGroupKey: VersionedKey) {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: userGroupId,
			key: userGroupKey.object,
			context: "adminGroupKeyRotationHash",
		})
	}

	/**
	 * When distributing the new admin group key to other admins we encrypt its symetric hash with this auth key derived from the recipient admin user group key
	 * it should prove to the recipient admin that the new admin group key comes from another admin since only admin have access to their user group key
	 *
	 * @param adminGroupId group id of the admin group from which both user belongs to
	 * @param userGroupId user group id of the admin user that will receive the new admin group key
	 * @param userGroupKey user group key of the admin user that will receive the new admin group key
	 * @param newAdminGroupKeyVersion version of the new admin group key being shared
	 */
	public deriveAdminGroupAuthKeyForNewAdminSymKeyHash(
		adminGroupId: Id,
		userGroupId: Id,
		userGroupKey: VersionedKey,
		newAdminGroupKeyVersion: number,
	): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, userGroupKeyVersion: ${userGroupKey.version}, adminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: userGroupKey.object,
			context: "multiAdminKeyRotationNewAdminSymKeyHash",
		})
	}

	/**
	 *
	 * Derives the adminDistAuthKey that is used to prove that an adminDistKey belongs to an admin of the customer.
	 * In the multi admin group key rotation scenario, each admin generates a distribution key pair that can be used to distributes
	 * a new admin group key.
	 * This function generates an AuthKey that authenticate the hash of the public key of this new distribution key pair.
	 * This proves to the admin performing the rotation and distributing the new admin group key that this distribution key is safe to use and encrypt
	 * the new admin group key.
	 *
	 * @param adminGroupId group id of the AdminGroup of the customer
	 * @param userGroupId user group id of the admin that have created the distribution key
	 * @param adminGroupKey the current admin group key, source of the derivation
	 */
	public deriveAdminDistAuthKey(adminGroupId: Id, userGroupId: Id, adminGroupKey: VersionedKey): Aes256Key {
		// when distributing the public key that will be used to encrypt the new admin group key
		// we authenticate that it comes from another admin with the current admin group key
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, adminGroupKeyVersion: ${adminGroupKey.version}`,
			key: adminGroupKey.object,
			context: "multiAdminKeyRotationPubDistKeyHash",
		})
	}

	/**
	 * Derives a auth key that prove that the user had access to the previous user group key
	 * when sharing his new user group key.
	 *
	 * @param userGroupId user group id of the user sharing the new user group key
	 * @param userGroupKey current user group key of the user sharing the new user group key
	 */
	public deriveUserGroupAuthKey(userGroupId: Id, userGroupKey: VersionedKey): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `userGroup: ${userGroupId}, userGroupKeyVersion: ${userGroupKey.version}`,
			key: userGroupKey.object,
			context: "multiUserKeyRotationNewUserSymKeyHash",
		})
	}
}
