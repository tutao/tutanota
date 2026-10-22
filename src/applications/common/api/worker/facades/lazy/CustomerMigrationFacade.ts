import { AdminKeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { CryptoWrapper, SymmetricCipherUtils } from "@tutao/crypto"
import { MailboxMigrationProvider } from "../../../common/utils/migrationImportUtils/MigrationKnownConfigs"
import { GroupType } from "../../../../../../entities/sys/Utils"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import {
	CacheMode,
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	DEFAULT_EXTRA_SERVICE_PARAMS,
} from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import {
	createCustomerMigrationDeleteIn,
	createCustomerMigrationImapConfigurationTransferAggregatedType,
	createCustomerMigrationInfoTransferAggregatedType,
	createCustomerMigrationPostIn,
	createCustomerUserMigrationInfoTransferAggregatedType,
	createCustomerUserMigrationPostIn,
	createMultiuserUserMigrationPostIn,
	createOAuthTokenTransferAggregatedType,
	createUserMigrationCredentialTransferAggregatedType,
	createUserMigrationInfoTransferAggregatedType,
	CustomerMigrationImapConfiguration,
	CustomerMigrationInfo,
	CustomerMigrationService_DELETE,
	CustomerMigrationService_POST,
	CustomerUserMigrationInfo,
	CustomerUserMigrationService_POST,
	MailboxMigrationInfo,
	MultiuserUserMigrationService_POST,
	OAuthToken,
	UserMigrationInfoTypeRef,
	UserTypeRef,
} from "@tutao/entities/sys"
import { UserListProvider } from "../../../../../../entities/tutanota/Utils"
import { assertNotNull, getFirstOrThrow, KeyVersion } from "@tutao/utils"
import { idToElementId, isSameId } from "@tutao/meta"
import {
	createMailboxMigrationImapConfigurationTransferAggregatedType,
	createMailboxMigrationSyncStateTransferAggregatedType,
	createMultiuserMailboxMigrationPostIn,
	createMultiuserMailboxMigrationUserData,
	MailboxMigrationSyncStateTypeRef,
	MultiuserMailboxMigrationService_POST,
} from "@tutao/entities/tutanota"

export type UserMigrationCredentialInput = {
	username: string
	password: string | null
	oAuthToken: OAuthToken | null
}

export type CustomerMailboxMigrationUser = {
	userId: Id
	customerUserMigrationInfo: IdTuple
	userMigrationInfo: IdTuple
}

export type CreateCustomerUserMigrationInfoParams = {
	userId: Id
	userGroupId: Id
	tutaName: string
	tutaMailAddress: string
	initialPassword: string | null
	credential: UserMigrationCredentialInput
	provider: MailboxMigrationProvider
	customerMigrationInfo: IdTuple
}

export type ScheduleMailboxMigrationParams = {
	mailGroupId: Id
	provider: MailboxMigrationProvider
	host?: string
	port?: string
	useSSL?: boolean
	ignoreCertificateErrors?: boolean
	customCertificateData?: Uint8Array<ArrayBuffer> | null
	isShared: boolean
	sharedMailboxSourceAddress: string | null
	customerMigrationInfo: IdTuple
}

export class CustomerMigrationFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly adminKeyLoader: AdminKeyLoaderFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
	) {}

	/**
	 * Creates the customer-wide record that groups together the individual mailbox migrations
	 * scheduled for a single admin-driven multi-user migration run.
	 * @returns the IdTuple to pass as `customerMigrationInformation` to each mailbox scheduled in this batch.
	 */
	async createCustomerMigrationInformation(
		imapConfiguration: CustomerMigrationImapConfiguration | null,
		provider: MailboxMigrationProvider,
	): Promise<IdTuple> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const sessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, sessionKey)
		const data = createCustomerMigrationPostIn({
			customerMigrationInfo: createCustomerMigrationInfoTransferAggregatedType({
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				provider: provider.toString(),
				userListProvider: UserListProvider.CSV.toString(),
				userListAdminCredentials: null, // fixme this is non-null only when the userList is provided by non-CSV
				imapConfiguration:
					imapConfiguration &&
					createCustomerMigrationImapConfigurationTransferAggregatedType({
						host: imapConfiguration.host,
						port: imapConfiguration.port,
						ignoreCertificateErrors: imapConfiguration.ignoreCertificateErrors,
						customCertificateData: imapConfiguration.customCertificateData,
						useSSL: imapConfiguration.useSSL,
						adminCredentials: createUserMigrationCredentialTransferAggregatedType({
							username: imapConfiguration.adminCredentials.username,
							password: imapConfiguration.adminCredentials.password,
							oAuthToken:
								imapConfiguration.adminCredentials.oAuthToken &&
								createOAuthTokenTransferAggregatedType({
									accessToken: imapConfiguration.adminCredentials.oAuthToken.accessToken,
									refreshToken: imapConfiguration.adminCredentials.oAuthToken.refreshToken,
									expiresIn: imapConfiguration.adminCredentials.oAuthToken.expiresIn,
									tokenType: imapConfiguration.adminCredentials.oAuthToken.tokenType,
								}),
						}),
					}),
			}),
		})

		const postOut = await this.serviceExecutor.execute(CustomerMigrationService_POST, data, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.keyLoaderFacade.assembleServiceEncryptionParamsForPost(customerGroupId)),
		})
		return postOut.customerMigrationInfo
	}

	async cancelMigration(customerMigrationInfo: IdTuple): Promise<void> {
		await this.serviceExecutor.execute(CustomerMigrationService_DELETE, createCustomerMigrationDeleteIn({ customerMigrationInfo }), null)
	}

	async createCustomerUserMigrationInfo(params: CreateCustomerUserMigrationInfoParams): Promise<CustomerMailboxMigrationUser> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const customerUserMigrationInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncCustomerUserMigrationInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, customerUserMigrationInfoSessionKey)

		const customerUserMigrationPostIn = createCustomerUserMigrationPostIn({
			customerUserMigrationInfo: createCustomerUserMigrationInfoTransferAggregatedType({
				_ownerEncSessionKey: ownerEncCustomerUserMigrationInfoSessionKey.key,
				_ownerKeyVersion: ownerEncCustomerUserMigrationInfoSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				tutaName: params.tutaName,
				tutaMailAddress: params.tutaMailAddress,
				initialPassword: params.initialPassword,
			}),
			user: params.userId,
			customerMigrationInfo: params.customerMigrationInfo,
		})

		const customerUserMigrationPostOut = await this.serviceExecutor.execute(CustomerUserMigrationService_POST, customerUserMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.keyLoaderFacade.assembleServiceEncryptionParamsForPost(customerGroupId)),
		})

		const userGroupKey = await this.adminKeyLoader.getCurrentGroupKeyViaAdminEncGKey(params.userGroupId)
		const userMigrationInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncUserMigrationInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, userMigrationInfoSessionKey)
		const userMigrationCredential = createUserMigrationCredentialTransferAggregatedType({
			username: params.credential.username,
			password: params.credential.password,
			oAuthToken:
				params.credential.oAuthToken &&
				createOAuthTokenTransferAggregatedType({
					accessToken: params.credential.oAuthToken.accessToken,
					refreshToken: params.credential.oAuthToken.refreshToken,
					expiresIn: params.credential.oAuthToken.expiresIn,
					tokenType: params.credential.oAuthToken.tokenType,
				}),
		})
		const multiuserUserMigrationPostIn = createMultiuserUserMigrationPostIn({
			userMigrationInfo: createUserMigrationInfoTransferAggregatedType({
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				_ownerEncSessionKey: ownerEncUserMigrationInfoSessionKey.key,
				_ownerKeyVersion: ownerEncUserMigrationInfoSessionKey.encryptingKeyVersion.toString(),
				provider: params.provider.toString(),
				credential: userMigrationCredential,
			}),
			user: params.userId,
			customerMigrationInfo: params.customerMigrationInfo,
		})
		const multiuserUserMigrationPostOut = await this.serviceExecutor.execute(MultiuserUserMigrationService_POST, multiuserUserMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.adminKeyLoader.assembleServiceEncryptionParamsForPost(params.userGroupId, null)),
		})
		return {
			userId: params.userId,
			customerUserMigrationInfo: customerUserMigrationPostOut.customerUserMigrationInfo,
			userMigrationInfo: multiuserUserMigrationPostOut.userMigrationInfo,
		}
	}

	async scheduleMailboxMigration(params: ScheduleMailboxMigrationParams, users: ReadonlyArray<CustomerMailboxMigrationUser>): Promise<void> {
		const userId = getFirstOrThrow(users).userId
		await this.entityClient.load(UserTypeRef, idToElementId(userId), { ...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS, cacheMode: CacheMode.WriteOnly })
		const mailGroupKey = params.isShared
			? await this.adminKeyLoader.getCurrentGroupKeyViaAdminEncGKey(params.mailGroupId)
			: await this.adminKeyLoader.getCurrentGroupKeyViaUser(params.mailGroupId, userId)
		const mailboxMigrationSyncStateSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, mailboxMigrationSyncStateSessionKey)

		const imapConfiguration =
			params.provider === MailboxMigrationProvider.Other
				? createMailboxMigrationImapConfigurationTransferAggregatedType({
						host: params.host ?? "",
						port: params.port ?? "",
						sharedUsername: params.sharedMailboxSourceAddress,
						sharedPassword: null,
						ignoreCertificateErrors: params.ignoreCertificateErrors ?? false,
						customCertificateData: params.customCertificateData ?? null,
						useSSL: params.useSSL ?? true,
						legacyOauthToken: null,
					})
				: null

		const data = createMultiuserMailboxMigrationPostIn({
			mailboxMigrationSyncState: createMailboxMigrationSyncStateTransferAggregatedType({
				_ownerGroup: params.mailGroupId,
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				postponedUntil: Date.now().toString(),
				legacyProvider: null,
				imapConfiguration: imapConfiguration,
				rootImportMailSet: null,
				syncLabel: null,
				sharedMailboxName: params.sharedMailboxSourceAddress,
			}),
			isShared: params.isShared,
			customerMigrationInfo: params.customerMigrationInfo,
			multiuserMailboxMigrationUserData: users.map((user) =>
				createMultiuserMailboxMigrationUserData({
					customerUserMigrationInfo: user.customerUserMigrationInfo,
					userMigrationInfo: user.userMigrationInfo,
				}),
			),
		})

		await this.serviceExecutor.execute(MultiuserMailboxMigrationService_POST, data, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.adminKeyLoader.assembleServiceEncryptionParamsForPost(params.mailGroupId, !params.isShared ? userId : null)),
		})
	}

	async getSourceMailAddressForSharedMailbox(mailboxMigrationInfo: MailboxMigrationInfo) {
		const mailGroupKeyProvider = async (version: KeyVersion) =>
			await this.adminKeyLoader.getGroupKeyViaAdminEncGKey(mailboxMigrationInfo.mailGroup, version)
		const mailboxMigrationSyncState = await this.entityClient.load(
			MailboxMigrationSyncStateTypeRef,
			[mailboxMigrationInfo.mailboxMigrationSyncState.listId, mailboxMigrationInfo.mailboxMigrationSyncState.listElementId],
			{
				...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
				ownerKeyProvider: mailGroupKeyProvider,
			},
		)
		return mailboxMigrationSyncState.sharedMailboxName
	}

	async getSourceMailAddressForUserMailbox(customerUserMigrationInfo: CustomerUserMigrationInfo, customerMigrationInfo: CustomerMigrationInfo) {
		const user = await this.entityClient.load(UserTypeRef, idToElementId(customerUserMigrationInfo.user))
		const userGroupKeyProvider = async (version: KeyVersion) =>
			await this.adminKeyLoader.getGroupKeyViaAdminEncGKey(assertNotNull(user._ownerGroup), version)
		const userMigrationInfos = await this.entityClient.loadAll(UserMigrationInfoTypeRef, assertNotNull(user.userMigrationInfos), null, {
			...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
			ownerKeyProvider: userGroupKeyProvider,
		})
		return (
			userMigrationInfos.find(
				(userMigrationInfo) => userMigrationInfo.customerMigrationInfo && isSameId(userMigrationInfo.customerMigrationInfo, customerMigrationInfo._id),
			)?.credential.username ?? ""
		)
	}
}
