import { assertMainOrNode, ProgrammingError } from "@tutao/app-env"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { ImapImporter, ImportResult, InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter"
import { MailModel } from "../../mail/model/MailModel"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { assertNotNull, first, promiseMap } from "@tutao/utils"
import { ImapAccountSyncStateTypeRef } from "@tutao/entities/tutanota"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { collapseId, getElementId, OperationType } from "@tutao/meta"
import { ImapAccountSyncStatus } from "../../../../entities/tutanota/Utils"
import { ImapCredentials } from "../../../common/api/common/utils/imapImportUtils/ImapSyncContext"
import { getSpecialUseAsSystemFolderType, ImapMailbox } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"
import m from "mithril"
import { ImapImportData } from "./AddImapImportWizard"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef, OnEntityUpdateReceivedPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { showUpdateImapCredentialsDialog } from "../../../common/gui/dialogs/UpdateImapCredentialsDialog"
import { OAuthHandler } from "./oauth/OAuthHandler"

assertMainOrNode()

export type ImapImportUiSession = {
	imapAccountSyncStateId: IdTuple
	mailGroupId: Id
	sourceImapAddress: string
	imapAccountSyncStatus: ImapAccountSyncStatus
	postponedUntil: Date
	syncProgress: {
		completed: number
		total: number
	}
}

export class ImapMailImportController {
	private isInStateTransition = false
	public mailboxDetails: MailboxDetail[] = []
	public selectedMailBoxDetail: MailboxDetail | null = null
	public activeImapImportUiSessions: ImapImportUiSession[] = []

	constructor(
		private readonly imapImporter: ImapImporter,
		private readonly mailModel: MailModel,
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
		private readonly oauthFacade: OauthFacade,
		private readonly eventController: EventController,
	) {
		this.eventController.addEntityListener({
			onEntityUpdatesReceived: (updates) => this.entityEventsReceived(updates),
			priority: OnEntityUpdateReceivedPriority.HIGH,
		})
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImapAccountSyncStateTypeRef, update)) {
				if (update.operation === OperationType.UPDATE) {
					const imapAccountSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
					const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)

					const shouldDisplayCredentialsDialog = imapAccountSyncState.status === ImapAccountSyncStatus.AUTH_ERROR
					if (shouldDisplayCredentialsDialog) {
						showUpdateImapCredentialsDialog(
							{ syncState: imapAccountSyncState, oauthHandlerFactory: (config) => new OAuthHandler(config) },
							(dialog, updatedAccount) => {
								if (updatedAccount) {
									imapAccountSyncState.imapAccount = updatedAccount
									imapAccountSyncState.status = ImapAccountSyncStatus.PAUSED
									this.entityClient
										.update(imapAccountSyncState)
										.then(() => {
											this.imapImporter.continueImport(imapAccountSyncStateId)
										})
										.finally(() => dialog.close())
								}
							},
						)
					}
					const shouldDisplayErrorDialog = imapAccountSyncState.status === ImapAccountSyncStatus.ERROR
					if (shouldDisplayErrorDialog) {
						throw new ProgrammingError("The sync has encountered an irrecoverable problem, please start over...")
					}
				}
			}
		}
	}

	async init(): Promise<void> {
		this.mailboxDetails = await this.mailboxModel.getMailboxDetails()
		this.selectedMailBoxDetail = first(this.mailboxDetails)
		await this.updateActiveUiSessions()
	}

	async initializeImport(initializeImportParams: InitializeImapImportParams) {
		this.isInStateTransition = true
		const imapImportSession = await this.imapImporter.initializeNewImport(initializeImportParams)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
		return imapImportSession
	}

	async continueImport(imapAccountSyncStateId: IdTuple): Promise<ImportResult> {
		this.isInStateTransition = true

		try {
			return await this.imapImporter.continueImport(imapAccountSyncStateId)
		} catch (e) {
			console.log(`failed to continue imap sync for imapAccountSyncState: ${imapAccountSyncStateId}`, e)
			return Promise.reject(e)
		} finally {
			this.isInStateTransition = false
		}
	}

	async pauseImport(accountSyncStateId: IdTuple) {
		this.isInStateTransition = true
		await this.imapImporter.pauseImport(accountSyncStateId)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
	}

	async deleteImport(accountSyncStateId: IdTuple) {
		this.isInStateTransition = true
		await this.imapImporter.deleteImport(accountSyncStateId)
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
	}

	async pauseImports() {
		this.isInStateTransition = true
		await promiseMap(this.activeImapImportUiSessions, async (session) => {
			await this.imapImporter.pauseImport(session.imapAccountSyncStateId)
		})
		await this.updateActiveUiSessions()
		this.isInStateTransition = false
	}

	hasActiveSync() {
		return this.activeImapImportUiSessions.length > 0
	}

	async updateActiveUiSessions() {
		this.activeImapImportUiSessions = await this.imapImporter.getActiveImapImportUiSessions()
		m.redraw()
	}

	shouldRenderPauseButton(session: ImapImportUiSession) {
		return session.imapAccountSyncStatus === ImapAccountSyncStatus.RUNNING
	}

	shouldRenderResyncButton(session: ImapImportUiSession) {
		return session.imapAccountSyncStatus === ImapAccountSyncStatus.FINISHED || session.imapAccountSyncStatus === ImapAccountSyncStatus.POSTPONED
	}

	shouldRenderPlayButton(session: ImapImportUiSession) {
		return session.imapAccountSyncStatus === ImapAccountSyncStatus.PAUSED
	}

	shouldRenderPauseIcon(session: ImapImportUiSession) {
		return session.imapAccountSyncStatus === ImapAccountSyncStatus.PAUSED
	}

	shouldRenderClockIcon(session: ImapImportUiSession) {
		return session.imapAccountSyncStatus === ImapAccountSyncStatus.POSTPONED
	}

	shouldRenderCheckmarkIcon(session: ImapImportUiSession) {
		return session.imapAccountSyncStatus === ImapAccountSyncStatus.FINISHED
	}

	shouldDisableButtons() {
		return this.isInStateTransition
	}

	getDestinationMailboxDetailForSession(session: ImapImportUiSession) {
		return this.mailboxDetails.find((mailboxDetail) => mailboxDetail.mailGroupInfo.group === session.mailGroupId)
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials) {
		return await this.imapImporter.getImapMailboxesFromServer(imapCredentials)
	}

	async getFolderSystemForSelectedMailbox() {
		const selectedMailBoxDetail = assertNotNull(this.selectedMailBoxDetail)
		await this.mailModel.init()
		const ownerGroup = assertNotNull(selectedMailBoxDetail.mailbox._ownerGroup)
		return assertNotNull(this.mailModel.getFolderSystemByGroupId(ownerGroup))
	}

	async constructImapMailboxesToTutaFoldersMap(imapMailboxes: ReadonlyArray<ImapMailbox>): Promise<Map<string, Id>> {
		const imapMailboxesToTutaFolders = new Map<string, Id>()
		const folderSystem = await this.getFolderSystemForSelectedMailbox()
		for (const imapMailbox of imapMailboxes) {
			if (imapMailbox.specialUse) {
				const systemFolderType = getSpecialUseAsSystemFolderType(imapMailbox)
				if (systemFolderType !== null) {
					const systemFolder = assertNotNull(folderSystem.getSystemFolderByType(systemFolderType))
					imapMailboxesToTutaFolders.set(imapMailbox.path, getElementId(systemFolder))
				}
			} else {
				const customFolders = folderSystem.getCustomFoldersOfParent(null)
				const matchingFolder = customFolders.find((customFolder) => imapMailbox.name && customFolder.name === imapMailbox.name)
				if (imapMailbox.name && matchingFolder) {
					imapMailboxesToTutaFolders.set(imapMailbox.name, getElementId(matchingFolder))
				}
			}
		}
		return imapMailboxesToTutaFolders
	}

	onNewMailboxSelected(newMailboxDetail: MailboxDetail) {
		this.selectedMailBoxDetail = newMailboxDetail
	}

	async openOauthAuthenticationWindow(url: string, redirectUrl: string) {
		return await this.oauthFacade.openOauthWindow(url, redirectUrl)
	}

	getInitialImapImportData() {
		const imapImportData: ImapImportData = {
			imapAccountHost: "",
			imapAccountPort: 993,
			imapAccountUsername: "",
			imapAccountPassword: "",
			rootImportMailFolderName: "",
			imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED,
			matchImapMailboxesToTutaMailSets: false,
			isImapServerSupportingOAuth: false,
			revealImapAccountPassword: false,
			addLabelToImportedMails: false,
			imapSyncLabelData: null,
			imapMailboxes: [],
			folderSystem: new FolderSystem([]),
			imapProvider: ImapProvider.Other,
		}

		if (!env.dist) {
			// for test, we initialize with default values
			imapImportData.imapAccountHost = "localhost"
			imapImportData.imapAccountPort = 143
			imapImportData.imapAccountUsername = "user@test.com"
			imapImportData.imapAccountPassword = "password"
			imapImportData.rootImportMailFolderName = "root"
		}

		return imapImportData
	}
}
