import { EnvProvider } from "@tutao/app-env"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { MailboxImporter, ImportResult, InitializeMigrationParams, MailSetMapping } from "../../workerUtils/migration/MailboxImporter"
import { MailModel } from "../../mail/model/MailModel"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { assertNotNull, first } from "@tutao/utils"
import { MailBox, MailboxMigrationSyncState, MailboxMigrationSyncStateTypeRef } from "@tutao/entities/tutanota"
import { UserMigrationInformation, UserMigrationInformationTypeRef } from "@tutao/entities/sys"
import { MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { collapseId, getElementId, OperationType } from "@tutao/meta"
import { MIGRATION_AUTH_ERROR_POSTPONE_TIME, MIGRATION_ERROR_POSTPONE_TIME, MailboxMigrationSyncStatus } from "../../../../entities/tutanota/Utils"
import { MigrationCredentials } from "../../../common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { getSpecialUseAsSystemFolderType, MigrationMailbox } from "../../../common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"
import m from "mithril"
import { MigrationData } from "./AddMigrationWizard"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { showUpdateMigrationCredentialsDialog } from "../../../common/gui/dialogs/UpdateMigrationCredentialsDialog"
import { OAuthHandler } from "./oauth/OAuthHandler"
import { Dialog } from "../../../../ui/base/Dialog"
import { MigrationErrorHandler, ReadableMigrationError } from "./MigrationErrorHandler"
import { findUserMigrationInfoForSyncState } from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { mailLocator } from "../../mailLocator"

EnvProvider.assertMainOrNode()

export type MailboxMigrationUiSession = {
	provider: MailboxMigrationProvider
	mailboxMigrationSyncStateId: IdTuple
	mailGroupId: Id
	username: string
	mailboxMigrationSyncStatus: MailboxMigrationSyncStatus
	postponedUntil: Date
	syncProgress: {
		completed: number
		total: number
	}
	importedMailCount: number
}

export type MigrationUiGetMailboxResult = {
	result?: {
		migrationMailboxes: ReadonlyArray<MigrationMailbox>
		migrationCredentials: MigrationCredentials
	}
	error?: ReadableMigrationError
}

const MIGRATION_RESYNC_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

export class MailboxMigrationController {
	private isInStateTransition = false
	public mailboxDetails: MailboxDetail[] = []
	public selectedMailBoxDetail: MailboxDetail | null = null
	public activeMigrationUiSessions: MailboxMigrationUiSession[] = []
	public canceledMigrationUiSessions: MailboxMigrationUiSession[] = []
	private migrationResyncIntervalId: TimeoutID | null = null
	private isDisplayingOauthCredentialPopup = false

	constructor(
		private readonly mailboxImporter: MailboxImporter,
		private readonly mailModel: MailModel,
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly oauthFacade: OauthFacade,
		private readonly migrationErrorHandler: MigrationErrorHandler,
	) {
		this.eventController.addEntityUpdatesListener({
			id: "MailboxMigrationController",
			onEntityUpdatesReceived: (updates) => this.onEntityUpdatesReceived(updates),
			priority: ListenerPriority.HIGH,
		})
	}

	private async loadUserMigrationInformationForSyncState(migrationSyncStateId: IdTuple): Promise<UserMigrationInformation | null> {
		const userMigrationInfosListId = mailLocator.logins.getUserController().user.userMigrationInfos
		if (userMigrationInfosListId === null) {
			return null
		}
		const userMigrationInformationList = await this.entityClient.loadAll(UserMigrationInformationTypeRef, userMigrationInfosListId)
		return findUserMigrationInfoForSyncState(userMigrationInformationList, migrationSyncStateId)
	}

	private async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxMigrationSyncStateTypeRef, update)) {
				if (update.operation === OperationType.UPDATE) {
					const mailboxMigrationSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
					const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateId)

					const shouldDisplayCredentialsDialog = mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.AUTH_ERROR
					if (shouldDisplayCredentialsDialog) {
						const userMigrationInformation = await this.loadUserMigrationInformationForSyncState(mailboxMigrationSyncStateId)
						this.displayUpdateMigrationCredentialsDialog(mailboxMigrationSyncState, userMigrationInformation)
					}
					const shouldDisplayErrorDialog = mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.ERROR
					if (shouldDisplayErrorDialog) {
						Dialog.message("migrationSyncFailure_msg")
					}
					const shouldDisplayGmailAllMailsIMAPDisabledErrorDialog =
						mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR
					if (shouldDisplayGmailAllMailsIMAPDisabledErrorDialog) {
						Dialog.message("migrationGmailAllMailsDisabledImapError_msg")
					}

					// in case another client does pause/stop the migration import, we need to stop it here as well
					if (mailboxMigrationSyncState.status !== MailboxMigrationSyncStatus.RUNNING) {
						await this.stopLocalImport(mailboxMigrationSyncStateId)
					}
				}
			}
		}
	}

	public async promptUpdateMigrationCredentialsDialog(mailboxMigrationSyncStateId: IdTuple) {
		const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateId)
		const userMigrationInformation = await this.loadUserMigrationInformationForSyncState(mailboxMigrationSyncStateId)
		this.displayUpdateMigrationCredentialsDialog(mailboxMigrationSyncState, userMigrationInformation)
	}

	private displayUpdateMigrationCredentialsDialog(
		mailboxMigrationSyncState: MailboxMigrationSyncState,
		userMigrationInformation: UserMigrationInformation | null,
	) {
		if (!this.isDisplayingOauthCredentialPopup) {
			this.isDisplayingOauthCredentialPopup = true
			showUpdateMigrationCredentialsDialog(
				{
					syncState: mailboxMigrationSyncState,
					userMigrationInformation,
					oauthHandlerFactory: (config, serviceExecutor) => new OAuthHandler(config, serviceExecutor),
				},
				async (dialog, updatedCredentials) => {
					if (updatedCredentials) {
						mailboxMigrationSyncState.imapConfiguration = updatedCredentials.mailboxMigrationImapConfiguration
						mailboxMigrationSyncState.status = MailboxMigrationSyncStatus.PAUSED
						await this.entityClient.update(mailboxMigrationSyncState)
						if (updatedCredentials.userMigrationInformation) {
							await this.entityClient.update(updatedCredentials.userMigrationInformation)
						}
						await this.continueImport(mailboxMigrationSyncState._id)
						dialog.close()
					} else {
						// Think of case we don't have the updated account sucessfully?
					}
				},
				() => {
					this.isDisplayingOauthCredentialPopup = false
				},
			)
		}
	}
	//Changes here probably unnecessary. test without.
	async initUiSessions() {
		this.mailboxDetails = await this.mailboxModel.getMailboxDetails()
		this.selectedMailBoxDetail = first(this.mailboxDetails)
		await this.mailboxImporter.init(this.mailboxDetails.map((detail) => detail.mailbox))
		await this.updateActiveUiSessions()
	}

	async init(mailboxesOfUser: MailBox[]): Promise<void> {
		await this.mailboxImporter.init(mailboxesOfUser)

		if (this.migrationResyncIntervalId == null) {
			this.migrationResyncIntervalId = setInterval(() => {
				this.resyncAllImports()
			}, MIGRATION_RESYNC_INTERVAL_MS)
		}
	}

	async initializeImport(initializeImportParams: InitializeMigrationParams) {
		this.isInStateTransition = true
		const mailboxImportSession = await this.mailboxImporter.initializeNewImport(initializeImportParams)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
		return mailboxImportSession
	}

	private async resyncAllImports() {
		for (const session of await this.mailboxImporter.getMailboxImportSessions()) {
			// we only resync in case we are done or postponed (e.g. when an error or rate limit occurs)
			if (
				session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.FINISHED ||
				session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.POSTPONED
			) {
				const mailboxMigrationSyncStateId = session.mailboxMigrationSyncState._id
				await this.continueImport(mailboxMigrationSyncStateId)
			}
		}
	}

	async continueImport(mailboxMigrationSyncStateId: IdTuple, isForceRetry: boolean = false, retryAttempts: number = 0): Promise<ImportResult> {
		this.isInStateTransition = true

		try {
			return await this.mailboxImporter.continueImport(mailboxMigrationSyncStateId, isForceRetry)
		} catch (e) {
			console.log(`failed to continue migration sync for mailboxMigrationSyncState: ${mailboxMigrationSyncStateId}`, e)

			if (this.migrationErrorHandler.isAuthError(e) && retryAttempts < 1) {
				await this.pauseImport(mailboxMigrationSyncStateId)
				const shouldRetry = await this.migrationErrorHandler.handleMigrationError(e, undefined, mailboxMigrationSyncStateId)
				if (shouldRetry) {
					return await this.continueImport(mailboxMigrationSyncStateId, false, 1)
				} else {
					const postponedUntilDate = new Date(Date.now() + MIGRATION_AUTH_ERROR_POSTPONE_TIME)
					await this.mailboxImporter.postponeImport(mailboxMigrationSyncStateId, postponedUntilDate)
					return Promise.resolve({
						state: { status: MailboxMigrationSyncStatus.POSTPONED, postponedUntil: postponedUntilDate },
						remoteStateId: mailboxMigrationSyncStateId,
					})
				}
			} else if (this.migrationErrorHandler.isGmailAllMailsIMAPDisabledError(e)) {
				await this.mailboxImporter.setGmailAllMailsImapDisabledOnImport(mailboxMigrationSyncStateId)
				return Promise.resolve({
					state: { status: MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR },
					remoteStateId: mailboxMigrationSyncStateId,
				})
			} else {
				const postponedUntilDate = new Date(Date.now() + MIGRATION_ERROR_POSTPONE_TIME)
				await this.mailboxImporter.postponeImport(mailboxMigrationSyncStateId, postponedUntilDate)
				return Promise.resolve({
					state: { status: MailboxMigrationSyncStatus.POSTPONED, postponedUntil: postponedUntilDate },
					remoteStateId: mailboxMigrationSyncStateId,
				})
			}
		} finally {
			this.isInStateTransition = false
		}
	}

	async continueAllImportsAfterLogin() {
		for (const session of await this.mailboxImporter.getMailboxImportSessions()) {
			// in case a user manually paused or canceled a sync task we do not want to continue it after login nor if there are errors.
			if (
				session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.CANCELED ||
				session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.PAUSED ||
				session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.AUTH_ERROR ||
				session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.ERROR
			) {
				continue
			}

			const mailboxMigrationSyncStateId = session.mailboxMigrationSyncState._id
			await this.continueImport(mailboxMigrationSyncStateId)
		}
	}

	async pauseImport(accountSyncStateId: IdTuple) {
		this.isInStateTransition = true
		await this.mailboxImporter.pauseImport(accountSyncStateId)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
	}

	async stopLocalImport(accountSyncStateId: IdTuple) {
		this.isInStateTransition = true
		await this.mailboxImporter.stopLocalImport(accountSyncStateId)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
	}

	async deleteImport(accountSyncStateId: IdTuple) {
		this.isInStateTransition = true
		await this.mailboxImporter.deleteImport(accountSyncStateId)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
	}

	hasActiveSync() {
		return this.activeMigrationUiSessions.length > 0
	}

	hasCanceledSync() {
		return this.canceledMigrationUiSessions.length > 0
	}

	async updateActiveUiSessions() {
		const { activeSessions, canceledSessions } = await this.mailboxImporter.getMailboxImportUiSessions()
		this.activeMigrationUiSessions = activeSessions
		this.canceledMigrationUiSessions = canceledSessions
		m.redraw()
	}

	shouldRenderPauseButton(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.RUNNING
	}

	shouldRenderResyncButton(session: MailboxMigrationUiSession) {
		return (
			session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.FINISHED ||
			session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.POSTPONED ||
			session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.AUTH_ERROR ||
			session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR
		)
	}

	shouldRenderPlayButton(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.PAUSED
	}

	shouldRenderPauseIcon(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.PAUSED
	}

	shouldRenderClockIcon(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.POSTPONED
	}

	shouldRenderCheckmarkIcon(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.FINISHED
	}

	shouldRenderErrorIcon(session: MailboxMigrationUiSession) {
		return (
			session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.ERROR ||
			session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR
		)
	}

	shouldRenderAuthErrorIcon(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.AUTH_ERROR
	}

	shouldRenderGmailAllMailsIMAPDisabledErrorMessage(session: MailboxMigrationUiSession) {
		return session.mailboxMigrationSyncStatus === MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR
	}

	shouldDisableButtons() {
		return this.isInStateTransition
	}

	getDestinationMailboxDetailForSession(session: MailboxMigrationUiSession) {
		return this.mailboxDetails.find((mailboxDetail) => mailboxDetail.mailGroupInfo.group === session.mailGroupId)
	}

	async doInitialFetchMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationUiGetMailboxResult> {
		const migrationUiGetMailboxResult: MigrationUiGetMailboxResult = {}
		try {
			const migrationMailboxes = await this.mailboxImporter.getMigrationMailboxesFromServer(migrationCredentials)
			migrationUiGetMailboxResult.result = {
				migrationMailboxes: migrationMailboxes,
				migrationCredentials: migrationCredentials,
			}
		} catch (e) {
			if (!this.migrationErrorHandler.isMigrationError(e)) {
				throw e
			}
			const migrationErrorHandlerResult = await this.migrationErrorHandler.handleMigrationError(e, migrationCredentials)
			if (migrationErrorHandlerResult.shouldRetry) {
				const updatedMigrationCredentials = migrationErrorHandlerResult.updatedMigrationCredentials ?? migrationCredentials
				return await this.doInitialFetchMailboxes(updatedMigrationCredentials)
			}
			migrationUiGetMailboxResult.error = migrationErrorHandlerResult.readableMigrationError
		}
		return migrationUiGetMailboxResult
	}

	async getFolderSystemForSelectedMailbox() {
		const selectedMailBoxDetail = assertNotNull(this.selectedMailBoxDetail)
		await this.mailModel.init()
		const ownerGroup = assertNotNull(selectedMailBoxDetail.mailbox._ownerGroup)
		return assertNotNull(this.mailModel.getFolderSystemByGroupId(ownerGroup))
	}

	async constructMigrationMailboxesToTutaFoldersMap(migrationMailboxes: ReadonlyArray<MigrationMailbox>): Promise<Map<string, MailSetMapping>> {
		const migrationMailboxesToTutaFolders = new Map<string, MailSetMapping>()
		const folderSystem = await this.getFolderSystemForSelectedMailbox()
		for (const migrationMailbox of migrationMailboxes) {
			if (migrationMailbox.specialUse) {
				const systemFolderType = getSpecialUseAsSystemFolderType(migrationMailbox)
				if (systemFolderType !== null) {
					const systemFolder = assertNotNull(folderSystem.getSystemFolderByType(systemFolderType))
					migrationMailboxesToTutaFolders.set(migrationMailbox.sourceId, {
						mailSetElementId: getElementId(systemFolder),
						shouldSync: true,
						specialUse: migrationMailbox.specialUse,
					})
				}
			} else {
				const customFolders = folderSystem.getCustomFoldersOfParent(null)
				const matchingFolder = customFolders.find((customFolder) => migrationMailbox.name && customFolder.name === migrationMailbox.name)
				if (migrationMailbox.name && matchingFolder) {
					migrationMailboxesToTutaFolders.set(migrationMailbox.sourceId, {
						mailSetElementId: getElementId(matchingFolder),
						shouldSync: true,
						specialUse: null,
					})
				}
			}
		}
		return migrationMailboxesToTutaFolders
	}

	onNewMailboxSelected(newMailboxDetail: MailboxDetail) {
		this.selectedMailBoxDetail = newMailboxDetail
	}

	async openOauthAuthenticationWindow(url: string, redirectUrl: string) {
		return await this.oauthFacade.openOauthWindow(url, redirectUrl)
	}

	getInitialMigrationData() {
		const migrationData: MigrationData = {
			imapAccountHost: "",
			imapAccountPort: 993,
			imapAccountUsername: "",
			imapAccountPassword: "",
			rootImportMailSetName: "",
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED,
			newlyCreatedFolders: new Set(),
			matchMigrationMailboxesToTutaMailSets: true,
			isMigratingServerSupportingOAuth: false,
			addLabelToImportedMails: true,
			migrationSyncLabelData: null,
			migrationMailboxes: [],
			folderSystem: new FolderSystem([]),
			mailboxMigrationProvider: MailboxMigrationProvider.Other,
			customCertificateData: null,
			ignoreCertificateErrors: false,
			useSSL: true,
		}

		if (!env.dist) {
			// for test, we initialize with default values
			// migrationData.imapAccountHost = "localhost"
			// migrationData.imapAccountPort = 143
			// migrationData.imapAccountUsername = "infraimaptest@gmail.com"
			// migrationData.imapAccountPassword = "password"
			// migrationData.rootImportMailSetName = "root"
		}

		return migrationData
	}
}
