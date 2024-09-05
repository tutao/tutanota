import { AccountType, Const, CounterType, DEFAULT_KDF_TYPE, GroupType } from "../../../common/TutanotaConstants.js"
import { createMembershipAddData, createResetPasswordPostIn, createUserDataDelete, GroupTypeRef, User } from "../../../entities/sys/TypeRefs.js"
import { getFirstOrThrow, neverNull } from "@tutao/tutanota-utils"
import type { UserAccountUserData } from "../../../entities/tutanota/TypeRefs.js"
import { createUserAccountCreateData, createUserAccountUserData } from "../../../entities/tutanota/TypeRefs.js"
import type { GroupManagementFacade } from "./GroupManagementFacade.js"
import { LoginFacade } from "../LoginFacade.js"
import { CounterFacade } from "./CounterFacade.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { aes256RandomKey, AesKey, createAuthVerifier, encryptKey, generateRandomSalt, random, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { EntityClient } from "../../../common/EntityClient.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { MembershipService, ResetPasswordService, SystemKeysService, UserService } from "../../../entities/sys/Services.js"
import { UserAccountService } from "../../../entities/tutanota/Services.js"
import { UserFacade } from "../UserFacade.js"
import { ExposedOperationProgressTracker, OperationId } from "../../../main/OperationProgressTracker.js"
import { PQFacade } from "../PQFacade.js"
import { freshVersioned } from "@tutao/tutanota-utils/dist/Utils.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { RecoverCodeFacade, RecoverData } from "./RecoverCodeFacade.js"
import { encryptBytes, encryptKeyWithVersionedKey, encryptString, VersionedKey } from "../../crypto/CryptoWrapper.js"

assertWorkerOrNode()

