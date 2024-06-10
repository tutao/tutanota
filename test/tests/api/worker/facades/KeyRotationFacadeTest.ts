import o from "@tutao/otest"
import { KeyRotationFacade } from "../../../../../src/api/worker/facades/KeyRotationFacade.js"
import { EntityClient } from "../../../../../src/api/common/EntityClient.js"
import { instance, matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils.js"
import {
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupKeyRotationData,
	GroupKeyRotationInfoGetOutTypeRef,
	GroupKeyRotationPostIn,
	GroupKeyUpdatesRefTypeRef,
	GroupMembershipTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	KeyPairTypeRef,
	KeyRotation,
	KeyRotationsRefTypeRef,
	KeyRotationTypeRef,
	RecoverCodeData,
	SentGroupInvitationTypeRef,
	User,
	UserAuthenticationTypeRef,
	UserGroupKeyRotationData,
	UserGroupRoot,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../../../../src/api/entities/sys/TypeRefs.js"
import {
	Aes256Key,
	AesKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	EccKeyPair,
	KEY_LENGTH_BYTES_AES_256,
	KyberPrivateKey,
	KyberPublicKey,
	PQKeyPairs,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import type { KeyLoaderFacade } from "../../../../../src/api/worker/facades/KeyLoaderFacade.js"
import type { PQFacade } from "../../../../../src/api/worker/facades/PQFacade.js"
import { IServiceExecutor } from "../../../../../src/api/common/ServiceRequest.js"
import { ServiceExecutor } from "../../../../../src/api/worker/rest/ServiceExecutor.js"
import { CryptoProtocolVersion, GroupKeyRotationType, GroupType, ShareCapability } from "../../../../../src/api/common/TutanotaConstants.js"
import { AdminGroupKeyRotationService, GroupKeyRotationInfoService, GroupKeyRotationService } from "../../../../../src/api/entities/sys/Services.js"
import { CryptoFacade, VersionedEncryptedKey, VersionedKey } from "../../../../../src/api/worker/crypto/CryptoFacade.js"
import { assertNotNull, findAllAndRemove, lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import type { CryptoWrapper } from "../../../../../src/api/worker/crypto/CryptoWrapper.js"
import { RecoverCodeFacade, RecoverData } from "../../../../../src/api/worker/facades/lazy/RecoverCodeFacade.js"
import { UserFacade } from "../../../../../src/api/worker/facades/UserFacade.js"
import { ShareFacade } from "../../../../../src/api/worker/facades/lazy/ShareFacade.js"
import { GroupManagementFacade } from "../../../../../src/api/worker/facades/lazy/GroupManagementFacade.js"
import { GroupInvitationPostData, InternalRecipientKeyDataTypeRef } from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import { RecipientsNotFoundError } from "../../../../../src/api/common/error/RecipientsNotFoundError.js"

const { anything } = matchers
const PQ_SAFE_BITARRAY_KEY_LENGTH = KEY_LENGTH_BYTES_AES_256 / 4

const PW_KEY: AesKey = [0]
PW_KEY.length = PQ_SAFE_BITARRAY_KEY_LENGTH

const CURRENT_USER_GROUP_KEY: VersionedKey = {
	object: [1],
	version: 0,
}
CURRENT_USER_GROUP_KEY.object.length = PQ_SAFE_BITARRAY_KEY_LENGTH

const CURRENT_ADMIN_GROUP_KEY: VersionedKey = {
	object: [2],
	version: 0,
}
CURRENT_ADMIN_GROUP_KEY.object.length = PQ_SAFE_BITARRAY_KEY_LENGTH

const NEW_USER_GROUP_KEY: VersionedKey = {
	object: [3],
	version: 1,
}
const NEW_ADMIN_GROUP_KEY: VersionedKey = {
	object: [4],
	version: 1,
}

const CURRENT_ADMIN_ECC_KEY_PAIR: EccKeyPair = {
	publicKey: new Uint8Array([5]),
	privateKey: new Uint8Array([6]),
}
const NEW_ADMIN_ECC_KEY_PAIR: EccKeyPair = {
	publicKey: new Uint8Array([6]),
	privateKey: new Uint8Array([7]),
}

const RECOVER_CODE: Aes256Key = [8]
const RECOVER_CODE_VERIFIER = new Uint8Array([9])
const AUTH_VERIFIER = createAuthVerifier(PW_KEY)
const DISTRIBUTION_KEY = [10]

const CURRENT_USER_AREA_GROUP_KEY: VersionedKey = {
	object: [11],
	version: 0,
}

const NEW_USER_AREA_GROUP_KEY: VersionedKey = {
	object: [12],
	version: 1,
}
const MEMBER1_BUCKET_KEY: Aes256Key = [13]
const MEMBER1_SESSION_KEY: Aes256Key = [14]

const MEMBER1_SESSION_KEY_ENC_NEW_USER_AREA_GROUP_KEY = new Uint8Array(MEMBER1_SESSION_KEY.concat(NEW_USER_AREA_GROUP_KEY.object))
const MEMBER1_BUCKET_KEY_ENC_MEMBER1_SESSION_KEY = new Uint8Array(MEMBER1_BUCKET_KEY.concat(MEMBER1_SESSION_KEY))
const DISTRIBUTION_KEY_ENC_NEW_USER_GROUP_KEY = new Uint8Array(DISTRIBUTION_KEY.concat(NEW_USER_GROUP_KEY.object))
const CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(CURRENT_ADMIN_GROUP_KEY.object.concat(CURRENT_USER_GROUP_KEY.object)),
	encryptingKeyVersion: 0,
}
const CURRENT_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(CURRENT_ADMIN_GROUP_KEY.object.concat(CURRENT_ADMIN_GROUP_KEY.object)),
	encryptingKeyVersion: 0,
}
const PW_ENC_CURRENT_USER_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(PW_KEY.concat(CURRENT_USER_GROUP_KEY.object)),
	encryptingKeyVersion: 0, // dummy
}
const NEW_ADMIN_GROUP_ENC_NEW_USER_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_ADMIN_GROUP_KEY.object.concat(NEW_USER_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}
const NEW_ADMIN_GROUP_ENC_NEW_ADMIN_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_ADMIN_GROUP_KEY.object.concat(NEW_ADMIN_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}
const NEW_USER_GROUP_ENC_NEW_ADMIN_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_USER_GROUP_KEY.object.concat(NEW_ADMIN_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}
const NEW_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_ADMIN_GROUP_KEY.object.concat(CURRENT_ADMIN_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}

const NEW_USER_GROUP_ENC_CURRENT_USER_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_USER_GROUP_KEY.object.concat(CURRENT_USER_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}
const PW_ENC_NEW_USER_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(PW_KEY.concat(NEW_USER_GROUP_KEY.object)),
	encryptingKeyVersion: 0, // dummy
}
const NEW_USER_GROUP_ENC_RECOVER_CODE_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_USER_GROUP_KEY.object.concat(RECOVER_CODE)),
	encryptingKeyVersion: 1,
}
const RECOVER_CODE_ENC_NEW_USER_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(RECOVER_CODE.concat(NEW_USER_GROUP_KEY.object)),
	encryptingKeyVersion: 0, // dummy
}

