import { MigrationCredentials, MigrationMailboxState } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationMail } from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError.js"
import { assertNotNull, isNotEmpty } from "@tutao/utils"
import { MigrationSessionMailbox } from "../MigrationSessionMailbox.js"
import { MigrationSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ApiMigrationSyncSession } from "../ApiMigrationSyncSession.js"
import { migrationMailFromGmailMessage } from "../mailparser/MailParserUtils.js"
import { GmailApiClient, GmailLabelResource, GmailMailApi, isGmailDailyLimitError, isGmailRateLimitError, parseRetryAfterMs } from "./GmailApiClient.js"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../imapsync/DifferentialUidLoader"
import {
	BadGatewayError,
	BadRequestError,
	GatewayTimeoutError,
	InternalServerError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	ServiceUnavailableError,
	TooManyRequestsError,
} from "@tutao/http-client/error"

// The requests are paced by the GmailApiClient, a second batch in flight only hides the latency of the first one.
const CONCURRENT_MAIL_BATCHES = 2 // FIXME do not understand (yet)?

const GMAIL_DAILY_LIMIT_POSTPONE_TIME = 60 * 60 * 1000
const GMAIL_RATE_LIMIT_DEFAULT_POSTPONE_TIME = 60 * 1000
const GMAIL_RATE_LIMIT_MIN_POSTPONE_TIME = 30 * 1000

const ALL_MAIL_PATH = "[Gmail]/All Mail"

export type GmailApiClientFactory = (accessToken: string) => GmailMailApi

// we do not import the Trash and Spam label from Gmail
export const GMAIL_SYSTEM_LABELS: ReadonlyArray<{ id: string; specialUse: MigrationMailboxSpecialUse }> = [
	{ id: "INBOX", specialUse: MigrationMailboxSpecialUse.INBOX },
	{ id: "SENT", specialUse: MigrationMailboxSpecialUse.SENT },
	{ id: "DRAFT", specialUse: MigrationMailboxSpecialUse.DRAFT },
	{ id: "IMPORTANT", specialUse: MigrationMailboxSpecialUse.IMPORTANT },
	{ id: "STARRED", specialUse: MigrationMailboxSpecialUse.FLAGGED },
]

/**
 * Sync session to retrieve mails through the Gmail API.
 * Like ImapSyncSession for Gmail only "All Mail" is synced, the other labels are mailboxes that become Tuta labels.
 */
export class GmailSyncSession extends ApiMigrationSyncSession<GmailMailApi> {
	private labelNameById: ReadonlyMap<string, string> = new Map()

	constructor(
		migrationSyncEventListener: MigrationSyncEventListener,
		private readonly gmailApiClientFactory: GmailApiClientFactory = (accessToken) => new GmailApiClient(accessToken),
	) {
		super(migrationSyncEventListener)
	}

	protected async createClient(migrationCredentials: MigrationCredentials): Promise<GmailMailApi> {
		const accessToken = migrationCredentials.tokenEndpointResponse?.access_token
		if (!accessToken) {
			throw new MigrationError("No Gmail API access token available", MigrationErrorCause.AUTH_FAILED)
		}
		return this.gmailApiClientFactory(accessToken)
	}

	protected selectSyncSessionMailboxes(syncSessionMailboxes: MigrationSessionMailbox[]): MigrationSessionMailbox[] {
		return syncSessionMailboxes.filter((mailbox) => mailbox.specialUse === MigrationMailboxSpecialUse.ALL)
	}

	protected async syncMailbox(client: GmailMailApi, migrationMailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean> {
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

		for (let i = 0; i < idsToDownload.length; ) {
			if (this.stopped) {
				return false
			}
			const batches: string[][] = []
			while (batches.length < CONCURRENT_MAIL_BATCHES && i < idsToDownload.length) {
				const batchSize = client.messageBatchSize
				batches.push(idsToDownload.slice(i, i + batchSize))
				i += batchSize
			}
			// allSettled so that the mails that were downloaded are not thrown away (and downloaded again) because a batch failed
			const results = await Promise.allSettled(
				batches.map((ids) => {
					const idsNotAlreadyImported = ids.filter((id) => !mailboxState.importedSourceIdToMailIdsMap.has(id))
					return client.getRawMessages(idsNotAlreadyImported)
				}),
			)
			for (const result of results) {
				if (result.status === "rejected") {
					continue
				}
				for (const message of result.value) {
					// null: deleted between listing and download
					if (message == null) {
						continue
					}
					migrationMailsCreate.push(await migrationMailFromGmailMessage(message, migrationMailbox, this.labelNameById))
					migrationMailsBytes += message.sizeEstimate ?? 0
					if (migrationMailsCreate.length >= MAIL_DOWNLOAD_BATCH_SIZE) {
						await emitCreate()
					}
				}
			}
			const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected")
			if (failure) {
				await emitCreate()
				throw this.toMigrationError(failure)
			}
		}

		if (isNotEmpty(migrationMailsCreate)) {
			await emitCreate()
		}

		return !this.stopped
	}

	protected async fetchMailboxes(client: GmailMailApi): Promise<MigrationMailbox[]> {
		const labels = await client.listLabels()
		const labelNameById = new Map<string, string>()

		const allMail: MigrationMailbox = {
			sourceId: ALL_MAIL_PATH,
			specialUse: MigrationMailboxSpecialUse.ALL,
		}
		const mailboxes: MigrationMailbox[] = [allMail]

		for (const systemLabel of GMAIL_SYSTEM_LABELS) {
			if (labels.some((label) => label.id === systemLabel.id)) {
				mailboxes.push({
					sourceId: systemLabel.id,
					specialUse: systemLabel.specialUse,
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
			case NotAuthenticatedError.CODE:
				return new MigrationError(e?.message ?? "Gmail API authentication failed", MigrationErrorCause.AUTH_FAILED, "401")
			case NotAuthorizedError.CODE:
				return isGmailRateLimitError(e) || isGmailDailyLimitError(e)
					? new MigrationError(e?.message ?? "Gmail API rate limit exceeded", MigrationErrorCause.POSTPONE, "403")
					: new MigrationError(e?.message ?? "Gmail API denied access to the requested resource", MigrationErrorCause.AUTH_FAILED, "403")
			case BadRequestError.CODE:
			case NotFoundError.CODE:
				return new MigrationError(e?.message ?? "Gmail API rejected the request", MigrationErrorCause.PERMANENT_ERROR, String(status))
			case TooManyRequestsError.CODE:
			case InternalServerError.CODE:
			case BadGatewayError.CODE:
			case ServiceUnavailableError.CODE:
			case GatewayTimeoutError.CODE:
				return new MigrationError(e?.message ?? "Gmail API is throttling or unavailable", MigrationErrorCause.POSTPONE, String(status))
			default:
				return new MigrationError(e?.message ?? "Unknown Gmail API error", MigrationErrorCause.UNKNOWN, String(status ?? ""))
		}
	}

	/** How long to postpone for if `e` is a throttling or transient server response (still failing after the retries of the client), null for any other error. */
	protected getPostponeTimeAfterError(e: any): number | null {
		const status = e?.status
		const isTransient =
			status === TooManyRequestsError.CODE ||
			status === InternalServerError.CODE ||
			status === BadGatewayError.CODE ||
			status === ServiceUnavailableError.CODE ||
			status === GatewayTimeoutError.CODE
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
			sourceId: label.name,
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
