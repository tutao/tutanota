import { Const, CounterType, DEFAULT_KDF_TYPE, GroupType } from "../../../common/TutanotaConstants.js"
import { createResetPasswordPostIn, createUserDataDelete, User } from "../../../entities/sys/TypeRefs.js"
import { getFirstOrThrow, neverNull } from "@tutao/tutanota-utils"
import type { UserAccountUserData } from "../../../entities/tutanota/TypeRefs.js"
import { createUserAccountCreateData, createUserAccountUserData } from "../../../entities/tutanota/TypeRefs.js"
import type { GroupManagementFacade } from "./GroupManagementFacade.js"
import { LoginFacade } from "../LoginFacade.js"
import { CounterFacade } from "./CounterFacade.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { aes256RandomKey, AesKey, createAuthVerifier, encryptKey, generateRandomSalt, random } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { ResetPasswordService, UserService } from "../../../entities/sys/Services.js"
import { UserAccountService } from "../../../entities/tutanota/Services.js"
import { UserFacade } from "../UserFacade.js"
import { ExposedOperationProgressTracker, OperationId } from "../../../main/OperationProgressTracker.js"
import { PQFacade } from "../PQFacade.js"
import { freshVersioned } from "@tutao/tutanota-utils"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { RecoverCodeFacade, RecoverData } from "./RecoverCodeFacade.js"
import { _encryptBytes, _encryptKeyWithVersionedKey, _encryptString, VersionedKey } from "../../crypto/CryptoWrapper.js"
import { AdminKeyLoaderFacade } from "../AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "./IdentityKeyCreator"

assertWorkerOrNode()

export class UserManagementFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly groupManagement: GroupManagementFacade,
		private readonly counters: CounterFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly operationProgressTracker: ExposedOperationProgressTracker,
		private readonly loginFacade: LoginFacade,
		private readonly pqFacade: PQFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly recoverCodeFacade: RecoverCodeFacade,
		private readonly adminKeyLoaderFacade: AdminKeyLoaderFacade,
		private readonly identityKeyCreator: IdentityKeyCreator,
	) {}

	async changeUserPassword(user: User, newPassword: string): Promise<void> {
		const userGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(user.userGroup.group)
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

		if (admin) {
			await this.groupManagement.addUserToGroup(user, adminGroupId)
		} else {
			await this.groupManagement.removeUserFromGroup(user._id, adminGroupId)
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
		const { userGroup } = await this.serviceExecutor.post(UserAccountService, data)

		await this.identityKeyCreator.createIdentityKeyPair(
			userGroup,
			{
				object: keyPair,
				version: 0, // new group
			},
			[],
		)

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

		const userEncCustomerGroupKey = _encryptKeyWithVersionedKey(userGroupKey, customerGroupKey.object)
		const userEncMailGroupKey = _encryptKeyWithVersionedKey(userGroupKey, mailGroupKey.object)
		const userEncContactGroupKey = _encryptKeyWithVersionedKey(userGroupKey, contactGroupKey.object)
		const userEncFileGroupKey = _encryptKeyWithVersionedKey(userGroupKey, fileGroupKey.object)
		const userEncTutanotaPropertiesSessionKey = _encryptKeyWithVersionedKey(userGroupKey, tutanotaPropertiesSessionKey)
		const userEncEntropy = _encryptBytes(userGroupKey.object, random.generateRandomData(32))

		const customerEncMailGroupInfoSessionKey = _encryptKeyWithVersionedKey(customerGroupKey, mailGroupInfoSessionKey)
		const customerEncContactGroupInfoSessionKey = _encryptKeyWithVersionedKey(customerGroupKey, contactGroupInfoSessionKey)
		const customerEncFileGroupInfoSessionKey = _encryptKeyWithVersionedKey(customerGroupKey, fileGroupInfoSessionKey)

		const contactEncContactListSessionKey = _encryptKeyWithVersionedKey(contactGroupKey, contactListSessionKey)
		const fileEncFileSystemSessionKey = _encryptKeyWithVersionedKey(fileGroupKey, fileSystemSessionKey)
		const mailEncMailBoxSessionKey = _encryptKeyWithVersionedKey(mailGroupKey, mailboxSessionKey)

		return createUserAccountUserData({
			mailAddress: mailAddress,
			encryptedName: _encryptString(userGroupInfoSessionKey, userName),
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
