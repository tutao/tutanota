import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { ImportResult, InitializeMigrationParams, MailboxImporter } from "../../../../src/applications/mail-app/workerUtils/migration/MailboxImporter"
import { newMailboxImportSession } from "../../../../src/applications/mail-app/workerUtils/migration/MailboxImportSession"
import { createTestEntity } from "../../TestUtils"
import { MigrationError, MigrationErrorCause } from "../../../../src/applications/common/api/common/error/MigrationError"
import { MailboxMigrationProvider } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { MigrationCredentials } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { MailboxMigrationFolderSyncStatus, MailboxMigrationSyncStatus, MailSetKind } from "../../../../src/entities/tutanota/Utils"
import { MailModel } from "../../../../src/applications/mail-app/mail/model/MailModel"
import { MailboxDetail, MailboxModel } from "../../../../src/applications/common/mailFunctionality/MailboxModel"
import { EntityClient } from "../../../../src/platform-kit/network/EntityClient"
import { OauthFacade } from "../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { MailboxMigrationController, MailboxMigrationUiSession } from "../../../../src/applications/mail-app/settings/migration/MailboxMigrationController"
import {
	MailboxMigrationFolderSyncStateTypeRef,
	MailboxMigrationImapConfigurationTypeRef,
	MailboxMigrationSyncStateTypeRef,
	MailSetTypeRef,
	OAuthTokenEndpointResponseLegacyTypeRef,
} from "@tutao/entities/tutanota"
import { FolderSystem } from "../../../../src/applications/common/api/common/mail/FolderSystem"
import { MigrationErrorHandler } from "../../../../src/applications/mail-app/settings/migration/MigrationErrorHandler"
import { EventController } from "../../../../src/applications/common/api/main/EventController"

const { anything } = matchers

