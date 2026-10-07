import { MigrationError } from "../../../api/common/error/MigrationError.js"

const GRAPH_API_ORIGIN = "https://graph.microsoft.com"
const GRAPH_API_BASE_URL = `${GRAPH_API_ORIGIN}/v1.0`
const REQUEST_TIMEOUT = 2 * 60 * 1000
// immutable ids stay the same when a mail is moved between folders, the sync identifies imported mails by them
const IMMUTABLE_ID_HEADER = 'IdType="ImmutableId"'

// The mails of a folder are listed with a delta query that only returns their ids, so that mails that were imported before are
// not downloaded again with their attachments. The other mails are requested with JSON batching, which allows up to 20 requests in one
// call. Every request of a batch is still throttled individually (https://learn.microsoft.com/en-us/graph/json-batching).
const MESSAGE_ID_PAGE_SIZE = 100
const MAX_MESSAGE_BATCH_SIZE = 20
// Mails come with their attachments as base64 inside the response, mails with large attachments make the batch size shrink so that it stays in memory.
const MAX_BATCH_RESPONSE_BYTES = 32 * 1024 * 1024

// Microsoft Graph throttles with 429 (and 503/504 when it is overloaded) and tells how long to wait in the Retry-After header,
// a throttled request waits that time instead of postponing the whole sync. https://learn.microsoft.com/en-us/graph/throttling
const MAX_REQUEST_ATTEMPTS = 8
const REQUEST_RETRY_BASE_DELAY = 1000
const MAX_REQUEST_RETRY_DELAY = 2 * 60 * 1000

//https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0
export type GraphMailFolderResource = {
	id: string
	displayName: string
	parentFolderId?: string
	childFolderCount?: number
}

type GraphEmailAddress = { name?: string; address?: string }
export type GraphRecipient = { emailAddress?: GraphEmailAddress }

export type GraphAttachmentResource = {
	id: string
	name?: string
	contentType?: string
	contentBytes?: string
	isInline?: boolean
	size?: number
	contentId?: string
}

export type GraphMessageResource = {
	id: string
	internetMessageId?: string
	subject?: string
	sender?: GraphRecipient
	from?: GraphRecipient
	toRecipients?: GraphRecipient[]
	ccRecipients?: GraphRecipient[]
	bccRecipients?: GraphRecipient[]
	replyTo?: GraphRecipient[]
	sentDateTime?: string
	receivedDateTime?: string
	isRead?: boolean
	body?: { contentType?: string; content?: string }
	internetMessageHeaders?: { name: string; value: string }[]
	attachments?: GraphAttachmentResource[]
	"@removed"?: { reason: string }
}

export type GraphMessageIdPage = {
	/** The ids of the mails that are in the folder. */
	ids: string[]
	/** The ids of the mails that were removed from the folder (deleted or moved), only the delta query reports them. */
	removedIds: string[]
	/** The link to the next page, null for the last one. */
	nextLink: string | null
}

type GraphPagedResponse<T> = {
	value: T[]
	"@odata.nextLink"?: string
	"@odata.deltaLink"?: string
}

export class GraphApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code?: string,
		/** The Retry-After header, in seconds or as a HTTP date. */
		readonly retryAfter?: string | null,
	) {
		super(message)
	}
}

/** The calls of the Microsoft Graph API the sync needs. */
export interface GraphMailApi {
	/** @return the id of a well-known folder (e.g. "inbox"), null if the mailbox does not have it */
	getWellKnownFolderId(name: string): Promise<string | null>

	/** The top level folders of the mailbox, including hidden ones. */
	listFolders(): Promise<GraphMailFolderResource[]>

	listChildFolders(folderId: string): Promise<GraphMailFolderResource[]>

	/** One page of the ids of the mails of a folder, pass the `nextLink` of the previous page to get the next one. */
	listMessageIds(folderId: string, nextLink?: string | null): Promise<GraphMessageIdPage>

	/** The number of mails that should be passed to {@link getMessages} at once, it shrinks when the mails are large. */
	readonly messageBatchSize: number

