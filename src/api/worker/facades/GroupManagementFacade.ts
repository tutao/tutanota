import {Const, GroupType} from "../../common/TutanotaConstants"
import {createCreateMailGroupData} from "../../entities/tutanota/TypeRefs.js"
import type {InternalGroupData} from "../../entities/tutanota/TypeRefs.js"
import {createInternalGroupData} from "../../entities/tutanota/TypeRefs.js"
import {hexToUint8Array, neverNull} from "@tutao/tutanota-utils"
import {LoginFacadeImpl} from "./LoginFacade"
import {createCreateLocalAdminGroupData} from "../../entities/tutanota/TypeRefs.js"
import type {Group} from "../../entities/sys/TypeRefs.js"
import {GroupTypeRef} from "../../entities/sys/TypeRefs.js"
import {createMembershipAddData} from "../../entities/sys/TypeRefs.js"
import {createMembershipRemoveData} from "../../entities/sys/TypeRefs.js"
import {createDeleteGroupData} from "../../entities/tutanota/TypeRefs.js"
import {CounterFacade} from "./CounterFacade"
import type {User} from "../../entities/sys/TypeRefs.js"
import {createUserAreaGroupPostData} from "../../entities/tutanota/TypeRefs.js"
import type {UserAreaGroupData} from "../../entities/tutanota/TypeRefs.js"
import {createUserAreaGroupData} from "../../entities/tutanota/TypeRefs.js"
import {EntityClient} from "../../common/EntityClient"
import {assertWorkerOrNode} from "../../common/Env"
import {encryptString} from "../crypto/CryptoFacade"
import type {RsaImplementation} from "../crypto/RsaImplementation"
import {aes128RandomKey, decryptKey, encryptKey, encryptRsaKey, publicKeyToHex, RsaKeyPair} from "@tutao/tutanota-crypto";
import {IServiceExecutor} from "../../common/ServiceRequest"
import {LocalAdminGroupService, MailGroupService, TemplateGroupService} from "../../entities/tutanota/Services"
import {MembershipService} from "../../entities/sys/Services"
import {UserFacade} from "./UserFacade"

assertWorkerOrNode()

export interface GroupManagementFacade {
	createMailGroup(name: string, mailAddress: string): Promise<void>

	createLocalAdminGroup(name: string): Promise<void>

	createTemplateGroup(name: string): Promise<Id>

	deactivateGroup(group: Group, restore: boolean): Promise<void>

	removeUserFromGroup(userId: Id, groupId: Id): Promise<void>

	addUserToGroup(user: User, groupId: Id): Promise<void>

	readUsedGroupStorage(groupId: Id): Promise<number>
}

export class GroupManagementFacadeImpl {

	constructor(
		private readonly user: UserFacade,
		private readonly counters: CounterFacade,
		private readonly entityClient: EntityClient,
		private readonly rsa: RsaImplementation,
		private readonly serviceExecutor: IServiceExecutor,
	) {}

	readUsedGroupStorage(groupId: Id): Promise<number> {
		return this.counters.readCounterValue(Const.COUNTER_USED_MEMORY, groupId).then(usedStorage => {
			return Number(usedStorage)
		})
	}

	async createMailGroup(name: string, mailAddress: string): Promise<void> {
		let adminGroupIds = this.user.getGroupIds(GroupType.Admin)

		if (adminGroupIds.length === 0) {
			adminGroupIds = this.user.getGroupIds(GroupType.LocalAdmin)
		}

		let adminGroupKey = this.user.getGroupKey(adminGroupIds[0])

		let customerGroupKey = this.user.getGroupKey(this.user.getGroupId(GroupType.Customer))

		let mailGroupKey = aes128RandomKey()
		let mailGroupInfoSessionKey = aes128RandomKey()
		let mailboxSessionKey = aes128RandomKey()
		const keyPair = await this.rsa.generateKey()
		const mailGroupData = await this.generateInternalGroupData(
			keyPair,
			mailGroupKey,
			mailGroupInfoSessionKey,
			adminGroupIds[0],
			adminGroupKey,
			customerGroupKey,
		)
		const data = createCreateMailGroupData({
			mailAddress,
			encryptedName: encryptString(mailGroupInfoSessionKey, name),
			mailEncMailboxSessionKey: encryptKey(mailGroupKey, mailboxSessionKey),
			groupData: mailGroupData,
		})
		await this.serviceExecutor.post(MailGroupService, data)
	}

