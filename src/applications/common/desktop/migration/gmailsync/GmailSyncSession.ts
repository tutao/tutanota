import { MigrationCredentials, MigrationMailboxState } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationMail } from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError.js"
import { assertNotNull, isNotEmpty } from "@tutao/utils"
import { MigrationSessionMailbox } from "../MigrationSessionMailbox.js"
import { MigrationSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ApiMigrationSyncSession } from "../ApiMigrationSyncSession.js"
import { RFC822Parser } from "../mailparser/RFC822Parser.js"
import type { gmail_v1 } from "@googleapis/gmail"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../imapsync/DifferentialUidLoader"

const LIST_PAGE_SIZE = 500
// Mails with large attachments are held in memory and passed to the importer as a whole, so a batch is also capped by size.
const MAIL_DOWNLOAD_BATCH_MAX_BYTES = 30 * 1024 * 1024
// Gmail allows 250 quota units/s per user and messages.get costs 5, so this stays well below the limit.
const CONCURRENT_MAIL_DOWNLOADS = 5
const SEEN_FLAG = "\\Seen"
const FLAGGED_FLAG = "\\Flagged"
const DRAFT_FLAG = "\\Draft"

// https://developers.google.com/gmail/api/guides/handle-errors
// Gmail API quota: 250 units per second per user (moving average), messages.get and messages.list cost 5 units, labels.list 1.
// A client that fires requests as fast as possible (about 50 mails per second) runs into the limit after a few hundred mails,
// so requests are paced below it. The pace is halved when Google still reports a rate limit and recovers slowly afterwards.
// https://developers.google.com/gmail/api/reference/quota
const QUOTA_UNITS_PER_SECOND = 150
const MIN_QUOTA_UNITS_PER_SECOND = 25
const QUOTA_COST_LIST_LABELS = 1
const QUOTA_COST_LIST_MESSAGES = 5
const QUOTA_COST_GET_MESSAGE = 5
// rate limit windows are short, so a throttled request waits them out instead of postponing the whole sync
const MAX_REQUEST_ATTEMPTS = 8
const REQUEST_RETRY_BASE_DELAY = 1000
const MAX_REQUEST_RETRY_DELAY = 2 * 60 * 1000
const GMAIL_DAILY_LIMIT_POSTPONE_TIME = 60 * 60 * 1000
const GMAIL_RATE_LIMIT_DEFAULT_POSTPONE_TIME = 60 * 1000
const GMAIL_RATE_LIMIT_MIN_POSTPONE_TIME = 30 * 1000
const RATE_LIMIT_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"])
const DAILY_LIMIT_REASON = "dailyLimitExceeded"

const ALL_MAIL_PATH = "[Gmail]/All Mail"

type GmailLabelResource = {
	id: string
	name: string
	type?: "system" | "user"
}

type GmailMessageListPage = {
	ids: string[]
	nextPageToken?: string
}

type GmailMessageResource = {
	id: string
	labelIds?: string[]
	sizeEstimate?: number
	/** epoch milliseconds as a string */
	internalDate?: string
	/** base64url encoded RFC 822 source, only present for format=raw */
	raw?: string
}

/**
 * Gmail's system labels that are mirrored as mailboxes, using the same paths and special uses the IMAP
 * server announces so that mails imported over either transport end up in the same Tuta labels.
 * Other system labels (CATEGORY_*, CHAT, UNREAD, ...) carry no folder semantics and are ignored.
 */
const SYSTEM_LABELS: ReadonlyArray<{ id: string; path: string; specialUse: MigrationMailboxSpecialUse }> = [
	{ id: "INBOX", path: "INBOX", specialUse: MigrationMailboxSpecialUse.INBOX },
	{ id: "SENT", path: "[Gmail]/Sent Mail", specialUse: MigrationMailboxSpecialUse.SENT },
	{ id: "DRAFT", path: "[Gmail]/Drafts", specialUse: MigrationMailboxSpecialUse.DRAFT },
	{ id: "TRASH", path: "[Gmail]/Trash", specialUse: MigrationMailboxSpecialUse.TRASH },
	{ id: "SPAM", path: "[Gmail]/Spam", specialUse: MigrationMailboxSpecialUse.JUNK },
	{ id: "IMPORTANT", path: "[Gmail]/Important", specialUse: MigrationMailboxSpecialUse.IMPORTANT },
	{ id: "STARRED", path: "[Gmail]/Starred", specialUse: MigrationMailboxSpecialUse.FLAGGED },
]

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