const NEW_USER_AREA_GROUP_ENC_CURRENT_USER_AREA_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(NEW_USER_AREA_GROUP_KEY.object.concat(CURRENT_USER_AREA_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}

const CURRENT_ADMIN_GROUP_ENC_NEW_USER_AREA_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(CURRENT_ADMIN_GROUP_KEY.object.concat(NEW_USER_AREA_GROUP_KEY.object)),
	encryptingKeyVersion: 0,
}

const CURRENT_USER_GROUP_ENC_NEW_USER_AREA_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(CURRENT_USER_GROUP_KEY.object.concat(NEW_USER_AREA_GROUP_KEY.object)),
	encryptingKeyVersion: 0,
}

const userId = "userId"
const userGroupId = "userGroupId"
const adminGroupId = "adminGroupId"
const someGroupId = "someGroup"
const usersCustomerGroupId = "usersCustomerGroupId"
const groupInfoElementId = "groupInfo"
const recoverCodeId = "recoverCodeId"
const keyRotationsListId = "keyRotationsListId"
const invitationsListId = "invitationsListId"
const groupKeyUpdatesListId = "groupKeyUpdatesListId"
o.spec("KeyRotationFacadeTest", function () {
	let entityClientMock: EntityClient
	let keyRotationFacade: KeyRotationFacade
	let keyLoaderFacadeMock: KeyLoaderFacade
	let pqFacadeMock: PQFacade
	let serviceExecutorMock: IServiceExecutor
	let userFacade: UserFacade
	let recoverCodeFacade: RecoverCodeFacade
	let cryptoFacade: CryptoFacade
	let shareFacade: ShareFacade
	let groupManagementFacade: GroupManagementFacade

	let user: User
	const pwKey = uint8ArrayToBitArray(new Uint8Array(Array(KEY_LENGTH_BYTES_AES_256).keys()))
	let cryptoWrapperMock: CryptoWrapper
	let userEncAdminKey: Uint8Array
	const groupId = someGroupId
	let group: Group
	let groupInfo: GroupInfo
	let groupKeyVersion0: AesKey

	o.beforeEach(async () => {
		entityClientMock = instance(EntityClient)
		keyLoaderFacadeMock = object()
		pqFacadeMock = object()
		serviceExecutorMock = instance(ServiceExecutor)
		cryptoWrapperMock = object()
		userEncAdminKey = object()
		recoverCodeFacade = object()
		const recoverCodeFacadeAsync: lazyAsync<RecoverCodeFacade> = lazyMemoized(async () => recoverCodeFacade)
		userFacade = object()
		cryptoFacade = object()
		shareFacade = object()
		groupManagementFacade = object()
		keyRotationFacade = new KeyRotationFacade(
			entityClientMock,
			keyLoaderFacadeMock,
			pqFacadeMock,
			serviceExecutorMock,
			cryptoWrapperMock,
			recoverCodeFacadeAsync,
			userFacade,
			cryptoFacade,
			async () => shareFacade,
			async () => groupManagementFacade,
		)
		user = await makeUser(userId, { key: userEncAdminKey, encryptingKeyVersion: 0 })
		const groupData = makeGroup(groupId, user._id)
		group = groupData.group
		groupInfo = groupData.groupInfo

		when(userFacade.getUser()).thenReturn(user)
		when(userFacade.getUserGroupId()).thenReturn(userGroupId)
		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve(group)
		when(keyLoaderFacadeMock.getCurrentSymGroupKey(groupId)).thenResolve({ version: 0, object: groupKeyVersion0 })
		when(entityClientMock.load(UserGroupRootTypeRef, anything())).thenResolve(
			await makeUserGroupRoot(keyRotationsListId, invitationsListId, groupKeyUpdatesListId),
		)
		when(keyLoaderFacadeMock.getCurrentSymUserGroupKey()).thenReturn(CURRENT_USER_GROUP_KEY)
		when(keyLoaderFacadeMock.getCurrentSymGroupKey(adminGroupId)).thenResolve(CURRENT_ADMIN_GROUP_KEY)
		when(keyLoaderFacadeMock.getCurrentSymGroupKey(groupId)).thenResolve(CURRENT_USER_AREA_GROUP_KEY)
	})

	o.spec("initialize", function () {
		o("When a key rotation for the admin group exists on the server, the password key is saved in the facade", async function () {
			when(serviceExecutorMock.get(GroupKeyRotationInfoService, anything())).thenResolve(
				createTestEntity(GroupKeyRotationInfoGetOutTypeRef, { userOrAdminGroupKeyRotationScheduled: true, groupKeyUpdates: [] }),
			)
			await keyRotationFacade.initialize(pwKey, true)

			o(keyRotationFacade.pendingKeyRotations.pwKey).deepEquals(pwKey)
		})

		o("When a key rotation for the admin group does not exist on the server, the password key is not saved in the facade", async function () {
			when(serviceExecutorMock.get(GroupKeyRotationInfoService, anything())).thenResolve(
				createTestEntity(GroupKeyRotationInfoGetOutTypeRef, { userOrAdminGroupKeyRotationScheduled: false, groupKeyUpdates: [] }),
			)
			await keyRotationFacade.initialize(pwKey, true)

			o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
		})
	})

	o.spec("loadPendingKeyRotations", function () {
		o("When a key rotation for a user area group exists on the server, the pending key rotation is saved in the facade.", async function () {
			when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
				makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
			)

			await keyRotationFacade.loadPendingKeyRotations(user)

			o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotation.length).equals(1)
			o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
		})

		o.spec("When a key rotation for a group that is not yet supported exists on the server, nothing is saved in the facade", function () {
			o("Team", async function () {
				when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
					makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Team, groupId),
				)

				await keyRotationFacade.loadPendingKeyRotations(user)

				o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotation.length).equals(0)
				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
			})

			o("Customer", async function () {
				when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
					makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, groupId),
				)

				await keyRotationFacade.loadPendingKeyRotations(user)

				o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotation.length).equals(0)
				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
			})
		})
	})

	o.spec("processPendingKeyRotation", function () {
		o.spec("When a key rotation for a user area group exists, the key rotation is executed successfully", function () {
			o("Rotated group does not have a key pair", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
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
				verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]
				o(update.keyPair).equals(null)
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).deepEquals(adminEncNewGroupKey.key)
				o(update.adminGroupKeyVersion).equals("0")
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.userKeyVersion).equals("0")
			})
			o("Rotated group does not have adminEncKey", async function () {
				group.adminGroupEncGKey = null
				group.adminGroupKeyVersion = null
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
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
				verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]
				o(update.keyPair).equals(null)
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).equals(null)
				o(update.adminGroupKeyVersion).equals(null)
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.userKeyVersion).equals("0")
			})

			o("Rotated group has key pair and adminEncGroupKey", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				group.currentKeys = createTestEntity(KeyPairTypeRef)

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, newKey, adminEncNewGroupKey } = prepareKeyMocks(
					cryptoWrapperMock,
					keyLoaderFacadeMock,
					groupKeyVersion0,
					userEncAdminKey,
				)
				const generated = mockGenerateKeyPairs(pqFacadeMock, cryptoWrapperMock, newKey.object)
				const { newKeyPairs, encryptedEccPrivKey, encryptedKyberPrivKey, kyberPublicKeyBytes } = generated.get(newKey.object)!

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
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
				o(update.adminGroupEncGroupKey).deepEquals(adminEncNewGroupKey.key)
				o(update.adminGroupKeyVersion).equals("0")
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.userKeyVersion).equals("0")
			})

			o.spec("Rotated group is a shared group", function () {
				o("Rotated group has pending invitations", async function () {
					keyRotationFacade.setPendingKeyRotations({
						pwKey: null,
						adminOrUserGroupKeyRotation: null,
						userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(
						cryptoWrapperMock,
						keyLoaderFacadeMock,
						groupKeyVersion0,
						userEncAdminKey,
					)

					const invitationId: IdTuple = [invitationsListId, "invitationElementId"]
					const inviteeMailAddress = "inviteeMailAddress"
					const capability = ShareCapability.Invite
					when(entityClientMock.loadAll(SentGroupInvitationTypeRef, group.invitations)).thenResolve([
						createTestEntity(SentGroupInvitationTypeRef, {
							receivedInvitation: invitationId,
							inviteeMailAddress: inviteeMailAddress,
							capability: capability,
						}),
					])

					const groupInvitationPostDataMock = object<GroupInvitationPostData>()
					when(shareFacade.prepareGroupInvitation(anything(), groupInfo, [inviteeMailAddress], capability)).thenResolve(groupInvitationPostDataMock)

					await keyRotationFacade.processPendingKeyRotation(user)

					const captor = matchers.captor()
					verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
					verify(shareFacade.sendGroupInvitationRequest(groupInvitationPostDataMock))
					const sentData: GroupKeyRotationPostIn = captor.value
					o(sentData.groupKeyUpdates.length).equals(1)
					const update = sentData.groupKeyUpdates[0]
					o(update.group).equals(groupId)
					o(update.groupKeyVersion).equals("1")
					o(update.groupKeyUpdatesForMembers).deepEquals([])
				})

				o("Rotated group has pending invitations, where no re-invite is possible", async function () {
					keyRotationFacade.setPendingKeyRotations({
						pwKey: null,
						adminOrUserGroupKeyRotation: null,
						userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(
						cryptoWrapperMock,
						keyLoaderFacadeMock,
						groupKeyVersion0,
						userEncAdminKey,
					)

					const invitationId: IdTuple = [invitationsListId, "invitationElementId"]
					const inviteeMailAddress = "inviteeMailAddress"
					const capability = ShareCapability.Invite
					when(entityClientMock.loadAll(SentGroupInvitationTypeRef, group.invitations)).thenResolve([
						createTestEntity(SentGroupInvitationTypeRef, {
							receivedInvitation: invitationId,
							inviteeMailAddress: inviteeMailAddress,
							capability: capability,
						}),
					])

					when(shareFacade.prepareGroupInvitation(anything(), groupInfo, [inviteeMailAddress], capability)).thenReject(
						new RecipientsNotFoundError([inviteeMailAddress].join("\n")),
					)

					await keyRotationFacade.processPendingKeyRotation(user)

					const captor = matchers.captor()
					verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
					verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
					const sentData: GroupKeyRotationPostIn = captor.value
					o(sentData.groupKeyUpdates.length).equals(1)
					const update = sentData.groupKeyUpdates[0]
					o(update.group).equals(groupId)
					o(update.groupKeyVersion).equals("1")
					o(update.groupKeyUpdatesForMembers).deepEquals([])
				})

				o("Rotated group has other members", async function () {
					keyRotationFacade.setPendingKeyRotations({
						pwKey: null,
						adminOrUserGroupKeyRotation: null,
						userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(
						cryptoWrapperMock,
						keyLoaderFacadeMock,
						groupKeyVersion0,
						userEncAdminKey,
					)

					const memberUserId = "memberUserId"
					const memberUserGroupInfoId: IdTuple = ["memberUGIListId", "memberUGIElementId"]
					const memberMailAddress = "member@tuta.com"

					when(entityClientMock.loadAll(GroupMemberTypeRef, group.members)).thenResolve([
						createTestEntity(GroupMemberTypeRef, {
							group: groupId,
							user: userId,
						}),
						createTestEntity(GroupMemberTypeRef, {
							group: groupId,
							user: memberUserId,
							userGroupInfo: memberUserGroupInfoId,
						}),
					])
					when(entityClientMock.loadMultiple(GroupInfoTypeRef, memberUserGroupInfoId[0], [memberUserGroupInfoId[1]])).thenResolve([
						createTestEntity(GroupInfoTypeRef, {
							_id: memberUserGroupInfoId,
							mailAddress: memberMailAddress,
						}),
					])
					const recipientKeyVersion = "0"
					const pubEncBucketKeyMock = object<Uint8Array>()
					const protocolVersion = CryptoProtocolVersion.TUTA_CRYPT
					when(cryptoFacade.encryptBucketKeyForInternalRecipient(userGroupId, anything(), memberMailAddress, [])).thenResolve(
						createTestEntity(InternalRecipientKeyDataTypeRef, {
							protocolVersion,
							senderKeyVersion: user.userGroup.groupKeyVersion,
							mailAddress: memberMailAddress,
							recipientKeyVersion,
							pubEncBucketKey: pubEncBucketKeyMock,
						}),
					)
					when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_USER_AREA_GROUP_KEY.object, MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptKey(MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)).thenReturn(MEMBER1_BUCKET_KEY_ENC_MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptBytes(MEMBER1_SESSION_KEY, bitArrayToUint8Array(NEW_USER_AREA_GROUP_KEY.object))).thenReturn(
						MEMBER1_SESSION_KEY_ENC_NEW_USER_AREA_GROUP_KEY,
					)

					await keyRotationFacade.processPendingKeyRotation(user)

					const captor = matchers.captor()
					verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
					verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
					const sentData: GroupKeyRotationPostIn = captor.value
					o(sentData.groupKeyUpdates.length).equals(1)
					const update = sentData.groupKeyUpdates[0]
					o(update.group).equals(groupId)
					o(update.groupKeyVersion).equals("1")

					o(update.groupKeyUpdatesForMembers.length).deepEquals(1)
					const groupKeyUpdateData = update.groupKeyUpdatesForMembers[0]
					o(groupKeyUpdateData.sessionKeyEncGroupKeyVersion).equals("1")
					o(groupKeyUpdateData.sessionKeyEncGroupKey).deepEquals(MEMBER1_SESSION_KEY_ENC_NEW_USER_AREA_GROUP_KEY)
					o(groupKeyUpdateData.bucketKeyEncSessionKey).deepEquals(MEMBER1_BUCKET_KEY_ENC_MEMBER1_SESSION_KEY)
					const pubEncBucketKeyData = groupKeyUpdateData.pubEncBucketKeyData
					o(pubEncBucketKeyData.pubEncBucketKey).deepEquals(pubEncBucketKeyMock)
					o(pubEncBucketKeyData.protocolVersion).deepEquals(protocolVersion)
					o(pubEncBucketKeyData.senderKeyVersion).deepEquals(user.userGroup.groupKeyVersion)
					o(pubEncBucketKeyData.recipientKeyVersion).deepEquals(recipientKeyVersion)
					o(pubEncBucketKeyData.mailAddress).deepEquals(memberMailAddress)
				})

				o("Rotated group has deactivated members", async function () {
					keyRotationFacade.setPendingKeyRotations({
						pwKey: null,
						adminOrUserGroupKeyRotation: null,
						userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(
						cryptoWrapperMock,
						keyLoaderFacadeMock,
						groupKeyVersion0,
						userEncAdminKey,
					)

					const memberUserId = "memberUserId"
					const memberUserGroupInfoId: IdTuple = ["memberUGIListId", "memberUGIElementId"]
					const memberMailAddress = "member@tuta.com"

					const sameUserMember = createTestEntity(GroupMemberTypeRef, {
						group: groupId,
						user: userId,
					})
					when(entityClientMock.loadAll(GroupMemberTypeRef, group.members)).thenResolve(
						[
							sameUserMember,
							createTestEntity(GroupMemberTypeRef, {
								group: groupId,
								user: memberUserId,
								userGroupInfo: memberUserGroupInfoId,
							}),
						],
						[sameUserMember], // second call after removing a member that we cannot udapte the keys for
					)
					when(entityClientMock.loadMultiple(GroupInfoTypeRef, memberUserGroupInfoId[0], [memberUserGroupInfoId[1]])).thenResolve([
						createTestEntity(GroupInfoTypeRef, {
							_id: memberUserGroupInfoId,
							mailAddress: memberMailAddress,
						}),
					])
					const recipientKeyVersion = "0"
					const pubEncBucketKeyMock = object<Uint8Array>()
					const protocolVersion = CryptoProtocolVersion.TUTA_CRYPT
					const notFoundCaptor = matchers.captor()
					when(cryptoFacade.encryptBucketKeyForInternalRecipient(userGroupId, anything(), memberMailAddress, [])).thenDo(
						(senderUserGroupId: Id, bucketKey: AesKey, recipientMailAddress: string, notFoundRecipients: Array<string>) => {
							notFoundRecipients.push(memberMailAddress)
							return null
						},
					)
					when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_USER_AREA_GROUP_KEY.object, MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptKey(MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)).thenReturn(MEMBER1_BUCKET_KEY_ENC_MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptBytes(MEMBER1_SESSION_KEY, bitArrayToUint8Array(NEW_USER_AREA_GROUP_KEY.object))).thenReturn(
						MEMBER1_SESSION_KEY_ENC_NEW_USER_AREA_GROUP_KEY,
					)

					await keyRotationFacade.processPendingKeyRotation(user)

					const captor = matchers.captor()
					verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
					verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
					const sentData: GroupKeyRotationPostIn = captor.value
					o(sentData.groupKeyUpdates.length).equals(1)
					const update = sentData.groupKeyUpdates[0]
					o(update.group).equals(groupId)
					o(update.groupKeyVersion).equals("1")

					o(update.groupKeyUpdatesForMembers).deepEquals([])
				})
			})

			o("Key rotation for multiple groups are executed in one request", async function () {
				const secondGroupId = "groupId-2"

				when(entityClientMock.load(GroupTypeRef, secondGroupId)).thenResolve(makeGroup(secondGroupId, userId).group)
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(secondGroupId)).thenResolve(CURRENT_USER_AREA_GROUP_KEY)

				user.memberships.push(
					createTestEntity(GroupMembershipTypeRef, {
						group: secondGroupId,
						groupKeyVersion: "0",
					}),
				)
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(secondGroupId)).thenResolve({ object: object() })

				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: [
						createTestEntity(KeyRotationTypeRef, {
							groupKeyRotationType: GroupKeyRotationType.UserArea,
							_id: [keyRotationsListId, groupId],
							targetKeyVersion: "1",
						}),
						createTestEntity(KeyRotationTypeRef, {
							groupKeyRotationType: GroupKeyRotationType.UserArea,
							_id: [keyRotationsListId, secondGroupId],
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

		o.spec("Admin group key rotation", function () {
			let userGroup: Group
			let adminGroup: Group
			let recoverData: RecoverData
			let generatedKeyPairs: Map<AesKey, MockedKeyPairs>
			o.beforeEach(function () {
				userGroup = makeGroup(userGroupId, userId).group
				userGroup.adminGroupEncGKey = CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY.key
				userGroup.adminGroupKeyVersion = String(CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY.encryptingKeyVersion)
				userGroup.type = GroupType.User
				userGroup.currentKeys = object()
				adminGroup = makeGroup(adminGroupId, userId).group
				adminGroup.adminGroupEncGKey = CURRENT_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY.key
				adminGroup.adminGroupKeyVersion = String(CURRENT_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY.encryptingKeyVersion)
				adminGroup.type = GroupType.Admin
				adminGroup.currentKeys = object()
				recoverData = {
					hexCode: "hexCode",
					recoverCodeEncUserGroupKey: NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.key,
					userKeyVersion: NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.encryptingKeyVersion,
					userEncRecoverCode: RECOVER_CODE_ENC_NEW_USER_GROUP_KEY.key,
					recoveryCodeVerifier: RECOVER_CODE_VERIFIER,
				}
				when(recoverCodeFacade.getRawRecoverCode(PW_KEY)).thenResolve(RECOVER_CODE)
				when(recoverCodeFacade.encryptRecoveryCode(RECOVER_CODE, NEW_USER_GROUP_KEY)).thenReturn(recoverData)
				when(userFacade.deriveUserGroupKeyDistributionKey(userGroupId, PW_KEY)).thenReturn(DISTRIBUTION_KEY)
				const encryptingKeyCaptor = matchers.captor()
				const keyCaptor = matchers.captor()
				when(cryptoWrapperMock.encryptKey(DISTRIBUTION_KEY, NEW_USER_GROUP_KEY.object)).thenReturn(DISTRIBUTION_KEY_ENC_NEW_USER_GROUP_KEY)
				when(cryptoWrapperMock.encryptKeyWithVersionedKey(encryptingKeyCaptor.capture(), keyCaptor.capture())).thenDo((arg) => ({
					encryptingKeyVersion: encryptingKeyCaptor.value.version,
					key: new Uint8Array(encryptingKeyCaptor.value.object.concat(keyCaptor.value)),
				}))
				when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_ADMIN_GROUP_KEY.object, NEW_USER_GROUP_KEY.object)

				generatedKeyPairs = mockGenerateKeyPairs(pqFacadeMock, cryptoWrapperMock, NEW_ADMIN_GROUP_KEY.object, NEW_USER_GROUP_KEY.object)
			})

			o("Successful rotation", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: PW_KEY,
					adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, {
						_id: [keyRotationsListId, adminGroupId],
						targetKeyVersion: String(Number(adminGroup.groupKeyVersion) + 1),
						groupKeyRotationType: GroupKeyRotationType.Admin,
					}),
					userAreaGroupsKeyRotation: [],
				})

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(
					serviceExecutorMock.post(
						AdminGroupKeyRotationService,
						matchers.argThat((arg) => {
							const userGroupKeyData: UserGroupKeyRotationData = arg.userGroupKeyData
							const adminGroupKeyData: GroupKeyRotationData = arg.adminGroupKeyData

							const recoverCodeData: RecoverCodeData = assertNotNull(userGroupKeyData.recoverCodeData)
							o(recoverCodeData.recoveryCodeVerifier).deepEquals(RECOVER_CODE_VERIFIER)
							o(recoverCodeData.userKeyVersion).equals(String(NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.encryptingKeyVersion))
							o(recoverCodeData.userEncRecoveryCode).deepEquals(RECOVER_CODE_ENC_NEW_USER_GROUP_KEY.key)
							o(recoverCodeData.recoveryCodeEncUserGroupKey).deepEquals(NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.key)

							o(userGroupKeyData.adminGroupKeyVersion).deepEquals(String(NEW_ADMIN_GROUP_ENC_NEW_USER_GROUP_KEY.encryptingKeyVersion))
							o(userGroupKeyData.userGroupKeyVersion).deepEquals(String(NEW_USER_GROUP_KEY.version))
							o(userGroupKeyData.group).deepEquals(userGroupId)
							o(userGroupKeyData.authVerifier).deepEquals(AUTH_VERIFIER)
							o(userGroupKeyData.distributionKeyEncUserGroupKey).deepEquals(DISTRIBUTION_KEY_ENC_NEW_USER_GROUP_KEY)
							o(userGroupKeyData.adminGroupEncUserGroupKey).deepEquals(NEW_ADMIN_GROUP_ENC_NEW_USER_GROUP_KEY.key)
							o(userGroupKeyData.keyPair).notEquals(null)
							const mockedUserKeyPairs = generatedKeyPairs.get(NEW_USER_GROUP_KEY.object)!
							o(userGroupKeyData.keyPair?.symEncPrivEccKey).deepEquals(mockedUserKeyPairs.encryptedEccPrivKey)
							o(userGroupKeyData.keyPair?.pubEccKey).deepEquals(mockedUserKeyPairs.newKeyPairs.eccKeyPair.publicKey)
							o(userGroupKeyData.keyPair?.symEncPrivKyberKey).deepEquals(mockedUserKeyPairs.encryptedKyberPrivKey)
							o(userGroupKeyData.keyPair?.pubKyberKey).deepEquals(mockedUserKeyPairs.kyberPublicKeyBytes)
							o(userGroupKeyData.keyPair?.symEncPrivRsaKey).equals(null)
							o(userGroupKeyData.keyPair?.pubRsaKey).equals(null)
							o(userGroupKeyData.passphraseEncUserGroupKey).deepEquals(PW_ENC_NEW_USER_GROUP_KEY.key)
							o(userGroupKeyData.userGroupEncPreviousGroupKey).deepEquals(NEW_USER_GROUP_ENC_CURRENT_USER_GROUP_KEY.key)

							o(adminGroupKeyData.userKeyVersion).deepEquals(String(NEW_USER_GROUP_ENC_NEW_ADMIN_GROUP_KEY.encryptingKeyVersion))
							o(adminGroupKeyData.adminGroupKeyVersion).deepEquals(String(NEW_ADMIN_GROUP_KEY.version))
							o(adminGroupKeyData.groupKeyVersion).deepEquals(assertNotNull(adminGroupKeyData.adminGroupKeyVersion))
							o(adminGroupKeyData.group).deepEquals(adminGroupId)
							o(adminGroupKeyData.adminGroupEncGroupKey).deepEquals(NEW_ADMIN_GROUP_ENC_NEW_ADMIN_GROUP_KEY.key)
							o(adminGroupKeyData.userEncGroupKey).deepEquals(NEW_USER_GROUP_ENC_NEW_ADMIN_GROUP_KEY.key)
							o(adminGroupKeyData.groupEncPreviousGroupKey).deepEquals(NEW_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY.key)
							o(adminGroupKeyData.keyPair).notEquals(null)
							const mockedAdminKeyPairs = generatedKeyPairs.get(NEW_ADMIN_GROUP_KEY.object)!
							o(adminGroupKeyData.keyPair?.symEncPrivEccKey).deepEquals(mockedAdminKeyPairs.encryptedEccPrivKey)
							o(adminGroupKeyData.keyPair?.pubEccKey).deepEquals(mockedAdminKeyPairs.newKeyPairs.eccKeyPair.publicKey)
							o(adminGroupKeyData.keyPair?.symEncPrivKyberKey).deepEquals(mockedAdminKeyPairs.encryptedKyberPrivKey)
							o(adminGroupKeyData.keyPair?.pubKyberKey).deepEquals(mockedAdminKeyPairs.kyberPublicKeyBytes)
							o(adminGroupKeyData.keyPair?.symEncPrivRsaKey).equals(null)
							o(adminGroupKeyData.keyPair?.pubRsaKey).equals(null)

							return true
						}),
					),
				)

				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
				o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
			})

			o("Successful rotation - no recover code", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: PW_KEY,
					adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, {
						_id: [keyRotationsListId, adminGroupId],
						targetKeyVersion: String(Number(adminGroup.groupKeyVersion) + 1),
						groupKeyRotationType: GroupKeyRotationType.Admin,
					}),
					userAreaGroupsKeyRotation: [],
				})

				assertNotNull(user.auth).recoverCode = null

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(
					serviceExecutorMock.post(
						AdminGroupKeyRotationService,
						matchers.argThat((arg) => {
							const userGroupKeyData: UserGroupKeyRotationData = arg.userGroupKeyData
							const adminGroupKeyData: GroupKeyRotationData = arg.adminGroupKeyData
							o(userGroupKeyData.recoverCodeData).equals(null)
							o(userGroupKeyData.userGroupKeyVersion).deepEquals(String(NEW_USER_GROUP_KEY.version))
							o(adminGroupKeyData.groupKeyVersion).deepEquals(assertNotNull(adminGroupKeyData.adminGroupKeyVersion))
							return true
						}),
					),
				)
				verify(recoverCodeFacade.getRawRecoverCode(matchers.anything()), { times: 0 })
				verify(recoverCodeFacade.encryptRecoveryCode(anything(), anything()), { times: 0 })
			})
		})

		o.spec("Ignore currently unsupported cases", function () {
			o("If the user is not an admin, the user area group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				// remove admin group membership
				findAllAndRemove(user.memberships, (m) => m.groupType === GroupType.Admin)

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})

			o("If the admin group key is not quantum-safe yet, the user area group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					userAreaGroupsKeyRotation: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				const { currentAdminGroupKey } = prepareKeyMocks(cryptoWrapperMock, keyLoaderFacadeMock, groupKeyVersion0, userEncAdminKey)
				// make admin group key a 128-bit key
				currentAdminGroupKey.object.length = 4

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})
		})
	})

	function makeGroup(groupId: Id, userId: Id): { group: Group; groupInfo: GroupInfo } {
		const group = createTestEntity(GroupTypeRef, {
			_id: groupId,
			adminGroupKeyVersion: "0",
			groupInfo: ["listId", groupInfoElementId],
			// we need this to be a non-empty byte array
			adminGroupEncGKey: new Uint8Array(1),
			groupKeyVersion: "0",
			invitations: invitationsListId,
			members: "membersListId",
		})
		const groupInfo = createTestEntity(GroupInfoTypeRef, {
			_id: group.groupInfo,
			group: groupId,
		})
		when(entityClientMock.load(GroupInfoTypeRef, group.groupInfo)).thenResolve(groupInfo)
		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve(group)
		when(entityClientMock.loadAll(SentGroupInvitationTypeRef, group.invitations)).thenResolve([])
		const member = createTestEntity(GroupMemberTypeRef, {
			group: groupId,
			user: userId,
		})
		when(entityClientMock.loadAll(GroupMemberTypeRef, group.members)).thenResolve([member])
		return { group, groupInfo }
	}
})

