import { assertMainOrNode } from "@tutao/app-env"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { ImapImportSession } from "../../workerUtils/imapimport/ImapImportSession"
import { ImapImporter, ImportResult, InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter"
import { MailModel } from "../../mail/model/MailModel"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { OAuthHandler, OAuthHandlerFactory } from "./oauth/OAuthHandler"
import { assertNotNull, first, promiseMap } from "@tutao/utils"
import { ImapError, ImapErrorCause } from "../../../common/api/common/utils/imapImportUtils/ImapError"
import { ImapAccountSyncStateTypeRef } from "@tutao/entities/tutanota"
import { getConfigForProvider, ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { tokenEndpointResponseToOAuthTokenEndpointResponse } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { getElementId } from "@tutao/meta"
import { ImapAccountSyncStatus, ImapFolderSyncStatus } from "../../../../entities/tutanota/Utils"
import { ImapCredentials } from "../../../common/api/common/utils/imapImportUtils/ImapSyncState"
import { ImapMailbox } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox"
import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"

assertMainOrNode()

export class ImapImportController {
	public mailboxDetails: MailboxDetail[] = []
	public selectedMailBoxDetail: MailboxDetail | null = null
	// Visible for testing
	activeImapImportSessions: Map<string, ImapImportSession> = new Map()
	constructor(
		private readonly imapImporter: ImapImporter,
		private readonly mailModel: MailModel,
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
		private readonly oauthFacade: OauthFacade,
		private readonly oauthHandlerFactory: OAuthHandlerFactory = (config) => new OAuthHandler(config),
	) {}

	async init(): Promise<void> {
		this.mailboxDetails = await this.mailboxModel.getMailboxDetails()
		this.selectedMailBoxDetail = first(this.mailboxDetails)
		await this.updateActiveSessions()
	}

	async initializeImport(initializeImportParams: InitializeImapImportParams) {
		return await this.imapImporter.initializeImport(initializeImportParams)
	}

	async continueImport(imapAccountSyncStateId: IdTuple, retryCount: number = 0): Promise<ImportResult> {
		if (retryCount > 1) {
			return { error: new ImapError({}, ImapErrorCause.AUTH_FAILED_REFRESH_TOKEN) }
		}
		const importResult = await this.imapImporter.continueImport(imapAccountSyncStateId)
		if (importResult.error && importResult.error.cause === ImapErrorCause.AUTH_FAILED) {
			const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
			const provider = parseInt(imapAccountSyncState.provider) as ImapProvider
			const config = getConfigForProvider(provider)?.oauthConfig
			if (config && imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse?.refreshToken) {
				const oauthHandler = this.oauthHandlerFactory(config)
				await oauthHandler.setupOauthLoginParams()
				const tokenEndpointResponse = await oauthHandler.refreshTokens(imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse?.refreshToken)
				imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse = tokenEndpointResponseToOAuthTokenEndpointResponse(tokenEndpointResponse)
				await this.entityClient.update(imapAccountSyncState)
				return await this.continueImport(imapAccountSyncStateId, 1)
			}
		}
		return importResult
	}

	async pauseImport(accountSyncStateId: IdTuple) {
		await this.imapImporter.pauseImport(accountSyncStateId)
	}

	async deleteImport(accountSyncStateId: IdTuple) {
		await this.imapImporter.deleteImport(accountSyncStateId)
	}

	async pauseImports() {
		await promiseMap(Array.from(this.activeImapImportSessions.values()), async (session) => {
			await this.imapImporter.pauseImport(session.imapAccountSyncState._id)
		})
	}

	async updateActiveSessions() {
		const sessions = await this.imapImporter.getActiveImapImportSessions()
		this.activeImapImportSessions = new Map(
			Array.from(sessions.entries()).map(([key, session]) => {
				session.syncProgress = {
					completed: session.imapFolderSyncStates.filter((f) => f.status === ImapFolderSyncStatus.FINISHED).length,
					total: session.imapFolderSyncStates.length,
				}
				return [key, session]
			}),
		)
	}

	shouldRenderPauseButton(session: ImapImportSession) {
		return session.imapAccountSyncState.status === ImapAccountSyncStatus.RUNNING || session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED
	}

	shouldRenderResyncButton(session: ImapImportSession) {
		return session.imapAccountSyncState.status === ImapAccountSyncStatus.PAUSED || session.imapAccountSyncState.status === ImapAccountSyncStatus.FINISHED
	}

	shouldRenderPauseIcon(session: ImapImportSession) {
		return session.imapAccountSyncState.status === ImapAccountSyncStatus.PAUSED
	}

	shouldRenderClockIcon(session: ImapImportSession) {
		return session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED
	}

	getDestinationMailboxDetailForSession(session: ImapImportSession) {
		return this.mailboxDetails.find((mailboxDetail) => mailboxDetail.mailGroupInfo.group === session.imapAccountSyncState._ownerGroup)
	}

	getActiveImapImportSessions() {
		return this.activeImapImportSessions
	}

	async getImapMailboxesFromServer(imapAccount: ImapCredentials) {
		return await this.imapImporter.getImapMailboxesFromServer(imapAccount)
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
				const systemFolderType = ImapMailbox.getSpecialUseAsSystemFolderType(imapMailbox)
				if (systemFolderType !== null) {
					const systemFolder = assertNotNull(folderSystem.getSystemFolderByType(systemFolderType))
					imapMailboxesToTutaFolders.set(imapMailbox.path, getElementId(systemFolder))
				}
			}
			const customFolders = folderSystem.getCustomFoldersOfParent(null)
			const matchingFolder = customFolders.find((customFolder) => imapMailbox.name && customFolder.name === imapMailbox.name)
			if (imapMailbox.name && matchingFolder) {
				imapMailboxesToTutaFolders.set(imapMailbox.name, getElementId(matchingFolder))
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
}