/** The calls of the Gmail API the sync needs, implemented on top of the Gmail API client library. */
export interface GmailApiClient {
	listLabels(): Promise<GmailLabelResource[]>

	/** One page of the ids of the mails in "All Mail" (no Spam, no Trash, no chats), newest first. */
	listMessageIds(pageToken?: string): Promise<GmailMessageListPage>

	/** @return null if the message does not exist anymore */
	getRawMessage(id: string): Promise<GmailMessageResource | null>
}

export type GmailApiClientFactory = (accessToken: string) => Promise<GmailApiClient>

/** The part of the `gmail_v1.Gmail` object of the library that is used, so that it can be replaced in tests. */
export type GmailLibraryApi = Pick<gmail_v1.Gmail, "users">

export function isGmailRateLimitError(e: any): boolean {
	return e?.status === 429 || (e?.status === 403 && RATE_LIMIT_REASONS.has(e?.reason))
}

export function isGmailDailyLimitError(e: any): boolean {
	return e?.status === 403 && e?.reason === DAILY_LIMIT_REASON
}

/** Maps the error of the library (a GaxiosError) to a GmailApiError, errors without a response (network level failures) are returned as they are. */
export function toGmailApiError(e: any): any {
	const status: number | undefined = e?.response?.status ?? (typeof e?.status === "number" ? e.status : undefined)
	if (status === undefined) {
		return e
	}
	const apiError = e?.response?.data?.error
	const headers = e?.response?.headers
	const retryAfter = typeof headers?.get === "function" ? headers.get("retry-after") : (headers?.["retry-after"] ?? null)
	return new GmailApiError(apiError?.message ?? e?.message ?? "Gmail API error", status, apiError?.errors?.[0]?.reason, retryAfter)
}

/** Throttling, server side failures and network level failures are worth another attempt, see https://developers.google.com/gmail/api/guides/handle-errors */
function isRetryableGmailError(e: any): boolean {
	if (e instanceof GmailApiError) {
		return e.status === 500 || e.status === 502 || e.status === 503 || e.status === 504 || isGmailRateLimitError(e)
	}
	return !(e instanceof MigrationError)
}

