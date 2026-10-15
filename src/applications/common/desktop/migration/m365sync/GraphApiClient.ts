import { BadRequestError, NotFoundError } from "@tutao/http-client/error"
import { isNotNull, splitInChunks } from "@tutao/utils"
import { ApiClientRequestPacer } from "../ApiClientRequestPacer"
import { API_CLIENT_MAX_REQUEST_ATTEMPTS, API_CLIENT_REQUEST_TIMEOUT, GraphApiError, isRetryableGraphApiError } from "../ApiClientRequestUtils"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../MigrationSyncSession"

const GRAPH_API_ORIGIN = "https://graph.microsoft.com"
const GRAPH_API_BASE_URL = `${GRAPH_API_ORIGIN}/v1.0`

// The mails of a folder are listed with a delta query that only returns their ids, so that mails that were imported before are
// not downloaded again with their attachments. The other mails are requested with JSON batching, which allows up to 20 requests in one
// call. Every request of a batch is still throttled individually (https://learn.microsoft.com/en-us/graph/json-batching).
const BATCH_SIZE = 20

const GRAPH_API_QUOTA_COST = 0
export const GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND = 1000
export const GRAPH_API_MIN_QUOTA_UNITS_PER_SECOND = GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND

//https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0
export type GraphApiMailFolderResource = {
	id: string
	displayName: string
	parentFolderId?: string
	childFolderCount?: number
}

type GraphApiEmailAddress = { name?: string; address?: string }
export type GraphApiRecipient = { emailAddress?: GraphApiEmailAddress }

type GraphApiAttachmentResource = {
	id: string
	name?: string
	contentType?: string
	contentBytes?: string
	isInline?: boolean
	size?: number
	contentId?: string
}

export type GraphApiMessageResource = {
	id: string
	internetMessageId?: string
	subject?: string
	sender?: GraphApiRecipient
	from?: GraphApiRecipient
	toRecipients?: GraphApiRecipient[]
	ccRecipients?: GraphApiRecipient[]
	bccRecipients?: GraphApiRecipient[]
	replyTo?: GraphApiRecipient[]
	sentDateTime?: string
	receivedDateTime?: string
	isRead?: boolean
	body?: { contentType?: string; content?: string }
	internetMessageHeaders?: { name: string; value: string }[]
	attachments?: GraphApiAttachmentResource[]
	"@removed"?: { reason: string }
}

export type GraphApiMessageIdPage = {
	ids: string[]
	removedIds: string[]
	nextLink: string | null
}

type GraphApiPagedResponse<T> = {
	value: T[]
	"@odata.nextLink"?: string
	"@odata.deltaLink"?: string
}

type GraphApiBatchResponse = { status: number; body: any; retryAfter: string | null }

export interface GraphMailApi {
	readonly messageBatchSize: number

	getSystemFolderId(name: string): Promise<string | null>

	listFolders(): Promise<GraphApiMailFolderResource[]>

	listChildFolders(folderId: string): Promise<GraphApiMailFolderResource[]>

	listMessageIds(folderId: string, nextLink?: string | null): Promise<GraphApiMessageIdPage>

	getMessages(ids: string[]): Promise<GraphApiMessageResource[]>
}

/**
 * Client for the parts of the Microsoft Graph REST API that are needed to migrate a mailbox, using the OAuth access token of the user.
 * It retries throttled and failed requests, honoring Retry-After and otherwise using exponential backoff.
 */
export class GraphApiClient implements GraphMailApi {
	messageBatchSize = BATCH_SIZE

	constructor(
		private readonly accessToken: string,
		private readonly fetchFunction: typeof fetch = fetch,
		private readonly pacer: ApiClientRequestPacer = new ApiClientRequestPacer(
			(ms) => new Promise((resolve) => setTimeout(resolve, ms)),
			Date.now,
			isRetryableGraphApiError,
			GRAPH_API_MAX_QUOTA_UNITS_PER_SECOND,
			GRAPH_API_MIN_QUOTA_UNITS_PER_SECOND,
		),
	) {}

	async getSystemFolderId(name: string): Promise<string | null> {
		try {
			const folder = await this.get<{ id: string }>(`${GRAPH_API_BASE_URL}/me/mailFolders/${encodeURIComponent(name)}?$select=id`)
			return folder.id
		} catch (e) {
			// not every mailbox has every well-known folder (e.g. Archive)
			if (e instanceof GraphApiError && (e.status === NotFoundError.CODE || e.status === BadRequestError.CODE)) {
				return null
			}
			throw e
		}
	}

	async listFolders(): Promise<GraphApiMailFolderResource[]> {
		return this.getAllPages<GraphApiMailFolderResource>(`${GRAPH_API_BASE_URL}/me/mailFolders?includeHiddenFolders=true`)
	}

	async listChildFolders(folderId: string): Promise<GraphApiMailFolderResource[]> {
		return this.getAllPages<GraphApiMailFolderResource>(
			`${GRAPH_API_BASE_URL}/me/mailFolders/${encodeURIComponent(folderId)}/childFolders?includeHiddenFolders=true`,
		)
	}

