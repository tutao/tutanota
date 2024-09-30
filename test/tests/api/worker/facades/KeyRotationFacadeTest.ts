import o from "@tutao/otest"
import { KeyRotationFacade } from "../../../../../src/common/api/worker/facades/KeyRotationFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { instance, matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils.js"
import {
	AdminGroupKeyAuthenticationData,
	AdminGroupKeyAuthenticationDataTypeRef,
	AdminGroupKeyRotationPostIn,
	createPublicKeyGetOut,
	Customer,
	CustomerTypeRef,
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
	KeyPair,
	KeyPairTypeRef,
	KeyRotation,
	KeyRotationsRefTypeRef,
	KeyRotationTypeRef,
	PublicKeyGetIn,
	RecoverCodeData,
	SentGroupInvitationTypeRef,
	User,
	UserAuthenticationTypeRef,
	UserGroupKeyRotationData,
	UserGroupRoot,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import {
	Aes256Key,
	AesKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	EncryptedPqKeyPairs,
	KEY_LENGTH_BYTES_AES_256,
	KyberPrivateKey,
	KyberPublicKey,
	PQKeyPairs,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import type { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import type { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import {
	CryptoProtocolVersion,
	GroupKeyRotationType,
	GroupType,
	PublicKeyIdentifierType,
	ShareCapability,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import {
	AdminGroupKeyRotationService,
	GroupKeyRotationInfoService,
	GroupKeyRotationService,
	PublicKeyService,
	UserGroupKeyRotationService,
} from "../../../../../src/common/api/entities/sys/Services.js"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import { assertNotNull, findAllAndRemove, lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import type { CryptoWrapper, VersionedEncryptedKey, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { RecoverCodeFacade, RecoverData } from "../../../../../src/common/api/worker/facades/lazy/RecoverCodeFacade.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { ShareFacade } from "../../../../../src/common/api/worker/facades/lazy/ShareFacade.js"
import { GroupManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/GroupManagementFacade.js"
import { GroupInvitationPostData, InternalRecipientKeyDataTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { RecipientsNotFoundError } from "../../../../../src/common/api/common/error/RecipientsNotFoundError.js"
import { assertThrows, mockAttribute, spy } from "@tutao/tutanota-test-utils"
import { LockedError } from "../../../../../src/common/api/common/error/RestError.js"
import { AsymmetricCryptoFacade, convertToVersionedPublicKeys } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"

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
	object: [3, 3, 3, 3],
	version: 1,
}
const NEW_ADMIN_GROUP_KEY: VersionedKey = {
	object: [4],
	version: 1,
}

const RECOVER_CODE: Aes256Key = [8]
const RECOVER_CODE_VERIFIER = new Uint8Array([9])
const AUTH_VERIFIER = createAuthVerifier(PW_KEY)
const DISTRIBUTION_KEY = [10]

const CURRENT_USER_AREA_GROUP_KEY: VersionedKey = {
	object: [11],
	version: 0,
}

const NEW_GROUP_KEY: VersionedKey = {
	object: [12],
	version: 1,
}
const MEMBER1_BUCKET_KEY: Aes256Key = [13]
const MEMBER1_SESSION_KEY: Aes256Key = [14]

const OTHER_MEMBER_USER_GROUP_KEY: VersionedKey = {
	object: [15],
	version: 0,
}
OTHER_MEMBER_USER_GROUP_KEY.object.length = PQ_SAFE_BITARRAY_KEY_LENGTH

const MEMBER1_SESSION_KEY_ENC_NEW_USER_AREA_GROUP_KEY = new Uint8Array(MEMBER1_SESSION_KEY.concat(NEW_GROUP_KEY.object))
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
	key: new Uint8Array(NEW_GROUP_KEY.object.concat(CURRENT_USER_AREA_GROUP_KEY.object)),
	encryptingKeyVersion: 1,
}

const CURRENT_ADMIN_GROUP_ENC_NEW_USER_AREA_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(CURRENT_ADMIN_GROUP_KEY.object.concat(NEW_GROUP_KEY.object)),
	encryptingKeyVersion: 0,
}

const CURRENT_USER_GROUP_ENC_NEW_USER_AREA_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(CURRENT_USER_GROUP_KEY.object.concat(NEW_GROUP_KEY.object)),
	encryptingKeyVersion: 0,
}

const OTHER_USER_GROUP_ENC_NEW_SHARED_GROUP_KEY: VersionedEncryptedKey = {
	key: new Uint8Array(OTHER_MEMBER_USER_GROUP_KEY.object.concat(NEW_GROUP_KEY.object)),
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

function prepareRecoverData(recoverData: RecoverData, recoverCodeFacade: RecoverCodeFacade) {
	recoverData = {
		hexCode: "hexCode",
		recoverCodeEncUserGroupKey: NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.key,
		userKeyVersion: NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.encryptingKeyVersion,
		userEncRecoverCode: RECOVER_CODE_ENC_NEW_USER_GROUP_KEY.key,
		recoveryCodeVerifier: RECOVER_CODE_VERIFIER,
	}
	when(recoverCodeFacade.getRawRecoverCode(PW_KEY)).thenResolve(RECOVER_CODE)
	when(recoverCodeFacade.encryptRecoveryCode(RECOVER_CODE, NEW_USER_GROUP_KEY)).thenReturn(recoverData)
}

function verifyRecoverCodeData(userGroupKeyData: UserGroupKeyRotationData) {
	const recoverCodeData: RecoverCodeData = assertNotNull(userGroupKeyData.recoverCodeData)
	o(recoverCodeData.recoveryCodeVerifier).deepEquals(RECOVER_CODE_VERIFIER)
	o(recoverCodeData.userKeyVersion).equals(String(NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.encryptingKeyVersion))
	o(recoverCodeData.userEncRecoveryCode).deepEquals(RECOVER_CODE_ENC_NEW_USER_GROUP_KEY.key)
	o(recoverCodeData.recoveryCodeEncUserGroupKey).deepEquals(NEW_USER_GROUP_ENC_RECOVER_CODE_KEY.key)
}

function prepareUserKeyRotation(
	mocks: {
		serviceExecutor: IServiceExecutor
		cryptoWrapper: CryptoWrapper
		entityClient: EntityClient
		asymmetricCryptoFacade: AsymmetricCryptoFacade
	},
	keyRotationFacade: KeyRotationFacade,
	userGroup: Group,
) {
	const commonHash = new Uint8Array([1, 2])
	const adminGeneratedHash = new Uint8Array([1, 2, 3])
	const adminPubEccKey = new Uint8Array([0, 9, 9])
	const pubEncSymKeyBytes = new Uint8Array([7, 7, 7])

	const adminPubKyberKey = new Uint8Array([8, 8, 8])

	keyRotationFacade.setPendingKeyRotations({
		pwKey: PW_KEY,
		adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, {
			_id: [keyRotationsListId, userGroupId],
			targetKeyVersion: String(Number(userGroup.groupKeyVersion) + 1),
			groupKeyRotationType: GroupKeyRotationType.User,
			adminGroupKeyAuthenticationData: createTestEntity(AdminGroupKeyAuthenticationDataTypeRef, {
				authKeyEncAdminRotationHash: adminGeneratedHash,
				version: "1",
				userGroup: "userGroup",
			}),
		}),
		teamOrCustomerGroupKeyRotations: [],
		userAreaGroupsKeyRotations: [],
	})
	when(mocks.cryptoWrapper.aesDecrypt(matchers.anything(), matchers.anything(), true)).thenReturn(commonHash)

	when(mocks.cryptoWrapper.sha256Hash(matchers.anything())).thenReturn(commonHash)
	// public key service request to get the admin keys

	when(mocks.serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve({
		pubEccKey: adminPubEccKey,
		pubKyberKey: adminPubKyberKey,
	})
	const customer = createTestEntity(CustomerTypeRef, { adminGroup: "adminGroupId" })

	when(mocks.entityClient.load(CustomerTypeRef, matchers.anything())).thenResolve(customer)
	when(mocks.asymmetricCryptoFacade.tutaCryptEncryptSymKey(matchers.anything(), matchers.anything(), matchers.anything())).thenResolve({
		pubEncSymKeyBytes,
		cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
		senderKeyVersion: 1,
		recipientKeyVersion: 1,
	})
}

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
	let asymmetricCryptoFacade: AsymmetricCryptoFacade

	let user: User
	const pwKey = uint8ArrayToBitArray(new Uint8Array(Array(KEY_LENGTH_BYTES_AES_256).keys()))
	let cryptoWrapperMock: CryptoWrapper
	let userEncAdminKey: Uint8Array
	const groupId = someGroupId
	let group: Group
	let groupInfo: GroupInfo
	let groupKeyVersion0: AesKey
	let customer: Customer

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
		asymmetricCryptoFacade = object()
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
			asymmetricCryptoFacade,
		)
		user = await makeUser(userId, { key: userEncAdminKey, encryptingKeyVersion: 0 })
		const customerId = "customerId"
		customer = createTestEntity(CustomerTypeRef, { _id: customerId, userGroups: "userGroupsList" })
		const groupData = makeGroupWithMembership(groupId, user)
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
		when(entityClientMock.load(CustomerTypeRef, customerId)).thenResolve(customer)
		when(entityClientMock.loadAll(GroupInfoTypeRef, customer.userGroups)).thenResolve([])
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

			o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotations.length).equals(1)
			o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
		})

		o.spec("When a key rotation for a group that is not yet supported exists on the server, nothing is saved in the facade", function () {
			o("Team", async function () {
				when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
					makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Team, groupId),
				)

				await keyRotationFacade.loadPendingKeyRotations(user)

				o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotations.length).equals(0)
				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
			})

			o("Customer", async function () {
				when(entityClientMock.loadAll(KeyRotationTypeRef, anything())).thenResolve(
					makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, groupId),
				)

				await keyRotationFacade.loadPendingKeyRotations(user)

				o(keyRotationFacade.pendingKeyRotations.userAreaGroupsKeyRotations.length).equals(0)
				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
			})
		})
	})

	o.spec("processPendingKeyRotation", function () {
		o.spec("User area group key rotation", function () {
			o("Rotated group does not have a key pair", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(cryptoWrapperMock)

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
				o(update.adminGroupEncGroupKey).deepEquals(null)
				o(update.adminGroupKeyVersion).equals(null)
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.groupMembershipUpdateData.length).equals(1)
				o(update.groupMembershipUpdateData[0].userId).equals(userId)
				o(update.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[0].userKeyVersion).equals("0")
			})
			o("Rotated group does not have adminEncKey", async function () {
				group.adminGroupEncGKey = null
				when(groupManagementFacade.hasAdminEncGKey(group)).thenReturn(false)
				group.adminGroupKeyVersion = null
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey } = prepareKeyMocks(cryptoWrapperMock)

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
				o(update.groupMembershipUpdateData.length).equals(1)
				o(update.groupMembershipUpdateData[0].userId).equals(userId)
				o(update.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[0].userKeyVersion).equals("0")
			})

			o("Rotated group has key pair and adminEncGroupKey", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				group.currentKeys = createTestEntity(KeyPairTypeRef)

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, newKey, adminEncNewGroupKey } = prepareKeyMocks(cryptoWrapperMock)
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
				o(update.adminGroupEncGroupKey).deepEquals(null)
				o(update.adminGroupKeyVersion).equals(null)
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.groupMembershipUpdateData.length).equals(1)
				o(update.groupMembershipUpdateData[0].userId).equals(userId)
				o(update.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[0].userKeyVersion).equals("0")
			})

			o.spec("Rotated group is a shared group", function () {
				o("Rotated group has pending invitations", async function () {
					keyRotationFacade.setPendingKeyRotations({
						pwKey: null,
						adminOrUserGroupKeyRotation: null,
						teamOrCustomerGroupKeyRotations: [],
						userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					prepareKeyMocks(cryptoWrapperMock)

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
						teamOrCustomerGroupKeyRotations: [],
						userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					prepareKeyMocks(cryptoWrapperMock)

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
						teamOrCustomerGroupKeyRotations: [],
						userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					prepareKeyMocks(cryptoWrapperMock)

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
					when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_GROUP_KEY.object, MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptKey(MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)).thenReturn(MEMBER1_BUCKET_KEY_ENC_MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptBytes(MEMBER1_SESSION_KEY, bitArrayToUint8Array(NEW_GROUP_KEY.object))).thenReturn(
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
					o(pubEncBucketKeyData.pubEncSymKey).deepEquals(pubEncBucketKeyMock)
					o(pubEncBucketKeyData.protocolVersion).deepEquals(protocolVersion)
					o(pubEncBucketKeyData.senderKeyVersion).deepEquals(user.userGroup.groupKeyVersion)
					o(pubEncBucketKeyData.recipientKeyVersion).deepEquals(recipientKeyVersion)
					o(pubEncBucketKeyData.recipientIdentifier).deepEquals(memberMailAddress)
					o(pubEncBucketKeyData.recipientIdentifierType).deepEquals(PublicKeyIdentifierType.MAIL_ADDRESS)
				})

				o("Rotated group has deactivated members", async function () {
					keyRotationFacade.setPendingKeyRotations({
						pwKey: null,
						adminOrUserGroupKeyRotation: null,
						teamOrCustomerGroupKeyRotations: [],
						userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
					})

					prepareKeyMocks(cryptoWrapperMock)

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
					when(cryptoFacade.encryptBucketKeyForInternalRecipient(userGroupId, anything(), memberMailAddress, [])).thenDo(
						(senderUserGroupId: Id, bucketKey: AesKey, recipientMailAddress: string, notFoundRecipients: Array<string>) => {
							notFoundRecipients.push(memberMailAddress)
							return null
						},
					)
					when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_GROUP_KEY.object, MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptKey(MEMBER1_BUCKET_KEY, MEMBER1_SESSION_KEY)).thenReturn(MEMBER1_BUCKET_KEY_ENC_MEMBER1_SESSION_KEY)
					when(cryptoWrapperMock.encryptBytes(MEMBER1_SESSION_KEY, bitArrayToUint8Array(NEW_GROUP_KEY.object))).thenReturn(
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
				makeGroupWithMembership(secondGroupId, user).group
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(secondGroupId)).thenResolve(CURRENT_USER_AREA_GROUP_KEY)

				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: [
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

				prepareKeyMocks(cryptoWrapperMock)

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

			o("Rotate group user area group of non admin", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				// remove admin group membership
				findAllAndRemove(user.memberships, (m) => m.groupType === GroupType.Admin)

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(cryptoWrapperMock)

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
				o(update.adminGroupEncGroupKey).deepEquals(null)
				o(update.adminGroupKeyVersion).equals(null)
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.groupMembershipUpdateData.length).equals(1)
				o(update.groupMembershipUpdateData[0].userId).equals(userId)
				o(update.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[0].userKeyVersion).equals("0")
			})
		})

		o.spec("Admin group key rotation", function () {
			let userGroup: Group
			let adminGroup: Group
			let recoverData: RecoverData
			let generatedKeyPairs: Map<AesKey, MockedKeyPairs>
			o.beforeEach(function () {
				userGroup = makeGroupWithMembership(userGroupId, user).group
				userGroup.adminGroupEncGKey = CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY.key
				userGroup.adminGroupKeyVersion = String(CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY.encryptingKeyVersion)
				userGroup.type = GroupType.User
				userGroup.currentKeys = object()
				adminGroup = makeGroupWithMembership(adminGroupId, user).group
				adminGroup.adminGroupEncGKey = CURRENT_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY.key
				adminGroup.adminGroupKeyVersion = String(CURRENT_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY.encryptingKeyVersion)
				adminGroup.type = GroupType.Admin
				adminGroup.currentKeys = object()
				prepareRecoverData(recoverData, recoverCodeFacade)
				when(groupManagementFacade.hasAdminEncGKey(userGroup)).thenReturn(true)
				when(groupManagementFacade.hasAdminEncGKey(adminGroup)).thenReturn(true)
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
						groupKeyRotationType: GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount,
					}),
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: [],
				})

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(
					serviceExecutorMock.post(
						AdminGroupKeyRotationService,
						matchers.argThat((arg) => {
							const userGroupKeyData: UserGroupKeyRotationData = arg.userGroupKeyData
							const adminGroupKeyData: GroupKeyRotationData = arg.adminGroupKeyData
							verifyRecoverCodeData(userGroupKeyData)

							o(userGroupKeyData.adminGroupKeyVersion).deepEquals(String(NEW_ADMIN_GROUP_ENC_NEW_USER_GROUP_KEY.encryptingKeyVersion))
							verifyUserGroupKeyDataExceptAdminKey(userGroupKeyData, generatedKeyPairs)

							o(adminGroupKeyData.groupMembershipUpdateData.length).equals(1)
							o(adminGroupKeyData.groupMembershipUpdateData[0].userId).deepEquals(userId)
							o(adminGroupKeyData.groupMembershipUpdateData[0].userKeyVersion).deepEquals(
								String(NEW_USER_GROUP_ENC_NEW_ADMIN_GROUP_KEY.encryptingKeyVersion),
							)
							o(adminGroupKeyData.adminGroupKeyVersion).deepEquals(String(NEW_ADMIN_GROUP_KEY.version))
							o(adminGroupKeyData.groupKeyVersion).deepEquals(assertNotNull(adminGroupKeyData.adminGroupKeyVersion))
							o(adminGroupKeyData.group).deepEquals(adminGroupId)
							o(adminGroupKeyData.adminGroupEncGroupKey).deepEquals(NEW_ADMIN_GROUP_ENC_NEW_ADMIN_GROUP_KEY.key)
							o(adminGroupKeyData.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(NEW_USER_GROUP_ENC_NEW_ADMIN_GROUP_KEY.key)
							o(adminGroupKeyData.groupEncPreviousGroupKey).deepEquals(NEW_ADMIN_GROUP_ENC_CURRENT_ADMIN_GROUP_KEY.key)
							const mockedAdminKeyPairs = generatedKeyPairs.get(NEW_ADMIN_GROUP_KEY.object)!
							verifyKeyPair(adminGroupKeyData.keyPair, mockedAdminKeyPairs)
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
						groupKeyRotationType: GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount,
					}),
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: [],
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

			o("Successful rotation with multiple users - sends encrypted new key hash", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: PW_KEY,
					adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, {
						_id: [keyRotationsListId, adminGroupId],
						targetKeyVersion: String(Number(adminGroup.groupKeyVersion) + 1),
						groupKeyRotationType: GroupKeyRotationType.AdminGroupKeyRotationSingleUserAccount,
					}),
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: [],
				})

				const adminUserGroupInfo = createTestEntity(GroupInfoTypeRef, { group: userGroupId })
				const additionalUserGroupId = "additionalUserGroupId"
				const additionalUserGroupInfo = createTestEntity(GroupInfoTypeRef, { group: additionalUserGroupId })
				when(entityClientMock.loadAll(GroupInfoTypeRef, customer.userGroups)).thenResolve([adminUserGroupInfo, additionalUserGroupInfo])
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(groupId)).thenResolve({ version: 0, object: groupKeyVersion0 })
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(additionalUserGroupId)).thenResolve({ version: 0, object: groupKeyVersion0 })
				const cleartextHash = object<Uint8Array>()
				when(cryptoWrapperMock.sha256Hash(anything())).thenReturn(cleartextHash)
				const encHash = object<Uint8Array>()
				when(cryptoWrapperMock.aesEncrypt(anything(), cleartextHash)).thenReturn(encHash)

				when(groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(additionalUserGroupInfo.group)).thenResolve(object())

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(
					serviceExecutorMock.post(
						AdminGroupKeyRotationService,
						matchers.argThat((arg: AdminGroupKeyRotationPostIn) => {
							o(arg.adminGroupKeyAuthenticationDataList).notEquals(null)
							o(arg.adminGroupKeyAuthenticationDataList.length).equals(1)
							const adminGroupKeyAuthenticationData: AdminGroupKeyAuthenticationData = arg.adminGroupKeyAuthenticationDataList[0]
							o(adminGroupKeyAuthenticationData.userGroup).equals(additionalUserGroupId)
							o(adminGroupKeyAuthenticationData.version).equals("1")
							o(adminGroupKeyAuthenticationData.authKeyEncAdminRotationHash).equals(encHash)
							return true
						}),
					),
				)

				verify(
					cryptoWrapperMock.deriveKeyWithHkdf(
						matchers.argThat((arg) => {
							o(arg.context).equals("adminGroupKeyRotationHash")
							o(arg.salt).equals(additionalUserGroupId)
							return true
						}),
					),
				)
			})
		})

		o.spec("User group key rotation", function () {
			let userGroup: Group
			let generatedKeyPairs: Map<AesKey, MockedKeyPairs>
			let recoverData: RecoverData

			o.beforeEach(function () {
				userGroup = makeGroupWithMembership(userGroupId, user).group
				userGroup.pubAdminGroupEncGKey = null
				userGroup.adminGroupEncGKey = CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY.key
				userGroup.adminGroupKeyVersion = String(CURRENT_ADMIN_GROUP_ENC_CURRENT_USER_GROUP_KEY.encryptingKeyVersion)
				userGroup.type = GroupType.User
				userGroup.currentKeys = object()
				prepareRecoverData(recoverData, recoverCodeFacade)

				when(groupManagementFacade.hasAdminEncGKey(userGroup)).thenReturn(true)
				when(userFacade.deriveUserGroupKeyDistributionKey(userGroupId, PW_KEY)).thenReturn(DISTRIBUTION_KEY)
				const encryptingKeyCaptor = matchers.captor()
				const keyCaptor = matchers.captor()
				when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_USER_GROUP_KEY.object)
				when(cryptoWrapperMock.encryptKeyWithVersionedKey(encryptingKeyCaptor.capture(), keyCaptor.capture())).thenDo((arg) => ({
					encryptingKeyVersion: encryptingKeyCaptor.value.version,
					key: new Uint8Array(encryptingKeyCaptor.value.object.concat(keyCaptor.value)),
				}))
				when(cryptoWrapperMock.encryptKey(DISTRIBUTION_KEY, NEW_USER_GROUP_KEY.object)).thenReturn(DISTRIBUTION_KEY_ENC_NEW_USER_GROUP_KEY)
				generatedKeyPairs = mockGenerateKeyPairs(pqFacadeMock, cryptoWrapperMock, NEW_USER_GROUP_KEY.object)
				const newUserPqKeyPair = generatedKeyPairs.get(NEW_USER_GROUP_KEY.object)!.newKeyPairs
				const latestAdminKeyVersion = 1
				const publicKeyGetOut = createPublicKeyGetOut({
					pubKeyVersion: latestAdminKeyVersion.toString(),
					pubRsaKey: null,
					pubEccKey: object(),
					pubKyberKey: object(),
				})
				const adminPubKeys = convertToVersionedPublicKeys(publicKeyGetOut)
				when(
					serviceExecutorMock.get(
						PublicKeyService,
						matchers.argThat((arg: PublicKeyGetIn) => {
							return arg.version == null && arg.identifierType === PublicKeyIdentifierType.GROUP_ID && arg.identifier === adminGroupId
						}),
					),
				).thenResolve(publicKeyGetOut)
				when(
					asymmetricCryptoFacade.tutaCryptEncryptSymKey(NEW_USER_GROUP_KEY.object, adminPubKeys, {
						version: NEW_USER_GROUP_KEY.version,
						object: newUserPqKeyPair.eccKeyPair,
					}),
				).thenResolve({
					pubEncSymKeyBytes: object(),
					senderKeyVersion: NEW_USER_GROUP_KEY.version,
					recipientKeyVersion: latestAdminKeyVersion,
					cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
				})
			})

			o("Successful rotation", async function () {
				prepareUserKeyRotation(
					{
						serviceExecutor: serviceExecutorMock,
						cryptoWrapper: cryptoWrapperMock,
						entityClient: entityClientMock,
						asymmetricCryptoFacade: asymmetricCryptoFacade,
					},
					keyRotationFacade,
					userGroup,
				)

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(
					serviceExecutorMock.post(
						UserGroupKeyRotationService,
						matchers.argThat((arg) => {
							const userGroupKeyData: UserGroupKeyRotationData = arg.userGroupKeyData
							verifyRecoverCodeData(userGroupKeyData)

							o(userGroupKeyData.adminGroupEncUserGroupKey).equals(null)
							o(userGroupKeyData.adminGroupKeyVersion).deepEquals(String(NEW_ADMIN_GROUP_ENC_NEW_USER_GROUP_KEY.encryptingKeyVersion))
							const pubAdminGroupEncUserGroupKey = userGroupKeyData.pubAdminGroupEncUserGroupKey
							o(pubAdminGroupEncUserGroupKey).notEquals(null)
							o(pubAdminGroupEncUserGroupKey?.pubEncSymKey)

							verifyUserGroupKeyDataExceptAdminKey(userGroupKeyData, generatedKeyPairs)

							return true
						}),
					),
				)
				verify(
					cryptoWrapperMock.deriveKeyWithHkdf(
						matchers.argThat((arg) => {
							o(arg.context).equals("adminGroupKeyRotationHash")
							o(arg.salt).equals(userGroupId)
							return true
						}),
					),
				)

				o(keyRotationFacade.pendingKeyRotations.adminOrUserGroupKeyRotation).equals(null)
				o(keyRotationFacade.pendingKeyRotations.pwKey).equals(null)
			})

			o("Successful rotation - no recover code", async function () {
				prepareUserKeyRotation(
					{
						serviceExecutor: serviceExecutorMock,
						cryptoWrapper: cryptoWrapperMock,
						entityClient: entityClientMock,
						asymmetricCryptoFacade: asymmetricCryptoFacade,
					},
					keyRotationFacade,
					userGroup,
				)

				assertNotNull(user.auth).recoverCode = null

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(
					serviceExecutorMock.post(
						UserGroupKeyRotationService,
						matchers.argThat((arg) => {
							const userGroupKeyData: UserGroupKeyRotationData = arg.userGroupKeyData
							o(userGroupKeyData.recoverCodeData).equals(null)
							o(userGroupKeyData.userGroupKeyVersion).deepEquals(String(NEW_USER_GROUP_KEY.version))
							return true
						}),
					),
				)
				verify(recoverCodeFacade.getRawRecoverCode(matchers.anything()), { times: 0 })
				verify(recoverCodeFacade.encryptRecoveryCode(anything(), anything()), { times: 0 })
			})

			o("Fails if admin public key hashes do not match", async function () {
				prepareUserKeyRotation(
					{
						serviceExecutor: serviceExecutorMock,
						cryptoWrapper: cryptoWrapperMock,
						entityClient: entityClientMock,
						asymmetricCryptoFacade: asymmetricCryptoFacade,
					},
					keyRotationFacade,
					userGroup,
				)
				when(cryptoWrapperMock.sha256Hash(matchers.anything())).thenReturn(new Uint8Array([9, 8, 7]))
				await assertThrows(Error, async () => keyRotationFacade.processPendingKeyRotation(user))
			})

			o("Fails if there is no key hash", async function () {
				prepareUserKeyRotation(
					{
						serviceExecutor: serviceExecutorMock,
						cryptoWrapper: cryptoWrapperMock,
						entityClient: entityClientMock,
						asymmetricCryptoFacade: asymmetricCryptoFacade,
					},
					keyRotationFacade,
					userGroup,
				)

				keyRotationFacade.setPendingKeyRotations({
					pwKey: PW_KEY,
					adminOrUserGroupKeyRotation: createTestEntity(KeyRotationTypeRef, {
						_id: [keyRotationsListId, userGroupId],
						targetKeyVersion: String(Number(userGroup.groupKeyVersion) + 1),
						groupKeyRotationType: GroupKeyRotationType.User,
						adminGroupKeyAuthenticationData: null, // we set it to null so values are null and will make our code throw
					}),
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: [],
				})

				await assertThrows(Error, async function () {
					await keyRotationFacade.processPendingKeyRotation(user)
				})
			})

			o("Fails if admin is not quantum safe", async function () {
				prepareUserKeyRotation(
					{
						serviceExecutor: serviceExecutorMock,
						cryptoWrapper: cryptoWrapperMock,
						entityClient: entityClientMock,
						asymmetricCryptoFacade: asymmetricCryptoFacade,
					},
					keyRotationFacade,
					userGroup,
				)

				when(serviceExecutorMock.get(PublicKeyService, matchers.anything())).thenResolve({})

				await assertThrows(Error, async function () {
					await keyRotationFacade.processPendingKeyRotation(user)
				})
			})
		})

		o.spec("Ignore currently unsupported cases", function () {
			o("If the user group key is not quantum-safe yet, the user area group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: [],
					userAreaGroupsKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, groupId),
				})

				prepareKeyMocks(cryptoWrapperMock)
				// make admin group key at 128-bit key
				const insecureUserGroupKey: VersionedKey = {
					object: [666],
					version: 0,
				}
				insecureUserGroupKey.object.length = 4
				when(keyLoaderFacadeMock.getCurrentSymUserGroupKey()).thenReturn(insecureUserGroupKey)

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})
		})
		o.spec("Key rotation for customer or team group", function () {
			o("Successful rotation, single member group", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, groupId),
					userAreaGroupsKeyRotations: [],
				})

				group.currentKeys = createTestEntity(KeyPairTypeRef)

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, newKey, adminEncNewGroupKey } = prepareKeyMocks(cryptoWrapperMock)
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
				o(update.groupMembershipUpdateData.length).equals(1)
				o(update.groupMembershipUpdateData[0].userId).equals(userId)
				o(update.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[0].userKeyVersion).equals("0")
			})
			o("Successful rotation, multiple member group", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, groupId),
					userAreaGroupsKeyRotations: [],
				})

				const memberUserId = "memberUserId"
				const memberUser = createTestEntity(UserTypeRef, {
					_id: memberUserId,
					userGroup: createTestEntity(GroupMembershipTypeRef, {
						group: groupId,
						groupKeyVersion: "0",
					}),
				})
				when(entityClientMock.load(UserTypeRef, memberUserId)).thenResolve(memberUser)
				when(entityClientMock.loadAll(GroupMemberTypeRef, group.members)).thenResolve([
					createTestEntity(GroupMemberTypeRef, {
						group: groupId,
						user: userId,
					}),
					createTestEntity(GroupMemberTypeRef, {
						group: groupId,
						user: memberUserId,
					}),
				])

				const { userEncNewGroupKey, newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(cryptoWrapperMock)
				const otherMemberEncNewGroupKey = mockPrepareKeyForOtherMembers(memberUser, groupManagementFacade, cryptoWrapperMock)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]

				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).deepEquals(adminEncNewGroupKey.key)
				o(update.adminGroupKeyVersion).equals("0")
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.groupMembershipUpdateData.length).equals(2)
				o(update.groupMembershipUpdateData[0].userId).equals(userId)
				o(update.groupMembershipUpdateData[0].userEncGroupKey).deepEquals(userEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[0].userKeyVersion).equals("0")
				o(update.groupMembershipUpdateData[1].userId).equals(memberUserId)
				o(update.groupMembershipUpdateData[1].userEncGroupKey).deepEquals(otherMemberEncNewGroupKey.key)
				o(update.groupMembershipUpdateData[1].userKeyVersion).equals("0")
			})
			o("If the user is not an admin, the group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, groupId),
					userAreaGroupsKeyRotations: [],
				})

				// remove admin group membership
				findAllAndRemove(user.memberships, (m) => m.groupType === GroupType.Admin)

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})

			o("If the admin group key is not quantum-safe yet, the group key rotations are ignored", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, groupId),
					userAreaGroupsKeyRotations: [],
				})

				prepareKeyMocks(cryptoWrapperMock)
				// make admin group key a 128-bit key
				const insecureAdminGroupKey: VersionedKey = {
					object: [666],
					version: 0,
				}
				insecureAdminGroupKey.object.length = 4
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(adminGroupId)).thenResolve(insecureAdminGroupKey)

				await keyRotationFacade.processPendingKeyRotation(user)

				verify(serviceExecutorMock.post(anything(), anything()), { times: 0 })
			})

			o("When the group has no members, the rotation is still handled but no membership update is created", async function () {
				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Team, groupId),
					userAreaGroupsKeyRotations: [],
				})

				//no group membership
				when(entityClientMock.loadAll(GroupMemberTypeRef, group.members)).thenResolve([])

				//we cannot resolve the group key via the membership
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(groupId)).thenReject(Error(`No group with groupId ${groupId} found!`))
				//but via adminEncGroupKey
				when(groupManagementFacade.getGroupKeyViaAdminEncGKey(groupId, 0)).thenResolve(CURRENT_USER_AREA_GROUP_KEY.object)

				const { newGroupKeyEncPreviousGroupKey, adminEncNewGroupKey } = prepareKeyMocks(cryptoWrapperMock)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(1)
				const update = sentData.groupKeyUpdates[0]

				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				o(update.adminGroupEncGroupKey).deepEquals(adminEncNewGroupKey.key)
				o(update.adminGroupKeyVersion).equals("0")
				o(update.groupEncPreviousGroupKey).deepEquals(newGroupKeyEncPreviousGroupKey.key)
				o(update.groupMembershipUpdateData.length).equals(0)
			})
			o("Updates for multiple groups are executed in one request", async function () {
				const secondGroupId = "groupId-2"
				const thirdGroupId = "groupId-3"
				makeGroupWithMembership(secondGroupId, user)
				makeGroupWithMembership(thirdGroupId, user)
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(secondGroupId)).thenResolve(CURRENT_USER_AREA_GROUP_KEY)
				when(keyLoaderFacadeMock.getCurrentSymGroupKey(thirdGroupId)).thenResolve(CURRENT_USER_AREA_GROUP_KEY)

				keyRotationFacade.setPendingKeyRotations({
					pwKey: null,
					adminOrUserGroupKeyRotation: null,
					teamOrCustomerGroupKeyRotations: makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Team, groupId).concat(
						makeKeyRotation(keyRotationsListId, GroupKeyRotationType.Customer, secondGroupId).concat(
							makeKeyRotation(keyRotationsListId, GroupKeyRotationType.UserArea, thirdGroupId),
						),
					),
					userAreaGroupsKeyRotations: [],
				})

				group.currentKeys = createTestEntity(KeyPairTypeRef)

				//no group membership
				when(entityClientMock.loadAll(GroupMemberTypeRef, group.members)).thenResolve([])

				const { newKey } = prepareKeyMocks(cryptoWrapperMock)
				mockGenerateKeyPairs(pqFacadeMock, cryptoWrapperMock, newKey.object)

				await keyRotationFacade.processPendingKeyRotation(user)

				const captor = matchers.captor()
				verify(serviceExecutorMock.post(GroupKeyRotationService, captor.capture()))
				verify(shareFacade.sendGroupInvitationRequest(anything()), { times: 0 })
				const sentData: GroupKeyRotationPostIn = captor.value
				o(sentData.groupKeyUpdates.length).equals(3)
				const update = sentData.groupKeyUpdates[0]
				o(update.group).equals(groupId)
				o(update.groupKeyVersion).equals("1")
				const secondUpdate = sentData.groupKeyUpdates[1]
				o(secondUpdate.group).equals(secondGroupId)
				o(secondUpdate.groupKeyVersion).equals("1")
				const thirdUpdate = sentData.groupKeyUpdates[2]
				o(thirdUpdate.group).equals(thirdGroupId)
				o(thirdUpdate.groupKeyVersion).equals("1")
			})
		})
		o.spec("processPendingKeyRotationsAndUpdates error handling", function () {
			o("loadPendingKeyRotations LockedError is caught", async function () {
				const terror = new LockedError("test error")
				when(entityClientMock.load(UserGroupRootTypeRef, anything())).thenReject(terror)
				const log = (console.log = spy(console.log))
				await keyRotationFacade.processPendingKeyRotationsAndUpdates(object())
				//make sure we do not throw
				//make sure we log the error to console
				o(log.callCount).equals(1)
				o(log.args[1]).equals(terror)
			})
			o("loadPendingKeyRotations other Errors are thrown", async function () {
				const terror = new Error("test error")
				when(entityClientMock.load(UserGroupRootTypeRef, anything())).thenReject(terror)
				const log = (console.log = spy(console.log))
				await assertThrows(Error, async () => keyRotationFacade.processPendingKeyRotationsAndUpdates(object()))
			})

			o("processPendingKeyRotation LockedError is caught", async function () {
				//ignore errors from  previous function calls
				mockAttribute(keyRotationFacade, keyRotationFacade.loadPendingKeyRotations, () => {})
				//make processPendingKeyRotations throw
				const terror = new LockedError("test error")
				mockAttribute(keyRotationFacade, keyRotationFacade.processPendingKeyRotation, () => {
					throw terror
				})
				const log = (console.log = spy(console.log))
				await keyRotationFacade.processPendingKeyRotationsAndUpdates(object())
				//make sure we do not throw
				//make sure we log the error to console
				o(log.callCount).equals(1)
				o(log.args[1]).equals(terror)
			})
			o("processPendingKeyRotation other errors are thrown", async function () {
				//ignore errors from  previous function calls
				mockAttribute(keyRotationFacade, keyRotationFacade.loadPendingKeyRotations, () => {})
				//make processPendingKeyRotations throw
				const terror = new Error("test error")
				mockAttribute(keyRotationFacade, keyRotationFacade.processPendingKeyRotation, () => {
					throw terror
				})
				const log = (console.log = spy(console.log))
				await assertThrows(Error, async () => keyRotationFacade.processPendingKeyRotationsAndUpdates(object()))
			})

			o("updateGroupMemberships LockedError is caught", async function () {
				//ignore errors from previous function calls
				mockAttribute(keyRotationFacade, keyRotationFacade.loadPendingKeyRotations, () => {})
				mockAttribute(keyRotationFacade, keyRotationFacade.processPendingKeyRotation, () => {})
				//let update membership throw
				const terror = new LockedError("test error")
				mockAttribute(keyRotationFacade, keyRotationFacade.updateGroupMemberships, () => {
					throw terror
				})

				const log = (console.log = spy(console.log))

				await keyRotationFacade.processPendingKeyRotationsAndUpdates(object())
				//make sure we do not throw
				//make sure we log the error to console
				o(log.callCount).equals(1)
				o(log.args[1]).equals(terror)
			})
			o("updateGroupMemberships other errors are thrown", async function () {
				//ignore errors from previous function calls
				mockAttribute(keyRotationFacade, keyRotationFacade.loadPendingKeyRotations, () => {})
				mockAttribute(keyRotationFacade, keyRotationFacade.processPendingKeyRotation, () => {})
				//let update membership throw
				const terror = new Error("test error")
				mockAttribute(keyRotationFacade, keyRotationFacade.updateGroupMemberships, () => {
					throw terror
				})

				const log = (console.log = spy(console.log))

				await assertThrows(Error, async () => keyRotationFacade.processPendingKeyRotationsAndUpdates(object()))
			})
		})
	})

	function makeGroupWithMembership(groupId: Id, user: User): { group: Group; groupInfo: GroupInfo } {
		const group = createTestEntity(GroupTypeRef, {
			_id: groupId,
			adminGroupKeyVersion: "0",
			groupInfo: ["listId", groupInfoElementId],
			// we need this to be a non-empty byte array
			adminGroupEncGKey: new Uint8Array(1),
			pubAdminGroupEncGKey: null,
			groupKeyVersion: "0",
			invitations: invitationsListId,
			admin: adminGroupId,
			members: "membersListId",
		})
		const groupInfo = createTestEntity(GroupInfoTypeRef, {
			_id: group.groupInfo,
			group: groupId,
		})

		when(groupManagementFacade.hasAdminEncGKey(group)).thenReturn(true)
		when(entityClientMock.load(GroupInfoTypeRef, group.groupInfo)).thenResolve(groupInfo)
		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve(group)
		when(entityClientMock.loadAll(SentGroupInvitationTypeRef, group.invitations)).thenResolve([])
		const member = createTestEntity(GroupMemberTypeRef, {
			group: groupId,
			user: user._id,
		})
		user.memberships.push(
			createTestEntity(GroupMembershipTypeRef, {
				group: groupId,
				groupKeyVersion: "0",
			}),
		)
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
		customer: "customerId",
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

function prepareKeyMocks(cryptoWrapperMock: CryptoWrapper) {
	when(cryptoWrapperMock.aes256RandomKey()).thenReturn(NEW_GROUP_KEY.object)

	const encryptingKeyCaptor = matchers.captor()
	const keyCaptor = matchers.captor()
	when(cryptoWrapperMock.encryptKeyWithVersionedKey(encryptingKeyCaptor.capture(), keyCaptor.capture())).thenDo((arg) => ({
		encryptingKeyVersion: encryptingKeyCaptor.value.version,
		key: new Uint8Array(encryptingKeyCaptor.value.object.concat(keyCaptor.value)),
	}))

	return {
		userEncNewGroupKey: CURRENT_USER_GROUP_ENC_NEW_USER_AREA_GROUP_KEY,
		newGroupKeyEncPreviousGroupKey: NEW_USER_AREA_GROUP_ENC_CURRENT_USER_AREA_GROUP_KEY,
		newKey: NEW_GROUP_KEY,
		adminEncNewGroupKey: CURRENT_ADMIN_GROUP_ENC_NEW_USER_AREA_GROUP_KEY,
		currentAdminGroupKey: CURRENT_ADMIN_GROUP_KEY,
	}
}

function mockPrepareKeyForOtherMembers(user: User, groupManagementFacadeMock: GroupManagementFacade, cryptoWrapperMock: CryptoWrapper) {
	when(groupManagementFacadeMock.getGroupKeyViaAdminEncGKey(user.userGroup.group, Number(user.userGroup.groupKeyVersion))).thenResolve(
		OTHER_MEMBER_USER_GROUP_KEY.object,
	)
	// when(cryptoWrapperMock.encryptKey(OTHER_MEMBER_USER_GROUP_KEY.object, newGroupKey.object))
	const encryptingKeyCaptor = matchers.captor()
	const keyCaptor = matchers.captor()
	when(cryptoWrapperMock.encryptKey(encryptingKeyCaptor.capture(), keyCaptor.capture())).thenDo(
		(arg) => new Uint8Array(encryptingKeyCaptor.value.concat(keyCaptor.value)),
	)
	return OTHER_USER_GROUP_ENC_NEW_SHARED_GROUP_KEY
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
			publicKey: Uint8Array.from([1]),
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
		const kyberPublicKeyBytes: Uint8Array = Uint8Array.from([3])
		when(cryptoWrapperMock.kyberPublicKeyToBytes(newKeyPairs.kyberKeyPair.publicKey)).thenReturn(kyberPublicKeyBytes)
		results.set(newKey, { newKeyPairs, encryptedEccPrivKey, encryptedKyberPrivKey, kyberPublicKeyBytes })
		when(
			cryptoWrapperMock.decryptKeyPair(
				newKey,
				matchers.argThat((arg: EncryptedPqKeyPairs) => {
					return (
						arg.symEncPrivEccKey === encryptedEccPrivKey &&
						arg.symEncPrivKyberKey === encryptedKyberPrivKey &&
						arg.symEncPrivRsaKey == null &&
						arg.pubKyberKey === kyberPublicKeyBytes
					)
				}),
			),
		).thenReturn(newKeyPairs)
	}
	// we need to pass the first result separately because thenResolve's signature requires it
	const [first, ...rest] = Array.from(results.values())
	when(pqFacadeMock.generateKeyPairs()).thenResolve(first.newKeyPairs, ...rest.map((result) => result.newKeyPairs))

	return results
}

