import o, { assertThrows } from "@tutao/otest"
import { GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND, GraphApiClient } from "../../../../../src/applications/common/desktop/migration/m365sync/GraphApiClient"
import { mockedFetch, json } from "../ApiClientTestUtils"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../../../../../src/applications/common/desktop/migration/MigrationSyncSession"

import { GraphApiError, isRetryableGraphApiError } from "../../../../../src/applications/common/desktop/migration/ApiClientRequestUtils"
import { ApiClientRequestPacer } from "../../../../../src/applications/common/desktop/migration/ApiClientRequestPacer"

o.spec("GraphApiClient", () => {
	function headersOf(request: { init: RequestInit }): Record<string, string> {
		return request.init.headers as Record<string, string>
	}

	function client(fetchFunction: typeof fetch, sleeps: number[] = []) {
		return new GraphApiClient(
			"token",
			fetchFunction,
			new ApiClientRequestPacer(
				async (ms) => {
					sleeps.push(ms)
				},
				() => 0,
				isRetryableGraphApiError,
				GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND,
				GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND,
			),
		)
	}

	o.test("sends the access token and asks for immutable ids", async () => {
		const { fetchFunction, requests } = mockedFetch(json(200, { id: "id-inbox" }))

		const id = await client(fetchFunction).getSystemFolderId("inbox")

		o.check(id).equals("id-inbox")
		o.check(requests[0].url).equals("https://graph.microsoft.com/v1.0/me/mailFolders/inbox?$select=id")
		o.check(headersOf(requests[0]).Authorization).equals("Bearer token")
		o.check(headersOf(requests[0]).Prefer).equals('IdType="ImmutableId"')
	})

	o.test("a system folder the mailbox does not have is null, other errors are not swallowed", async () => {
		const { fetchFunction } = mockedFetch(json(404, { error: { message: "not found" } }), json(401, { error: { message: "expired" } }))
		const graphClient = client(fetchFunction)

		o.check(await graphClient.getSystemFolderId("archive")).equals(null)
		const e = await assertThrows(GraphApiError, async () => await graphClient.getSystemFolderId("inbox"))
		o.check(e.status).equals(401)
	})

	o.test("lists all pages of the folders, including hidden ones, and of the child folders", async () => {
		const next = "https://graph.microsoft.com/v1.0/me/mailFolders?$skiptoken=abc"
		const { fetchFunction, requests } = mockedFetch(
			json(200, { value: [{ id: "a" }], "@odata.nextLink": next }),
			json(200, { value: [{ id: "b" }] }),
			json(200, { value: [{ id: "c" }] }),
		)
		const graphClient = client(fetchFunction)

		o.check((await graphClient.listFolders()).map((folder) => folder.id)).deepEquals(["a", "b"])
		o.check(requests[0].url).equals("https://graph.microsoft.com/v1.0/me/mailFolders?includeHiddenFolders=true")
		o.check(requests[1].url).equals(next)
		o.check((await graphClient.listChildFolders("a/b")).map((folder) => folder.id)).deepEquals(["c"])
		o.check(requests[2].url).equals("https://graph.microsoft.com/v1.0/me/mailFolders/a%2Fb/childFolders?includeHiddenFolders=true")
	})

	o.test("lists the ids of the messages of a folder page by page, removed messages separately", async () => {
		const next = "https://graph.microsoft.com/v1.0/me/mailFolders/f/messages/delta?$skiptoken=abc"
		const { fetchFunction, requests } = mockedFetch(
			json(200, { value: [{ id: "m1" }, { id: "gone", "@removed": { reason: "deleted" } }], "@odata.nextLink": next }),
			json(200, { value: [{ id: "m2" }] }),
		)
		const graphClient = client(fetchFunction)

		const first = await graphClient.listMessageIds("f")
		const second = await graphClient.listMessageIds("f", first.nextLink)

		// only the ids, the mails are downloaded afterwards and only if they were not imported yet
		o.check(requests[0].url).equals("https://graph.microsoft.com/v1.0/me/mailFolders/f/messages/delta?$select=id")
		o.check(headersOf(requests[0]).Prefer).equals(`IdType="ImmutableId", odata.maxpagesize=${MAIL_DOWNLOAD_BATCH_SIZE}`)
		o.check(headersOf(requests[1]).Prefer).equals(`IdType="ImmutableId", odata.maxpagesize=${MAIL_DOWNLOAD_BATCH_SIZE}`)
		o.check(first).deepEquals({ ids: ["m1"], removedIds: ["gone"], nextLink: next })
		o.check(requests[1].url).equals(next)
		o.check(second).deepEquals({ ids: ["m2"], removedIds: [], nextLink: null })
	})

	function batchResponse(responses: { position: number; status: number; body: any; headers?: Record<string, string> }[]): Response {
		return json(200, { responses: responses.map((r) => ({ id: String(r.position), status: r.status, headers: r.headers ?? {}, body: r.body })) })
	}

	const mail = (id: string) => ({ id, subject: id, attachments: [] })

	o.test("gets many messages with their attachments in one batch request, in the order of the ids, without the ones that do not exist anymore", async () => {
		const { fetchFunction, requests } = mockedFetch(
			// the answers are not in the order of the requests
			batchResponse([
				{ position: 2, status: 200, body: mail("c") },
				{ position: 0, status: 200, body: mail("a") },
				{ position: 1, status: 404, body: { error: { code: "ErrorItemNotFound", message: "gone" } } },
			]),
		)

		const messages = await client(fetchFunction).getMessages(["a", "b", "c"])

		o.check(messages.map((m) => m.id)).deepEquals(["a", "c"])
		o.check(requests.map((request) => request.url)).deepEquals(["https://graph.microsoft.com/v1.0/$batch"])
		o.check(requests[0].init.method).equals("POST")
		o.check(headersOf(requests[0]).Authorization).equals("Bearer token")
		o.check(headersOf(requests[0])["Content-Type"]).equals("application/json")
		const batchRequests = JSON.parse(requests[0].init.body as string).requests
		o.check(batchRequests.length).equals(3)
		o.check(batchRequests[2]).deepEquals({
			id: "2",
			method: "GET",
			url: "/me/messages/c?$expand=attachments",
			headers: { Prefer: 'IdType="ImmutableId"' },
		})
	})

	o.test("gets the messages in batches of the batch size, one batch request each", async () => {
		const ids = Array.from({ length: 25 }, (_, i) => `m${i}`)
		const { fetchFunction, requests } = mockedFetch(
			batchResponse(ids.slice(0, 20).map((id, position) => ({ position, status: 200, body: mail(id) }))),
			batchResponse(ids.slice(20).map((id, position) => ({ position, status: 200, body: mail(id) }))),
		)
		const graphClient = client(fetchFunction)

		const messages = await graphClient.getMessages(ids)

		o.check(graphClient.messageBatchSize).equals(20)
		o.check(messages.map((m) => m.id)).deepEquals(ids)
		o.check(requests.length).equals(2)
		o.check(JSON.parse(requests[0].init.body as string).requests.length).equals(20)
		o.check(JSON.parse(requests[1].init.body as string).requests.length).equals(5)
	})

	o.test("a request of the batch that is throttled is requested again alone after Retry-After, the others are kept", async () => {
		const sleeps: number[] = []
		const { fetchFunction, requests } = mockedFetch(
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

		o.check(messages.map((m) => m.id)).deepEquals(["a", "b", "c"])
		o.check(sleeps).deepEquals([3000]) // no request starts before the Retry-After is over
		const retried = JSON.parse(requests[1].init.body as string).requests.map((r: any) => r.url)
		o.check(retried).deepEquals(["/me/messages/b?$expand=attachments", "/me/messages/c?$expand=attachments"])
	})

	o.test("a request of the batch that fails for good makes the call fail", async () => {
		const { fetchFunction, requests } = mockedFetch(
			batchResponse([
				{ position: 0, status: 200, body: mail("a") },
				{ position: 1, status: 403, body: { error: { code: "ErrorAccessDenied", message: "denied" } } },
			]),
		)

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).getMessages(["a", "b"]))

		o.check(e.status).equals(403)
		o.check(e.code).equals("ErrorAccessDenied")
		o.check(requests.length).equals(1)
	})

	o.test("gives up when requests of the batch are still throttled after the maximum number of attempts", async () => {
		const { fetchFunction, requests } = mockedFetch(
			...Array.from({ length: 8 }, () =>
				batchResponse([{ position: 0, status: 429, body: { error: { message: "throttled" } }, headers: { "retry-after": "1" } }]),
			),
		)

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).getMessages(["a"]))

		o.check(e.status).equals(429)
		o.check(e.retryAfter).equals("1")
		o.check(requests.length).equals(8)
	})

	o.test("waits for Retry-After when a request is throttled and backs off on server errors", async () => {
		const sleeps: number[] = []
		const { fetchFunction, requests } = mockedFetch(json(429, {}, { "Retry-After": "7" }), json(503), json(200, { value: [{ id: "m1" }] }))

		const page = await client(fetchFunction, sleeps).listMessageIds("f")

		o.check(page.ids).deepEquals(["m1"])
		o.check(requests.length).equals(3)
		o.check(sleeps[0]).equals(7000)
		o.check(sleeps[1] >= 2000 && sleeps[1] < 2250).equals(true) // 1000 * 2^1 plus jitter
	})

	o.test("retries network errors, but not client errors", async () => {
		const { fetchFunction, requests } = mockedFetch(new TypeError("fetch failed"), json(404, { error: { code: "ErrorItemNotFound", message: "gone" } }))

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).listMessageIds("f"))

		o.check(e.status).equals(404)
		o.check(e.code).equals("ErrorItemNotFound")
		o.check(requests.length).equals(2)
	})

	o.test("gives up after the maximum number of attempts and keeps the Retry-After", async () => {
		const { fetchFunction, requests } = mockedFetch(...Array.from({ length: 8 }, () => json(429, {}, { "Retry-After": "1" })))

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).listMessageIds("f"))

		o.check(e.status).equals(429)
		o.check(e.retryAfter).equals("1")
		o.check(requests.length).equals(8)
	})

	o.test("never sends the access token to an url that is not of the Graph API", async () => {
		const { fetchFunction, requests } = mockedFetch(json(200, { value: [] }))

		const e = await assertThrows(GraphApiError, async () => await client(fetchFunction).listMessageIds("f", "https://evil.example.com/steal"))

		o.check(e.status).equals(400)
		o.check(requests.length).equals(0)
	})
})
