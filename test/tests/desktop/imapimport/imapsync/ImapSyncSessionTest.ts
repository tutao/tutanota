import o from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { ImapSyncEventListener } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncEventListener"
import type { ImapFlow } from "imapflow"
import { ImapFlowFactory, ImapSyncSession, SyncSessionState } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSession"
import { ImapCredentials, ImapSyncState } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncState"
import { ImapSyncSessionMailbox } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSessionMailbox"
import { ImapErrorCause } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapError"
import { ImapSyncSessionProcess } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSessionProcess"
import { ImapSyncConfig } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSync"

o.spec("ImapSyncSession", () => {
	let eventListenerMock: ImapSyncEventListener
	let ConfigMock: ImapSyncConfig
	let imapFlowFactory: ImapFlowFactory
	let imapFlowMock: ImapFlow
	let session: ImapSyncSession

	const imapAccount: ImapCredentials = { host: "localhost", port: 993, username: "user", password: "pass" }
	const imapSyncState: ImapSyncState = {
		imapAccount,
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
		session = new ImapSyncSession(eventListenerMock, ConfigMock, imapFlowFactory)
	})

	o.test("startSyncSession - when not running, sets up and starts sync", async () => {
		const result = await session.startSyncSession(imapSyncState)
		o.check(result).equals(null)
		verify(imapFlowMock.connect(), { times: 2 })
		verify(imapFlowMock.listTree(), { times: 1 })
		verify(imapFlowMock.logout(), { times: 1 })
	})

	o.test("startSyncSession - when already running, does nothing", async () => {
		await session.startSyncSession(imapSyncState)
		const result = await session.startSyncSession(imapSyncState)
		o.check(result).equals(null)
	})

	o.test("startSyncSession - returns ImapError when authentication fails", async () => {
		const error = new Error("Authentication failed") as any
		error.serverResponseCode = "AUTHENTICATIONFAILED"
		when(imapFlowMock.connect()).thenReject(error)

		const result = await session.startSyncSession(imapSyncState)
		o.check(result!.cause).equals(ImapErrorCause.AUTH_FAILED)
	})

	o.test("stopSyncSession - stops optimizer and all processes", async () => {
		await session.startSyncSession(imapSyncState)
		await session.stopSyncSession()
		o.check(session.state).equals(SyncSessionState.PAUSED)
	})

	o.test("onDownloadQuotaUpdate - triggers postpone when quota threshold reached", async () => {
		await session.startSyncSession(imapSyncState)
		const safetyThreshold = 50_000_000
		const maxQuota = 100_000_000
		const update = maxQuota - safetyThreshold + 1
		const mailboxMock = object<ImapSyncSessionMailbox>()
		await session.onDownloadQuotaUpdate(mailboxMock, update)

		verify(eventListenerMock.onPostpone(matchers.isA(Number)), { times: 1 })
		o.check(session.state.valueOf()).equals(SyncSessionState.POSTPONED.valueOf())
	})

	o.test("onAllMailboxesFinish - finishes and calls onFinish", async () => {
		await session.startSyncSession(imapSyncState)
		session["downloadedQuotas"] = [100, 200]
		await session.onAllMailboxesFinish()

		verify(eventListenerMock.onFinish(300), { times: 1 })
		o.check(session.state.valueOf()).equals(SyncSessionState.FINISHED.valueOf())
	})

	o.test("getImapMailboxesFromServer - returns array of ImapMailbox", async () => {
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)

		const result = await session.getImapMailboxesFromServer(imapAccount)
		o.check(result.length).equals(1)
		o.check(result[0].path).equals("INBOX")
		verify(imapFlowMock.connect(), { times: 1 })
		verify(imapFlowMock.logout(), { times: 1 })
	})

	o.test("onStartSyncSessionProcess - creates a new process and starts it", async () => {
		await session.startSyncSession(imapSyncState)
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
