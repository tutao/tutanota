import o from "@tutao/otest"
import { ShareFacade } from "../../../../../src/platform-kit/base/facades/lazy/ShareFacade"
import { matchers, object, verify, when } from "testdouble"
import { InstanceKeyFacade } from "../../../../../src/platform-kit/base/base-crypto/InstanceKeyFacade"
import { UserFacade } from "../../../../../src/platform-kit/base/facades/UserFacade"
import {
	aes256RandomKey,
	AesKey,
	CryptoWrapper,
	keyToUint8Array,
	VersionedAes256Key,
	VersionedEncryptedKey,
	VersionedKey,
} from "../../../../../src/platform-kit/crypto"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import {
	GroupInfo,
	GroupInfoTypeRef,
	GroupMembershipTypeRef,
	InstanceKeysRefTypeRef,
	ReceivedGroupInvitation,
	ReceivedGroupInvitationTypeRef,
	UserTypeRef,
} from "@tutao/entities/sys"
import { createTestEntity } from "../../../TestUtils"
import { ShareCapability } from "../../../../../src/platform-kit/app-env"
import { GroupInvitationPutData, GroupInvitationService } from "@tutao/entities/tutanota"

o.spec("ShareFacadeTest", function () {
	let shareFacade: ShareFacade

	let instanceKeyFacade: InstanceKeyFacade
	let userFacade: UserFacade
	let cryptoWrapper: CryptoWrapper
	let serviceExecutor: IServiceExecutor
	let cryptoFacade: CryptoFacade
	let entityClient: EntityClient
	let keyLoaderFacade: KeyLoaderFacade

	let sharedGroupKey: VersionedKey
	let sharedGroupInfo: GroupInfo
	const inviterUserGroupInfo: GroupInfo = createTestEntity(GroupInfoTypeRef, {
		_formerInstanceKeys: createTestEntity(InstanceKeysRefTypeRef),
		_id: ["groupInfoInviterListId", "inviterGroupInfoId"],
	})
	const inviteeUserGroupInfo: GroupInfo = createTestEntity(GroupInfoTypeRef, {
		_formerInstanceKeys: createTestEntity(InstanceKeysRefTypeRef),
		_id: ["groupInfoInviteeListId", "inviteeGroupInfoId"],
	})
	let recipientMailAddresses = ["recipient0@tuta.com"]
	const inviterGroupInfoSessionKey: AesKey = object()
	const sharedGroupInfoSessionKey: AesKey = object()
	const sharedGroupEncInviterGroupInfoSessionKey: VersionedEncryptedKey = object()
	const sharedGroupEncSharedGroupInfoSessionKey: VersionedEncryptedKey = object()
	const inviterUserGroupInfoCurrentInstanceKey: VersionedAes256Key = { object: object(), version: 1 }
	const sharedGroupEncInviterGroupInfoInstanceKey: VersionedEncryptedKey = object()
	const sharedGroupInfoCurrentInstanceKey: VersionedAes256Key = { object: object(), version: 2 }
	const sharedGroupEncSharedGroupInfoInstanceKey: VersionedEncryptedKey = object()

	o.beforeEach(function () {
		userFacade = object()
		cryptoFacade = object()
		serviceExecutor = object()
		entityClient = object()
		keyLoaderFacade = object()
		cryptoWrapper = object()
		instanceKeyFacade = object()

		shareFacade = new ShareFacade(userFacade, cryptoFacade, serviceExecutor, entityClient, keyLoaderFacade, cryptoWrapper, instanceKeyFacade)

		sharedGroupKey = { object: aes256RandomKey(), version: 0 }
		sharedGroupInfo = createTestEntity(GroupInfoTypeRef, {
			_formerInstanceKeys: createTestEntity(InstanceKeysRefTypeRef),
			_id: ["groupInfoInviterListId", "sharedGroupInfoId"],
		})

		when(cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, inviterGroupInfoSessionKey)).thenReturn(sharedGroupEncInviterGroupInfoSessionKey)
		when(cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, sharedGroupInfoSessionKey)).thenReturn(sharedGroupEncSharedGroupInfoSessionKey)
	})

	o.spec("Send group invitation (POST)", function () {
		o.beforeEach(function () {
			when(userFacade.getLoggedInUser()).thenReturn(
				createTestEntity(UserTypeRef, { userGroup: createTestEntity(GroupMembershipTypeRef, { groupInfo: inviterUserGroupInfo._id }) }),
			)
			when(entityClient.load(GroupInfoTypeRef, inviterUserGroupInfo._id)).thenResolve(inviterUserGroupInfo)

			when(cryptoFacade.resolveSessionKey(inviterUserGroupInfo)).thenResolve(inviterGroupInfoSessionKey)
			when(cryptoFacade.resolveSessionKey(sharedGroupInfo)).thenResolve(sharedGroupInfoSessionKey)
			when(instanceKeyFacade.getCurrentInstanceKey(inviterUserGroupInfo)).thenResolve(inviterUserGroupInfoCurrentInstanceKey)
			when(cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, inviterUserGroupInfoCurrentInstanceKey.object)).thenReturn(
				sharedGroupEncInviterGroupInfoInstanceKey,
			)
			when(instanceKeyFacade.getCurrentInstanceKey(sharedGroupInfo)).thenResolve(sharedGroupInfoCurrentInstanceKey)
			when(cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, sharedGroupInfoCurrentInstanceKey.object)).thenReturn(
				sharedGroupEncSharedGroupInfoInstanceKey,
			)
		})

		o.test("with instance key success", async function () {
			const groupInvitationPostData = await shareFacade.prepareGroupInvitation(
				sharedGroupKey,
				sharedGroupInfo,
				recipientMailAddresses,
				ShareCapability.Invite,
			)
			const sharedGroupData = groupInvitationPostData.sharedGroupData
			o.check(sharedGroupData.sharedGroupEncSharedGroupInfoInstanceKey).equals(sharedGroupEncSharedGroupInfoInstanceKey.key)
			o.check(sharedGroupData.sharedGroupInfoInstanceKeyVersion).equals(sharedGroupInfoCurrentInstanceKey.version.toString())
			o.check(sharedGroupData.sharedGroupEncInviterGroupInfoInstanceKey).equals(sharedGroupEncInviterGroupInfoInstanceKey.key)
			o.check(sharedGroupData.inviterGroupInfoInstanceKeyVersion).equals(inviterUserGroupInfoCurrentInstanceKey.version.toString())
		})
	})

	o.spec("Accept group invitation (PUT)", function () {
		const inviteeGroupInfoSessionKey: AesKey = object()
		const sharedGroupEncInviteeGroupInfoSessionKey: VersionedEncryptedKey = object()
		const inviteeUserGroupEncSharedGroupKey: VersionedEncryptedKey = object()
		const inviteeGroupInfoCurrentInstanceKey: VersionedAes256Key = { object: object(), version: 4 }
		const sharedGroupEncInviteeGroupInfoInstanceKey: VersionedEncryptedKey = object()
		let receivedGroupInvitation: ReceivedGroupInvitation
		o.beforeEach(function () {
			receivedGroupInvitation = createTestEntity(ReceivedGroupInvitationTypeRef, {
				sharedGroupKey: keyToUint8Array(sharedGroupKey.object),
				sharedGroupKeyVersion: sharedGroupKey.version.toString(),
			})

			when(userFacade.getLoggedInUser()).thenReturn(
				createTestEntity(UserTypeRef, { userGroup: createTestEntity(GroupMembershipTypeRef, { groupInfo: inviteeUserGroupInfo._id }) }),
			)
			when(entityClient.load(GroupInfoTypeRef, inviteeUserGroupInfo._id)).thenResolve(inviteeUserGroupInfo)

			when(cryptoFacade.resolveSessionKey(inviteeUserGroupInfo)).thenResolve(inviteeGroupInfoSessionKey)
			const inviteeUserGroupKey: VersionedKey = object()
			when(userFacade.getCurrentUserGroupKey()).thenReturn(inviteeUserGroupKey)
			when(cryptoWrapper.encryptKeyWithVersionedKey(inviteeUserGroupKey, sharedGroupKey.object)).thenReturn(inviteeUserGroupEncSharedGroupKey)
			when(cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, inviteeGroupInfoSessionKey)).thenReturn(sharedGroupEncInviteeGroupInfoSessionKey)
			when(instanceKeyFacade.getCurrentInstanceKey(inviteeUserGroupInfo)).thenResolve(inviteeGroupInfoCurrentInstanceKey)
			when(cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, inviteeGroupInfoCurrentInstanceKey.object)).thenReturn(
				sharedGroupEncInviteeGroupInfoInstanceKey,
			)
		})

		o.test("with instance key - success", async function () {
			await shareFacade.acceptGroupInvitation(receivedGroupInvitation)
			verify(
				serviceExecutor.put(
					GroupInvitationService,
					matchers.argThat((putIn: GroupInvitationPutData) => {
						o.check(putIn.inviteeGroupInfoInstanceKeyVersion).equals(inviteeGroupInfoCurrentInstanceKey.version.toString())
						o.check(putIn.sharedGroupEncInviteeGroupInfoInstanceKey).equals(sharedGroupEncInviteeGroupInfoInstanceKey.key)
						return true
					}),
					matchers.anything(),
				),
			)
		})
	})
})
