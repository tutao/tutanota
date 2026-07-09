import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { ImapSyncConfig } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSync"
import { ImapFlowFactory, ImapSyncSession } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSession"
import {
	DifferentialUidLoaderFactory,
	ImapSyncSessionProcess,
	SyncSessionProcessState,
} from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSessionProcess"
import { ImapFlow } from "imapflow"
import { ImapSyncEventListener } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncEventListener"
import { ImapCredentials } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { DifferentialUidLoader } from "../../../../../src/applications/common/desktop/imapimport/imapsync/DifferentialUidLoader"
import { ImapSyncEventType } from "../../../../../src/entities/tutanota/Utils"
import { ImapSyncSessionMailbox } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSessionMailbox"

const { anything } = matchers

o.spec("ImapSyncSessionProcess", () => {
	let imapSyncConfigMock: ImapSyncConfig
	let imapFlowFactoryMock: ImapFlowFactory
	let differentialUidLoaderFactoryMock: DifferentialUidLoaderFactory
	let imapClientMock: ImapFlow
	let imapSyncSessionMock: ImapSyncSession
	let eventListenerMock: ImapSyncEventListener
	let sessionProcess: ImapSyncSessionProcess
	let imapAccountMock: ImapCredentials
	let syncSessionMailboxMock: ImapSyncSessionMailbox
	let uidLoaderMock: DifferentialUidLoader

	const mailboxPath = "INBOX"

	o.beforeEach(() => {
		imapSyncConfigMock = {
			isEnableImapQresync: false,
			emitImapSyncEventTypes: new Set([ImapSyncEventType.CREATE, ImapSyncEventType.UPDATE, ImapSyncEventType.DELETE]),
		} as any
		imapClientMock = object<ImapFlow>()
		imapFlowFactoryMock = () => Promise.resolve(imapClientMock)
		uidLoaderMock = object<DifferentialUidLoader>()
		imapSyncSessionMock = object<ImapSyncSession>()
		differentialUidLoaderFactoryMock = () => uidLoaderMock
		eventListenerMock = object<ImapSyncEventListener>()
		imapAccountMock = {
			host: "localhost",
			port: 993,
			username: "user",
			password: "pass",
		} as any

		syncSessionMailboxMock = new ImapSyncSessionMailbox({ path: mailboxPath, importedUidToMailIdsMap: new Map(), noSync: false })

		when(uidLoaderMock.calculateUidDiff(anything(), anything())).thenResolve([])
		when(uidLoaderMock.getNextUidFetchRequest()).thenResolve(null)

		sessionProcess = new ImapSyncSessionProcess(
			syncSessionMailboxMock,
			imapSyncSessionMock,
			imapSyncConfigMock,
			imapFlowFactoryMock,
			differentialUidLoaderFactoryMock,
		)
	})

	o.test("startSyncSessionProcess - connects, starts sync, returns RUNNING", async () => {
		when(imapClientMock.connect()).thenResolve()
		when(imapClientMock.mailboxOpen(anything(), anything())).thenResolve({})
		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.RUNNING)
		verify(imapClientMock.connect(), { times: 1 })
	})

	o.test("startSyncSessionProcess - handles connection error with responseStatus NO", async () => {
		const error = new Error("NO authentication failed") as any
		error.responseStatus = "NO"
		when(imapClientMock.mailboxOpen(anything())).thenReject(error)
		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN)
	})

	o.test("startSyncSessionProcess - handles unknown error", async () => {
		const error = new Error("Network failure")
		when(imapClientMock.connect()).thenReject(error)
		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN)
	})

	o.test("stopSyncSessionProcess - stops optimizer and returns mailbox", async () => {
		const result = await sessionProcess.stopSyncSessionProcess()
		o.check(sessionProcess.state).equals(SyncSessionProcessState.STOPPED)
	})

	o.test("runSyncSessionProcess - full sync with CREATE events (calls background runner)", async () => {
		imapSyncConfigMock.isEnableImapQresync = false
		when(imapClientMock.connect()).thenResolve()
		when(imapClientMock.mailboxOpen(anything(), anything())).thenResolve({
			path: syncSessionMailboxMock.mailboxState.path,
			uidValidity: 12345n,
			uidNext: 100,
			highestModseq: 67890n,
			exists: 15,
		})
		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.RUNNING)
	})

	o.test("runSyncSessionProcess - QRESYNC mode with changedSince (calls background runner)", async () => {
		imapSyncConfigMock.isEnableImapQresync = true
		syncSessionMailboxMock.mailboxState.highestModSeq = 12345n

		when(imapClientMock.connect()).thenResolve()
		when(imapClientMock.mailboxOpen(anything(), anything())).thenResolve({
			path: syncSessionMailboxMock.mailboxState.path,
			uidValidity: 12345n,
			uidNext: 100,
			highestModseq: 67890n,
			exists: 15,
		})
		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.RUNNING)
	})

	o.test("handleDeletedUids - emits DELETE events", async () => {
		const openedMailbox = { path: "INBOX" }
		const deletedUids = [5, 10]
		await sessionProcess["handleDeletedUids"](deletedUids, openedMailbox, eventListenerMock)
		verify(eventListenerMock.onMultipleMails(anything(), ImapSyncEventType.DELETE), { times: 2 })
	})

	o.test("emitImapMailDeleteEvent - deletes from map and emits DELETE", () => {
		const uid = 7
		const mailbox = { path: "INBOX" }
		syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.set(uid, { uid })
		sessionProcess["emitImapMailDeleteEvent"](uid, mailbox, eventListenerMock)
		o.check(syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.has(uid)).equals(false)
		verify(eventListenerMock.onMultipleMails(anything(), ImapSyncEventType.DELETE), { times: 1 })
	})

	o.test("updateSyncSessionMailbox - updates state from status", () => {
		const status = {
			uidValidity: 12345n,
			uidNext: 100,
			highestModSeq: 67890n,
			messageCount: 15,
		}
		sessionProcess["updateSyncSessionMailbox"](status as any)
		o.check(syncSessionMailboxMock.mailboxState.uidValidity).equals(12345n)
		o.check(syncSessionMailboxMock.mailboxState.uidNext).equals(100)
		//no longer update the highestModSeq as it's done in the server
		o.check(syncSessionMailboxMock.mailboxState.highestModSeq).equals(undefined)
		o.check(syncSessionMailboxMock.mailCount).equals(15)
	})

	o.test("logout - calls onMailboxFinish when finished", async () => {
		await sessionProcess.logout(imapClientMock, true, 5)
		verify(imapClientMock.logout(), { times: 1 })
		verify(imapSyncSessionMock.onMailboxFinish(syncSessionMailboxMock), { times: 1 })
	})

	o.test("logout - calls onMailboxInterrupted when not finished", async () => {
		await sessionProcess.logout(imapClientMock, false, 5)
		verify(imapClientMock.logout(), { times: 1 })
		verify(imapSyncSessionMock.onMailboxInterrupted(syncSessionMailboxMock), { times: 1 })
		o.check(syncSessionMailboxMock.lastFetchedMailSeq).equals(5)
	})

	o.test("setupImapFlowErrorHandler - logs error and logs out", async () => {
		const error = new Error("Connection lost")
		when(imapClientMock.on("error", anything())).thenDo((event, handler) => {
			handler(error)
		})
		when(eventListenerMock.onError(anything())).thenResolve()
		when(imapClientMock.logout()).thenResolve()
		sessionProcess.setupImapFlowErrorHandler(imapClientMock, eventListenerMock)
		const callbacks = (imapClientMock as any).on.calls
		const onErrorCall = callbacks.find((c) => c.args[0] === "error")
		if (onErrorCall) onErrorCall.args[1](error)
		verify(eventListenerMock.onError(anything()), { times: 1 })
		verify(imapClientMock.logout(), { times: 1 })
	})

	o.test("handleQresyncFetchResult - splits into updates and creates", async () => {
		syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.set(1, { uid: 1 })
		const mail1 = { uid: 1, belongsToMailbox: { path: "INBOX" } }
		const mail2 = { uid: 2, belongsToMailbox: { path: "INBOX" } }
		await sessionProcess.handleQresyncFetchResult([mail1, mail2], eventListenerMock)
		verify(eventListenerMock.onMultipleMails([mail1], ImapSyncEventType.UPDATE), { times: 1 })
		verify(eventListenerMock.onMultipleMails([mail2], ImapSyncEventType.CREATE), { times: 1 })
		o.check(syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.has(2)).equals(true)
	})
})