o.spec("MailboxMigrationController", () => {
	let mailboxImporter: MailboxImporter
	let mailModel: MailModel
	let mailboxModel: MailboxModel
	let entityClient: EntityClient
	let oauthFacade: OauthFacade
	let controller: MailboxMigrationController
	let eventController: EventController
	let oAuthErrorHandler: MigrationErrorHandler

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
		mailboxImporter = object<MailboxImporter>()
		mailModel = object<MailModel>()
		mailboxModel = object<MailboxModel>()
		entityClient = object<EntityClient>()
		oauthFacade = object<OauthFacade>()
		eventController = object<EventController>()
		oAuthErrorHandler = object<MigrationErrorHandler>()
		controller = new MailboxMigrationController(mailboxImporter, mailModel, mailboxModel, entityClient, eventController, oauthFacade, oAuthErrorHandler)
	})

	o.test("init - loads mailbox details", async () => {
		when(mailboxModel.getMailboxDetails()).thenResolve([mailboxDetail1Mock, mailboxDetail2Mock])
		const mailboxImportSession = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		mailboxImportSession.mailboxMigrationFolderSyncStates = [{ ...folderSyncStateMock, status: MailboxMigrationFolderSyncStatus.FINISHED }]
		const activeSessions = [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateMock._id } as MailboxMigrationUiSession] as MailboxMigrationUiSession[]
		when(mailboxImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.initUiSessions()
		o.check(controller.mailboxDetails).deepEquals([mailboxDetail1Mock, mailboxDetail2Mock])
		o.check(controller.selectedMailBoxDetail).equals(mailboxDetail1Mock)
	})

	o.test("initializeImport - delegates to mailboxImporter", async () => {
		const params = {} as InitializeMigrationParams
		const expectedSession = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		when(mailboxImporter.initializeNewImport(params)).thenResolve(expectedSession)
		const activeSessions = [
			{ mailboxMigrationSyncStateId: expectedSession.mailboxMigrationSyncState._id } as MailboxMigrationUiSession,
		] as MailboxMigrationUiSession[]
		when(mailboxImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		const result = await controller.initializeImport(params)

		o.check(result).equals(expectedSession)
		verify(mailboxImporter.initializeNewImport(params), { times: 1 })
	})

	o.test("continueImport - returns result on success", async () => {
		const successResult: ImportResult = {
			state: { status: mailboxMigrationSyncStateMock.status as MailboxMigrationSyncStatus },
			remoteStateId: mailboxMigrationSyncStateIdMock,
		}
		when(mailboxImporter.continueImport(mailboxMigrationSyncStateIdMock, false)).thenResolve(successResult)

		const result = await controller.continueImport(mailboxMigrationSyncStateIdMock)

		o.check(result).equals(successResult)
		verify(mailboxImporter.continueImport(mailboxMigrationSyncStateIdMock, false), { times: 1 })
	})

	o.test("continueImport - handles AUTH_FAILED", async () => {
		const authError = new MigrationError("authentication failed when starting Migration sync", MigrationErrorCause.AUTH_FAILED)
		const successResult: ImportResult = {
			state: { status: mailboxMigrationSyncStateMock.status as MailboxMigrationSyncStatus },
			remoteStateId: mailboxMigrationSyncStateIdMock,
		}
		when(mailboxImporter.continueImport(mailboxMigrationSyncStateIdMock, false)).thenReject(authError, successResult)

		mailboxMigrationSyncStateMock.legacyProvider = MailboxMigrationProvider.Gmail.toString()
		mailboxMigrationSyncStateMock.imapConfiguration = createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
			sharedOauthToken: createTestEntity(OAuthTokenEndpointResponseLegacyTypeRef, {
				refreshToken: "oldRefreshToken123",
			}),
		})
		when(entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateIdMock)).thenResolve(mailboxMigrationSyncStateMock)

		const migrationErrorHandler = object<MigrationErrorHandler>()
		when(migrationErrorHandler.isAuthError(authError)).thenReturn(true)
		when(migrationErrorHandler.handleMigrationError(authError, undefined, mailboxMigrationSyncStateIdMock)).thenResolve({ shouldRetry: true })
		when(entityClient.update(mailboxMigrationSyncStateMock)).thenResolve()

		controller = new MailboxMigrationController(mailboxImporter, mailModel, mailboxModel, entityClient, eventController, oauthFacade, migrationErrorHandler)
		when(mailboxImporter.getMailboxImportSessions()).thenResolve([newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)])
		when(mailboxImporter.getMailboxImportUiSessions()).thenResolve({
			activeSessions: [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxMigrationUiSession] as MailboxMigrationUiSession[],
		})
		await controller.continueImport(mailboxMigrationSyncStateIdMock)

		verify(migrationErrorHandler.handleMigrationError(authError, undefined, mailboxMigrationSyncStateIdMock), { times: 1 })
		verify(mailboxImporter.continueImport(mailboxMigrationSyncStateIdMock, false), { times: 2 })
	})

	o.test("continueImport - handles startSync error and postpones", async () => {
		mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.PAUSED
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		when(mailboxImporter.getMailboxImportSessions()).thenResolve([newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)])
		when(mailboxImporter.getMailboxImportUiSessions()).thenResolve({
			activeSessions: [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxMigrationUiSession] as MailboxMigrationUiSession[],
		})

		const migrationError = new MigrationError("Connection failed", MigrationErrorCause.UNKNOWN)
		when(mailboxImporter.continueImport(mailboxMigrationSyncStateMock._id, anything())).thenReject(migrationError)
		const importResult = await controller.continueImport(mailboxMigrationSyncStateMock._id)

		o.check(importResult.state.status).deepEquals(MailboxMigrationSyncStatus.POSTPONED)
		verify(mailboxImporter.postponeImport(mailboxMigrationSyncStateMock._id, anything()), { times: 1 })
	})

	o.test("continue import rejects when error happens", async () => {
		when(mailboxImporter.continueImport(mailboxMigrationSyncStateIdMock)).thenReject(new MigrationError("Some error", 1))
		try {
			await controller.continueImport(mailboxMigrationSyncStateIdMock)
		} catch (e) {
			o(e.message).equals("Some error")
			o(e.data.cause).equals(1)
		}
	})

	o.test("pauseImport - delegates to mailboxImporter", async () => {
		const activeSessions = [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxMigrationUiSession] as MailboxMigrationUiSession[]
		when(mailboxImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.pauseImport(mailboxMigrationSyncStateIdMock)
		verify(mailboxImporter.pauseImport(mailboxMigrationSyncStateIdMock), { times: 1 })
	})

	o.test("deleteImport - delegates to mailboxImporter", async () => {
		const activeSessions = [{ mailboxMigrationSyncStateId: mailboxMigrationSyncStateIdMock } as MailboxMigrationUiSession] as MailboxMigrationUiSession[]
		when(mailboxImporter.getMailboxImportUiSessions()).thenResolve({ activeSessions, canceledSessions: [] })
		await controller.deleteImport(mailboxMigrationSyncStateIdMock)
		verify(mailboxImporter.deleteImport(mailboxMigrationSyncStateIdMock), { times: 1 })
	})

	o.test("shouldRenderPauseButton - returns true for RUNNING", () => {
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxMigrationUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPauseButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxMigrationUiSession)).equals(false)
	})

	o.test("shouldRenderResyncButton - returns true for FINISHED and POSTPONED", () => {
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxMigrationUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxMigrationUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderResyncButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxMigrationUiSession)).equals(
			false,
		)
	})

	o.test("shouldRenderPlayButton - returns true for PAUSED", () => {
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxMigrationUiSession)).equals(true)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPlayButton({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxMigrationUiSession)).equals(false)
	})

	o.test("shouldRenderPauseIcon - returns true only for PAUSED", () => {
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxMigrationUiSession)).equals(false)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxMigrationUiSession)).equals(true)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderPauseIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxMigrationUiSession)).equals(false)
	})

	o.test("shouldRenderClockIcon - returns true only for POSTPONED", () => {
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxMigrationUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxMigrationUiSession)).equals(false)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxMigrationUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderClockIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxMigrationUiSession)).equals(false)
	})

	o.test("shouldRenderCheckmarkIcon - returns true only for FINISHED", () => {
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.RUNNING } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.PAUSED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.POSTPONED } as MailboxMigrationUiSession)).equals(
			false,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.FINISHED } as MailboxMigrationUiSession)).equals(
			true,
		)
		o.check(controller.shouldRenderCheckmarkIcon({ mailboxMigrationSyncStatus: MailboxMigrationSyncStatus.ERROR } as MailboxMigrationUiSession)).equals(
			false,
		)
	})

	o.test("getDestinationMailboxDetailForSession - finds mailbox by owner group", () => {
		controller.mailboxDetails = [mailboxDetail1Mock, mailboxDetail2Mock]
		const session = { mailGroupId: "group2" } as MailboxMigrationUiSession
		const result = controller.getDestinationMailboxDetailForSession(session)
		o.check(result).equals(mailboxDetail2Mock)
	})

	o.test("doInitialFetchMailboxes - delegates to mailboxImporter", async () => {
		const migrationCredentials = {} as MigrationCredentials
		const expected = { result: { migrationMailboxes: [], migrationCredentials: migrationCredentials } }
		when(mailboxImporter.getMigrationMailboxesFromServer(migrationCredentials)).thenResolve([])
		const result = await controller.doInitialFetchMailboxes(migrationCredentials)
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

	o.test("constructMigrationMailboxesToTutaFoldersMap - maps special use folders and custom folders", async () => {
		const migrationMailboxes: MigrationMailbox[] = [
			{ sourceId: "INBOX", specialUse: MigrationMailboxSpecialUse.INBOX, name: "INBOX" },
			{ sourceId: "Custom", name: "Custom" },
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
		const result = await controller.constructMigrationMailboxesToTutaFoldersMap(migrationMailboxes)

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
