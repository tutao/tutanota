import { NotFoundError } from "@tutao/http-client/error"
import { ApiClientRequestPacer } from "../ApiClientRequestPacer"
import { isNotEmpty, isNotNull, splitInChunks } from "@tutao/utils"
import { API_CLIENT_MAX_REQUEST_ATTEMPTS, API_CLIENT_REQUEST_TIMEOUT, GmailApiError, isRetryableGmailError } from "../ApiClientRequestUtils"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../MigrationSyncSession"

const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me"
const GMAIL_BATCH_URL = "https://www.googleapis.com/batch/gmail/v1"
const GMAIL_BATCH_PATH_PREFIX = "/gmail/v1/users/me"

const BATCH_SIZE = 25

// https://developers.google.com/gmail/api/reference/quota
const GMAIL_API_QUOTA_COST_LIST_LABELS = 1
const GMAIL_API_QUOTA_COST_LIST_MESSAGES = 5
const GMAIL_API_QUOTA_COST_GET_MESSAGE = 20
export const GMAIL_API_MAX_QUOTA_UNITS_PER_SECOND = 150
export const GMAIL_API_MIN_QUOTA_UNITS_PER_SECOND = 25

export type GmailApiLabelResource = {
	id: string
	name: string
	type?: "system" | "user"
}

export type GmailApiMessageListPage = {
	ids: string[]
	nextPageToken?: string
}

export type GmailApiMessageResource = {
	id: string
	labelIds?: string[]
	sizeEstimate?: number
	internalDate?: string
	// base64url encoded RFC 822 source
	raw?: string
}

type GmailApiBatchPart = { status: number; body: any; retryAfter: string | null }

export interface GmailMailApi {
	readonly messageBatchSize: number

	listLabels(): Promise<GmailApiLabelResource[]>

	listMessageIds(pageToken?: string): Promise<GmailApiMessageListPage>

	getMessages(ids: string[]): Promise<GmailApiMessageResource[]>
}

// Parses batch response according to https://developers.google.com/workspace/gmail/api/guides/batch
export function parseBatchResponse(text: string, contentType: string, requestCount: number): Map<number, GmailApiBatchPart> {
	const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1]
	if (!boundary) {
		throw new GmailApiError("Gmail batch response without a boundary", 502)
	}
	const parsed: { position: number | null; part: GmailApiBatchPart }[] = []
	for (const rawPart of text.replace(/\r\n/g, "\n").split(`--${boundary}`)) {
		const partStart = rawPart.indexOf("\n\n")
		if (partStart === -1 || rawPart.trim() === "--") {
			continue
		}
		const partHeaders = rawPart.slice(0, partStart)
		const httpResponse = rawPart.slice(partStart + 2)
		const headersEnd = httpResponse.indexOf("\n\n")
		const httpStatusLine = httpResponse.match(/^\s*HTTP\/\d(?:\.\d)?\s+(\d{3})/)
		if (!httpStatusLine) {
			continue
		}

		const responseHeaders = httpResponse.slice(0, headersEnd === -1 ? httpResponse.length : headersEnd)
		const responseBody = headersEnd === -1 ? "" : httpResponse.slice(headersEnd + 2).trim()
		let body: any = null

		let httpStatus = parseInt(httpStatusLine[1])

		try {
			body = responseBody !== "" ? JSON.parse(responseBody) : null
		} catch {
			continue
		}

		const position = partHeaders.match(/Content-ID:\s*<(?:response-)?(?:[^>]*\+)?item(\d+)>/i)?.[1]
		const retryAfter = responseHeaders.match(/^Retry-After:\s*(.+)$/im)?.[1]?.trim() ?? null
		parsed.push({
			position: position !== undefined ? parseInt(position) : null,
			part: {
				status: httpStatus,
				body,
				retryAfter,
			},
		})
	}
	const result = new Map<number, GmailApiBatchPart>()
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

/**
 * Client for the parts of the Gmail REST API that are needed to migrate a mailbox, using the OAuth access token of the user.
 * It uses GmailApiRequestPacer to avoid hitting quotas and retries throttled and failed requests with exponential backoff.
 */
export class GmailApiClient implements GmailMailApi {
	messageBatchSize = BATCH_SIZE

