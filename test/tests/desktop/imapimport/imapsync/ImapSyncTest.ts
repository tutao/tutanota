import o from "@tutao/otest"
import { ImapSyncSession } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncSession"
import { ImapSync } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSync"
import { ImapCredentials, ImapSyncState } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncState"
import { ImapError, ImapErrorCause } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapError"
import { object, verify, when } from "testdouble"
import { ImapMailbox } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"

o.spec("ImapSync", () => {
	let mockSyncSession: ImapSyncSession
	let adSync: ImapSync
	let imapSyncState: ImapSyncState
	let imapAccount: ImapCredentials

	o.beforeEach(() => {
		mockSyncSession = object<ImapSyncSession>()
		adSync = new ImapSync(mockSyncSession)
		imapSyncState = object<ImapSyncState>()
		imapAccount = object<ImapCredentials>()
	})

	o.test("startImapSync - delegates to syncSession.startSyncSession and returns result", async () => {
		const expectedResult: ImapError | null = null
		when(mockSyncSession.startSyncSession(imapSyncState)).thenResolve(expectedResult)

		const result = await adSync.startImapSync(imapSyncState)

		verify(mockSyncSession.startSyncSession(imapSyncState), { times: 1 })
		o.check(result).equals(expectedResult)
	})

	o.test("startImapSync - propagates error from syncSession", async () => {
		const expectedError = new ImapError("Connection failed", ImapErrorCause.UNKNOWN)
		when(mockSyncSession.startSyncSession(imapSyncState)).thenResolve(expectedError)

		const result = await adSync.startImapSync(imapSyncState)

		o.check(result).equals(expectedError)
	})

	o.test("stopImapSync - delegates to syncSession.stopSyncSession", async () => {
		when(mockSyncSession.stopSyncSession()).thenResolve()

		await adSync.stopImapSync()

		verify(mockSyncSession.stopSyncSession(), { times: 1 })
	})

	o.test("getImapMailboxesFromServer - delegates and returns result", async () => {
		const expectedMailboxes: ReadonlyArray<ImapMailbox> = [new ImapMailbox("INBOX")]
		when(mockSyncSession.getImapMailboxesFromServer(imapAccount)).thenResolve(expectedMailboxes)

		const result = await adSync.getImapMailboxesFromServer(imapAccount)

		verify(mockSyncSession.getImapMailboxesFromServer(imapAccount), { times: 1 })
		o.check(result).equals(expectedMailboxes)
	})
})
