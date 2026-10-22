import { AdminKeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { MailFacade } from "./MailFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { CryptoWrapper } from "@tutao/crypto"
import {
	createCustomerMailboxMigrationPostIn,
	createCustomerMailboxMigrationUserData,
	createMailboxMigrationImapConfiguration,
	CustomerMailboxMigrationService_POST,
} from "@tutao/entities/tutanota"
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
	createCustomerMigrationPostIn,
	createCustomerUserMigrationPostIn,
	createUserMigrationCredential,
	CustomerMigrationImapConfiguration,
	CustomerMigrationService_DELETE,
	CustomerMigrationService_POST,
	CustomerUserMigrationService_POST,
	OAuthToken,
	UserTypeRef,
} from "@tutao/entities/sys"
import { UserListProvider } from "../../../../../../entities/tutanota/Utils"
import { getFirstOrThrow } from "@tutao/utils"
import { idToElementId } from "@tutao/meta"

export type UserMigrationCredentialInput = {
	username: string
	password: string | null
	oAuthToken: OAuthToken | null
}

/** A Tuta user credited on a mailbox migration - their own personal mailbox, or (reused) as a shared mailbox member. */
export type CustomerMailboxMigrationUser = {
	userId: Id
	customerUserMigrationInfo: IdTuple
	userMigrationInfo: IdTuple
}

