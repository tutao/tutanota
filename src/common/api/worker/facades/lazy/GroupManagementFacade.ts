import { CounterType, GroupType, PublicKeyIdentifierType } from "../../../common/TutanotaConstants.js"
import type { ContactListGroupRoot, InternalGroupData, UserAreaGroupData } from "../../../entities/tutanota/TypeRefs.js"
import {
	createCreateMailGroupData,
	createDeleteGroupData,
	createInternalGroupData,
	createUserAreaGroupData,
	createUserAreaGroupDeleteData,
	createUserAreaGroupPostData,
} from "../../../entities/tutanota/TypeRefs.js"
import { assertNotNull, freshVersioned, getFirstOrThrow, neverNull } from "@tutao/tutanota-utils"
import { createMembershipAddData, createMembershipRemoveData, Group, GroupTypeRef, User, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { CounterFacade } from "./CounterFacade.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { CalendarService, ContactListGroupService, MailGroupService, TemplateGroupService } from "../../../entities/tutanota/Services.js"
import { MembershipService } from "../../../entities/sys/Services.js"
import { UserFacade } from "../UserFacade.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { PQFacade } from "../PQFacade.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { CacheManagementFacade } from "./CacheManagementFacade.js"
import { CryptoWrapper, encryptKeyWithVersionedKey, encryptString, VersionedKey } from "../../crypto/CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "../../crypto/AsymmetricCryptoFacade.js"
import { AesKey, PQKeyPairs } from "@tutao/tutanota-crypto"

assertWorkerOrNode()

export class GroupManagementFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly counters: CounterFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly pqFacade: PQFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cacheManagementFacade: CacheManagementFacade,
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async readUsedSharedMailGroupStorage(group: Group): Promise<number> {
		return this.counters.readCounterValue(CounterType.UserStorageLegacy, neverNull(group.customer), group._id)
	}

	async createMailGroup(name: string, mailAddress: string): Promise<void> {
		const adminGroupIds = this.userFacade.getGroupIds(GroupType.Admin)
		const adminGroupId = getFirstOrThrow(adminGroupIds)

		let adminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)
		let customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Customer))
		let mailGroupKey = freshVersioned(this.cryptoWrapper.aes256RandomKey())

		let mailGroupInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		let mailboxSessionKey = this.cryptoWrapper.aes256RandomKey()
		const keyPair = await this.pqFacade.generateKeyPairs()
		const mailGroupData = this.generateInternalGroupData(
			keyPair,
			mailGroupKey.object,
			mailGroupInfoSessionKey,
			adminGroupId,
			adminGroupKey,
			customerGroupKey,
		)

		const mailEncMailboxSessionKey = encryptKeyWithVersionedKey(mailGroupKey, mailboxSessionKey)

		const data = createCreateMailGroupData({
			mailAddress,
			encryptedName: encryptString(mailGroupInfoSessionKey, name),
			mailEncMailboxSessionKey: mailEncMailboxSessionKey.key,
			groupData: mailGroupData,
		})
		await this.serviceExecutor.post(MailGroupService, data)
	}

	/**
	 * Generates keys for the new group and prepares the group data object to create the group.
	 *
	 * @param name Name of the group
	 */
	async generateUserAreaGroupData(name: string): Promise<UserAreaGroupData> {
		// adminGroup Is not set when generating new customer, then the admin group will be the admin of the customer
		// adminGroupKey Is not set when generating calendar as normal user
		const userGroup = await this.entityClient.load(GroupTypeRef, this.userFacade.getUserGroupId())
		const adminGroupId = neverNull(userGroup.admin) // user group has always admin group

		let adminGroupKey: VersionedKey | null = null

		if (this.userFacade.getAllGroupIds().indexOf(adminGroupId) !== -1) {
			// getGroupKey throws an error if user is not member of that group - so check first
			adminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)
		}

		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()
		const groupKey = freshVersioned(this.cryptoWrapper.aes256RandomKey())

		const groupRootSessionKey = this.cryptoWrapper.aes256RandomKey()
		const groupInfoSessionKey = this.cryptoWrapper.aes256RandomKey()

		const userEncGroupKey = encryptKeyWithVersionedKey(userGroupKey, groupKey.object)
		const adminEncGroupKey = adminGroupKey ? encryptKeyWithVersionedKey(adminGroupKey, groupKey.object) : null
		const customerEncGroupInfoSessionKey = encryptKeyWithVersionedKey(customerGroupKey, groupInfoSessionKey)
		const groupEncGroupRootSessionKey = encryptKeyWithVersionedKey(groupKey, groupRootSessionKey)

		return createUserAreaGroupData({
			groupEncGroupRootSessionKey: groupEncGroupRootSessionKey.key,
			customerEncGroupInfoSessionKey: customerEncGroupInfoSessionKey.key,
			userEncGroupKey: userEncGroupKey.key,
			groupInfoEncName: encryptString(groupInfoSessionKey, name),
			adminEncGroupKey: adminEncGroupKey?.key ?? null,
			adminGroup: adminGroupId,
			customerKeyVersion: customerEncGroupInfoSessionKey.encryptingKeyVersion.toString(),
			userKeyVersion: userGroupKey.version.toString(),
			adminKeyVersion: adminEncGroupKey?.encryptingKeyVersion.toString() ?? null,
		})
	}

	async createCalendar(name: string): Promise<{ user: User; group: Group }> {
		const groupData = await this.generateUserAreaGroupData(name)
		const postData = createUserAreaGroupPostData({
			groupData,
		})
		const postGroupData = await this.serviceExecutor.post(CalendarService, postData, { sessionKey: this.cryptoWrapper.aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted
		const group = await this.entityClient.load(GroupTypeRef, postGroupData.group)
		const user = await this.cacheManagementFacade.reloadUser()

		return { user, group }
	}

	async createTemplateGroup(name: string): Promise<Id> {
		const groupData = await this.generateUserAreaGroupData(name)
		const serviceData = createUserAreaGroupPostData({
			groupData,
		})

		const postGroupData = await this.serviceExecutor.post(TemplateGroupService, serviceData, { sessionKey: this.cryptoWrapper.aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted

		await this.cacheManagementFacade.reloadUser()

		return postGroupData.group
	}

	async createContactListGroup(name: string): Promise<Group> {
		const groupData = await this.generateUserAreaGroupData(name)
		const serviceData = createUserAreaGroupPostData({
			groupData,
		})
		const postGroupData = await this.serviceExecutor.post(ContactListGroupService, serviceData, { sessionKey: this.cryptoWrapper.aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted
		const group = await this.entityClient.load(GroupTypeRef, postGroupData.group)
		await this.cacheManagementFacade.reloadUser()

		return group
	}

	async deleteContactListGroup(groupRoot: ContactListGroupRoot) {
		const serviceData = createUserAreaGroupDeleteData({
			group: groupRoot._id,
		})
		await this.serviceExecutor.delete(ContactListGroupService, serviceData)
	}

	/**
	 * Assemble the data transfer type to create a new internal group on the server.
	 * The group key version is not needed because it is always zero.
	 */
	generateInternalGroupData(
		keyPair: PQKeyPairs,
		groupKey: AesKey,
		groupInfoSessionKey: AesKey,
		adminGroupId: Id | null,
		adminGroupKey: VersionedKey,
		ownerGroupKey: VersionedKey,
	): InternalGroupData {
		const adminEncGroupKey = encryptKeyWithVersionedKey(adminGroupKey, groupKey)
		const ownerEncGroupInfoSessionKey = encryptKeyWithVersionedKey(ownerGroupKey, groupInfoSessionKey)

		return createInternalGroupData({
			pubRsaKey: null,
			groupEncPrivRsaKey: null,
			pubEccKey: keyPair.eccKeyPair.publicKey,
			groupEncPrivEccKey: this.cryptoWrapper.encryptEccKey(groupKey, keyPair.eccKeyPair.privateKey),
			pubKyberKey: this.cryptoWrapper.kyberPublicKeyToBytes(keyPair.kyberKeyPair.publicKey),
			groupEncPrivKyberKey: this.cryptoWrapper.encryptKyberKey(groupKey, keyPair.kyberKeyPair.privateKey),
			adminGroup: adminGroupId,
			adminEncGroupKey: adminEncGroupKey.key,
			ownerEncGroupInfoSessionKey: ownerEncGroupInfoSessionKey.key,
			adminKeyVersion: adminEncGroupKey.encryptingKeyVersion.toString(),
			ownerKeyVersion: ownerEncGroupInfoSessionKey.encryptingKeyVersion.toString(),
		})
	}

	async addUserToGroup(user: User, groupId: Id): Promise<void> {
		const userGroupKey = await this.getCurrentGroupKeyViaAdminEncGKey(user.userGroup.group)
		const groupKey = await this.getCurrentGroupKeyViaAdminEncGKey(groupId)
		const symEncGKey = encryptKeyWithVersionedKey(userGroupKey, groupKey.object)
		const data = createMembershipAddData({
			user: user._id,
			group: groupId,
			symEncGKey: symEncGKey.key,
			groupKeyVersion: String(groupKey.version),
			symKeyVersion: symEncGKey.encryptingKeyVersion.toString(),
		})
		await this.serviceExecutor.post(MembershipService, data)
	}

	async removeUserFromGroup(userId: Id, groupId: Id): Promise<void> {
		const data = createMembershipRemoveData({
			user: userId,
			group: groupId,
		})
		await this.serviceExecutor.delete(MembershipService, data)
	}

	async deactivateGroup(group: Group, restore: boolean): Promise<void> {
		const data = createDeleteGroupData({
			group: group._id,
			restore,
		})

		if (group.type === GroupType.Mail) {
			await this.serviceExecutor.delete(MailGroupService, data)
		} else {
			throw new Error("invalid group type for deactivation")
		}
	}

	async getGroupKeyViaUser(groupId: Id, version: number, viaUser: Id): Promise<AesKey> {
		const currentGroupKey = await this.getCurrentGroupKeyViaUser(groupId, viaUser)
		return this.keyLoaderFacade.loadSymGroupKey(groupId, version, currentGroupKey)
	}

	/**
	 * Get a group key for any group we are admin and know some member of.
	 *
	 * Unlike {@link getCurrentGroupKeyViaAdminEncGKey} this should work for any group because we will actually go a "long" route of decrypting userGroupKey of the
	 * member and decrypting group key with that.
	 */
	async getCurrentGroupKeyViaUser(groupId: Id, viaUser: Id): Promise<VersionedKey> {
		const user = await this.entityClient.load(UserTypeRef, viaUser)
		const membership = user.memberships.find((m) => m.group === groupId)
		if (membership == null) {
			throw new Error(`User doesn't have this group membership! User: ${viaUser} groupId: ${groupId}`)
		}
		const requiredUserGroupKeyVersion = membership.symKeyVersion
		const requiredUserGroupKey = await this.getGroupKeyViaAdminEncGKey(user.userGroup.group, Number(requiredUserGroupKeyVersion))

		const key = this.cryptoWrapper.decryptKey(requiredUserGroupKey, membership.symEncGKey)
		const version = Number(membership.groupKeyVersion)

		return { object: key, version }
	}

	async getGroupKeyViaAdminEncGKey(groupId: Id, version: number): Promise<AesKey> {
		if (this.userFacade.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			return this.keyLoaderFacade.loadSymGroupKey(groupId, version)
		} else {
			const currentGroupKey = await this.getCurrentGroupKeyViaAdminEncGKey(groupId)
			return this.keyLoaderFacade.loadSymGroupKey(groupId, version, currentGroupKey)
		}
	}

	/**
	 * @returns true if the group currently has an adminEncGKey. This may be an asymmetrically encrypted one.
	 */
	hasAdminEncGKey(group: Group) {
		return (group.adminGroupEncGKey != null && group.adminGroupEncGKey.length !== 0) || group.pubAdminGroupEncGKey != null
	}

	/**
	 * Get a group key for certain group types.
	 *
	 * Some groups (e.g. user groups or shared mailboxes) have adminGroupEncGKey set on creation. For those groups we can fairly easily get a group key without
	 * decrypting userGroupKey of some member of that group.
	 */
	async getCurrentGroupKeyViaAdminEncGKey(groupId: Id): Promise<VersionedKey> {
		if (this.userFacade.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			// or I am an admin and I am a member of the target group (eg: shared mailboxes)
			return this.keyLoaderFacade.getCurrentSymGroupKey(groupId)
		} else {
			const group = await this.entityClient.load(GroupTypeRef, groupId)
			if (!this.hasAdminEncGKey(group)) {
				throw new ProgrammingError("Group doesn't have adminGroupEncGKey, you can't get group key this way")
			}
			if (!(group.admin && this.userFacade.hasGroup(group.admin))) {
				throw new Error(`The user is not a member of the admin group ${group.admin} when trying to get the group key for group ${groupId}`)
			}

			// e.g. I am a member of the group that administrates group G and want to add a new member to G
			const requiredAdminKeyVersion = Number(group.adminGroupKeyVersion ?? 0)
			if (group.adminGroupEncGKey != null) {
				return await this.decryptViaSymmetricAdminGKey(group, requiredAdminKeyVersion)
			} else {
				return await this.decryptViaAsymmetricAdminGKey(group, requiredAdminKeyVersion)
			}
		}
	}

	private async decryptViaSymmetricAdminGKey(group: Group, requiredAdminKeyVersion: number): Promise<VersionedKey> {
		const requiredAdminGroupKey = await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(group.admin), requiredAdminKeyVersion)
		const decryptedKey = this.cryptoWrapper.decryptKey(requiredAdminGroupKey, assertNotNull(group.adminGroupEncGKey))
		return { object: decryptedKey, version: Number(group.groupKeyVersion) }
	}

	private async decryptViaAsymmetricAdminGKey(group: Group, requiredAdminKeyVersion: number): Promise<VersionedKey> {
		const requiredAdminGroupKeyPair = await this.keyLoaderFacade.loadKeypair(assertNotNull(group.admin), requiredAdminKeyVersion)
		const pubEncKeyData = assertNotNull(group.pubAdminGroupEncGKey)
		const decryptedKey = await this.asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(requiredAdminGroupKeyPair, pubEncKeyData, {
			identifier: group._id,
			identifierType: PublicKeyIdentifierType.GROUP_ID,
		})
		return { object: decryptedKey.decryptedAesKey, version: Number(group.groupKeyVersion) }
	}
}
