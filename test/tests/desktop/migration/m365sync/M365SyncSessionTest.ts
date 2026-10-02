import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { M365SyncSession } from "../../../../../src/applications/common/desktop/migration/m365sync/M365SyncSession"
import { MigrationSyncEventListener } from "../../../../../src/applications/common/desktop/migration/MigrationSyncEventListener"
import {
	MigrationCredentials,
	MigrationMailboxState,
	MigrationSyncContext,
} from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailboxSpecialUse } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { MigrationError, MigrationErrorCause } from "../../../../../src/applications/common/api/common/error/MigrationError"
import { MailboxMigrationFolderSyncStatus, MigrationSyncEventType } from "../../../../../src/entities/tutanota/Utils"

const { argThat, anything } = matchers

/** Minimal fake of the @microsoft/microsoft-graph-client fluent request builder, keyed by request path. */
class FakeGraphRequestBuilder {
	constructor(
		private readonly client: FakeGraphClient,
		private readonly path: string,
	) {}

	header(_name: string, _value: string) {
		return this
	}

	select(_fields: string) {
		return this
	}

	query(_params: Record<string, string>) {
		return this
	}

	async get() {
		const response = this.client.responsesByPath.get(this.path)
		if (response === undefined) {
			throw new Error(`FakeGraphClient: no response configured for ${this.path}`)
		}
		if (response instanceof Error) {
			throw response
		}
		return response
	}
}

class FakeGraphClient {
	constructor(readonly responsesByPath: Map<string, any>) {}

	api(path: string) {
		return new FakeGraphRequestBuilder(this, path)
	}
}

/** startSync resolves once the mailboxes are announced, the download continues in the background. */
const flushBackgroundSync = () => new Promise((resolve) => setTimeout(resolve, 0))

