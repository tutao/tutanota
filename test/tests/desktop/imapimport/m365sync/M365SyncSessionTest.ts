import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { M365SyncSession } from "../../../../../src/applications/common/desktop/imapimport/m365sync/M365SyncSession"
import { ImapSyncEventListener } from "../../../../../src/applications/common/desktop/imapimport/imapsync/ImapSyncEventListener"
import { ImapCredentials, ImapMailboxState, ImapSyncContext } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapSyncContext"
import { ImapMailboxSpecialUse } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { ImapProvider } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapError, ImapErrorCause } from "../../../../../src/applications/common/api/common/error/ImapError"
import { ImapFolderSyncStatus, ImapSyncEventType } from "../../../../../src/entities/tutanota/Utils"

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

o.spec("M365SyncSession", () => {
	let listenerMock: ImapSyncEventListener
	let session: M365SyncSession

	const imapCredentialsWithToken: ImapCredentials = {
		host: "outlook.office365.com",
		port: 993,
		username: "user@test.com",
		ignoreCertificateErrors: false,
		customCertificateData: null,
		provider: ImapProvider.Outlook,
		useSSL: true,
		tokenEndpointResponse: { access_token: "token123", token_type: "Bearer" } as any,
	}

	function sessionWithFakeGraphClient(responsesByPath: Map<string, any>): M365SyncSession {
		return new M365SyncSession(listenerMock, async () => new FakeGraphClient(responsesByPath) as any)
	}

	o.beforeEach(() => {
		listenerMock = object<ImapSyncEventListener>()
	})

	o.test("getImapMailboxesFromServer - builds a mailbox tree from Graph folders", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
		])
		session = sessionWithFakeGraphClient(responses)

		const result = await session.getImapMailboxesFromServer(imapCredentialsWithToken)

		o.check(result.length).equals(1)
		o.check(result[0].name).equals("Inbox")
		o.check(result[0].path).equals("Inbox")
		o.check(result[0].specialUse).equals(ImapMailboxSpecialUse.INBOX)
	})

	o.test("getImapMailboxesFromServer - throws AUTH_FAILED when no access token is available", async () => {
		session = sessionWithFakeGraphClient(new Map())
		const credentialsWithoutToken: ImapCredentials = { ...imapCredentialsWithToken, tokenEndpointResponse: undefined }

		const e = await assertThrows(ImapError, async () => await session.getImapMailboxesFromServer(credentialsWithoutToken))
		o.check(e.data.cause).equals(ImapErrorCause.AUTH_FAILED)
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

		const mailboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [mailboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

		verify(
			listenerMock.onMailbox(
				argThat((mb: any) => mb.path === "Inbox"),
				ImapSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any) => mails.length === 1 && mails[0].sourceId === "graph-msg-1"),
				ImapSyncEventType.CREATE,
			),
			{
				times: 1,
			},
		)
		verify(listenerMock.onMailboxStatus(argThat((status: any) => status.path === "Inbox" && status.syncStatus === ImapFolderSyncStatus.FINISHED)), {
			times: 1,
		})
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
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any) => mails.length === 1 && mails[0].sourceId === "graph-msg-custom"),
				ImapSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(listenerMock.onMailboxStatus(argThat((status: any) => status.path === "Custom" && status.syncStatus === ImapFolderSyncStatus.FINISHED)), {
			times: 1,
		})
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - a newly-discovered folder inherits noSync from its already-known excluded parent", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-excluded", displayName: "Excluded", childFolderCount: 1 }] }],
			["/me/mailFolders/id-excluded/childFolders", { value: [{ id: "id-child", displayName: "ExcludedChild", childFolderCount: 0 }] }],
		])
		session = sessionWithFakeGraphClient(responses)

		// The parent is already known (from a previous round) and excluded; its child is brand new this round.
		const excludedParentState: ImapMailboxState = { path: "Excluded", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: true }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [excludedParentState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("stop - halts before syncing any further folders and does not report the round as finished", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
		])
		session = sessionWithFakeGraphClient(responses)
		session.stop()

		const mailboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [mailboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 0 })
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
			session.stop()
		})

		const draftsState: ImapMailboxState = { path: "Drafts", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const inboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [draftsState, inboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

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

		const mailboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [mailboxState],
			isGmail: false,
		}

		const before = Date.now()
		await session.startSync(imapSyncContext)
		const after = Date.now()

		verify(listenerMock.onFinish(), { times: 0 })
		verify(listenerMock.onError(anything()), { times: 0 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + 120_000 && until <= after + 120_000)), { times: 1 })
	})

	o.test("startSync - falls back to a default postpone time when Graph throttles without a Retry-After header", async () => {
		const responses = new Map<string, any>([["/me/mailFolders", graphError(429)]])
		session = sessionWithFakeGraphClient(responses)

		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [],
			isGmail: false,
		}

		const before = Date.now()
		await session.startSync(imapSyncContext)
		const after = Date.now()

		verify(listenerMock.onFinish(), { times: 0 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + 30_000 && until <= after + 60_000)), { times: 1 })
	})

	o.test("startSync - throws AUTH_FAILED when Graph denies access with 403", async () => {
		const responses = new Map<string, any>([["/me/mailFolders", graphError(403)]])
		session = sessionWithFakeGraphClient(responses)

		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [],
			isGmail: false,
		}

		const e = await assertThrows(ImapError, async () => await session.startSync(imapSyncContext))
		o.check(e.data.cause).equals(ImapErrorCause.AUTH_FAILED)
	})

	o.test("startSync - reports PERMANENT_ERROR and continues past a folder Graph can no longer find", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", graphError(404)],
		])
		session = sessionWithFakeGraphClient(responses)

		const mailboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [mailboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

		verify(listenerMock.onPostpone(anything()), { times: 0 })
		verify(listenerMock.onError(argThat((e: ImapError) => e.data.cause === ImapErrorCause.PERMANENT_ERROR)), { times: 1 })
		verify(listenerMock.onFinish(), { times: 1 })
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

		const inboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const archiveState: ImapMailboxState = { path: "Archive", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [inboxState, archiveState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)

		verify(listenerMock.onError(argThat((e: ImapError) => e.data.cause === ImapErrorCause.PERMANENT_ERROR)), { times: 1 })
		verify(
			listenerMock.onMailbox(
				argThat((mb: any) => mb.path === "Archive"),
				ImapSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any) => mails.length === 1 && mails[0].sourceId === "graph-msg-1"),
				ImapSyncEventType.CREATE,
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

		const inboxState: ImapMailboxState = { path: "Inbox", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const archiveState: ImapMailboxState = { path: "Archive", importedUidToMailIdsMap: new Map(), importedSourceIds: new Set(), noSync: false }
		const imapSyncContext: ImapSyncContext = {
			imapCredentials: imapCredentialsWithToken,
			maxQuota: 1000,
			imapMailboxStates: [inboxState, archiveState],
			isGmail: false,
		}

		const before = Date.now()
		await session.startSync(imapSyncContext)
		const after = Date.now()

		verify(listenerMock.onError(anything()), { times: 0 })
		verify(listenerMock.onMailbox(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 0 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + 90_000 && until <= after + 90_000)), { times: 1 })
	})
})
