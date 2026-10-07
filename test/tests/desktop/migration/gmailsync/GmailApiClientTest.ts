import o, { assertThrows } from "@tutao/otest"
import {
	GmailApiClient,
	GmailApiError,
	parseBatchResponse,
	parseRetryAfterFromMessage,
	parseRetryAfterMs,
} from "../../../../../src/applications/common/desktop/migration/gmailsync/GmailApiClient"

o.spec("GmailApiClient", () => {
	function json(status: number, body: any = {}, headers: Record<string, string> = {}): Response {
		return new Response(JSON.stringify(body), { status, headers })
	}

	function errorBody(message: string, reason?: string) {
		return { error: { message, errors: reason ? [{ reason }] : [] } }
	}

	type Part = { position: number; status: number; body: any; headers?: Record<string, string> }

	/** The multipart/mixed answer of the batch endpoint. */
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

	const message = (id: string) => ({ id, raw: "abc", labelIds: ["INBOX"], sizeEstimate: 10 })

	type Request = { url: string; init: RequestInit }

	/** A fetch that answers with the given responses one after the other and records the requests. */
	function fakeFetch(...responses: (Response | Error)[]) {
		const requests: Request[] = []
		const fetchFunction = (async (url: URL | string, init: RequestInit) => {
			requests.push({ url: url.toString(), init })
			const response = responses.shift()
			if (response === undefined) throw new Error("no response configured")
			if (response instanceof Error) throw response
			return response
		}) as any as typeof fetch
		return { fetchFunction, requests }
	}

	function client(fetchFunction: typeof fetch, sleeps: number[] = []) {
		return new GmailApiClient(
			"token",
			fetchFunction,
			async (ms) => {
				sleeps.push(ms)
			},
			() => 0,
		)
	}

	o.test("lists the ids like IMAP's All Mail: no spam, no trash, no chats, authorized with the access token", async () => {
		const { fetchFunction, requests } = fakeFetch(json(200, { messages: [{ id: "m1" }, { id: "m2" }], nextPageToken: "next" }))

		const page = await client(fetchFunction).listMessageIds("token")

		o.check(page).deepEquals({ ids: ["m1", "m2"], nextPageToken: "next" })
		const url = new URL(requests[0].url)
		o.check(url.pathname).equals("/gmail/v1/users/me/messages")
		o.check(url.searchParams.get("includeSpamTrash")).equals("false")
		o.check(url.searchParams.get("q")).equals("-in:chats")
		o.check(url.searchParams.get("pageToken")).equals("token")
		o.check((requests[0].init.headers as Record<string, string>).Authorization).equals("Bearer token")
	})

	o.test("gets many messages with one batch request, in the order of the ids", async () => {
		const { fetchFunction, requests } = fakeFetch(
			// the answers are not in the order of the requests
			batchResponse([
				{ position: 2, status: 200, body: message("c") },
				{ position: 0, status: 200, body: message("a") },
				{ position: 1, status: 404, body: errorBody("Requested entity was not found.") },
			]),
		)

		const messages = await client(fetchFunction).getRawMessages(["a", "b", "c"])

		o.check(messages.map((m) => m?.id ?? null)).deepEquals(["a", null, "c"])
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

	o.test("a call of the batch that is throttled is requested again alone, after slowing down, the others are kept", async () => {
		const sleeps: number[] = []
		const { fetchFunction, requests } = fakeFetch(
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

		const messages = await client(fetchFunction, sleeps).getRawMessages(["a", "b", "c"])

		o.check(messages.map((m) => m?.id)).deepEquals(["a", "b", "c"])
		o.check(requests.length).equals(2)
		const retriedBody = requests[1].init.body as string
		o.check(retriedBody.includes("/messages/b?")).equals(true)
		o.check(retriedBody.includes("/messages/c?")).equals(true)
		o.check(retriedBody.includes("/messages/a?")).equals(false)
		o.check(sleeps[0]).equals(3000) // the pace is kept from starting before the Retry-After is over
	})

	o.test("a call of the batch that fails for good makes the request fail", async () => {
		const { fetchFunction, requests } = fakeFetch(
			batchResponse([
				{ position: 0, status: 200, body: message("a") },
				{ position: 1, status: 403, body: errorBody("not configured", "accessNotConfigured") },
			]),
		)

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getRawMessages(["a", "b"]))

		o.check(e.status).equals(403)
		o.check(e.reason).equals("accessNotConfigured")
		o.check(requests.length).equals(1)
	})

	o.test("gives up when calls of the batch are still throttled after the maximum number of attempts", async () => {
		const { fetchFunction, requests } = fakeFetch(
			...Array.from({ length: 8 }, () => batchResponse([{ position: 0, status: 429, body: errorBody("rate"), headers: { "Retry-After": "1" } }])),
		)

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getRawMessages(["a"]))

		o.check(e.status).equals(429)
		o.check(requests.length).equals(8)
	})

	o.test("waits out a throttled batch request using Retry-After and backs off on server errors", async () => {
		const sleeps: number[] = []
		const { fetchFunction } = fakeFetch(
			json(429, errorBody("slow down"), { "Retry-After": "2" }),
			json(503),
			batchResponse([{ position: 0, status: 200, body: message("a") }]),
		)

		const messages = await client(fetchFunction, sleeps).getRawMessages(["a"])

		o.check(messages[0]?.raw).equals("abc")
		o.check(sleeps[0]).equals(2000) // the pace is kept from starting before the Retry-After of the rate limit is over
		o.check(sleeps.length).equals(3)
	})

	o.test("uses the end of the rate limit that Google reports in the message", async () => {
		const sleeps: number[] = []
		const retryAt = new Date(5000).toISOString()
		const { fetchFunction } = fakeFetch(
			json(403, errorBody(`User-rate limit exceeded.  Retry after ${retryAt}`, "userRateLimitExceeded")),
			json(200, { labels: [] }),
		)

		await client(fetchFunction, sleeps).listLabels()

		o.check(sleeps[0]).equals(5000)
	})

	o.test("paces the batches by their quota cost and slows down after a rate limit", async () => {
		const sleeps: number[] = []
		const ids = Array.from({ length: 10 }, (_, i) => `m${i}`)
		const all = batchResponse(ids.map((id, position) => ({ position, status: 200, body: message(id) })))
		const throttled = json(429, errorBody("slow down"), { "Retry-After": "0" })
		const { fetchFunction } = fakeFetch(
			batchResponse(ids.map((id, position) => ({ position, status: 200, body: message(id) }))),
			batchResponse(ids.map((id, position) => ({ position, status: 200, body: message(id) }))),
			throttled,
			all,
			batchResponse(ids.map((id, position) => ({ position, status: 200, body: message(id) }))),
			batchResponse(ids.map((id, position) => ({ position, status: 200, body: message(id) }))),
		)
		const gmailClient = client(fetchFunction, sleeps)

		await gmailClient.getRawMessages(ids)
		await gmailClient.getRawMessages(ids)
		// 10 mails are 200 quota units, at 150 units per second the next batch has to wait 1333 ms
		o.check(Math.round(sleeps[0])).equals(1333)

		await gmailClient.getRawMessages(ids) // rate limited once, the pace is halved from 150 to 75 quota units per second
		sleeps.length = 0
		await gmailClient.getRawMessages(ids)
		await gmailClient.getRawMessages(ids)

		o.check(sleeps[sleeps.length - 1] - sleeps[sleeps.length - 2] > 500).equals(true)
	})

	o.test("the batch size shrinks when the mails are large", async () => {
		const large = "x".repeat(8 * 1024 * 1024)
		const { fetchFunction } = fakeFetch(
			batchResponse([
				{ position: 0, status: 200, body: { id: "a", raw: large } },
				{ position: 1, status: 200, body: { id: "b", raw: large } },
			]),
		)
		const gmailClient = client(fetchFunction)
		o.check(gmailClient.messageBatchSize).equals(25)

		await gmailClient.getRawMessages(["a", "b"])

		o.check(gmailClient.messageBatchSize <= 4).equals(true)
		o.check(gmailClient.messageBatchSize >= 1).equals(true)
	})

	o.test("retries rate limit 403 and network errors of the batch request", async () => {
		const { fetchFunction, requests } = fakeFetch(
			new TypeError("fetch failed"),
			json(403, errorBody("rate", "userRateLimitExceeded")),
			batchResponse([{ position: 0, status: 200, body: message("a") }]),
		)

		const messages = await client(fetchFunction).getRawMessages(["a"])

		o.check(messages[0]?.id).equals("a")
		o.check(requests.length).equals(3)
	})

	o.test("a 403 of the batch request that is not a rate limit is not retried", async () => {
		const { fetchFunction, requests } = fakeFetch(json(403, errorBody("not configured", "accessNotConfigured")))

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getRawMessages(["a"]))

		o.check(e.status).equals(403)
		o.check(requests.length).equals(1)
	})

	o.test("gives up after the maximum number of attempts", async () => {
		const { fetchFunction, requests } = fakeFetch(...Array.from({ length: 8 }, () => json(500)))

		const e = await assertThrows(GmailApiError, async () => await client(fetchFunction).getRawMessages(["a"]))

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

	o.test("parses Retry-After as seconds or date and the end of a rate limit from the message", async () => {
		o.check(parseRetryAfterMs("120")).equals(120_000)
		o.check(parseRetryAfterMs(new Date(10_000).toUTCString(), 4000)).equals(6000)
		o.check(parseRetryAfterMs(null)).equals(null)
		o.check(parseRetryAfterFromMessage("User-rate limit exceeded.  Retry after 2026-10-02T10:00:10.000Z", Date.parse("2026-10-02T10:00:00.000Z"))).equals(
			10_000,
		)
		o.check(parseRetryAfterFromMessage("something else", 0)).equals(null)
	})
})
