import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { ImapImporter, ImportResult, InitializeImapImportParams } from "../../../../src/applications/mail-app/workerUtils/imapimport/ImapImporter"
import { newImapImportSession } from "../../../../src/applications/mail-app/workerUtils/imapimport/ImapImportSession"
import { createTestEntity } from "../../TestUtils"
import { ImapError, ImapErrorCause } from "../../../../src/applications/common/api/common/error/ImapError"
import { ImapProvider } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapCredentials } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { ImapMailbox, ImapMailboxSpecialUse } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, MailSetKind } from "../../../../src/entities/tutanota/Utils"
import { MailModel } from "../../../../src/applications/mail-app/mail/model/MailModel"
import { MailboxDetail, MailboxModel } from "../../../../src/applications/common/mailFunctionality/MailboxModel"
import { EntityClient } from "../../../../src/platform-kit/network/EntityClient"
import { OauthFacade } from "../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { ImapImportUiSession, ImapMailImportController } from "../../../../src/applications/mail-app/settings/imapimport/ImapMailImportController"
import {
	ImapAccountSyncStateTypeRef,
	ImapAccountTypeRef,
	ImapFolderSyncStateTypeRef,
	MailSetTypeRef,
	OAuthTokenEndpointResponseTypeRef,
} from "@tutao/entities/tutanota"
import { FolderSystem } from "../../../../src/applications/common/api/common/mail/FolderSystem"
import { OAuthErrorHandler } from "../../../../src/applications/mail-app/settings/imapimport/oauth/OAuthErrorHandler"
import { EventController } from "../../../../src/applications/common/api/main/EventController"

const { anything } = matchers

