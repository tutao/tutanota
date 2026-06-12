import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { ImapImporter, ImportResult, InitializeImapImportParams } from "../../../../src/applications/mail-app/workerUtils/imapimport/ImapImporter"
import { newImapImportSession } from "../../../../src/applications/mail-app/workerUtils/imapimport/ImapImportSession"
import { createTestEntity } from "../../TestUtils"
import { ImapError, ImapErrorCause } from "../../../../src/applications/common/api/common/error/ImapError"
import { ImapProvider, OauthConfigParams } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { OAuthHandler } from "../../../../src/applications/mail-app/settings/imapimport/oauth/OAuthHandler"
import { TokenEndpointResponse } from "openid-client"
import { ImapCredentials } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncState"
import { ImapMailbox, ImapMailboxSpecialUse } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, MailSetKind } from "../../../../src/entities/tutanota/Utils"
import { MailModel } from "../../../../src/applications/mail-app/mail/model/MailModel"
import { MailboxDetail, MailboxModel } from "../../../../src/applications/common/mailFunctionality/MailboxModel"
import { EntityClient } from "../../../../src/platform-kit/network/EntityClient"
import { OauthFacade } from "../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { ImapImportController } from "../../../../src/applications/mail-app/settings/imapimport/ImapImportController"
import {
	ImapAccountSyncStateTypeRef,
	ImapAccountTypeRef,
	ImapFolderSyncStateTypeRef,
	MailSetTypeRef,
	OAuthTokenEndpointResponseTypeRef,
} from "@tutao/entities/tutanota"
import { FolderSystem } from "../../../../src/applications/common/api/common/mail/FolderSystem"

const { anything } = matchers

