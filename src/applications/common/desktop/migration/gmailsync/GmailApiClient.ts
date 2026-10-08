import { MigrationError } from "../../../api/common/error/MigrationError.js"
import {
	BadGatewayError,
	GatewayTimeoutError,
	InternalServerError,
	NotAuthorizedError,
	NotFoundError,
	ServiceUnavailableError,
	TooManyRequestsError,
} from "@tutao/http-client/error"

const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me"
const GMAIL_BATCH_URL = "https://www.googleapis.com/batch/gmail/v1"
const GMAIL_BATCH_PATH_PREFIX = "/gmail/v1/users/me"
const LIST_PAGE_SIZE = "500"
const REQUEST_TIMEOUT = 60 * 1000

// Getting the mails in batches saves the round trips, but every call in a batch still counts against the quota. Google advises
// batches of at most 50 calls as larger ones are likely to trigger rate limiting: https://developers.google.com/workspace/gmail/api/guides/batch
const MAX_MESSAGE_BATCH_SIZE = 25
// Raw mails are returned as base64 inside the response, mails with large attachments make the batch size shrink so that it stays in memory.
const MAX_BATCH_RESPONSE_BYTES = 32 * 1024 * 1024

// Gmail API quota: 250 units per second per user (moving average), messages.get and messages.list cost 5 units, labels.list 1.
// A client that fires requests as fast as possible (about 50 mails per second) runs into the limit after a few hundred mails,
// so requests are paced below it. The pace is halved when Google still reports a rate limit and recovers slowly afterwards.
// https://developers.google.com/gmail/api/reference/quota
const QUOTA_UNITS_PER_SECOND = 150
const MIN_QUOTA_UNITS_PER_SECOND = 25
const QUOTA_COST_LIST_LABELS = 1
const QUOTA_COST_LIST_MESSAGES = 5
const QUOTA_COST_GET_MESSAGE = 20

// Rate limit windows are short, so a throttled request waits them out instead of postponing the whole sync.
// https://developers.google.com/gmail/api/guides/handle-errors
const MAX_REQUEST_ATTEMPTS = 8
const REQUEST_RETRY_BASE_DELAY = 1000
const MAX_REQUEST_RETRY_DELAY = 2 * 60 * 1000
const RATE_LIMIT_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"])
const DAILY_LIMIT_REASON = "dailyLimitExceeded"

export type GmailLabelResource = {
	id: string
	name: string
	type?: "system" | "user"
}

export type GmailMessageListPage = {
	ids: string[]
	nextPageToken?: string
}

export type GmailMessageResource = {
	id: string
	labelIds?: string[]
	sizeEstimate?: number
	/** epoch milliseconds as a string */
	internalDate?: string
	/** base64url encoded RFC 822 source, only present for format=raw */
	raw?: string
}

export class GmailApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly reason?: string,
		readonly retryAfter?: string | null,
	) {
		super(message)
	}
}

/** The calls of the Gmail API the sync needs. */
export interface GmailMailApi {
	listLabels(): Promise<GmailLabelResource[]>

	/** One page of the ids of the mails in "All Mail" (no Spam, no Trash, no chats), newest first. */
	listMessageIds(pageToken?: string): Promise<GmailMessageListPage>

	/** The number of messages that should be passed to {@link getRawMessages} at once, it shrinks when the mails are large. */
	readonly messageBatchSize: number

	/** Gets the messages in one batch request. The result has the order of the ids, null for a message that does not exist anymore. */
	getRawMessages(ids: string[]): Promise<(GmailMessageResource | null)[]>
}

export function isGmailRateLimitError(e: any): boolean {
	return e?.status === TooManyRequestsError.CODE || (e?.status === NotAuthorizedError.CODE && RATE_LIMIT_REASONS.has(e?.reason))
}

export function isGmailDailyLimitError(e: any): boolean {
	return e?.status === NotAuthorizedError.CODE && e?.reason === DAILY_LIMIT_REASON
}