function verifyKeyPair(keyPair: KeyPair | null | undefined, mockedKeyPairs: MockedKeyPairs) {
	o(keyPair).notEquals(null)
	o(keyPair?.symEncPrivEccKey).deepEquals(mockedKeyPairs.encryptedEccPrivKey)
	o(keyPair?.pubEccKey).deepEquals(mockedKeyPairs.newKeyPairs.eccKeyPair.publicKey)
	o(keyPair?.symEncPrivKyberKey).deepEquals(mockedKeyPairs.encryptedKyberPrivKey)
	o(keyPair?.pubKyberKey).deepEquals(mockedKeyPairs.kyberPublicKeyBytes)
	o(keyPair?.symEncPrivRsaKey).equals(null)
	o(keyPair?.pubRsaKey).equals(null)
}

function verifyUserGroupKeyDataExceptAdminKey(userGroupKeyData: UserGroupKeyRotationData, generatedKeyPairs: Map<AesKey, MockedKeyPairs>) {
	o(userGroupKeyData.userGroupKeyVersion).deepEquals(String(NEW_USER_GROUP_KEY.version))
	o(userGroupKeyData.group).deepEquals(userGroupId)
	o(userGroupKeyData.authVerifier).deepEquals(AUTH_VERIFIER)
	o(userGroupKeyData.distributionKeyEncUserGroupKey).deepEquals(DISTRIBUTION_KEY_ENC_NEW_USER_GROUP_KEY)
	verifyKeyPair(userGroupKeyData.keyPair, generatedKeyPairs.get(NEW_USER_GROUP_KEY.object)!)
	o(userGroupKeyData.passphraseEncUserGroupKey).deepEquals(PW_ENC_NEW_USER_GROUP_KEY.key)
	o(userGroupKeyData.userGroupEncPreviousGroupKey).deepEquals(NEW_USER_GROUP_ENC_CURRENT_USER_GROUP_KEY.key)
}
