// @flow
import {assertWorkerOrNode} from "../../Env"
import {customerFacade} from "./CustomerFacade"
import {Const, GroupType} from "../../common/TutanotaConstants"
import {createCreateMailGroupData} from "../../entities/tutanota/CreateMailGroupData"
import {generateRsaKey, publicKeyToHex} from "../crypto/Rsa"
import {createInternalGroupData} from "../../entities/tutanota/InternalGroupData"
import {hexToUint8Array} from "../../common/utils/Encoding"
import {encryptRsaKey, encryptKey, decryptKey, encryptString} from "../crypto/CryptoFacade"
import {loginFacade} from "./LoginFacade"
import {serviceRequestVoid, load} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {HttpMethod} from "../../common/EntityFunctions"
import {aes128RandomKey} from "../crypto/Aes"
import {createCreateTeamGroupData} from "../../entities/tutanota/CreateTeamGroupData"
import {GroupTypeRef} from "../../entities/sys/Group"
import {createMembershipAddData} from "../../entities/sys/MembershipAddData"
import {neverNull} from "../../common/utils/Utils"
import {createMembershipRemoveData} from "../../entities/sys/MembershipRemoveData"
import {createDeleteGroupData} from "../../entities/tutanota/DeleteGroupData"

assertWorkerOrNode()

export class GroupManagementFacade {

	constructor() {
	}

	readUsedGroupStorage(groupId: Id): Promise<number> {
		return customerFacade.readCounterValue(Const.COUNTER_USED_MEMORY, groupId).then(usedStorage => {
			return Number(usedStorage)
		})
	}

	createMailGroup(name: string, mailAddress: string): Promise<void> {
		let adminGroupKey = loginFacade.getGroupKey(loginFacade.getGroupId(GroupType.Admin))
		let customerGroupKey = loginFacade.getGroupKey(loginFacade.getGroupId(GroupType.Customer))
		let mailGroupKey = aes128RandomKey()
		let mailGroupInfoSessionKey = aes128RandomKey()
		let mailboxSessionKey = aes128RandomKey()

		return this.generateInternalGroupData(mailGroupKey, mailGroupInfoSessionKey, adminGroupKey, customerGroupKey).then(mailGroupData => {
			let data = createCreateMailGroupData()
			data.mailAddress = mailAddress
			data.encryptedName = encryptString(mailGroupInfoSessionKey, name)
			data.mailEncMailboxSessionKey = encryptKey(mailGroupKey, mailboxSessionKey)
			data.groupData = mailGroupData
			return serviceRequestVoid(TutanotaService.MailGroupService, HttpMethod.POST, data)
		})
	}

	createTeamGroup(name: string): Promise<void> {
		let adminGroupKey = loginFacade.getGroupKey(loginFacade.getGroupId(GroupType.Admin))
		let customerGroupKey = loginFacade.getGroupKey(loginFacade.getGroupId(GroupType.Customer))
		let teamGroupKey = aes128RandomKey()
		let teamGroupInfoSessionKey = aes128RandomKey()

		return this.generateInternalGroupData(teamGroupKey, teamGroupInfoSessionKey, adminGroupKey, customerGroupKey).then(mailGroupData => {
			let data = createCreateTeamGroupData()
			data.encryptedName = encryptString(teamGroupInfoSessionKey, name)
			data.groupData = mailGroupData
			return serviceRequestVoid(TutanotaService.TeamGroupService, HttpMethod.POST, data)
		})
	}

	generateInternalGroupData(groupKey: Aes128Key, groupInfoSessionKey: Aes128Key, adminGroupKey: Aes128Key, ownerGroupKey: Aes128Key): Promise<InternalGroupData> {
		return generateRsaKey().then(keyPair => {
			let groupData = createInternalGroupData()
			groupData.publicKey = hexToUint8Array(publicKeyToHex(keyPair.publicKey))
			groupData.groupEncPrivateKey = encryptRsaKey(groupKey, keyPair.privateKey)
			groupData.adminEncGroupKey = encryptKey(adminGroupKey, groupKey)
			groupData.ownerEncGroupInfoSessionKey = encryptKey(ownerGroupKey, groupInfoSessionKey)
			return groupData
		})
	}

	addUserToGroup(user: User, groupId: Id): Promise<void> {
		let adminGroupKey = loginFacade.getGroupKey(loginFacade.getGroupId(GroupType.Admin))
		return load(GroupTypeRef, user.userGroup.group).then(userGroup => {
			let userGroupKey = decryptKey(adminGroupKey, neverNull(userGroup.adminGroupEncGKey))
			return load(GroupTypeRef, groupId).then(group => {
				let groupKey = decryptKey(adminGroupKey, neverNull(group.adminGroupEncGKey))
				let data = createMembershipAddData()
				data.user = user._id
				data.group = groupId
				data.symEncGKey = encryptKey(userGroupKey, groupKey)
				return serviceRequestVoid("membershipservice", HttpMethod.POST, data)
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
		if (group.type == GroupType.Mail) {
			return serviceRequestVoid("mailgroupservice", HttpMethod.DELETE, data)
		} else if (group.type == GroupType.Team) {
			return serviceRequestVoid("teamgroupservice", HttpMethod.DELETE, data)
		} else {
			return Promise.reject(new Error("invalid group type for deactivation"))
		}
	}
}

export var groupManagementFacade: GroupManagementFacade = new GroupManagementFacade()