/** Throttling, server side failures and network level failures are worth another attempt. */
function isRetryableGmailError(e: any): boolean {
	if (e instanceof GmailApiError) {
		return (
			e.status === InternalServerError.CODE ||
			e.status === BadGatewayError.CODE ||
			e.status === ServiceUnavailableError.CODE ||
			e.status === GatewayTimeoutError.CODE ||
			isGmailRateLimitError(e)
		)
	}
	return !(e instanceof MigrationError)
}

/** Retry-After is either a number of seconds or a HTTP date. */
export function parseRetryAfterMs(retryAfter: string | null | undefined, now: number = Date.now()): number | null {
	if (!retryAfter) {
		return null
	}
	const seconds = parseInt(retryAfter, 10)
	if (Number.isFinite(seconds)) {
		return seconds * 1000
	}
	const date = Date.parse(retryAfter)
	return Number.isFinite(date) ? Math.max(date - now, 0) : null
}

/** Google reports the end of a rate limit as "Retry after 2026-10-02T10:00:00.000Z" in the error message, without a Retry-After header. */
export function parseRetryAfterFromMessage(message: string | undefined, now: number): number | null {
	const match = message?.match(/Retry after (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/i)
	const date = match ? Date.parse(match[1]) : NaN
	return Number.isFinite(date) ? Math.max(date - now, 0) : null
}

/** Spaces the start of requests so that the quota is not exceeded, shared by all requests of a client. */
class RequestPacer {
	private unitsPerSecond = QUOTA_UNITS_PER_SECOND
	private nextRequestStart = 0

	constructor(
		private readonly sleep: (ms: number) => Promise<void>,
		private readonly now: () => number,
	) {}

	async acquire(quotaCost: number): Promise<void> {
		const start = Math.max(this.now(), this.nextRequestStart)
		this.nextRequestStart = start + (quotaCost / this.unitsPerSecond) * 1000
		const waitMs = start - this.now()
		if (waitMs > 0) {
			await this.sleep(waitMs)
		}
	}

	onSuccess() {
		this.unitsPerSecond = Math.min(this.unitsPerSecond * 1.02, QUOTA_UNITS_PER_SECOND)
	}

	/** Slows down and keeps all requests, also the ones that are already waiting, from starting before the limit is over. */
	onRateLimited(retryAfterMs: number) {
		this.unitsPerSecond = Math.max(this.unitsPerSecond / 2, MIN_QUOTA_UNITS_PER_SECOND)
		this.nextRequestStart = Math.max(this.nextRequestStart, this.now() + retryAfterMs)
	}
}

/**
 * Client for the parts of the Gmail REST API that are needed to migrate a mailbox, using the OAuth access token of the user.
 * It paces its requests below the quota of the API and retries throttled and failed requests with exponential backoff.
 */
export class GmailApiClient implements GmailMailApi {
	private readonly pacer: RequestPacer
	private _messageBatchSize = MAX_MESSAGE_BATCH_SIZE

	constructor(
		private readonly accessToken: string,
		private readonly fetchFunction: typeof fetch = fetch,
		private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
		private readonly now: () => number = Date.now,
	) {
		this.pacer = new RequestPacer(sleep, now)
	}

	get messageBatchSize(): number {
		return this._messageBatchSize
	}

	async listLabels(): Promise<GmailLabelResource[]> {
		const response = await this.withRetry(QUOTA_COST_LIST_LABELS, () => this.get<{ labels?: GmailLabelResource[] }>("/labels", {}))
		return response.labels ?? []
	}

	async listMessageIds(pageToken?: string): Promise<GmailMessageListPage> {
		// without labelIds and with includeSpamTrash=false these are the mails of IMAP's "[Gmail]/All Mail", which does not show chats either
		const query: Record<string, string> = { maxResults: LIST_PAGE_SIZE, includeSpamTrash: "false", q: "-in:chats" }
		if (pageToken) {
			query.pageToken = pageToken
		}
		const response = await this.withRetry(QUOTA_COST_LIST_MESSAGES, () =>
			this.get<{ messages?: { id: string }[]; nextPageToken?: string }>("/messages", query),
		)
		return { ids: (response.messages ?? []).map((message) => message.id), nextPageToken: response.nextPageToken }
	}

	async getRawMessages(ids: string[]): Promise<(GmailMessageResource | null)[]> {
		const results: (GmailMessageResource | null)[] = new Array(ids.length).fill(null)
		let pending = ids.map((_, index) => index)
		let lastFailure: GmailApiError | null = null

		for (let attempt = 1; pending.length > 0; attempt++) {
			if (attempt > MAX_REQUEST_ATTEMPTS) {
				throw lastFailure ?? new GmailApiError("Gmail batch request was not completed", 500)
			}
			const parts = await this.withRetry(QUOTA_COST_GET_MESSAGE * pending.length, () => this.postBatch(pending.map((index) => ids[index])))

			const stillPending: number[] = []
			let retryAfterMs: number | null = null
			for (const [position, index] of pending.entries()) {
				const part = parts.get(position)
				if (part === undefined) {
					// the batch response does not contain an answer for this call
					stillPending.push(index)
				} else if (part.status === 200) {
					results[index] = part.body as GmailMessageResource
				} else if (part.status === NotFoundError.CODE) {
					results[index] = null
				} else {
					const error = new GmailApiError(
						part.body?.error?.message ?? "Gmail API error",
						part.status,
						part.body?.error?.errors?.[0]?.reason,
						part.retryAfter,
					)
					if (!isRetryableGmailError(error)) {
						throw error
					}
					lastFailure = error
					stillPending.push(index)
					retryAfterMs = Math.max(retryAfterMs ?? 0, this.retryDelay(error, attempt))
				}
			}
			pending = stillPending
			if (pending.length > 0) {
				// the calls of a batch are throttled individually, so the failed ones are requested again in a smaller batch after the pace was slowed down
				this.pacer.onRateLimited(retryAfterMs ?? this.retryDelay(null, attempt))
			}
		}
		return results
	}

	/** Runs the request, throttled and failed requests are retried with the pacing of the client. */
	private async withRetry<T>(quotaCost: number, request: () => Promise<T>): Promise<T> {
		for (let attempt = 1; ; attempt++) {
			await this.pacer.acquire(quotaCost)
			try {
				const result = await request()
				this.pacer.onSuccess()
				return result
			} catch (error) {
				if (attempt >= MAX_REQUEST_ATTEMPTS || !isRetryableGmailError(error)) {
					throw error
				}
				const retryAfterMs = this.retryDelay(error instanceof GmailApiError ? error : null, attempt)
				if (isGmailRateLimitError(error)) {
					this.pacer.onRateLimited(retryAfterMs)
				} else {
					await this.sleep(retryAfterMs)
				}
			}
		}
	}

	private retryDelay(error: GmailApiError | null, attempt: number): number {
		const backoffMs = REQUEST_RETRY_BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 250
		return Math.min(
			parseRetryAfterMs(error?.retryAfter, this.now()) ?? parseRetryAfterFromMessage(error?.message, this.now()) ?? backoffMs,
			MAX_REQUEST_RETRY_DELAY,
		)
	}

	private async get<T>(path: string, query: Record<string, string>): Promise<T> {
		const url = new URL(`${GMAIL_API_BASE_URL}${path}`)
		for (const [key, value] of Object.entries(query)) {
			url.searchParams.set(key, value)
		}
		const response = await this.fetchFunction(url, {
			headers: { Authorization: `Bearer ${this.accessToken}` },
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		})
		if (!response.ok) {
			throw await this.toApiError(response)
		}
		return (await response.json()) as T
	}

	/** Sends one multipart batch request with a get call per id, @return the parsed answers by the position of the id */
	private async postBatch(ids: string[]): Promise<Map<number, BatchPart>> {
		const boundary = `batch_${Math.random().toString(36).slice(2)}${this.now()}`
		const body =
			ids
				.map(
					(id, position) =>
						`--${boundary}\r\nContent-Type: application/http\r\nContent-ID: <item${position}>\r\n\r\n` +
						`GET ${GMAIL_BATCH_PATH_PREFIX}/messages/${encodeURIComponent(id)}?format=raw HTTP/1.1\r\n\r\n`,
				)
				.join("") + `--${boundary}--`
		const response = await this.fetchFunction(GMAIL_BATCH_URL, {
			method: "POST",
			headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": `multipart/mixed; boundary=${boundary}` },
			body,
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		})
		if (!response.ok) {
			throw await this.toApiError(response)
		}
		const text = await response.text()
		const parts = parseBatchResponse(text, response.headers.get("Content-Type") ?? "", ids.length)
		this.adaptBatchSize(text.length, ids.length)
		return parts
	}

	private adaptBatchSize(responseBytes: number, messageCount: number) {
		if (messageCount === 0) {
			return
		}
		const averageBytes = Math.max(responseBytes / messageCount, 1)
		this._messageBatchSize = Math.max(1, Math.min(MAX_MESSAGE_BATCH_SIZE, Math.floor(MAX_BATCH_RESPONSE_BYTES / averageBytes)))
	}

	private async toApiError(response: Response): Promise<GmailApiError> {
		let message = response.statusText
		let reason: string | undefined
		try {
			const body = await response.json()
			message = body?.error?.message ?? message
			reason = body?.error?.errors?.[0]?.reason
		} catch {
			// non-JSON error body, keep the status text
		}
		return new GmailApiError(message, response.status, reason, response.headers.get("Retry-After"))
	}
}

type BatchPart = { status: number; body: any; retryAfter: string | null }

/**
 * Parses the multipart/mixed response of a batch request. Every part holds a complete HTTP response and has the Content-ID
 * of its request with a "response-" prefix, because the order of the parts is not guaranteed. Parts are returned by the position of their request.
 */
export function parseBatchResponse(text: string, contentType: string, requestCount: number): Map<number, BatchPart> {
	const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1]
	if (!boundary) {
		throw new GmailApiError("Gmail batch response without a boundary", 502)
	}
	const parsed: { position: number | null; part: BatchPart }[] = []
	for (const rawPart of text.replace(/\r\n/g, "\n").split(`--${boundary}`)) {
		const partStart = rawPart.indexOf("\n\n")
		if (partStart === -1 || rawPart.trim() === "--") {
			continue
		}
		const partHeaders = rawPart.slice(0, partStart)
		const httpResponse = rawPart.slice(partStart + 2)
		const position = partHeaders.match(/Content-ID:\s*<(?:response-)?(?:[^>]*\+)?item(\d+)>/i)?.[1]
		const statusLine = httpResponse.match(/^\s*HTTP\/\d(?:\.\d)?\s+(\d{3})/)
		if (!statusLine) {
			continue
		}
		const headersEnd = httpResponse.indexOf("\n\n")
		const responseHeaders = httpResponse.slice(0, headersEnd === -1 ? httpResponse.length : headersEnd)
		const responseBody = headersEnd === -1 ? "" : httpResponse.slice(headersEnd + 2).trim()
		let body: any = null
		try {
			body = responseBody === "" ? null : JSON.parse(responseBody)
		} catch {
			// keep null, the status decides
		}
		parsed.push({
			position: position === undefined ? null : parseInt(position, 10),
			part: { status: parseInt(statusLine[1], 10), body, retryAfter: responseHeaders.match(/^Retry-After:\s*(.+)$/im)?.[1]?.trim() ?? null },
		})
	}
	const result = new Map<number, BatchPart>()
	// without Content-IDs the parts can only be matched by their order
	const matchByOrder = parsed.length === requestCount && parsed.every((entry) => entry.position === null)
	for (const [order, entry] of parsed.entries()) {
		const position = matchByOrder ? order : entry.position
		if (position !== null && position < requestCount) {
			result.set(position, entry.part)
		}
	}
	return result
}
