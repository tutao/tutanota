import o, { assertThrows } from "@tutao/otest"
import { GraphApiClient, GraphApiError, parseRetryAfterMs } from "../../../../../src/applications/common/desktop/migration/m365sync/GraphApiClient"
import { MigrationError } from "../../../../../src/applications/common/api/common/error/MigrationError"

o.spec("GraphApiClient", () => {
	function json(status: number, body: any = {}, headers: Record<string, string> = {}): Response {
		return new Response(JSON.stringify(body), { status, headers })
	}

	/** A fetch that answers with the given responses one after the other and records the requests. */
	function fakeFetch(...responses: (Response | Error)[]) {
		const urls: string[] = []
		const headers: Record<string, string>[] = []
		const inits: RequestInit[] = []
		const fetchFunction = (async (url: string, init: RequestInit) => {
			urls.push(url)
			headers.push(init.headers as Record<string, string>)
			inits.push(init)
			const response = responses.shift()
			if (response === undefined) throw new Error("no response configured")
			if (response instanceof Error) throw response
			return response
		}) as any as typeof fetch
		return { fetchFunction, urls, headers, inits }
	}

	function client(fetchFunction: typeof fetch, sleeps: number[] = []) {
		return new GraphApiClient(
			"token",
			fetchFunction,
			async (ms) => {
				sleeps.push(ms)
			},
			() => 0,
		)
	}

	o.test("sends the access token and asks for immutable ids", async () => {
		const { fetchFunction, urls, headers } = fakeFetch(json(200, { id: "id-inbox" }))

		const id = await client(fetchFunction).getWellKnownFolderId("inbox")

		o.check(id).equals("id-inbox")
		o.check(urls[0]).equals("https://graph.microsoft.com/v1.0/me/mailFolders/inbox?$select=id")
		o.check(headers[0].Authorization).equals("Bearer token")
		o.check(headers[0].Prefer).equals('IdType="ImmutableId"')
	})

	o.test("a well-known folder the mailbox does not have is null, other errors are not swallowed", async () => {
		const { fetchFunction } = fakeFetch(json(404, { error: { message: "not found" } }), json(401, { error: { message: "expired" } }))
		const graphClient = client(fetchFunction)

		o.check(await graphClient.getWellKnownFolderId("archive")).equals(null)
		const e = await assertThrows(GraphApiError, async () => await graphClient.getWellKnownFolderId("inbox"))
		o.check(e.status).equals(401)
	})

	o.test("lists all pages of the folders, including hidden ones, and of the child folders", async () => {
		const next = "https://graph.microsoft.com/v1.0/me/mailFolders?$skiptoken=abc"
		const { fetchFunction, urls } = fakeFetch(
			json(200, { value: [{ id: "a" }], "@odata.nextLink": next }),
			json(200, { value: [{ id: "b" }] }),
			json(200, { value: [{ id: "c" }] }),
		)
		const graphClient = client(fetchFunction)

		o.check((await graphClient.listFolders()).map((folder) => folder.id)).deepEquals(["a", "b"])
		o.check(urls[0]).equals("https://graph.microsoft.com/v1.0/me/mailFolders?includeHiddenFolders=true")
		o.check(urls[1]).equals(next)
		o.check((await graphClient.listChildFolders("a/b")).map((folder) => folder.id)).deepEquals(["c"])
		o.check(urls[2]).equals("https://graph.microsoft.com/v1.0/me/mailFolders/a%2Fb/childFolders?includeHiddenFolders=true")
	})

	o.test("lists the ids of the messages of a folder page by page, removed messages separately", async () => {
		const next = "https://graph.microsoft.com/v1.0/me/mailFolders/f/messages/delta?$skiptoken=abc"
		const { fetchFunction, urls, headers } = fakeFetch(
			json(200, { value: [{ id: "m1" }, { id: "gone", "@removed": { reason: "deleted" } }], "@odata.nextLink": next }),
			json(200, { value: [{ id: "m2" }] }),
		)
		const graphClient = client(fetchFunction)

		const first = await graphClient.listMessageIds("f")
		const second = await graphClient.listMessageIds("f", first.nextLink)

		// only the ids, the mails are downloaded afterwards and only if they were not imported yet
		o.check(urls[0]).equals("https://graph.microsoft.com/v1.0/me/mailFolders/f/messages/delta?$select=id")
		o.check(headers[0].Prefer).equals('IdType="ImmutableId", odata.maxpagesize=100')
		o.check(headers[1].Prefer).equals('IdType="ImmutableId", odata.maxpagesize=100')
		o.check(first).deepEquals({ ids: ["m1"], removedIds: ["gone"], nextLink: next })
		o.check(urls[1]).equals(next)
		o.check(second).deepEquals({ ids: ["m2"], removedIds: [], nextLink: null })
	})

	function batchResponse(responses: { position: number; status: number; body: any; headers?: Record<string, string> }[]): Response {
		return json(200, { responses: responses.map((r) => ({ id: String(r.position), status: r.status, headers: r.headers ?? {}, body: r.body })) })
	}

	const mail = (id: string) => ({ id, subject: id, attachments: [] })

	o.test("gets many messages with their attachments in one batch request, in the order of the ids", async () => {
		const { fetchFunction, urls, inits } = fakeFetch(
			// the answers are not in the order of the requests
			batchResponse([
				{ position: 2, status: 200, body: mail("c") },
				{ position: 0, status: 200, body: mail("a") },
				{ position: 1, status: 404, body: { error: { code: "ErrorItemNotFound", message: "gone" } } },
			]),
		)

		const messages = await client(fetchFunction).getMessages(["a", "b", "c"])

		o.check(messages.map((m) => m?.id ?? null)).deepEquals(["a", null, "c"])
		o.check(urls).deepEquals(["https://graph.microsoft.com/v1.0/$batch"])
		o.check(inits[0].method).equals("POST")
		const headers = inits[0].headers as Record<string, string>
		o.check(headers.Authorization).equals("Bearer token")
		o.check(headers["Content-Type"]).equals("application/json")
		const requests = JSON.parse(inits[0].body as string).requests
		o.check(requests.length).equals(3)
		o.check(requests[2]).deepEquals({
			id: "2",
			method: "GET",
			url: "/me/messages/c?$expand=attachments",
			headers: { Prefer: 'IdType="ImmutableId"' },
		})
	})

	o.test("a request of the batch that is throttled is requested again alone after Retry-After, the others are kept", async () => {
		const sleeps: number[] = []
		const { fetchFunction, inits } = fakeFetch(
			batchResponse([
				{ position: 0, status: 200, body: mail("a") },
				{ position: 1, status: 429, body: { error: { message: "throttled" } }, headers: { "Retry-After": "3" } },
				{ position: 2, status: 503, body: { error: { message: "busy" } } },
			]),
			batchResponse([
				{ position: 0, status: 200, body: mail("b") },
				{ position: 1, status: 200, body: mail("c") },
			]),
		)

		const messages = await client(fetchFunction, sleeps).getMessages(["a", "b", "c"])

		o.check(messages.map((m) => m?.id)).deepEquals(["a", "b", "c"])
		o.check(sleeps).deepEquals([3000])
		const retried = JSON.parse(inits[1].body as string).requests.map((r: any) => r.url)
		o.check(retried).deepEquals(["/me/messages/b?$expand=attachments", "/me/messages/c?$expand=attachments"])
	})

	o.test("a request of the batch that fails for good makes the call fail", async () => {
		const { fetchFunction, urls } = fakeFetch(
			batchResponse([
				{ position: 0, status: 200, body: mail("a") },
				{ position: 1, status: 403, body: { error: { code: "ErrorAccessDenied", message: "denied" } } },
			]),
		)

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).getMessages(["a", "b"]))

		o.check(e.status).equals(403)
		o.check(e.code).equals("ErrorAccessDenied")
		o.check(urls.length).equals(1)
	})

	o.test("gives up when requests of the batch are still throttled after the maximum number of attempts", async () => {
		const { fetchFunction, urls } = fakeFetch(
			...Array.from({ length: 8 }, () =>
				batchResponse([{ position: 0, status: 429, body: { error: { message: "throttled" } }, headers: { "Retry-After": "1" } }]),
			),
		)

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).getMessages(["a"]))

		o.check(e.status).equals(429)
		o.check(urls.length).equals(8)
	})

	o.test("retries a failed batch request, and the batch size shrinks when the mails are large", async () => {
		const large = Buffer.alloc(8 * 1024 * 1024).toString("base64")
		const sleeps: number[] = []
		const { fetchFunction, urls } = fakeFetch(
			json(503),
			batchResponse([
				{ position: 0, status: 200, body: { id: "a", attachments: [{ contentBytes: large }] } },
				{ position: 1, status: 200, body: { id: "b", attachments: [{ contentBytes: large }] } },
			]),
		)
		const graphClient = client(fetchFunction, sleeps)
		o.check(graphClient.messageBatchSize).equals(20)

		await graphClient.getMessages(["a", "b"])

		o.check(urls.length).equals(2)
		o.check(sleeps.length).equals(1)
		o.check(graphClient.messageBatchSize <= 2).equals(true)
		o.check(graphClient.messageBatchSize >= 1).equals(true)
	})

	o.test("never sends the access token to another host", async () => {
		const { fetchFunction, urls } = fakeFetch(json(200, { value: [] }))

		await assertThrows(MigrationError, async () => await client(fetchFunction).listMessageIds("f", "https://evil.example.com/steal"))

		o.check(urls.length).equals(0)
	})

	o.test("waits for Retry-After when throttled and backs off on server errors", async () => {
		const sleeps: number[] = []
		const { fetchFunction, urls } = fakeFetch(json(429, {}, { "Retry-After": "7" }), json(503), json(200, { value: [{ id: "m1" }] }))

		const page = await client(fetchFunction, sleeps).listMessageIds("f")

		o.check(page.ids.length).equals(1)
		o.check(urls.length).equals(3)
		o.check(sleeps[0]).equals(7000)
		o.check(sleeps[1] >= 2000 && sleeps[1] < 2250).equals(true) // 1000 * 2^1 plus jitter
	})

	o.test("retries network errors, but not client errors", async () => {
		const { fetchFunction, urls } = fakeFetch(new TypeError("fetch failed"), json(404, { error: { code: "ErrorItemNotFound", message: "gone" } }))

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).listMessageIds("f"))

		o.check(e.status).equals(404)
		o.check(e.code).equals("ErrorItemNotFound")
		o.check(urls.length).equals(2)
	})

	o.test("gives up after the maximum number of attempts and keeps the Retry-After", async () => {
		const { fetchFunction, urls } = fakeFetch(...Array.from({ length: 8 }, () => json(429, {}, { "Retry-After": "1" })))

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).listMessageIds("f"))

		o.check(e.status).equals(429)
		o.check(e.retryAfter).equals("1")
		o.check(urls.length).equals(8)
	})

	o.test("parses Retry-After as seconds or date", async () => {
		o.check(parseRetryAfterMs("120")).equals(120_000)
		o.check(parseRetryAfterMs(new Date(10_000).toUTCString(), 4000)).equals(6000)
		o.check(parseRetryAfterMs(null)).equals(null)
	})
})