o.spec("ImapImportController", () => {
	let imapImporter: ImapImporter
	let mailModel: MailModel
	let mailboxModel: MailboxModel
	let entityClient: EntityClient
	let oauthFacade: OauthFacade
	let controller: ImapImportController

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
		controller = new ImapImportController(imapImporter, mailModel, mailboxModel, entityClient, oauthFacade)
	})

	o.test("init - loads mailbox details and updates active sessions", async () => {
		when(mailboxModel.getMailboxDetails()).thenResolve([mailboxDetail1Mock, mailboxDetail2Mock])
		const imapImportSession = newImapImportSession(accountSyncStateMock)
		imapImportSession.imapFolderSyncStates = [{ ...folderSyncStateMock, status: ImapFolderSyncStatus.FINISHED }]
		when(imapImporter.getActiveImapImportSessions()).thenResolve(new Map([["key", imapImportSession]]))

		await controller.init()

		o.check(controller.mailboxDetails).deepEquals([mailboxDetail1Mock, mailboxDetail2Mock])
		o.check(controller.selectedMailBoxDetail).equals(mailboxDetail1Mock)
		o.check(controller.activeImapImportSessions.get("key")!.syncProgress).deepEquals({ completed: 1, total: 1 })
	})

	o.test("initializeImport - delegates to imapImporter", async () => {
		const params = {} as InitializeImapImportParams
		const expectedSession = newImapImportSession(accountSyncStateMock)
		when(imapImporter.initializeImport(params)).thenResolve(expectedSession)

		const result = await controller.initializeImport(params)

		o.check(result).equals(expectedSession)
		verify(imapImporter.initializeImport(params), { times: 1 })
	})

	o.test("continueImport - returns result on success", async () => {
		const successResult: ImportResult = {
			ok: { state: { status: accountSyncStateMock.status as ImapAccountSyncStatus }, remoteStateId: imapAccountSyncStateIdMock },
		}
		when(imapImporter.continueImport(imapAccountSyncStateIdMock)).thenResolve(successResult)

		const result = await controller.continueImport(imapAccountSyncStateIdMock)

		o.check(result).equals(successResult)
		verify(imapImporter.continueImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("continueImport - handles AUTH_FAILED by refreshing token and retrying", async () => {
		const authError: ImportResult = { error: new ImapError({}, ImapErrorCause.AUTH_FAILED) }
		const successResult: ImportResult = {
			ok: {
				state: { status: accountSyncStateMock.status as ImapAccountSyncStatus },
				remoteStateId: imapAccountSyncStateIdMock,
			},
		}
		when(imapImporter.continueImport(imapAccountSyncStateIdMock)).thenResolve(authError, successResult)

		accountSyncStateMock.provider = ImapProvider.Google.toString()
		accountSyncStateMock.imapAccount = createTestEntity(ImapAccountTypeRef, {
			oAuthTokenEndpointResponse: createTestEntity(OAuthTokenEndpointResponseTypeRef, {
				refreshToken: "oldRefreshToken123",
			}),
		})
		when(entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(accountSyncStateMock)

		const oAuthHandlerMock = object<OAuthHandler>()
		when(oAuthHandlerMock.setupOauthLoginParams()).thenResolve()
		const tokenResponseMock: TokenEndpointResponse = {
			access_token: "newAccess",
			refresh_token: "newRefreshToken456",
			expires_in: 3600,
			token_type: "bearer",
		}
		when(oAuthHandlerMock.refreshTokens("oldRefreshToken123")).thenResolve(tokenResponseMock)

		when(entityClient.update(accountSyncStateMock)).thenResolve()

		const testFactory = (config: OauthConfigParams) => oAuthHandlerMock
		controller = new ImapImportController(imapImporter, mailModel, mailboxModel, entityClient, oauthFacade, testFactory)

		const result = await controller.continueImport(imapAccountSyncStateIdMock, 0)

		o.check(result.ok!.remoteStateId).equals(imapAccountSyncStateIdMock)

		verify(oAuthHandlerMock.setupOauthLoginParams(), { times: 1 })
		verify(oAuthHandlerMock.refreshTokens("oldRefreshToken123"), { times: 1 })
		verify(entityClient.update(accountSyncStateMock), { times: 1 })

		verify(imapImporter.continueImport(imapAccountSyncStateIdMock), { times: 2 })
	})

	o.test("continueImport - returns error if retryCount > 1", async () => {
		const result = await controller.continueImport(imapAccountSyncStateIdMock, 2)
		o.check(result.error?.cause).equals(ImapErrorCause.AUTH_FAILED_REFRESH_TOKEN)
		verify(imapImporter.continueImport(anything()), { times: 0 })
	})

	o.test("pauseImport - delegates to imapImporter", async () => {
		await controller.pauseImport(imapAccountSyncStateIdMock)
		verify(imapImporter.pauseImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("deleteImport - delegates to imapImporter", async () => {
		await controller.deleteImport(imapAccountSyncStateIdMock)
		verify(imapImporter.deleteImport(imapAccountSyncStateIdMock), { times: 1 })
	})

	o.test("pauseImports - pauses all active sessions", async () => {
		const session1Mock = newImapImportSession({ ...accountSyncStateMock, _id: ["accountSyncStateListId", "session1"] })
		const session2Mock = newImapImportSession({ ...accountSyncStateMock, _id: ["accountSyncStateListId", "session2"] })
		controller.activeImapImportSessions.set("accountSyncStateListId/session1", session1Mock)
		controller.activeImapImportSessions.set("accountSyncStateListId/session2", session2Mock)

		await controller.pauseImports()

		verify(imapImporter.pauseImport(session1Mock.imapAccountSyncState._id), { times: 1 })
		verify(imapImporter.pauseImport(session2Mock.imapAccountSyncState._id), { times: 1 })
	})

	o.test("updateActiveSessions - refreshes sessions with sync progress", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [
			{ ...folderSyncStateMock, status: ImapFolderSyncStatus.FINISHED },
			{ ...folderSyncStateMock, status: ImapFolderSyncStatus.RUNNING },
		]
		const sessionsMap = new Map([["accountSyncStateListId/accountSyncStateElementId", session]])
		when(imapImporter.getActiveImapImportSessions()).thenResolve(sessionsMap)

		await controller.updateActiveSessions()

		o.check(controller.activeImapImportSessions.size).equals(1)
		const updatedSession = controller.activeImapImportSessions.get("accountSyncStateListId/accountSyncStateElementId")
		o.check(updatedSession!.syncProgress).deepEquals({ completed: 1, total: 2 })
	})

	o.test("shouldRenderPauseButton - returns true for RUNNING and POSTPONED", () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING.toString()
		const runningSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderPauseButton(runningSession)).equals(true)

		accountSyncStateMock.status = ImapAccountSyncStatus.POSTPONED.toString()
		const postponedSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderPauseButton(postponedSession)).equals(true)

		accountSyncStateMock.status = ImapAccountSyncStatus.PAUSED.toString()
		const pausedSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderPauseButton(pausedSession)).equals(false)
	})

	o.test("shouldRenderResyncButton - returns true for PAUSED and FINISHED", () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.PAUSED.toString()
		const pausedSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderResyncButton(pausedSession)).equals(true)

		accountSyncStateMock.status = ImapAccountSyncStatus.FINISHED.toString()
		const finishedSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderResyncButton(finishedSession)).equals(true)

		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING.toString()
		const runningSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderResyncButton(runningSession)).equals(false)
	})

	o.test("shouldRenderPauseIcon - returns true only for PAUSED", () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.PAUSED.toString()
		const pausedSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderPauseIcon(pausedSession)).equals(true)

		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING.toString()
		const runningSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderPauseIcon(runningSession)).equals(false)
	})

	o.test("shouldRenderClockIcon - returns true only for POSTPONED", () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.POSTPONED.toString()
		const postponedSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderClockIcon(postponedSession)).equals(true)

		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING.toString()
		const runningSession = newImapImportSession(accountSyncStateMock)
		o.check(controller.shouldRenderClockIcon(runningSession)).equals(false)
	})

	o.test("getDestinationMailboxDetailForSession - finds mailbox by owner group", () => {
		controller.mailboxDetails = [mailboxDetail1Mock, mailboxDetail2Mock]
		const session = newImapImportSession(accountSyncStateMock)
		session.imapAccountSyncState._ownerGroup = "group2"
		const result = controller.getDestinationMailboxDetailForSession(session)
		o.check(result).equals(mailboxDetail2Mock)
	})

	o.test("getActiveImapImportSessions - returns activeSessions map", () => {
		const map = new Map()
		controller.activeImapImportSessions = map
		o.check(controller.getActiveImapImportSessions()).equals(Array.from(map.values()))
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

		o.check(result.get("INBOX")).equals("inboxFolderId")
		o.check(result.get("Custom")).equals("customFolderId")
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