	/** Gets mails with their attachments in one batch request. The result has the order of the ids, null for a mail that does not exist anymore. */
	getMessages(ids: string[]): Promise<(GraphMessageResource | null)[]>
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

/** Throttling, server side failures and network level failures are worth another attempt. */
function isRetryableGraphError(e: any): boolean {
	if (e instanceof GraphApiError) {
		return e.status === 429 || e.status === 500 || e.status === 502 || e.status === 503 || e.status === 504
	}
	return !(e instanceof MigrationError)
}

/**
 * Client for the parts of the Microsoft Graph REST API that are needed to migrate a mailbox, using the OAuth access token of the user.
 * It retries throttled and failed requests, honouring Retry-After and otherwise using exponential backoff.
 */
export class GraphApiClient implements GraphMailApi {
	private _messageBatchSize = MAX_MESSAGE_BATCH_SIZE

	constructor(
		private readonly accessToken: string,
		private readonly fetchFunction: typeof fetch = fetch,
		private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
		private readonly now: () => number = Date.now,
	) {}

	async getWellKnownFolderId(name: string): Promise<string | null> {
		try {
			const folder = await this.get<{ id: string }>(`${GRAPH_API_BASE_URL}/me/mailFolders/${encodeURIComponent(name)}?$select=id`)
			return folder.id
		} catch (e) {
			// not every mailbox has every well-known folder (e.g. Archive)
			if (e instanceof GraphApiError && (e.status === 404 || e.status === 400)) {
				return null
			}
			throw e
		}
	}

	async listFolders(): Promise<GraphMailFolderResource[]> {
		return this.getAllPages<GraphMailFolderResource>(`${GRAPH_API_BASE_URL}/me/mailFolders?includeHiddenFolders=true`)
	}

	async listChildFolders(folderId: string): Promise<GraphMailFolderResource[]> {
		return this.getAllPages<GraphMailFolderResource>(
			`${GRAPH_API_BASE_URL}/me/mailFolders/${encodeURIComponent(folderId)}/childFolders?includeHiddenFolders=true`,
		)
	}

	async listMessageIds(folderId: string, nextLink?: string | null): Promise<GraphMessageIdPage> {
		// TODO: we could use @odata.deltaLink for quick resyncs instead of reading all the ids of the folder.
		const url = nextLink ?? `${GRAPH_API_BASE_URL}/me/mailFolders/${encodeURIComponent(folderId)}/messages/delta?$select=id`
		const response = await this.get<GraphPagedResponse<GraphMessageResource>>(url, [`odata.maxpagesize=${MESSAGE_ID_PAGE_SIZE}`])
		const messages = response.value ?? []
		return {
			ids: messages.filter((message) => !message["@removed"]).map((message) => message.id),
			removedIds: messages.filter((message) => message["@removed"]).map((message) => message.id),
			nextLink: response["@odata.nextLink"] ?? null,
		}
	}

	get messageBatchSize(): number {
		return this._messageBatchSize
	}

	async getMessages(ids: string[]): Promise<(GraphMessageResource | null)[]> {
		const results: (GraphMessageResource | null)[] = new Array(ids.length).fill(null)
		let pending = ids.map((_, index) => index)
		let lastFailure: GraphApiError | null = null

		for (let attempt = 1; pending.length > 0; attempt++) {
			if (attempt > MAX_REQUEST_ATTEMPTS) {
				throw lastFailure ?? new GraphApiError("Microsoft Graph batch request was not completed", 500)
			}
			const responses = await this.postBatch(pending.map((index) => ids[index]))

			const stillPending: number[] = []
			let retryAfterMs: number | null = null
			for (const [position, index] of pending.entries()) {
				const response = responses.get(position)
				if (response === undefined) {
					// the batch response does not contain an answer for this request
					stillPending.push(index)
				} else if (response.status === 200) {
					results[index] = response.body as GraphMessageResource
				} else if (response.status === 404) {
					results[index] = null
				} else {
					const error = new GraphApiError(
						response.body?.error?.message ?? "Microsoft Graph error",
						response.status,
						response.body?.error?.code,
						response.retryAfter,
					)
					if (!isRetryableGraphError(error)) {
						throw error
					}
					lastFailure = error
					stillPending.push(index)
					retryAfterMs = Math.max(retryAfterMs ?? 0, this.retryDelay(error, attempt))
				}
			}
			pending = stillPending
			if (pending.length > 0) {
				// the requests of a batch are throttled individually, the failed ones are requested again after the time Graph asked for
				await this.sleep(retryAfterMs ?? this.retryDelay(null, attempt))
			}
		}
		return results
	}

