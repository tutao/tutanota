import { CounterType } from "@tutao/appEnv"
import { sysServices, sysTypeRefs, tutanotaServices, tutanotaTypeRefs } from "@tutao/typeRefs"
import { freshVersioned, getFirstOrThrow, neverNull } from "@tutao/utils"
import { CounterFacade } from "./CounterFacade.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { assertWorkerOrNode, GroupType } from "@tutao/appEnv"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { UserFacade } from "../UserFacade.js"
import { PQFacade } from "../PQFacade.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { CacheManagementFacade } from "./CacheManagementFacade.js"
import { _encryptKeyWithVersionedKey, _encryptString, CryptoWrapper, VersionedKey } from "@tutao/instancePipeline"
import { AesKey, PQKeyPairs } from "@tutao/crypto"
import { IdentityKeyCreator } from "./IdentityKeyCreator"
import { AdminKeyLoaderFacade } from "../AdminKeyLoaderFacade"

assertWorkerOrNode()

export class GroupManagementFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly counters: CounterFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly pqFacade: PQFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly adminKeyLoaderFacade: AdminKeyLoaderFacade,
		private readonly cacheManagementFacade: CacheManagementFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly identityKeyCreator: IdentityKeyCreator,
	) {}

	async readUsedSharedMailGroupStorage(group: sysTypeRefs.Group): Promise<number> {
		return this.counters.readCounterValue(CounterType.UserStorageLegacy, neverNull(group.customer), group._id)
	}

	async createSharedMailGroup(name: string, mailAddress: string): Promise<void> {
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

		const mailEncMailboxSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, mailboxSessionKey)

		const data = tutanotaTypeRefs.createCreateMailGroupData({
			mailAddress,
			encryptedName: this.cryptoWrapper.encryptString(mailGroupInfoSessionKey, name),
			mailEncMailboxSessionKey: mailEncMailboxSessionKey.key,
			groupData: mailGroupData,
		})
		const mailGroupPostOut = await this.serviceExecutor.post(tutanotaServices.MailGroupService, data)

		await this.identityKeyCreator.createIdentityKeyPair(
			mailGroupPostOut.mailGroup,
			{
				object: keyPair,
				version: 0, //new group
			},
			[],
			adminGroupKey,
		)
	}

	/**
	 * Generates keys for the new group and prepares the group data object to create the group.
	 *
	 * @param name Name of the group
	 */
	async generateUserAreaGroupData(name: string): Promise<tutanotaTypeRefs.UserAreaGroupData> {
		// adminGroup Is not set when generating new customer, then the admin group will be the admin of the customer
		// adminGroupKey Is not set when generating calendar as normal user
		const userGroup = await this.entityClient.load(sysTypeRefs.GroupTypeRef, this.userFacade.getUserGroupId())
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

		const userEncGroupKey = _encryptKeyWithVersionedKey(userGroupKey, groupKey.object)
		const adminEncGroupKey = adminGroupKey ? _encryptKeyWithVersionedKey(adminGroupKey, groupKey.object) : null
		const customerEncGroupInfoSessionKey = _encryptKeyWithVersionedKey(customerGroupKey, groupInfoSessionKey)
		const groupEncGroupRootSessionKey = _encryptKeyWithVersionedKey(groupKey, groupRootSessionKey)

		return tutanotaTypeRefs.createUserAreaGroupData({
			groupEncGroupRootSessionKey: groupEncGroupRootSessionKey.key,
			customerEncGroupInfoSessionKey: customerEncGroupInfoSessionKey.key,
			userEncGroupKey: userEncGroupKey.key,
			groupInfoEncName: _encryptString(groupInfoSessionKey, name),
			adminEncGroupKey: adminEncGroupKey?.key ?? null,
			adminGroup: adminGroupId,
			customerKeyVersion: customerEncGroupInfoSessionKey.encryptingKeyVersion.toString(),
			userKeyVersion: userGroupKey.version.toString(),
			adminKeyVersion: adminEncGroupKey?.encryptingKeyVersion.toString() ?? null,
		})
	}

	async createCalendar(name: string): Promise<{ user: sysTypeRefs.User; group: sysTypeRefs.Group }> {
		const groupData = await this.generateUserAreaGroupData(name)
		const postData = tutanotaTypeRefs.createUserAreaGroupPostData({
			groupData,
		})
		const postGroupData = await this.serviceExecutor.post(tutanotaServices.CalendarService, postData, { sessionKey: this.cryptoWrapper.aes256RandomKey() }) // we expect a session key to be defined as the entity is marked encrypted
		const group = await this.entityClient.load(sysTypeRefs.GroupTypeRef, postGroupData.group)
		const user = await this.cacheManagementFacade.reloadUser()

		return { user, group }
	}

	async createTemplateGroup(name: string): Promise<Id> {
		const groupData = await this.generateUserAreaGroupData(name)
		const serviceData = tutanotaTypeRefs.createUserAreaGroupPostData({
			groupData,
		})

		const postGroupData = await this.serviceExecutor.post(tutanotaServices.TemplateGroupService, serviceData, {
			sessionKey: this.cryptoWrapper.aes256RandomKey(),
		}) // we expect a session key to be defined as the entity is marked encrypted

		await this.cacheManagementFacade.reloadUser()

		return postGroupData.group
	}

	async createContactListGroup(name: string): Promise<sysTypeRefs.Group> {
		const groupData = await this.generateUserAreaGroupData(name)
		const serviceData = tutanotaTypeRefs.createUserAreaGroupPostData({
			groupData,
		})
		const postGroupData = await this.serviceExecutor.post(tutanotaServices.ContactListGroupService, serviceData, {
			sessionKey: this.cryptoWrapper.aes256RandomKey(),
		}) // we expect a session key to be defined as the entity is marked encrypted
		const group = await this.entityClient.load(sysTypeRefs.GroupTypeRef, postGroupData.group)
		await this.cacheManagementFacade.reloadUser()

		return group
	}

	async deleteContactListGroup(groupRoot: tutanotaTypeRefs.ContactListGroupRoot) {
		const serviceData = tutanotaTypeRefs.createUserAreaGroupDeleteData({
			group: groupRoot._id,
		})
		await this.serviceExecutor.delete(tutanotaServices.ContactListGroupService, serviceData)
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
	): tutanotaTypeRefs.InternalGroupData {
		const adminEncGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(adminGroupKey, groupKey)
		const ownerEncGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(ownerGroupKey, groupInfoSessionKey)

		return tutanotaTypeRefs.createInternalGroupData({
			pubRsaKey: null,
			groupEncPrivRsaKey: null,
			pubEccKey: keyPair.x25519KeyPair.publicKey,
			groupEncPrivEccKey: this.cryptoWrapper.encryptX25519Key(groupKey, keyPair.x25519KeyPair.privateKey),
			pubKyberKey: this.cryptoWrapper.kyberPublicKeyToBytes(keyPair.kyberKeyPair.publicKey),
			groupEncPrivKyberKey: this.cryptoWrapper.encryptKyberKey(groupKey, keyPair.kyberKeyPair.privateKey),
			adminGroup: adminGroupId,
			adminEncGroupKey: adminEncGroupKey.key,
			ownerEncGroupInfoSessionKey: ownerEncGroupInfoSessionKey.key,
			adminKeyVersion: adminEncGroupKey.encryptingKeyVersion.toString(),
			ownerKeyVersion: ownerEncGroupInfoSessionKey.encryptingKeyVersion.toString(),
		})
	}

	/**
	 * Load a list of group IDs with all team groups, e.g., shared mailbox groups.
	 */
	async loadTeamGroupIds(): Promise<Array<Id>> {
		const customerId = this.userFacade.getUser()?.customer
		if (!customerId) return [] // external users have no team groups

		const customer = await this.entityClient.load(sysTypeRefs.CustomerTypeRef, customerId)
		const teamGroupInfos = await this.entityClient.loadAll(sysTypeRefs.GroupInfoTypeRef, customer.teamGroups)
		return teamGroupInfos.map((groupInfo) => groupInfo.group)
	}

	async addUserToGroup(user: sysTypeRefs.User, groupId: Id): Promise<void> {
		const userGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(user.userGroup.group)
		const groupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)
		const symEncGKey = _encryptKeyWithVersionedKey(userGroupKey, groupKey.object)
		const data = sysTypeRefs.createMembershipAddData({
			user: user._id,
			group: groupId,
			symEncGKey: symEncGKey.key,
			groupKeyVersion: String(groupKey.version),
			symKeyVersion: symEncGKey.encryptingKeyVersion.toString(),
		})
		await this.serviceExecutor.post(sysServices.MembershipService, data)
	}

	async removeUserFromGroup(userId: Id, groupId: Id): Promise<void> {
		const data = sysTypeRefs.createMembershipRemoveData({
			user: userId,
			group: groupId,
		})
		await this.serviceExecutor.delete(sysServices.MembershipService, data)
	}

	async deactivateGroup(group: sysTypeRefs.Group, restore: boolean): Promise<void> {
		const data = tutanotaTypeRefs.createDeleteGroupData({
			group: group._id,
			restore,
		})

		if (group.type === GroupType.Mail) {
			await this.serviceExecutor.delete(tutanotaServices.MailGroupService, data)
		} else {
			throw new Error("invalid group type for deactivation")
		}
	}
}
