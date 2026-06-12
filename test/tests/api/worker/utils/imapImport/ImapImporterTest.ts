import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"

import { ImapImporter, InitializeImapImportParams } from "../../../../../../src/applications/mail-app/workerUtils/imapimport/ImapImporter"
import { createTestEntity } from "../../../../TestUtils"
import { ImapCredentials } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncState"
import { ImapMailbox, ImapMailboxStatus } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { ImapMail, ImapMailAttachment, ImapMailEnvelope } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMail"
import { ImapProvider } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { imapMailToImportMailParams } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapImportUtils"
import { newImapImportSession } from "../../../../../../src/applications/mail-app/workerUtils/imapimport/ImapImportSession"
import { ImapError, ImapErrorCause } from "../../../../../../src/applications/common/api/common/error/ImapError"
import { ImapGetMailboxResult } from "../../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapGetMailboxResult"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, ImapSyncEventType } from "../../../../../../src/entities/tutanota/Utils"
import { ImapSyncSystemFacade } from "../../../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { ImapImportTutaFileId, ImportMailFacade } from "../../../../../../src/applications/common/api/worker/facades/lazy/ImportMailFacade"
import {
	ImapAccountSyncState,
	ImapAccountSyncStateTypeRef,
	ImapAccountTypeRef,
	ImapFolderSyncState,
	ImapFolderSyncStateTypeRef,
	ImportedImapMail,
	ImportedImapMailTypeRef,
} from "@tutao/entities/tutanota"
import { elementIdPart, isSameId, OperationType } from "../../../../../../src/platform-kit/meta"
import { SuspensionError } from "../../../../../../src/platform-kit/rest-client/error"
import { EntityUpdateData } from "../../../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { uint8ArrayToString } from "../../../../../../src/platform-kit/utils"
import { sha256Hash } from "@tutao/crypto/sha256"
import { ImapFacade } from "../../../../../../src/applications/common/api/worker/facades/lazy/ImapFacade"
import { ProgrammingError } from "../../../../../../src/platform-kit/app-env"

const { anything } = matchers

