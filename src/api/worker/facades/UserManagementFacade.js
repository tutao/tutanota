// @flow
import {assertWorkerOrNode} from "../../Env"
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {Const, GroupType, AccountType} from "../../common/TutanotaConstants"
import {load, serviceRequestVoid} from "../EntityWorker"
import {GroupTypeRef} from "../../entities/sys/Group"
import {decryptKey, encryptKey, encryptBytes, encryptString} from "../crypto/CryptoFacade"
import {generateRandomSalt, generateKeyFromPassphrase} from "../crypto/Bcrypt"
import {KeyLength} from "../crypto/CryptoConstants"
import {neverNull, asyncFind} from "../../common/utils/Utils"
import {createAuthVerifier} from "../crypto/CryptoUtils"
import {createResetPasswordData} from "../../entities/sys/ResetPasswordData"
import {HttpMethod} from "../../common/EntityFunctions"
import {createMembershipAddData} from "../../entities/sys/MembershipAddData"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {createUserDataDelete} from "../../entities/sys/UserDataDelete"
import {aes128RandomKey} from "../crypto/Aes"
import {createUserAccountUserData} from "../../entities/tutanota/UserAccountUserData"
import {createUserAccountCreateData} from "../../entities/tutanota/UserAccountCreateData"
import {TutanotaService} from "../../entities/tutanota/Services"
import {random} from "../crypto/Randomizer"
import type {GroupManagementFacade} from "./GroupManagementFacade"
import {createContactFormUserData} from "../../entities/tutanota/ContactFormUserData"
import type {LoginFacade} from "./LoginFacade"
import type {WorkerImpl} from "../WorkerImpl"
import {readCounterValue} from "./CounterFacade"
import {createUpdateAdminshipData} from "../../entities/sys/UpdateAdminshipData"
import {SysService} from "../../entities/sys/Services"

assertWorkerOrNode()

export class UserManagementFacade {

	_worker: WorkerImpl;
	_login: LoginFacade;
	_groupManagement: GroupManagementFacade;

	constructor(worker: WorkerImpl, login: LoginFacade, groupManagement: GroupManagementFacade) {
		this._worker = worker
		this._login = login
		this._groupManagement = groupManagement
	}

	changeUserPassword(user: User, newPassword: string): Promise<void> {
		return load(GroupTypeRef, user.userGroup.group).then(userGroup => {
			this._groupManagement.getAdminGroupKey(userGroup).then(adminGroupKey => {
				let userGroupKey = decryptKey(adminGroupKey, neverNull(userGroup.adminGroupEncGKey))
				let salt = generateRandomSalt()
				let passwordKey = generateKeyFromPassphrase(newPassword, salt, KeyLength.b128)
				let pwEncUserGroupKey = encryptKey(passwordKey, userGroupKey)
				let passwordVerifier = createAuthVerifier(passwordKey)

				let data = createResetPasswordData()
				data.user = neverNull(userGroup.user)
				data.salt = salt
				data.verifier = passwordVerifier
				data.pwEncUserGroupKey = pwEncUserGroupKey
				return serviceRequestVoid("resetpasswordservice", HttpMethod.POST, data)
			})
		})
	}

	changeAdminFlag(user: User, admin: boolean): Promise<void> {
		let adminGroupId = this._login.getGroupId(GroupType.Admin)
		let adminGroupKey = this._login.getGroupKey(adminGroupId)
		return load(GroupTypeRef, user.userGroup.group).then(userGroup => {
			let userGroupKey = decryptKey(adminGroupKey, neverNull(userGroup.adminGroupEncGKey))
			return this._getAccountGroupMembership().then(accountGroupMembership => {
				if (admin) {
					return this._groupManagement.addUserToGroup(user, adminGroupId).then(() => {
						// we can not use addUserToGroup here because the admin is not admin of the account group
						let addAccountGroup = createMembershipAddData()
						addAccountGroup.user = user._id
						addAccountGroup.group = accountGroupMembership.group
						addAccountGroup.symEncGKey = encryptKey(userGroupKey, decryptKey(this._login.getUserGroupKey(), accountGroupMembership.symEncGKey))
						return serviceRequestVoid("membershipservice", HttpMethod.POST, addAccountGroup)
					})
				} else {
					return this._groupManagement.removeUserFromGroup(user._id, adminGroupId).then(() => {
						return this._groupManagement.removeUserFromGroup(user._id, accountGroupMembership.group)
					})
				}
			})
		})
	}

