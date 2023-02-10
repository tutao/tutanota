import { AccountType, Const, GroupType } from "../../../common/TutanotaConstants.js"
import type { User } from "../../../entities/sys/TypeRefs.js"
import {
	createMembershipAddData,
	createRecoverCode,
	createResetPasswordData,
	createUpdateAdminshipData,
	createUserDataDelete,
	GroupTypeRef,
	RecoverCodeTypeRef,
} from "../../../entities/sys/TypeRefs.js"
import { encryptBytes, encryptString } from "../../crypto/CryptoFacade.js"
import { assertNotNull, neverNull, uint8ArrayToHex } from "@tutao/tutanota-utils"
import type { ContactFormUserData, UserAccountUserData } from "../../../entities/tutanota/TypeRefs.js"
import { createContactFormUserData, createUserAccountCreateData, createUserAccountUserData } from "../../../entities/tutanota/TypeRefs.js"
import type { GroupManagementFacade } from "./GroupManagementFacade.js"
import type { RecoverData } from "../LoginFacade.js"
import type { WorkerImpl } from "../../WorkerImpl.js"
import { CounterFacade } from "./CounterFacade.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import {
	aes128RandomKey,
	aes256EncryptKey,
	aes256RandomKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	createAuthVerifierAsBase64Url,
	decrypt256Key,
	decryptKey,
	encrypt256Key,
	encryptKey,
	generateKeyFromPassphrase,
	generateRandomSalt,
	KeyLength,
	random,
} from "@tutao/tutanota-crypto"
import type { RsaImplementation } from "../../crypto/RsaImplementation.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { MembershipService, ResetPasswordService, SystemKeysService, UpdateAdminshipService, UserService } from "../../../entities/sys/Services.js"
import { UserAccountService } from "../../../entities/tutanota/Services.js"
import { UserFacade } from "../UserFacade.js"
import { ExposedOperationProgressTracker, OperationId } from "../../../main/OperationProgressTracker.js"

assertWorkerOrNode()

