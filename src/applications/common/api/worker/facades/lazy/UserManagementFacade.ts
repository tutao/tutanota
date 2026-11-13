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
	CompanySignature,
	CompanySignatureManagementService_DELETE,
	CompanySignatureManagementService_POST,
	CompanySignatureTypeRef,
	createCompanySignatureManagementDeleteIn,
	createCompanySignatureManagementPostIn,
	createCompanySignatureTransferAggregatedType,
	createResetPasswordPostIn,
	createUserDataDelete,
	CustomerInfoTypeRef,
	CustomerTypeRef,
	GroupInfo,
	GroupInfoTypeRef,
	GroupTypeRef,
	ResetPasswordService_POST,
	User,
	UserService_DELETE,
} from "@tutao/entities/sys"
import { GroupType } from "../../../../../../entities/sys/Utils"
import {
	CompanySignatureService_POST,
	CompanySignatureService_PUT,
	CompanySignatureTemplateTypeRef,
	createCompanySignaturePostIn,
	createCompanySignaturePutIn,
	createCompanySignatureTemplateTransferAggregatedType,
	createUpdateCompanySignatureTemplateTransferAggregatedType,
	createUserAccountCreateData,
	createUserAccountUserData,
	TutanotaPropertiesTypeRef,
	UserAccountService_POST,
	UserAccountUserData,
} from "@tutao/entities/tutanota"
import { DEFAULT_KDF_TYPE } from "../../../../../../platform-kit/base/base-crypto/Constants"
import { elementIdToId, idToElementId } from "@tutao/meta"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"

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

		await this.createCompanySignatureTemplateForNewUser(userGroup, name, mailAddress)

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

	async createCompanySignature(signatureTemplate: string): Promise<void> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const sessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, sessionKey)
		const postIn = createCompanySignatureManagementPostIn({
			companySignature: createCompanySignatureTransferAggregatedType({
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				companySignature: signatureTemplate,
			}),
		})
		await this.serviceExecutor.execute(CompanySignatureManagementService_POST, postIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.keyLoaderFacade.assembleServiceEncryptionParamsForPost(customerGroupId)),
		})

		for (const userGroupInfo of await this.loadUserGroupInfos()) {
			await this.createCompanySignatureTemplateForUser(userGroupInfo.group, userGroupInfo.name, userGroupInfo.mailAddress ?? "", signatureTemplate)
		}
	}

	async updateCompanySignature(companySignature: CompanySignature, signatureTemplate: string): Promise<void> {
		companySignature.companySignature = signatureTemplate
		await this.entityClient.update(companySignature)

		for (const userGroupInfo of await this.loadUserGroupInfos()) {
			const props = await this.entityClient.loadRoot(TutanotaPropertiesTypeRef, userGroupInfo.group)
			if (props.companySignatureTemplate == null) {
				await this.createCompanySignatureTemplateForUser(userGroupInfo.group, userGroupInfo.name, userGroupInfo.mailAddress ?? "", signatureTemplate)
			} else {
				await this.updateCompanySignatureTemplateForUser(userGroupInfo.group, props.companySignatureTemplate, signatureTemplate)
			}
		}
	}

	async deleteCompanySignature(): Promise<void> {
		await this.serviceExecutor.execute(CompanySignatureManagementService_DELETE, createCompanySignatureManagementDeleteIn({}), null)
	}

	private async createCompanySignatureTemplateForNewUser(userGroupId: Id, name: string, mailAddress: string): Promise<void> {
		try {
			const customer = await this.entityClient.load(CustomerTypeRef, idToElementId(assertNotNull(this.userFacade.getLoggedInUser().customer)))
			const customerInfo = await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
			if (customerInfo.companySignature == null) {
				return
			}
			const companySignature = await this.entityClient.load(CompanySignatureTypeRef, idToElementId(customerInfo.companySignature))
			await this.createCompanySignatureTemplateForUser(userGroupId, name, mailAddress, companySignature.companySignature)
		} catch (e) {
			console.warn("could not create company signature template for new user", e)
		}
	}

	private async loadUserGroupInfos(): Promise<GroupInfo[]> {
		const customer = await this.entityClient.load(CustomerTypeRef, idToElementId(assertNotNull(this.userFacade.getLoggedInUser().customer)))
		return await this.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups) // fixme should we filter by active, but then restored users won't have the signature
	}

	private async getUserId(userGroupId: Id): Promise<Id> {
		const group = await this.entityClient.load(GroupTypeRef, idToElementId(userGroupId))
		return assertNotNull(group.user, "user group without user")
	}

	private async createCompanySignatureTemplateForUser(userGroupId: Id, name: string, email: string, signatureTemplate: string): Promise<void> {
		const userGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(userGroupId)
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, this.symmetricCipherUtils.aes256RandomKey())
		const postIn = createCompanySignaturePostIn({
			user: await this.getUserId(userGroupId),
			companySignatureTemplate: createCompanySignatureTemplateTransferAggregatedType({
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				name,
				email,
				signatureTemplate,
			}),
		})
		await this.serviceExecutor.execute(CompanySignatureService_POST, postIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.adminKeyLoaderFacade.assembleServiceEncryptionParamsForPost(userGroupId, null)),
		})
	}

	private async updateCompanySignatureTemplateForUser(userGroupId: Id, companySignatureTemplateId: Id, signatureTemplate: string): Promise<void> {
		const companySignatureTemplate = await this.entityClient.load(CompanySignatureTemplateTypeRef, idToElementId(companySignatureTemplateId))
		const putIn = createCompanySignaturePutIn({
			user: await this.getUserId(userGroupId),
			companySignatureTemplate: companySignatureTemplateId,
			companySignatureWithNewTemplate: createUpdateCompanySignatureTemplateTransferAggregatedType({
				_ownerEncSessionKey: companySignatureTemplate._ownerEncSessionKey,
				_ownerKeyVersion: companySignatureTemplate._ownerKeyVersion,
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				signatureTemplate,
			}),
		})
		const ownerKeyVersion = parseKeyVersion(assertNotNull(companySignatureTemplate._ownerKeyVersion))
		const userGroupKey = await this.adminKeyLoaderFacade.getGroupKeyViaAdminEncGKey(userGroupId, ownerKeyVersion)
		const sessionKey = this.cryptoWrapper.decryptKey(userGroupKey, assertNotNull(companySignatureTemplate._ownerEncSessionKey))
		await this.serviceExecutor.execute(CompanySignatureService_PUT, putIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey,
			...(await this.adminKeyLoaderFacade.assembleServiceEncryptionParamsForPut(userGroupId, null, companySignatureTemplate)),
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
