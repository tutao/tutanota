import { MigrationCredentials, MigrationMailboxState } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError.js"
import { isNotEmpty, promiseMap } from "@tutao/utils"
import { MigrationSessionMailbox } from "../MigrationSessionMailbox.js"
import { MigrationSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ApiMigrationSyncSession } from "../ApiMigrationSyncSession.js"
import { migrationMailFromGmailMessage } from "../mailparser/MailParserUtils.js"
import { GmailApiClient, GmailApiLabelResource, GmailMailApi } from "./GmailApiClient.js"
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
import { isGmailDailyLimitError, isGmailRateLimitError } from "../ApiClientRequestUtils"
import { SyncSessionState } from "../MigrationSyncSession"

export type GmailApiClientFactory = (accessToken: string) => GmailMailApi

// we do not import the Trash and Spam label from Gmail
export const GMAIL_SYSTEM_LABELS: ReadonlyArray<{ id: string; specialUse: MigrationMailboxSpecialUse }> = [
	{ id: "INBOX", specialUse: MigrationMailboxSpecialUse.INBOX },
	{ id: "SENT", specialUse: MigrationMailboxSpecialUse.SENT },
	{ id: "DRAFT", specialUse: MigrationMailboxSpecialUse.DRAFT },
	{ id: "IMPORTANT", specialUse: MigrationMailboxSpecialUse.IMPORTANT },
	{ id: "STARRED", specialUse: MigrationMailboxSpecialUse.FLAGGED },
]

export class GmailSyncSession extends ApiMigrationSyncSession<GmailMailApi> {
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
		let pageToken: string | undefined
		do {
			// state can be updated anytime from outside
			const state = this.state
			if (state === SyncSessionState.STOPPED) {
				return false
			}

			const page = await client.listMessageIds(pageToken)
			pageToken = page.nextPageToken
			const idsToDownload = page.ids.filter((id) => !mailboxState.importedSourceIdToMailIdsMap.has(id))

			try {
				const messages = await client.getMessages(idsToDownload)
				const migrationMails = await promiseMap(messages, async (message) => await migrationMailFromGmailMessage(message, migrationMailbox), {
					concurrency: 10,
				})
				if (isNotEmpty(migrationMails) && this.state !== SyncSessionState.STOPPED) {
					await this.migrationSyncEventListener.onMultipleMails(migrationMails, MigrationSyncEventType.CREATE)
				}
			} catch (e) {
				throw this.toMigrationError(e)
			}
		} while (pageToken)

		return true
	}

	protected async fetchMailboxes(client: GmailMailApi): Promise<MigrationMailbox[]> {
		const labels = await client.listLabels()
		// all mail label does not require a name, we assign the rootImportMailSetName coming from the user input to it in MailboxMigrationFacade
		let mailboxes: MigrationMailbox[] = [{ sourceId: "[Gmail]/All Mail", specialUse: MigrationMailboxSpecialUse.ALL }]
		for (const systemLabel of GMAIL_SYSTEM_LABELS) {
			const systemLabelFromResponse = labels.find((label) => label.id === systemLabel.id)
			if (systemLabelFromResponse) {
				mailboxes.push({
					name: systemLabelFromResponse.name,
					sourceId: systemLabel.id,
					specialUse: systemLabel.specialUse,
				})
			}
		}

		const userLabels = labels.filter((label) => label.type === "user")
		mailboxes = mailboxes.concat(this.buildUserLabelTree(userLabels))
		return mailboxes
	}

	/**
	 * Gmail labels are flat, nesting is encoded as "Parent/Child" in the name. A label is nested below the longest
	 * existing label whose name is a prefix of it, like ImapSyncSession.filterDisabledAndPromoteChildren does for the
	 * disabled (not existing) intermediate folders the IMAP server announces.
	 */
	private buildUserLabelTree(userLabels: GmailApiLabelResource[]): MigrationMailbox[] {
		const sorted = userLabels.sort((a, b) => a.name.localeCompare(b.name))
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
				name: segments.slice(parentSegmentCount).join("/"), // name is not the full path name for us
				sourceId: label.id,
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
}

export function createGmailSyncSession(migrationSyncEventListener: MigrationSyncEventListener): GmailSyncSession {
	return new GmailSyncSession(migrationSyncEventListener)
}
