import o, { assertThrows } from "@tutao/otest"
import { ApiClientRequestPacer } from "../../../../src/applications/common/desktop/migration/ApiClientRequestPacer"
import { ApiClientError, API_CLIENT_MAX_REQUEST_ATTEMPTS, parseRetryAfterMs } from "../../../../src/applications/common/desktop/migration/ApiClientRequestUtils"
import {
	GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND,
	GRAPH_API_MIN_QUOTA_UNITS_PER_SECOND,
} from "../../../../src/applications/common/desktop/migration/m365sync/GraphApiClient"

o.spec("ApiClientRequestPacer", () => {
	let sleeps: number[]

	// 100 quota units per second, never slower than 10
	function pacer(): ApiClientRequestPacer {
		return new ApiClientRequestPacer(
			async (ms) => {
				sleeps.push(ms)
			},
			() => 0,
			(e) => e instanceof ApiClientError && (e.status === 429 || e.status >= 500),
			100,
			10,
		)
	}

	o.beforeEach(() => {
		sleeps = []
	})

	o.test("returns the result of the request", async () => {
		o.check(await pacer().withRetry(10, async () => "result")).equals("result")
		o.check(sleeps.length).equals(0)
	})

	o.test("starts requests as far apart as their quota cost needs", async () => {
		const requestPacer = pacer()

		await requestPacer.withRetry(50, async () => {})
		await requestPacer.withRetry(20, async () => {})
		await requestPacer.withRetry(20, async () => {})

		// 50 units at 100 units per second are 500 ms, then 20 units are 200 ms
		o.check(sleeps).deepEquals([500, 700])
	})

	o.test("does not retry errors that are not retryable", async () => {
		let calls = 0

		const e = await assertThrows(ApiClientError, async () =>
			pacer().withRetry(10, async () => {
				calls++
				throw new ApiClientError("denied", 403)
			}),
		)

		o.check(e.status).equals(403)
		o.check(calls).equals(1)
	})

	o.test("backs off exponentially on server errors", async () => {
		let calls = 0

		const result = await pacer().withRetry(0, async () => {
			if (++calls <= 2) throw new ApiClientError("unavailable", 503)
			return "ok"
		})

		o.check(result).equals("ok")
		o.check(sleeps.length).equals(2)
		o.check(sleeps[0] >= 1000 && sleeps[0] < 1250).equals(true)
		o.check(sleeps[1] >= 2000 && sleeps[1] < 2250).equals(true)
	})

	o.test("keeps all requests from starting before the Retry-After of a rate limit is over and slows down", async () => {
		const requestPacer = pacer()
		let calls = 0

		const result = await requestPacer.withRetry(50, async () => {
			if (++calls === 1) throw new ApiClientError("rate limit", 429, "2")
			return "ok"
		})
		await requestPacer.withRetry(50, async () => {})

		o.check(result).equals("ok")
		// the retry waits for the end of the rate limit, the pace was halved from 100 to 50 units per second so that the following request waits 1 s
		o.check(sleeps).deepEquals([2000, 3000])
	})

	o.test("uses the end of the rate limit that is in the message if there is no Retry-After", async () => {
		let calls = 0

		await pacer().withRetry(10, async () => {
			if (++calls === 1) throw new ApiClientError(`rate limit. Retry after ${new Date(7000).toISOString()}`, 429)
		})

		o.check(sleeps).deepEquals([7000])
	})

	o.test("never waits longer than the maximum between attempts", async () => {
		let calls = 0

		await pacer().withRetry(0, async () => {
			if (++calls === 1) throw new ApiClientError("unavailable", 503, "100000")
		})

		o.check(sleeps).deepEquals([2 * 60 * 1000])
	})

	o.test("gives up after the maximum number of attempts with the last error", async () => {
		let calls = 0

		const e = await assertThrows(ApiClientError, async () =>
			pacer().withRetry(10, async () => {
				throw new ApiClientError(`unavailable ${++calls}`, 503, "0")
			}),
		)

		o.check(calls).equals(API_CLIENT_MAX_REQUEST_ATTEMPTS)
		o.check(e.message).equals(`unavailable ${API_CLIENT_MAX_REQUEST_ATTEMPTS}`)
	})

	o.test("waits for the Retry-After of a rate limit when no quota is configured, like for the Graph API", async () => {
		const requestPacer = new ApiClientRequestPacer(
			async (ms) => {
				sleeps.push(ms)
			},
			() => 0,
			(e) => e instanceof ApiClientError && e.status === 429,
			GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND,
			GRAPH_API_MIN_QUOTA_UNITS_PER_SECOND,
		)
		let calls = 0

		await requestPacer.withRetry(0, async () => {
			if (++calls === 1) throw new ApiClientError("throttled", 429, "7")
		})

		o.check(sleeps).deepEquals([7000])
	})

	o.test("parses Retry-After as seconds or date", () => {
		o.check(parseRetryAfterMs("120")).equals(120_000)
		o.check(parseRetryAfterMs(new Date(10_000).toUTCString(), 4000)).equals(6000)
		o.check(parseRetryAfterMs(new Date(1000).toUTCString(), 4000)).equals(0)
		o.check(parseRetryAfterMs(null)).equals(null)
		o.check(parseRetryAfterMs("garbage")).equals(null)
	})
})
