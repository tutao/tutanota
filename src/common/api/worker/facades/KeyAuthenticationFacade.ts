import { CryptoWrapper, VersionedKey } from "../crypto/CryptoWrapper.js"
import { concat } from "@tutao/tutanota-utils"
import { Aes256Key, MacTag } from "@tutao/tutanota-crypto"
import { assertWorkerOrNode } from "../../common/Env.js"
import { customIdToUint8array } from "../../common/utils/EntityUtils.js"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyMac } from "../../entities/sys/TypeRefs.js"

assertWorkerOrNode()

export class KeyAuthenticationFacade {
	constructor(private readonly cryptoWrapper: CryptoWrapper) {}

	public generateNewUserGroupKeyAuthenticationData(newUserSymKey: VersionedKey) {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, Uint8Array.from([newUserSymKey.version]), Uint8Array.from(newUserSymKey.object))
	}

	public generateAdminPubKeyAuthenticationData(adminGroupKeyVersion: number, adminGroupId: string, pubEccKey: Uint8Array, pubKyberKey: Uint8Array) {
		const versionByte = Uint8Array.from([0])
		const adminKeyVersion = Uint8Array.from([adminGroupKeyVersion])
		const identifierType = Uint8Array.from([Number(PublicKeyIdentifierType.GROUP_ID)])
		const identifier = customIdToUint8array(adminGroupId) // also works for generated IDs
		//Format:  versionByte, pubEccKey, pubKyberKey, groupKeyVersion, identifier, identifierType
		return concat(versionByte, pubEccKey, pubKyberKey, adminKeyVersion, identifier, identifierType)
	}

	public generatePubDistKeyAuthenticationData(pubEccKey: Uint8Array, pubKyberKey: Uint8Array) {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, pubEccKey, pubKyberKey)
	}

	public generateAdminSymKeyAuthenticationData(adminSymKey: VersionedKey) {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, Uint8Array.from([adminSymKey.version]), Uint8Array.from(adminSymKey.object))
	}

	/**
	 * Purpose: prove to users that the new Admin Group Public Key is authentic.
	 * By deriving this key from the current User Group Key, the user knows that it was created either by someone who had access to this key,
	 * that is, either themselves or an admin.
	 */
	deriveNewAdminPubKeyAuthKeyForUserGroupKeyRotation(
		userGroupId: Id,
		adminGroupId: Id,
		newAdminGroupKeyVersion: number,
		currentUserGroupKey: VersionedKey,
	): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentUserGroupKey.object,
			context: "newAdminPubKeyAuthKeyForUserGroupKeyRotation",
		})
	}

	/**
	 * Purpose: prove to other admins that the new Admin Group Symmetric Key is authentic.
	 * By deriving this key from the current User Group Key, the admin user knows that it was created either by someone who had access to this key,
	 * that is, either themselves or another admin.
	 */
	deriveNewAdminSymKeyAuthKeyForMultiAdminRotationAsUser(
		adminGroupId: Id,
		userGroupId: Id,
		currentReceivingUserGroupKey: VersionedKey,
		newAdminGroupKeyVersion: number,
	): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentReceivingUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentReceivingUserGroupKey.object,
			context: "newAdminSymKeyAuthKeyForMultiAdminRotationAsUser",
		})
	}

	/**
	 * Purpose: prove to other admins that the Distribution Public Key is authentic.
	 * By deriving this key from the current Admin Group Key, the admin knows that it was created by someone who had access to this key,
	 * that is, either themselves or another admin.
	 */
	deriveAdminGroupDistKeyPairAuthKeyForMultiAdminRotation(
		adminGroupId: Id,
		userGroupId: Id,
		currentUserGroupKeyVersion: number,
		currentAdminGroupKey: VersionedKey,
	): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKeyVersion}, currentAdminGroupKeyVersion: ${currentAdminGroupKey.version}`,
			key: currentAdminGroupKey.object,
			context: "adminGroupDistKeyPairAuthKeyForMultiAdminRotation",
		})
	}

	/**
	 * Purpose: prove to admins that the new User Group Key is authentic.
	 * By deriving this key from the current User Group Key, the admin knows that it was created by someone who had access to this key,
	 * that is, either the user or another admin.
	 */
	deriveNewUserGroupKeyAuthKeyForRotationAsNonAdminUser(
		userGroupId: Id,
		adminGroupId: Id,
		newAdminGroupKeyVersion: number,
		currentUserGroupKey: VersionedKey,
	): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentUserGroupKey.object,
			context: "newUserGroupKeyAuthKeyForRotationAsNonAdminUser",
		})
	}
}

type BrandedKeyMac = Omit<KeyMac, "mac"> & { tag: MacTag }

export function brandKeyMac(keyMac: KeyMac): BrandedKeyMac {
	return keyMac as BrandedKeyMac
}
