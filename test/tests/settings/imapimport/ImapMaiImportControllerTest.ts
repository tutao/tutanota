import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { MailboxImporter, ImportResult, InitializeMailboxImportParams } from "../../../../src/applications/mail-app/workerUtils/imapimport/MailboxImporter"
import { newMailboxImportSession } from "../../../../src/applications/mail-app/workerUtils/imapimport/MailboxImportSession"
import { createTestEntity } from "../../TestUtils"
import { ImapError, ImapErrorCause } from "../../../../src/applications/common/api/common/error/ImapError"
import { MailboxMigrationProvider } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/ImapKnownConfigs"
import { ImapCredentials } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/ImapSyncContext"
import { ImapMailbox, ImapMailboxSpecialUse } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/ImapMailbox"
import { MailboxMigrationSyncStatus, MailboxMigrationFolderSyncStatus, MailSetKind } from "../../../../src/entities/tutanota/Utils"
import { MailModel } from "../../../../src/applications/mail-app/mail/model/MailModel"
import { MailboxDetail, MailboxModel } from "../../../../src/applications/common/mailFunctionality/MailboxModel"
import { EntityClient } from "../../../../src/platform-kit/network/EntityClient"
import { OauthFacade } from "../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { MailboxImportUiSession, ImapMailImportController } from "../../../../src/applications/mail-app/settings/imapimport/ImapMailImportController"
import {
	MailboxMigrationImapConfigurationTypeRef,
	MailboxMigrationSyncStateTypeRef,
	MailSetTypeRef,
	MailboxMigrationFolderSyncStateTypeRef,
	OAuthTokenEndpointResponseLegacyTypeRef,
} from "@tutao/entities/tutanota"
import { FolderSystem } from "../../../../src/applications/common/api/common/mail/FolderSystem"
import { ImapErrorHandler } from "../../../../src/applications/mail-app/settings/imapimport/ImapErrorHandler"
import { EventController } from "../../../../src/applications/common/api/main/EventController"

const { anything } = matchers

