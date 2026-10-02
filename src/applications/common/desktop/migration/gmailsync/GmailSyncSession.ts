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
const MAX_REQUEST_ATTEMPTS = 6
const REQUEST_RETRY_BASE_DELAY = 1000
const MAX_REQUEST_RETRY_DELAY = 60 * 1000
const GMAIL_RATE_LIMIT_DEFAULT_POSTPONE_TIME = 60 * 1000
const GMAIL_RATE_LIMIT_MIN_POSTPONE_TIME = 30 * 1000
const RATE_LIMIT_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded", "dailyLimitExceeded"])

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
	return e?.status === 403 && RATE_LIMIT_REASONS.has(e?.reason)
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
		return e.status === 429 || e.status === 500 || e.status === 502 || e.status === 503 || e.status === 504 || isGmailRateLimitError(e)
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

/**
 * Creates the client on top of the Gmail API client library. Requests are retried with exponential backoff (honouring Retry-After),
 * as recommended by Google, because postponing the whole sync for a single throttled request would stall large imports.
 */
export function createGmailApiClient(
	gmailApi: GmailLibraryApi,
	sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): GmailApiClient {
	async function withRetry<T>(request: () => Promise<T>): Promise<T> {
		for (let attempt = 1; ; attempt++) {
			try {
				return await request()
			} catch (e) {
				const error = toGmailApiError(e)
				if (attempt >= MAX_REQUEST_ATTEMPTS || !isRetryableGmailError(error)) {
					throw error
				}
				const retryAfterMs = parseRetryAfterMs((error as GmailApiError).retryAfter)
				const backoffMs = REQUEST_RETRY_BASE_DELAY * 2 ** (attempt - 1) + Math.random() * 250
				await sleep(Math.min(retryAfterMs ?? backoffMs, MAX_REQUEST_RETRY_DELAY))
			}
		}
	}

	return {
		async listLabels() {
			const response = await withRetry(() => gmailApi.users.labels.list({ userId: "me" }))
			return (response.data.labels ?? []).map((label) => ({ id: label.id!, name: label.name!, type: label.type as GmailLabelResource["type"] }))
		},

		async listMessageIds(pageToken?: string) {
			// without labelIds and with includeSpamTrash=false this are the mails of IMAP's "[Gmail]/All Mail", which does not show chats either
			const response = await withRetry(() =>
				gmailApi.users.messages.list({ userId: "me", maxResults: LIST_PAGE_SIZE, includeSpamTrash: false, q: "-in:chats", pageToken }),
			)
			return { ids: (response.data.messages ?? []).map((message) => message.id!), nextPageToken: response.data.nextPageToken ?? undefined }
		},

		async getRawMessage(id: string) {
			try {
				const response = await withRetry(() => gmailApi.users.messages.get({ userId: "me", id, format: "raw" }))
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
			const messages = await Promise.all(idsToDownload.slice(i, i + CONCURRENT_MAIL_DOWNLOADS).map((id) => client.getRawMessage(id)))
			for (const message of messages) {
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
				return isGmailRateLimitError(e)
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
		if (!isTransient && !isGmailRateLimitError(e)) {
			return null
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