	constructor(
		private readonly accessToken: string,
		private readonly fetchFunction: typeof fetch = fetch,
		private readonly pacer: ApiClientRequestPacer = new ApiClientRequestPacer(
			(ms) => new Promise((resolve) => setTimeout(resolve, ms)),
			Date.now,
			isRetryableGmailError,
			GMAIL_API_MAX_QUOTA_UNITS_PER_SECOND,
			GMAIL_API_MIN_QUOTA_UNITS_PER_SECOND,
		),
	) {}

	async listLabels(): Promise<GmailApiLabelResource[]> {
		const response = await this.pacer.withRetry(GMAIL_API_QUOTA_COST_LIST_LABELS, () => this.get<{ labels?: GmailApiLabelResource[] }>("/labels", {}))
		return response.labels ?? []
	}

	async listMessageIds(pageToken?: string): Promise<GmailApiMessageListPage> {
		// we essentially fetch "[Gmail]/All Mail" without spam and trash
		const query: Record<string, string> = { maxResults: MAIL_DOWNLOAD_BATCH_SIZE.toString(), includeSpamTrash: "false", q: "-in:chats" }
		if (pageToken) {
			query.pageToken = pageToken
		}
		const response = await this.pacer.withRetry(GMAIL_API_QUOTA_COST_LIST_MESSAGES, () =>
			this.get<{ messages?: { id: string }[]; nextPageToken?: string }>("/messages", query),
		)
		return { ids: (response.messages ?? []).map((message) => message.id), nextPageToken: response.nextPageToken }
	}

	async getMessages(ids: string[]): Promise<GmailApiMessageResource[]> {
		let results: GmailApiMessageResource[] = []
		for (const idsForChunk of splitInChunks(this.messageBatchSize, ids)) {
			const resultsForChunk: (GmailApiMessageResource | null)[] = new Array(idsForChunk.length).fill(null)
			let pending = idsForChunk.map((_, index) => index)
			let lastFailure: GmailApiError | null = null

			for (let attempt = 1; pending.length > 0; attempt++) {
				if (attempt > API_CLIENT_MAX_REQUEST_ATTEMPTS) {
					throw lastFailure ?? new GmailApiError("Gmail batch request was not completed", 500)
				}
				const idsToRequest = pending.map((index) => idsForChunk[index])
				const responseParts = await this.pacer.withRetry(GMAIL_API_QUOTA_COST_GET_MESSAGE * idsToRequest.length, () => this.postBatch(idsToRequest))

				const stillPending: number[] = []
				let retryAfterMs: number | null = null
				for (const [position, index] of pending.entries()) {
					const part = responseParts.get(position)
					if (part === undefined) {
						// the batch response does not contain an answer for this call
						stillPending.push(index)
					} else if (part.status === 200) {
						resultsForChunk[index] = part.body as GmailApiMessageResource
					} else if (part.status === NotFoundError.CODE) {
						resultsForChunk[index] = null
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
						retryAfterMs = Math.max(retryAfterMs ?? 0, this.pacer.getRetryDelay(error, attempt))
					}
				}
				pending = stillPending
				if (isNotEmpty(pending)) {
					retryAfterMs = retryAfterMs ?? this.pacer.getRetryDelay(null, attempt)
					this.pacer.onRateLimited(retryAfterMs)
				}
			}
			results = results.concat(resultsForChunk.filter(isNotNull))
		}
		return results
	}

	private async get<T>(path: string, query: Record<string, string>): Promise<T> {
		const url = new URL(`${GMAIL_API_BASE_URL}${path}`)
		for (const [key, value] of Object.entries(query)) {
			url.searchParams.set(key, value)
		}
		const response = await this.fetchFunction(url, {
			headers: { Authorization: `Bearer ${this.accessToken}` },
			signal: AbortSignal.timeout(API_CLIENT_REQUEST_TIMEOUT),
		})
		if (!response.ok) {
			throw await this.toApiError(response)
		}
		return (await response.json()) as T
	}

	/** Sends one multipart batch request with a get call per id, @return the parsed answers by the position of the id */
	private async postBatch(ids: string[]): Promise<Map<number, GmailApiBatchPart>> {
		const boundary = `batch_${Math.random().toString(36).slice(2)}${Date.now()}`
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
			signal: AbortSignal.timeout(API_CLIENT_REQUEST_TIMEOUT),
		})
		if (!response.ok) {
			throw await this.toApiError(response)
		}
		const text = await response.text()
		return parseBatchResponse(text, response.headers.get("Content-Type") ?? "", ids.length)
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