/** Retry-After is either a number of seconds or a HTTP date. */
export function parseRetryAfterMs(retryAfter: string | null | undefined): number | null {
	if (!retryAfter) {
		return null
	}
	const seconds = parseInt(retryAfter, 10)
	if (Number.isFinite(seconds)) {
		return seconds * 1000
	}
	const date = Date.parse(retryAfter)
	return Number.isFinite(date) ? Math.max(date - Date.now(), 0) : null
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
 * Creates the client on top of the Gmail API client library. Requests are retried with exponential backoff (honouring Retry-After),
 * as recommended by Google, because postponing the whole sync for a single throttled request would stall large imports.
 */
export function createGmailApiClient(
	gmailApi: GmailLibraryApi,
	sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
	now: () => number = Date.now,
): GmailApiClient {
	const pacer = new RequestPacer(sleep, now)

	async function withRetry<T>(quotaCost: number, request: () => Promise<T>): Promise<T> {
		for (let attempt = 1; ; attempt++) {
			await pacer.acquire(quotaCost)
			try {
				const result = await request()
				pacer.onSuccess()
				return result
			} catch (e) {
				const error = toGmailApiError(e)
				if (attempt >= MAX_REQUEST_ATTEMPTS || !isRetryableGmailError(error)) {
					throw error
				}
				const backoffMs = REQUEST_RETRY_BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 250
				const retryAfterMs = Math.min(
					parseRetryAfterMs((error as GmailApiError).retryAfter) ?? parseRetryAfterFromMessage((error as GmailApiError).message, now()) ?? backoffMs,
					MAX_REQUEST_RETRY_DELAY,
				)
				if (isGmailRateLimitError(error)) {
					pacer.onRateLimited(retryAfterMs)
				} else {
					await sleep(retryAfterMs)
				}
			}
		}
	}

	return {
		async listLabels() {
			const response = await withRetry(QUOTA_COST_LIST_LABELS, () => gmailApi.users.labels.list({ userId: "me" }))
			return (response.data.labels ?? []).map((label) => ({ id: label.id!, name: label.name!, type: label.type as GmailLabelResource["type"] }))
		},

		async listMessageIds(pageToken?: string) {
			// without labelIds and with includeSpamTrash=false this are the mails of IMAP's "[Gmail]/All Mail", which does not show chats either
			const response = await withRetry(QUOTA_COST_LIST_MESSAGES, () =>
				gmailApi.users.messages.list({ userId: "me", maxResults: LIST_PAGE_SIZE, includeSpamTrash: false, q: "-in:chats", pageToken }),
			)
			return { ids: (response.data.messages ?? []).map((message) => message.id!), nextPageToken: response.data.nextPageToken ?? undefined }
		},

		async getRawMessage(id: string) {
			try {
				const response = await withRetry(QUOTA_COST_GET_MESSAGE, () => gmailApi.users.messages.get({ userId: "me", id, format: "raw" }))
				const message = response.data
				return {
					id: message.id!,
					labelIds: message.labelIds ?? [],
					sizeEstimate: message.sizeEstimate ?? undefined,
					internalDate: message.internalDate ?? undefined,
					raw: message.raw ?? undefined,
				}
			} catch (e) {
				if (e instanceof GmailApiError && e.status === 404) {
					return null
				}
				throw e
			}
		},
	}
}

async function createGmailApiClientFromLibrary(accessToken: string): Promise<GmailApiClient> {
	const { gmail } = await import("./gmail-client-custom")
	return createGmailApiClient(gmail({ version: "v1", headers: { Authorization: `Bearer ${accessToken}` } }))
}

/**
 * Sync session to retrieve mails through the Gmail API.
 * Like ImapSyncSession for Gmail only "All Mail" is synced, the other labels are mailboxes that become Tuta labels.
 */
export class GmailSyncSession extends ApiMigrationSyncSession<GmailApiClient> {
	private readonly parser = new RFC822Parser()
	private labelNameById: ReadonlyMap<string, string> = new Map()

	constructor(
		migrationSyncEventListener: MigrationSyncEventListener,
		private readonly gmailApiClientFactory: GmailApiClientFactory = createGmailApiClientFromLibrary,
	) {
		super(migrationSyncEventListener)
	}

	protected async createClient(migrationCredentials: MigrationCredentials): Promise<GmailApiClient> {
		const accessToken = migrationCredentials.tokenEndpointResponse?.access_token
		if (!accessToken) {
			throw new MigrationError("No Gmail API access token available", MigrationErrorCause.AUTH_FAILED)
		}
		return this.gmailApiClientFactory(accessToken)
	}

	protected selectSyncSessionMailboxes(syncSessionMailboxes: MigrationSessionMailbox[]): MigrationSessionMailbox[] {
		return syncSessionMailboxes.filter((mailbox) => mailbox.specialUse === MigrationMailboxSpecialUse.ALL)
	}

	protected async syncMailbox(client: GmailApiClient, migrationMailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean> {
		let migrationMailsCreate: MigrationMail[] = []
		let migrationMailsBytes = 0

		// the ids are only remembered as imported once the mails were handed over, otherwise a retry would skip them
		const emitCreate = async () => {
			const migrationMails = migrationMailsCreate
			migrationMailsCreate = []
			migrationMailsBytes = 0
			if (migrationMails.length === 0) {
				return
			}
			// a stopped session must not hand over anything anymore, a new session might already import the same mails
			if (this.stopped) {
				return
			}
			await this.migrationSyncEventListener.onMultipleMails(migrationMails, MigrationSyncEventType.CREATE)
			for (const migrationMail of migrationMails) {
				mailboxState.importedSourceIdToMailIdsMap.set(assertNotNull(migrationMail.sourceId), { sourceId: migrationMail.sourceId })
			}
		}

		// The API lists the newest mails first, IMAP is fetched by ascending UID, so the oldest mails first.
		// All ids are listed up front (like IMAP lists all UIDs) so that the mails are imported in that order.
		const allMessageIds: string[] = []
		let pageToken: string | undefined
		do {
			if (this.stopped) {
				return false
			}
			const page = await client.listMessageIds(pageToken)
			allMessageIds.push(...page.ids)
			pageToken = page.nextPageToken
		} while (pageToken)
		const idsToDownload = allMessageIds.reverse().filter((id) => !mailboxState.importedSourceIdToMailIdsMap.has(id))

		for (let i = 0; i < idsToDownload.length; i += CONCURRENT_MAIL_DOWNLOADS) {
			if (this.stopped) {
				return false
			}
			// allSettled so that the mails that were downloaded are not thrown away (and downloaded again) because another one failed
			const results = await Promise.allSettled(idsToDownload.slice(i, i + CONCURRENT_MAIL_DOWNLOADS).map((id) => client.getRawMessage(id)))
			for (const result of results) {
				if (result.status === "rejected") {
					continue
				}
				const message = result.value
				// null: deleted between listing and download
				if (message == null) {
					continue
				}
				migrationMailsCreate.push(await this.gmailMessageToMigrationMail(message, migrationMailbox))
				migrationMailsBytes += message.sizeEstimate ?? 0
				if (migrationMailsCreate.length >= MAIL_DOWNLOAD_BATCH_SIZE || migrationMailsBytes >= MAIL_DOWNLOAD_BATCH_MAX_BYTES) {
					await emitCreate()
				}
			}
			const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected")
			if (failure) {
				await emitCreate()
				throw failure.reason
			}
		}

		if (isNotEmpty(migrationMailsCreate)) {
			await emitCreate()
		}

		return !this.stopped
	}

	private async gmailMessageToMigrationMail(message: GmailMessageResource, migrationMailbox: MigrationMailbox): Promise<MigrationMail> {
		const source = Buffer.from(message.raw ?? "", "base64url")
		const parsed = await this.parser.parseSource(source)

		const labelIds = message.labelIds ?? []
		const flags = new Set<string>()
		if (!labelIds.includes("UNREAD")) {
			flags.add(SEEN_FLAG)
		}
		if (labelIds.includes("STARRED")) {
			flags.add(FLAGGED_FLAG)
		}
		if (labelIds.includes("DRAFT")) {
			flags.add(DRAFT_FLAG)
		}

		// System labels are referenced by their special use, user labels by their name (= mailbox path), see labelsFromImapLabels.
		const labels = new Set<string>()
		for (const labelId of labelIds) {
			const systemLabel = SYSTEM_LABELS.find((label) => label.id === labelId)
			const name = systemLabel ? systemLabel.specialUse : this.labelNameById.get(labelId)
			if (name) labels.add(name)
		}

		return {
			sourceId: message.id,
			size: source.length,
			internalDate: message.internalDate ? new Date(Number(message.internalDate)) : undefined,
			flags,
			labels,
			envelope: parsed.parsedEnvelope,
			body: parsed.parsedBody,
			attachments: parsed.parsedAttachments,
			headers: parsed.parsedHeaders,
			belongsToMailbox: migrationMailbox,
			rfc822Source: source,
		}
	}

	protected async fetchMailboxes(client: GmailApiClient): Promise<MigrationMailbox[]> {
		const labels = await client.listLabels()
		const labelNameById = new Map<string, string>()

		const allMail: MigrationMailbox = {
			name: "All Mail",
			path: ALL_MAIL_PATH,
			pathDelimiter: "/",
			specialUse: MigrationMailboxSpecialUse.ALL,
			parentFolder: null,
		}
		const mailboxes: MigrationMailbox[] = [allMail]

		for (const systemLabel of SYSTEM_LABELS) {
			if (labels.some((label) => label.id === systemLabel.id)) {
				mailboxes.push({
					// IMAP announces "[Gmail]/Important" without a special use, so its name stays the full path there
					name: systemLabel.specialUse === MigrationMailboxSpecialUse.IMPORTANT ? systemLabel.path : systemLabel.path.split("/").pop(),
					path: systemLabel.path,
					pathDelimiter: "/",
					specialUse: systemLabel.specialUse,
					parentFolder: null,
				})
			}
		}

		const userLabels = labels.filter((label) => label.type === "user")
		for (const label of userLabels) {
			labelNameById.set(label.id, label.name)
		}
		mailboxes.push(...buildUserLabelTree(userLabels))
		this.labelNameById = labelNameById
		return mailboxes
	}

	/**
	 * Maps a caught Gmail API error to a MigrationErrorCause, reusing the buckets IMAP and Graph errors fall into.
	 * See https://developers.google.com/gmail/api/guides/handle-errors.
	 */
	protected toMigrationError(e: any): MigrationError {
		if (e instanceof MigrationError) {
			return e
		}
		const status: number | undefined = e?.status
		switch (status) {
			case 401:
				return new MigrationError(e?.message ?? "Gmail API authentication failed", MigrationErrorCause.AUTH_FAILED, "401")
			case 403:
				return isGmailRateLimitError(e) || isGmailDailyLimitError(e)
					? new MigrationError(e?.message ?? "Gmail API rate limit exceeded", MigrationErrorCause.POSTPONE, "403")
					: new MigrationError(e?.message ?? "Gmail API denied access to the requested resource", MigrationErrorCause.AUTH_FAILED, "403")
			case 400:
			case 404:
				return new MigrationError(e?.message ?? "Gmail API rejected the request", MigrationErrorCause.PERMANENT_ERROR, String(status))
			case 429:
			case 500:
			case 502:
			case 503:
			case 504:
				return new MigrationError(e?.message ?? "Gmail API is throttling or unavailable", MigrationErrorCause.POSTPONE, String(status))
			default:
				return new MigrationError(e?.message ?? "Unknown Gmail API error", MigrationErrorCause.UNKNOWN, String(status ?? ""))
		}
	}

	/** How long to postpone for if `e` is a throttling or transient server response (still failing after the retries of the client), null for any other error. */
	protected getRetryAfterMs(e: any): number | null {
		const status = e?.status
		const isTransient = status === 429 || status === 500 || status === 502 || status === 503 || status === 504
		if (!isTransient && !isGmailRateLimitError(e) && !isGmailDailyLimitError(e)) {
			return null
		}
		if (isGmailDailyLimitError(e)) {
			return GMAIL_DAILY_LIMIT_POSTPONE_TIME
		}
		const retryAfterMs = parseRetryAfterMs(e?.retryAfter) ?? GMAIL_RATE_LIMIT_DEFAULT_POSTPONE_TIME
		return Math.max(retryAfterMs, GMAIL_RATE_LIMIT_MIN_POSTPONE_TIME)
	}
}

/**
 * Gmail labels are flat, nesting is encoded as "Parent/Child" in the name. A label is nested below the longest
 * existing label whose name is a prefix of it, like ImapSyncSession.filterDisabledAndPromoteChildren does for the
 * disabled (not existing) intermediate folders the IMAP server announces.
 */
function buildUserLabelTree(userLabels: GmailLabelResource[]): MigrationMailbox[] {
	const sorted = [...userLabels].sort((a, b) => a.name.localeCompare(b.name))
	const byPath = new Map<string, MigrationMailbox>()
	const topLevel: MigrationMailbox[] = []
	for (const label of sorted) {
		const segments = label.name.split("/")
		let parent: MigrationMailbox | null = null
		let parentSegmentCount = 0
		for (let count = segments.length - 1; count > 0; count--) {
			const candidate = byPath.get(segments.slice(0, count).join("/"))
			if (candidate) {
				parent = candidate
				parentSegmentCount = count
				break
			}
		}
		const mailbox: MigrationMailbox = {
			name: segments.slice(parentSegmentCount).join("/"),
			path: label.name,
			pathDelimiter: "/",
			parentFolder: parent,
			subFolders: [],
		}
		byPath.set(label.name, mailbox)
		if (parent) {
			parent.subFolders?.push(mailbox)
		} else {
			topLevel.push(mailbox)
		}
	}
	return topLevel
}

export function createGmailSync(migrationSyncEventListener: MigrationSyncEventListener): GmailSyncSession {
	return new GmailSyncSession(migrationSyncEventListener)
}
