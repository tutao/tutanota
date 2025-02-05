import o from "@tutao/otest"
import {
	AdminSymKeyAuthenticationParams,
	KeyAuthenticationFacade,
	NewAdminPubKeyAuthenticationParams,
	PubDistKeyAuthenticationParams,
	UserGroupKeyAuthenticationParams,
} from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade.js"
import { Aes256Key, aes256RandomKey, EccPublicKey, KeyPairType, KyberPublicKey } from "@tutao/tutanota-crypto"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { KeyVersion } from "@tutao/tutanota-utils"
import { checkKeyVersionConstraints } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"

const WRONG_BYTES = new Uint8Array([255, 254, 253])
const WRONG_ID: Id = "I_CLEARLY_MISSED_SOMETHING" // this must be base64 compatible

function mergeParams(params, propertyName, value) {
	return { ...params, bindingData: { ...params.bindingData, [propertyName]: value } }
}

function nextKeyVersion(v: KeyVersion): KeyVersion {
	return checkKeyVersionConstraints(v + 1)
}

o.spec("KeyAuthenticationFacadeTest", function () {
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let cryptoWrapper: CryptoWrapper

	let userGroupId: Id
	let adminGroupId: Id
	let currentUserGroupKey: Aes256Key
	let currentUserGroupKeyVersion: KeyVersion
	let newUserGroupKey: Aes256Key
	let newUserGroupKeyVersion: KeyVersion
	let currentAdminGroupKey: Aes256Key
	let currentAdminGroupKeyVersion: KeyVersion
	let newAdminGroupKey: Aes256Key
	let newAdminGroupKeyVersion: KeyVersion
	let eccPublicKey: EccPublicKey
	let kyberPublicKey: KyberPublicKey

	o.beforeEach(async function () {
		cryptoWrapper = new CryptoWrapper()
		keyAuthenticationFacade = new KeyAuthenticationFacade(cryptoWrapper)

		userGroupId = "userGroupId"
		adminGroupId = "adminGroupId"

		currentUserGroupKey = aes256RandomKey()
		currentUserGroupKeyVersion = 0 as KeyVersion
		currentAdminGroupKey = aes256RandomKey()
		currentAdminGroupKeyVersion = 0 as KeyVersion

		newUserGroupKey = aes256RandomKey()
		newUserGroupKeyVersion = 1 as KeyVersion
		newAdminGroupKey = aes256RandomKey()
		newAdminGroupKeyVersion = 1 as KeyVersion

		kyberPublicKey = { raw: new Uint8Array([1, 2, 3]) }
		eccPublicKey = new Uint8Array([4, 5, 6])
	})

	o.spec("user group key authentication system", function () {
		o("should verify computed tag", async function () {
			const params: UserGroupKeyAuthenticationParams = {
				tagType: "USER_GROUP_KEY_TAG",
				untrustedKey: { newUserGroupKey },
				sourceOfTrust: { currentUserGroupKey: currentUserGroupKey },
				bindingData: {
					newAdminGroupKeyVersion,
					adminGroupId,
					userGroupId,
					currentUserGroupKeyVersion,
					newUserGroupKeyVersion,
				},
			}
			const tag = keyAuthenticationFacade.computeTag(params)

			keyAuthenticationFacade.verifyTag(params, tag)

			const wrongUserGroupId: UserGroupKeyAuthenticationParams = mergeParams(params, "userGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongUserGroupId, tag))

			const wrongAdminGroupId: UserGroupKeyAuthenticationParams = mergeParams(params, "adminGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongAdminGroupId, tag))

			const wrongNewAdminGroupKeyVersion: UserGroupKeyAuthenticationParams = mergeParams(
				params,
				"newAdminGroupKeyVersion",
				nextKeyVersion(params.bindingData.newAdminGroupKeyVersion),
			)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongNewAdminGroupKeyVersion, tag))

			const wrongCurrentUserGroupKey: UserGroupKeyAuthenticationParams = { ...params, sourceOfTrust: { currentUserGroupKey: aes256RandomKey() } }
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongCurrentUserGroupKey, tag))

			const wrongNewUserGroupKey: UserGroupKeyAuthenticationParams = { ...params, untrustedKey: { newUserGroupKey: aes256RandomKey() } }
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongNewUserGroupKey, tag))
		})
	})

	o.spec("new admin public key authentication system", function () {
		o("should verify computed tag", async function () {
			const params: NewAdminPubKeyAuthenticationParams = {
				tagType: "NEW_ADMIN_PUB_KEY_TAG",
				sourceOfTrust: { receivingUserGroupKey: currentUserGroupKey },
				untrustedKey: {
					newAdminPubKey: {
						keyPairType: KeyPairType.TUTA_CRYPT,
						kyberPublicKey,
						eccPublicKey,
					},
				},
				bindingData: {
					newAdminGroupKeyVersion,
					currentReceivingUserGroupKeyVersion: currentUserGroupKeyVersion,
					adminGroupId,
					userGroupId,
				},
			}
			const tag = keyAuthenticationFacade.computeTag(params)

			keyAuthenticationFacade.verifyTag(params, tag)

			const wrongUserGroupId: NewAdminPubKeyAuthenticationParams = mergeParams(params, "userGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongUserGroupId, tag))

			const wrongAdminGroupId: NewAdminPubKeyAuthenticationParams = mergeParams(params, "adminGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongAdminGroupId, tag))

			const wrongNewAdminGroupKeyVersion: NewAdminPubKeyAuthenticationParams = mergeParams(
				params,
				"newAdminGroupKeyVersion",
				nextKeyVersion(params.bindingData.newAdminGroupKeyVersion),
			)

			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongNewAdminGroupKeyVersion, tag))

			const wrongCurrentUserGroupKey: NewAdminPubKeyAuthenticationParams = { ...params, sourceOfTrust: { receivingUserGroupKey: aes256RandomKey() } }
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongCurrentUserGroupKey, tag))

			const wrongPubEccKey: NewAdminPubKeyAuthenticationParams = {
				...params,
				untrustedKey: { newAdminPubKey: { ...params.untrustedKey.newAdminPubKey, eccPublicKey: WRONG_BYTES } },
			}
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongPubEccKey, tag))

			const wrongPubKyberKey: NewAdminPubKeyAuthenticationParams = {
				...params,
				untrustedKey: { newAdminPubKey: { ...params.untrustedKey.newAdminPubKey, kyberPublicKey: { raw: WRONG_BYTES } } },
			}
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongPubKyberKey, tag))
		})
	})

	o.spec("public distribution key authentication system", function () {
		o("should verify computed tag", async function () {
			const params: PubDistKeyAuthenticationParams = {
				tagType: "PUB_DIST_KEY_TAG",
				sourceOfTrust: { currentAdminGroupKey },
				untrustedKey: { distPubKey: { keyPairType: KeyPairType.TUTA_CRYPT, kyberPublicKey, eccPublicKey } },
				bindingData: {
					adminGroupId,
					userGroupId,
					currentUserGroupKeyVersion,
					currentAdminGroupKeyVersion,
				},
			}
			const tag = keyAuthenticationFacade.computeTag(params)

			keyAuthenticationFacade.verifyTag(params, tag)

			const wrongUserGroupId: PubDistKeyAuthenticationParams = mergeParams(params, "userGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongUserGroupId, tag))

			const wrongAdminGroupId: PubDistKeyAuthenticationParams = mergeParams(params, "adminGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongAdminGroupId, tag))

			const wrongCurrentUserGroupKeyVersion: PubDistKeyAuthenticationParams = mergeParams(
				params,
				"currentUserGroupKeyVersion",
				nextKeyVersion(params.bindingData.currentUserGroupKeyVersion),
			)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongCurrentUserGroupKeyVersion, tag))

			const wrongCurrentAdminGroupKey: PubDistKeyAuthenticationParams = { ...params, sourceOfTrust: { currentAdminGroupKey: aes256RandomKey() } }
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongCurrentAdminGroupKey, tag))

			const wrongPubEccKey: PubDistKeyAuthenticationParams = {
				...params,
				untrustedKey: { distPubKey: { ...params.untrustedKey.distPubKey, eccPublicKey: WRONG_BYTES } },
			}

			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongPubEccKey, tag))

			const wrongPubKyberKey: PubDistKeyAuthenticationParams = {
				...params,
				untrustedKey: {
					distPubKey: {
						...params.untrustedKey.distPubKey,
						kyberPublicKey: { raw: WRONG_BYTES },
					},
				},
			}
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongPubKyberKey, tag))
		})
	})

	o.spec("admin group symmetric key authentication system", function () {
		o("should verify computed tag", async function () {
			const params: AdminSymKeyAuthenticationParams = {
				tagType: "ADMIN_SYM_KEY_TAG",
				sourceOfTrust: { currentReceivingUserGroupKey: currentUserGroupKey },
				untrustedKey: { newAdminGroupKey },
				bindingData: {
					adminGroupId,
					userGroupId,
					currentReceivingUserGroupKeyVersion: currentUserGroupKeyVersion,
					newAdminGroupKeyVersion,
				},
			}
			const tag = keyAuthenticationFacade.computeTag(params)

			keyAuthenticationFacade.verifyTag(params, tag)

			const wrongUserGroupId: AdminSymKeyAuthenticationParams = mergeParams(params, "userGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongUserGroupId, tag))

			const wrongAdminGroupId: AdminSymKeyAuthenticationParams = mergeParams(params, "adminGroupId", WRONG_ID)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongAdminGroupId, tag))

			const wrongCurrentReceivingUserGroupKey: AdminSymKeyAuthenticationParams = {
				...params,
				sourceOfTrust: {
					currentReceivingUserGroupKey: aes256RandomKey(),
				},
			}
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongCurrentReceivingUserGroupKey, tag))

			const wrongNewAdminGroupKeyVersion: AdminSymKeyAuthenticationParams = mergeParams(params, "newAdminGroupKeyVersion", 2)
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongNewAdminGroupKeyVersion, tag))

			const wrongAdminSymKey: AdminSymKeyAuthenticationParams = {
				...params,
				untrustedKey: { newAdminGroupKey: aes256RandomKey() },
			}
			await assertThrows(CryptoError, async () => keyAuthenticationFacade.verifyTag(wrongAdminSymKey, tag))
		})
	})
})
