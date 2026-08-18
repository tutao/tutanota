import { CustomerMigrationFacade, MailboxMigrationInitializationParameters } from "../../../common/api/worker/facades/lazy/CustomerMigrationFacade"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade"
import { GroupManagementFacade } from "../../../../platform-kit/base/facades/lazy/GroupManagementFacade"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { MailboxType, MigrationMailboxRow } from "./MigrationCsvParser"
import { createImapAccount } from "@tutao/entities/tutanota"
import { User, UserTypeRef } from "@tutao/entities/sys"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { DEFAULT_IMAP_IMPORT_MAX_QUOTA } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { OperationId } from "../../../common/api/main/OperationProgressTracker"
import { getFirstOrThrow } from "@tutao/utils"
import { idToElementId } from "@tutao/meta"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"

export type MultiUserMigrationConfig = {
	provider: ImapProvider
	host: string
	port: string
	useSSL: boolean
	customerMigrationInformation: IdTuple
}

export type MigrationRowResult = {
	row: MigrationMailboxRow
	success: boolean
	generatedPassword?: string
	errorMessage?: string
}

export class CustomerMigrationController {
	constructor(
		private readonly customerMigrationFacade: CustomerMigrationFacade,
		private readonly userManagementFacade: UserManagementFacade,
		private readonly groupManagementFacade: GroupManagementFacade,
		private readonly mailAddressFacade: MailAddressFacade,
		private readonly entityClient: EntityClient,
		private readonly generatePassword: () => Promise<string>,
	) {}

	async scheduleMigration(mailboxMigrationInitializationParameters: MailboxMigrationInitializationParameters): Promise<void> {
		return await this.customerMigrationFacade.scheduleMailboxMigration(mailboxMigrationInitializationParameters)
	}

	/**
	 * Returns the `tutaEmail` addresses from `rows` that are already taken. Calls are made sequentially -
	 * `MailAddressFacade.isMailAddressAvailable` has no bulk variant, and its internal rate limiter cancels
	 * (and thus falsely fails) concurrent calls.
	 */
	async findUnavailableTutaEmails(rows: ReadonlyArray<MigrationMailboxRow>): Promise<string[]> {
		const unavailable: string[] = []
		for (const row of rows) {
			const available = await this.mailAddressFacade.isMailAddressAvailable(row.tutaEmail)
			if (!available) {
				unavailable.push(row.tutaEmail)
			}
		}
		return unavailable
	}

	/**
	 * Creates a Tuta user (or shared mailbox) for every row of a parsed migration CSV and schedules a
	 * server-side IMAP migration for each resulting mailbox. User rows are processed before shared rows so
	 * that a shared mailbox's `members` can always be resolved to an already-created user. A failure on one
	 * row does not stop the others; per-row outcomes are returned for the caller to summarize.
	 */
	async migrateUsersFromCsv(
		rows: ReadonlyArray<MigrationMailboxRow>,
		config: MultiUserMigrationConfig,
		operationId: OperationId,
	): Promise<MigrationRowResult[]> {
		const results: MigrationRowResult[] = []
		const createdUsers = new Map<string, { user: User; mailGroupId: Id; generatedPassword: string }>()

		const userRows = rows.filter((row) => row.mailboxType === MailboxType.User)
		const sharedRows = rows.filter((row) => row.mailboxType === MailboxType.Shared)

		for (let index = 0; index < userRows.length; index++) {
			const row = userRows[index]
			try {
				const generatedPassword = await this.generatePassword()
				const { userId } = await this.userManagementFacade.createUser(
					row.username,
					row.tutaEmail,
					generatedPassword,
					index,
					userRows.length,
					operationId,
				)
				const user = await this.entityClient.load(UserTypeRef, idToElementId(userId))
				const userGroupId = user.userGroup.group

				for (const alias of row.aliases) {
					await this.mailAddressFacade.addMailAlias(userGroupId, alias)
				}
				const mailGroupId = getFirstOrThrow(filterMailMemberships(user)).group
				await this.customerMigrationFacade.scheduleMailboxMigration(this.buildMigrationParams(row, mailGroupId, userId, generatedPassword, config))

				createdUsers.set(row.sourceEmail, { user, mailGroupId, generatedPassword })
				results.push({ row, success: true, generatedPassword })
			} catch (e) {
				results.push({ row, success: false, errorMessage: e instanceof Error ? e.message : String(e) })
			}
		}

		for (const row of sharedRows) {
			try {
				const { mailGroup } = await this.groupManagementFacade.createSharedMailGroup(row.username || row.tutaEmail, row.tutaEmail)

				for (const alias of row.aliases) {
					await this.mailAddressFacade.addMailAlias(mailGroup, alias)
				}

				for (const member of row.members) {
					const createdMember = createdUsers.get(member)
					if (createdMember) {
						await this.groupManagementFacade.addUserToGroup(createdMember.user, mailGroup)
					}
				}

				await this.customerMigrationFacade.scheduleMailboxMigration(this.buildMigrationParams(row, mailGroup, null, null, config))

				results.push({ row, success: true })
			} catch (e) {
				results.push({ row, success: false, errorMessage: e instanceof Error ? e.message : String(e) })
			}
		}

		return results
	}

	private buildMigrationParams(
		row: MigrationMailboxRow,
		mailGroupId: Id,
		userId: Id | null,
		initialPassword: string | null,
		config: MultiUserMigrationConfig,
	): MailboxMigrationInitializationParameters {
		return {
			mailGroupId,
			name: row.username || row.tutaEmail,
			initialPassword,
			imapAccount: createImapAccount({
				host: config.host,
				port: config.port,
				username: row.sourceEmail,
				password: null,
				oAuthTokenEndpointResponse: null,
				customCertificateData: null,
				ignoreCertificateErrors: false,
				useSSL: config.useSSL,
			}),
			provider: config.provider,
			maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
			userId,
			customerMigrationInformation: config.customerMigrationInformation,
		}
	}
}
