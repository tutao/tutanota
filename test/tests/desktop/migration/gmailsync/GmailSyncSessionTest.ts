import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { GmailSyncSession } from "../../../../../src/applications/common/desktop/migration/gmailsync/GmailSyncSession"
import { GmailMailApi } from "../../../../../src/applications/common/desktop/migration/gmailsync/GmailApiClient"
import { MigrationSyncEventListener } from "../../../../../src/applications/common/desktop/migration/MigrationSyncEventListener"
import {
	MigrationCredentials,
	MigrationMailboxState,
	MigrationSyncContext,
} from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { MigrationError, MigrationErrorCause } from "../../../../../src/applications/common/api/common/error/MigrationError"
import { MigrationSyncEventType } from "../../../../../src/entities/tutanota/Utils"
import { GmailApiError } from "../../../../../src/applications/common/desktop/migration/ApiClientRequestUtils"
import { MigrationMail } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMail"
import { isNotNull } from "../../../../../src/platform-kit/utils"
import { flushBackgroundSync } from "../ApiClientTestUtils"

const { argThat, anything } = matchers

const RAW_MAIL = "From: a@b.com\r\nTo: c@d.com\r\nSubject: Hello\r\nMessage-ID: <1@b.com>\r\n\r\nbody"

o.spec("GmailSyncSession", () => {
	let listenerMock: MigrationSyncEventListener
	let requestedPaths: string[]

	const credentials: MigrationCredentials = {
		host: "imap.gmail.com",
		port: 993,
		username: "user@gmail.com",
		ignoreCertificateErrors: false,
		customCertificateData: null,
		provider: MailboxMigrationProvider.Gmail,
		useSSL: true,
		isLegacy: false,
		tokenEndpointResponse: { access_token: "token123", token_type: "Bearer" } as any,
	}

	const labelsResponse = {
		labels: [
			{ id: "INBOX", name: "INBOX", type: "system" },
			{ id: "SENT", name: "SENT", type: "system" },
			{ id: "CATEGORY_SOCIAL", name: "CATEGORY_SOCIAL", type: "system" },
			{ id: "Label_1", name: "Work", type: "user" },
			{ id: "Label_2", name: "Work/Project", type: "user" },
			{ id: "Label_3", name: "Old/Stuff", type: "user" },
		],
	}

	function fakeClient(responses: Map<string, any>): GmailMailApi {
		const resolve = (path: string) => {
			requestedPaths.push(path)
			const response = responses.get(path)
			if (response === undefined) throw new Error(`no response configured for ${path}`)
			if (response instanceof Error) throw response
			if (typeof response === "function") return response()
			return response
		}
		return {
			async listLabels() {
				return resolve("/labels").labels
			},
			async listMessageIds() {
				const page = resolve("/messages")
				return { ids: (page.messages ?? []).map((message: any) => message.id), nextPageToken: page.nextPageToken }
			},
			messageBatchSize: 2,
			async getMessages(ids: string[]) {
				return ids
					.map((id) => {
						try {
							return resolve(`/messages/${id}`)
						} catch (e) {
							if (e instanceof GmailApiError && e.status === 404) return null
							throw e
						}
					})
					.filter(isNotNull)
			},
		}
	}

	function session(responses: Map<string, any>): GmailSyncSession {
		return new GmailSyncSession(listenerMock, () => fakeClient(responses))
	}

	function context(state: Partial<MigrationMailboxState> = {}): MigrationSyncContext {
		return {
			migrationCredentials: credentials,
			migrationMailboxStates: [
				{ sourceId: "[Gmail]/All Mail", noSync: false, importedSourceIdToMailIdsMap: state.importedSourceIdToMailIdsMap ?? new Map() },
			],
			isGmail: true,
		}
	}

	const POSTPONE_AFTER_ERROR = 60_000
	const POSTPONE_AFTER_AUTH_ERROR = 15 * 60_000

	o.beforeEach(() => {
		listenerMock = object<MigrationSyncEventListener>()
		requestedPaths = []
	})

	o.test("getMigrationMailboxes - builds All Mail, system and nested user label mailboxes", async () => {
		const result = await session(new Map([["/labels", labelsResponse]])).getMigrationMailboxes(credentials)

		// Trash and Spam are not imported, every other mailbox is identified by the id of its label
		o.check(result.map((mailbox) => mailbox.sourceId)).deepEquals(["[Gmail]/All Mail", "INBOX", "SENT", "Label_3", "Label_1"])
		// the name of All Mail is assigned from the user input in MailboxMigrationFacade to the user's Gmail address
		o.check(result[0].name).equals(undefined)
		o.check(result[0].specialUse).equals(MigrationMailboxSpecialUse.ALL)
		o.check(result[1].name).equals("INBOX")
		o.check(result[1].specialUse).equals(MigrationMailboxSpecialUse.INBOX)
		o.check(result[2].name).equals("SENT")
		o.check(result[2].specialUse).equals(MigrationMailboxSpecialUse.SENT)
		const work = result.find((mailbox) => mailbox.sourceId === "Label_1")!
		o.check(work.name).equals("Work")
		o.check(work.subFolders?.map((sub) => sub.sourceId)).deepEquals(["Label_2"])
		o.check(work.subFolders?.[0].name).equals("Project")
		o.check(work.subFolders?.[0].parentFolder).equals(work)
		o.check(result.find((mailbox) => mailbox.sourceId === "Label_3")?.name).equals("Old/Stuff")
	})

	o.test("getMigrationMailboxes - throws AUTH_FAILED without access token", async () => {
		const e = await assertThrows(
			MigrationError,
			async () => await session(new Map()).getMigrationMailboxes({ ...credentials, tokenEndpointResponse: undefined }),
		)
		o.check(e.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
	})

	o.test("startSync - imports new mails with labels and flags, skips known ones, and finishes", async () => {
		const raw = Buffer.from(RAW_MAIL).toString("base64url")
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [{ id: "known" }, { id: "m1" }] }],
			["/messages/m1", { id: "m1", labelIds: ["INBOX", "Label_1", "UNREAD"], internalDate: "1700000000000", sizeEstimate: 10, raw }],
		])
		const importedSourceIdToMailIdsMap = new Map([["known", { sourceId: "known" }]])

		await session(responses).startSync(context({ importedSourceIdToMailIdsMap }))
		await flushBackgroundSync()

		o.check(requestedPaths.includes("/messages/known")).equals(false)
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any[]) => {
					const mail = mails[0]
					return (
						mails.length === 1 &&
						mail.sourceId === "m1" &&
						mail.envelope.subject === "Hello" &&
						mail.internalDate.getTime() === 1700000000000 &&
						!mail.flags.has("\\Seen") &&
						// the labels are the ids of the labels of Gmail
						mail.labels.has("INBOX") &&
						mail.labels.has("Label_1") &&
						mail.belongsToMailbox.sourceId === "[Gmail]/All Mail"
					)
				}),
				MigrationSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - lists the mails page by page and downloads the unknown mails of every page", async () => {
		const raw = Buffer.from(RAW_MAIL).toString("base64url")
		const pages = [{ messages: [{ id: "a" }, { id: "known" }], nextPageToken: "page2" }, { messages: [{ id: "b" }] }]
		const requestedPageTokens: (string | undefined)[] = []
		const client = fakeClient(
			new Map<string, any>([
				["/labels", labelsResponse],
				["/messages/a", { id: "a", labelIds: ["INBOX"], raw }],
				["/messages/b", { id: "b", labelIds: ["INBOX"], raw }],
			]),
		)
		client.listMessageIds = async (pageToken?: string) => {
			requestedPageTokens.push(pageToken)
			const page = pages[pageToken === undefined ? 0 : 1]
			return { ids: page.messages.map((message) => message.id), nextPageToken: (page as any).nextPageToken }
		}
		const handedOver: string[][] = []
		when(listenerMock.onMultipleMails(matchers.isA(Array), anything())).thenDo((mails: MigrationMail[]) => {
			handedOver.push(mails.map((mail) => mail.sourceId))
		})

		await new GmailSyncSession(listenerMock, () => client).startSync(context({ importedSourceIdToMailIdsMap: new Map([["known", { sourceId: "known" }]]) }))
		await flushBackgroundSync()

		o.check(requestedPageTokens).deepEquals([undefined, "page2"])
		o.check(handedOver).deepEquals([["a"], ["b"]])
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - announces only unknown mailboxes, parents before children, with the parent referenced", async () => {
		const announced: { sourceId: string; parentSourceId?: string }[] = []
		when(listenerMock.onMailbox(matchers.isA(Object), anything())).thenDo((mailbox: MigrationMailbox) => {
			announced.push({ sourceId: mailbox.sourceId, parentSourceId: mailbox.parentFolder?.sourceId })
		})
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [] }],
		])

		await session(responses).startSync(context())

		// "[Gmail]/All Mail" has a state already and is not announced again
		o.check(announced).deepEquals([
			{ sourceId: "INBOX", parentSourceId: undefined },
			{ sourceId: "SENT", parentSourceId: undefined },
			{ sourceId: "Label_3", parentSourceId: undefined },
			{ sourceId: "Label_1", parentSourceId: undefined },
			{ sourceId: "Label_2", parentSourceId: "Label_1" },
		])
	})

	o.test("startSync - reports known mailboxes that no longer exist as deleted", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [] }],
		])
		const ctx = context()
		ctx.migrationMailboxStates.push({ sourceId: "Removed", importedSourceIdToMailIdsMap: new Map(), noSync: false })

		await session(responses).startSync(ctx)

		verify(
			listenerMock.onMailbox(
				argThat((mailbox: any) => mailbox.sourceId === "Removed"),
				MigrationSyncEventType.DELETE,
			),
			{ times: 1 },
		)
	})

	o.test("startSync - a message deleted during the sync is skipped", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [{ id: "gone" }] }],
			["/messages/gone", new GmailApiError("Not Found", 404)],
		])

		await session(responses).startSync(context())
		await flushBackgroundSync()

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test(
		"startSync - the mails of the pages that were downloaded before an error are handed over, then the error is reported and the session is postponed",
		async () => {
			const raw = Buffer.from(RAW_MAIL).toString("base64url")
			const client = fakeClient(
				new Map<string, any>([
					["/labels", labelsResponse],
					["/messages/m1", { id: "m1", labelIds: ["INBOX"], raw }],
					["/messages/m2", { id: "m2", labelIds: ["INBOX"], raw }],
					["/messages/m3", new Error("socket hang up")],
				]),
			)
			const pages = [{ ids: ["m1", "m2"], nextPageToken: "page2" }, { ids: ["m3"] }]
			client.listMessageIds = async (pageToken?: string) => pages[pageToken === undefined ? 0 : 1]
			const handedOver: string[][] = []
			when(listenerMock.onMultipleMails(matchers.isA(Array), anything())).thenDo((mails: MigrationMail[]) => {
				handedOver.push(mails.map((mail) => mail.sourceId))
			})

			const before = Date.now()
			await new GmailSyncSession(listenerMock, () => client).startSync(context())
			await flushBackgroundSync()

			o.check(handedOver).deepEquals([["m1", "m2"]])
			verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.UNKNOWN)), { times: 1 })
			verify(listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_ERROR && until <= Date.now() + POSTPONE_AFTER_ERROR)), {
				times: 1,
			})
			verify(listenerMock.onFinish(), { times: 0 })
		},
	)

	o.test("startSync - nothing of a page is handed over when downloading it fails", async () => {
		const raw = Buffer.from(RAW_MAIL).toString("base64url")
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [{ id: "m1" }, { id: "m2" }] }],
			["/messages/m1", { id: "m1", labelIds: ["INBOX"], raw }],
			["/messages/m2", new Error("socket hang up")],
		])

		await session(responses).startSync(context())
		await flushBackgroundSync()

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onError(anything()), { times: 1 })
		verify(listenerMock.onPostpone(anything()), { times: 1 })
	})

	o.test("startSync - an error while listing the mails is reported and postpones the session", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", new GmailApiError("slow down", 429, undefined, "120")],
		])

		const before = Date.now()
		await session(responses).startSync(context())
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.POSTPONE)), { times: 1 })
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_ERROR && until <= Date.now() + POSTPONE_AFTER_ERROR)), {
			times: 1,
		})
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - an expired token during the sync postpones the session for the credentials to be refreshed", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [{ id: "m1" }] }],
			["/messages/m1", new GmailApiError("Invalid Credentials", 401)],
		])

		const before = Date.now()
		await session(responses).startSync(context())
		await flushBackgroundSync()

		verify(listenerMock.onError(argThat((e: MigrationError) => e.data.cause === MigrationErrorCause.AUTH_FAILED)), { times: 1 })
		verify(
			listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_AUTH_ERROR && until <= Date.now() + POSTPONE_AFTER_AUTH_ERROR)),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - a 403 that is not a rate limit during the setup is thrown as AUTH_FAILED", async () => {
		const responses = new Map<string, any>([["/labels", new GmailApiError("Gmail API has not been used", 403, "accessNotConfigured")]])

		const e = await assertThrows(MigrationError, async () => await session(responses).startSync(context()))
		o.check(e.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
	})

	o.test("startSync - an error during the setup is thrown and postpones the session", async () => {
		const responses = new Map<string, any>([["/labels", new GmailApiError("slow down", 429)]])

		const before = Date.now()
		const e = await assertThrows(MigrationError, async () => await session(responses).startSync(context()))

		o.check(e.data.cause).equals(MigrationErrorCause.POSTPONE)
		verify(listenerMock.onPostpone(argThat((until: number) => until >= before + POSTPONE_AFTER_ERROR && until <= Date.now() + POSTPONE_AFTER_ERROR)), {
			times: 1,
		})
	})
})
