import { CryptoWrapper, VersionedKey } from "../crypto/CryptoWrapper.js"
import { concat } from "@tutao/tutanota-utils"
import { Aes256Key, MacTag } from "@tutao/tutanota-crypto"
import { assertWorkerOrNode } from "../../common/Env.js"
import { customIdToUint8array } from "../../common/utils/EntityUtils.js"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyMac } from "../../entities/sys/TypeRefs.js"

assertWorkerOrNode()

/**
 * A system to authenticate some key.
 */
type KeyAuthenticationSystem<T extends KeyAuthenticationParams> = {
	/**
	 * Canonicalizes the data we want to authenticate, i.e., the new key and some binding data, into a byte array.
	 * @param params
	 */
	generateAuthenticationData(params: T): Uint8Array
	/**
	 * Derives the authentication key from a trusted key and some additional binding parameters.
	 * @param params
	 * @param cryptoWrapper
	 */
	deriveKey(params: T, cryptoWrapper: CryptoWrapper): Aes256Key
}

export type UserGroupKeyAuthenticationParams = {
	tagType: "USER_GROUP_KEY_TAG"
	adminSymKey: VersionedKey
	userGroupId: Id
	adminGroupId: Id
	newAdminGroupKeyVersion: number
	currentUserGroupKey: VersionedKey
}

/**
 * Purpose: prove to admins that the new User Group Key is authentic.
 * By deriving this key from the current User Group Key, the admin knows that it was created by someone who had access to this key,
 * that is, either the user or another admin.
 */
const userGroupKeyAuthenticationSystem: KeyAuthenticationSystem<UserGroupKeyAuthenticationParams> = {
	deriveKey({ userGroupId, adminGroupId, newAdminGroupKeyVersion, currentUserGroupKey }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentUserGroupKey.object,
			context: "newUserGroupKeyAuthKeyForRotationAsNonAdminUser",
		})
	},
	generateAuthenticationData({ adminSymKey }) {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, Uint8Array.from([adminSymKey.version]), Uint8Array.from(adminSymKey.object))
	},
}

export type NewAdminPubKeyAuthenticationParams = {
	tagType: "NEW_ADMIN_PUB_KEY_TAG"
	adminGroupKeyVersion: number
	pubEccKey: Uint8Array
	pubKyberKey: Uint8Array
	userGroupId: Id
	adminGroupId: Id
	newAdminGroupKeyVersion: number
	currentUserGroupKey: VersionedKey
}

/**
 * Purpose: prove to users that the new Admin Group Public Key is authentic.
 * By deriving this key from the current User Group Key, the user knows that it was created either by someone who had access to this key,
 * that is, either themselves or an admin.
 */
const newAdminPubKeyAuthenticationSystem: KeyAuthenticationSystem<NewAdminPubKeyAuthenticationParams> = {
	deriveKey({ userGroupId, adminGroupId, newAdminGroupKeyVersion, currentUserGroupKey }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentUserGroupKey.object,
			context: "newAdminPubKeyAuthKeyForUserGroupKeyRotation",
		})
	},
	generateAuthenticationData({ adminGroupKeyVersion, pubEccKey, pubKyberKey, adminGroupId }) {
		const versionByte = Uint8Array.from([0])
		const adminKeyVersion = Uint8Array.from([adminGroupKeyVersion])
		const identifierType = Uint8Array.from([Number(PublicKeyIdentifierType.GROUP_ID)])
		const identifier = customIdToUint8array(adminGroupId) // also works for generated IDs
		//Format:  versionByte, pubEccKey, pubKyberKey, groupKeyVersion, identifier, identifierType
		return concat(versionByte, pubEccKey, pubKyberKey, adminKeyVersion, identifier, identifierType)
	},
}

export type PubDistKeyAuthenticationParams = {
	tagType: "PUB_DIST_KEY_TAG"
	pubEccKey: Uint8Array
	pubKyberKey: Uint8Array
	adminGroupId: Id
	userGroupId: Id
	currentUserGroupKeyVersion: number
	currentAdminGroupKey: VersionedKey
}

/**
 * Purpose: prove to other admins that the Distribution Public Key is authentic.
 * By deriving this key from the current Admin Group Key, the admin knows that it was created by someone who had access to this key,
 * that is, either themselves or another admin.
 */
