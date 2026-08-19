import { AdminKeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { MailFacade } from "./MailFacade"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { CryptoWrapper } from "@tutao/crypto"
import { createMailboxMigrationPostIn, ImapAccount, MailboxMigrationService } from "@tutao/entities/tutanota"
import { ImapProvider } from "../../../common/utils/imapImportUtils/ImapKnownConfigs"
import { GroupType } from "../../../../../../entities/sys/Utils"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import {
	createCustomerMigrationDeleteIn,
	createCustomerMigrationPostIn,
	CustomerMigrationImapConfiguration,
	CustomerMigrationService,
} from "@tutao/entities/sys"

export type MailboxMigrationInitializationParameters = {
	mailGroupId: Id
	name: string
	initialPassword: string | null
	imapAccount: ImapAccount
	provider: ImapProvider
	maxQuota: string
	userId: Id | null
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
	 * @returns the IdTuple to pass as `customerMigrationInformation` to each MailboxMigrationService call in this batch.
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
		const postOut = await this.serviceExecutor.post(CustomerMigrationService, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })
		return postOut.migrationInfo
	}

	/** Cancels an admin-driven multi-user migration batch. */
	async cancelMigration(migrationInfo: IdTuple): Promise<void> {
		await this.serviceExecutor.delete(CustomerMigrationService, createCustomerMigrationDeleteIn({ migrationInfo }), null)
	}

	async scheduleMailboxMigration(migrationInitializationParameters: MailboxMigrationInitializationParameters): Promise<void> {
		const { mailGroupId, userId } = migrationInitializationParameters
		const mailGroupKey =
			userId !== null
				? await this.adminKeyLoader.getCurrentGroupKeyViaUser(mailGroupId, userId)
				: await this.adminKeyLoader.getCurrentGroupKeyViaAdminEncGKey(mailGroupId)
		const imapAccountSyncStateSessionKey = this.cryptoWrapper.aes256RandomKey()
		const mailboxMigrationInformationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const ownerEncImapAccountSyncStateSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, imapAccountSyncStateSessionKey)
		const customerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(this.userFacade.getGroupId(GroupType.Customer))
		const ownerEncMailboxMigrationInformationSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(
			customerGroupKey,
			mailboxMigrationInformationSessionKey,
		)
		const mailboxMigrationPostIn = createMailboxMigrationPostIn({
			mailGroup: mailGroupId,
			ownerEncImapAccountSyncStateSessionKey: ownerEncImapAccountSyncStateSessionKey.key,
			ownerImapAccountSyncStateKeyVersion: ownerEncImapAccountSyncStateSessionKey.encryptingKeyVersion.toString(),
			ownerEncMailboxMigrationInformationSessionKey: ownerEncMailboxMigrationInformationSessionKey.key,
			ownerEncMailboxMigrationInformationKeyVersion: ownerEncMailboxMigrationInformationSessionKey.encryptingKeyVersion.toString(),
			maxQuota: migrationInitializationParameters.maxQuota,
			postponedUntil: Date.now().toString(),
			provider: migrationInitializationParameters.provider.toString(),
			encName: this.cryptoWrapper.encryptString(mailboxMigrationInformationSessionKey, migrationInitializationParameters.name),
			encInitialPassword:
				migrationInitializationParameters.initialPassword !== null
					? this.cryptoWrapper.encryptString(mailboxMigrationInformationSessionKey, migrationInitializationParameters.initialPassword)
					: null,
			encMailAddress: this.cryptoWrapper.encryptString(mailboxMigrationInformationSessionKey, migrationInitializationParameters.imapAccount.username),
			isShared: userId === null,
			imapAccount: migrationInitializationParameters.imapAccount,
			customerMigrationInformation: migrationInitializationParameters.customerMigrationInformation,
			user: migrationInitializationParameters.userId,
		})
		const mailboxMigrationPostOut = await this.serviceExecutor.post(MailboxMigrationService, mailboxMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: imapAccountSyncStateSessionKey,
		})
	}
}
