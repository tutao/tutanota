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
import { CustomerFacade } from "./CustomerFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { GENERATED_MIN_ID } from "@tutao/meta"

export type MailboxMigrationInitializationParameters = {
	mailGroupId: Id
	name: string
	initialPassword: string | null
	imapAccount: ImapAccount
	provider: ImapProvider
	maxQuota: string
	userId: Id | null
}

export class MailboxMigrationFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly userFacade: UserFacade,
		private readonly customerFacade: CustomerFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly adminKeyLoader: AdminKeyLoaderFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

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
			customerMigrationInformation: [GENERATED_MIN_ID, GENERATED_MIN_ID], // fixme get this via customerFacade, when implementing CustomerMigrationService
			user: migrationInitializationParameters.userId,
		})
		const mailboxMigrationPostOut = await this.serviceExecutor.post(MailboxMigrationService, mailboxMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: imapAccountSyncStateSessionKey,
		})
	}
}