async function makeUser(userId: Id, userEncAdminKey: VersionedEncryptedKey): Promise<User> {
	return createTestEntity(UserTypeRef, {
		_id: userId,
		userGroup: createTestEntity(GroupMembershipTypeRef, {
			groupKeyVersion: "0",
			symKeyVersion: String(PW_ENC_CURRENT_USER_GROUP_KEY.encryptingKeyVersion),
			symEncGKey: PW_ENC_CURRENT_USER_GROUP_KEY.key,
			groupType: GroupType.User,
			group: userGroupId,
		}),
		auth: createTestEntity(UserAuthenticationTypeRef, { recoverCode: recoverCodeId }),
		memberships: [
			createTestEntity(GroupMembershipTypeRef, {
				groupType: GroupType.Admin,
				groupKeyVersion: "0",
				symKeyVersion: String(userEncAdminKey.encryptingKeyVersion),
				symEncGKey: userEncAdminKey.key,
				group: adminGroupId,
			}),
			createTestEntity(GroupMembershipTypeRef, {
				group: someGroupId,
			}),
			createTestEntity(GroupMembershipTypeRef, {
				groupType: GroupType.Customer,
				group: usersCustomerGroupId,
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

async function makeUserGroupRoot(keyRotationsList: Id, invitations: Id, groupKeyUpdatesList: Id): Promise<UserGroupRoot> {
	return createTestEntity(UserGroupRootTypeRef, {
		keyRotations: createTestEntity(KeyRotationsRefTypeRef, {
			list: keyRotationsList,
		}),
		invitations,
		groupKeyUpdates: createTestEntity(GroupKeyUpdatesRefTypeRef, {
			list: groupKeyUpdatesList,
		}),
	})
}

function prepareKeyMocks(cryptoWrapperMock: CryptoWrapper, keyLoaderFacadeMock: KeyLoaderFacade, formerGroupKey: number[], userEncAdminKey: Uint8Array) {
	when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_USER_AREA_GROUP_KEY.object)
	when(keyLoaderFacadeMock.getCurrentSymUserGroupKey()).thenReturn(CURRENT_USER_GROUP_KEY)

	const encryptingKeyCaptor = matchers.captor()
	const keyCaptor = matchers.captor()
	when(cryptoWrapperMock.encryptKeyWithVersionedKey(encryptingKeyCaptor.capture(), keyCaptor.capture())).thenDo((arg) => ({
		encryptingKeyVersion: encryptingKeyCaptor.value.version,
		key: new Uint8Array(encryptingKeyCaptor.value.object.concat(keyCaptor.value)),
	}))

	when(keyLoaderFacadeMock.getCurrentSymGroupKey(adminGroupId)).thenResolve(CURRENT_ADMIN_GROUP_KEY)

	return {
		userEncNewGroupKey: CURRENT_USER_GROUP_ENC_NEW_USER_AREA_GROUP_KEY,
		newGroupKeyEncPreviousGroupKey: NEW_USER_AREA_GROUP_ENC_CURRENT_USER_AREA_GROUP_KEY,
		newKey: NEW_USER_AREA_GROUP_KEY,
		adminEncNewGroupKey: CURRENT_ADMIN_GROUP_ENC_NEW_USER_AREA_GROUP_KEY,
		currentAdminGroupKey: CURRENT_ADMIN_GROUP_KEY,
	}
}

type MockedKeyPairs = {
	newKeyPairs: PQKeyPairs
	encryptedEccPrivKey: Uint8Array
	encryptedKyberPrivKey: Uint8Array
	kyberPublicKeyBytes: Uint8Array
}

function mockGenerateKeyPairs(pqFacadeMock: PQFacade, cryptoWrapperMock: CryptoWrapper, ...newKeys: AesKey[]): Map<AesKey, MockedKeyPairs> {
	const results = new Map<AesKey, MockedKeyPairs>()
	for (const newKey of newKeys) {
		const newKeyPairs: PQKeyPairs = object()
		newKeyPairs.eccKeyPair = {
			publicKey: object<Uint8Array>(),
			privateKey: object<Uint8Array>(),
		}
		newKeyPairs.kyberKeyPair = {
			publicKey: object<KyberPublicKey>(),
			privateKey: object<KyberPrivateKey>(),
		}

		const encryptedEccPrivKey: Uint8Array = object()
		when(cryptoWrapperMock.encryptEccKey(newKey, newKeyPairs.eccKeyPair.privateKey)).thenReturn(encryptedEccPrivKey)
		const encryptedKyberPrivKey: Uint8Array = object()
		when(cryptoWrapperMock.encryptKyberKey(newKey, newKeyPairs.kyberKeyPair.privateKey)).thenReturn(encryptedKyberPrivKey)
		const kyberPublicKeyBytes: Uint8Array = object()
		when(cryptoWrapperMock.kyberPublicKeyToBytes(newKeyPairs.kyberKeyPair.publicKey)).thenReturn(kyberPublicKeyBytes)
		results.set(newKey, { newKeyPairs, encryptedEccPrivKey, encryptedKyberPrivKey, kyberPublicKeyBytes })
	}
	// we need to pass the first result separately because thenResolve's signature requires it
	const [first, ...rest] = Array.from(results.values())
	when(pqFacadeMock.generateKeyPairs()).thenResolve(first.newKeyPairs, ...rest.map((result) => result.newKeyPairs))
	return results
}