o.spec("ImapMailImportController", () => {
	let imapImporter: ImapImporter
	let mailModel: MailModel
	let mailboxModel: MailboxModel
	let entityClient: EntityClient
	let oauthFacade: OauthFacade
	let controller: ImapMailImportController
	let eventController: EventController

	const mailboxDetail1Mock: MailboxDetail = {
		mailGroupInfo: { group: "group1" },
		mailbox: { _ownerGroup: "group1" },
	} as any
	const mailboxDetail2Mock: MailboxDetail = {
		mailGroupInfo: { group: "group2" },
		mailbox: { _ownerGroup: "group2" },
	} as any
	const imapAccountSyncStateIdMock: IdTuple = ["accountSyncStateListId", "accountSyncStateElementId"]
	const accountSyncStateMock = createTestEntity(ImapAccountSyncStateTypeRef, {
		_id: imapAccountSyncStateIdMock,
		_ownerGroup: "group1",
		imapFolderSyncStateList: "folderSyncStateListId",
		status: ImapAccountSyncStatus.RUNNING.toString(),
	})
	const folderSyncStateMock = createTestEntity(ImapFolderSyncStateTypeRef, {
		_id: ["folderSyncStateListId", "folderSyncStateElementId"],
		status: ImapFolderSyncStatus.FINISHED,
	})

	o.beforeEach(() => {
		imapImporter = object<ImapImporter>()
		mailModel = object<MailModel>()
		mailboxModel = object<MailboxModel>()
		entityClient = object<EntityClient>()
		oauthFacade = object<OauthFacade>()
		eventController = object<EventController>()
		controller = new ImapMailImportController(imapImporter, mailModel, mailboxModel, entityClient, oauthFacade, eventController)
	})

	o.test("init - loads mailbox details", async () => {
		when(mailboxModel.getMailboxDetails()).thenResolve([mailboxDetail1Mock, mailboxDetail2Mock])
		const imapImportSession = newImapImportSession(accountSyncStateMock, [])
		imapImportSession.imapFolderSyncStates = [{ ...folderSyncStateMock, status: ImapFolderSyncStatus.FINISHED }]
		const activeSessions = [{ imapAccountSyncStateId: accountSyncStateMock._id } as ImapImportUiSession] as ImapImportUiSession[]
		when(imapImporter.getImapImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.init()
		o.check(controller.mailboxDetails).deepEquals([mailboxDetail1Mock, mailboxDetail2Mock])
		o.check(controller.selectedMailBoxDetail).equals(mailboxDetail1Mock)
	})

	o.test("initializeImport - delegates to imapImporter", async () => {
		const params = {} as InitializeImapImportParams
		const expectedSession = newImapImportSession(accountSyncStateMock, [])
		when(imapImporter.initializeNewImport(params)).thenResolve(expectedSession)
		const activeSessions = [{ imapAccountSyncStateId: expectedSession.imapAccountSyncState._id } as ImapImportUiSession] as ImapImportUiSession[]
		when(imapImporter.getImapImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		const result = await controller.initializeImport(params)

		o.check(result).equals(expectedSession)
		verify(imapImporter.initializeNewImport(params), { times: 1 })
	})

	o.test("continueImport - returns result on success", async () => {
		const successResult: ImportResult = {
			state: { status: accountSyncStateMock.status as ImapAccountSyncStatus },
			remoteStateId: imapAccountSyncStateIdMock,
		}
		when(imapImporter.continueImport(imapAccountSyncStateIdMock)).thenResolve(successResult)

		const result = await controller.continueImport(imapAccountSyncStateIdMock)

		o.check(result).equals(successResult)
		verify(imapImporter.continueImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("continueImport - does not handle AUTH_FAILED", async () => {
		const authError = new ImapError("authentication failed when starting IMAP sync", ImapErrorCause.AUTH_FAILED)
		const successResult: ImportResult = {
			state: { status: accountSyncStateMock.status as ImapAccountSyncStatus },
			remoteStateId: imapAccountSyncStateIdMock,
		}
		let isBeforeTokenRefresh = true
		when(imapImporter.continueImport(imapAccountSyncStateIdMock)).thenDo(() => {
			if (isBeforeTokenRefresh) {
				isBeforeTokenRefresh = false
				throw authError
			}
			return successResult
		})

		accountSyncStateMock.provider = ImapProvider.Google.toString()
		accountSyncStateMock.imapAccount = createTestEntity(ImapAccountTypeRef, {
			oAuthTokenEndpointResponse: createTestEntity(OAuthTokenEndpointResponseTypeRef, {
				refreshToken: "oldRefreshToken123",
			}),
		})
		when(entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(accountSyncStateMock)

		const oAuthErrorHandlerMock = object<OAuthErrorHandler>()
		when(oAuthErrorHandlerMock.isAuthError(anything())).thenReturn(true)
		when(oAuthErrorHandlerMock.handleAuthError(accountSyncStateMock)).thenResolve(true)

		when(entityClient.update(accountSyncStateMock)).thenResolve()

		controller = new ImapMailImportController(imapImporter, mailModel, mailboxModel, entityClient, oauthFacade, eventController)

		const imapError = await assertThrows(ImapError, async () => await controller.continueImport(imapAccountSyncStateIdMock))
		o(imapError.message).equals("authentication failed when starting IMAP sync")
		o(imapError.data).equals(1)

		verify(oAuthErrorHandlerMock.isAuthError(anything()), { times: 0 })
		verify(oAuthErrorHandlerMock.handleAuthError(accountSyncStateMock), { times: 0 })
		verify(imapImporter.continueImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("continue import rejects when error happens", async () => {
		when(imapImporter.continueImport(imapAccountSyncStateIdMock)).thenReject(new ImapError("Some error", 1))
		try {
			await controller.continueImport(imapAccountSyncStateIdMock)
		} catch (imapException) {
			o(imapException.message).equals("Some error")
			o(imapException.data).equals(1)
		}
	})

	o.test("pauseImport - delegates to imapImporter", async () => {
		const activeSessions = [{ imapAccountSyncStateId: imapAccountSyncStateIdMock } as ImapImportUiSession] as ImapImportUiSession[]
		when(imapImporter.getImapImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.pauseImport(imapAccountSyncStateIdMock)
		verify(imapImporter.pauseImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("deleteImport - delegates to imapImporter", async () => {
		const activeSessions = [{ imapAccountSyncStateId: imapAccountSyncStateIdMock } as ImapImportUiSession] as ImapImportUiSession[]
		when(imapImporter.getImapImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.deleteImport(imapAccountSyncStateIdMock)
		verify(imapImporter.deleteImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("pauseImports - pauses all active sessions", async () => {
		const session1Mock = newImapImportSession({ ...accountSyncStateMock, _id: ["accountSyncStateListId", "session1"] }, [])
		const session2Mock = newImapImportSession({ ...accountSyncStateMock, _id: ["accountSyncStateListId", "session2"] }, [])
		controller.activeImapImportUiSessions = [
			{ imapAccountSyncStateId: session1Mock.imapAccountSyncState._id } as ImapImportUiSession,
			{ imapAccountSyncStateId: session2Mock.imapAccountSyncState._id } as ImapImportUiSession,
		]
		when(imapImporter.getImapImportUiSessions()).thenResolve({ activeSessions: controller.activeImapImportUiSessions, canceledSessions: [] })

		await controller.pauseImports()

		verify(imapImporter.pauseImport(session1Mock.imapAccountSyncState._id), { times: 1 })
		verify(imapImporter.pauseImport(session2Mock.imapAccountSyncState._id), { times: 1 })
	})

	o.test("shouldRenderPauseButton - returns true for RUNNING", () => {
		o.check(controller.shouldRenderPauseButton({ imapAccountSyncStatus: ImapAccountSyncStatus.RUNNING } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderPauseButton({ imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseButton({ imapAccountSyncStatus: ImapAccountSyncStatus.POSTPONED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseButton({ imapAccountSyncStatus: ImapAccountSyncStatus.FINISHED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseButton({ imapAccountSyncStatus: ImapAccountSyncStatus.ERROR } as ImapImportUiSession)).equals(false)
	})

	o.test("shouldRenderResyncButton - returns true for FINISHED and POSTPONED", () => {
		o.check(controller.shouldRenderResyncButton({ imapAccountSyncStatus: ImapAccountSyncStatus.RUNNING } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderResyncButton({ imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderResyncButton({ imapAccountSyncStatus: ImapAccountSyncStatus.POSTPONED } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderResyncButton({ imapAccountSyncStatus: ImapAccountSyncStatus.FINISHED } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderResyncButton({ imapAccountSyncStatus: ImapAccountSyncStatus.ERROR } as ImapImportUiSession)).equals(false)
	})

	o.test("shouldRenderPlayButton - returns true for PAUSED", () => {
		o.check(controller.shouldRenderPlayButton({ imapAccountSyncStatus: ImapAccountSyncStatus.RUNNING } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPlayButton({ imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderPlayButton({ imapAccountSyncStatus: ImapAccountSyncStatus.POSTPONED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPlayButton({ imapAccountSyncStatus: ImapAccountSyncStatus.FINISHED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPlayButton({ imapAccountSyncStatus: ImapAccountSyncStatus.ERROR } as ImapImportUiSession)).equals(false)
	})

	o.test("shouldRenderPauseIcon - returns true only for PAUSED", () => {
		o.check(controller.shouldRenderPauseIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.RUNNING } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderPauseIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.POSTPONED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.FINISHED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.ERROR } as ImapImportUiSession)).equals(false)
	})

	o.test("shouldRenderClockIcon - returns true only for POSTPONED", () => {
		o.check(controller.shouldRenderClockIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.RUNNING } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.POSTPONED } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderClockIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.FINISHED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.ERROR } as ImapImportUiSession)).equals(false)
	})

	o.test("shouldRenderCheckmarkIcon - returns true only for FINISHED", () => {
		o.check(controller.shouldRenderCheckmarkIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.RUNNING } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderCheckmarkIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.PAUSED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderCheckmarkIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.POSTPONED } as ImapImportUiSession)).equals(false)
		o.check(controller.shouldRenderCheckmarkIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.FINISHED } as ImapImportUiSession)).equals(true)
		o.check(controller.shouldRenderCheckmarkIcon({ imapAccountSyncStatus: ImapAccountSyncStatus.ERROR } as ImapImportUiSession)).equals(false)
	})

	o.test("getDestinationMailboxDetailForSession - finds mailbox by owner group", () => {
		controller.mailboxDetails = [mailboxDetail1Mock, mailboxDetail2Mock]
		const session = { mailGroupId: "group2" } as ImapImportUiSession
		const result = controller.getDestinationMailboxDetailForSession(session)
		o.check(result).equals(mailboxDetail2Mock)
	})

	o.test("getImapMailboxesFromServer - delegates to imapImporter", async () => {
		const imapAccount = {} as ImapCredentials
		const expected = { result: [] }
		when(imapImporter.getImapMailboxesFromServer(imapAccount)).thenResolve(expected)
		const result = await controller.getImapMailboxesFromServer(imapAccount)
		o.check(result).equals(expected)
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
