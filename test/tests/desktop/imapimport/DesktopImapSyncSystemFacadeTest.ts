import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { ImapCredentials, ImapSyncContext } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { ImapError, ImapErrorCause } from "../../../../src/applications/common/api/common/error/ImapError"
import { ImapSync } from "../../../../src/applications/common/desktop/imapimport/imapsync/ImapSync"
import {
	DesktopImapSyncSystemFacade,
	ImapInitFolderSyncFactory,
	ImapSyncFactory,
} from "../../../../src/applications/common/desktop/imapimport/DesktopImapSyncSystemFacade"

const { anything } = matchers

o.spec("DesktopImapSyncSystemFacade", () => {
	let imapSyncMock: ImapSync
	let transientImapSyncMock: ImapSync
	let imapSyncFactory: ImapSyncFactory
	let imapInitFolderSyncFactory: ImapInitFolderSyncFactory
	let facade: DesktopImapSyncSystemFacade

	const accountSyncIdMock: IdTuple = ["listId", "elementId"]
	const imapAccountMock: ImapCredentials = {
		host: "imap.test.com",
		port: 993,
		username: "user@test.com",
		password: "pass",
	}
	const imapSyncContextMock = { imapCredentials: imapAccountMock } as ImapSyncContext
	const imapErrorMock = new ImapError("Connection failed", ImapErrorCause.UNKNOWN)

	o.beforeEach(() => {
		imapSyncMock = object<ImapSync>()
		transientImapSyncMock = object<ImapSync>()
		imapSyncFactory = (accountSyncId: IdTuple) => {
			return imapSyncMock
		}
		imapInitFolderSyncFactory = () => transientImapSyncMock
		facade = new DesktopImapSyncSystemFacade(imapSyncFactory, imapInitFolderSyncFactory)
	})

	o.test("startSync - creates ImapSync via factory, stores it, and returns startImapSync result", async () => {
		when(imapSyncMock.startImapSync(imapSyncContextMock)).thenResolve()

		await facade.startSync(accountSyncIdMock, imapSyncContextMock)

		verify(imapSyncMock.startImapSync(imapSyncContextMock), { times: 1 })
		o.check(facade.activeSyncs.size).equals(1)
		o.check(facade.activeSyncs.get("listId/elementId")).equals(imapSyncMock)
	})

	o.test("startSync - propagates error from startImapSync", async () => {
		when(imapSyncMock.startImapSync(imapSyncContextMock)).thenReject(imapErrorMock)

		const e = await assertThrows(ImapError, async () => await facade.startSync(accountSyncIdMock, imapSyncContextMock))
		o.check(e).equals(imapErrorMock)
	})

	o.test("getImapMailboxesFromServer - returns success result with mailboxes", async () => {
		const mailboxesMock = [{ path: "INBOX", name: "INBOX" }]
		when(transientImapSyncMock.getImapMailboxesFromServer(imapAccountMock)).thenResolve(mailboxesMock)

		const result = await facade.getImapMailboxesFromServer(imapAccountMock)

		o.check(result.result).equals(mailboxesMock)
		o.check(result.error).equals(undefined)
		verify(transientImapSyncMock.getImapMailboxesFromServer(imapAccountMock), { times: 1 })
	})

	o.test("getImapMailboxesFromServer - returns error result on exception", async () => {
		const testError = new Error("Network failure")
		when(transientImapSyncMock.getImapMailboxesFromServer(imapAccountMock)).thenReject(testError)

		const result = await facade.getImapMailboxesFromServer(imapAccountMock)

		o.check(result.result).equals(undefined)
		o.check(result.error!.data).equals(ImapErrorCause.LIST_MAILBOX_FAILED)
	})

	o.test("stopSync - stops and removes existing sync", async () => {
		when(imapSyncMock.startImapSync(anything())).thenResolve()
		await facade.startSync(accountSyncIdMock, imapSyncContextMock)
		o.check(facade.activeSyncs.has("listId/elementId")).equals(true)

		when(imapSyncMock.stopImapSync()).thenResolve()

		await facade.stopSync(accountSyncIdMock)

		verify(imapSyncMock.stopImapSync(), { times: 1 })
		o.check(facade.activeSyncs.has("listId/elementId")).equals(false)
	})

	o.test("stopSync - does nothing if no active sync for given id", async () => {
		await facade.stopSync(accountSyncIdMock)
		verify(imapSyncMock.stopImapSync(), { times: 0 })
	})

	o.test("stopSync - only stops the correct sync when multiple exist", async () => {
		const imapSync2Mock = object<ImapSync>()
		const factory2 = (id: IdTuple) => {
			if (id.join("/") === "listId/elementId") return imapSyncMock
			return imapSync2Mock
		}
		const facade2 = new DesktopImapSyncSystemFacade(factory2, imapInitFolderSyncFactory)

		const secondIdMock: IdTuple = ["listId2", "elementId2"]
		when(imapSyncMock.startImapSync(anything())).thenResolve()
		when(imapSync2Mock.startImapSync(anything())).thenResolve()
		await facade2.startSync(accountSyncIdMock, imapSyncContextMock)
		await facade2.startSync(secondIdMock, imapSyncContextMock)

		when(imapSyncMock.stopImapSync()).thenResolve()
		await facade2.stopSync(accountSyncIdMock)

		verify(imapSyncMock.stopImapSync(), { times: 1 })
		verify(imapSync2Mock.stopImapSync(), { times: 0 })
		o.check(facade2.activeSyncs.has("listId/elementId")).equals(false)
		o.check(facade2.activeSyncs.has("listId2/elementId2")).equals(true)
	})
})
