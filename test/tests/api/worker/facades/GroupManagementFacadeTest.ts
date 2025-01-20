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
import { AesKey, EccPublicKey, PQKeyPairs } from "@tutao/tutanota-crypto"
import { createTestEntity } from "../../../TestUtils.js"
import {
	AdministratedGroupsRefTypeRef,
	AdministratedGroupTypeRef,
	CustomerTypeRef,
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupKey,
	GroupKeysRefTypeRef,
	GroupKeyTypeRef,
	GroupMembershipTypeRef,
	GroupTypeRef,
	KeyMacTypeRef,
	LocalAdminRemovalPostIn,
	PubEncKeyDataTypeRef,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoWrapper, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { CryptoProtocolVersion, GroupType, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { LocalAdminRemovalService } from "../../../../../src/common/api/entities/sys/Services.js"
import { brandKeyMac, KeyAuthenticationFacade } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade.js"
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
		const adminGroupKeyBytes = object<AesKey>()
		const adminGroupKeyPair = object<PQKeyPairs>()

		const groupKeyVersion = 2

		const pubUserGroupEccKey = object<EccPublicKey>()
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
				taggingGroup: groupId,
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
				const userGroupKeyMacData = new Uint8Array([6, 5, 4])

				group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

				const taggingKeyVersion = "1"
				pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
					tag: object<Uint8Array>(),
					taggingKeyVersion,
					taggedKeyVersion: "2",
					taggingGroup: adminGroupId,
				})
				group.type = GroupType.User
				group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

				const formerGroupKeys = createTestEntity(GroupKeyTypeRef, {
					adminGroupEncGKey: object<Uint8Array>(),
					adminGroupKeyVersion: "0",
				})
				const formerGroupSymKey = object<AesKey>()
				when(cryptoWrapper.decryptKey(anything(), formerGroupKeys.adminGroupEncGKey!)).thenReturn(formerGroupSymKey)

				when(keyLoaderFacade.loadFormerGroupKeyInstance(group, parseKeyVersion(taggingKeyVersion))).thenResolve(formerGroupKeys)

				when(
					keyAuthenticationFacade.generateNewUserGroupKeyAuthenticationData(argThat((arg: VersionedKey) => arg.object === groupKeyBytes)),
				).thenReturn(userGroupKeyMacData)

				const groupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)
				o(groupKey.object).equals(groupKeyBytes)
				o(groupKey.version).equals(groupKeyVersion)
				verify(
					keyAuthenticationFacade.deriveUserGroupAuthKey(groupId, {
						object: formerGroupSymKey,
						version: checkKeyVersionConstraints(groupKeyVersion - 1),
					}),
				)
				verify(cryptoWrapper.verifyHmacSha256(anything(), userGroupKeyMacData, brandKeyMac(pubAdminGroupEncGKey.symKeyMac).tag))
			})

			o.spec("former group key is asymmetrically encrypted for the admin", function () {
				/*
					The setup for this case should be as follows:
					The admin wants to use userGroupKeyV2.
					The userGroupKeyV2 is asymmetrically encrypted for the admin with adminGroupPubKeyV2, therefore it must be authenticated after decryption.
					It is authenticated with a key derived from userGroupKeyV1.
					The userGroupKeyV1 itself is asymmetrically encrypted for the admin with adminGroupPubKeyV1, therefore it too must be authenticated after decryption.
					It is authenticated with a key derived from userGroupKeyV0.
					The userGroupKeyV0 is symmetrically encrypted for/by the admin with adminGroupSymKeyV0, therefore it is already trusted.
				 */
				let userGroupSymKeyV0: AesKey
				let groupKeysV0: GroupKey
				let derivedAuthKeyV1: AesKey
				let userGroupSymKeyV1: AesKey

				const userGroupKeyV1MacData = new Uint8Array([9, 8, 7])
				const userGroupKeyMacDataV2 = new Uint8Array([6, 5, 4])

				o.beforeEach(async function () {
					group.type = GroupType.User
					group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

					// Prepare V2
					pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
						tag: object<Uint8Array>(),
						taggingKeyVersion: "1",
						taggedKeyVersion: "2",
						taggingGroup: adminGroupId,
					})
					group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

					// Prepare V1
					const groupKeysV1 = createTestEntity(GroupKeyTypeRef, {
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
					derivedAuthKeyV1 = object<AesKey>()
					when(
						keyAuthenticationFacade.deriveUserGroupAuthKey(
							groupId,
							argThat((arg: VersionedKey) => arg.object === userGroupSymKeyV1),
						),
					).thenReturn(derivedAuthKeyV1)

					// Prepare V0

					groupKeysV0 = createTestEntity(GroupKeyTypeRef, {
						adminGroupEncGKey: object<Uint8Array>(),
						adminGroupKeyVersion: "0",
					})
					const adminSymKeyV0 = object<AesKey>()
					when(keyLoaderFacade.loadSymGroupKey(adminGroupId, 0)).thenResolve(adminSymKeyV0)
					userGroupSymKeyV0 = object<AesKey>()
					when(cryptoWrapper.decryptKey(adminSymKeyV0, anything())).thenReturn(userGroupSymKeyV0)
					const derivedAuthKeyV0 = object<AesKey>()
					when(
						keyAuthenticationFacade.deriveUserGroupAuthKey(
							anything(),
							argThat((arg: VersionedKey) => arg.object === userGroupSymKeyV0),
						),
					).thenReturn(derivedAuthKeyV0)
					when(
						keyAuthenticationFacade.generateNewUserGroupKeyAuthenticationData(argThat((arg: VersionedKey) => arg.object === userGroupSymKeyV1)),
					).thenReturn(userGroupKeyV1MacData)
				})

				o("successful asym decryption", async function () {
					when(
						keyAuthenticationFacade.generateNewUserGroupKeyAuthenticationData(argThat((arg: VersionedKey) => arg.object === groupKeyBytes)),
					).thenReturn(userGroupKeyMacDataV2)

					// Prepare V1
					when(cryptoWrapper.aesDecrypt(derivedAuthKeyV1, anything(), true)).thenReturn(userGroupKeyMacDataV2)

					// Prepare V0
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					const groupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

					o(groupKey.object).equals(groupKeyBytes)
					o(groupKey.version).equals(groupKeyVersion)
					const previousUserGroupKeyCaptor = captor()
					verify(keyAuthenticationFacade.deriveUserGroupAuthKey(groupId, previousUserGroupKeyCaptor.capture()))
					o(previousUserGroupKeyCaptor.values!.length).equals(2)

					const firstCall = previousUserGroupKeyCaptor.values![0]
					o(firstCall.object).equals(userGroupSymKeyV0)
					o(firstCall.version).equals(0)

					const secondCall = previousUserGroupKeyCaptor.values![1]
					o(secondCall.object).equals(userGroupSymKeyV1)
					o(secondCall.version).equals(1)

					verify(cryptoWrapper.verifyHmacSha256(anything(), userGroupKeyV1MacData, anything()))
				})

				o("user group key mac is invalid", async function () {
					// Prepare V2
					when(
						keyAuthenticationFacade.generateNewUserGroupKeyAuthenticationData(argThat((arg: VersionedKey) => arg.object === groupKeyBytes)),
					).thenReturn(userGroupKeyMacDataV2)

					// Prepare V1
					when(cryptoWrapper.verifyHmacSha256(derivedAuthKeyV1, userGroupKeyMacDataV2, anything())).thenThrow(new CryptoError("invalid mac"))

					// Prepare V0
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					const error = await assertThrows(CryptoError, () => groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
				})

				o("user group key - no symmetrically encrypted former group key", async function () {
					when(
						keyAuthenticationFacade.generateNewUserGroupKeyAuthenticationData(argThat((arg: VersionedKey) => arg.object === groupKeyBytes)),
					).thenReturn(userGroupKeyMacDataV2)

					// Prepare V1
					when(cryptoWrapper.aesDecrypt(derivedAuthKeyV1, anything(), true)).thenReturn(userGroupKeyMacDataV2)

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
				const userGroupKeyMacData = new Uint8Array([6, 5, 4])
				group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

				pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
					tag: new Uint8Array([4, 8, 7]),
					taggingKeyVersion: "1",
					taggedKeyVersion: "1",
					taggingGroup: adminGroupId,
				})
				group.type = GroupType.User
				group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

				const formerGroupKeys = createTestEntity(GroupKeyTypeRef, {
					adminGroupEncGKey: new Uint8Array([3, 5, 7]),
					adminGroupKeyVersion: String(Number(adminGroupKeyVersion) - 1),
				})
				when(cryptoWrapper.decryptKey(anything(), formerGroupKeys.adminGroupEncGKey!)).thenReturn([3, 5, 7])

				when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 1)).thenResolve(formerGroupKeys)
				when(cryptoWrapper.verifyHmacSha256(anything(), userGroupKeyMacData, brandKeyMac(pubAdminGroupEncGKey.symKeyMac).tag)).thenThrow(
					new CryptoError("invalid mac"),
				)
				when(keyAuthenticationFacade.generateNewUserGroupKeyAuthenticationData(anything())).thenReturn(userGroupKeyMacData)
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

		o("throws when the group only has a dummy(!) admin en" + "crypted group key", async function () {
			group.adminGroupEncGKey = new Uint8Array(0)
			group.pubAdminGroupEncGKey = null
			await assertThrows(ProgrammingError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})

		o("throws when the user is not an admin and tries to decrypt with the admin group key", async function () {
			when(userFacade.hasGroup(adminGroupId)).thenReturn(false)
			await assertThrows(Error, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})
	})

	o("replace local admin enc group key with global admin enc group key", async function () {
		const symGlobalAdminGroupKey: VersionedKey = {
			version: 1,
			object: object(),
		}

		const symLocalAdminGroupKey: VersionedKey = {
			version: 0,
			object: object(),
		}

		const userGroup: Group = createTestEntity(GroupTypeRef, {
			type: GroupType.User,
			adminGroupEncGKey: object(),
			adminGroupKeyVersion: "0",
			admin: "localAdmin",
		})

		const before = createTestEntity(GroupTypeRef, userGroup)
		const decrypted = object<AesKey>()
		when(cryptoWrapper.decryptKey(anything(), anything())).thenReturn(decrypted)
		const reencrypted = object<Uint8Array>()
		when(cryptoWrapper.encryptKey(anything(), decrypted)).thenReturn(reencrypted)

		const groupUpdate = await groupManagementFacade.replaceLocalAdminEncGroupKeyWithGlobalAdminEncGroupKey(
			symGlobalAdminGroupKey,
			symLocalAdminGroupKey.object,
			userGroup,
		)

		o(groupUpdate.adminGroupKeyVersion).equals(String(symGlobalAdminGroupKey.version))
		o(groupUpdate.adminGroupEncGKey).equals(reencrypted)

		o(userGroup).deepEquals(before)
	})

	o("traverse local admin groups", async function () {
		// prepare test data...
		// --------------------
		const globalAdminGroup = createGroupAndGroupInfo(GroupType.Admin, "adminGroups", "globalAdminId", "globalAdminId", new Uint8Array())
		const adminGroupKey: VersionedKey = {
			object: [1, 2, 3],
			version: 0,
		}
		const globalAdminUser = createTestEntity(UserTypeRef, {
			customer: "someCustomerId",
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					group: globalAdminGroup.group._id,
					groupType: GroupType.Admin,
				}),
			],
		})
		const customer = createTestEntity(CustomerTypeRef, {
			_id: "someCustomerId",
			adminGroup: globalAdminGroup.group._id,
			teamGroups: "teamGroupsIds",
		})

		const administratedGroupsRefs = [
			createTestEntity(AdministratedGroupsRefTypeRef, { items: "xs1" }),
			createTestEntity(AdministratedGroupsRefTypeRef, { items: "xs2" }),
		]

		const localAdminGroup1 = createGroupAndGroupInfo(
			GroupType.LocalAdmin,
			customer.teamGroups,
			"localAdminGroup1Id",
			globalAdminGroup.group._id,
			new Uint8Array(),
		)
		localAdminGroup1.group.administratedGroups = administratedGroupsRefs[0]

		const localAdminGroup2 = createGroupAndGroupInfo(
			GroupType.LocalAdmin,
			customer.teamGroups,
			"localAdminGroup2Id",
			globalAdminGroup.group._id,
			new Uint8Array(),
		)
		localAdminGroup2.group.administratedGroups = administratedGroupsRefs[1]

		const userGroup1 = createGroupAndGroupInfo(GroupType.User, customer.userGroups, "u1", localAdminGroup1.group._id, new Uint8Array([1]))
		const userGroup2 = createGroupAndGroupInfo(GroupType.User, customer.userGroups, "u2", localAdminGroup1.group._id, new Uint8Array([1, 2]))
		const userGroup3 = createGroupAndGroupInfo(GroupType.User, customer.userGroups, "u3", localAdminGroup2.group._id, new Uint8Array([1, 2, 3]))

		const administratedGroupsByLocalAdmins = [
			createTestEntity(AdministratedGroupTypeRef, {
				_id: ["xs1", "1"],
				localAdminGroup: localAdminGroup1.group._id,
				groupInfo: userGroup1.groupInfo._id,
			}),
			createTestEntity(AdministratedGroupTypeRef, {
				_id: ["xs1", "2"],
				localAdminGroup: localAdminGroup1.group._id,
				groupInfo: userGroup2.groupInfo._id,
			}),
			createTestEntity(AdministratedGroupTypeRef, {
				_id: ["xs2", "1"],
				localAdminGroup: localAdminGroup2.group._id,
				groupInfo: userGroup3.groupInfo._id,
			}),
		]

		// mock body of the function
		// -------------------------
		when(userFacade.getLoggedInUser()).thenReturn(globalAdminUser)
		when(entityClient.load(CustomerTypeRef, "someCustomerId")).thenResolve(customer)
		when(entityClient.loadAll(GroupInfoTypeRef, "teamGroupsIds")).thenResolve([localAdminGroup1.groupInfo, localAdminGroup2.groupInfo])
		when(keyLoaderFacade.getCurrentSymGroupKey("globalAdminId")).thenResolve(adminGroupKey) // const adminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)

		// inner loop loading administrated groups
		// for the administrated groups of the first local admin
		when(entityClient.loadAll(AdministratedGroupTypeRef, "xs1")).thenResolve([administratedGroupsByLocalAdmins[0], administratedGroupsByLocalAdmins[1]])
		// for the administrated groups of the second local admin
		when(entityClient.loadAll(AdministratedGroupTypeRef, "xs2")).thenResolve([administratedGroupsByLocalAdmins[2]])

		// stubbing
		const save = groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey
		groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey = () => {
			return object()
		}
		// when(groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey("localAdminGroup1Id")).thenResolve(object())
		// when(groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey("localAdminGroup2Id")).thenResolve(object())

		// now run mocked function
		// -----------------------
		await groupManagementFacade.migrateLocalAdminsToGlobalAdmins()

		verify(
			serviceExecutor.post(
				LocalAdminRemovalService,
				argThat((postIn: LocalAdminRemovalPostIn) => {
					const userWithIds = postIn.groupUpdates.map((user) => user.groupId).sort()
					o(userWithIds.sort()).deepEquals(["u1", "u2", "u3"])
					return true
				}),
			),
		)

		groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey = save
	})

	function createGroupAndGroupInfo(
		groupType: GroupType,
		groupInfoListId: string,
		groupId: string,
		adminGroup: string,
		adminGroupEncGroupKey: Uint8Array,
	): {
		group: Group
		groupInfo: GroupInfo
	} {
		const groupInfo = createTestEntity(GroupInfoTypeRef, { _id: [groupInfoListId, `groupInfo${groupId}`], groupType: groupType, group: groupId })
		const group = createTestEntity(GroupTypeRef, {
			type: groupType,
			admin: adminGroup,
			_id: groupId,
			adminGroupEncGKey: adminGroupEncGroupKey,
		})
		when(entityClient.load(GroupTypeRef, groupId)).thenResolve(group)
		when(entityClient.load(GroupInfoTypeRef, groupInfo._id)).thenResolve(groupInfo)

		return { group, groupInfo }
	}
})
