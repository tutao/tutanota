import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { ImapCredentials, ImapSyncContext } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { ImapError, ImapErrorCause } from "../../../../src/applications/common/api/common/error/ImapError"
import { M365Sync } from "../../../../src/applications/common/desktop/imapimport/m365sync/M365Sync"
import {
	DesktopM365SyncSystemFacade,
	M365InitFolderSyncFactory,
	M365SyncFactory,
} from "../../../../src/applications/common/desktop/imapimport/DesktopM365SyncSystemFacade"
import { ImapProvider } from "../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"

const { anything } = matchers

o.spec("DesktopM365SyncSystemFacade", () => {
	let m365SyncMock: M365Sync
	let transientM365SyncMock: M365Sync
	let m365SyncFactory: M365SyncFactory
	let m365InitFolderSyncFactory: M365InitFolderSyncFactory
	let facade: DesktopM365SyncSystemFacade

	const accountSyncIdMock: IdTuple = ["listId", "elementId"]
	const imapCredentialsMock: ImapCredentials = {
		host: "outlook.office365.com",
		port: 993,
		username: "user@test.com",
		ignoreCertificateErrors: false,
		customCertificateData: null,
		provider: ImapProvider.Outlook,
		useSSL: true,
	}
	const imapSyncContextMock = { imapCredentials: imapCredentialsMock } as ImapSyncContext
	const imapErrorMock = new ImapError("Graph authentication failed", ImapErrorCause.AUTH_FAILED)

	o.beforeEach(() => {
		m365SyncMock = object<M365Sync>()
		transientM365SyncMock = object<M365Sync>()
		m365SyncFactory = (accountSyncId: IdTuple) => {
			return m365SyncMock
		}
		m365InitFolderSyncFactory = () => transientM365SyncMock
		facade = new DesktopM365SyncSystemFacade(m365SyncFactory, m365InitFolderSyncFactory)
	})

	o.test("startSync - creates M365Sync via factory, stores it, and returns startM365Sync result", async () => {
		when(m365SyncMock.startM365Sync(imapSyncContextMock)).thenResolve()

		await facade.startSync(accountSyncIdMock, imapSyncContextMock)

		verify(m365SyncMock.startM365Sync(imapSyncContextMock), { times: 1 })
		o.check(facade.activeSyncs.size).equals(1)
		o.check(facade.activeSyncs.get("listId/elementId")).equals(m365SyncMock)
	})

	o.test("startSync - propagates error from startM365Sync", async () => {
		when(m365SyncMock.startM365Sync(imapSyncContextMock)).thenReject(imapErrorMock)

		const e = await assertThrows(ImapError, async () => await facade.startSync(accountSyncIdMock, imapSyncContextMock))
		o.check(e).equals(imapErrorMock)
	})

	o.test("getImapMailboxesFromServer - returns mailboxes", async () => {
		const mailboxesMock = [{ path: "Inbox", name: "Inbox" }]
		when(transientM365SyncMock.getImapMailboxesFromServer(imapCredentialsMock)).thenResolve(mailboxesMock)

		const result = await facade.getImapMailboxesFromServer(imapCredentialsMock)

		o.check(result).equals(mailboxesMock)
		verify(transientM365SyncMock.getImapMailboxesFromServer(imapCredentialsMock), { times: 1 })
	})

	o.test("getImapMailboxesFromServer - propagates thrown error", async () => {
		const testError = new Error("Network failure")
		when(transientM365SyncMock.getImapMailboxesFromServer(imapCredentialsMock)).thenReject(testError)

		const e = await assertThrows(Error, async () => await facade.getImapMailboxesFromServer(imapCredentialsMock))
		o.check(e).equals(testError)
	})

	o.test("stopSync - stops and removes existing sync", async () => {
		when(m365SyncMock.startM365Sync(anything())).thenResolve()
		await facade.startSync(accountSyncIdMock, imapSyncContextMock)
		o.check(facade.activeSyncs.has("listId/elementId")).equals(true)

		when(m365SyncMock.stopM365Sync()).thenResolve()

		await facade.stopSync(accountSyncIdMock)

		verify(m365SyncMock.stopM365Sync(), { times: 1 })
		o.check(facade.activeSyncs.has("listId/elementId")).equals(false)
	})

	o.test("stopSync - does nothing if no active sync for given id", async () => {
		await facade.stopSync(accountSyncIdMock)
		verify(m365SyncMock.stopM365Sync(), { times: 0 })
	})

	o.test("stopSync - only stops the correct sync when multiple exist", async () => {
		const m365Sync2Mock = object<M365Sync>()
		const factory2 = (id: IdTuple) => {
			if (id.join("/") === "listId/elementId") return m365SyncMock
			return m365Sync2Mock
		}
		const facade2 = new DesktopM365SyncSystemFacade(factory2, m365InitFolderSyncFactory)

		const secondIdMock: IdTuple = ["listId2", "elementId2"]
		when(m365SyncMock.startM365Sync(anything())).thenResolve()
		when(m365Sync2Mock.startM365Sync(anything())).thenResolve()
		await facade2.startSync(accountSyncIdMock, imapSyncContextMock)
		await facade2.startSync(secondIdMock, imapSyncContextMock)

		when(m365SyncMock.stopM365Sync()).thenResolve()
		await facade2.stopSync(accountSyncIdMock)

		verify(m365SyncMock.stopM365Sync(), { times: 1 })
		verify(m365Sync2Mock.stopM365Sync(), { times: 0 })
		o.check(facade2.activeSyncs.has("listId/elementId")).equals(false)
		o.check(facade2.activeSyncs.has("listId2/elementId2")).equals(true)
	})
})
