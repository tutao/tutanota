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

type PubDistKeyAuthenticationParams = {
	tagType: "PUB_DIST_KEY_TAG"
	pubEccKey: Uint8Array
	pubKyberKey: Uint8Array
	adminGroupId: Id
	userGroupId: Id
	currentUserGroupKeyVersion: number
	currentAdminGroupKey: VersionedKey
}

type AdminSymKeyAuthenticationParams = {
	tagType: "ADMIN_SYM_KEY_TAG"
	adminSymKey: VersionedKey
	adminGroupId: Id
	userGroupId: Id
	currentReceivingUserGroupKey: VersionedKey
	newAdminGroupKeyVersion: number
}

type KeyAuthenticationParams =
	| UserGroupKeyAuthenticationParams
	| NewAdminPubKeyAuthenticationParams
	| PubDistKeyAuthenticationParams
	| AdminSymKeyAuthenticationParams

export class KeyAuthenticationFacade {
	constructor(private readonly cryptoWrapper: CryptoWrapper) {}

	public computeTag(keyAuthenticationParams: KeyAuthenticationParams): MacTag {
		let authKey: Aes256Key
		let authData: Uint8Array
		if (keyAuthenticationParams.tagType === "USER_GROUP_KEY_TAG") {
			authData = userGroupKeyAuthenticationSystem.generateAuthenticationData(keyAuthenticationParams)
			authKey = userGroupKeyAuthenticationSystem.deriveKey(keyAuthenticationParams, this.cryptoWrapper)
		} else if (keyAuthenticationParams.tagType === "NEW_ADMIN_PUB_KEY_TAG") {
			return this.computeNewAdminPubKeyTag(keyAuthenticationParams)
		} else if (keyAuthenticationParams.tagType === "PUB_DIST_KEY_TAG") {
			return this.computePubDistKeyTag(keyAuthenticationParams)
		} else if (keyAuthenticationParams.tagType === "ADMIN_SYM_KEY_TAG") {
			return this.computeAdminSymKeyTag(keyAuthenticationParams)
		} else {
			const exhaustiveCheck: never = keyAuthenticationParams
			throw new ProgrammingError(exhaustiveCheck)
		}
		const tag = this.cryptoWrapper.hmacSha256(authKey, authData)
		return tag
	}

	public verifyTag(keyAuthenticationParams: KeyAuthenticationParams, tag: MacTag): void {
		let authKey: Aes256Key
		let authData: Uint8Array
		if (keyAuthenticationParams.tagType === "USER_GROUP_KEY_TAG") {
			authData = userGroupKeyAuthenticationSystem.generateAuthenticationData(keyAuthenticationParams)
			authKey = userGroupKeyAuthenticationSystem.deriveKey(keyAuthenticationParams, this.cryptoWrapper)
		} else if (keyAuthenticationParams.tagType === "NEW_ADMIN_PUB_KEY_TAG") {
			this.verifyNewAdminPubKeyTag(keyAuthenticationParams, tag)
			return
		} else if (keyAuthenticationParams.tagType === "PUB_DIST_KEY_TAG") {
			this.verifyPubDistKeyTag(keyAuthenticationParams, tag)
			return
		} else if (keyAuthenticationParams.tagType === "ADMIN_SYM_KEY_TAG") {
			this.verifyAdminSymKeyTag(keyAuthenticationParams, tag)
			return
		} else {
			const exhaustiveCheck: never = keyAuthenticationParams
			throw new ProgrammingError(exhaustiveCheck)
		}

		this.cryptoWrapper.verifyHmacSha256(authKey, authData, tag)
	}

	private computeNewAdminPubKeyTag({
		adminGroupKeyVersion,
		pubEccKey,
		pubKyberKey,
		userGroupId,
		adminGroupId,
		newAdminGroupKeyVersion,
		currentUserGroupKey,
	}: NewAdminPubKeyAuthenticationParams): MacTag {
		const adminPubKeyAuthenticationData = this.generateAdminPubKeyAuthenticationData(adminGroupKeyVersion, adminGroupId, pubEccKey, pubKyberKey)
		const newAdminPubKeyAuthKey = this.deriveNewAdminPubKeyAuthKeyForUserGroupKeyRotation(
			userGroupId,
			adminGroupId,
			newAdminGroupKeyVersion,
			currentUserGroupKey,
		)
		const tag = this.cryptoWrapper.hmacSha256(newAdminPubKeyAuthKey, adminPubKeyAuthenticationData)
		return tag
	}

