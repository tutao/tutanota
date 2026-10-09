import { elementIdToId } from "@tutao/meta"
import { AdminKeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { MailFacade } from "./MailFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { CryptoWrapper } from "@tutao/crypto"
import {
	createCustomerMailboxMigrationPostIn,
	createMailboxMigrationImapConfiguration,
	createOAuthTokenEndpointResponseLegacy,
	CustomerMailboxMigrationService_POST,
} from "@tutao/entities/tutanota"
import { MailboxMigrationProvider } from "../../../common/utils/migrationImportUtils/MigrationKnownConfigs"
import { GroupType } from "../../../../../../entities/sys/Utils"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import {
	createCustomerMigrationDeleteIn,
	createCustomerMigrationPostIn,
	createCustomerUserMigrationPostIn,
	createUserMigrationCredential,
	CustomerMigrationImapConfiguration,
	CustomerMigrationService_DELETE,
	CustomerMigrationService_POST,
	CustomerUserMigrationService_POST,
	OAuthToken,
} from "@tutao/entities/sys"

export type UserMigrationCredentialInput = {
	username: string
	password: string | null
	oAuthToken: OAuthToken | null
}

export type MailboxMigrationInitializationParameters = {
	mailGroupId: Id
	tutaName: string
	tutaMailAddress: string
	initialPassword: string | null
	credential: UserMigrationCredentialInput
	provider: MailboxMigrationProvider
	host: string
	port: string
	useSSL: boolean
	ignoreCertificateErrors: boolean
	customCertificateData: Uint8Array<ArrayBuffer> | null
	/** null for a shared mailbox row, the target Tuta user's id otherwise. */
	userId: Id | null
	/** The target user's own user group - required when `userId` is set. */
	userGroupId: Id | null
	customerMigrationInformation: IdTuple
}

export class CustomerMigrationFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly userFacade: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly adminKeyLoader: AdminKeyLoaderFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	/**
	 * Creates the customer-wide record that groups together the individual mailbox migrations
	 * scheduled for a single admin-driven multi-user migration run.
	 * @returns the IdTuple to pass as `customerMigrationInformation` to each mailbox scheduled in this batch.
	 */
	async createCustomerMigrationInformation(imapConfiguration: CustomerMigrationImapConfiguration): Promise<IdTuple> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const sessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, sessionKey)
		const data = createCustomerMigrationPostIn({
			userListProvider: "0",
			userListAdminCredentials: null,
			imapConfiguration,
		})
		data.ownerEncSessionKey = ownerEncSessionKey.key
		data.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
		const postOut = await this.serviceExecutor.execute(CustomerMigrationService_POST, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
		return postOut.customerMigrationInfo
	}

	/** Cancels an admin-driven multi-user migration batch. */
	async cancelMigration(customerMigrationInfo: IdTuple): Promise<void> {
		await this.serviceExecutor.execute(CustomerMigrationService_DELETE, createCustomerMigrationDeleteIn({ customerMigrationInfo }), null)
	}

	/**
	 * Schedules a single mailbox migration within an already-created admin batch. This is a two-step process:
	 * first the admin-visible identity/credential record (`CustomerUserMigrationInformation`) is created, then
	 * the actual sync state (`MailboxMigrationInformation`/`MailboxMigrationSyncState`) referencing it.
	 */
	async scheduleMailboxMigration(params: MailboxMigrationInitializationParameters): Promise<void> {
		const customerUserMigrationInformation = await this.createCustomerUserMigrationInformation(params)
		await this.createMailboxMigration(params, customerUserMigrationInformation)
	}

	private async createCustomerUserMigrationInformation(params: MailboxMigrationInitializationParameters): Promise<IdTuple> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const customerUserMigrationInformationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncCustomerUserMigrationInformationSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(
			customerGroupKey,
			customerUserMigrationInformationSessionKey,
		)

		const targetUserId = params.userId ?? elementIdToId(this.userFacade.getLoggedInUser()._id)
		const userGroupKey =
			params.userId !== null
				? await this.adminKeyLoader.getCurrentGroupKeyViaAdminEncGKey(params.userGroupId!)
				: this.keyLoaderFacade.getCurrentSymUserGroupKey()
		const userMigrationInformationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncUserMigrationInformationSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, userMigrationInformationSessionKey)

		const data = createCustomerUserMigrationPostIn({
			ownerEncCustomerUserMigrationInformationSessionKey: ownerEncCustomerUserMigrationInformationSessionKey.key,
			ownerCustomerUserMigrationInformationKeyVersion: ownerEncCustomerUserMigrationInformationSessionKey.encryptingKeyVersion.toString(),
			encTutaName: this.cryptoWrapper.encryptString(customerUserMigrationInformationSessionKey, params.tutaName),
			encTutaMailAddress: this.cryptoWrapper.encryptString(customerUserMigrationInformationSessionKey, params.tutaMailAddress),
			encTutaInitialPassword:
				params.initialPassword !== null ? this.cryptoWrapper.encryptString(customerUserMigrationInformationSessionKey, params.initialPassword) : null,
			ownerEncUserMigrationInformationSessionKey: ownerEncUserMigrationInformationSessionKey.key,
			ownerUserMigrationInformationKeyVersion: ownerEncUserMigrationInformationSessionKey.encryptingKeyVersion.toString(),
			provider: params.provider.toString(),
			credential: createUserMigrationCredential({
				username: params.credential.username,
				password: params.credential.password,
				oAuthToken: params.credential.oAuthToken,
			}),
			user: targetUserId,
			customerMigrationInformation: params.customerMigrationInformation,
		})

		const postOut = await this.serviceExecutor.execute(CustomerUserMigrationService_POST, data, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: customerUserMigrationInformationSessionKey,
		})
		return postOut.customerUserMigrationInformation
	}

	private async createMailboxMigration(params: MailboxMigrationInitializationParameters, customerUserMigrationInformation: IdTuple): Promise<void> {
		const mailGroupKey =
			params.userId !== null
				? await this.adminKeyLoader.getCurrentGroupKeyViaUser(params.mailGroupId, params.userId)
				: await this.adminKeyLoader.getCurrentGroupKeyViaAdminEncGKey(params.mailGroupId)
		const mailboxMigrationSyncStateSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncMailboxMigrationSyncStateSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, mailboxMigrationSyncStateSessionKey)

		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Customer))
		const mailboxMigrationInformationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncMailboxMigrationInformationSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(
			customerGroupKey,
			mailboxMigrationInformationSessionKey,
		)

		const imapConfiguration = createMailboxMigrationImapConfiguration({
			host: params.host,
			port: params.port,
			sharedUsername: params.credential.username,
			sharedPassword: params.credential.password,
			ignoreCertificateErrors: params.ignoreCertificateErrors,
			customCertificateData: params.customCertificateData,
			useSSL: params.useSSL,
			sharedOauthToken: params.credential.oAuthToken
				? createOAuthTokenEndpointResponseLegacy({
						accessToken: params.credential.oAuthToken.accessToken,
						refreshToken: params.credential.oAuthToken.refreshToken,
						expiresIn: params.credential.oAuthToken.expiresIn,
						tokenType: params.credential.oAuthToken.tokenType,
					})
				: null,
		})

		const data = createCustomerMailboxMigrationPostIn({
			mailGroup: params.mailGroupId,
			ownerEncMailboxMigrationSyncStateSessionKey: ownerEncMailboxMigrationSyncStateSessionKey.key,
			ownerMailboxMigrationSyncStateKeyVersion: ownerEncMailboxMigrationSyncStateSessionKey.encryptingKeyVersion.toString(),
			ownerEncMailboxMigrationInformationSessionKey: ownerEncMailboxMigrationInformationSessionKey.key,
			ownerEncMailboxMigrationInformationKeyVersion: ownerEncMailboxMigrationInformationSessionKey.encryptingKeyVersion.toString(),
			postponedUntil: Date.now().toString(),
			provider: params.provider.toString(),
			isShared: params.userId === null,
			imapConfiguration,
			customerUserMigrationInformation,
			customerMigrationInformation: params.customerMigrationInformation,
		})

		await this.serviceExecutor.execute(CustomerMailboxMigrationService_POST, data, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: mailboxMigrationSyncStateSessionKey,
		})
	}
}
