import o from "@tutao/otest"
import { KeyRotationFacade } from "../../../../../src/api/worker/facades/KeyRotationFacade.js"
import { EntityClient } from "../../../../../src/api/common/EntityClient.js"
import { instance, matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils.js"
import {
	Group,
	GroupInfoTypeRef,
	GroupKeyRotationInfoGetOutTypeRef,
	GroupKeyRotationPostIn,
	GroupMembershipTypeRef,
	GroupTypeRef,
	KeyPairTypeRef,
	KeyRotation,
	KeyRotationsRefTypeRef,
	KeyRotationTypeRef,
	User,
	UserGroupRoot,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../../../../src/api/entities/sys/TypeRefs.js"
import { AesKey, KEY_LENGTH_BYTES_AES_256, KyberPrivateKey, KyberPublicKey, PQKeyPairs, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { KeyLoaderFacade } from "../../../../../src/api/worker/facades/KeyLoaderFacade.js"
import { PQFacade } from "../../../../../src/api/worker/facades/PQFacade.js"
import { IServiceExecutor } from "../../../../../src/api/common/ServiceRequest.js"
import { ServiceExecutor } from "../../../../../src/api/worker/rest/ServiceExecutor.js"
import { GroupKeyRotationType, GroupType } from "../../../../../src/api/common/TutanotaConstants.js"
import { GroupKeyRotationInfoService, GroupKeyRotationService } from "../../../../../src/api/entities/sys/Services.js"
import { VersionedEncryptedKey, VersionedKey } from "../../../../../src/api/worker/crypto/CryptoFacade.js"
import { findAllAndRemove } from "@tutao/tutanota-utils"
import { CryptoWrapper } from "../../../../../src/api/worker/crypto/CryptoWrapper.js"

const { anything } = matchers

o.spec("KeyRotationFacade", function () {
	let entityClientMock: EntityClient
	let keyRotationFacade: KeyRotationFacade
	let keyLoaderFacadeMock: KeyLoaderFacade
	let pqFacadeMock: PQFacade
	let serviceExecutorMock: IServiceExecutor

	const keyRotationsList = "keyRotationsList"
	let user: User
	const pwKey = uint8ArrayToBitArray(new Uint8Array(Array(KEY_LENGTH_BYTES_AES_256).keys()))
	let cryptoWrapperMock: CryptoWrapper
	let userEncAdminKey: Uint8Array
	const groupId = "someGroup"
	let group: Group
	let groupKeyVersion0: AesKey

	o.beforeEach(async () => {
		entityClientMock = instance(EntityClient)
		keyLoaderFacadeMock = instance(KeyLoaderFacade)
		pqFacadeMock = instance(PQFacade)
		serviceExecutorMock = instance(ServiceExecutor)
		cryptoWrapperMock = object()
		userEncAdminKey = object()
		keyRotationFacade = new KeyRotationFacade(entityClientMock, keyLoaderFacadeMock, pqFacadeMock, serviceExecutorMock, cryptoWrapperMock)
		user = await makeUser("userId", userEncAdminKey)
		groupKeyVersion0 = object()
		group = makeGroup(groupId)

		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve(group)
		when(keyLoaderFacadeMock.loadSymGroupKey(groupId, 0)).thenResolve(groupKeyVersion0)
		when(entityClientMock.load(UserGroupRootTypeRef, anything())).thenResolve(await makeUserGroupRoot(keyRotationsList))
	})

	o.spec("initialize", function () {
		o("When a key rotation for the admin group exists on the server, the password key is saved in the facade", async function () {
			when(serviceExecutorMock.get(GroupKeyRotationInfoService, anything())).thenResolve(
				createTestEntity(GroupKeyRotationInfoGetOutTypeRef, { userOrAdminGroupKeyRotationScheduled: true }),
			)
			await keyRotationFacade.initialize(pwKey)

			o(keyRotationFacade.pendingKeyRotations.pwKey).deepEquals(pwKey)
		})

		o("When a key rotation for the admin group does not exist on the server, the password key is not saved in the facade", async function () {
			when(serviceExecutorMock.get(GroupKeyRotationInfoService, anything())).thenResolve(
				createTestEntity(GroupKeyRotationInfoGetOutTypeRef, { userOrAdminGroupKeyRotationScheduled: false }),
			)
			await keyRotationFacade.initialize(pwKey)

			o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
		})
	})

	o.spec("loadPendingKeyRotations", function () {
		o("When a key rotation for a user area group exists on the server, the pending key rotation is saved in the facade.", async function () {
			when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
				makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, groupId),
			)

			await keyRotationFacade.loadPendingKeyRotations(user)

			o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotation.length).equals(1)
			o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
		})

		o.spec("When a key rotation for a group that is not yet supported exists on the server, nothing is saved in the facade", function () {
			o("Team", async function () {
				when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
					makeKeyRotation(keyRotationsList, GroupKeyRotationType.Team, groupId),
				)

				await keyRotationFacade.loadPendingKeyRotations(user)

				o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotation.length).equals(0)
				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
			})

			o("Customer", async function () {
				when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
					makeKeyRotation(keyRotationsList, GroupKeyRotationType.Customer, groupId),
				)

				await keyRotationFacade.loadPendingKeyRotations(user)

				o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotation.length).equals(0)
				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
			})
		})
	})

	function makeOtherUsersGroup(customerGroup: Id) {
		const otherUsersGroupId = "gorupOfDifferentUser"
		const otherUsersGroup = makeGroup(otherUsersGroupId)
		when(entityClientMock.load(GroupTypeRef, otherUsersGroupId)).thenResolve(otherUsersGroup)
		const otherUsersGroupInfo = createTestEntity(GroupInfoTypeRef, { _ownerGroup: customerGroup })
		when(entityClientMock.load(GroupInfoTypeRef, ["listId", "groupInfo"])).thenResolve(otherUsersGroupInfo)
		return otherUsersGroupId
	}

	o.spec("processPendingKeyRotation", function () {
		o.spec("When a key rotation for a user area group exists, the key rotation is executed successfully", function () {
			o("Rotated group does not have a key pair", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, groupId),
				})

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(
					cryptoWrapperMock,
					keyLoaderFacadeMock,
					groupKeyVersion0,
					userEncAdminKey,
				)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]
				o(update.keyPair).equals(null)
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).equals(adminEncNewGroupKey)
				o(update.adminGroupKeyVersion).equals("0")
				o(update.groupEncPreviousGroupKey).equals(newGroupKeyEncPreviousGroupKey)
				o(update.userEncGroupKey).equals(userEncNewGroupKey.key)
				o(update.userKeyVersion).equals("0")
			})
			o("Rotated group does not have adminEncKey", async function () {
				group.adminGroupEncGKey = null
				group.adminGroupKeyVersion = null
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, groupId),
				})

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey } = prepareKeyMocks(
					cryptoWrapperMock,
					keyLoaderFacadeMock,
					groupKeyVersion0,
					userEncAdminKey,
				)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]
				o(update.keyPair).equals(null)
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).equals(null)
				o(update.adminGroupKeyVersion).equals(null)
				o(update.groupEncPreviousGroupKey).equals(newGroupKeyEncPreviousGroupKey)
				o(update.userEncGroupKey).equals(userEncNewGroupKey.key)
				o(update.userKeyVersion).equals("0")
			})

			o("Rotated group has key pair and adminEncGroupKey", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, groupId),
				})

				group.currentKeys = createTestEntity(KeyPairTypeRef)

				const newKeyPairs: PQKeyPairs = object()
				newKeyPairs.eccKeyPair = {
					publicKey: object<Uint8Array>(),
					privateKey: object<Uint8Array>(),
				}
				newKeyPairs.kyberKeyPair = {
					publicKey: object<KyberPublicKey>(),
					privateKey: object<KyberPrivateKey>(),
				}
				when(pqFacadeMock.generateKeyPairs()).thenResolve(newKeyPairs)

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, newKey, adminEncNewGroupKey } = prepareKeyMocks(
					cryptoWrapperMock,
					keyLoaderFacadeMock,
					groupKeyVersion0,
					userEncAdminKey,
				)

				const encryptedEccPrivKey: Uint8Array = object()
				when(cryptoWrapperMock.encryptEccKey(newKey, newKeyPairs.eccKeyPair.privateKey)).thenReturn(encryptedEccPrivKey)
				const encryptedKyberPrivKey: Uint8Array = object()
				when(cryptoWrapperMock.encryptKyberKey(newKey, newKeyPairs.kyberKeyPair.privateKey)).thenReturn(encryptedKyberPrivKey)
				const kyberPublicKeyBytes: Uint8Array = object()
				when(cryptoWrapperMock.kyberPublicKeyToBytes(newKeyPairs.kyberKeyPair.publicKey)).thenReturn(kyberPublicKeyBytes)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]

				const sentKeyPairs = createTestEntity(KeyPairTypeRef, {
					pubEccKey: newKeyPairs.eccKeyPair.publicKey,
					symEncPrivEccKey: encryptedEccPrivKey,
					pubKyberKey: kyberPublicKeyBytes,
					symEncPrivKyberKey: encryptedKyberPrivKey,
				})
				o(update.keyPair).deepEquals(sentKeyPairs)
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).equals(adminEncNewGroupKey)
				o(update.adminGroupKeyVersion).equals("0")
				o(update.groupEncPreviousGroupKey).equals(newGroupKeyEncPreviousGroupKey)
				o(update.userEncGroupKey).equals(userEncNewGroupKey.key)
				o(update.userKeyVersion).equals("0")
			})

			o("Key rotation for multiple groups are executed in one request", async function () {
				const secondGroupId = "groupId-2"

				when(entityClientMock.load(GroupTypeRef, secondGroupId)).thenResolve(makeGroup(secondGroupId))
				user.memberships.push(
					createTestEntity(GroupMembershipTypeRef, {
						group: secondGroupId,
						groupKeyVersion: "0",
					}),
				)

				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: [
						createTestEntity(KeyRotationTypeRef, {
							groupKeyRotationType: GroupKeyRotationType.UserArea,
							_id: [keyRotationsList, groupId],
							targetKeyVersion: "1",
						}),
						createTestEntity(KeyRotationTypeRef, {
							groupKeyRotationType: GroupKeyRotationType.UserArea,
							_id: [keyRotationsList, secondGroupId],
							targetKeyVersion: "1",
						}),
					],
				})

				prepareKeyMocks(cryptoWrapperMock, keyLoaderFacadeMock, groupKeyVersion0, userEncAdminKey)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(2)
				const update = sentData.groupKeyUpdates[0]
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				const secondUpdate = sentData.groupKeyUpdates[1]
				o(secondUpdate.group).equals(secondGroupId)
				o(secondUpdate.groupKeyVersion).equals("1")
			})
		})

		o("After processing a key rotation for the admin group the key rotation is deleted from the facade.", async function () {
			keyRotationFacade.setPendingKeyRotations({
				pwKey: object(),
				adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, { groupKeyRotationType: GroupKeyRotationType.Admin }),
				userAreaGroupsKeyRotation: [],
			})

			await keyRotationFacade.processPendingKeyRotation(user)
			o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
		})

		o("After processing key rotations the password key is deleted from the facade.", async function () {
			keyRotationFacade.setPendingKeyRotations({
				pwKey: object(),
				adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, { groupKeyRotationType: GroupKeyRotationType.Admin }),
				userAreaGroupsKeyRotation: [],
			})

			await keyRotationFacade.processPendingKeyRotation(user)

			o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
		})

		o.spec("Ignore currently unsupported cases", function () {
			o("If the user is not an admin, the user area group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, groupId),
				})

				// remove admin group membership
				findAllAndRemove(user.memberships, (m) => m.groupType === GroupType.Admin)

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})
			o("If the user is an admin, but not a member of the group key rotations are ignored", async function () {
				const otherUsersGroupId = makeOtherUsersGroup("usersCustomerGroup")
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, otherUsersGroupId),
				})
				prepareKeyMocks(cryptoWrapperMock, keyLoaderFacadeMock, groupKeyVersion0, userEncAdminKey)
				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})

			o("If the admin group key is not quantum-safe yet, the user area group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsList, GroupKeyRotationType.UserArea, groupId),
				})

				const { currentAdminGroupKey } = prepareKeyMocks(cryptoWrapperMock, keyLoaderFacadeMock, groupKeyVersion0, userEncAdminKey)
				// make admin group key a 128-bit key
				currentAdminGroupKey!.length = 4

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})
		})
	})
})