	_getAccountGroupMembership(): Promise<GroupMembership> {
		let mailAddress = (this._login.getLoggedInUser().accountType == AccountType.PREMIUM) ? "premium@tutanota.de" : "starter@tutanota.de"
		return asyncFind(this._login.getLoggedInUser().memberships, membership => {
			return load(GroupInfoTypeRef, membership.groupInfo).then(groupInfo => {
				return (groupInfo.mailAddress == mailAddress)
			})
		}).then(membership => {
			return neverNull(membership)
		})
	}

	updateAdminship(groupId: Id, newAdminGroupId: Id): Promise<void> {
		let adminGroupId = this._login.getGroupId(GroupType.Admin)
		return load(GroupTypeRef, newAdminGroupId).then(newAdminGroup => {
			return load(GroupTypeRef, groupId).then(group => {
				return load(GroupTypeRef, neverNull(group.admin)).then(oldAdminGroup => {
					let data = createUpdateAdminshipData()
					data.group = group._id
					data.newAdminGroup = newAdminGroup._id

					let adminGroupKey = this._login.getGroupKey(adminGroupId)
					let groupKey
					if (oldAdminGroup._id == adminGroupId) {
						groupKey = decryptKey(adminGroupKey, neverNull(group.adminGroupEncGKey))
					} else {
						let localAdminGroupKey = decryptKey(adminGroupKey, neverNull(oldAdminGroup.adminGroupEncGKey))
						groupKey = decryptKey(localAdminGroupKey, neverNull(group.adminGroupEncGKey))
					}
					if (newAdminGroup._id == adminGroupId) {
						data.newAdminGroupEncGKey = encryptKey(adminGroupKey, groupKey)
					} else {
						let localAdminGroupKey = decryptKey(adminGroupKey, neverNull(newAdminGroup.adminGroupEncGKey))
						data.newAdminGroupEncGKey = encryptKey(localAdminGroupKey, groupKey)
					}

					return serviceRequestVoid(SysService.UpdateAdminshipService, HttpMethod.POST, data)
				})
			})
		});
	}

	readUsedUserStorage(user: User): Promise<number> {
		return readCounterValue(Const.COUNTER_USED_MEMORY, this._getGroupId(user, GroupType.Mail)).then(mailStorage => {
			return readCounterValue(Const.COUNTER_USED_MEMORY, this._getGroupId(user, GroupType.Contact)).then(contactStorage => {
				return readCounterValue(Const.COUNTER_USED_MEMORY, this._getGroupId(user, GroupType.File)).then(fileStorage => {
					return (Number(mailStorage) + Number(contactStorage) + Number(fileStorage));
				})
			})
		})
	}

	deleteUser(user: User, restore: boolean): Promise<void> {
		let data = createUserDataDelete()
		data.user = user._id
		data.restore = restore
		data.date = Const.CURRENT_DATE
		return serviceRequestVoid("userservice", HttpMethod.DELETE, data)
	}

	_getGroupId(user: User, groupType: GroupTypeEnum): Id {
		if (groupType == GroupType.User) {
			return user.userGroup.group
		} else {
			let membership = user.memberships.find(m => m.groupType === groupType)
			if (!membership) {
				throw new Error("could not find groupType " + groupType + " for user " + user._id)
			}
			return membership.group
		}
	}

	createUser(name: string, mailAddress: string, password: string, userIndex: number, overallNbrOfUsersToCreate: number): Promise<void> {
		let adminGroupIds = this._login.getGroupIds(GroupType.Admin)
		if (adminGroupIds.length == 0) {
			adminGroupIds = this._login.getGroupIds(GroupType.LocalAdmin)
		}
		let adminGroupKey = this._login.getGroupKey(adminGroupIds[0])

		let customerGroupKey = this._login.getGroupKey(this._login.getGroupId(GroupType.Customer))
		let userGroupKey = aes128RandomKey()
		let userGroupInfoSessionKey = aes128RandomKey()

		return this._groupManagement.generateInternalGroupData(userGroupKey, userGroupInfoSessionKey, adminGroupIds[0], adminGroupKey, customerGroupKey).then(userGroupData => {
			return this._worker.sendProgress((userIndex + 0.8) / overallNbrOfUsersToCreate * 100).then(() => {
				let data = createUserAccountCreateData()
				data.date = Const.CURRENT_DATE
				data.userGroupData = userGroupData
				data.userData = this.generateUserAccountData(userGroupKey, userGroupInfoSessionKey, customerGroupKey, mailAddress, password, name)
				return serviceRequestVoid(TutanotaService.UserAccountService, HttpMethod.POST, data).then(() => {
					return this._worker.sendProgress((userIndex + 1) / overallNbrOfUsersToCreate * 100)
				})
			})
		})
	}