o.spec("ImapMailImportController", () => {
	let imapImporter: MailboxImporter
	let mailModel: MailModel
	let mailboxModel: MailboxModel
	let entityClient: EntityClient
	let oauthFacade: OauthFacade
	let controller: ImapMailImportController
	let eventController: EventController
	let oAuthErrorHandler: ImapErrorHandler

	const mailboxDetail1Mock: MailboxDetail = {
		mailGroupInfo: { group: "group1" },
		mailbox: { _ownerGroup: "group1" },
	} as any
	const mailboxDetail2Mock: MailboxDetail = {
		mailGroupInfo: { group: "group2" },
		mailbox: { _ownerGroup: "group2" },
	} as any
	const mailboxMigrationSyncStateIdMock: IdTuple = ["mailboxMigrationSyncStateListId", "mailboxMigrationSyncStateElementId"]
	const mailboxMigrationSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
		_id: mailboxMigrationSyncStateIdMock,
		_ownerGroup: "group1",
		mailboxMigrationFolderSyncStates: "folderSyncStateListId",
		status: MailboxMigrationSyncStatus.RUNNING.toString(),
	})
	const folderSyncStateMock = createTestEntity(MailboxMigrationFolderSyncStateTypeRef, {
		_id: ["folderSyncStateListId", "folderSyncStateElementId"],
		status: MailboxMigrationFolderSyncStatus.FINISHED,
	})

	o.beforeEach(() => {
		imapImporter = object<MailboxImporter>()
		mailModel = object<MailModel>()
		mailboxModel = object<MailboxModel>()
		entityClient = object<EntityClient>()
		oauthFacade = object<OauthFacade>()
		eventController = object<EventController>()
		oAuthErrorHandler = object<ImapErrorHandler>()
		controller = new ImapMailImportController(imapImporter, mailModel, mailboxModel, entityClient, eventController, oauthFacade, oAuthErrorHandler)
	})

	o.test("init - loads mailbox details", async () => {
		when(mailboxModel.getMailboxDetails()).thenResolve([mailboxDetail1Mock, mailboxDetail2Mock])
		const imapImportSession = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		imapImportSession.imapFolderSyncStates = [{ ...folderSyncStateMock, status: MailboxMigrationFolderSyncStatus.FINISHED }]
		const activeSessions = [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateMock._id } as MailboxImportUiSession] as MailboxImportUiSession[]
		when(imapImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.initUiSessions()
		o.check(controller.mailboxDetails).deepEquals([mailboxDetail1Mock, mailboxDetail2Mock])
		o.check(controller.selectedMailBoxDetail).equals(mailboxDetail1Mock)
	})

	o.test("initializeImport - delegates to imapImporter", async () => {
		const params = {} as InitializeMailboxImportParams
		const expectedSession = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		when(imapImporter.initializeNewImport(params)).thenResolve(expectedSession)
		const activeSessions = [
			{ mailboxMigrationSyncStateId: expectedSession.mailboxMigrationSyncState._id } as MailboxImportUiSession,
		] as MailboxImportUiSession[]
		when(imapImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		const result = await controller.initializeImport(params)

		o.check(result).equals(expectedSession)
		verify(imapImporter.initializeNewImport(params), { times: 1 })
	})

	o.test("continueImport - returns result on success", async () => {
		const successResult: ImportResult = {
			state: { status: mailboxMigrationSyncStateMock.status as MailboxMigrationSyncStatus },
			remoteStateId: mailboxMigrationSyncStateIdMock,
		}
		when(imapImporter.continueImport(mailboxMigrationSyncStateIdMock, false)).thenResolve(successResult)

		const result = await controller.continueImport(mailboxMigrationSyncStateIdMock)

		o.check(result).equals(successResult)
		verify(imapImporter.continueImport(mailboxMigrationSyncStateIdMock, false), { times: 1 })
	})

	o.test("continueImport - handles AUTH_FAILED", async () => {
		const authError = new ImapError("authentication failed when starting IMAP sync", ImapErrorCause.AUTH_FAILED)
		const successResult: ImportResult = {
			state: { status: mailboxMigrationSyncStateMock.status as MailboxMigrationSyncStatus },
			remoteStateId: mailboxMigrationSyncStateIdMock,
		}
		when(imapImporter.continueImport(mailboxMigrationSyncStateIdMock, false)).thenReject(authError, successResult)

		mailboxMigrationSyncStateMock.legacyProvider = MailboxMigrationProvider.Gmail.toString()
		mailboxMigrationSyncStateMock.imapConfiguration = createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
			sharedOauthToken: createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
				refreshToken: "oldRefreshToken123",
			}),
		})
		when(entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateIdMock)).thenResolve(mailboxMigrationSyncStateMock)

		const imapErrorHandler = object<ImapErrorHandler>()
		when(imapErrorHandler.isAuthError(authError)).thenReturn(true)
		when(imapErrorHandler.handleImapError(authError, undefined, mailboxMigrationSyncStateIdMock)).thenResolve({ shouldRetry: true })
		when(entityClient.update(mailboxMigrationSyncStateMock)).thenResolve()

		controller = new ImapMailImportController(imapImporter, mailModel, mailboxModel, entityClient, eventController, oauthFacade, imapErrorHandler)
		when(imapImporter.getImapImportSessions()).thenResolve([newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)])
		when(imapImporter.getMailboxImportUiSessions()).thenResolve({
			activeSessions: [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxImportUiSession] as MailboxImportUiSession[],
		})
		await controller.continueImport(mailboxMigrationSyncStateIdMock)

		verify(imapErrorHandler.handleImapError(authError, undefined, mailboxMigrationSyncStateIdMock), { times: 1 })
		verify(imapImporter.continueImport(mailboxMigrationSyncStateIdMock, false), { times: 2 })
	})

	o.test("continueImport - handles startSync error and postpones", async () => {
		mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.PAUSED
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		when(imapImporter.getImapImportSessions()).thenResolve([newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)])
		when(imapImporter.getMailboxImportUiSessions()).thenResolve({
			activeSessions: [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxImportUiSession] as MailboxImportUiSession[],
		})

		const imapError = new ImapError("Connection failed", ImapErrorCause.UNKNOWN)
		when(imapImporter.continueImport(mailboxMigrationSyncStateMock._id, anything())).thenReject(imapError)
		const importResult = await controller.continueImport(mailboxMigrationSyncStateMock._id)

		o.check(importResult.state.status).deepEquals(MailboxMigrationSyncStatus.POSTPONED)
		verify(imapImporter.postponeImport(mailboxMigrationSyncStateMock._id, anything()), { times: 1 })
	})

	o.test("continue import rejects when error happens", async () => {
		when(imapImporter.continueImport(mailboxMigrationSyncStateIdMock)).thenReject(new ImapError("Some error", 1))
		try {
			await controller.continueImport(mailboxMigrationSyncStateIdMock)
		} catch (imapException) {
			o(imapException.message).equals("Some error")
			o(imapException.data.cause).equals(1)
		}
	})

	o.test("pauseImport - delegates to imapImporter", async () => {
		const activeSessions = [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxImportUiSession] as MailboxImportUiSession[]
		when(imapImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.pauseImport(mailboxMigrationSyncStateIdMock)
		verify(imapImporter.pauseImport(mailboxMigrationSyncStateIdMock), { times: 1 })
	})

	o.test("deleteImport - delegates to imapImporter", async () => {
		const activeSessions = [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxImportUiSession] as MailboxImportUiSession[]
		when(imapImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.deleteImport(mailboxMigrationSyncStateIdMock)
		verify(imapImporter.deleteImport(mailboxMigrationSyncStateIdMock), { times: 1 })
	})

	o.test("shouldRenderPauseButton - returns true for RUNNING", () => {
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxImportUiSession)).equals(true)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxImportUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxImportUiSession)).equals(false)
	})

	o.test("shouldRenderResyncButton - returns true for FINISHED and POSTPONED", () => {
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxImportUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxImportUiSession)).equals(true)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxImportUiSession)).equals(false)
	})

	o.test("shouldRenderPlayButton - returns true for PAUSED", () => {
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxImportUiSession)).equals(true)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxImportUiSession)).equals(false)
	})

	o.test("shouldRenderPauseIcon - returns true only for PAUSED", () => {
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxImportUiSession)).equals(true)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxImportUiSession)).equals(false)
	})

	o.test("shouldRenderClockIcon - returns true only for POSTPONED", () => {
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxImportUiSession)).equals(true)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxImportUiSession)).equals(false)
	})

	o.test("shouldRenderCheckmarkIcon - returns true only for FINISHED", () => {
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxImportUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxImportUiSession)).equals(false)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxImportUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxImportUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxImportUiSession)).equals(false)
	})

	o.test("getDestinationMailboxDetailForSession - finds mailbox by owner group", () => {
		controller.mailboxDetails = [mailboxDetail1Mock, mailboxDetail2Mock]
		const session = { mailGroupId: "group2" } as MailboxImportUiSession
		const result = controller.getDestinationMailboxDetailForSession(session)
		o.check(result).equals(mailboxDetail2Mock)
	})

	o.test("getImapMailboxesFromServer - delegates to imapImporter", async () => {
		const imapCredentials = {} as ImapCredentials
		const expected = { result: { imapMailboxes: [], imapCredentials: imapCredentials } }
		when(imapImporter.getImapMailboxesFromServer(imapCredentials)).thenResolve([])
		const result = await controller.doInitialConnectAndGetImapMailboxes(imapCredentials)
		o.check(result).deepEquals(expected)
	})

	o.test("getFolderSystemForSelectedMailbox - returns folder system for selected mailbox", async () => {
		const selectedMailboxDetail = { mailbox: { _ownerGroup: "group1" } } as MailboxDetail
		controller.selectedMailBoxDetail = selectedMailboxDetail
		const folderSystemMock = object<FolderSystem>()
		when(mailModel.init()).thenResolve()
		when(mailModel.getFolderSystemByGroupId("group1")).thenReturn(folderSystemMock)

		const result = await controller.getFolderSystemForSelectedMailbox()
		o.check(result).equals(folderSystemMock)
	})

	o.test("constructImapMailboxesToTutaFoldersMap - maps special use folders and custom folders", async () => {
		const imapMailboxes: ImapMailbox[] = [
			{ path: "INBOX", specialUse: ImapMailboxSpecialUse.INBOX, name: "INBOX" },
			{ path: "Custom", name: "Custom" },
		]
		const folderSystem = new FolderSystem([
			createTestEntity(MailSetTypeRef, {
				_id: ["mailSetListId", "inboxFolderId"],
				_ownerGroup: "group1",
				folderType: MailSetKind.INBOX,
			}),
			createTestEntity(MailSetTypeRef, {
				_id: ["mailSetListId", "customFolderId"],
				_ownerGroup: "group1",
				folderType: MailSetKind.CUSTOM,
				name: "Custom",
			}),
		])
		controller.selectedMailBoxDetail = { mailbox: { _ownerGroup: "group1" } } as MailboxDetail
		when(mailModel.getFolderSystemByGroupId("group1")).thenReturn(folderSystem)
		const result = await controller.constructImapMailboxesToTutaFoldersMap(imapMailboxes)

		o.check(result.get("INBOX")?.mailSetElementId).equals("inboxFolderId")
		o.check(result.get("Custom")?.mailSetElementId).equals("customFolderId")
	})

	o.test("onNewMailboxSelected - updates selectedMailBoxDetail", () => {
		const newDetail = {} as MailboxDetail
		controller.onNewMailboxSelected(newDetail)
		o.check(controller.selectedMailBoxDetail).equals(newDetail)
	})

	o.test("openOauthAuthenticationWindow - delegates to oauthFacade", async () => {
		const url = "https://example.com"
		const redirectUrl = "https://redirect.com"
		const expected = "code"
		when(oauthFacade.openOauthWindow(url, redirectUrl)).thenResolve(expected)
		const result = await controller.openOauthAuthenticationWindow(url, redirectUrl)
		o.check(result).equals(expected)
	})
})
