import o, { assertThrows } from "@tutao/otest"
import {
	GMAIL_API_MAX_QUOTA_UNITS_PER_SECOND,
	GMAIL_API_MIN_QUOTA_UNITS_PER_SECOND,
	GmailApiClient,
	parseBatchResponse,
} from "../../../../../src/applications/common/desktop/migration/gmailsync/GmailApiClient"
import { json, mockedFetch } from "../ApiClientTestUtils"
import {
	GmailApiError,
	isRetryableGmailError,
	parseRetryAfterFromMessage,
} from "../../../../../src/applications/common/desktop/migration/ApiClientRequestUtils"
import { ApiClientRequestPacer } from "../../../../../src/applications/common/desktop/migration/ApiClientRequestPacer"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../../../../../src/applications/common/desktop/migration/MigrationSyncSession"

o.spec("GmailApiClient", () => {
	function errorBody(message: string, reason?: string) {
		return { error: { message, errors: reason ? [{ reason }] : [] } }
	}

	type Part = { position: number; status: number; body: any; headers?: Record<string, string> }

	function batchResponse(parts: Part[], boundary = "batch_response"): Response {
		const text =
			parts
				.map((part) => {
					const headers = Object.entries(part.headers ?? {})
						.map(([name, value]) => `${name}: ${value}\r\n`)
						.join("")
					return (
						`--${boundary}\r\nContent-Type: application/http\r\nContent-ID: <response-item${part.position}>\r\n\r\n` +
						`HTTP/1.1 ${part.status} Status\r\nContent-Type: application/json; charset=UTF-8\r\n${headers}\r\n${JSON.stringify(part.body)}\r\n`
					)
				})
				.join("") + `--${boundary}--`
		return new Response(text, { status: 200, headers: { "Content-Type": `multipart/mixed; boundary=${boundary}` } })
	}

	function client(fetchFunction: typeof fetch, sleeps: number[] = []) {
		return new GmailApiClient(
			"token",
			fetchFunction,
			new ApiClientRequestPacer(
				async (ms) => {
					sleeps.push(ms)
				},
				() => 0,
				isRetryableGmailError,
				GMAIL_API_MAX_QUOTA_UNITS_PER_SECOND,
				GMAIL_API_MIN_QUOTA_UNITS_PER_SECOND,
			),
		)
	}

	const message = (id: string) => ({ id, raw: "abc", labelIds: ["INBOX"], sizeEstimate: 10 })

	o.test("lists the labels", async () => {
		const { fetchFunction, requests } = mockedFetch(json(200, { labels: [{ id: "INBOX", name: "INBOX", type: "system" }] }))

		const labels = await client(fetchFunction).listLabels()

		o.check(labels).deepEquals([{ id: "INBOX", name: "INBOX", type: "system" }])
		o.check(new URL(requests[0].url).pathname).equals("/gmail/v1/users/me/labels")
	})

	o.test("lists the ids like IMAP's All Mail: no spam, no trash, no chats, authorized with the access token", async () => {
		const { fetchFunction, requests } = mockedFetch(json(200, { messages: [{ id: "m1" }, { id: "m2" }], nextPageToken: "next" }))

		const page = await client(fetchFunction).listMessageIds("token")

		o.check(page).deepEquals({ ids: ["m1", "m2"], nextPageToken: "next" })
		const url = new URL(requests[0].url)
		o.check(url.pathname).equals("/gmail/v1/users/me/messages")
		o.check(url.searchParams.get("includeSpamTrash")).equals("false")
		o.check(url.searchParams.get("q")).equals("-in:chats")
		o.check(url.searchParams.get("maxResults")).equals(MAIL_DOWNLOAD_BATCH_SIZE.toString())
		o.check(url.searchParams.get("pageToken")).equals("token")
		o.check((requests[0].init.headers as Record<string, string>).Authorization).equals("Bearer token")
	})

	o.test("gets many messages with one batch request, in the order of the ids, without the ones that do not exist anymore", async () => {
		const { fetchFunction, requests } = mockedFetch(
			// the answers are not in order
			batchResponse([
				{ position: 2, status: 200, body: message("c") },
				{ position: 0, status: 200, body: message("a") },
				{ position: 1, status: 404, body: errorBody("Requested entity was not found.") },
			]),
		)

		const messages = await client(fetchFunction).getMessages(["a", "b", "c"])

		o.check(messages.map((m) => m.id)).deepEquals(["a", "c"])
		o.check(requests.length).equals(1)
		o.check(requests[0].url).equals("https://www.googleapis.com/batch/gmail/v1")
		o.check(requests[0].init.method).equals("POST")
		const headers = requests[0].init.headers as Record<string, string>
		o.check(headers.Authorization).equals("Bearer token")
		const boundary = headers["Content-Type"].match(/^multipart\/mixed; boundary=(.+)$/)![1]
		const body = requests[0].init.body as string
		o.check(body.endsWith(`--${boundary}--`)).equals(true)
		o.check(body.split(`--${boundary}\r\n`).length - 1).equals(3)
		o.check(body.includes("Content-ID: <item2>\r\n\r\nGET /gmail/v1/users/me/messages/c?format=raw HTTP/1.1")).equals(true)
	})

	o.test("gets the messages in batches of the batch size, one batch request each", async () => {
		const ids = Array.from({ length: 30 }, (_, i) => `m${i}`)
		const firstBatch = ids.slice(0, 25)
		const secondBatch = ids.slice(25)
		const { fetchFunction, requests } = mockedFetch(
			batchResponse(firstBatch.map((id, position) => ({ position, status: 200, body: message(id) }))),
			batchResponse(secondBatch.map((id, position) => ({ position, status: 200, body: message(id) }))),
		)
		const gmailClient = client(fetchFunction)

		const messages = await gmailClient.getMessages(ids)

		o.check(gmailClient.messageBatchSize).equals(25)
		o.check(messages.map((m) => m.id)).deepEquals(ids)
		o.check(requests.length).equals(2)
		o.check((requests[0].init.body as string).split("GET /gmail/v1/users/me/messages/").length - 1).equals(25)
		o.check((requests[1].init.body as string).split("GET /gmail/v1/users/me/messages/").length - 1).equals(5)
	})

	o.test("a call of the batch that is throttled is requested again alone, after slowing down, the others are kept", async () => {
		const sleeps: number[] = []

		const { fetchFunction, requests } = mockedFetch(
			batchResponse([
				{ position: 0, status: 200, body: message("a") },
				{ position: 1, status: 429, body: errorBody("rate"), headers: { "Retry-After": "3" } },
				{ position: 2, status: 403, body: errorBody("rate", "userRateLimitExceeded") },
			]),
			batchResponse([
				{ position: 0, status: 200, body: message("b") },
				{ position: 1, status: 200, body: message("c") },
			]),
		)

		const messages = await client(fetchFunction, sleeps).getMessages(["a", "b", "c"])

		o.check(messages.map((m) => m.id)).deepEquals(["a", "b", "c"])
		o.check(requests.length).equals(2)
		const retriedBody = requests[1].init.body as string
		o.check(retriedBody.includes("/messages/b?")).equals(true)
		o.check(retriedBody.includes("/messages/c?")).equals(true)
		o.check(retriedBody.includes("/messages/a?")).equals(false)
		o.check(sleeps).deepEquals([3000])
	})

	o.test("a call of the batch that fails for good makes the request fail", async () => {
		const { fetchFunction, requests } = mockedFetch(
			batchResponse([
				{ position: 0, status: 200, body: message("a") },
				{ position: 1, status: 403, body: errorBody("not configured", "accessNotConfigured") },
			]),
		)

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getMessages(["a", "b"]))

		o.check(e.status).equals(403)
		o.check(e.reason).equals("accessNotConfigured")
		o.check(requests.length).equals(1)
	})

	o.test("gives up when calls of the batch are still throttled after the maximum number of attempts", async () => {
		const { fetchFunction, requests } = mockedFetch(
			...Array.from({ length: 8 }, () => batchResponse([{ position: 0, status: 429, body: errorBody("rate"), headers: { "Retry-After": "1" } }])),
		)

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getMessages(["a"]))

		o.check(e.status).equals(429)
		o.check(requests.length).equals(8)
	})

	o.test("waits out a throttled batch request using Retry-After and backs off on server errors", async () => {
		const sleeps: number[] = []

		const { fetchFunction } = mockedFetch(
			json(429, errorBody("slow down"), { "Retry-After": "2" }),
			json(503),
			batchResponse([{ position: 0, status: 200, body: message("a") }]),
		)

		const messages = await client(fetchFunction, sleeps).getMessages(["a"])

		o.check(messages[0].raw).equals("abc")
		o.check(sleeps[0]).equals(2000)
		o.check(sleeps.length).equals(3)
	})

	o.test("uses the end of the rate limit that Google reports in the message", async () => {
		const sleeps: number[] = []
		const retryAt = new Date(5000).toISOString()
		const { fetchFunction } = mockedFetch(
			json(403, errorBody(`User-rate limit exceeded.  Retry after ${retryAt}`, "userRateLimitExceeded")),
			json(200, { labels: [] }),
		)

		await client(fetchFunction, sleeps).listLabels()

		o.check(sleeps[0]).equals(5000)
	})

	o.test("paces the batch requests by their quota cost and slows down after a rate limit", async () => {
		const sleeps: number[] = []

		const ids = Array.from({ length: 10 }, (_, i) => `m${i}`)
		const ok = () => batchResponse(ids.map((id, position) => ({ position, status: 200, body: message(id) })))
		const { fetchFunction } = mockedFetch(ok(), ok(), json(429, errorBody("slow down"), { "Retry-After": "0" }), ok(), ok(), ok())
		const gmailClient = client(fetchFunction, sleeps)

		await gmailClient.getMessages(ids)
		await gmailClient.getMessages(ids)
		// a batch request costs 20 * number of messages quota units, at 150 units per second the next one waits 1333 ms
		o.check(Math.round(sleeps[0])).equals(1333)

		await gmailClient.getMessages(ids)
		sleeps.length = 0
		await gmailClient.getMessages(ids)
		await gmailClient.getMessages(ids)

		o.check(sleeps[sleeps.length - 1] - sleeps[sleeps.length - 2] > 2500).equals(true)
	})

	o.test("retries rate limit 403 and network errors of the batch request", async () => {
		const { fetchFunction, requests } = mockedFetch(
			new TypeError("fetch failed"),
			json(403, errorBody("rate", "userRateLimitExceeded")),
			batchResponse([{ position: 0, status: 200, body: message("a") }]),
		)

		const messages = await client(fetchFunction).getMessages(["a"])

		o.check(messages[0].id).equals("a")
		o.check(requests.length).equals(3)
	})

	o.test("a 403 of the batch request that is not a rate limit is not retried", async () => {
		const { fetchFunction, requests } = mockedFetch(json(403, errorBody("not configured", "accessNotConfigured")))

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getMessages(["a"]))

		o.check(e.status).equals(403)
		o.check(requests.length).equals(1)
	})

	o.test("gives up after the maximum number of attempts", async () => {
		const { fetchFunction, requests } = mockedFetch(...Array.from({ length: 8 }, () => json(500)))

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getMessages(["a"]))

		o.check(e.status).equals(500)
		o.check(requests.length).equals(8)
	})

	o.test("parses a batch response, also without Content-IDs by the order of the parts", async () => {
		const text = [
			"--b\r\nContent-Type: application/http\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + JSON.stringify({ id: "x" }) + "\r\n",
			"--b\r\nContent-Type: application/http\r\n\r\nHTTP/1.1 429 Too Many Requests\r\nRetry-After: 4\r\n\r\n{}\r\n",
			"--b--",
		].join("")

		const parts = parseBatchResponse(text, "multipart/mixed; boundary=b", 2)

		o.check(parts.get(0)?.status).equals(200)
		o.check(parts.get(0)?.body).deepEquals({ id: "x" })
		o.check(parts.get(1)?.status).equals(429)
		o.check(parts.get(1)?.retryAfter).equals("4")
	})

	o.test("a batch response without a boundary is an error", () => {
		try {
			parseBatchResponse("", "multipart/mixed", 1)
			o.check(false).equals(true) // fail
		} catch (e) {
			o.check(e instanceof GmailApiError).equals(true)
		}
	})

	o.test("parses the end of a rate limit from the message", () => {
		o.check(parseRetryAfterFromMessage("User-rate limit exceeded.  Retry after 2026-10-02T10:00:10.000Z", Date.parse("2026-10-02T10:00:00.000Z"))).equals(
			10_000,
		)
		o.check(parseRetryAfterFromMessage("something else", 0)).equals(null)
	})
})
