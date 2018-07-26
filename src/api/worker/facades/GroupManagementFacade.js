// @flow
import {assertWorkerOrNode} from "../../Env"
import {Const, GroupType} from "../../common/TutanotaConstants"
import {createCreateMailGroupData} from "../../entities/tutanota/CreateMailGroupData"
import {generateRsaKey, publicKeyToHex} from "../crypto/Rsa"
import {createInternalGroupData} from "../../entities/tutanota/InternalGroupData"
import {hexToUint8Array} from "../../common/utils/Encoding"
import {encryptRsaKey, encryptKey, decryptKey, encryptString} from "../crypto/CryptoFacade"
import type {LoginFacade} from "./LoginFacade"
import {serviceRequestVoid, load} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {HttpMethod} from "../../common/EntityFunctions"
import {aes128RandomKey} from "../crypto/Aes"
import {createCreateLocalAdminGroupData} from "../../entities/tutanota/CreateLocalAdminGroupData"
import {GroupTypeRef} from "../../entities/sys/Group"
import {createMembershipAddData} from "../../entities/sys/MembershipAddData"
import {neverNull} from "../../common/utils/Utils"
import {createMembershipRemoveData} from "../../entities/sys/MembershipRemoveData"
import {createDeleteGroupData} from "../../entities/tutanota/DeleteGroupData"
import {readCounterValue} from "./CounterFacade"

assertWorkerOrNode()

export class GroupManagementFacade {

	_login: LoginFacade;

	constructor(login: LoginFacade) {
		this._login = login
	}

	readUsedGroupStorage(groupId: Id): Promise<number> {
		return readCounterValue(Const.COUNTER_USED_MEMORY, groupId).then(usedStorage => {
			return Number(usedStorage)
		})
	}

	createMailGroup(name: string, mailAddress: string): Promise<void> {
		let adminGroupIds = this._login.getGroupIds(GroupType.Admin)
		if (adminGroupIds.length === 0) {
			adminGroupIds = this._login.getGroupIds(GroupType.LocalAdmin)
		}
		let adminGroupKey = this._login.getGroupKey(adminGroupIds[0])
		let customerGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Customer))
		let mailGroupKey = aes128RandomKey()
		let mailGroupInfoSessionKey = aes128RandomKey()
		let mailboxSessionKey = aes128RandomKey()

		return this.generateInternalGroupData(mailGroupKey, mailGroupInfoSessionKey, adminGroupIds[0], adminGroupKey, customerGroupKey)
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

		return this.generateInternalGroupData(groupKey, groupInfoSessionKey, adminGroupId, adminGroupKey, customerGroupKey)
		           .then(mailGroupData => {
			           let data = createCreateLocalAdminGroupData()
			           data.encryptedName = encryptString(groupInfoSessionKey, name)
			           data.groupData = mailGroupData
			           return serviceRequestVoid(TutanotaService.LocalAdminGroupService, HttpMethod.POST, data)
		           })
	}

	generateInternalGroupData(groupKey: Aes128Key, groupInfoSessionKey: Aes128Key, adminGroupId: ?Id, adminGroupKey: Aes128Key, ownerGroupKey: Aes128Key): Promise<InternalGroupData> {
		return generateRsaKey().then(keyPair => {
			let groupData = createInternalGroupData()
			groupData.publicKey = hexToUint8Array(publicKeyToHex(keyPair.publicKey))
			groupData.groupEncPrivateKey = encryptRsaKey(groupKey, keyPair.privateKey)
			groupData.adminGroup = adminGroupId
			groupData.adminEncGroupKey = encryptKey(adminGroupKey, groupKey)
			groupData.ownerEncGroupInfoSessionKey = encryptKey(ownerGroupKey, groupInfoSessionKey)
			return groupData
		})
	}

	addUserToGroup(user: User, groupId: Id): Promise<void> {
		return load(GroupTypeRef, user.userGroup.group).then(userGroup => {
			this.getAdminGroupKey(userGroup).then(adminGroupKeyForUserGroup => {
				let userGroupKey = decryptKey(adminGroupKeyForUserGroup, neverNull(userGroup.adminGroupEncGKey))
				return load(GroupTypeRef, groupId).then(group => {
					this.getAdminGroupKey(group).then(adminGroupKey => {
						let groupKey = decryptKey(adminGroupKey, neverNull(group.adminGroupEncGKey))
						let data = createMembershipAddData()
						data.user = user._id
						data.group = groupId
						data.symEncGKey = encryptKey(userGroupKey, groupKey)
						return serviceRequestVoid("membershipservice", HttpMethod.POST, data)
					})
				})
			})
		})
	}

	removeUserFromGroup(userId: Id, groupId: Id): Promise<void> {
		let data = createMembershipRemoveData()
		data.user = userId
		data.group = groupId
		return serviceRequestVoid("membershipservice", HttpMethod.DELETE, data)
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

	getAdminGroupKey(group: Group): Promise<Aes128Key> {
		try {
			// the admin and local admin can retrieve their group keys directly from their memberships
			let adminGroupKey = (group.type === GroupType.Admin || group.type
				=== GroupType.LocalAdmin) ? this._login.getGroupKey(group._id) : this._login.getGroupKey(neverNull(group.admin))
			return Promise.resolve(adminGroupKey)
		} catch (e) {
			let globalAdminGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Admin))
			return load(GroupTypeRef, neverNull(group.admin)).then(localAdminGroup => {
				return decryptKey(globalAdminGroupKey, neverNull(localAdminGroup.adminGroupEncGKey))
			})
		}
	}
}