o.spec("ImapImporter", () => {
	let imapSyncSystemFacadeMock: ImapSyncSystemFacade
	let imapFacadeMock: ImapFacade
	let importMailFacadeMock: ImportMailFacade
	let importer: ImapImporter

	const accountSyncStateIdMock: IdTuple = ["accountSyncStateListId", "accountSyncStateElementId"]
	const folderSyncStateIdMock: IdTuple = ["folderSyncStateListId", "folderSyncStateElementId"]
	const mailFolderIdMock: IdTuple = ["mailSetListId", "mailSetElementId"]
	const mailGroupIdMock = "mailGroup123"
	const maxQuotaMock = "1000"
	const imapAccountMock = createTestEntity(ImapAccountTypeRef, {
		host: "imap.test.com",
		port: "993",
		username: "user@test.com",
		password: "pass",
		oAuthTokenEndpointResponse: null,
	})
	const imapAccountPlainMock: ImapCredentials = { host: "imap.test.com", port: 993, username: "user@test.com", password: "pass" }
	const imapMailboxMock: ImapMailbox = { path: "INBOX", name: "INBOX" }
	const imapMailboxStatusMock: ImapMailboxStatus = {
		path: "INBOX",
		uidNext: 100,
		uidValidity: 12345n,
		highestModSeq: 67890n,
		syncStatus: ImapFolderSyncStatus.RUNNING,
	} as ImapMailboxStatus
	const imapMailMock: ImapMail = {
		uid: 42,
		belongsToMailbox: imapMailboxMock,
		modSeq: 123n,
		envelope: { messageId: "msg123" } as ImapMailEnvelope,
		attachments: [],
	}

	let accountSyncStateMock: ImapAccountSyncState
	let folderSyncStateMock: ImapFolderSyncState
	let importedMailMock: ImportedImapMail

	o.beforeEach(async () => {
		imapSyncSystemFacadeMock = object<ImapSyncSystemFacade>()
		imapFacadeMock = object<ImapFacade>()
		importMailFacadeMock = object<ImportMailFacade>()
		importer = new ImapImporter(imapSyncSystemFacadeMock, imapFacadeMock, importMailFacadeMock)

		accountSyncStateMock = createTestEntity(ImapAccountSyncStateTypeRef, {
			_id: accountSyncStateIdMock,
			_ownerGroup: mailGroupIdMock,
			imapAccount: imapAccountMock,
			maxQuota: maxQuotaMock,
			rootImportMailFolder: null,
			imapFolderSyncStateList: "folderSyncStateListId",
			status: ImapAccountSyncStatus.RUNNING.toString(),
		})
		folderSyncStateMock = createTestEntity(ImapFolderSyncStateTypeRef, {
			_id: folderSyncStateIdMock,
			_ownerGroup: mailGroupIdMock,
			path: "INBOX",
			mailFolder: mailFolderIdMock,
			uidnext: "100",
			uidvalidity: "12345",
			highestmodseq: "67890",
			status: ImapFolderSyncStatus.RUNNING,
			importedMails: "importedMailsListId",
		})
		importedMailMock = createTestEntity(ImportedImapMailTypeRef, {
			imapUid: "42",
			imapModSeq: "123",
			messageId: "msg123",
		})
		const statusArgumentCaptor = matchers.captor()
		when(imapFacadeMock.updateImapAccountSyncStateStatus(accountSyncStateMock._id, statusArgumentCaptor.capture())).thenDo(() => {
			console.log("statusArgumentCaptor.value", statusArgumentCaptor.value)
			accountSyncStateMock.status = statusArgumentCaptor.value
		})
	})

	o.test("initializeImport - creates new session when no existing sync state", async () => {
		const initParams = {
			mailGroupId: mailGroupIdMock,
			matchImapMailboxesToTutaMailSets: false,
			rootImportMailFolderName: "IMAP Import",
			imapAccount: imapAccountMock,
			maxQuota: maxQuotaMock,
			imapSyncLabelData: null,
			provider: ImapProvider.Other,
		} as InitializeImapImportParams
		when(imapFacadeMock.getImapAccountSyncStatesForMailGroup(mailGroupIdMock)).thenResolve([])
		when(imapFacadeMock.initializeImapImport(initParams)).thenResolve(accountSyncStateMock)
		const session = await importer.initializeImport(initParams)

		o.check(session.imapAccountSyncState).equals(accountSyncStateMock)
		o.check(importer.activeImapImportSessions.size).equals(1)
		verify(imapFacadeMock.initializeImapImport(initParams), { times: 1 })
	})

	o.test("initializeImport - reuses existing sync state when found", async () => {
		const initParams = {
			mailGroupId: mailGroupIdMock,
			matchImapMailboxesToTutaMailSets: false,
			rootImportMailFolderName: "IMAP Import",
			imapAccount: imapAccountMock,
			maxQuota: maxQuotaMock,
			imapSyncLabelData: null,
			provider: ImapProvider.Other,
		} as InitializeImapImportParams
		when(imapFacadeMock.getImapAccountSyncStatesForMailGroup(mailGroupIdMock)).thenResolve([accountSyncStateMock])

		const session = await importer.initializeImport(initParams)

		o.check(session.imapAccountSyncState).equals(accountSyncStateMock)
		verify(imapFacadeMock.initializeImapImport(anything()), { times: 0 })
	})

	o.test("initializeImport - sets state to POSTPONED if postponedUntil is present", async () => {
		const postponedStateMock = { ...accountSyncStateMock, status: ImapAccountSyncStatus.POSTPONED, postponedUntil: "1234567890" }
		const initParams = {
			mailGroupId: mailGroupIdMock,
			matchImapMailboxesToTutaMailSets: false,
			rootImportMailFolderName: "IMAP Import",
			imapAccount: imapAccountMock,
			maxQuota: maxQuotaMock,
			imapSyncLabelData: null,
			provider: ImapProvider.Other,
		} as InitializeImapImportParams
		when(imapFacadeMock.getImapAccountSyncStatesForMailGroup(mailGroupIdMock)).thenResolve([postponedStateMock])

		const session = await importer.initializeImport(initParams)

		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.POSTPONED)
		o.check(session.imapAccountSyncState.postponedUntil).equals("1234567890")
	})

	o.test("continueImport - returns running state if already running", async () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const result = await importer.continueImport(accountSyncStateIdMock)

		o.check(result.ok!.state.status).equals(ImapAccountSyncStatus.RUNNING)
		o.check(result.ok!.remoteStateId).equals(accountSyncStateIdMock)
		verify(imapSyncSystemFacadeMock.startSync(anything(), anything()), { times: 0 })
	})

	o.test("continueImport - starts import when state is not running and not postponed or postponement expired", async () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.PAUSED
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		when(imapFacadeMock.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])
		when(imapFacadeMock.getImportedMails("importedMailsListId")).thenResolve([importedMailMock])
		when(imapFacadeMock.getDeduplicatedImportedAttachmentsList(mailGroupIdMock)).thenResolve([])
		when(imapSyncSystemFacadeMock.startSync(accountSyncStateIdMock, anything())).thenResolve(null)
		when(imapFacadeMock.updateAllImapFolderSyncStates(accountSyncStateIdMock, ImapFolderSyncStatus.RUNNING)).thenResolve(accountSyncStateMock)
		const result = await importer.continueImport(accountSyncStateIdMock)

		o.check(result.ok!.state.status).equals(ImapAccountSyncStatus.RUNNING)
		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.RUNNING)
		verify(imapSyncSystemFacadeMock.startSync(accountSyncStateIdMock, anything()), { times: 1 })
	})

	o.test("continueImport - returns postponed if postponedUntil in future", async () => {
		const futureDate = new Date(Date.now() + 60000)
		accountSyncStateMock.postponedUntil = futureDate.getTime().toString()
		accountSyncStateMock.status = ImapAccountSyncStatus.POSTPONED
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const result = await importer.continueImport(accountSyncStateIdMock)

		o.check(result.ok!.state.status).equals(ImapAccountSyncStatus.POSTPONED)
		o.check(result.ok!.state.postponedUntil).deepEquals(futureDate)
		verify(imapSyncSystemFacadeMock.startSync(accountSyncStateIdMock, anything()), { times: 0 })
	})

	o.test("continueImport - handles startSync error and pauses", async () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.PAUSED
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const imapError = new ImapError("Connection failed", ImapErrorCause.UNKNOWN)
		when(imapFacadeMock.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])
		when(imapFacadeMock.getImportedMails("importedMailsListId")).thenResolve([importedMailMock])
		when(imapFacadeMock.getDeduplicatedImportedAttachmentsList(mailGroupIdMock)).thenResolve([])
		when(imapSyncSystemFacadeMock.startSync(accountSyncStateIdMock, anything())).thenResolve(imapError)
		when(imapFacadeMock.updateAllImapFolderSyncStates(accountSyncStateIdMock, ImapFolderSyncStatus.PAUSED)).thenResolve(accountSyncStateMock)

		const result = await importer.continueImport(accountSyncStateIdMock)

		o.check(result.error).equals(imapError)
		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.PAUSED)
		verify(imapFacadeMock.updateAllImapFolderSyncStates(accountSyncStateIdMock, ImapFolderSyncStatus.PAUSED), { times: 1 })
	})

	o.test("pauseImport - stops import and updates state", async () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		when(imapSyncSystemFacadeMock.stopSync(accountSyncStateIdMock)).thenResolve()
		when(imapFacadeMock.pauseRunningImapImportFolderSyncStates(accountSyncStateIdMock)).thenResolve(accountSyncStateMock)
		when(imapFacadeMock.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.pauseImport(accountSyncStateIdMock)

		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.PAUSED)
		verify(imapSyncSystemFacadeMock.stopSync(accountSyncStateIdMock), { times: 1 })
		verify(imapFacadeMock.pauseRunningImapImportFolderSyncStates(accountSyncStateIdMock), { times: 1 })
	})

	o.test("pauseImport - does nothing if session not found", async () => {
		await importer.pauseImport(accountSyncStateIdMock)
		verify(imapSyncSystemFacadeMock.stopSync(anything()), { times: 0 })
	})

	o.test("deleteImport - deletes and stops import, removes session", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		when(imapFacadeMock.deleteImapImport(accountSyncStateIdMock)).thenResolve()
		when(imapSyncSystemFacadeMock.stopSync(accountSyncStateIdMock)).thenResolve()

		await importer.deleteImport(accountSyncStateIdMock)

		verify(imapFacadeMock.deleteImapImport(accountSyncStateIdMock), { times: 1 })
		verify(imapSyncSystemFacadeMock.stopSync(accountSyncStateIdMock), { times: 1 })
		o.check(importer.activeImapImportSessions.has(importer.getImapImportSessionsMapKey(accountSyncStateIdMock))).equals(false)
	})

	o.test("onMailbox - handles CREATE event", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = []
		session.imapMailboxesToTutaFolders = new Map()
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		when(imapFacadeMock.createImportMailFolder(imapMailboxMock, session.imapAccountSyncState, null, anything())).thenResolve(folderSyncStateMock)

		await importer.onMailbox(accountSyncStateIdMock, imapMailboxMock, ImapSyncEventType.CREATE)

		o.check(session.imapFolderSyncStates.includes(folderSyncStateMock)).equals(true)
		o.check(session.imapMailboxesToTutaFolders.get("INBOX")).equals(elementIdPart(mailFolderIdMock))
	})

	o.test("onMailbox - handles DELETE event", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		when(imapFacadeMock.deleteImapFolderSyncState(folderSyncStateIdMock)).thenDo(() => {
			const folderSyncState = session.imapFolderSyncStates.findIndex((folderSyncState) => isSameId(folderSyncState._id, folderSyncStateIdMock))
			if (folderSyncState !== -1) {
				session.imapFolderSyncStates.splice(folderSyncState, 1)
			}
		})

		await importer.onMailbox(accountSyncStateIdMock, imapMailboxMock, ImapSyncEventType.DELETE)

		o.check(session.imapFolderSyncStates.length).equals(0)
		verify(imapFacadeMock.deleteImapFolderSyncState(folderSyncStateIdMock), { times: 1 })
	})

	o.test("onMailboxStatus - updates folder sync state", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const updatedStateMock = { ...folderSyncStateMock, uidnext: "200" }
		when(imapFacadeMock.updateImapFolderSyncState(imapMailboxStatusMock, folderSyncStateMock)).thenResolve(updatedStateMock)

		await importer.onMailboxStatus(accountSyncStateIdMock, imapMailboxStatusMock)

		o.check(session.imapFolderSyncStates[0]).equals(updatedStateMock)
	})

	o.test("onMailboxStatus - throws if uidvalidity is different", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		imapMailboxStatusMock.uidValidity = 123n
		const e = await assertThrows(ProgrammingError, async () => await importer.onMailboxStatus(accountSyncStateIdMock, imapMailboxStatusMock))
		verify(imapFacadeMock.deleteImapFolderSyncState(folderSyncStateIdMock), { times: 1 })
		o.check(e.message).equals(`uidvalidity of a folder has changed for the account sync state ${accountSyncStateIdMock} on mail group ${mailGroupIdMock}.`)
	})

	o.test("onMultipleMails - imports mails that are not yet imported", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		session.importedMessageIds = new Set()
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const imapMails = [imapMailMock]
		const importMailParams = imapMailToImportMailParams(imapMails[0], folderSyncStateIdMock, [])
		when(importMailFacadeMock.importMails([importMailParams], mailGroupIdMock)).thenResolve()
		when(imapFacadeMock.getDeduplicatedImportedAttachmentsList(mailGroupIdMock)).thenResolve([])
		await importer.onMultipleMails(accountSyncStateIdMock, imapMails, ImapSyncEventType.CREATE)
		verify(importMailFacadeMock.importMails(anything(), mailGroupIdMock), { times: 1 })
	})

	o.test("onMultipleMails - does not import if messageId already seen", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		session.importedMessageIds = new Set(["msg123"])
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const imapMails = [imapMailMock]
		when(imapFacadeMock.getDeduplicatedImportedAttachmentsList(mailGroupIdMock)).thenResolve([])
		await importer.onMultipleMails(accountSyncStateIdMock, imapMails, ImapSyncEventType.CREATE)

		verify(importMailFacadeMock.importMails(anything(), anything()), { times: 0 })
	})

	o.test("onMultipleMails - handles SuspensionError by postponing import", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		session.importedMessageIds = new Set()
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const imapMails = [imapMailMock]
		when(importMailFacadeMock.importMails(anything(), anything())).thenReject(new SuspensionError("Server busy", "120"))
		when(imapFacadeMock.postponeImapImport(anything(), anything())).thenDo(() => (accountSyncStateMock.status = ImapAccountSyncStatus.POSTPONED))
		when(imapSyncSystemFacadeMock.stopSync(anything())).thenResolve()
		when(imapFacadeMock.getAllImapFolderSyncStates(anything())).thenResolve([])
		when(imapFacadeMock.getDeduplicatedImportedAttachmentsList(mailGroupIdMock)).thenResolve([])

		await importer.onMultipleMails(accountSyncStateIdMock, imapMails, ImapSyncEventType.CREATE)
		verify(importMailFacadeMock.importMails(anything(), anything()), { times: 1 })
		o.check(accountSyncStateMock.status).equals(ImapAccountSyncStatus.POSTPONED)
		verify(imapFacadeMock.postponeImapImport(anything(), anything()), { times: 1 })
	})

	o.test("onPostpone - postpones the import", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const postponedUntil = Date.now() + 5000
		when(imapSyncSystemFacadeMock.stopSync(anything())).thenResolve()
		when(imapFacadeMock.postponeImapImport(anything(), anything())).thenDo(() => {
			accountSyncStateMock.status = ImapAccountSyncStatus.POSTPONED
			accountSyncStateMock.postponedUntil = postponedUntil.toString()
			return accountSyncStateMock
		})
		when(imapFacadeMock.getAllImapFolderSyncStates(anything())).thenResolve([])

		await importer.onPostpone(accountSyncStateIdMock, postponedUntil)

		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.POSTPONED)
		o.check(session.imapAccountSyncState.postponedUntil).equals(postponedUntil.toString())
	})

	o.test("onFinish - marks session as FINISHED and updates folder states", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		when(imapFacadeMock.updateAllImapFolderSyncStates(accountSyncStateIdMock, ImapFolderSyncStatus.FINISHED)).thenResolve(accountSyncStateMock)

		await importer.onFinish(accountSyncStateIdMock, 5000)

		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.FINISHED)
		verify(imapFacadeMock.updateAllImapFolderSyncStates(accountSyncStateIdMock, ImapFolderSyncStatus.FINISHED), { times: 1 })
	})

	o.test("onError - sets session state to PAUSED", async () => {
		accountSyncStateMock.status = ImapAccountSyncStatus.RUNNING
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const imapError = new ImapError("Some error", ImapErrorCause.LIST_MAILBOX_FAILED)
		await importer.onError(accountSyncStateIdMock, imapError)

		o.check(session.imapAccountSyncState.status).equals(ImapAccountSyncStatus.PAUSED)
	})

	o.test("entityEventsReceived - updates existing session on ImapAccountSyncState update", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapFolderSyncStates = [folderSyncStateMock]
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const update = {
			instanceListId: "accountSyncStateListId",
			instanceId: "accountSyncStateElementId",
			operation: OperationType.UPDATE,
			typeRef: ImapAccountSyncStateTypeRef,
			instance: null,
			blobInstance: null,
			patches: [],
		} as EntityUpdateData
		when(imapFacadeMock.getImapAccountSyncStateById(accountSyncStateIdMock)).thenResolve(accountSyncStateMock)
		when(imapFacadeMock.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.entityEventsReceived([update])

		o.check(session.imapAccountSyncState).equals(accountSyncStateMock)
		o.check(session.imapFolderSyncStates).deepEquals([folderSyncStateMock])
	})

	o.test("entityEventsReceived - creates new session on CREATE operation", async () => {
		const update = {
			instanceListId: "accountSyncStateListId",
			instanceId: "accountSyncStateElementId",
			operation: OperationType.CREATE,
			typeRef: ImapAccountSyncStateTypeRef,
			instance: null,
			blobInstance: null,
			patches: [],
		} as EntityUpdateData
		when(imapFacadeMock.getImapAccountSyncStateById(accountSyncStateIdMock)).thenResolve(accountSyncStateMock)
		when(imapFacadeMock.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.entityEventsReceived([update])

		o.check(importer.activeImapImportSessions.size).equals(1)
		const newSession = importer.activeImapImportSessions.get(importer.getImapImportSessionsMapKey(accountSyncStateIdMock))
		o.check(newSession!.imapAccountSyncState).equals(accountSyncStateMock)
		o.check(newSession!.imapFolderSyncStates).deepEquals([folderSyncStateMock])
	})

	o.test("entityEventsReceived - deletes session on DELETE operation", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set(importer.getImapImportSessionsMapKey(accountSyncStateIdMock), session)

		const update = {
			instanceListId: "accountSyncStateListId",
			instanceId: "accountSyncStateElementId",
			operation: OperationType.DELETE,
			typeRef: ImapAccountSyncStateTypeRef,
			instance: null,
			blobInstance: null,
			patches: [],
		} as EntityUpdateData

		await importer.entityEventsReceived([update])

		o.check(importer.activeImapImportSessions.has(importer.getImapImportSessionsMapKey(accountSyncStateIdMock))).equals(false)
	})

	o.test("performAttachmentDeduplication - reuses existing attachment hash", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapAccountSyncState._ownerGroup = mailGroupIdMock
		const attachment: ImapMailAttachment = { size: 3, mimeType: "text/plain", content: new Buffer([1, 2, 3]) }
		const fileHash = uint8ArrayToString("utf-8", sha256Hash(attachment.content))
		const existingFileIdMock: IdTuple = ["fileList", "fileElement"]

		const groupMap = new Map<string, Promise<IdTuple | undefined>>()
		groupMap.set(fileHash, Promise.resolve(existingFileIdMock))
		importer.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupIdMock, groupMap)

		const result = await importer.performAttachmentDeduplication(session, [attachment])

		o.check(result.length).equals(1)
		const attachmentResult = result[0] as ImapImportTutaFileId
		o.check(attachmentResult._type).equals("ImapImportTutaFileId")
		o.check(attachmentResult._id).equals(existingFileIdMock)
	})

	o.test("performAttachmentDeduplication - uploads new attachment if not deduplicated", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		session.imapAccountSyncState._ownerGroup = mailGroupIdMock
		const attachment: ImapMailAttachment = { size: 3, mimeType: "image/png", content: new Buffer([1, 2, 3]), cid: "cid123", filename: "image.png" }

		const fileHash = uint8ArrayToString("utf-8", sha256Hash(attachment.content))
		when(imapFacadeMock.getDeduplicatedImportedAttachmentsList(mailGroupIdMock)).thenResolve([])

		const result = await importer.performAttachmentDeduplication(session, [attachment])

		o.check(result.length).equals(1)
		const attachmentResult = result[0] as any
		o.check(attachmentResult._type).equals("DataFile")
		o.check(attachmentResult.name).equals("image.png")
		o.check(attachmentResult.data).equals(attachment.content)
		o.check(attachmentResult.fileHash).equals(fileHash)
		o.check(attachmentResult.cid).equals("cid123")
	})

	o.test("getImapMailboxesFromServer - delegates to system facade", async () => {
		const resultMock: ImapGetMailboxResult = { result: [] }
		when(imapSyncSystemFacadeMock.getImapMailboxesFromServer(imapAccountPlainMock)).thenResolve(resultMock)

		const result = await importer.getImapMailboxesFromServer(imapAccountPlainMock)

		o.check(result).equals(resultMock)
		verify(imapSyncSystemFacadeMock.getImapMailboxesFromServer(imapAccountPlainMock), { times: 1 })
	})

	o.test("getActiveSessions - returns sessions map", async () => {
		const session = newImapImportSession(accountSyncStateMock)
		importer.activeImapImportSessions.set("key", session)

		const result = await importer.getActiveImapImportSessions()

		o.check(result).equals(importer.activeImapImportSessions)
	})
})
