import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { M365SyncSession } from "../../../../../src/applications/common/desktop/migration/m365sync/M365SyncSession"
import { GraphMailApi } from "../../../../../src/applications/common/desktop/migration/m365sync/GraphApiClient"
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

import { GraphApiError } from "../../../../../src/applications/common/desktop/migration/ApiClientRequestUtils"
import { MigrationMail } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMail"

const { argThat, anything } = matchers

/** Fake of the Graph API, answers with the response that is configured for the Graph path of the request. */
function fakeGraphApi(responsesByPath: Map<string, any>, downloadedMessageIds: string[] = []): GraphMailApi {
	const respond = (path: string) => {
		const response = responsesByPath.get(path)
		if (response === undefined) {
			throw new Error(`FakeGraphApi: no response configured for ${path}`)
		}
		if (response instanceof Error) {
			throw response
		}
		return response
	}
	return {
		async getSystemFolderId(name: string) {
			try {
				return respond(`/me/mailFolders/${name}`).id
			} catch {
				return null // the mailbox does not have this folder
			}
		},
		async listFolders() {
			return respond("/me/mailFolders").value
		},
		async listChildFolders(folderId: string) {
			return respond(`/me/mailFolders/${folderId}/childFolders`).value
		},
		async listMessageIds(folderId: string) {
			const response = respond(`/me/mailFolders/${folderId}/messages/delta?$expand=attachments`)
			return {
				ids: response.value.filter((message: any) => !message["@removed"]).map((message: any) => message.id),
				removedIds: response.value.filter((message: any) => message["@removed"]).map((message: any) => message.id),
				nextLink: response["@odata.nextLink"] ?? null,
			}
		},
		messageBatchSize: 2,
		async getMessages(ids: string[]) {
			downloadedMessageIds.push(...ids)
			const allMessages = Array.from(responsesByPath.entries())
				.filter(([path]) => path.endsWith("/messages/delta?$expand=attachments"))
				.flatMap(([, response]) => response.value)
			// like the real client, messages that do not exist anymore are left out
			return ids.map((id) => allMessages.find((message: any) => message.id === id)).filter((message) => message != null)
		},
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

	let downloadedMessageIds: string[]

	function sessionWithFakeGraphClient(responsesByPath: Map<string, any>): M365SyncSession {
		downloadedMessageIds = []
		return new M365SyncSession(listenerMock, () => fakeGraphApi(responsesByPath, downloadedMessageIds))
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
		o.check(result[0].sourceId).equals("id-inbox")
		o.check(result[0].specialUse).equals(MigrationMailboxSpecialUse.INBOX)
	})

	o.test("getMigrationMailboxes - nests the child folders below their parent, identified by the ids of the folders", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-parent", displayName: "Parent", childFolderCount: 1 }] }],
			["/me/mailFolders/id-parent/childFolders", { value: [{ id: "id-child", displayName: "Child", parentFolderId: "id-parent", childFolderCount: 1 }] }],
			[
				"/me/mailFolders/id-child/childFolders",
				{ value: [{ id: "id-grandchild", displayName: "Grandchild", parentFolderId: "id-child", childFolderCount: 0 }] },
			],
		])
		session = sessionWithFakeGraphClient(responses)

		const result = await session.getMigrationMailboxes(imapCredentialsWithToken)

		o.check(result.map((mailbox) => mailbox.sourceId)).deepEquals(["id-parent"])
		const child = result[0].subFolders![0]
		o.check(child.sourceId).equals("id-child")
		o.check(child.name).equals("Child")
		o.check(child.parentFolder === result[0]).equals(true)
		const grandchild = child.subFolders![0]
		o.check(grandchild.sourceId).equals("id-grandchild")
		o.check(grandchild.name).equals("Grandchild")
		o.check(grandchild.parentFolder === child).equals(true)
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

		const mailboxState: MigrationMailboxState = { sourceId: "id-inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const imapSyncContext: MigrationSyncContext = {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [mailboxState],
			isGmail: false,
		}

		await session.startSync(imapSyncContext)
		await flushBackgroundSync()

		verify(
			listenerMock.onMailbox(
				argThat((mb: any) => mb.sourceId === "id-inbox"),
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
			listenerMock.onMailboxStatus(
				argThat((status: any) => status.sourceId === "id-inbox" && status.syncStatus === MailboxMigrationFolderSyncStatus.FINISHED),
			),
			{
				times: 1,
			},
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - only downloads the mails that were not imported yet, mails removed from the folder are ignored", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			[
				"/me/mailFolders/id-inbox/messages/delta?$expand=attachments",
				{
					value: [
						{ id: "known", subject: "Known" },
						{ id: "new-1", subject: "New 1", isRead: true },
						{ id: "new-2", subject: "New 2", isRead: true },
						{ id: "removed-known", "@removed": { reason: "deleted" } },
					],
				},
			],
		])
		session = sessionWithFakeGraphClient(responses)
		const mailboxState: MigrationMailboxState = {
			sourceId: "id-inbox",
			importedSourceIdToMailIdsMap: new Map([
				["known", { sourceId: "known" }],
				["removed-known", { sourceId: "removed-known" }],
			]),
			noSync: false,
		}

		await session.startSync({ migrationCredentials: imapCredentialsWithToken, migrationMailboxStates: [mailboxState], isGmail: false })
		await flushBackgroundSync()

		o.check(downloadedMessageIds).deepEquals(["new-1", "new-2"])
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: MigrationMail[]) => mails.length === 2 && mails[0].sourceId === "new-1" && mails[1].sourceId === "new-2"),
				MigrationSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - lists the ids page by page and downloads the unknown mails of every page", async () => {
		const client = fakeGraphApi(
			new Map<string, any>([
				["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
				["/me/mailFolders/inbox", { id: "id-inbox" }],
				["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", { value: [{ id: "a" }, { id: "known" }, { id: "b" }] }],
			]),
		)
		const requestedNextLinks: (string | null | undefined)[] = []
		client.listMessageIds = async (_folderId: string, nextLink?: string | null) => {
			requestedNextLinks.push(nextLink)
			return nextLink
				? { ids: ["b"], removedIds: [], nextLink: null }
				: { ids: ["a", "known"], removedIds: [], nextLink: "https://graph.microsoft.com/next" }
		}
		const handedOver: string[][] = []
		listenerMock.onMultipleMails = async (mails: any[]) => {
			handedOver.push(mails.map((mail) => mail.sourceId))
		}
		const mailboxState: MigrationMailboxState = {
			sourceId: "id-inbox",
			importedSourceIdToMailIdsMap: new Map([["known", { sourceId: "known" }]]),
			noSync: false,
		}

		await new M365SyncSession(listenerMock, () => client).startSync({
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [mailboxState],
			isGmail: false,
		})
		await flushBackgroundSync()

		o.check(requestedNextLinks).deepEquals([null, "https://graph.microsoft.com/next"])
		// the mails are handed over page by page
		o.check(handedOver).deepEquals([["a"], ["b"]])
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - downloads nothing when all mails of the folder were imported already", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
			["/me/mailFolders/inbox", { id: "id-inbox" }],
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", { value: [{ id: "known" }] }],
		])
		session = sessionWithFakeGraphClient(responses)
		const mailboxState: MigrationMailboxState = {
			sourceId: "id-inbox",
			importedSourceIdToMailIdsMap: new Map([["known", { sourceId: "known" }]]),
			noSync: false,
		}

		await session.startSync({ migrationCredentials: imapCredentialsWithToken, migrationMailboxStates: [mailboxState], isGmail: false })
		await flushBackgroundSync()

		o.check(downloadedMessageIds.length).equals(0)
		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - syncs a folder discovered for the first time this round, not just previously-known ones", async () => {
		const responses = new Map<string, any>([
			["/me/mailFolders", { value: [{ id: "id-custom", displayName: "Custom", childFolderCount: 0 }] }],
			["/me/mailFolders/id-custom/messages/delta?$expand=attachments", { value: [{ id: "graph-msg-custom", subject: "Hello", isRead: true }] }],
		])
		session = sessionWithFakeGraphClient(responses)

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
			listenerMock.onMailboxStatus(
				argThat((status: any) => status.sourceId === "id-custom" && status.syncStatus === MailboxMigrationFolderSyncStatus.FINISHED),
			),
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
			sourceId: "id-excluded",
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

		const draftsState: MigrationMailboxState = { sourceId: "id-drafts", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const inboxState: MigrationMailboxState = { sourceId: "id-inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
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

	function graphError(status: number, retryAfterSeconds?: number): Error {
		return new GraphApiError("graph error", status, undefined, retryAfterSeconds !== undefined ? String(retryAfterSeconds) : null)
	}

	const POSTPONE_AFTER_ERROR = 60_000
	const POSTPONE_AFTER_AUTH_ERROR = 15 * 60_000

	function inboxContext(): MigrationSyncContext {
		return {
			migrationCredentials: imapCredentialsWithToken,
			migrationMailboxStates: [{ sourceId: "id-inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }],
			isGmail: false,
		}
	}

	const inboxFolder = [
		["/me/mailFolders", { value: [{ id: "id-inbox", displayName: "Inbox", childFolderCount: 0 }] }],
		["/me/mailFolders/inbox", { id: "id-inbox" }],
	] as [string, any][]

	o.test("startSync - an error while syncing a folder is reported and postpones the session, a throttled folder as well", async () => {
		for (const error of [graphError(429, 120), graphError(404)]) {
			listenerMock = object<MigrationSyncEventListener>()
			session = sessionWithFakeGraphClient(new Map([...inboxFolder, ["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", error]]))

			const before = Date.now()
			await session.startSync(inboxContext())
			await flushBackgroundSync()

			verify(listenerMock.onError(anything()), { times: 1 })
			verify(listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_ERROR && until <= Date.now() + POSTPONE_AFTER_ERROR)), {
				times: 1,
			})
			verify(listenerMock.onFinish(), { times: 0 })
		}
	})

	o.test("startSync - the error of a folder is reported with its cause", async () => {
		session = sessionWithFakeGraphClient(new Map([...inboxFolder, ["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", graphError(404)]]))

		await session.startSync(inboxContext())
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.PERMANENT_ERROR)), { times: 1 })
	})

	o.test("startSync - an expired token during the sync postpones the session for the credentials to be refreshed", async () => {
		session = sessionWithFakeGraphClient(new Map([...inboxFolder, ["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", graphError(401)]]))

		const before = Date.now()
		await session.startSync(inboxContext())
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.AUTH_FAILED)), { times: 1 })
		verify(
			listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_AUTH_ERROR && until <= Date.now() + POSTPONE_AFTER_AUTH_ERROR)),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - an error during the setup is thrown and postpones the session, also when Graph throttles", async () => {
		session = sessionWithFakeGraphClient(new Map([["/me/mailFolders", graphError(429)]]))

		const before = Date.now()
		const e = await assertThrows(MigrationError, async () => await session.startSync({ ...inboxContext(), migrationMailboxStates: [] }))

		o.check(e.data.cause).equals(MigrationErrorCause.POSTPONE)
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_ERROR && until <= Date.now() + POSTPONE_AFTER_ERROR)), {
			times: 1,
		})
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - throws AUTH_FAILED when Graph denies access with 403", async () => {
		session = sessionWithFakeGraphClient(new Map([["/me/mailFolders", graphError(403)]]))

		const e = await assertThrows(MigrationError, async () => await session.startSync({ ...inboxContext(), migrationMailboxStates: [] }))

		o.check(e.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
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

		const inboxState: MigrationMailboxState = { sourceId: "id-inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const archiveState: MigrationMailboxState = { sourceId: "id-archive", importedSourceIdToMailIdsMap: new Map(), noSync: false }
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
				argThat((mb: any) => mb.sourceId === "id-archive"),
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

	o.test("startSync - the children of a folder that Graph throttles are reported as an error and skipped, the other folders are synced", async () => {
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
			["/me/mailFolders/id-inbox/messages/delta?$expand=attachments", { value: [] }],
			["/me/mailFolders/id-archive/messages/delta?$expand=attachments", { value: [] }],
		])
		session = sessionWithFakeGraphClient(responses)

		const inboxState: MigrationMailboxState = { sourceId: "id-inbox", importedSourceIdToMailIdsMap: new Map(), noSync: false }
		const archiveState: MigrationMailboxState = { sourceId: "id-archive", importedSourceIdToMailIdsMap: new Map(), noSync: false }

		await session.startSync({ migrationCredentials: imapCredentialsWithToken, migrationMailboxStates: [inboxState, archiveState], isGmail: false })
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.POSTPONE)), { times: 1 })
		verify(listenerMock.onMailbox(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 1 })
	})
})
