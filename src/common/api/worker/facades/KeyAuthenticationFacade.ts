import { CryptoWrapper, VersionedKey } from "../crypto/CryptoWrapper.js"
import { concat } from "@tutao/tutanota-utils"
import { Aes256Key, MacTag } from "@tutao/tutanota-crypto"
import { assertWorkerOrNode } from "../../common/Env.js"
import { customIdToUint8array } from "../../common/utils/EntityUtils.js"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyMac } from "../../entities/sys/TypeRefs.js"
import { ProgrammingError } from "../../common/error/ProgrammingError"

assertWorkerOrNode()

type KeyAuthenticationSystem<T extends KeyAuthenticationParams> = {
	generateAuthenticationData(params: T): Uint8Array
	deriveKey(params: T, cryptoWrapper: CryptoWrapper): Aes256Key
}

type UserGroupKeyAuthenticationParams = {
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
	deriveKey(
		{ userGroupId, adminGroupId, newAdminGroupKeyVersion, currentUserGroupKey }: UserGroupKeyAuthenticationParams,
		cryptoWrapper: CryptoWrapper,
	): Aes256Key {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentUserGroupKey.object,
			context: "newUserGroupKeyAuthKeyForRotationAsNonAdminUser",
		})
	},
	generateAuthenticationData({ adminSymKey }: UserGroupKeyAuthenticationParams): Uint8Array {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, Uint8Array.from([adminSymKey.version]), Uint8Array.from(adminSymKey.object))
	},
}

type NewAdminPubKeyAuthenticationParams = {
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
	deriveKey(
		{ userGroupId, adminGroupId, newAdminGroupKeyVersion, currentUserGroupKey }: NewAdminPubKeyAuthenticationParams,
		cryptoWrapper: CryptoWrapper,
	): Aes256Key {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKey.version}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: currentUserGroupKey.object,
			context: "newAdminPubKeyAuthKeyForUserGroupKeyRotation",
		})
	},
	generateAuthenticationData({ adminGroupKeyVersion, pubEccKey, pubKyberKey, adminGroupId }: NewAdminPubKeyAuthenticationParams): Uint8Array {
		const versionByte = Uint8Array.from([0])
		const adminKeyVersion = Uint8Array.from([adminGroupKeyVersion])
		const identifierType = Uint8Array.from([Number(PublicKeyIdentifierType.GROUP_ID)])
		const identifier = customIdToUint8array(adminGroupId) // also works for generated IDs
		//Format:  versionByte, pubEccKey, pubKyberKey, groupKeyVersion, identifier, identifierType
		return concat(versionByte, pubEccKey, pubKyberKey, adminKeyVersion, identifier, identifierType)
	},
}

type PubDistKeyAuthenticationParams = {
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
	deriveKey(
		{ adminGroupId, userGroupId, currentUserGroupKeyVersion, currentAdminGroupKey }: PubDistKeyAuthenticationParams,
		cryptoWrapper: CryptoWrapper,
	): Aes256Key {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKeyVersion}, currentAdminGroupKeyVersion: ${currentAdminGroupKey.version}`,
			key: currentAdminGroupKey.object,
			context: "adminGroupDistKeyPairAuthKeyForMultiAdminRotation",
		})
	},
	generateAuthenticationData({ pubEccKey, pubKyberKey }: PubDistKeyAuthenticationParams): Uint8Array {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, pubEccKey, pubKyberKey)
	},
}

type AdminSymKeyAuthenticationParams = {
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
	generateAuthenticationData({ adminSymKey }: AdminSymKeyAuthenticationParams): Uint8Array {
		const versionByte = Uint8Array.from([0])
		return concat(versionByte, Uint8Array.from([adminSymKey.version]), Uint8Array.from(adminSymKey.object))
	},
}

type KeyAuthenticationParams =
	| UserGroupKeyAuthenticationParams
	| NewAdminPubKeyAuthenticationParams
	| PubDistKeyAuthenticationParams
	| AdminSymKeyAuthenticationParams

function selectKeyAuthenticationSystem(keyAuthenticationParams: KeyAuthenticationParams): KeyAuthenticationSystem<KeyAuthenticationParams> {
	switch (keyAuthenticationParams.tagType) {
		case "USER_GROUP_KEY_TAG":
			return userGroupKeyAuthenticationSystem
		case "NEW_ADMIN_PUB_KEY_TAG":
			return newAdminPubKeyAuthenticationSystem
		case "PUB_DIST_KEY_TAG":
			return pubDistKeyAuthenticationSystem
		case "ADMIN_SYM_KEY_TAG":
			return adminSymKeyAuthenticationSystem
		default:
			const exhaustiveCheck: never = keyAuthenticationParams
			throw new ProgrammingError(exhaustiveCheck)
	}
}

export class KeyAuthenticationFacade {
	constructor(private readonly cryptoWrapper: CryptoWrapper) {}

	public computeTag(keyAuthenticationParams: KeyAuthenticationParams): MacTag {
		const keyAuthenticationSystem = selectKeyAuthenticationSystem(keyAuthenticationParams)
		const authKey = keyAuthenticationSystem.deriveKey(keyAuthenticationParams, this.cryptoWrapper)
		const authData = keyAuthenticationSystem.generateAuthenticationData(keyAuthenticationParams)
		const tag = this.cryptoWrapper.hmacSha256(authKey, authData)
		return tag
	}

	public verifyTag(keyAuthenticationParams: KeyAuthenticationParams, tag: MacTag): void {
		const keyAuthenticationSystem = selectKeyAuthenticationSystem(keyAuthenticationParams)
		const authKey = keyAuthenticationSystem.deriveKey(keyAuthenticationParams, this.cryptoWrapper)
		const authData = keyAuthenticationSystem.generateAuthenticationData(keyAuthenticationParams)
		this.cryptoWrapper.verifyHmacSha256(authKey, authData, tag)
	}
}

type BrandedKeyMac = Omit<KeyMac, "mac"> & { tag: MacTag }

export function brandKeyMac(keyMac: KeyMac): BrandedKeyMac {
	return keyMac as BrandedKeyMac
}
