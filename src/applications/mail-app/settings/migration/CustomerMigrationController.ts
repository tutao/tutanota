import { CustomerMigrationFacade, MailboxMigrationInitializationParameters } from "../../../common/api/worker/facades/lazy/CustomerMigrationFacade"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade"
import { GroupManagementFacade } from "../../../../platform-kit/base/facades/lazy/GroupManagementFacade"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { MailboxType, MigrationMailboxRow } from "./MigrationCsvParser"
import { createImapAccount } from "@tutao/entities/tutanota"
import { GroupInfo, GroupInfoTypeRef, GroupTypeRef, User, UserTypeRef } from "@tutao/entities/sys"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { DEFAULT_IMAP_IMPORT_MAX_QUOTA } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { OperationId } from "../../../common/api/main/OperationProgressTracker"
import { assertNotNull, getFirstOrThrow } from "@tutao/utils"
import { elementIdToId, idToElementId } from "@tutao/meta"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"

export type MultiUserMigrationConfig = {
	provider: ImapProvider
	host: string
	port: string
	useSSL: boolean
	customCertificateData: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors: boolean
	customerMigrationInformation: IdTuple
}

export type MigrationRowResult = {
	row: MigrationMailboxRow
	success: boolean
	generatedPassword?: string
	errorMessage?: string
}