	private async getAllPages<T>(firstUrl: string): Promise<T[]> {
		const results: T[] = []
		let url: string | undefined = firstUrl
		while (url) {
			const response: GraphPagedResponse<T> = await this.get<GraphPagedResponse<T>>(url)
			results.push(...(response.value ?? []))
			url = response["@odata.nextLink"]
		}
		return results
	}

	private async get<T>(url: string, preferences: string[] = []): Promise<T> {
		return this.withRetry(() => this.request<T>(url, { headers: this.headers(preferences) }))
	}

	/** Sends one JSON batch request with a get request (including the attachments) per id, @return the answers by the position of the id */
	private async postBatch(ids: string[]): Promise<Map<number, BatchResponse>> {
		const body = {
			requests: ids.map((id, position) => ({
				id: String(position),
				method: "GET",
				url: `/me/messages/${encodeURIComponent(id)}?$expand=attachments`,
				headers: { Prefer: IMMUTABLE_ID_HEADER },
			})),
		}
		const text = await this.withRetry(() =>
			this.request<string>(
				`${GRAPH_API_BASE_URL}/$batch`,
				{ method: "POST", headers: { ...this.headers([]), "Content-Type": "application/json" }, body: JSON.stringify(body) },
				true,
			),
		)
		const result = new Map<number, BatchResponse>()
		let responseCount = 0
		for (const response of JSON.parse(text).responses ?? []) {
			const position = parseInt(response.id, 10)
			if (Number.isInteger(position) && position >= 0 && position < ids.length) {
				const headers = response.headers ?? {}
				const retryAfterName = Object.keys(headers).find((name) => name.toLowerCase() === "retry-after")
				result.set(position, { status: response.status, body: response.body, retryAfter: retryAfterName ? String(headers[retryAfterName]) : null })
				responseCount++
			}
		}
		this.adaptBatchSize(text.length, responseCount)
		return result
	}

	private adaptBatchSize(responseBytes: number, messageCount: number) {
		if (messageCount === 0) {
			return
		}
		const averageBytes = Math.max(responseBytes / messageCount, 1)
		this._messageBatchSize = Math.max(1, Math.min(MAX_MESSAGE_BATCH_SIZE, Math.floor(MAX_BATCH_RESPONSE_BYTES / averageBytes)))
	}

	private headers(preferences: string[]): Record<string, string> {
		return { Authorization: `Bearer ${this.accessToken}`, Prefer: [IMMUTABLE_ID_HEADER, ...preferences].join(", ") }
	}

	/** Runs the request, throttled and failed requests are retried honouring Retry-After. */
	private async withRetry<T>(request: () => Promise<T>): Promise<T> {
		for (let attempt = 1; ; attempt++) {
			try {
				return await request()
			} catch (error) {
				if (attempt >= MAX_REQUEST_ATTEMPTS || !isRetryableGraphError(error)) {
					throw error
				}
				await this.sleep(this.retryDelay(error instanceof GraphApiError ? error : null, attempt))
			}
		}
	}

	private retryDelay(error: GraphApiError | null, attempt: number): number {
		const backoffMs = REQUEST_RETRY_BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 250
		return Math.min(parseRetryAfterMs(error?.retryAfter, this.now()) ?? backoffMs, MAX_REQUEST_RETRY_DELAY)
	}

	/** @param asText return the body as text instead of parsing it */
	private async request<T>(url: string, init: RequestInit, asText = false): Promise<T> {
		// the links of a page come from the server, the access token must never be sent anywhere else
		if (new URL(url).origin !== GRAPH_API_ORIGIN) {
			throw new MigrationError(`Refusing to send the Microsoft Graph access token to ${new URL(url).origin}`)
		}
		const response = await this.fetchFunction(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
		if (!response.ok) {
			let message = response.statusText
			let code: string | undefined
			try {
				const body = await response.json()
				message = body?.error?.message ?? message
				code = body?.error?.code
			} catch {
				// non-JSON error body, keep the status text
			}
			throw new GraphApiError(message, response.status, code, response.headers.get("Retry-After"))
		}
		return asText ? ((await response.text()) as T) : ((await response.json()) as T)
	}
}

type BatchResponse = { status: number; body: any; retryAfter: string | null }
