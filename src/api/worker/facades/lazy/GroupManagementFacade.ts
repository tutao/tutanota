import { CounterType, GroupType } from "../../../common/TutanotaConstants.js"
import type { ContactListGroupRoot, InternalGroupData, UserAreaGroupData } from "../../../entities/tutanota/TypeRefs.js"
import {
	createCreateMailGroupData,
	createDeleteGroupData,
	createInternalGroupData,
	createUserAreaGroupData,
	createUserAreaGroupDeleteData,
	createUserAreaGroupPostData,
} from "../../../entities/tutanota/TypeRefs.js"
import { assertNotNull, freshVersioned, neverNull } from "@tutao/tutanota-utils"
import type { Group, User } from "../../../entities/sys/TypeRefs.js"
import { createMembershipAddData, createMembershipRemoveData, GroupTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { CounterFacade } from "./CounterFacade.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { encryptKeyWithVersionedKey, encryptString, VersionedKey } from "../../crypto/CryptoFacade.js"
import { aes256RandomKey, aesEncrypt, AesKey, decryptKey, kyberPrivateKeyToBytes, kyberPublicKeyToBytes, PQKeyPairs } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import {
	CalendarService,
	ContactListGroupService,
	LocalAdminGroupService,
	MailGroupService,
	TemplateGroupService,
} from "../../../entities/tutanota/Services.js"
import { MembershipService } from "../../../entities/sys/Services.js"
import { UserFacade } from "../UserFacade.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { DefaultEntityRestCache } from "../../rest/DefaultEntityRestCache.js"
import { PQFacade } from "../PQFacade.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"

assertWorkerOrNode()

export class GroupManagementFacade {
	constructor(
		private readonly user: UserFacade,
		private readonly counters: CounterFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityRestCache: DefaultEntityRestCache,
		private readonly pqFacade: PQFacade = pqFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	async readUsedSharedMailGroupStorage(group: Group): Promise<number> {
		return this.counters.readCounterValue(CounterType.UserStorageLegacy, neverNull(group.customer), group._id)
	}

	async createMailGroup(name: string, mailAddress: string): Promise<void> {
		let adminGroupIds = this.user.getGroupIds(GroupType.Admin)

		if (adminGroupIds.length === 0) {
			adminGroupIds = this.user.getGroupIds(GroupType.LocalAdmin)
		}

		let adminGroupKey = this.user.getGroupKey(adminGroupIds[0])
		let customerGroupKey = this.user.getGroupKey(this.user.getGroupId(GroupType.Customer))
		let mailGroupKey = freshVersioned(aes256RandomKey())

		let mailGroupInfoSessionKey = aes256RandomKey()
		let mailboxSessionKey = aes256RandomKey()
		const keyPair = await this.pqFacade.generateKeyPairs()
		const mailGroupData = await this.generateInternalGroupData(
			keyPair,
			mailGroupKey.object,
			mailGroupInfoSessionKey,
			adminGroupIds[0],
			adminGroupKey,
			customerGroupKey,
		)

		const mailEncMailboxSessionKey = encryptKeyWithVersionedKey(mailGroupKey, mailboxSessionKey)

		const data = createCreateMailGroupData({
			mailAddress,
			encryptedName: encryptString(mailGroupInfoSessionKey, name),
			mailEncMailboxSessionKey: mailEncMailboxSessionKey.key,
			groupData: mailGroupData,
			mailGroupKeyVersion: mailEncMailboxSessionKey.encryptingKeyVersion.toString(),
		})
		await this.serviceExecutor.post(MailGroupService, data)
	}

	/**
	 * Generates keys for the new group and prepares the group data object to create the group.
	 *
	 * @param adminGroup Is not set when generating new customer, then the admin group will be the admin of the customer
	 * @param adminGroupKey Is not set when generating calendar as normal user
	 * @param customerGroupKey Group key of the customer
	 * @param userGroupKey user group key
	 * @param name Name of the group
	 */
	generateUserAreaGroupData(name: string): Promise<UserAreaGroupData> {
		return this.entityClient.load(GroupTypeRef, this.user.getUserGroupId()).then((userGroup) => {
			const adminGroupId = neverNull(userGroup.admin) // user group has always admin group

			let adminGroupKey: VersionedKey | null = null

			if (this.user.getAllGroupIds().indexOf(adminGroupId) !== -1) {
				// getGroupKey throws an error if user is not member of that group - so check first
				adminGroupKey = this.user.getGroupKey(adminGroupId)
			}

			const customerGroupId = this.user.getGroupId(GroupType.Customer)
			const customerGroupKey = this.user.getGroupKey(customerGroupId)
			const userGroupKey = this.user.getUserGroupKey()
			const groupKey = freshVersioned(aes256RandomKey())

			const groupRootSessionKey = aes256RandomKey()
			const groupInfoSessionKey = aes256RandomKey()

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
				adminKeyVersion: adminEncGroupKey?.encryptingKeyVersion.toString() ?? "0",
				groupKeyVersion: groupEncGroupRootSessionKey.encryptingKeyVersion.toString(),
			})
		})
	}

	async createCalendar(name: string): Promise<{ user: User; group: Group }> {
		const groupData = await this.generateUserAreaGroupData(name)
		const postData = createUserAreaGroupPostData({
			groupData,
		})
		const postGroupData = await this.serviceExecutor.post(CalendarService, postData, { sessionKey: aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted
		const group = await this.entityClient.load(GroupTypeRef, postGroupData.group)
		const user = await this.reloadUser()

		return { user, group }
	}

	async createTemplateGroup(name: string): Promise<Id> {
		const groupData = await this.generateUserAreaGroupData(name)
		const serviceData = createUserAreaGroupPostData({
			groupData,
		})

		const postGroupData = await this.serviceExecutor.post(TemplateGroupService, serviceData, { sessionKey: aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted

		await this.reloadUser()

		return postGroupData.group
	}

	async createContactListGroup(name: string): Promise<Group> {
		const groupData = await this.generateUserAreaGroupData(name)
		const serviceData = createUserAreaGroupPostData({
			groupData,
		})
		const postGroupData = await this.serviceExecutor.post(ContactListGroupService, serviceData, { sessionKey: aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted
		const group = await this.entityClient.load(GroupTypeRef, postGroupData.group)
		await this.reloadUser()

		return group
	}

	async deleteContactListGroup(groupRoot: ContactListGroupRoot) {
		const serviceData = createUserAreaGroupDeleteData({
			group: groupRoot._id,
		})
		await this.serviceExecutor.delete(ContactListGroupService, serviceData)
	}

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
			groupEncPrivEccKey: aesEncrypt(groupKey, keyPair.eccKeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(keyPair.kyberKeyPair.publicKey),
			groupEncPrivKyberKey: aesEncrypt(groupKey, kyberPrivateKeyToBytes(keyPair.kyberKeyPair.privateKey)),
			adminGroup: adminGroupId,
			adminEncGroupKey: adminEncGroupKey.key,
			ownerEncGroupInfoSessionKey: ownerEncGroupInfoSessionKey.key,
			adminKeyVersion: adminEncGroupKey.encryptingKeyVersion.toString(),
			ownerKeyVersion: ownerEncGroupInfoSessionKey.encryptingKeyVersion.toString(),
		})
	}

	async addUserToGroup(user: User, groupId: Id): Promise<void> {
		const userGroupKey = await this.getGroupKeyViaAdminEncGKey(user.userGroup.group)
		const groupKey = await this.getGroupKeyViaAdminEncGKey(groupId)
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
		} else if (group.type === GroupType.LocalAdmin) {
			await this.serviceExecutor.delete(LocalAdminGroupService, data)
		} else {
			throw new Error("invalid group type for deactivation")
		}
	}

	/**
	 * Get a group key for any group we are admin and know some member of.
	 *
	 * Unlike {@link getGroupKeyViaAdminEncGKey} this should work for any group because we will actually go a "long" route of decrypting userGroupKey of the
	 * member and decrypting group key with that.
	 */
	async getGroupKeyViaUser(groupId: Id, viaUser: Id): Promise<VersionedKey> {
		const user = await this.entityClient.load(UserTypeRef, viaUser)
		const userGroupKey = await this.getGroupKeyViaAdminEncGKey(user.userGroup.group)
		const membership = user.memberships.find((m) => m.group === groupId)
		if (membership == null) {
			throw new Error(`User doesn't have this group membership! User: ${viaUser} groupId: ${groupId}`)
		}

		const key = decryptKey(userGroupKey.object, membership.symEncGKey)
		const version = Number(membership.groupKeyVersion)

		return { object: key, version }
	}

	/**
	 * Get a group key for certain group types.
	 *
	 * Some groups (e.g. user groups or shared mailboxes) have adminGroupEncGKey set on creation. For those groups we can fairly easily get a group key without
	 * decrypting userGroupKey of some member of that group.
	 */
	async getGroupKeyViaAdminEncGKey(groupId: Id): Promise<VersionedKey> {
		if (this.user.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			return this.user.getGroupKey(groupId)
		} else {
			const group = await this.entityClient.load(GroupTypeRef, groupId)
			if (group.adminGroupEncGKey == null || group.adminGroupEncGKey.length === 0) {
				throw new ProgrammingError("Group doesn't have adminGroupEncGKey, you can't get group key this way")
			}
			let adminGroupKey: VersionedKey
			if (group.admin && this.user.hasGroup(group.admin)) {
				// e.g. I am a member of the group that administrates group G and want to add a new member to G
				const version = Number(group.adminGroupKeyVersion)
				adminGroupKey = {
					object: await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(group.admin), version),
					version,
				}
			} else {
				// e.g. I am a global admin but group G is administrated by a local admin group and want to add a new member to G
				const globalAdminGroupId = this.user.getGroupId(GroupType.Admin)
				const localAdminGroup = await this.entityClient.load(GroupTypeRef, assertNotNull(group.admin))
				const version = Number(localAdminGroup.adminGroupKeyVersion)
				const globalAdminGroupKey = await this.keyLoaderFacade.loadSymGroupKey(globalAdminGroupId, version)

				if (localAdminGroup.admin === globalAdminGroupId) {
					adminGroupKey = {
						object: decryptKey(globalAdminGroupKey, assertNotNull(localAdminGroup.adminGroupEncGKey)),
						version,
					}
				} else {
					throw new Error(`local admin group ${localAdminGroup._id} is not administrated by global admin group ${globalAdminGroupId}`)
				}
			}

			const decryptedKey = decryptKey(adminGroupKey.object, assertNotNull(group.adminGroupEncGKey))
			return { object: decryptedKey, version: Number(group.groupKeyVersion) }
		}
	}

	/*
	 * Deletes the logged-in user from the cache, and reloads and returns the new user object.
	 * Is used to ensure we have the latest version, there can be times when the object becomes a little outdated, resulting in errors.
	 */
	async reloadUser(): Promise<User> {
		const userId = this.user.getLoggedInUser()._id

		await this.entityRestCache.deleteFromCacheIfExists(UserTypeRef, null, userId)

		const user = await this.entityClient.load(UserTypeRef, userId)
		this.user.updateUser(user)

		return user
	}
}