async function makeUser(userId: Id, userEncAdminKey: Uint8Array): Promise<User> {
	return createTestEntity(UserTypeRef, {
		_id: userId,
		userGroup: createTestEntity(GroupMembershipTypeRef, {}),
		memberships: [
			createTestEntity(GroupMembershipTypeRef, {
				groupType: GroupType.Admin,
				symEncGKey: userEncAdminKey,
			}),
			createTestEntity(GroupMembershipTypeRef, {
				group: "someGroup",
			}),
			createTestEntity(GroupMembershipTypeRef, {
				groupType: GroupType.Customer,
				group: "usersCustomerGroup",
			}),
		],
	})
}

function makeKeyRotation(keyRotationsList: Id, groupType: string, groupId: Id): Array<KeyRotation> {
	return [
		createTestEntity(KeyRotationTypeRef, {
			_id: [keyRotationsList, groupId],
			groupKeyRotationType: groupType,
			targetKeyVersion: "1",
		}),
	]
}

async function makeUserGroupRoot(keyRotationsList: Id): Promise<UserGroupRoot> {
	return createTestEntity(UserGroupRootTypeRef, {
		keyRotations: createTestEntity(KeyRotationsRefTypeRef, {
			_id: "testId",
			list: keyRotationsList,
		}),
	})
}