export type CreateCustomerUserMigrationInfoParams = {
	userId: Id
	/** `userId`'s own user group. */
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
	/** Only meaningful for the generic IMAP provider ("Other") - other providers fetch via their own API. */
	host?: string
	port?: string
	useSSL?: boolean
	ignoreCertificateErrors?: boolean
	customCertificateData?: Uint8Array<ArrayBuffer> | null
	isShared: boolean
	/** The shared mailbox's old/source address - null for a personal mailbox. */
	sharedMailboxSourceAddress: string | null
	customerMigrationInfo: IdTuple
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
	async createCustomerMigrationInformation(imapConfiguration: CustomerMigrationImapConfiguration | null): Promise<IdTuple> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const sessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, sessionKey)
		const data = createCustomerMigrationPostIn({
			userListProvider: UserListProvider.CSV.toString(),
			userListAdminCredentials: null, // fixme this is non-null only when the userList is provided by non-CSV
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
	 * Creates the admin-visible identity/credential record for one Tuta user within a batch. The result should be
	 * reused (not recreated) for every mailbox that user is credited on - their own personal mailbox, and/or any
	 * shared mailbox they are a member of.
	 */
	async createCustomerUserMigrationInfo(params: CreateCustomerUserMigrationInfoParams): Promise<CustomerMailboxMigrationUser> {
		const customerGroupId = this.userFacade.getGroupId(GroupType.Customer)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(customerGroupId)
		const customerUserMigrationInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncCustomerUserMigrationInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(customerGroupKey, customerUserMigrationInfoSessionKey)

		const userGroupKey = await this.adminKeyLoader.getCurrentGroupKeyViaAdminEncGKey(params.userGroupId)
		const userMigrationInfoSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncUserMigrationInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, userMigrationInfoSessionKey)

		const data = createCustomerUserMigrationPostIn({
			ownerEncCustomerUserMigrationInfoSessionKey: ownerEncCustomerUserMigrationInfoSessionKey.key,
			ownerCustomerUserMigrationInfoKeyVersion: ownerEncCustomerUserMigrationInfoSessionKey.encryptingKeyVersion.toString(),
			encTutaName: this.cryptoWrapper.encryptString(customerUserMigrationInfoSessionKey, params.tutaName),
			encTutaMailAddress: this.cryptoWrapper.encryptString(customerUserMigrationInfoSessionKey, params.tutaMailAddress),
			encTutaInitialPassword:
				params.initialPassword !== null ? this.cryptoWrapper.encryptString(customerUserMigrationInfoSessionKey, params.initialPassword) : null,
			ownerEncUserMigrationInfoSessionKey: ownerEncUserMigrationInfoSessionKey.key,
			ownerUserMigrationInfoKeyVersion: ownerEncUserMigrationInfoSessionKey.encryptingKeyVersion.toString(),
			provider: params.provider.toString(),
			credential: createUserMigrationCredential({
				username: params.credential.username,
				password: params.credential.password,
				oAuthToken: params.credential.oAuthToken,
			}),
			user: params.userId,
			customerMigrationInfo: params.customerMigrationInfo,
		})

		const postOut = await this.serviceExecutor.execute(CustomerUserMigrationService_POST, data, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: userMigrationInfoSessionKey,
		})
		return {
			userId: params.userId,
			customerUserMigrationInfo: postOut.customerUserMigrationInfo,
			userMigrationInfo: postOut.userMigrationInfo,
		}
	}

	/**
	 * Schedules a mailbox's migration. `users` credits every Tuta user on it - exactly one for a personal mailbox,
	 * or every (resolved) member for a shared mailbox. The mail group's key is accessed via the first user's own
	 * membership.
	 */
	async scheduleMailboxMigration(params: ScheduleMailboxMigrationParams, users: ReadonlyArray<CustomerMailboxMigrationUser>): Promise<void> {
		const drivingUserId = getFirstOrThrow(users).userId
		await this.entityClient.load(UserTypeRef, idToElementId(drivingUserId), { ...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS, cacheMode: CacheMode.WriteOnly })
		const mailGroupKey = await this.adminKeyLoader.getCurrentGroupKeyViaUser(params.mailGroupId, drivingUserId)
		const mailboxMigrationSyncStateSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncMailboxMigrationSyncStateSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, mailboxMigrationSyncStateSessionKey)

		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Customer))
		const mailboxMigrationInformationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncMailboxMigrationInformationSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(
			customerGroupKey,
			mailboxMigrationInformationSessionKey,
		)

		// Only the generic IMAP provider ("Other") connects via host/port - Gmail/Outlook fetch through their own
		// API and authenticate purely via the credential's oAuthToken, so there is no IMAP connection to configure.
		const imapConfiguration =
			params.provider === MailboxMigrationProvider.Other
				? createMailboxMigrationImapConfiguration({
						host: params.host ?? "",
						port: params.port ?? "",
						legacyUsername: null,
						sharedPassword: null,
						ignoreCertificateErrors: params.ignoreCertificateErrors ?? false,
						customCertificateData: params.customCertificateData ?? null,
						useSSL: params.useSSL ?? true,
						legacyOauthToken: null,
					})
				: null

		const data = createCustomerMailboxMigrationPostIn({
			ownerEncMailboxMigrationSyncStateSessionKey: ownerEncMailboxMigrationSyncStateSessionKey.key,
			ownerMailboxMigrationSyncStateKeyVersion: ownerEncMailboxMigrationSyncStateSessionKey.encryptingKeyVersion.toString(),
			ownerEncMailboxMigrationInformationSessionKey: ownerEncMailboxMigrationInformationSessionKey.key,
			ownerEncMailboxMigrationInformationKeyVersion: ownerEncMailboxMigrationInformationSessionKey.encryptingKeyVersion.toString(),
			postponedUntil: Date.now().toString(),
			provider: params.provider.toString(),
			isShared: params.isShared,
			sharedMailboxName: params.sharedMailboxSourceAddress,
			encSharedMailboxName:
				params.sharedMailboxSourceAddress !== null
					? this.cryptoWrapper.encryptString(customerGroupKey.object, params.sharedMailboxSourceAddress)
					: null,
			imapConfiguration,
			customerMigrationInfo: params.customerMigrationInfo,
			customerMailboxMigrationUserData: users.map((user) =>
				createCustomerMailboxMigrationUserData({
					customerUserMigrationInfo: user.customerUserMigrationInfo,
					userMigrationInfo: user.userMigrationInfo,
				}),
			),
		})
		data.ownerGroup = params.mailGroupId

		await this.serviceExecutor.execute(CustomerMailboxMigrationService_POST, data, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: mailboxMigrationSyncStateSessionKey,
		})
	}
}
