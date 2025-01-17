import { CryptoWrapper, VersionedKey } from "../crypto/CryptoWrapper.js"
import { concat } from "@tutao/tutanota-utils"
import { Aes256Key, MacTag } from "@tutao/tutanota-crypto"
import { assertWorkerOrNode } from "../../common/Env.js"
import { customIdToUint8array } from "../../common/utils/EntityUtils.js"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyMac } from "../../entities/sys/TypeRefs.js"
import { ProgrammingError } from "../../common/error/ProgrammingError"

assertWorkerOrNode()

export type UserGroupKeyAuthenticationParams = {
	tagType: "USER_GROUP_KEY_TAG"
	adminSymKey: VersionedKey
	userGroupId: Id
	adminGroupId: Id
	newAdminGroupKeyVersion: number
	currentUserGroupKey: VersionedKey
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

export type KeyAuthenticationParams = UserGroupKeyAuthenticationParams | NewAdminPubKeyAuthenticationParams

export class KeyAuthenticationFacade {
	constructor(private readonly cryptoWrapper: CryptoWrapper) {}

	public computeTag(keyAuthenticationParams: KeyAuthenticationParams): MacTag {
		if (keyAuthenticationParams.tagType === "USER_GROUP_KEY_TAG") {
			return this.computeNewUserGroupKeyTag(keyAuthenticationParams)
		} else if (keyAuthenticationParams.tagType === "NEW_ADMIN_PUB_KEY_TAG") {
			return this.computeNewAdminPubKeyTag(keyAuthenticationParams)
		} else {
			const exhaustiveCheck: never = keyAuthenticationParams
			throw new ProgrammingError(exhaustiveCheck)
		}
	}

	public verifyTag(keyAuthenticationParams: KeyAuthenticationParams, tag: MacTag): void {
		if (keyAuthenticationParams.tagType === "USER_GROUP_KEY_TAG") {
			this.verifyNewUserGroupKeyTag(keyAuthenticationParams, tag)
		} else if (keyAuthenticationParams.tagType === "NEW_ADMIN_PUB_KEY_TAG") {
			this.verifyNewAdminPubKeyTag(keyAuthenticationParams, tag)
		} else {
			const exhaustiveCheck: never = keyAuthenticationParams
			throw new ProgrammingError(exhaustiveCheck)
		}
	}

	public computeNewUserGroupKeyTag({
		adminSymKey,
		userGroupId,
		adminGroupId,
		newAdminGroupKeyVersion,
		currentUserGroupKey,
	}: UserGroupKeyAuthenticationParams): MacTag {
		const newUserGroupKeyAuthenticationData = this.generateNewUserGroupKeyAuthenticationData(adminSymKey)
		const userRotationNewUserGroupKeyAuthKey = this.deriveNewUserGroupKeyAuthKeyForRotationAsNonAdminUser(
			userGroupId,
			adminGroupId,
			newAdminGroupKeyVersion,
			currentUserGroupKey,
		)
		const tag = this.cryptoWrapper.hmacSha256(userRotationNewUserGroupKeyAuthKey, newUserGroupKeyAuthenticationData)
		return tag
	}

	public verifyNewUserGroupKeyTag(
		{ adminSymKey, userGroupId, adminGroupId, newAdminGroupKeyVersion, currentUserGroupKey }: UserGroupKeyAuthenticationParams,
		tag: MacTag,
	): void {
		const newUserGroupKeyAuthenticationData = this.generateNewUserGroupKeyAuthenticationData(adminSymKey)
		const userRotationNewUserGroupKeyAuthKey = this.deriveNewUserGroupKeyAuthKeyForRotationAsNonAdminUser(
			userGroupId,
			adminGroupId,
			newAdminGroupKeyVersion,
			currentUserGroupKey,
		)
		this.cryptoWrapper.verifyHmacSha256(userRotationNewUserGroupKeyAuthKey, newUserGroupKeyAuthenticationData, tag)
	}

	public computeNewAdminPubKeyTag({
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

	public verifyNewAdminPubKeyTag(
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

	public computePubDistKeyTag(
		pubEccKey: Uint8Array,
		pubKyberKey: Uint8Array,
		adminGroupId: Id,
		userGroupId: Id,
		currentUserGroupKeyVersion: number,
		currentAdminGroupKey: VersionedKey,
	): MacTag {
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

	public verifyPubDistKeyTag(
		pubEccKey: Uint8Array,
		pubKyberKey: Uint8Array,
		adminGroupId: Id,
		userGroupId: Id,
		currentUserGroupKeyVersion: number,
		currentAdminGroupKey: VersionedKey,
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

	public computeAdminSymKeyTag(
		adminSymKey: VersionedKey,
		adminGroupId: Id,
		userGroupId: Id,
		currentReceivingUserGroupKey: VersionedKey,
		newAdminGroupKeyVersion: number,
	): MacTag {
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

	public verifyAdminSymKeyTag(
		adminSymKey: VersionedKey,
		adminGroupId: Id,
		userGroupId: Id,
		currentReceivingUserGroupKey: VersionedKey,
		newAdminGroupKeyVersion: number,
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
