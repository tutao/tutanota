import o from "../../../../../packages/otest/dist/otest.js"
import { GroupManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/GroupManagementFacade.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { CounterFacade } from "../../../../../src/common/api/worker/facades/lazy/CounterFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { checkKeyVersionConstraints, KeyLoaderFacade, parseKeyVersion } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { AesKey, MacTag, PQKeyPairs, X25519PublicKey } from "@tutao/tutanota-crypto"
import { createTestEntity } from "../../../TestUtils.js"
import {
	Group,
	GroupKey,
	GroupKeysRefTypeRef,
	GroupKeyTypeRef,
	GroupTypeRef,
	KeyMac,
	KeyMacTypeRef,
	PubEncKeyDataTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoWrapper, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { CryptoProtocolVersion, GroupType, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { brandKeyMac, KeyAuthenticationFacade, UserGroupKeyAuthenticationParams } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade.js"
import { TutanotaError } from "@tutao/tutanota-error"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

const { anything, argThat, captor } = matchers

o.spec("GroupManagementFacadeTest", function () {
	let userFacade: UserFacade
	let counters: CounterFacade
	let entityClient: EntityClient
	let serviceExecutor: IServiceExecutor
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cacheManagementFacade: CacheManagementFacade
	let asymmetricCryptoFacade: AsymmetricCryptoFacade
	let cryptoWrapper: CryptoWrapper
	let keyAuthenticationFacade: KeyAuthenticationFacade

	let groupManagementFacade: GroupManagementFacade

	const adminGroupId = "adminGroupId"
	const groupId = "myGroupId"
	let group: Group

	o.beforeEach(function () {
		userFacade = object()
		counters = object()
		entityClient = object()
		serviceExecutor = object()
		pqFacade = object()
		keyLoaderFacade = object()
		cacheManagementFacade = object()
		asymmetricCryptoFacade = object()
		cryptoWrapper = object()
		keyAuthenticationFacade = object()

		groupManagementFacade = new GroupManagementFacade(
			userFacade,
			counters,
			entityClient,
			serviceExecutor,
			pqFacade,
			keyLoaderFacade,
			cacheManagementFacade,
			asymmetricCryptoFacade,
			cryptoWrapper,
			keyAuthenticationFacade,
		)
	})

	o.spec("getCurrentGroupKeyViaAdminEncGKey", function () {
		const adminGroupKeyVersion = 2
		const previousAdminGroupKeyVersion = 1
		const adminGroupKeyBytes = object<AesKey>()
		const adminGroupKeyPair = object<PQKeyPairs>()

		const groupKeyVersion = 2

		const pubUserGroupEccKey = object<X25519PublicKey>()
		const groupKeyBytes = object<AesKey>()
		const adminGroupEncGKey = object<Uint8Array>()
		const pubAdminGroupEncSymKey = object<Uint8Array>()
		const pubAdminGroupEncGKey = createTestEntity(PubEncKeyDataTypeRef, {
			pubEncSymKey: pubAdminGroupEncSymKey,
			protocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
			recipientIdentifier: adminGroupId,
			recipientIdentifierType: PublicKeyIdentifierType.GROUP_ID,
			recipientKeyVersion: adminGroupKeyVersion.toString(),
			senderKeyVersion: groupKeyVersion.toString(),
			symKeyMac: createTestEntity(KeyMacTypeRef, {
				taggedKeyVersion: "2",
				tag: object<Uint8Array>(),
				taggingKeyVersion: "1",
			}),
		})

		o.beforeEach(function () {
			group = createTestEntity(GroupTypeRef, {
				_id: groupId,
				groupKeyVersion: groupKeyVersion.toString(),
				adminGroupKeyVersion: adminGroupKeyVersion.toString(),
				adminGroupEncGKey: null,
				pubAdminGroupEncGKey: null,
				admin: adminGroupId,
				type: GroupType.User,
			})
			when(userFacade.hasGroup(groupId)).thenReturn(false)
			when(userFacade.hasGroup(adminGroupId)).thenReturn(true)
			when(cacheManagementFacade.reloadGroup(groupId)).thenResolve(group)
			when(keyLoaderFacade.loadSymGroupKey(adminGroupId, adminGroupKeyVersion)).thenResolve(adminGroupKeyBytes)
			when(cryptoWrapper.decryptKey(adminGroupKeyBytes, adminGroupEncGKey)).thenReturn(groupKeyBytes)
			when(keyLoaderFacade.loadKeypair(adminGroupId, adminGroupKeyVersion)).thenResolve(adminGroupKeyPair)
			when(
				asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(adminGroupKeyPair, pubAdminGroupEncGKey, {
					identifier: groupId,
					identifierType: PublicKeyIdentifierType.GROUP_ID,
				}),
			).thenResolve({
				decryptedAesKey: groupKeyBytes,
				senderIdentityPubKey: pubUserGroupEccKey,
			})
		})

		o("gets a non-cached group instance", async function () {
			group.adminGroupEncGKey = adminGroupEncGKey

			await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

			verify(cacheManagementFacade.reloadGroup(groupId))
		})

		o("symmetric decryption", async function () {
			group.adminGroupEncGKey = adminGroupEncGKey

			const groupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

			o(groupKey.version).equals(groupKeyVersion)
			o(groupKey.object).deepEquals(groupKeyBytes)
			verify(keyLoaderFacade.loadSymGroupKey(adminGroupId, adminGroupKeyVersion))
			verify(asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(anything(), anything(), anything()), { times: 0 })
		})

		o.spec("asymmetric decryption", function () {
			const formerGroupKeyListId = "formerGroupKeysList"

			o("user group key - successful - former group key is symmetrically encrypted for the admin", async function () {
				/*
                    Scenario:
                    Current group key version is 2, and it is asymmetrically encrypted for the admin with admin group key version 2.
                    Group key version 1 is symmetrically encrypted for the admin with admin group key version 1.
                 */

				group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

				const taggingKeyVersion = "1"
				group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

				const formerGroupKeysV1 = createTestEntity(GroupKeyTypeRef, {
					adminGroupEncGKey: object<Uint8Array>(),
					adminGroupKeyVersion: "1",
				})
				const formerGroupSymKeyV1 = object<AesKey>()
				when(cryptoWrapper.decryptKey(anything(), formerGroupKeysV1.adminGroupEncGKey!)).thenReturn(formerGroupSymKeyV1)

				when(keyLoaderFacade.loadFormerGroupKeyInstance(group, parseKeyVersion(taggingKeyVersion))).thenResolve(formerGroupKeysV1)

				const groupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

				o(groupKey.object).equals(groupKeyBytes)
				o(groupKey.version).equals(groupKeyVersion)

				const formerUserGroupKey: VersionedKey = {
					object: formerGroupSymKeyV1,
					version: checkKeyVersionConstraints(groupKeyVersion - 1),
				}
				// noinspection JSVoidFunctionReturnValueUsed
				verify(
					keyAuthenticationFacade.verifyTag(
						{
							tagType: "USER_GROUP_KEY_TAG",
							sourceOfTrust: { currentUserGroupKey: formerUserGroupKey.object },
							untrustedKey: { newUserGroupKey: groupKeyBytes },
							bindingData: {
								adminGroupId,
								userGroupId: groupId,
								currentUserGroupKeyVersion: formerUserGroupKey.version,
								newAdminGroupKeyVersion: adminGroupKeyVersion,
								newUserGroupKeyVersion: groupKeyVersion,
							},
						},
						brandKeyMac(pubAdminGroupEncGKey.symKeyMac!).tag,
					),
				)
			})

			o.spec("former group key is asymmetrically encrypted for the admin", function () {
				/*
                    The setup for this case should be as follows:
                    The admin wants to use userGroupKeyV2.
                    The userGroupKeyV2 is asymmetrically encrypted for the admin with adminGroupPubKeyV2, therefore it must be authenticated after decryption.
                    It is authenticated using userGroupKeyV1.
                    The userGroupKeyV1 itself is asymmetrically encrypted for the admin with adminGroupPubKeyV1, therefore it must be authenticated after decryption too.
                    It is authenticated using userGroupKeyV0.
                    The userGroupKeyV0 is symmetrically encrypted for/by the admin with adminGroupSymKeyV0, therefore it is already trusted.
                 */
				let userGroupSymKeyV0: AesKey
				let groupKeysV0: GroupKey
				let groupKeysV1: GroupKey
				let userGroupSymKeyV1: AesKey

				o.beforeEach(async function () {
					group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

					// Prepare V2
					pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
						tag: object<Uint8Array>(),
						taggingKeyVersion: "1",
						taggedKeyVersion: "2",
					})
					group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

					// Prepare V1
					groupKeysV1 = createTestEntity(GroupKeyTypeRef, {
						pubAdminGroupEncGKey: createTestEntity(PubEncKeyDataTypeRef, {
							symKeyMac: createTestEntity(KeyMacTypeRef, {
								tag: new Uint8Array([1, 1, 1]),
								taggedKeyVersion: "1",
								taggingKeyVersion: "0",
							}),
							pubEncSymKey: object<Uint8Array>(),
							recipientKeyVersion: "1",
							recipientIdentifier: adminGroupId,
						}),
						adminGroupKeyVersion: "1",
					})
					userGroupSymKeyV1 = object<AesKey>()
					const adminKeyPairV1 = object<PQKeyPairs>()
					when(keyLoaderFacade.loadKeypair(adminGroupId, 1)).thenResolve(adminKeyPairV1)
					when(
						asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(adminKeyPairV1, groupKeysV1.pubAdminGroupEncGKey!, {
							identifier: group._id,
							identifierType: PublicKeyIdentifierType.GROUP_ID,
						}),
					).thenResolve({
						decryptedAesKey: userGroupSymKeyV1,
						senderIdentityPubKey: object(),
					})
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 1)).thenResolve(groupKeysV1)

					// Prepare V0
					groupKeysV0 = createTestEntity(GroupKeyTypeRef, {
						adminGroupEncGKey: object<Uint8Array>(),
						adminGroupKeyVersion: "0",
					})
					const adminSymKeyV0 = object<AesKey>()
					when(keyLoaderFacade.loadSymGroupKey(adminGroupId, 0)).thenResolve(adminSymKeyV0)
					userGroupSymKeyV0 = object<AesKey>()
					when(cryptoWrapper.decryptKey(adminSymKeyV0, anything())).thenReturn(userGroupSymKeyV0)
				})

				o("successful asym decryption", async function () {
					// Prepare V0
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					const returnedGroupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

					o(returnedGroupKey.object).equals(groupKeyBytes)
					o(returnedGroupKey.version).equals(groupKeyVersion)

					let paramsCaptor = captor()
					let paramsTagCaptor = captor()
					// noinspection JSVoidFunctionReturnValueUsed
					verify(keyAuthenticationFacade.verifyTag(paramsCaptor.capture(), paramsTagCaptor.capture()))
					o(paramsCaptor.values?.length).equals(2)

					// check v1
					let params: UserGroupKeyAuthenticationParams = paramsCaptor.values![0]
					o(params).deepEquals({
						tagType: "USER_GROUP_KEY_TAG",
						sourceOfTrust: { currentUserGroupKey: userGroupSymKeyV0 },
						untrustedKey: { newUserGroupKey: userGroupSymKeyV1 },
						bindingData: {
							adminGroupId,
							userGroupId: groupId,
							newAdminGroupKeyVersion: previousAdminGroupKeyVersion,
							currentUserGroupKeyVersion: 0,
							newUserGroupKeyVersion: 1,
						},
					})
					let tagParam = paramsTagCaptor.values![0]
					o(tagParam).equals(brandKeyMac(groupKeysV1.pubAdminGroupEncGKey!.symKeyMac!).tag)

					// verify v2
					params = paramsCaptor.values![1]
					o(params).deepEquals({
						tagType: "USER_GROUP_KEY_TAG",
						untrustedKey: {
							newUserGroupKey: groupKeyBytes,
						},
						sourceOfTrust: {
							currentUserGroupKey: userGroupSymKeyV1,
						},
						bindingData: {
							adminGroupId,
							userGroupId: groupId,
							newAdminGroupKeyVersion: adminGroupKeyVersion,
							newUserGroupKeyVersion: 2,
							currentUserGroupKeyVersion: 1,
						},
					})
					tagParam = paramsTagCaptor.values![1]
					o(tagParam).equals(brandKeyMac(pubAdminGroupEncGKey.symKeyMac as KeyMac).tag)
				})

				o("user group key mac is invalid", async function () {
					// Prepare V1
					// noinspection JSVoidFunctionReturnValueUsed
					when(keyAuthenticationFacade.verifyTag(anything(), pubAdminGroupEncGKey.symKeyMac!.tag as MacTag)).thenThrow(new CryptoError("invalid mac"))

					// Prepare V0
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					await assertThrows(CryptoError, () => groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
				})

				o("user group key - no symmetrically encrypted former group key", async function () {
					// Prepare V0
					groupKeysV0 = createTestEntity(GroupKeyTypeRef, {
						adminGroupEncGKey: null,
						pubAdminGroupEncGKey: createTestEntity(PubEncKeyDataTypeRef, {
							symKeyMac: createTestEntity(KeyMacTypeRef, {
								taggedKeyVersion: "0",
							}),
						}),
						adminGroupKeyVersion: "0",
					})
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					const error = await assertThrows(TutanotaError, () => groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
					o(error.name).equals("UserGroupKeyNotTrustedError")
				})
			})

			o("user group key mac is invalid - former group key is symmetrically encrypted for the admin", async function () {
				group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

				pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
					tag: object(),
					taggingKeyVersion: "1",
					taggedKeyVersion: "1",
					taggingGroup: adminGroupId,
				})
				group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

				const formerGroupKeysV1 = createTestEntity(GroupKeyTypeRef, {
					adminGroupEncGKey: object(),
					adminGroupKeyVersion: "1",
				})
				when(cryptoWrapper.decryptKey(anything(), formerGroupKeysV1.adminGroupEncGKey!)).thenReturn(object())

				when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 1)).thenResolve(formerGroupKeysV1)
				// noinspection JSVoidFunctionReturnValueUsed
				when(keyAuthenticationFacade.verifyTag(anything(), brandKeyMac(pubAdminGroupEncGKey.symKeyMac!).tag)).thenThrow(new CryptoError("invalid mac"))
				await assertThrows(CryptoError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
			})
		})

		o("decrypt with the group membership key if the admin happens to be a member of the target group", async function () {
			// check that the user is from the admin group
			when(userFacade.hasGroup(groupId)).thenReturn(true)

			await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)
			verify(keyLoaderFacade.getCurrentSymGroupKey(groupId))
		})

		o("throws when the group doesn't have any admin encrypted group key", async function () {
			group.adminGroupEncGKey = null
			group.pubAdminGroupEncGKey = null
			await assertThrows(ProgrammingError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})

		o("throws when the group only has a dummy(!) admin encrypted group key", async function () {
			group.adminGroupEncGKey = new Uint8Array(0)
			group.pubAdminGroupEncGKey = null
			await assertThrows(ProgrammingError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})

		o("throws when the user is not an admin and tries to decrypt with the admin group key", async function () {
			when(userFacade.hasGroup(adminGroupId)).thenReturn(false)
			await assertThrows(Error, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})
	})
})