	private verifyNewAdminPubKeyTag(
		{
			adminGroupKeyVersion,
			pubEccKey,
			pubKyberKey,
			userGroupId,
			adminGroupId,
			newAdminGroupKeyVersion,
			currentUserGroupKey,
		}: NewAdminPubKeyAuthenticationParams,
		tag: MacTag,
	): void {
		const adminPubKeyAuthenticationData = this.generateAdminPubKeyAuthenticationData(adminGroupKeyVersion, adminGroupId, pubEccKey, pubKyberKey)
		const newAdminPubKeyAuthKey = this.deriveNewAdminPubKeyAuthKeyForUserGroupKeyRotation(
			userGroupId,
			adminGroupId,
			newAdminGroupKeyVersion,
			currentUserGroupKey,
		)
		this.cryptoWrapper.verifyHmacSha256(newAdminPubKeyAuthKey, adminPubKeyAuthenticationData, tag)
	}

	private computePubDistKeyTag({
		pubEccKey,
		pubKyberKey,
		adminGroupId,
		userGroupId,
		currentUserGroupKeyVersion,
		currentAdminGroupKey,
	}: PubDistKeyAuthenticationParams): MacTag {
		const pubDistKeyAuthenticationData = this.generatePubDistKeyAuthenticationData(pubEccKey, pubKyberKey)
		const adminDistAuthKey = this.deriveAdminGroupDistKeyPairAuthKeyForMultiAdminRotation(
			adminGroupId,
			userGroupId,
			currentUserGroupKeyVersion,
			currentAdminGroupKey,
		)
		const tag = this.cryptoWrapper.hmacSha256(adminDistAuthKey, pubDistKeyAuthenticationData)
		return tag
	}

	private verifyPubDistKeyTag(
		{ pubEccKey, pubKyberKey, adminGroupId, userGroupId, currentUserGroupKeyVersion, currentAdminGroupKey }: PubDistKeyAuthenticationParams,
		tag: MacTag,
	) {
		const pubDistKeyAuthenticationData = this.generatePubDistKeyAuthenticationData(pubEccKey, pubKyberKey)
		const adminDistAuthKey = this.deriveAdminGroupDistKeyPairAuthKeyForMultiAdminRotation(
			adminGroupId,
			userGroupId,
			currentUserGroupKeyVersion,
			currentAdminGroupKey,
		)
		this.cryptoWrapper.verifyHmacSha256(adminDistAuthKey, pubDistKeyAuthenticationData, tag)
	}

	private computeAdminSymKeyTag({
		adminSymKey,
		adminGroupId,
		userGroupId,
		currentReceivingUserGroupKey,
		newAdminGroupKeyVersion,
	}: AdminSymKeyAuthenticationParams): MacTag {
		const computedNewAdminSymKeyAuthenticationData = this.generateAdminSymKeyAuthenticationData(adminSymKey)
		const adminGroupAuthKey = this.deriveNewAdminSymKeyAuthKeyForMultiAdminRotationAsUser(
			adminGroupId,
			userGroupId,
			currentReceivingUserGroupKey,
			newAdminGroupKeyVersion,
		)
		const tag = this.cryptoWrapper.hmacSha256(adminGroupAuthKey, computedNewAdminSymKeyAuthenticationData)
		return tag
	}

	private verifyAdminSymKeyTag(
		{ adminSymKey, adminGroupId, userGroupId, currentReceivingUserGroupKey, newAdminGroupKeyVersion }: AdminSymKeyAuthenticationParams,
		tag: MacTag,
	): void {
		const computedNewAdminSymKeyAuthenticationData = this.generateAdminSymKeyAuthenticationData(adminSymKey)
		const adminGroupAuthKey = this.deriveNewAdminSymKeyAuthKeyForMultiAdminRotationAsUser(
			adminGroupId,
			userGroupId,
			currentReceivingUserGroupKey,
			newAdminGroupKeyVersion,
		)
		this.cryptoWrapper.verifyHmacSha256(adminGroupAuthKey, computedNewAdminSymKeyAuthenticationData, tag)
	}

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
}

type BrandedKeyMac = Omit<KeyMac, "mac"> & { tag: MacTag }

export function brandKeyMac(keyMac: KeyMac): BrandedKeyMac {
	return keyMac as BrandedKeyMac
}