/** Whether a CSV row's `tutaEmail` is free to create, already belongs to a user/shared mailbox in this customer, or is taken elsewhere. */
export type TutaEmailClassification =
	| { kind: "new" }
	| { kind: "existingUserInCustomer"; user: User; mailGroupId: Id }
	| { kind: "existingSharedMailboxInCustomer"; mailGroupId: Id }
	| { kind: "unavailable" }

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

	/** Cancels an admin-driven multi-user migration batch. */
	async cancelMigration(migrationInfo: IdTuple): Promise<void> {
		await this.customerMigrationFacade.cancelMigration(migrationInfo)
	}

	/**
	 * Classifies every `tutaEmail` in `rows`: already an existing user or shared mailbox in this customer (migrate
	 * into the existing mailbox instead of creating a new one), free to create, or taken by a different customer
	 * (hard error). User rows are matched against `customer.userGroups`, shared rows against `customer.teamGroups`.
	 * `isMailAddressAvailable` calls are made sequentially - it has no bulk variant, and its internal rate limiter
	 * cancels (and thus falsely fails) concurrent calls.
	 */
	async classifyTutaEmails(
		rows: ReadonlyArray<MigrationMailboxRow>,
		customerUserGroupsListId: Id,
		customerTeamGroupsListId: Id,
	): Promise<Map<string, TutaEmailClassification>> {
		const userGroupInfoByMailAddress = await this.groupInfoByMailAddress(customerUserGroupsListId)
		const sharedGroupInfoByMailAddress = await this.groupInfoByMailAddress(customerTeamGroupsListId)

		const classifications = new Map<string, TutaEmailClassification>()
		for (const row of rows) {
			if (classifications.has(row.tutaEmail)) continue

			if (row.mailboxType === MailboxType.User) {
				const existingGroupInfo = userGroupInfoByMailAddress.get(row.tutaEmail)
				if (existingGroupInfo) {
					const userGroup = await this.entityClient.load(GroupTypeRef, idToElementId(existingGroupInfo.group))
					const user = await this.entityClient.load(UserTypeRef, idToElementId(assertNotNull(userGroup.user)))
					const mailGroupId = getFirstOrThrow(filterMailMemberships(user)).group
					classifications.set(row.tutaEmail, { kind: "existingUserInCustomer", user, mailGroupId })
					continue
				}
			} else {
				const existingGroupInfo = sharedGroupInfoByMailAddress.get(row.tutaEmail)
				if (existingGroupInfo) {
					// a shared mailbox's GroupInfo.group is the mail group id directly - no separate user group to hop through
					classifications.set(row.tutaEmail, { kind: "existingSharedMailboxInCustomer", mailGroupId: existingGroupInfo.group })
					continue
				}
			}

			const available = await this.mailAddressFacade.isMailAddressAvailable(row.tutaEmail)
			classifications.set(row.tutaEmail, available ? { kind: "new" } : { kind: "unavailable" })
		}
		return classifications
	}

	private async groupInfoByMailAddress(groupsListId: Id): Promise<Map<string, GroupInfo>> {
		const groupInfos = await this.entityClient.loadAll(GroupInfoTypeRef, groupsListId)
		const groupInfoByMailAddress = new Map<string, GroupInfo>()
		for (const groupInfo of groupInfos) {
			if (groupInfo.deleted === null) {
				if (groupInfo.mailAddress) {
					groupInfoByMailAddress.set(groupInfo.mailAddress, groupInfo)
				}
				for (const alias of groupInfo.mailAddressAliases) {
					if (alias.enabled) {
						groupInfoByMailAddress.set(alias.mailAddress, groupInfo)
					}
				}
			}
		}
		return groupInfoByMailAddress
	}

	/**
	 * Creates a Tuta user (or shared mailbox) for every row of a parsed migration CSV and schedules a
	 * server-side IMAP migration for each resulting mailbox. Rows whose `tutaEmail` already belongs to a user
	 * in this customer (per `classifications`) reuse that user's existing mailbox instead of creating a new
	 * account. User rows are processed before shared rows so that a shared mailbox's `members` can always be
	 * resolved to an already-created (or reused) user. A failure on one row does not stop the others; per-row
	 * outcomes are returned for the caller to summarize.
	 */
	async migrateUsersFromCsv(
		rows: ReadonlyArray<MigrationMailboxRow>,
		classifications: ReadonlyMap<string, TutaEmailClassification>,
		config: MultiUserMigrationConfig,
		operationId: OperationId,
	): Promise<MigrationRowResult[]> {
		const results: MigrationRowResult[] = []
		const resolvedUsers = new Map<string, { user: User; mailGroupId: Id; generatedPassword?: string }>()

		const userRows = rows.filter((row) => row.mailboxType === MailboxType.User)
		const sharedRows = rows.filter((row) => row.mailboxType === MailboxType.Shared)

		for (let index = 0; index < userRows.length; index++) {
			const row = userRows[index]
			const classification = classifications.get(row.tutaEmail)
			try {
				if (classification?.kind === "unavailable") {
					throw new Error(`${row.tutaEmail} is already in use`)
				}

				if (classification?.kind === "existingUserInCustomer") {
					const { user, mailGroupId } = classification
					const userGroupId = user.userGroup.group
					for (const alias of row.aliases) {
						await this.mailAddressFacade.addMailAlias(userGroupId, alias)
					}
					await this.customerMigrationFacade.scheduleMailboxMigration(
						this.buildMigrationParams(row, mailGroupId, elementIdToId(user._id), null, config),
					)

					resolvedUsers.set(row.sourceEmail, { user, mailGroupId })
					results.push({ row, success: true })
				} else {
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

					resolvedUsers.set(row.sourceEmail, { user, mailGroupId, generatedPassword })
					results.push({ row, success: true, generatedPassword })
				}
			} catch (e) {
				results.push({ row, success: false, errorMessage: e instanceof Error ? e.message : String(e) })
			}
		}

		for (const row of sharedRows) {
			const classification = classifications.get(row.tutaEmail)
			try {
				if (classification?.kind === "unavailable") {
					throw new Error(`${row.tutaEmail} is already in use`)
				}

				const mailGroup =
					classification?.kind === "existingSharedMailboxInCustomer"
						? classification.mailGroupId
						: (await this.groupManagementFacade.createSharedMailGroup(row.username || row.tutaEmail, row.tutaEmail)).mailGroup

				for (const alias of row.aliases) {
					await this.mailAddressFacade.addMailAlias(mailGroup, alias)
				}

				for (const member of row.members) {
					const resolvedMember = resolvedUsers.get(member)
					if (resolvedMember) {
						await this.groupManagementFacade.addUserToGroup(resolvedMember.user, mailGroup)
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
				customCertificateData: config.customCertificateData,
				ignoreCertificateErrors: config.ignoreCertificateErrors,
				useSSL: config.useSSL,
			}),
			provider: config.provider,
			maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
			userId,
			customerMigrationInformation: config.customerMigrationInformation,
		}
	}
}