function makeGroup(groupId: Id) {
	return createTestEntity(GroupTypeRef, {
		_id: groupId,
		adminGroupKeyVersion: "0",
		groupInfo: ["listId", "groupInfo"],
		// we need this to be a non-empty byte array
		adminGroupEncGKey: new Uint8Array(1),
	})
}

function prepareKeyMocks(cryptoWrapperMock: CryptoWrapper, keyLoaderFacadeMock: KeyLoaderFacade, formerGroupKey: number[], userEncAdminKey: Uint8Array) {
	const newKey: AesKey = object()
	when(cryptoWrapperMock.aes256RandomKey()).thenReturn(newKey)

	const currentUserGroupKey: VersionedKey = { object: object(), version: 0 }
	currentUserGroupKey.object.length = 8
	when(keyLoaderFacadeMock.getCurrentSymUserGroupKey()).thenReturn(currentUserGroupKey)

	const userEncNewGroupKey: VersionedEncryptedKey = { key: object(), encryptingKeyVersion: 0 }
	when(cryptoWrapperMock.encryptKeyWithVersionedKey(currentUserGroupKey, newKey)).thenReturn(userEncNewGroupKey)

	const newGroupKeyEncPreviousGroupKey: Uint8Array = object()

	when(cryptoWrapperMock.encryptKey(newKey, formerGroupKey)).thenReturn(newGroupKeyEncPreviousGroupKey)

	const currentAdminGroupKey: AesKey = object()
	currentAdminGroupKey.length = 8
	when(cryptoWrapperMock.decryptKey(currentUserGroupKey.object, userEncAdminKey)).thenReturn(currentAdminGroupKey)

	let adminEncNewGroupKey: Uint8Array = object()
	when(cryptoWrapperMock.encryptKey(currentAdminGroupKey, newKey)).thenReturn(adminEncNewGroupKey)

	return { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, newKey, adminEncNewGroupKey, currentAdminGroupKey }
}
