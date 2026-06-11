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
import { ImapCredentials, ImapMailId } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncState"
import { DifferentialUidLoader } from "../../../../../src/applications/common/desktop/imapimport/imapsync/DifferentialUidLoader"
import { ImapMailbox } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { ImapMail } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMail"
import { ImapSyncEventType } from "../../../../../src/entities/tutanota/Utils"
import { noOp } from "../../../../../src/platform-kit/utils"

const { anything } = matchers

o.spec("ImapSyncSessionProcess", () => {
	let adSyncConfigMock: ImapSyncConfig
	let imapFlowFactoryMock: ImapFlowFactory
	let differentialUidLoaderFactoryMock: DifferentialUidLoaderFactory
	let imapClientMock: ImapFlow
	let imapSyncSessionMock: ImapSyncSession
	let eventListenerMock: ImapSyncEventListener
	let sessionProcess: ImapSyncSessionProcess
	let imapAccountMock: ImapCredentials
	let syncSessionMailboxMock: any
	let uidLoaderMock: DifferentialUidLoader

	const mailboxPath = "INBOX"

	o.beforeEach(() => {
		adSyncConfigMock = {
			isEnableImapQresync: false,
			emitAdSyncEventTypes: new Set([ImapSyncEventType.CREATE, ImapSyncEventType.UPDATE, ImapSyncEventType.DELETE]),
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

		syncSessionMailboxMock = {
			mailboxState: {
				path: mailboxPath,
				importedUidToMailIdsMap: new Map<number, ImapMailId>(),
				highestModSeq: null,
				uidValidity: null,
				uidNext: null,
			},
			downloadBatchSize: 50,
			lastFetchedMailSeq: 0,
			mailCount: 0,
			reportDownloadBatchSizeUsage: noOp,
			reportCurrentThroughput: noOp,
		}

		when(uidLoaderMock.calculateUidDiff(anything(), anything())).thenResolve([])
		when(uidLoaderMock.getNextUidFetchRequest()).thenResolve(null)

		sessionProcess = new ImapSyncSessionProcess(
			syncSessionMailboxMock,
			imapSyncSessionMock,
			adSyncConfigMock,
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
		when(imapClientMock.connect()).thenReject(error)
		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.CONNECTION_FAILED_REJECTED)
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
		adSyncConfigMock.isEnableImapQresync = false
		when(imapClientMock.connect()).thenResolve()

		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.RUNNING)
	})

	o.test("runSyncSessionProcess - QRESYNC mode with changedSince (calls background runner)", async () => {
		adSyncConfigMock.isEnableImapQresync = true
		syncSessionMailboxMock.mailboxState.highestModSeq = 12345n
		when(imapClientMock.connect()).thenResolve()

		const result = await sessionProcess.startSyncSessionProcess(imapAccountMock, eventListenerMock)
		o.check(result).equals(SyncSessionProcessState.RUNNING)
	})

	o.test("handleDeletedUids - emits DELETE events", async () => {
		const openedMailbox = new ImapMailbox("INBOX")
		const deletedUids = [5, 10]
		await sessionProcess["handleDeletedUids"](deletedUids, openedMailbox, eventListenerMock)
		verify(eventListenerMock.onMultipleMails(anything(), ImapSyncEventType.DELETE), { times: 2 })
	})

	o.test("emitImapMailDeleteEvent - deletes from map and emits DELETE", () => {
		const uid = 7
		const mailbox = new ImapMailbox("INBOX")
		syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.set(uid, new ImapMailId(uid))
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
		o.check(syncSessionMailboxMock.mailboxState.highestModSeq).equals(67890n)
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
		syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.set(1, new ImapMailId(1))
		const mail1 = new ImapMail(1, new ImapMailbox("INBOX"))
		const mail2 = new ImapMail(2, new ImapMailbox("INBOX"))
		await sessionProcess.handleQresyncFetchResult([mail1, mail2], eventListenerMock)
		verify(eventListenerMock.onMultipleMails([mail1], ImapSyncEventType.UPDATE), { times: 1 })
		verify(eventListenerMock.onMultipleMails([mail2], ImapSyncEventType.CREATE), { times: 1 })
		o.check(syncSessionMailboxMock.mailboxState.importedUidToMailIdsMap.has(2)).equals(true)
	})
})
