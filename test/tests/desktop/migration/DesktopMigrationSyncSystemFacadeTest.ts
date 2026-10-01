import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { MigrationCredentials, MigrationSyncContext } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationError, MigrationErrorCause } from "../../../../src/applications/common/api/common/error/MigrationError"
import { MigrationSync } from "../../../../src/applications/common/desktop/migration/MigrationSync"
import {
	DesktopMigrationSyncSystemFacade,
	MigrationInitFolderSyncFactory,
	MigrationSyncFactory,
} from "../../../../src/applications/common/desktop/migration/DesktopMigrationSyncSystemFacade"
import { MailboxMigrationProvider } from "../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"

const { anything } = matchers

o.spec("DesktopMigrationSyncSystemFacade", () => {
	let migrationSyncMock: MigrationSync
	let transientMigrationSyncMock: MigrationSync
	let migrationSyncFactory: MigrationSyncFactory
	let migrationInitFolderSyncFactory: MigrationInitFolderSyncFactory
	let facade: DesktopMigrationSyncSystemFacade

	const mailboxMigrationSyncIdMock: IdTuple = ["listId", "elementId"]
	const migrationCredentialsMock: MigrationCredentials = {
		host: "imap.test.com",
		port: 993,
		username: "user@test.com",
		password: "pass",
		ignoreCertificateErrors: false,
		customCertificateData: null,
		provider: MailboxMigrationProvider.Other,
		useSSL: true,
		isLegacy: false,
	}
	const migrationSyncContextMock = { migrationCredentials: migrationCredentialsMock } as MigrationSyncContext
	const migrationErrorMock = new MigrationError("Connection failed", MigrationErrorCause.UNKNOWN)

	o.beforeEach(() => {
		migrationSyncMock = object<MigrationSync>()
		transientMigrationSyncMock = object<MigrationSync>()
		migrationSyncFactory = (accountSyncId: IdTuple) => {
			return migrationSyncMock
		}
		migrationInitFolderSyncFactory = () => transientMigrationSyncMock
		facade = new DesktopMigrationSyncSystemFacade(migrationSyncFactory, migrationInitFolderSyncFactory)
	})

	o.test("startSync - creates MigrationSync via factory", async () => {
		when(migrationSyncMock.startSync(migrationSyncContextMock)).thenResolve()

		await facade.startSync(mailboxMigrationSyncIdMock, migrationSyncContextMock)

		verify(migrationSyncMock.startSync(migrationSyncContextMock), { times: 1 })
		o.check(facade.activeSyncs.size).equals(1)
		o.check(facade.activeSyncs.get("listId/elementId")).equals(migrationSyncMock)
	})

	o.test("startSync - propagates error from startMigrationSync", async () => {
		when(migrationSyncMock.startSync(migrationSyncContextMock)).thenReject(migrationErrorMock)

		const e = await assertThrows(MigrationError, async () => await facade.startSync(mailboxMigrationSyncIdMock, migrationSyncContextMock))
		o.check(e).equals(migrationErrorMock)
	})

	o.test("getMigrationMailboxes - returns mailboxes", async () => {
		const mailboxesMock = [{ path: "INBOX", name: "INBOX" }]
		when(transientMigrationSyncMock.getMigrationMailboxes(migrationCredentialsMock)).thenResolve(mailboxesMock)

		const result = await facade.getMigrationMailboxes(migrationCredentialsMock)

		o.check(result).equals(mailboxesMock)
		verify(transientMigrationSyncMock.getMigrationMailboxes(migrationCredentialsMock), { times: 1 })
	})

	o.test("getMigrationMailboxes - propagates thrown error", async () => {
		const testError = new Error("Network failure")
		when(transientMigrationSyncMock.getMigrationMailboxes(migrationCredentialsMock)).thenReject(testError)

		const e = await assertThrows(Error, async () => await facade.getMigrationMailboxes(migrationCredentialsMock))
		o.check(e).equals(testError)
	})

	o.test("stopSync - stops and removes existing sync", async () => {
		when(migrationSyncMock.startSync(anything())).thenResolve()
		await facade.startSync(mailboxMigrationSyncIdMock, migrationSyncContextMock)
		o.check(facade.activeSyncs.has("listId/elementId")).equals(true)

		when(migrationSyncMock.stopSync()).thenResolve()

		await facade.stopSync(mailboxMigrationSyncIdMock)

		verify(migrationSyncMock.stopSync(), { times: 1 })
		o.check(facade.activeSyncs.has("listId/elementId")).equals(false)
	})

	o.test("stopSync - does nothing if no active sync for given id", async () => {
		await facade.stopSync(mailboxMigrationSyncIdMock)
		verify(migrationSyncMock.stopSync(), { times: 0 })
	})

	o.test("stopSync - only stops the correct sync when multiple exist", async () => {
		const migrationSync2Mock = object<MigrationSync>()
		const factory2 = (id: IdTuple) => {
			if (id.join("/") === "listId/elementId") return migrationSyncMock
			return migrationSync2Mock
		}
		const facade2 = new DesktopMigrationSyncSystemFacade(factory2, migrationInitFolderSyncFactory)

		const secondIdMock: IdTuple = ["listId2", "elementId2"]
		when(migrationSyncMock.startSync(anything())).thenResolve()
		when(migrationSync2Mock.startSync(anything())).thenResolve()
		await facade2.startSync(mailboxMigrationSyncIdMock, migrationSyncContextMock)
		await facade2.startSync(secondIdMock, migrationSyncContextMock)

		when(migrationSyncMock.stopSync()).thenResolve()
		await facade2.stopSync(mailboxMigrationSyncIdMock)

		verify(migrationSyncMock.stopSync(), { times: 1 })
		verify(migrationSync2Mock.stopSync(), { times: 0 })
		o.check(facade2.activeSyncs.has("listId/elementId")).equals(false)
		o.check(facade2.activeSyncs.has("listId2/elementId2")).equals(true)
	})
})