	async createLocalAdminGroup(name: string): Promise<void> {
		let adminGroupId = this.user.getGroupId(GroupType.Admin)

		let adminGroupKey = this.user.getGroupKey(adminGroupId)

		let customerGroupKey = this.user.getGroupKey(this.user.getGroupId(GroupType.Customer))

		let groupKey = aes128RandomKey()
		let groupInfoSessionKey = aes128RandomKey()
		const keyPair = await this.rsa.generateKey()
		const mailGroupData = await this.generateInternalGroupData(keyPair, groupKey, groupInfoSessionKey, adminGroupId, adminGroupKey, customerGroupKey)
		const data = createCreateLocalAdminGroupData({
			encryptedName: encryptString(groupInfoSessionKey, name),
			groupData: mailGroupData,
		})
		await this.serviceExecutor.post(LocalAdminGroupService, data)
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
		return this.entityClient.load(GroupTypeRef, this.user.getUserGroupId()).then(userGroup => {
			const adminGroupId = neverNull(userGroup.admin) // user group has always admin group

			let adminGroupKey: BitArray | null = null

			if (this.user.getAllGroupIds().indexOf(adminGroupId) !== -1) {
				// getGroupKey throws an error if user is not member of that group - so check first
				adminGroupKey = this.user.getGroupKey(adminGroupId)
			}

			const customerGroupKey = this.user.getGroupKey(this.user.getGroupId(GroupType.Customer))

			const userGroupKey = this.user.getUserGroupKey()

			const groupRootSessionKey = aes128RandomKey()
			const groupInfoSessionKey = aes128RandomKey()
			const groupKey = aes128RandomKey()
			return createUserAreaGroupData({
				groupEncGroupRootSessionKey: encryptKey(groupKey, groupRootSessionKey),
				customerEncGroupInfoSessionKey: encryptKey(customerGroupKey, groupInfoSessionKey),
				userEncGroupKey: encryptKey(userGroupKey, groupKey),
				groupInfoEncName: encryptString(groupInfoSessionKey, name),
				adminEncGroupKey: adminGroupKey ? encryptKey(adminGroupKey, groupKey) : null,
				adminGroup: adminGroupId,
			})
		})
	}

	createTemplateGroup(name: string): Promise<Id> {
		return this.generateUserAreaGroupData(name).then(groupData => {
			const serviceData = createUserAreaGroupPostData({
				groupData: groupData,
			})
			return this.serviceExecutor.post(TemplateGroupService, serviceData)
					   .then(returnValue => returnValue.group)
		})
	}

	generateInternalGroupData(
		keyPair: RsaKeyPair,
		groupKey: Aes128Key,
		groupInfoSessionKey: Aes128Key,
		adminGroupId: Id | null,
		adminGroupKey: Aes128Key,
		ownerGroupKey: Aes128Key,
	): InternalGroupData {
		let groupData = createInternalGroupData()
		groupData.publicKey = hexToUint8Array(publicKeyToHex(keyPair.publicKey))
		groupData.groupEncPrivateKey = encryptRsaKey(groupKey, keyPair.privateKey)
		groupData.adminGroup = adminGroupId
		groupData.adminEncGroupKey = encryptKey(adminGroupKey, groupKey)
		groupData.ownerEncGroupInfoSessionKey = encryptKey(ownerGroupKey, groupInfoSessionKey)
		return groupData
	}

	async addUserToGroup(user: User, groupId: Id): Promise<void> {
		const userGroupKey = await this.getGroupKeyAsAdmin(user.userGroup.group)
		const groupKey = await this.getGroupKeyAsAdmin(groupId)
		const data = createMembershipAddData({
			user: user._id,
			group: groupId,
			symEncGKey: encryptKey(userGroupKey, groupKey),
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

	getGroupKeyAsAdmin(groupId: Id): Promise<Aes128Key> {
		if (this.user.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			return Promise.resolve(this.user.getGroupKey(neverNull(groupId)))
		} else {
			return this.entityClient.load(GroupTypeRef, groupId).then(group => {
				return Promise.resolve()
							  .then(() => {
								  if (group.admin && this.user.hasGroup(group.admin)) {
									  // e.g. I am a member of the group that administrates group G and want to add a new member to G
									  return this.user.getGroupKey(neverNull(group.admin))
								  } else {
									  // e.g. I am a global admin but group G is administrated by a local admin group and want to add a new member to G
									  let globalAdminGroupId = this.user.getGroupId(GroupType.Admin)

									  let globalAdminGroupKey = this.user.getGroupKey(globalAdminGroupId)

									  return this.entityClient.load(GroupTypeRef, neverNull(group.admin)).then(localAdminGroup => {
										  if (localAdminGroup.admin === globalAdminGroupId) {
											  return decryptKey(globalAdminGroupKey, neverNull(localAdminGroup.adminGroupEncGKey))
										  } else {
											  throw new Error(`local admin group ${localAdminGroup._id} is not administrated by global admin group ${globalAdminGroupId}`)
										  }
									  })
								  }
							  })
							  .then(adminGroupKey => {
								  return decryptKey(adminGroupKey, neverNull(group.adminGroupEncGKey))
							  })
			})
		}
	}
}