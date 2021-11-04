// @flow
import {Const, GroupType} from "../../common/TutanotaConstants"
import {createCreateMailGroupData} from "../../entities/tutanota/CreateMailGroupData"
import {generateRsaKey, publicKeyToHex} from "../crypto/Rsa"
import type {InternalGroupData} from "../../entities/tutanota/InternalGroupData"
import {createInternalGroupData} from "../../entities/tutanota/InternalGroupData"
import {hexToUint8Array} from "@tutao/tutanota-utils"
import {decryptKey, encryptKey, encryptRsaKey, encryptString} from "../crypto/CryptoFacade"
import {LoginFacadeImpl} from "./LoginFacade"
import {load, serviceRequest, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {HttpMethod} from "../../common/EntityFunctions"
import {aes128RandomKey} from "../crypto/Aes"
import {createCreateLocalAdminGroupData} from "../../entities/tutanota/CreateLocalAdminGroupData"
import type {Group} from "../../entities/sys/Group"
import {GroupTypeRef} from "../../entities/sys/Group"
import {createMembershipAddData} from "../../entities/sys/MembershipAddData"
import {neverNull} from "@tutao/tutanota-utils"
import {createMembershipRemoveData} from "../../entities/sys/MembershipRemoveData"
import {createDeleteGroupData} from "../../entities/tutanota/DeleteGroupData"
import {CounterFacade} from "./CounterFacade"
import {SysService} from "../../entities/sys/Services"
import type {User} from "../../entities/sys/User"
import {CreateGroupPostReturnTypeRef} from "../../entities/tutanota/CreateGroupPostReturn"
import {createUserAreaGroupPostData} from "../../entities/tutanota/UserAreaGroupPostData"
import type {UserAreaGroupData} from "../../entities/tutanota/UserAreaGroupData"
import {createUserAreaGroupData} from "../../entities/tutanota/UserAreaGroupData"
import {EntityClient} from "../../common/EntityClient"
import {assertWorkerOrNode} from "../../common/Env"
import type {RsaKeyPair} from "../crypto/RsaKeyPair"

assertWorkerOrNode()

export interface GroupManagementFacade {
	createMailGroup(name: string, mailAddress: string): Promise<void>;

	createLocalAdminGroup(name: string): Promise<void>;

	createTemplateGroup(name: string): Promise<Id>;

	deactivateGroup(group: Group, restore: boolean): Promise<void>;

	removeUserFromGroup(userId: Id, groupId: Id): Promise<void>;

	addUserToGroup(user: User, groupId: Id): Promise<void>;

	readUsedGroupStorage(groupId: Id): Promise<number>;
}

export class GroupManagementFacadeImpl {

	_login: LoginFacadeImpl;
	_counters: CounterFacade
	_entity: EntityClient

	constructor(login: LoginFacadeImpl, counters: CounterFacade, entity: EntityClient) {
		this._login = login
		this._counters = counters
		this._entity = entity
	}

	readUsedGroupStorage(groupId: Id): Promise<number> {
		return this._counters.readCounterValue(Const.COUNTER_USED_MEMORY, groupId).then(usedStorage => {
			return Number(usedStorage)
		})
	}

	createMailGroup(name: string, mailAddress: string): Promise<void> {
		let adminGroupIds = this._login.getGroupIds(GroupType.Admin)
		if (adminGroupIds.length === 0) {
			adminGroupIds = this._login
			                    .getGroupIds(GroupType.LocalAdmin)
		}
		let adminGroupKey = this._login.getGroupKey(adminGroupIds[0])
		let customerGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Customer))
		let mailGroupKey = aes128RandomKey()
		let mailGroupInfoSessionKey = aes128RandomKey()
		let mailboxSessionKey = aes128RandomKey()

		return generateRsaKey().then(keyPair => this.generateInternalGroupData(keyPair, mailGroupKey, mailGroupInfoSessionKey, adminGroupIds[0], adminGroupKey, customerGroupKey))
		                       .then(mailGroupData => {
			                       let data = createCreateMailGroupData()
			                       data.mailAddress = mailAddress
			                       data.encryptedName = encryptString(mailGroupInfoSessionKey, name)
			                       data.mailEncMailboxSessionKey = encryptKey(mailGroupKey, mailboxSessionKey)
			                       data.groupData = mailGroupData
			                       return serviceRequestVoid(TutanotaService.MailGroupService, HttpMethod.POST, data)
		                       })
	}

	createLocalAdminGroup(name: string): Promise<void> {
		let adminGroupId = this._login.getGroupId(GroupType.Admin)
		let adminGroupKey = this._login.getGroupKey(adminGroupId)
		let customerGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Customer))
		let groupKey = aes128RandomKey()
		let groupInfoSessionKey = aes128RandomKey()

		return generateRsaKey().then(keyPair => this.generateInternalGroupData(keyPair, groupKey, groupInfoSessionKey, adminGroupId, adminGroupKey, customerGroupKey))
		                       .then(mailGroupData => {
			                       let data = createCreateLocalAdminGroupData()
			                       data.encryptedName = encryptString(groupInfoSessionKey, name)
			                       data.groupData = mailGroupData
			                       return serviceRequestVoid(TutanotaService.LocalAdminGroupService, HttpMethod.POST, data)
		                       })
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
		return this._entity.load(GroupTypeRef, this._login.getUserGroupId()).then(userGroup => {
			const adminGroupId = neverNull(userGroup.admin) // user group has always admin group
			let adminGroupKey = null
			if (this._login.getAllGroupIds().indexOf(adminGroupId) !== -1) { // getGroupKey throws an error if user is not member of that group - so check first
				adminGroupKey = this._login.getGroupKey(adminGroupId)
			}
			const customerGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Customer))
			const userGroupKey = this._login.getUserGroupKey()

			const groupRootSessionKey = aes128RandomKey()
			const groupInfoSessionKey = aes128RandomKey()
			const groupKey = aes128RandomKey()

			return createUserAreaGroupData({
					groupEncGroupRootSessionKey: encryptKey(groupKey, groupRootSessionKey),
					customerEncGroupInfoSessionKey: encryptKey(customerGroupKey, groupInfoSessionKey),
					userEncGroupKey: encryptKey(userGroupKey, groupKey),
					groupInfoEncName: encryptString(groupInfoSessionKey, name),
					adminEncGroupKey: adminGroupKey ? encryptKey(adminGroupKey, groupKey) : null,
					adminGroup: adminGroupId
				}
			)
		})
	}

	createTemplateGroup(name: string): Promise<Id> {
		return this.generateUserAreaGroupData(name).then(groupData => {
			const serviceData = createUserAreaGroupPostData({
				groupData: groupData
			})
			return serviceRequest(TutanotaService.TemplateGroupService, HttpMethod.POST, serviceData, CreateGroupPostReturnTypeRef)
				.then(returnValue => returnValue.group)
		})
	}

	generateInternalGroupData(keyPair: RsaKeyPair, groupKey: Aes128Key, groupInfoSessionKey: Aes128Key, adminGroupId: ?Id, adminGroupKey: Aes128Key, ownerGroupKey: Aes128Key): InternalGroupData {
		let groupData = createInternalGroupData()
		groupData.publicKey = hexToUint8Array(publicKeyToHex(keyPair.publicKey))
		groupData.groupEncPrivateKey = encryptRsaKey(groupKey, keyPair.privateKey)
		groupData.adminGroup = adminGroupId
		groupData.adminEncGroupKey = encryptKey(adminGroupKey, groupKey)
		groupData.ownerEncGroupInfoSessionKey = encryptKey(ownerGroupKey, groupInfoSessionKey)
		return groupData
	}

	addUserToGroup(user: User, groupId: Id): Promise<void> {
		return this.getGroupKeyAsAdmin(user.userGroup.group).then(userGroupKey => {
			return this.getGroupKeyAsAdmin(groupId).then(groupKey => {
				let data = createMembershipAddData()
				data.user = user._id
				data.group = groupId
				data.symEncGKey = encryptKey(userGroupKey, groupKey)
				return serviceRequestVoid(SysService.MembershipService, HttpMethod.POST, data)
			})
		})
	}

	removeUserFromGroup(userId: Id, groupId: Id): Promise<void> {
		let data = createMembershipRemoveData()
		data.user = userId
		data.group = groupId
		return serviceRequestVoid(SysService.MembershipService, HttpMethod.DELETE, data)
	}

	deactivateGroup(group: Group, restore: boolean): Promise<void> {
		let data = createDeleteGroupData()
		data.group = group._id
		data.restore = restore
		if (group.type === GroupType.Mail) {
			return serviceRequestVoid(TutanotaService.MailGroupService, HttpMethod.DELETE, data)
		} else if (group.type === GroupType.LocalAdmin) {
			return serviceRequestVoid(TutanotaService.LocalAdminGroupService, HttpMethod.DELETE, data)
		} else {
			return Promise.reject(new Error("invalid group type for deactivation"))
		}
	}

	getGroupKeyAsAdmin(groupId: Id): Promise<Aes128Key> {
		if (this._login.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			return Promise.resolve(this._login.getGroupKey(neverNull(groupId)))
		} else {
			return load(GroupTypeRef, groupId).then(group => {
				return Promise.resolve().then(() => {
					if (group.admin && this._login.hasGroup(group.admin)) {
						// e.g. I am a member of the group that administrates group G and want to add a new member to G
						return this._login.getGroupKey(neverNull(group.admin))
					} else {
						// e.g. I am a global admin but group G is administrated by a local admin group and want to add a new member to G
						let globalAdminGroupId = this._login.getGroupId(GroupType.Admin)
						let globalAdminGroupKey = this._login.getGroupKey(globalAdminGroupId)
						return load(GroupTypeRef, neverNull(group.admin)).then(localAdminGroup => {
							if (localAdminGroup.admin === globalAdminGroupId) {
								return decryptKey(globalAdminGroupKey, neverNull(localAdminGroup.adminGroupEncGKey))
							} else {
								throw new Error(`local admin group ${localAdminGroup._id} is not administrated by global admin group ${globalAdminGroupId}`)
							}
						})
					}
				}).then(adminGroupKey => {
					return decryptKey(adminGroupKey, neverNull(group.adminGroupEncGKey))
				})
			})
		}
	}
}