	async listMessageIds(folderId: string, nextLink?: string | null): Promise<GraphApiMessageIdPage> {
		const url = nextLink ?? `${GRAPH_API_BASE_URL}/me/mailFolders/${encodeURIComponent(folderId)}/messages/delta?$select=id`
		const response = await this.pacer.withRetry(GRAPH_API_QUOTA_COST, () =>
			this.get<GraphApiPagedResponse<GraphApiMessageResource>>(url, [`odata.maxpagesize=${MAIL_DOWNLOAD_BATCH_SIZE}`]),
		)
		const messages = response.value ?? []
		return {
			ids: messages.filter((message) => !message["@removed"]).map((message) => message.id),
			removedIds: messages.filter((message) => message["@removed"]).map((message) => message.id),
			nextLink: response["@odata.nextLink"] ?? null,
		}
	}

	async getMessages(ids: string[]): Promise<GraphApiMessageResource[]> {
		let results: GraphApiMessageResource[] = []
		for (const idsForChunk of splitInChunks(this.messageBatchSize, ids)) {
			const resultsForChunk: (GraphApiMessageResource | null)[] = new Array(idsForChunk.length).fill(null)
			let pending = idsForChunk.map((_, index) => index)
			let lastFailure: GraphApiError | null = null

			for (let attempt = 1; pending.length > 0; attempt++) {
				if (attempt > API_CLIENT_MAX_REQUEST_ATTEMPTS) {
					throw lastFailure ?? new GraphApiError("Microsoft Graph batch request was not completed", 500)
				}
				const idsToRequest = pending.map((index) => idsForChunk[index])
				const responses = await this.pacer.withRetry(GRAPH_API_QUOTA_COST, () => this.postBatch(idsToRequest))

				const stillPending: number[] = []
				let retryAfterMs: number | null = null
				for (const [position, index] of pending.entries()) {
					const response = responses.get(position)
					if (response === undefined) {
						// the batch response does not contain an answer for this request
						stillPending.push(index)
					} else if (response.status === 200) {
						resultsForChunk[index] = response.body as GraphApiMessageResource
					} else if (response.status === NotFoundError.CODE) {
						resultsForChunk[index] = null
					} else {
						const error = new GraphApiError(
							response.body?.error?.message ?? "Microsoft Graph error",
							response.status,
							response.body?.error?.code,
							response.retryAfter,
						)
						if (!isRetryableGraphApiError(error)) {
							throw error
						}
						lastFailure = error
						stillPending.push(index)
						retryAfterMs = Math.max(retryAfterMs ?? 0, this.pacer.getRetryDelay(error, attempt))
					}
				}
				pending = stillPending
				if (pending.length > 0) {
					retryAfterMs = retryAfterMs ?? this.pacer.getRetryDelay(null, attempt)
					this.pacer.onRateLimited(retryAfterMs)
				}
			}
			results = results.concat(resultsForChunk.filter(isNotNull))
		}
		return results
	}

	private async getAllPages<T>(firstUrl: string): Promise<T[]> {
		let results: T[] = []
		let url: string | undefined = firstUrl
		while (url) {
			const urlToFetch = url
			const response: GraphApiPagedResponse<T> = await this.pacer.withRetry(GRAPH_API_QUOTA_COST, () => this.get<GraphApiPagedResponse<T>>(urlToFetch))
			results = results.concat(response.value ?? [])
			url = response["@odata.nextLink"]
		}
		return results
	}

	private async get<T>(url: string, preferences: string[] = []): Promise<T> {
		if (!url.startsWith(GRAPH_API_BASE_URL)) {
			throw new GraphApiError("Attempted to send the access token to a non-Graph API url", 400)
		}
		const headers = { Authorization: `Bearer ${this.accessToken}`, Prefer: ['IdType="ImmutableId"', ...preferences].join(", ") }
		const response = await this.fetchFunction(url, { headers, signal: AbortSignal.timeout(API_CLIENT_REQUEST_TIMEOUT) })
		if (!response.ok) {
			throw await this.toApiError(response)
		}
		return (await response.json()) as T
	}

	private async postBatch(ids: string[]): Promise<Map<number, GraphApiBatchResponse>> {
		const headers = { Authorization: `Bearer ${this.accessToken}`, Prefer: ['IdType="ImmutableId"'].join(", ") }
		const body = {
			requests: ids.map((id, position) => ({
				id: String(position),
				method: "GET",
				url: `/me/messages/${encodeURIComponent(id)}?$expand=attachments`,
				headers: { Prefer: 'IdType="ImmutableId"' },
			})),
		}

		const response = await this.fetchFunction(`${GRAPH_API_BASE_URL}/$batch`, {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})
		if (!response.ok) {
			throw await this.toApiError(response)
		}
		const responseText = await response.text()

		const result = new Map<number, GraphApiBatchResponse>()
		let responseCount = 0
		for (const response of JSON.parse(responseText).responses ?? []) {
			const position = parseInt(response.id)
			if (Number.isInteger(position) && position >= 0 && position < ids.length) {
				const headers = response.headers ?? {}
				const retryAfterName = Object.keys(headers).find((name) => name.toLowerCase() === "retry-after")
				result.set(position, { status: response.status, body: response.body, retryAfter: retryAfterName ? String(headers[retryAfterName]) : null })
				responseCount++
			}
		}
		return result
	}

	private async toApiError(response: Response): Promise<GraphApiError> {
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
}
