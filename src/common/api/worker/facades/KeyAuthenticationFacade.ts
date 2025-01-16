import { CryptoWrapper } from "../crypto/CryptoWrapper.js"
import { assertNotNull, concat, KeyVersion } from "@tutao/tutanota-utils"
import { Aes256Key, AesKey, bitArrayToUint8Array, EncryptedPqKeyPairs, KeyPairType, MacTag, PQPublicKeys } from "@tutao/tutanota-crypto"
import { assertWorkerOrNode } from "../../common/Env.js"
import { KeyMac, PubDistributionKey } from "../../entities/sys/TypeRefs.js"
import { PublicKeys } from "./PublicKeyProvider.js"

assertWorkerOrNode()

type AuthenticationBindingData = {
	userGroupId: Id
	adminGroupId: Id
}

type BaseKeyAuthenticationParams = {
	tagType: keyof typeof systemMap
	sourceOfTrust: {}
	// this can be a user group key, an admin group key, an admin group public key or a distribution public key
	untrustedKey: {}
	bindingData: AuthenticationBindingData
}

export type UserGroupKeyAuthenticationParams = BaseKeyAuthenticationParams & {
	tagType: "USER_GROUP_KEY_TAG"
	untrustedKey: { newUserGroupKey: Aes256Key }
	sourceOfTrust: { currentUserGroupKey: AesKey }
	bindingData: AuthenticationBindingData & {
		currentUserGroupKeyVersion: KeyVersion
		newUserGroupKeyVersion: KeyVersion
		newAdminGroupKeyVersion: KeyVersion
	}
}

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

/**
 * Purpose: prove to admins that the new User Group Key is authentic.
 * By deriving this key from the current User Group Key, the admin knows that it was created by someone who had access to this key,
 * that is, either the user or another admin.
 */
const userGroupKeyAuthenticationSystem: KeyAuthenticationSystem<UserGroupKeyAuthenticationParams> = {
	deriveKey(
		{ bindingData: { userGroupId, adminGroupId, newAdminGroupKeyVersion, newUserGroupKeyVersion, currentUserGroupKeyVersion }, sourceOfTrust },
		cryptoWrapper,
	) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKeyVersion}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}, newUserGroupKeyVersion: ${newUserGroupKeyVersion}`,
			key: sourceOfTrust.currentUserGroupKey,
			context: "newUserGroupKeyAuthKeyForRotationAsNonAdminUser",
		})
	},
	generateAuthenticationData({ untrustedKey: { newUserGroupKey } }) {
		return bitArrayToUint8Array(newUserGroupKey)
	},
}

export type NewAdminPubKeyAuthenticationParams = BaseKeyAuthenticationParams & {
	tagType: "NEW_ADMIN_PUB_KEY_TAG"
	untrustedKey: { newAdminPubKey: PQPublicKeys }
	sourceOfTrust: { receivingUserGroupKey: AesKey } // this receiving user is an admin receiving the new admin group pub keys
	bindingData: AuthenticationBindingData & {
		newAdminGroupKeyVersion: KeyVersion
		currentReceivingUserGroupKeyVersion: KeyVersion
	}
}

/**
 * Purpose: prove to users that the new Admin Group Public Key is authentic.
 * By deriving this key from the current User Group Key, the user knows that it was created either by someone who had access to this key,
 * that is, either themselves or an admin.
 */
const newAdminPubKeyAuthenticationSystem: KeyAuthenticationSystem<NewAdminPubKeyAuthenticationParams> = {
	deriveKey({ bindingData: { userGroupId, adminGroupId, newAdminGroupKeyVersion, currentReceivingUserGroupKeyVersion }, sourceOfTrust }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentReceivingUserGroupKeyVersion}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: sourceOfTrust.receivingUserGroupKey,
			context: "newAdminPubKeyAuthKeyForUserGroupKeyRotation",
		})
	},
	generateAuthenticationData({
		untrustedKey: {
			newAdminPubKey: { eccPublicKey, kyberPublicKey },
		},
	}) {
		return concat(eccPublicKey, kyberPublicKey.raw)
	},
}

export type PubDistKeyAuthenticationParams = BaseKeyAuthenticationParams & {
	tagType: "PUB_DIST_KEY_TAG"
	untrustedKey: { distPubKey: PQPublicKeys }
	sourceOfTrust: { currentAdminGroupKey: AesKey }
	bindingData: AuthenticationBindingData & {
		currentUserGroupKeyVersion: KeyVersion
		currentAdminGroupKeyVersion: KeyVersion
	}
}

/**
 * Purpose: prove to other admins that the Distribution Public Key is authentic.
 * By deriving this key from the current Admin Group Key, the admin knows that it was created by someone who had access to this key,
 * that is, either themselves or another admin.
 */
const pubDistKeyAuthenticationSystem: KeyAuthenticationSystem<PubDistKeyAuthenticationParams> = {
	deriveKey({ bindingData: { adminGroupId, userGroupId, currentUserGroupKeyVersion, currentAdminGroupKeyVersion }, sourceOfTrust }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentUserGroupKeyVersion}, currentAdminGroupKeyVersion: ${currentAdminGroupKeyVersion}`,
			key: sourceOfTrust.currentAdminGroupKey,
			context: "adminGroupDistKeyPairAuthKeyForMultiAdminRotation",
		})
	},
	generateAuthenticationData({
		untrustedKey: {
			distPubKey: { eccPublicKey, kyberPublicKey },
		},
	}) {
		return concat(eccPublicKey, kyberPublicKey.raw)
	},
}

