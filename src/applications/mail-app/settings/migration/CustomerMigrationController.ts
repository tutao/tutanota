import m from "mithril"
import {
	CreateCustomerUserMigrationInfoParams,
	CustomerMailboxMigrationUser,
	CustomerMigrationFacade,
	ScheduleMailboxMigrationParams,
} from "../../../common/api/worker/facades/lazy/CustomerMigrationFacade"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { MailAddressFacade } from "../../../common/api/worker/facades/lazy/MailAddressFacade"
import { GroupManagementFacade } from "../../../../platform-kit/base/facades/lazy/GroupManagementFacade"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { MailboxType, MigrationMailboxRow } from "./MigrationCsvParser"
import {
	CustomerMigrationInfo,
	CustomerMigrationInfoTypeRef,
	CustomerUserMigrationInfo,
	CustomerUserMigrationInfoTypeRef,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	MailboxMigrationInfo,
	MailboxMigrationInfoTypeRef,
	User,
	UserMigrationInfoTypeRef,
	UserTypeRef,
} from "@tutao/entities/sys"
import { MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { OperationId } from "../../../common/api/main/OperationProgressTracker"
import { assertNotNull, getFirstOrThrow, promiseMap } from "@tutao/utils"
import { elementIdToId, GENERATED_MIN_ID, getElementId, getListId, idToElementId } from "@tutao/meta"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { CustomerMailboxMigrationInfoStatus, CustomerMigrationInfoStatus } from "../../../../entities/tutanota/Utils"
import { MailboxMigrationSyncStateTypeRef } from "@tutao/entities/tutanota"
import { MigrationMailboxRowView } from "./MigrationMailboxTableRow"
import { generatedIdToTimestamp } from "../../../../platform-kit/meta/EntityUtils"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { mailLocator } from "../../mailLocator"
import { findUserMigrationInfoForSyncState } from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { LoginController } from "../../../common/api/main/LoginController"

export type MigrationBatchView = {
	id: IdTuple
	status: CustomerMigrationInfoStatus
	startedAt: number
	rows: MigrationMailboxRowView[]
}

export type MultiUserMigrationConfig = {
	provider: MailboxMigrationProvider
	host?: string
	port?: string
	useSSL?: boolean
	customCertificateData?: Uint8Array<ArrayBuffer> | null
	ignoreCertificateErrors?: boolean
	customerMigrationInfo: IdTuple
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

/** A user row already scheduled in this CSV run - carries the `CustomerMailboxMigrationUser` reference so it can be reused (not recreated) for any shared mailbox this user is also a member of. */
type ResolvedCsvUser = {
	user: User
	mailGroupId: Id
	generatedPassword?: string
	migrationUser: CustomerMailboxMigrationUser
}

export class CustomerMigrationController {
	public batches: MigrationBatchView[] = []
	public loading = true

	constructor(
		private readonly customerMigrationFacade: CustomerMigrationFacade,
		private readonly userManagementFacade: UserManagementFacade,
		private readonly groupManagementFacade: GroupManagementFacade,
		private readonly mailAddressFacade: MailAddressFacade,
		private readonly loginController: LoginController,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly generatePassword: () => Promise<string>,
	) {
		if (this.loginController.isGlobalAdminUserLoggedIn()) {
			this.eventController.addEntityUpdatesListener({
				id: "CustomerMigrationController",
				onEntityUpdatesReceived: (updates) => this.onEntityUpdatesReceived(updates),
				priority: ListenerPriority.HIGH,
			})
		}
	}

	async init(): Promise<void> {
		await this.refresh()
	}

	async refresh(): Promise<void> {
		this.loading = true
		m.redraw()
		try {
			this.batches = await this.loadMigrationBatches()
		} finally {
			this.loading = false
			m.redraw()
		}
	}

	private async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (
				isUpdateForTypeRef(CustomerMigrationInfoTypeRef, update) ||
				isUpdateForTypeRef(CustomerUserMigrationInfoTypeRef, update) ||
				isUpdateForTypeRef(MailboxMigrationInfoTypeRef, update) ||
				isUpdateForTypeRef(MailboxMigrationSyncStateTypeRef, update)
			) {
				await this.refresh()
				return
			}
		}
	}

	private async loadMigrationBatches(): Promise<MigrationBatchView[]> {
		const customerInfo = await mailLocator.logins.getUserController().loadCustomerInfo()
		if (customerInfo.migrationInfos == null) return []

		const batches: CustomerMigrationInfo[] = await this.entityClient.loadAll(CustomerMigrationInfoTypeRef, customerInfo.migrationInfos)
		return await promiseMap(batches, async (batch) => {
			const customerUserMigrationInfos = await this.entityClient.loadAll(CustomerUserMigrationInfoTypeRef, batch.customerUserMigrationInfos)
			const userRowsPerUser = await promiseMap(customerUserMigrationInfos, async (customerUserMigrationInfo) => {
				const mailboxInfos: MailboxMigrationInfo[] = await this.entityClient.loadAll(
					MailboxMigrationInfoTypeRef,
					customerUserMigrationInfo.mailboxMigrationInfos,
				)

				const sourceMailAddress = await this.customerMigrationFacade.getSourceMailAddressForUserMailbox(customerUserMigrationInfo, batch)
				return mailboxInfos.map(
					(info): MigrationMailboxRowView => ({
						name: customerUserMigrationInfo.tutaName,
						tutaMailAddress: customerUserMigrationInfo.tutaMailAddress,
						sourceMailAddress: sourceMailAddress ?? "",
						status: info.status as CustomerMailboxMigrationInfoStatus,
						initialPassword: customerUserMigrationInfo.initialPassword,
						errorCode: info.errorCode,
					}),
				)
			})

			const sharedMailboxInfos: MailboxMigrationInfo[] = await this.entityClient.loadAll(MailboxMigrationInfoTypeRef, batch.customerMailboxMigrationInfos)
			const sharedRows = await promiseMap(sharedMailboxInfos, async (info): Promise<MigrationMailboxRowView> => {
				const group = await this.entityClient.load(GroupTypeRef, idToElementId(info.mailGroup))
				const groupInfo = await this.entityClient.load(GroupInfoTypeRef, group.groupInfo)
				const sourceMailAddress = await this.customerMigrationFacade.getSourceMailAddressForSharedMailbox(info)
				return {
					name: groupInfo.name,
					tutaMailAddress: groupInfo.mailAddress ?? "",
					sourceMailAddress: sourceMailAddress ?? "",
					status: info.status as CustomerMailboxMigrationInfoStatus,
					initialPassword: null,
					errorCode: info.errorCode,
				}
			})

			return {
				id: batch._id,
				status: batch.status as CustomerMigrationInfoStatus,
				startedAt: generatedIdToTimestamp(batch._id[1]),
				rows: [...userRowsPerUser.flat(), ...sharedRows],
			}
		})
	}

	batchAllMailboxesCompleted(batch: MigrationBatchView): boolean {
		return batch.rows.every((row) => row.status === CustomerMailboxMigrationInfoStatus.COMPLETED_SUCCESSFULLY)
	}

	async finishMigration(customerMigrationInfoId: IdTuple): Promise<void> {
		const customerMigrationInfo = await this.entityClient.load(CustomerMigrationInfoTypeRef, customerMigrationInfoId)
		customerMigrationInfo.status = CustomerMigrationInfoStatus.FINISHING_MIGRATION
		await this.entityClient.update(customerMigrationInfo)
		await this.refresh()
	}

	async completeMigration(customerMigrationInfoId: IdTuple): Promise<void> {
		const customerMigrationInfo = await this.entityClient.load(CustomerMigrationInfoTypeRef, customerMigrationInfoId)
		customerMigrationInfo.status = CustomerMigrationInfoStatus.COMPLETED_SUCCESSFULLY
		await this.entityClient.update(customerMigrationInfo)
		await this.refresh()
	}

	async cancelMigration(customerMigrationInfo: IdTuple): Promise<void> {
		await this.customerMigrationFacade.cancelMigration(customerMigrationInfo)
		await this.refresh()
	}

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
	 * server-side migration for each resulting mailbox.
	 *
	 * Rows whose `tutaEmail` already belongs to a user in this customer (per `classifications`) reuse
	 * that user's existing mailbox instead of creating a new account. User rows are scheduled first,
	 * so that when a shared mailbox's `members` are scheduled next, any member who also
	 * has their own mailbox in this batch already has a `CustomerMailboxMigrationUser` reference to reuse
	 * instead of creating a duplicate one.
	 *
	 * A failure on one row does not stop the others; per-row outcomes are returned for the caller to summarize.
	 */
	async migrateUsersFromCsv(
		rows: ReadonlyArray<MigrationMailboxRow>,
		classifications: ReadonlyMap<string, TutaEmailClassification>,
		config: MultiUserMigrationConfig,
		operationId: OperationId,
	): Promise<MigrationRowResult[]> {
		const results: MigrationRowResult[] = []
		const resolvedUsers = new Map<string, ResolvedCsvUser>()

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
					const migrationUser = await this.customerMigrationFacade.createCustomerUserMigrationInfo(
						this.buildCreateUserParams(row, elementIdToId(user._id), userGroupId, null, config),
					)
					await this.customerMigrationFacade.scheduleMailboxMigration(this.buildScheduleParams(mailGroupId, false, null, config), [migrationUser])

					resolvedUsers.set(row.sourceEmail, { user, mailGroupId, migrationUser })
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
					const migrationUser = await this.customerMigrationFacade.createCustomerUserMigrationInfo(
						this.buildCreateUserParams(row, userId, userGroupId, generatedPassword, config),
					)
					await this.customerMigrationFacade.scheduleMailboxMigration(this.buildScheduleParams(mailGroupId, false, null, config), [migrationUser])

					resolvedUsers.set(row.sourceEmail, { user, mailGroupId, generatedPassword, migrationUser })
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

				const migrationUsers: CustomerMailboxMigrationUser[] = []
				for (const member of row.members) {
					const resolvedMember = resolvedUsers.get(member)
					if (resolvedMember) {
						await this.groupManagementFacade.addUserToGroup(resolvedMember.user, mailGroup)
						migrationUsers.push(resolvedMember.migrationUser)
					}
				}
				if (migrationUsers.length === 0) {
					throw new Error(`shared mailbox ${row.tutaEmail} has no valid members to drive the migration`)
				}

				await this.customerMigrationFacade.scheduleMailboxMigration(this.buildScheduleParams(mailGroup, true, row.sourceEmail, config), migrationUsers)

				results.push({ row, success: true })
			} catch (e) {
				results.push({ row, success: false, errorMessage: e instanceof Error ? e.message : String(e) })
			}
		}

		return results
	}

	async addUserToExistingMigration(user: User, customerMigrationInfo: CustomerMigrationInfo, oldMailAddress: string) {
		const provider = parseInt(customerMigrationInfo.provider) as MailboxMigrationProvider
		const mailGroupId = getFirstOrThrow(filterMailMemberships(user)).group
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
		const migrationUser = await this.customerMigrationFacade.createCustomerUserMigrationInfo({
			userId: elementIdToId(user._id),
			userGroupId: user.userGroup.group,
			tutaName: userGroupInfo.name,
			tutaMailAddress: oldMailAddress,
			initialPassword: null,
			credential: { username: oldMailAddress, password: null, oAuthToken: null },
			provider,
			customerMigrationInfo: customerMigrationInfo._id,
		})
		await this.customerMigrationFacade.scheduleMailboxMigration(
			{
				mailGroupId,
				provider,
				host: customerMigrationInfo.imapConfiguration?.host,
				port: customerMigrationInfo.imapConfiguration?.port,
				useSSL: customerMigrationInfo.imapConfiguration?.useSSL,
				ignoreCertificateErrors: customerMigrationInfo.imapConfiguration?.ignoreCertificateErrors,
				customCertificateData: customerMigrationInfo.imapConfiguration?.customCertificateData,
				isShared: false,
				sharedMailboxSourceAddress: null,
				customerMigrationInfo: customerMigrationInfo._id,
			},
			[migrationUser],
		)
	}

	async addMailboxToExistingMigration(groupInfo: GroupInfo, customerMigrationInfo: CustomerMigrationInfo, oldMailAddress: string) {
		const provider = parseInt(customerMigrationInfo.provider) as MailboxMigrationProvider
		const group = await this.entityClient.load(GroupTypeRef, idToElementId(groupInfo.group))
		const groupMembers = await this.entityClient.loadRange(GroupMemberTypeRef, group.members, GENERATED_MIN_ID, 200, false)
		if (groupMembers.length === 0) {
			throw new Error(`shared mailbox ${groupInfo.name} has no members to drive the migration`)
		}
		const members = await promiseMap(groupMembers, (groupMember) => this.entityClient.load(UserTypeRef, idToElementId(groupMember.user)))

		const existingCustomerUserMigrationInfos = await this.entityClient.loadAll(
			CustomerUserMigrationInfoTypeRef,
			customerMigrationInfo.customerUserMigrationInfos,
		)
		const migrationUsers = await promiseMap(members, (member) =>
			this.resolveOrCreateMigrationUser(member, existingCustomerUserMigrationInfos, {
				initialPassword: null,
				credential: { username: oldMailAddress, password: null, oAuthToken: null },
				provider,
				customerMigrationInfo: customerMigrationInfo._id,
			}),
		)

		await this.customerMigrationFacade.scheduleMailboxMigration(
			{
				mailGroupId: groupInfo.group,
				provider,
				host: customerMigrationInfo.imapConfiguration?.host,
				port: customerMigrationInfo.imapConfiguration?.port,
				useSSL: customerMigrationInfo.imapConfiguration?.useSSL,
				ignoreCertificateErrors: customerMigrationInfo.imapConfiguration?.ignoreCertificateErrors,
				customCertificateData: customerMigrationInfo.imapConfiguration?.customCertificateData,
				isShared: true,
				sharedMailboxSourceAddress: oldMailAddress,
				customerMigrationInfo: customerMigrationInfo._id,
			},
			migrationUsers,
		)
	}

	private async resolveOrCreateMigrationUser(
		member: User,
		existingCustomerUserMigrationInfos: ReadonlyArray<CustomerUserMigrationInfo>,
		createParams: Omit<CreateCustomerUserMigrationInfoParams, "userId" | "userGroupId" | "tutaName" | "tutaMailAddress">,
	): Promise<CustomerMailboxMigrationUser> {
		const memberId = elementIdToId(member._id)
		const existingCustomerUserMigrationInfo = existingCustomerUserMigrationInfos.find((info) => info.user === memberId)
		if (existingCustomerUserMigrationInfo) {
			const [firstMailboxMigrationInfo] = await this.entityClient.loadAll(
				MailboxMigrationInfoTypeRef,
				existingCustomerUserMigrationInfo.mailboxMigrationInfos,
			)
			const userMigrationInfoListId = member.userMigrationInfos
			if (firstMailboxMigrationInfo && userMigrationInfoListId) {
				const syncStateWrapper = firstMailboxMigrationInfo.mailboxMigrationSyncState
				const userMigrationInfos = await this.entityClient.loadAll(UserMigrationInfoTypeRef, userMigrationInfoListId)
				const userMigrationInfo = findUserMigrationInfoForSyncState(userMigrationInfos, [syncStateWrapper.listId, syncStateWrapper.listElementId])
				if (userMigrationInfo) {
					return {
						userId: memberId,
						customerUserMigrationInfo: [getListId(existingCustomerUserMigrationInfo), getElementId(existingCustomerUserMigrationInfo)],
						userMigrationInfo: [getListId(userMigrationInfo), getElementId(userMigrationInfo)],
					}
				}
			}
		}

		const memberGroupInfo = await this.entityClient.load(GroupInfoTypeRef, member.userGroup.groupInfo)
		return await this.customerMigrationFacade.createCustomerUserMigrationInfo({
			...createParams,
			userId: memberId,
			userGroupId: member.userGroup.group,
			tutaName: memberGroupInfo.name,
			tutaMailAddress: memberGroupInfo.mailAddress ?? "",
		})
	}

	private buildScheduleParams(
		mailGroupId: Id,
		isShared: boolean,
		sharedMailboxSourceAddress: string | null,
		config: MultiUserMigrationConfig,
	): ScheduleMailboxMigrationParams {
		return {
			mailGroupId,
			provider: config.provider,
			host: config.host,
			port: config.port,
			useSSL: config.useSSL,
			ignoreCertificateErrors: config.ignoreCertificateErrors,
			customCertificateData: config.customCertificateData,
			isShared,
			sharedMailboxSourceAddress,
			customerMigrationInfo: config.customerMigrationInfo,
		}
	}

	private buildCreateUserParams(
		row: MigrationMailboxRow,
		userId: Id,
		userGroupId: Id,
		initialPassword: string | null,
		config: MultiUserMigrationConfig,
	): CreateCustomerUserMigrationInfoParams {
		return {
			userId,
			userGroupId,
			tutaName: row.username || row.tutaEmail,
			tutaMailAddress: row.tutaEmail,
			initialPassword,
			credential: { username: row.sourceEmail, password: null, oAuthToken: null },
			provider: config.provider,
			customerMigrationInfo: config.customerMigrationInfo,
		}
	}
}