o.spec("M365SyncSession", () => {
	let listenerMock: MigrationSyncEventListener
	let session: M365SyncSession

	const imapCredentialsWithToken: MigrationCredentials = {
		host: "outlook.office365.com",
		port: 993,
		username: "user@test.com",
		ignoreCertificateErrors: false,
		customCertificateData: null,
		provider: MailboxMigrationProvider.Outlook,
		useSSL: true,
		isLegacy: false,
		tokenEndpointResponse: { access_token: "token123", token_type: "Bearer" } as any,
	}

	function sessionWithFakeGraphClient(responsesByPath: Map<string, any>): M365SyncSession {
		return new M365SyncSession(listenerMock, async () => new FakeGraphClient(responsesByPath) as any)
	}

	o.beforeEach(() => {
		listenerMock = object<MigrationSyncEventListener>()
	})

	o.test("getMigrationMailboxes - builds a mailbox tree from Graph folders", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
		])
		session = sessionWithFakeGraphClient(responses)

		const result = await session.getMigrationMailboxes(imapCredentialsWithToken)

		o.check(result.length).equals(1)
		o.check(result[0].name).equals("Inbox")
		o.check(result[0].path).equals("Inbox")
		o.check(result[0].specialUse).equals(MigrationMailboxSpecialUse.INBOX)
	})

	o.test("getMigrationMailboxes - throws AUTH_FAILED when no access token is available", async () => {
		session = sessionWithFakeGraphClient(new Map())
		const credentialsWithoutToken: MigrationCredentials = { ...imapCredentialsWithToken, tokenEndpointResponse: undefined }

		const e = await assertThrows(MigrationError, async () => await session.getMigrationMailboxes(credentialsWithoutToken))
		o.check(e.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
	})

	o.test("startSync - discovers folders, syncs messages, and reports finish", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			[
				"/me/mailFolders/id-inbox/messages/delta?$expand=attachments",
				{
					value: [{ id: "graph-msg-1", subject: "Hello", isRead: true }],
				},
			],
		])
		session = sessionWithFakeGraphClient(responses)

		const mailboxState: MigrationMailboxState = { path: "Inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [mailboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(
			listenerMock.onMailbox(
				argThat((mb: any) => mb.path === "Inbox"),
				MigrationSyncEventType.CREATE,
			),
			{ times: 0 }, // the mailbox is already known (has a state), so it is not announced again
		)
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any) => mails.length === 1 && mails[0].sourceId === "graph-msg-1"),
				MigrationSyncEventType.CREATE,
			),
			{
				times: 1,
			},
		)
		verify(
			listenerMock.onMailboxStatus(argThat((status: any) => status.path === "Inbox" && status.syncStatus === MailboxMigrationFolderSyncStatus.FINISHED)),
			{
				times: 1,
			},
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - syncs a folder discovered for the first time this round, not just previously-known ones", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-custom", displayName: "Custom", childFolderCount: 0 }] }],
			["/me/mailFolders/id-custom/messages/delta?$expand=attachments", { value: [{ id: "graph-msg-custom", subject: "Hello", isRead: true }] }],
		])
		session = sessionWithFakeGraphClient(responses)

		// Custom is unknown to this round's imapSyncContext (mailboxStateByPath), matching a folder discovered
		// for the first time by discoverFolders - only onMailbox(CREATE) below "knows" about it.
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any) => mails.length === 1 && mails[0].sourceId === "graph-msg-custom"),
				MigrationSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(
			listenerMock.onMailboxStatus(argThat((status: any) => status.path === "Custom" && status.syncStatus === MailboxMigrationFolderSyncStatus.FINISHED)),
			{
				times: 1,
			},
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - a newly-discovered folder inherits noSync from its already-known excluded parent", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-excluded", displayName: "Excluded", childFolderCount: 1 }] }],
			[
				"/me/mailFolders/id-excluded/childFolders",
				{ value: [{ id: "id-child", displayName: "ExcludedChild", parentFolderId: "id-excluded", childFolderCount: 0 }] },
			],
		])
		session = sessionWithFakeGraphClient(responses)

		// The parent is already known (from a previous round) and excluded; its child is brand new this round.
		const excludedParentState: MigrationMailboxState = {
			path: "Excluded",
			importedSourceIdToMailIdsMap: new Map(),
			noSync: true,
		}
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [excludedParentState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - a mid-round stop (e.g. triggered by onMultipleMails postponing) skips onFinish for remaining folders", async () => {
		const responses = new Map<string, any>([
			[
				"/me/mailFolders",
				{
					value: [
						{ id: "id-drafts", displayName: "Drafts", childFolderCount: 0 },
						{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 },
					],
				},
			],
			["/me/mailFolders/drafts", { id: "id-drafts" }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-drafts/messages/delta?$expand=attachments", { value: [{ id: "graph-msg-drafts", subject: "Draft", isRead: true }] }],
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", { value: [{ id: "graph-msg-inbox", subject: "Hello", isRead: true }] }],
		])
		session = sessionWithFakeGraphClient(responses)
		when(listenerMock.onMultipleMails(anything(), anything())).thenDo(() => {
			// Simulates ImapImporter.onMultipleMails calling back into stopSync after a Tuta-side SuspensionError
			// on the first folder's import batch - the error itself is swallowed there and never reaches us.
			void session.stopSync()
		})

		const draftsState: MigrationMailboxState = { path: "Drafts", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const inboxState: MigrationMailboxState = { path: "Inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [draftsState, inboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 1 })
		verify(listenerMock.onFinish(), { times: 0 })
	})

	function graphError(statusCode: number, retryAfterSeconds?: number): Error {
		const error: any = new Error("graph error")
		error.statusCode = statusCode
		error.headers = { get: (name: string) => (name === "Retry-After" && retryAfterSeconds !== undefined ? String(retryAfterSeconds) : undefined) }
		return error
	}

	o.test("startSync - postpones using the Retry-After header when Graph throttles a folder sync", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", graphError(429, 120)],
		])
		session = sessionWithFakeGraphClient(responses)

		const mailboxState: MigrationMailboxState = { path: "Inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [mailboxState],
			isGmail: false,
		}

		const before = Date.now()
		await session.startSync(imapSyncContext)
		await flushBackgroundSync()
		const after = Date.now()

		verify(listenerMock.onFinish(), { times: 0 })
		verify(listenerMock.onError(anything()), { times: 0 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + 120_000 && until <= after + 120_000)), { times: 1 })
	})

	o.test("startSync - falls back to a default postpone time when Graph throttles without a Retry-After header", async () => {
		const responses = new Map<string, any>([["/me/mailFolders", graphError(429)]])
		session = sessionWithFakeGraphClient(responses)

		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [],
			isGmail: false,
		}

		const before = Date.now()
		await session.startSync(imapSyncContext)
		await flushBackgroundSync()
		const after = Date.now()

		verify(listenerMock.onFinish(), { times: 0 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + 30_000 && until <= after + 60_000)), { times: 1 })
	})

	o.test("startSync - throws AUTH_FAILED when Graph denies access with 403", async () => {
		const responses = new Map<string, any>([["/me/mailFolders", graphError(403)]])
		session = sessionWithFakeGraphClient(responses)

		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [],
			isGmail: false,
		}

		const e = await assertThrows(MigrationError, async () => await session.startSync(imapSyncContext))
		o.check(e.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
	})

	o.test("startSync - retries a failing folder once like IMAP, then postpones instead of reporting the round as finished", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", graphError(404)],
		])
		session = sessionWithFakeGraphClient(responses)

		const mailboxState: MigrationMailboxState = { path: "Inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [mailboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.PERMANENT_ERROR)), { times: 2 })
		verify(listenerMock.onPostpone(anything()), { times: 1 })
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - skips a folder's children Graph can no longer list, but still discovers and syncs its siblings", async () => {
		const responses = new Map<string, any>([
			[
				"/me/mailFolders",
				{
					value: [
						{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 },
						{ id: "id-archive", displayName: "Archive", childFolderCount: 1 },
					],
				},
			],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-archive/childFolders", graphError(404)],
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", { value: [{ id: "graph-msg-1", subject: "Hello", isRead: true }] }],
			["/me/mailFolders/id-archive/messages/delta?$expand=attachments", { value: [] }],
		])
		session = sessionWithFakeGraphClient(responses)

		const inboxState: MigrationMailboxState = { path: "Inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const archiveState: MigrationMailboxState = { path: "Archive", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [inboxState, archiveState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.PERMANENT_ERROR)), { times: 1 })
		verify(
			listenerMock.onMailbox(
				argThat((mb: any) => mb.path === "Archive"),
				MigrationSyncEventType.CREATE,
			),
			{ times: 0 }, // Archive already has a state, so it is not announced again
		)
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any) => mails.length === 1 && mails[0].sourceId === "graph-msg-1"),
				MigrationSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - postpones the whole round instead of dropping a folder's children when Graph throttles discovery", async () => {
		const responses = new Map<string, any>([
			[
				"/me/mailFolders",
				{
					value: [
						{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 },
						{ id: "id-archive", displayName: "Archive", childFolderCount: 1 },
					],
				},
			],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-archive/childFolders", graphError(429, 90)],
		])
		session = sessionWithFakeGraphClient(responses)

		const inboxState: MigrationMailboxState = { path: "Inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const archiveState: MigrationMailboxState = { path: "Archive", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [inboxState, archiveState],
			isGmail: false,
		}

		const before = Date.now()
		await session.startSync(imapSyncContext)
		await flushBackgroundSync()
		const after = Date.now()

		verify(listenerMock.onError(anything()), { times: 0 })
		verify(listenerMock.onMailbox(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 0 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + 90_000 && until <= after + 90_000)), { times: 1 })
	})
})