export type AdminSymKeyAuthenticationParams = BaseKeyAuthenticationParams & {
	tagType: "ADMIN_SYM_KEY_TAG"
	untrustedKey: { newAdminGroupKey: Aes256Key }
	sourceOfTrust: { currentReceivingUserGroupKey: AesKey } // this receiving user is an admin receiving the new admin group sym key
	bindingData: AuthenticationBindingData & {
		newAdminGroupKeyVersion: KeyVersion
		currentReceivingUserGroupKeyVersion: KeyVersion
	}
}

/**
 * Purpose: prove to other admins that the new Admin Group Symmetric Key is authentic.
 * By deriving this key from the current User Group Key, the admin user knows that it was created either by someone who had access to this key,
 * that is, either themselves or another admin.
 */
const adminSymKeyAuthenticationSystem: KeyAuthenticationSystem<AdminSymKeyAuthenticationParams> = {
	deriveKey({ bindingData: { adminGroupId, userGroupId, newAdminGroupKeyVersion, currentReceivingUserGroupKeyVersion }, sourceOfTrust }, cryptoWrapper) {
		return cryptoWrapper.deriveKeyWithHkdf({
			salt: `adminGroup: ${adminGroupId}, userGroup: ${userGroupId}, currentUserGroupKeyVersion: ${currentReceivingUserGroupKeyVersion}, newAdminGroupKeyVersion: ${newAdminGroupKeyVersion}`,
			key: sourceOfTrust.currentReceivingUserGroupKey,
			context: "newAdminSymKeyAuthKeyForMultiAdminRotationAsUser",
		})
	},
	generateAuthenticationData({ untrustedKey: { newAdminGroupKey } }) {
		return bitArrayToUint8Array(newAdminGroupKey)
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

/**
 * Converts some form of public PQ keys to the PQPublicKeys type. Assumes pubEccKey and pubKyberKey exist.
 * @param kp
 */
export function asPQPublicKeys(kp: EncryptedPqKeyPairs | PubDistributionKey | PublicKeys): PQPublicKeys {
	return {
		keyPairType: KeyPairType.TUTA_CRYPT,
		eccPublicKey: assertNotNull(kp.pubEccKey),
		kyberPublicKey: {
			raw: assertNotNull(kp.pubKyberKey),
		},
	}
}
