import o, { assertThrows } from "@tutao/otest"
import { ImapSyncSession } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSession"
import { ImapSync } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSync"
import { ImapCredentials, ImapSyncContext } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { ImapError, ImapErrorCause } from "../../../../../src/applications/common/api/common/error/ImapError"
import { object, verify, when } from "testdouble"
import { ImapMailbox } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"

o.spec("ImapSync", () => {
	let mockSyncSession: ImapSyncSession
	let imapSync: ImapSync
	let imapSyncContext: ImapSyncContext
	let imapAccount: ImapCredentials

	o.beforeEach(() => {
		mockSyncSession = object<ImapSyncSession>()
		imapSync = new ImapSync(mockSyncSession)
		imapSyncContext = object<ImapSyncContext>()
		imapAccount = object<ImapCredentials>()
	})

	o.test("startImapSync - delegates to syncSession.startSyncSession and returns result", async () => {
		when(mockSyncSession.startSyncSession(imapSyncContext)).thenResolve()

		await imapSync.startImapSync(imapSyncContext)

		verify(mockSyncSession.startSyncSession(imapSyncContext), { times: 1 })
	})

	o.test("startImapSync - propagates error from syncSession", async () => {
		const expectedError = new ImapError("Connection failed", ImapErrorCause.UNKNOWN)
		when(mockSyncSession.startSyncSession(imapSyncContext)).thenReject(expectedError)

		const e = await assertThrows(ImapError, async () => await imapSync.startImapSync(imapSyncContext))
		o.check(e).equals(expectedError)
	})

	o.test("stopImapSync - delegates to syncSession.stopSyncSession", async () => {
		when(mockSyncSession.stopSyncSession()).thenResolve()

		await imapSync.stopImapSync()

		verify(mockSyncSession.stopSyncSession(), { times: 1 })
	})

	o.test("getImapMailboxesFromServer - delegates and returns result", async () => {
		const expectedMailboxes: ReadonlyArray<ImapMailbox> = [{ path: "INBOX" }]
		when(mockSyncSession.getImapMailboxesFromServer(imapAccount)).thenResolve(expectedMailboxes)

		const result = await imapSync.getImapMailboxesFromServer(imapAccount)

		verify(mockSyncSession.getImapMailboxesFromServer(imapAccount), { times: 1 })
		o.check(result).equals(expectedMailboxes)
	})
})