const pubDistKeyAuthenticationSystem: KeyAuthenticationSystem<PubDistKeyAuthenticationParams> = {
	deriveKey({ adminGroupId, userGroupId, currentUserGroupKeyVersion, currentAdminGroupKey }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKeyVersion}, currentAdminGroupKeyVersion: ${currentAdminGroupKey.version}`,
			key: currentAdminGroupKey.object,
			context: "adminGroupDistKeyPairAuthKeyForMultiAdminRotation",
		})
	},
	generateAuthenticationData({ pubEccKey, pubKyberKey }) {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, pubEccKey, pubKyberKey)
	},
}

export type AdminSymKeyAuthenticationParams = {
	tagType: "ADMIN_SYM_KEY_TAG"
	adminSymKey: VersionedKey
	adminGroupId: Id
	userGroupId: Id
	currentReceivingUserGroupKey: VersionedKey
	newAdminGroupKeyVersion: number
}

/**
 * Purpose: prove to other admins that the new Admin Group Symmetric Key is authentic.
 * By deriving this key from the current User Group Key, the admin user knows that it was created either by someone who had access to this key,
 * that is, either themselves or another admin.
 */
const adminSymKeyAuthenticationSystem: KeyAuthenticationSystem<AdminSymKeyAuthenticationParams> = {
	deriveKey({ adminGroupId, userGroupId, currentReceivingUserGroupKey, newAdminGroupKeyVersion }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentReceivingUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentReceivingUserGroupKey.object,
			context: "newAdminSymKeyAuthKeyForMultiAdminRotationAsUser",
		})
	},
	generateAuthenticationData({ adminSymKey }) {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, Uint8Array.from([adminSymKey.version]), Uint8Array.from(adminSymKey.object))
	},
}

export type KeyAuthenticationParams =
	| UserGroupKeyAuthenticationParams
	| NewAdminPubKeyAuthenticationParams
	| PubDistKeyAuthenticationParams
	| AdminSymKeyAuthenticationParams

const systemMap = {
	USER_GROUP_KEY_TAG: userGroupKeyAuthenticationSystem,
	NEW_ADMIN_PUB_KEY_TAG: newAdminPubKeyAuthenticationSystem,
	PUB_DIST_KEY_TAG: pubDistKeyAuthenticationSystem,
	ADMIN_SYM_KEY_TAG: adminSymKeyAuthenticationSystem,
}

/**
 * Authenticates keys by deriving trust in another key using a Message Authentication Code (MAC tag).
 */
export class KeyAuthenticationFacade {
	constructor(private readonly cryptoWrapper: CryptoWrapper) {}

	/**
	 * Computes a MAC tag using an existing key authentication system.
	 * @param keyAuthenticationParams Parameters for the chosen key authentication system, containing trusted key, key to be verified, and binding data
	 */
	public computeTag(keyAuthenticationParams: KeyAuthenticationParams): MacTag {
		const keyAuthenticationSystem: KeyAuthenticationSystem<KeyAuthenticationParams> = systemMap[keyAuthenticationParams.tagType]
		const authKey = keyAuthenticationSystem.deriveKey(keyAuthenticationParams, this.cryptoWrapper)
		const authData = keyAuthenticationSystem.generateAuthenticationData(keyAuthenticationParams)
		return this.cryptoWrapper.hmacSha256(authKey, authData)
	}

	/**
	 * Verifies a MAC tag using an existing key authentication system.
	 * @param keyAuthenticationParams Parameters for the chosen key authentication system, containing trusted key, key to be verified, and binding data
	 * @param tag The MAC tag to be verified. Must be a branded MacTag, which you can get with brandKeyMac() in most cases
	 */
	public verifyTag(keyAuthenticationParams: KeyAuthenticationParams, tag: MacTag): void {
		const keyAuthenticationSystem: KeyAuthenticationSystem<KeyAuthenticationParams> = systemMap[keyAuthenticationParams.tagType]
		const authKey = keyAuthenticationSystem.deriveKey(keyAuthenticationParams, this.cryptoWrapper)
		const authData = keyAuthenticationSystem.generateAuthenticationData(keyAuthenticationParams)
		this.cryptoWrapper.verifyHmacSha256(authKey, authData, tag)
	}
}

type BrandedKeyMac = Omit<KeyMac, "mac"> & { tag: MacTag }

/**
 * Brands a KeyMac so that it has a branded MacTag, which can be used in authentication methods.
 */
export function brandKeyMac(keyMac: KeyMac): BrandedKeyMac {
	return keyMac as BrandedKeyMac
}