export class UserManagementFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly groupManagement: GroupManagementFacade,
		private readonly counters: CounterFacade,
		private readonly rsa: RsaImplementation,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly operationProgressTracker: ExposedOperationProgressTracker,
	) {}

	async changeUserPassword(user: User, newPassword: string): Promise<void> {
		const userGroupKey = await this.groupManagement.getGroupKeyViaAdminEncGKey(user.userGroup.group)
		const salt = generateRandomSalt()
		const passwordKey = generateKeyFromPassphrase(newPassword, salt, KeyLength.b128)
		const pwEncUserGroupKey = encryptKey(passwordKey, userGroupKey)
		const passwordVerifier = createAuthVerifier(passwordKey)
		const data = createResetPasswordData({
			user: user._id,
			salt,
			verifier: passwordVerifier,
			pwEncUserGroupKey,
		})
		await this.serviceExecutor.post(ResetPasswordService, data)
	}

	async changeAdminFlag(user: User, admin: boolean): Promise<void> {
		let adminGroupId = this.userFacade.getGroupId(GroupType.Admin)

		let adminGroupKey = this.userFacade.getGroupKey(adminGroupId)

		const userGroup = await this.entityClient.load(GroupTypeRef, user.userGroup.group)
		let userGroupKey = decryptKey(adminGroupKey, neverNull(userGroup.adminGroupEncGKey))

		if (admin) {
			await this.groupManagement.addUserToGroup(user, adminGroupId)

			if (user.accountType !== AccountType.SYSTEM) {
				const keyData = await this._getAccountKeyData()
				// we can not use addUserToGroup here because the admin is not admin of the account group
				const addAccountGroup = createMembershipAddData({
					user: user._id,
					group: keyData.group,
					symEncGKey: encryptKey(userGroupKey, decryptKey(this.userFacade.getUserGroupKey(), keyData.symEncGKey)),
				})
				await this.serviceExecutor.post(MembershipService, addAccountGroup)
			}
		} else {
			await this.groupManagement.removeUserFromGroup(user._id, adminGroupId)

			if (user.accountType !== AccountType.SYSTEM) {
				const keyData = await this._getAccountKeyData()
				return this.groupManagement.removeUserFromGroup(user._id, keyData.group)
			}
		}
	}

	/**
	 * Get key and id of premium or starter group.
	 * @throws Error if account type is not premium or starter
	 *
	 * @private
	 */
	async _getAccountKeyData(): Promise<{ group: Id; symEncGKey: Uint8Array }> {
		const keysReturn = await this.serviceExecutor.get(SystemKeysService, null)
		const user = this.userFacade.getLoggedInUser()

		if (user.accountType === AccountType.PREMIUM) {
			return {
				group: neverNull(keysReturn.premiumGroup),
				symEncGKey: keysReturn.premiumGroupKey,
			}
		} else if (user.accountType === AccountType.STARTER) {
			// We don't have starterGroup on SystemKeyReturn so we hardcode it for now.
			return {
				group: "JDpWrwG----0",
				symEncGKey: keysReturn.starterGroupKey,
			}
		} else {
			throw new Error(`Trying to get keyData for user with account type ${user.accountType}`)
		}
	}

	async updateAdminship(groupId: Id, newAdminGroupId: Id): Promise<void> {
		let adminGroupId = this.userFacade.getGroupId(GroupType.Admin)
		const newAdminGroup = await this.entityClient.load(GroupTypeRef, newAdminGroupId)
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		const oldAdminGroup = await this.entityClient.load(GroupTypeRef, neverNull(group.admin))

		const adminGroupKey = this.userFacade.getGroupKey(adminGroupId)

		let groupKey
		if (oldAdminGroup._id === adminGroupId) {
			groupKey = decryptKey(adminGroupKey, neverNull(group.adminGroupEncGKey))
		} else {
			let localAdminGroupKey = decryptKey(adminGroupKey, neverNull(oldAdminGroup.adminGroupEncGKey))
			groupKey = decryptKey(localAdminGroupKey, neverNull(group.adminGroupEncGKey))
		}

		let newAdminGroupEncGKey
		if (newAdminGroup._id === adminGroupId) {
			newAdminGroupEncGKey = encryptKey(adminGroupKey, groupKey)
		} else {
			let localAdminGroupKey = decryptKey(adminGroupKey, neverNull(newAdminGroup.adminGroupEncGKey))
			newAdminGroupEncGKey = encryptKey(localAdminGroupKey, groupKey)
		}

		const data = createUpdateAdminshipData({
			group: group._id,
			newAdminGroup: newAdminGroup._id,
			newAdminGroupEncGKey,
		})
		await this.serviceExecutor.post(UpdateAdminshipService, data)
	}

	readUsedUserStorage(user: User): Promise<number> {
		return this.counters.readCounterValue(Const.COUNTER_USED_MEMORY, this._getGroupId(user, GroupType.Mail)).then((mailStorage) => {
			return this.counters.readCounterValue(Const.COUNTER_USED_MEMORY, this._getGroupId(user, GroupType.Contact)).then((contactStorage) => {
				return this.counters.readCounterValue(Const.COUNTER_USED_MEMORY, this._getGroupId(user, GroupType.File)).then((fileStorage) => {
					return Number(mailStorage) + Number(contactStorage) + Number(fileStorage)
				})
			})
		})
	}

	async deleteUser(user: User, restore: boolean): Promise<void> {
		const data = createUserDataDelete({
			user: user._id,
			restore,
			date: Const.CURRENT_DATE,
		})
		await this.serviceExecutor.delete(UserService, data)
	}

	_getGroupId(user: User, groupType: GroupType): Id {
		if (groupType === GroupType.User) {
			return user.userGroup.group
		} else {
			let membership = user.memberships.find((m) => m.groupType === groupType)

			if (!membership) {
				throw new Error("could not find groupType " + groupType + " for user " + user._id)
			}

			return membership.group
		}
	}

	createUser(
		name: string,
		mailAddress: string,
		password: string,
		userIndex: number,
		overallNbrOfUsersToCreate: number,
		operationId: OperationId,
	): Promise<void> {
		let adminGroupIds = this.userFacade.getGroupIds(GroupType.Admin)

		if (adminGroupIds.length === 0) {
			adminGroupIds = this.userFacade.getGroupIds(GroupType.LocalAdmin)
		}

		const adminGroupId = adminGroupIds[0]

		const adminGroupKey = this.userFacade.getGroupKey(adminGroupId)

		let customerGroupKey = this.userFacade.getGroupKey(this.userFacade.getGroupId(GroupType.Customer))

		let userGroupKey = aes128RandomKey()
		let userGroupInfoSessionKey = aes128RandomKey()
		return this.rsa
			.generateKey()
			.then((keyPair) =>
				this.groupManagement.generateInternalGroupData(keyPair, userGroupKey, userGroupInfoSessionKey, adminGroupId, adminGroupKey, customerGroupKey),
			)
			.then((userGroupData) => {
				return this.operationProgressTracker.onProgress(operationId, ((userIndex + 0.8) / overallNbrOfUsersToCreate) * 100).then(() => {
					let data = createUserAccountCreateData()
					data.date = Const.CURRENT_DATE
					data.userGroupData = userGroupData
					data.userData = this.generateUserAccountData(
						userGroupKey,
						userGroupInfoSessionKey,
						customerGroupKey,
						mailAddress,
						password,
						name,
						this.generateRecoveryCode(userGroupKey),
					)
					return this.serviceExecutor.post(UserAccountService, data).then(() => {
						return this.operationProgressTracker.onProgress(operationId, ((userIndex + 1) / overallNbrOfUsersToCreate) * 100)
					})
				})
			})
	}

	generateUserAccountData(
		userGroupKey: Aes128Key,
		userGroupInfoSessionKey: Aes128Key,
		customerGroupKey: Aes128Key,
		mailAddress: string,
		password: string,
		userName: string,
		recoverData: RecoverData,
	): UserAccountUserData {
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
		userData.userEncRecoverCode = recoverData.userEncRecoverCode
		userData.recoverCodeEncUserGroupKey = recoverData.recoverCodeEncUserGroupKey
		userData.recoverCodeVerifier = recoverData.recoveryCodeVerifier
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

	generateRecoveryCode(userGroupKey: Aes128Key): RecoverData {
		const recoveryCode = aes256RandomKey()
		const userEncRecoverCode = encrypt256Key(userGroupKey, recoveryCode)
		const recoverCodeEncUserGroupKey = aes256EncryptKey(recoveryCode, userGroupKey)
		const recoveryCodeVerifier = createAuthVerifier(recoveryCode)
		return {
			userEncRecoverCode,
			recoverCodeEncUserGroupKey,
			hexCode: uint8ArrayToHex(bitArrayToUint8Array(recoveryCode)),
			recoveryCodeVerifier,
		}
	}

	getRecoverCode(password: string): Promise<string> {
		const user = this.userFacade.getLoggedInUser()
		const recoverCodeId = user.auth?.recoverCode
		if (recoverCodeId == null) {
			return Promise.reject(new Error("Auth is missing"))
		}

		const key = generateKeyFromPassphrase(password, assertNotNull(user.salt), KeyLength.b128)
		const extraHeaders = {
			authVerifier: createAuthVerifierAsBase64Url(key),
		}
		return this.entityClient.load(RecoverCodeTypeRef, recoverCodeId, undefined, extraHeaders).then((result) => {
			return uint8ArrayToHex(bitArrayToUint8Array(decrypt256Key(this.userFacade.getUserGroupKey(), result.userEncRecoverCode)))
		})
	}

	createRecoveryCode(password: string): Promise<string> {
		const user = this.userFacade.getUser()

		if (user == null || user.auth == null) {
			throw new Error("Invalid state: no user or no user.auth")
		}

		const { userEncRecoverCode, recoverCodeEncUserGroupKey, hexCode, recoveryCodeVerifier } = this.generateRecoveryCode(this.userFacade.getUserGroupKey())
		const recoverPasswordEntity = createRecoverCode()
		recoverPasswordEntity.userEncRecoverCode = userEncRecoverCode
		recoverPasswordEntity.recoverCodeEncUserGroupKey = recoverCodeEncUserGroupKey
		recoverPasswordEntity._ownerGroup = this.userFacade.getUserGroupId()
		recoverPasswordEntity.verifier = recoveryCodeVerifier
		const pwKey = generateKeyFromPassphrase(password, neverNull(user.salt), KeyLength.b128)
		const authVerifier = createAuthVerifierAsBase64Url(pwKey)
		return this.entityClient
			.setup(null, recoverPasswordEntity, {
				authVerifier,
			})
			.then(() => hexCode)
	}
}