	generateUserAccountData(userGroupKey: Aes128Key, userGroupInfoSessionKey: Aes128Key, customerGroupKey: Aes128Key, mailAddress: string, password: string, userName: string): UserAccountUserData {
		let salt = generateRandomSalt()
		let userPassphraseKey = generateKeyFromPassphrase(password, salt, KeyLength.b128)

		let mailGroupKey = aes128RandomKey()
		let contactGroupKey = aes128RandomKey()
		let fileGroupKey = aes128RandomKey()
		let clientKey = aes128RandomKey()
		let mailboxSessionKey = aes128RandomKey()
		let contactListSessionKey = aes128RandomKey()
		let fileSystemSessionKey = aes128RandomKey()
		let mailGroupInfoSessionKey = aes128RandomKey()
		let contactGroupInfoSessionKey = aes128RandomKey()
		let fileGroupInfoSessionKey = aes128RandomKey()
		let tutanotaPropertiesSessionKey = aes128RandomKey()

		let userEncEntropy = encryptBytes(userGroupKey, random.generateRandomData(32))

		let userData = createUserAccountUserData()
		userData.mailAddress = mailAddress
		userData.encryptedName = encryptString(userGroupInfoSessionKey, userName)
		userData.salt = salt
		userData.verifier = createAuthVerifier(userPassphraseKey)
		userData.userEncClientKey = encryptKey(userGroupKey, clientKey)
		userData.pwEncUserGroupKey = encryptKey(userPassphraseKey, userGroupKey)
		userData.userEncCustomerGroupKey = encryptKey(userGroupKey, customerGroupKey)
		userData.userEncMailGroupKey = encryptKey(userGroupKey, mailGroupKey)
		userData.userEncContactGroupKey = encryptKey(userGroupKey, contactGroupKey)
		userData.userEncFileGroupKey = encryptKey(userGroupKey, fileGroupKey)
		userData.userEncEntropy = userEncEntropy
		userData.userEncTutanotaPropertiesSessionKey = encryptKey(userGroupKey, tutanotaPropertiesSessionKey)
		userData.mailEncMailBoxSessionKey = encryptKey(mailGroupKey, mailboxSessionKey)
		userData.contactEncContactListSessionKey = encryptKey(contactGroupKey, contactListSessionKey)
		userData.fileEncFileSystemSessionKey = encryptKey(fileGroupKey, fileSystemSessionKey)
		userData.customerEncMailGroupInfoSessionKey = encryptKey(customerGroupKey, mailGroupInfoSessionKey)
		userData.customerEncContactGroupInfoSessionKey = encryptKey(customerGroupKey, contactGroupInfoSessionKey)
		userData.customerEncFileGroupInfoSessionKey = encryptKey(customerGroupKey, fileGroupInfoSessionKey)

		return userData
	}

	generateContactFormUserAccountData(userGroupKey: Aes128Key, password: string): ContactFormUserData {
		let salt = generateRandomSalt()
		let userPassphraseKey = generateKeyFromPassphrase(password, salt, KeyLength.b128)
		let mailGroupKey = aes128RandomKey()
		let clientKey = aes128RandomKey()
		let mailboxSessionKey = aes128RandomKey()
		let mailGroupInfoSessionKey = aes128RandomKey()
		let tutanotaPropertiesSessionKey = aes128RandomKey()
		let userEncEntropy = encryptBytes(userGroupKey, random.generateRandomData(32))
		let userData = createContactFormUserData()
		userData.salt = salt
		userData.verifier = createAuthVerifier(userPassphraseKey)
		userData.userEncClientKey = encryptKey(userGroupKey, clientKey)
		userData.pwEncUserGroupKey = encryptKey(userPassphraseKey, userGroupKey)
		userData.userEncMailGroupKey = encryptKey(userGroupKey, mailGroupKey)
		userData.userEncEntropy = userEncEntropy
		userData.userEncTutanotaPropertiesSessionKey = encryptKey(userGroupKey, tutanotaPropertiesSessionKey)
		userData.mailEncMailBoxSessionKey = encryptKey(mailGroupKey, mailboxSessionKey)
		userData.ownerEncMailGroupInfoSessionKey = encryptKey(mailGroupKey, mailGroupInfoSessionKey)
		return userData
	}


}


