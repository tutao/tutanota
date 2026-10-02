import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify } from "testdouble"
import {
	createGmailApiClient,
	GmailApiClient,
	GmailApiError,
	GmailLibraryApi,
	GmailSyncSession,
} from "../../../../../src/applications/common/desktop/migration/gmailsync/GmailSyncSession"
import { MigrationSyncEventListener } from "../../../../../src/applications/common/desktop/migration/MigrationSyncEventListener"
import {
	MigrationCredentials,
	MigrationMailboxState,
	MigrationSyncContext,
} from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailboxSpecialUse } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { MigrationError, MigrationErrorCause } from "../../../../../src/applications/common/api/common/error/MigrationError"
import { MigrationSyncEventType } from "../../../../../src/entities/tutanota/Utils"

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

	function fakeClient(responses: Map<string, any>): GmailApiClient {
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
			async getRawMessage(id: string) {
				try {
					return resolve(`/messages/${id}`)
				} catch (e) {
					if (e instanceof GmailApiError && e.status === 404) return null
					throw e
				}
			},
		}
	}

	function session(responses: Map<string, any>): GmailSyncSession {
		return new GmailSyncSession(listenerMock, async () => fakeClient(responses))
	}

	function context(state: Partial<MigrationMailboxState> = {}): MigrationSyncContext {
		return {
			migrationCredentials: credentials,
			migrationMailboxStates: [
				{ path: "[Gmail]/All Mail", noSync: false, importedSourceIdToMailIdsMap: state.importedSourceIdToMailIdsMap ?? new Map() },
			],
			isGmail: true,
		}
	}

	o.beforeEach(() => {
		listenerMock = object<MigrationSyncEventListener>()
		requestedPaths = []
	})

	o.test("getMigrationMailboxes - builds All Mail, system and nested user label mailboxes", async () => {
		const result = await session(new Map([["/labels", labelsResponse]])).getMigrationMailboxes(credentials)

		const paths = result.map((mailbox) => mailbox.path)
		o.check(paths).deepEquals(["[Gmail]/All Mail", "INBOX", "[Gmail]/Sent Mail", "Old/Stuff", "Work"])
		o.check(result[0].specialUse).equals(MigrationMailboxSpecialUse.ALL)
		const work = result.find((mailbox) => mailbox.path === "Work")!
		o.check(work.subFolders?.map((sub) => sub.path)).deepEquals(["Work/Project"])
		o.check(work.subFolders?.[0].name).equals("Project")
		// no "Old" label exists, so the label is top level and keeps its full name
		o.check(result.find((mailbox) => mailbox.path === "Old/Stuff")?.name).equals("Old/Stuff")
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
		await new Promise((resolve) => setTimeout(resolve, 0))

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
						mail.labels.has("\\Inbox") &&
						mail.labels.has("Work") &&
						mail.belongsToMailbox.path === "[Gmail]/All Mail"
					)
				}),
				MigrationSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 1 })
		o.check(importedSourceIdToMailIdsMap.has("m1")).equals(true)
	})

	o.test("startSync - announces only unknown mailboxes, parents before children, with the parent referenced", async () => {
		const announced: { path: string; parentPath?: string }[] = []
		listenerMock.onMailbox = async (mailbox: any) => {
			announced.push({ path: mailbox.path, parentPath: mailbox.parentFolder?.path })
		}
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [] }],
		])

		await session(responses).startSync(context())

		// "[Gmail]/All Mail" has a state already and is not announced again
		o.check(announced).deepEquals([
			{ path: "INBOX", parentPath: undefined },
			{ path: "[Gmail]/Sent Mail", parentPath: undefined },
			{ path: "Old/Stuff", parentPath: undefined },
			{ path: "Work", parentPath: undefined },
			{ path: "Work/Project", parentPath: "Work" },
		])
	})

	o.test("startSync - reports known mailboxes that no longer exist as deleted", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [] }],
		])
		const ctx = context()
		ctx.migrationMailboxStates.push({ path: "Removed", importedSourceIdToMailIdsMap: new Map(), noSync: false })

		await session(responses).startSync(ctx)

		verify(
			listenerMock.onMailbox(
				argThat((mailbox: any) => mailbox.path === "Removed"),
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
		await new Promise((resolve) => setTimeout(resolve, 0))

		verify(listenerMock.onMultipleMails(anything(), anything()), { times: 0 })
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - postpones on a rate limit error with Retry-After", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", new GmailApiError("slow down", 429, undefined, "120")],
		])

		await session(responses).startSync(context())
		await new Promise((resolve) => setTimeout(resolve, 0))

		verify(listenerMock.onPostpone(argThat((until: number) => until - Date.now() > 100 * 1000)), { times: 1 })
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - a failing mailbox is retried like IMAP and the mails of the failed attempt are not lost", async () => {
		const raw = Buffer.from(RAW_MAIL).toString("base64url")
		let attempts = 0
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [{ id: "m1" }] }],
			[
				"/messages/m1",
				() => {
					if (++attempts === 1) throw new Error("socket hang up")
					return { id: "m1", labelIds: ["INBOX"], raw }
				},
			],
		])

		await session(responses).startSync(context())
		await new Promise((resolve) => setTimeout(resolve, 0))

		verify(listenerMock.onError(anything()), { times: 1 })
		verify(
			listenerMock.onMultipleMails(
				argThat((mails: any[]) => mails.length === 1 && mails[0].sourceId === "m1"),
				MigrationSyncEventType.CREATE,
			),
			{ times: 1 },
		)
		verify(listenerMock.onFinish(), { times: 1 })
	})

	o.test("startSync - postpones instead of reporting the round as finished when the mailbox keeps failing", async () => {
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", new Error("socket hang up")],
		])

		await session(responses).startSync(context())
		await new Promise((resolve) => setTimeout(resolve, 0))

		verify(listenerMock.onError(anything()), { times: 2 })
		verify(listenerMock.onPostpone(anything()), { times: 1 })
		verify(listenerMock.onFinish(), { times: 0 })
	})

	o.test("startSync - imports the oldest mails first like IMAP", async () => {
		const raw = Buffer.from(RAW_MAIL).toString("base64url")
		const responses = new Map<string, any>([
			["/labels", labelsResponse],
			["/messages", { messages: [{ id: "newest" }, { id: "middle" }, { id: "oldest" }] }],
			["/messages/newest", { id: "newest", labelIds: ["INBOX"], raw }],
			["/messages/middle", { id: "middle", labelIds: ["INBOX"], raw }],
			["/messages/oldest", { id: "oldest", labelIds: ["INBOX"], raw }],
		])
		const sessionUnderTest = session(responses)
		const handedOver: string[][] = []
		listenerMock.onMultipleMails = async (mails: any[]) => {
			handedOver.push(mails.map((mail) => mail.sourceId))
		}

		await sessionUnderTest.startSync(context())
		await new Promise((resolve) => setTimeout(resolve, 0))
		o.check(handedOver).deepEquals([["oldest", "middle", "newest"]])
	})

	o.test("startSync - a 403 that is not a rate limit is reported as AUTH_FAILED", async () => {
		const responses = new Map<string, any>([["/labels", new GmailApiError("Gmail API has not been used", 403, "accessNotConfigured")]])

		const e = await assertThrows(MigrationError, async () => await session(responses).startSync(context()))
		o.check(e.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
	})

	o.spec("createGmailApiClient", () => {
		function gaxiosError(status: number, headers: Record<string, string> = {}, reason?: string) {
			return Object.assign(new Error("gaxios"), {
				response: {
					status,
					headers: { get: (name: string) => headers[name] ?? null },
					data: { error: { message: "api error", errors: reason ? [{ reason }] : [] } },
				},
			})
		}

		function libraryWith(
			messagesGet: (...args: any[]) => Promise<any>,
			messagesList: (...args: any[]) => Promise<any> = async () => ({ data: {} }),
		): GmailLibraryApi {
			return { users: { labels: { list: async () => ({ data: { labels: [] } }) }, messages: { get: messagesGet, list: messagesList } } } as any
		}

		o.test("retries throttled requests with backoff and honours Retry-After", async () => {
			const results = [gaxiosError(429, { "retry-after": "2" }), gaxiosError(503), { data: { id: "m1", raw: "abc", labelIds: ["INBOX"] } }]
			const sleeps: number[] = []
			const client = createGmailApiClient(
				libraryWith(async () => {
					const result = results.shift()!
					if (result instanceof Error) throw result
					return result
				}),
				async (ms) => {
					sleeps.push(ms)
				},
			)

			o.check((await client.getRawMessage("m1"))?.raw).equals("abc")
			o.check(sleeps.length).equals(2)
			o.check(sleeps[0]).equals(2000)
			o.check(sleeps[1] >= 2000).equals(true) // second backoff, 1000 * 2^1
		})

		o.test("retries rate limit 403 and network errors, a message that does not exist is null and not retried", async () => {
			let calls = 0
			const client = createGmailApiClient(
				libraryWith(async () => {
					calls++
					if (calls === 1) throw new Error("socket hang up")
					if (calls === 2) throw gaxiosError(403, {}, "userRateLimitExceeded")
					throw gaxiosError(404)
				}),
				async () => {},
			)

			o.check(await client.getRawMessage("gone")).equals(null)
			o.check(calls).equals(3)
		})

		o.test("a 403 that is not a rate limit is not retried", async () => {
			let calls = 0
			const client = createGmailApiClient(
				libraryWith(async () => {
					calls++
					throw gaxiosError(403, {}, "accessNotConfigured")
				}),
				async () => {},
			)

			const e = await assertThrows(GmailApiError, async () => await client.getRawMessage("m1"))

			o.check(e.status).equals(403)
			o.check(calls).equals(1)
		})

		o.test("gives up after the maximum number of attempts", async () => {
			let calls = 0
			const client = createGmailApiClient(
				libraryWith(async () => {
					calls++
					throw gaxiosError(500)
				}),
				async () => {},
			)

			const e = await assertThrows(GmailApiError, async () => await client.getRawMessage("m1"))

			o.check(e.status).equals(500)
			o.check(calls).equals(6)
		})

		o.test("lists the ids like IMAP's All Mail: no spam, no trash, no chats", async () => {
			let params: any = null
			const client = createGmailApiClient(
				libraryWith(
					async () => ({ data: {} }),
					async (p: any) => {
						params = p
						return { data: { messages: [{ id: "m1" }, { id: "m2" }], nextPageToken: "next" } }
					},
				),
			)

			const page = await client.listMessageIds("token")

			o.check(page).deepEquals({ ids: ["m1", "m2"], nextPageToken: "next" })
			o.check(params.includeSpamTrash).equals(false)
			o.check(params.q).equals("-in:chats")
			o.check(params.pageToken).equals("token")
		})
	})
})
