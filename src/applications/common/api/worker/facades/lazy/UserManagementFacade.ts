import { Const, EnvProvider } from "@tutao/app-env"
import { assertNotNull, freshVersioned, getFirstOrThrow, neverNull } from "@tutao/utils"
import type { GroupManagementFacade } from "../../../../../../platform-kit/base/facades/lazy/GroupManagementFacade.js"
import { LoginFacade } from "../../../../../../platform-kit/base/facades/LoginFacade.js"
import { CounterFacade } from "../../../../../../platform-kit/network/CounterFacade.js"
import { AesKey, Bcrypt, createAuthVerifier, CryptoWrapper, KeyEncryption, Randomizer, SymmetricCipherUtils, VersionedKey } from "@tutao/crypto"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient.js"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions.js"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest.js"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade.js"
import { ExposedOperationProgressTracker, OperationId } from "../../../main/OperationProgressTracker.js"
import { PQFacade } from "../../../../../../platform-kit/base/base-crypto/PQFacade.js"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade.js"
import { RecoverCodeFacade, RecoverData } from "../../../../../../platform-kit/base/facades/lazy/RecoverCodeFacade.js"
import { AdminKeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../../../../platform-kit/base/base-crypto/IdentityKeyCreator"
import { CounterType } from "../../../../../../entities/monitor/Utils"
import {
	CompanyEmailSignatureManagementService_DELETE,
	CompanyEmailSignatureManagementService_POST,
	CompanyEmailSignatureService_POST,
	CompanyEmailSignatureService_PUT,
	CompanyEmailSignatureTemplate,
	CompanyEmailSignatureTemplateTypeRef,
	CompanyEmailSignatureTypeRef,
	createCompanyEmailSignatureManagementDeleteIn,
	createCompanyEmailSignatureManagementPostIn,
	createCompanyEmailSignaturePostIn,
	createCompanyEmailSignaturePutIn,
	createCompanyEmailSignatureTemplateTransferAggregatedType,
	createCompanyEmailSignatureTransferAggregatedType,
	createResetPasswordPostIn,
	createUpdateCompanyEmailSignatureTransferAggregatedType,
	createUserDataDelete,
	CustomerInfoTypeRef,
	CustomerTypeRef,
	GroupInfo,
	GroupInfoTypeRef,
	GroupTypeRef,
	ResetPasswordService_POST,
	User,
	UserService_DELETE,
	UserTypeRef,
} from "@tutao/entities/sys"
import { GroupType } from "../../../../../../entities/sys/Utils"
import { createUserAccountCreateData, createUserAccountUserData, UserAccountService_POST, UserAccountUserData } from "@tutao/entities/tutanota"
import { DEFAULT_KDF_TYPE } from "../../../../../../platform-kit/base/base-crypto/Constants"
import { elementIdToId, idToElementId } from "@tutao/meta"

EnvProvider.assertWorkerOrNode()

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
		private readonly random: Randomizer,
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly keyEncryption: KeyEncryption,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly bcrypt: Bcrypt,
		private readonly entityClient: EntityClient,
	) {}

	async changeUserPassword(user: User, newPassword: string): Promise<void> {
		const userGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(user.userGroup.group)
		const salt = this.bcrypt.generateRandomSalt()
		const kdfType = DEFAULT_KDF_TYPE
		const passwordKey = await this.loginFacade.deriveUserPassphraseKey({ kdfType, passphrase: newPassword, salt })
		const pwEncUserGroupKey = this.keyEncryption.encryptKey(passwordKey, userGroupKey.object)
		const passwordVerifier = createAuthVerifier(passwordKey)
		const data = createResetPasswordPostIn({
			user: elementIdToId(user._id),
			salt,
			verifier: passwordVerifier,
			pwEncUserGroupKey,
			kdfVersion: kdfType,
			userGroupKeyVersion: String(userGroupKey.version),
		})
		await this.serviceExecutor.execute(ResetPasswordService_POST, data, null)
	}

	async changeAdminFlag(user: User, admin: boolean): Promise<void> {
		const adminGroupId = this.userFacade.getGroupId(GroupType.Admin)

		if (admin) {
			await this.groupManagement.addUserToGroup(user, adminGroupId)
		} else {
			await this.groupManagement.removeUserFromGroup(elementIdToId(user._id), adminGroupId)
		}
	}

	async readUsedUserStorage(user: User): Promise<number> {
		const counterValue = await this.counters.readCounterValue(CounterType.UserStorageLegacy, neverNull(user.customer), user.userGroup.group)
		return Number(counterValue)
	}

	async deleteUser(user: User, restore: boolean): Promise<void> {
		const data = createUserDataDelete({
			user: elementIdToId(user._id),
			restore,
			date: Const.CURRENT_DATE,
		})
		await this.serviceExecutor.execute(UserService_DELETE, data, null)
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

		const userGroupKey = freshVersioned(this.symmetricCipherUtils.aes256RandomKey())
		const userGroupInfoSessionKey = this.symmetricCipherUtils.aes256RandomKey()
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
		const { userGroup } = await this.serviceExecutor.execute(UserAccountService_POST, data, null)

		await this.createCompanyEmailSignatureForNewUser(userGroup, name, mailAddress)

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

	async createCompanyEmailSignatureTemplate(signatureTemplate: string): Promise<void> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const sessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, sessionKey)
		const postIn = createCompanyEmailSignatureManagementPostIn({
			companyEmailSignatureTemplate: createCompanyEmailSignatureTemplateTransferAggregatedType({
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				signatureTemplate: signatureTemplate,
			}),
		})
		await this.serviceExecutor.execute(CompanyEmailSignatureManagementService_POST, postIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.keyLoaderFacade.assembleServiceEncryptionParamsForPost(customerGroupId)),
		})
		// We create company email signatures per user, and the CompanyEmailSignature instance is encrypted with the user's sk
		for (const userGroupInfo of await this.loadUserGroupInfos()) {
			await this.createCompanyEmailSignatureForUser(userGroupInfo.group, userGroupInfo.name, userGroupInfo.mailAddress ?? "", signatureTemplate)
		}
	}

	async updateCompanyEmailSignatureTemplate(companyEmailSignatureTemplate: CompanyEmailSignatureTemplate, newSignatureTemplate: string): Promise<void> {
		companyEmailSignatureTemplate.signatureTemplate = newSignatureTemplate
		await this.entityClient.update(companyEmailSignatureTemplate)

		for (const userGroupInfo of await this.loadUserGroupInfos()) {
			const user = await this.loadUserOfGroup(userGroupInfo.group)
			if (user.companyEmailSignature == null) {
				await this.createCompanyEmailSignatureForUser(userGroupInfo.group, userGroupInfo.name, userGroupInfo.mailAddress ?? "", newSignatureTemplate)
			} else {
				await this.updateCompanyEmailSignatureForUser(userGroupInfo.group, user.companyEmailSignature, newSignatureTemplate)
			}
		}
	}

	async deleteCompanyEmailSignatureTemplate(): Promise<void> {
		// the payload is empty, because we load the userGroupInfos and users on the server, see SystemApplication
		await this.serviceExecutor.execute(CompanyEmailSignatureManagementService_DELETE, createCompanyEmailSignatureManagementDeleteIn({}), null)
	}

	private async createCompanyEmailSignatureForNewUser(userGroupId: Id, name: string, mailAddress: string): Promise<void> {
		try {
			const customer = await this.entityClient.load(CustomerTypeRef, idToElementId(assertNotNull(this.userFacade.getLoggedInUser().customer)))
			const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			if (customerInfo.companyEmailSignatureTemplate == null) {
				return
			}
			const companyEmailSignatureTemplate = await this.entityClient.load(
				CompanyEmailSignatureTemplateTypeRef,
				idToElementId(customerInfo.companyEmailSignatureTemplate),
			)
			await this.createCompanyEmailSignatureForUser(userGroupId, name, mailAddress, companyEmailSignatureTemplate.signatureTemplate)
		} catch (e) {
			console.warn("could not create company signature template for new user", e)
		}
	}

	private async loadUserOfGroup(userGroupId: Id): Promise<User> {
		const group = await this.entityClient.load(GroupTypeRef, idToElementId(userGroupId))
		return await this.entityClient.load(UserTypeRef, idToElementId(assertNotNull(group.user, "user group without user")))
	}

	private async loadUserGroupInfos(): Promise<GroupInfo[]> {
		const customer = await this.entityClient.load(CustomerTypeRef, idToElementId(assertNotNull(this.userFacade.getLoggedInUser().customer)))
		return await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
	}

	private async createCompanyEmailSignatureForUser(userGroupId: Id, name: string, email: string, signatureTemplate: string): Promise<void> {
		const userGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(userGroupId)
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, this.symmetricCipherUtils.aes256RandomKey())
		const postIn = createCompanyEmailSignaturePostIn({
			userGroup: userGroupId,
			companyEmailSignature: createCompanyEmailSignatureTransferAggregatedType({
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				name,
				email,
				signatureTemplate,
			}),
		})
		await this.serviceExecutor.execute(CompanyEmailSignatureService_POST, postIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.adminKeyLoaderFacade.assembleServiceEncryptionParamsForPost(userGroupId, null)),
		})
	}

	private async updateCompanyEmailSignatureForUser(userGroupId: Id, companyEmailSignatureId: Id, signatureTemplate: string): Promise<void> {
		const companyEmailSignature = await this.entityClient.load(CompanyEmailSignatureTypeRef, idToElementId(companyEmailSignatureId))
		const kdfNonce = await this.entityClient.ensureKdfNonce(companyEmailSignature)
		const putIn = createCompanyEmailSignaturePutIn({
			userGroup: userGroupId,
			companyEmailSignature: companyEmailSignatureId,
			companyEmailSignatureWithNewTemplate: createUpdateCompanyEmailSignatureTransferAggregatedType({
				_ownerEncSessionKey: companyEmailSignature._ownerEncSessionKey,
				_ownerKeyVersion: companyEmailSignature._ownerKeyVersion,
				_kdfNonce: kdfNonce,
				signatureTemplate,
			}),
		})
		await this.serviceExecutor.execute(CompanyEmailSignatureService_PUT, putIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.adminKeyLoaderFacade.assembleServiceEncryptionParamsForPut(userGroupId, null, companyEmailSignature)),
		})
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
		const salt = this.bcrypt.generateRandomSalt()
		const userPassphraseKey = await this.loginFacade.deriveUserPassphraseKey({ kdfType, passphrase, salt })
		const mailGroupKey = freshVersioned(this.symmetricCipherUtils.aes256RandomKey())
		const contactGroupKey = freshVersioned(this.symmetricCipherUtils.aes256RandomKey())
		const fileGroupKey = freshVersioned(this.symmetricCipherUtils.aes256RandomKey())
		const mailboxSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const contactListSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const fileSystemSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const mailGroupInfoSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const contactGroupInfoSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const fileGroupInfoSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const tutanotaPropertiesSessionKey = this.symmetricCipherUtils.aes256RandomKey()

		const userEncCustomerGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, customerGroupKey.object)
		const userEncMailGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, mailGroupKey.object)
		const userEncContactGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, contactGroupKey.object)
		const userEncFileGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, fileGroupKey.object)
		const userEncTutanotaPropertiesSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, tutanotaPropertiesSessionKey)
		const userEncEntropy = this.cryptoWrapper.encryptBytes(userGroupKey.object, this.random.generateRandomData(32))

		const customerEncMailGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, mailGroupInfoSessionKey)
		const customerEncContactGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, contactGroupInfoSessionKey)
		const customerEncFileGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, fileGroupInfoSessionKey)

		const contactEncContactListSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(contactGroupKey, contactListSessionKey)
		const fileEncFileSystemSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(fileGroupKey, fileSystemSessionKey)
		const mailEncMailBoxSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, mailboxSessionKey)

		return createUserAccountUserData({
			mailAddress: mailAddress,
			encryptedName: this.cryptoWrapper.encryptString(userGroupInfoSessionKey, userName),
			salt: salt,
			kdfVersion: kdfType,

			verifier: createAuthVerifier(userPassphraseKey),
			pwEncUserGroupKey: this.keyEncryption.encryptKey(userPassphraseKey, userGroupKey.object),

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