export class UserManagementFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly groupManagement: GroupManagementFacade,
		private readonly counters: CounterFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly operationProgressTracker: ExposedOperationProgressTracker,
		private readonly loginFacade: LoginFacade,
		private readonly pqFacade: PQFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly recoverCodeFacade: RecoverCodeFacade,
	) {}

	async changeUserPassword(user: User, newPassword: string): Promise<void> {
		const userGroupKey = await this.groupManagement.getCurrentGroupKeyViaAdminEncGKey(user.userGroup.group)
		const salt = generateRandomSalt()
		const kdfType = DEFAULT_KDF_TYPE
		const passwordKey = await this.loginFacade.deriveUserPassphraseKey({ kdfType, passphrase: newPassword, salt })
		const pwEncUserGroupKey = encryptKey(passwordKey, userGroupKey.object)
		const passwordVerifier = createAuthVerifier(passwordKey)
		const data = createResetPasswordPostIn({
			user: user._id,
			salt,
			verifier: passwordVerifier,
			pwEncUserGroupKey,
			kdfVersion: kdfType,
			userGroupKeyVersion: String(userGroupKey.version),
		})
		await this.serviceExecutor.post(ResetPasswordService, data)
	}

	async changeAdminFlag(user: User, admin: boolean): Promise<void> {
		const adminGroupId = this.userFacade.getGroupId(GroupType.Admin)
		const userGroup = await this.entityClient.load(GroupTypeRef, user.userGroup.group)
		const userGroupKey = await this.groupManagement.getCurrentGroupKeyViaAdminEncGKey(userGroup._id)

		if (admin) {
			await this.groupManagement.addUserToGroup(user, adminGroupId)

			if (user.accountType !== AccountType.SYSTEM) {
				const keyData = await this._getAccountKeyData()
				const userEncAccountGroupKey = encryptKeyWithVersionedKey(userGroupKey, keyData.accountGroupKey)

				// we can not use addUserToGroup here because the admin is not admin of the account group
				const addAccountGroup = createMembershipAddData({
					user: user._id,
					group: keyData.accountGroup,
					symEncGKey: userEncAccountGroupKey.key,
					symKeyVersion: userEncAccountGroupKey.encryptingKeyVersion.toString(),
					groupKeyVersion: keyData.accountGroupKeyVersion,
				})
				await this.serviceExecutor.post(MembershipService, addAccountGroup)
			}
		} else {
			await this.groupManagement.removeUserFromGroup(user._id, adminGroupId)

			if (user.accountType !== AccountType.SYSTEM) {
				const keyData = await this._getAccountKeyData()
				return this.groupManagement.removeUserFromGroup(user._id, keyData.accountGroup)
			}
		}
	}

	/**
	 * Get key and id of premium group.
	 * @throws Error if account type is not paid
	 *
	 * @private
	 */
	async _getAccountKeyData(): Promise<{ accountGroup: Id; accountGroupKeyVersion: string; accountGroupKey: AesKey }> {
		const keysReturn = await this.serviceExecutor.get(SystemKeysService, null)
		const user = this.userFacade.getLoggedInUser()

		if (user.accountType === AccountType.PAID) {
			return {
				accountGroup: neverNull(keysReturn.premiumGroup),
				accountGroupKey: uint8ArrayToKey(keysReturn.premiumGroupKey),
				accountGroupKeyVersion: keysReturn.premiumGroupKeyVersion,
			}
		} else {
			throw new Error(`Trying to get keyData for user with account type ${user.accountType}`)
		}
	}

	async readUsedUserStorage(user: User): Promise<number> {
		const counterValue = await this.counters.readCounterValue(CounterType.UserStorageLegacy, neverNull(user.customer), user.userGroup.group)
		return Number(counterValue)
	}

	async deleteUser(user: User, restore: boolean): Promise<void> {
		const data = createUserDataDelete({
			user: user._id,
			restore,
			date: Const.CURRENT_DATE,
		})
		await this.serviceExecutor.delete(UserService, data)
	}

	async createUser(
		name: string,
		mailAddress: string,
		password: string,
		userIndex: number,
		overallNbrOfUsersToCreate: number,
		operationId: OperationId,
	): Promise<void> {
		let adminGroupIds = this.userFacade.getGroupIds(GroupType.Admin)
		const adminGroupId = getFirstOrThrow(adminGroupIds)

		const adminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)

		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Customer))

		const userGroupKey = freshVersioned(aes256RandomKey())
		const userGroupInfoSessionKey = aes256RandomKey()
		const keyPair = await this.pqFacade.generateKeyPairs()
		const userGroupData = this.groupManagement.generateInternalGroupData(
			keyPair,
			userGroupKey.object,
			userGroupInfoSessionKey,
			adminGroupId,
			adminGroupKey,
			customerGroupKey,
		)
		await this.operationProgressTracker.onProgress(operationId, ((userIndex + 0.8) / overallNbrOfUsersToCreate) * 100)

		let data = createUserAccountCreateData({
			date: Const.CURRENT_DATE,
			userGroupData: userGroupData,
			userData: await this.generateUserAccountData(
				userGroupKey,
				userGroupInfoSessionKey,
				customerGroupKey,
				mailAddress,
				password,
				name,
				this.recoverCodeFacade.generateRecoveryCode(userGroupKey),
			),
		})
		await this.serviceExecutor.post(UserAccountService, data)
		return this.operationProgressTracker.onProgress(operationId, ((userIndex + 1) / overallNbrOfUsersToCreate) * 100)
	}

	async generateUserAccountData(
		userGroupKey: VersionedKey,
		userGroupInfoSessionKey: AesKey,
		customerGroupKey: VersionedKey,
		mailAddress: string,
		passphrase: string,
		userName: string,
		recoverData: RecoverData,
	): Promise<UserAccountUserData> {
		const kdfType = DEFAULT_KDF_TYPE
		const salt = generateRandomSalt()
		const userPassphraseKey = await this.loginFacade.deriveUserPassphraseKey({ kdfType, passphrase, salt })
		const mailGroupKey = freshVersioned(aes256RandomKey())
		const contactGroupKey = freshVersioned(aes256RandomKey())
		const fileGroupKey = freshVersioned(aes256RandomKey())
		const mailboxSessionKey = aes256RandomKey()
		const contactListSessionKey = aes256RandomKey()
		const fileSystemSessionKey = aes256RandomKey()
		const mailGroupInfoSessionKey = aes256RandomKey()
		const contactGroupInfoSessionKey = aes256RandomKey()
		const fileGroupInfoSessionKey = aes256RandomKey()
		const tutanotaPropertiesSessionKey = aes256RandomKey()

		const userEncCustomerGroupKey = encryptKeyWithVersionedKey(userGroupKey, customerGroupKey.object)
		const userEncMailGroupKey = encryptKeyWithVersionedKey(userGroupKey, mailGroupKey.object)
		const userEncContactGroupKey = encryptKeyWithVersionedKey(userGroupKey, contactGroupKey.object)
		const userEncFileGroupKey = encryptKeyWithVersionedKey(userGroupKey, fileGroupKey.object)
		const userEncTutanotaPropertiesSessionKey = encryptKeyWithVersionedKey(userGroupKey, tutanotaPropertiesSessionKey)
		const userEncEntropy = encryptBytes(userGroupKey.object, random.generateRandomData(32))

		const customerEncMailGroupInfoSessionKey = encryptKeyWithVersionedKey(customerGroupKey, mailGroupInfoSessionKey)
		const customerEncContactGroupInfoSessionKey = encryptKeyWithVersionedKey(customerGroupKey, contactGroupInfoSessionKey)
		const customerEncFileGroupInfoSessionKey = encryptKeyWithVersionedKey(customerGroupKey, fileGroupInfoSessionKey)

		const contactEncContactListSessionKey = encryptKeyWithVersionedKey(contactGroupKey, contactListSessionKey)
		const fileEncFileSystemSessionKey = encryptKeyWithVersionedKey(fileGroupKey, fileSystemSessionKey)
		const mailEncMailBoxSessionKey = encryptKeyWithVersionedKey(mailGroupKey, mailboxSessionKey)

		return createUserAccountUserData({
			mailAddress: mailAddress,
			encryptedName: encryptString(userGroupInfoSessionKey, userName),
			salt: salt,
			kdfVersion: kdfType,

			verifier: createAuthVerifier(userPassphraseKey),
			pwEncUserGroupKey: encryptKey(userPassphraseKey, userGroupKey.object),

			userEncCustomerGroupKey: userEncCustomerGroupKey.key,
			userEncMailGroupKey: userEncMailGroupKey.key,
			userEncContactGroupKey: userEncContactGroupKey.key,
			userEncFileGroupKey: userEncFileGroupKey.key,
			userEncEntropy: userEncEntropy,
			userEncTutanotaPropertiesSessionKey: userEncTutanotaPropertiesSessionKey.key,

			contactEncContactListSessionKey: contactEncContactListSessionKey.key,

			fileEncFileSystemSessionKey: fileEncFileSystemSessionKey.key,

			mailEncMailBoxSessionKey: mailEncMailBoxSessionKey.key,

			customerEncMailGroupInfoSessionKey: customerEncMailGroupInfoSessionKey.key,
			customerEncContactGroupInfoSessionKey: customerEncContactGroupInfoSessionKey.key,
			customerEncFileGroupInfoSessionKey: customerEncFileGroupInfoSessionKey.key,
			customerKeyVersion: customerEncContactGroupInfoSessionKey.encryptingKeyVersion.toString(),

			recoverCodeEncUserGroupKey: recoverData.recoverCodeEncUserGroupKey,
			recoverCodeVerifier: recoverData.recoveryCodeVerifier,
			userEncRecoverCode: recoverData.userEncRecoverCode,
		})
	}
}
