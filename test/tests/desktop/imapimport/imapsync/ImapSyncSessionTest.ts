import o, { assertThrows } from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { ImapSyncEventListener } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncEventListener"
import type { ImapFlow } from "imapflow"
import { ImapFlowFactory, ImapSyncSession, SyncSessionState } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSession"
import { ImapCredentials, ImapMailboxState, ImapSyncContext } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { ImapSyncConfig } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSync"
import { ImapError, ImapErrorCause } from "../../../../../src/applications/common/api/common/error/ImapError"
import { ImapSyncSessionMailbox } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSessionMailbox"
import { ImapSyncSessionProcess } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSessionProcess"

o.spec("ImapSyncSession", () => {
	let eventListenerMock: ImapSyncEventListener
	let ConfigMock: ImapSyncConfig
	let imapFlowFactory: ImapFlowFactory
	let imapFlowMock: ImapFlow
	let session: ImapSyncSession

	const imapCredentials: ImapCredentials = { host: "localhost", port: 993, username: "user", password: "pass" }
	const imapSyncContext: ImapSyncContext = {
		imapCredentials: imapCredentials,
		maxQuota: 100_000_000,
		imapMailboxStates: [],
	}

	o.beforeEach(() => {
		eventListenerMock = object<ImapSyncEventListener>()
		ConfigMock = {
			emitAdSyncEventTypes: new Set(),
			isEnableImapQresync: true,
		}
		imapFlowMock = object<ImapFlow>()
		imapFlowFactory = () => Promise.resolve(imapFlowMock)
		const listTreeResponse = { folders: [{ disabled: false, path: "INBOX" }] }
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		when(imapFlowMock.mailboxOpen(matchers.anything(), matchers.anything())).thenResolve({})
		when(imapFlowMock.fetch(matchers.anything(), matchers.anything())).thenResolve((async function* () {})())
		session = new ImapSyncSession(eventListenerMock, ConfigMock, imapFlowFactory)
	})

	o.test("startSyncSession - when not running, sets up and starts sync", async () => {
		await session.startSyncSession(imapSyncContext)
		verify(imapFlowMock.connect(), { times: 2 })
		verify(imapFlowMock.listTree(), { times: 1 })
		verify(imapFlowMock.logout(), { times: 1 })
	})

	o.test("startSyncSession - when already running, does nothing", async () => {
		session.state = SyncSessionState.RUNNING

		await session.startSyncSession(imapSyncContext)

		verify(imapFlowMock.connect(), { times: 0 })
		verify(imapFlowMock.listTree(), { times: 0 })
		verify(imapFlowMock.logout(), { times: 0 })
		o.check(session.state).equals(SyncSessionState.RUNNING)
	})

	o.test("startSyncSession - returns ImapError when authentication fails", async () => {
		const error = new Error("Authentication failed") as any
		error.serverResponseCode = "AUTHENTICATIONFAILED"
		when(imapFlowMock.connect()).thenReject(error)

		const e = await assertThrows(ImapError, async () => await session.startSyncSession(imapSyncContext))
		o.check(e!.data).equals(ImapErrorCause.AUTH_FAILED)
	})

	o.test("startSyncSession - returns ImapError with postpone when non-auth error happens", async () => {
		const error = new Error("Server connection failed") as any
		when(imapFlowMock.connect()).thenReject(error)

		const e = await assertThrows(ImapError, async () => await session.startSyncSession(imapSyncContext))
		o.check(e!.data).equals(ImapErrorCause.POSTPONE)
		o.check(session!.state).equals(SyncSessionState.POSTPONED)
	})

	o.test("stopSyncSession - stops all processes", async () => {
		await session.startSyncSession(imapSyncContext)
		await session.stopSyncSession()
		o.check(session.state).equals(SyncSessionState.PAUSED)
	})

	o.test("onAllMailboxesFinish - finishes and calls onFinish", async () => {
		await session.startSyncSession(imapSyncContext)
		await session.onAllMailboxesFinish()

		verify(eventListenerMock.onFinish(), { times: 1 })
		o.check(session.state.valueOf()).equals(SyncSessionState.FINISHED.valueOf())
	})

	o.test("startNextMailboxSync - starts the next mailbox sorted by importance if failureCount is 0", async () => {
		const draftFolderState = {
			path: "DRAFT",
			uidValidity: 1n,
			uidNext: 2,
			highestModSeq: 1n,
			importedUidToMailIdsMap: new Map(),
		} as ImapMailboxState
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: false, path: "DRAFT", name: "DRAFT" },
				{ disabled: false, path: "Custom", name: "Custom" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: ImapSyncContext = {
			imapCredentials: imapCredentials,
			maxQuota: 100,
			imapMailboxStates: [],
		}
		await session.startSyncSession(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		const syncSessionMailbox = new ImapSyncSessionMailbox(draftFolderState)
		session.syncSessionMailboxes[0].importance = 1 // INBOX
		session.syncSessionMailboxes[1].importance = 2 // DRAFT
		session.syncSessionMailboxes[2].importance = 3 // CUSTOM

		await session.onMailboxFinish(syncSessionMailbox)

		o(session.runningSyncSessionProcess?.syncSessionProcessMailbox.mailboxState.path).equals("Custom")
	})

	o.test("startNextMailboxSync - starts the next mailbox sorted by failure count if failureCount is same", async () => {
		const draftFolderState = {
			path: "DRAFT",
			uidValidity: 1n,
			uidNext: 2,
			highestModSeq: 1n,
			importedUidToMailIdsMap: new Map(),
		} as ImapMailboxState
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: false, path: "DRAFT", name: "DRAFT" },
				{ disabled: false, path: "Custom", name: "Custom" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: ImapSyncContext = {
			imapCredentials: imapCredentials,
			maxQuota: 100,
			imapMailboxStates: [],
		}
		await session.startSyncSession(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		const syncSessionMailbox = new ImapSyncSessionMailbox(draftFolderState)
		session.syncSessionMailboxes[0].importance = 2 // INBOX
		session.syncSessionMailboxes[0].failCount = 0 // INBOX
		session.syncSessionMailboxes[2].importance = 2 // CUSTOM
		session.syncSessionMailboxes[2].failCount = 1 // CUSTOM

		await session.onMailboxFinish(syncSessionMailbox)

		o(session.runningSyncSessionProcess?.syncSessionProcessMailbox.mailboxState.path).equals("INBOX")
	})

	o.test("startNextMailboxSync - sorts by failure count and then importance", async () => {
		const draftFolderState = {
			path: "DRAFT",
			uidValidity: 1n,
			uidNext: 2,
			highestModSeq: 1n,
			importedUidToMailIdsMap: new Map(),
		} as ImapMailboxState
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: false, path: "DRAFT", name: "DRAFT" },
				{ disabled: false, path: "Custom", name: "Custom" },
				{ disabled: false, path: "Another", name: "Another" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: ImapSyncContext = {
			imapCredentials: imapCredentials,
			maxQuota: 100,
			imapMailboxStates: [],
		}
		await session.startSyncSession(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		const syncSessionMailbox = new ImapSyncSessionMailbox(draftFolderState)
		session.syncSessionMailboxes[0].importance = 1 // INBOX
		session.syncSessionMailboxes[0].failCount = 0 // INBOX
		session.syncSessionMailboxes[2].importance = 2 // CUSTOM
		session.syncSessionMailboxes[2].failCount = 0 // CUSTOM
		session.syncSessionMailboxes[3].importance = 3 // Another
		session.syncSessionMailboxes[3].failCount = 1 // Another

		await session.onMailboxFinish(syncSessionMailbox)

		o(session.runningSyncSessionProcess?.syncSessionProcessMailbox.mailboxState.path).equals("Custom")
	})

	o.test("getImapMailboxesFromServer - returns array of ImapMailbox", async () => {
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)

		const result = await session.getImapMailboxesFromServer(imapCredentials)
		o.check(result.length).equals(1)
		o.check(result[0].path).equals("INBOX")
		verify(imapFlowMock.connect(), { times: 1 })
		verify(imapFlowMock.logout(), { times: 1 })
	})

	o.test("onStartSyncSessionProcess - creates a new process and starts it", async () => {
		await session.startSyncSession(imapSyncContext)
		const mailboxMock = object<ImapSyncSessionMailbox>()
		session.startMailboxSync(mailboxMock)
	})

	o.test("onStopSyncSessionProcess - stops and removes process", async () => {
		const processMock = { stopSyncSessionProcess: func() } as ImapSyncSessionProcess
		const mailboxMock = object<ImapSyncSessionMailbox>()
		session.runningSyncSessionProcess = processMock
		session.stopMailboxSync(mailboxMock)
		verify(processMock.stopSyncSessionProcess(), { times: 1 })
	})
})
