import { MigrationCredentials, MigrationMailboxState } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import {
	MigrationMail,
	MigrationMailAddress,
	MigrationMailAttachment,
	MigrationMailAttachmentDisposition,
	MigrationMailBody,
	MigrationMailEnvelope,
} from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError.js"
import { MigrationSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import type { AuthenticationProvider, Client as GraphClient } from "@microsoft/microsoft-graph-client"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ApiMigrationSyncSession } from "../ApiMigrationSyncSession.js"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../imapsync/DifferentialUidLoader.js"
import { assertNotNull, isNotEmpty } from "@tutao/utils"

const SEEN_FLAG = "\\Seen"
const IMMUTABLE_ID_HEADER = 'IdType="ImmutableId"'

// Microsoft Graph throttles with 429 (and occasionally 503) and, per
// https://learn.microsoft.com/en-us/graph/throttling
const M365_RATE_LIMIT_DEFAULT_POSTPONE_TIME = 60 * 1000 // 60 seconds
const M365_RATE_LIMIT_MIN_POSTPONE_TIME = 30 * 1000 // 30 seconds

type GraphMailFolderResource = {
	id: string
	displayName: string
	parentFolderId?: string
	childFolderCount?: number
}

type GraphEmailAddress = { name?: string; address?: string }
type GraphRecipient = { emailAddress?: GraphEmailAddress }

type GraphAttachmentResource = {
	id: string
	name?: string
	contentType?: string
	contentBytes?: string
	isInline?: boolean
	size?: number
	contentId?: string
}

type GraphMessageResource = {
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

type GraphPagedResponse<T> = {
	value: T[]
	"@odata.nextLink"?: string
	"@odata.deltaLink"?: string
}

//https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0
const WELL_KNOWN_FOLDERS: ReadonlyArray<{ name: string; specialUse: MigrationMailboxSpecialUse }> = [
	{ name: "inbox", specialUse: MigrationMailboxSpecialUse.INBOX },
	{ name: "sentitems", specialUse: MigrationMailboxSpecialUse.SENT },
	{ name: "drafts", specialUse: MigrationMailboxSpecialUse.DRAFTS },
	{ name: "deleteditems", specialUse: MigrationMailboxSpecialUse.TRASH },
	{ name: "junkemail", specialUse: MigrationMailboxSpecialUse.JUNK },
	{ name: "archive", specialUse: MigrationMailboxSpecialUse.ARCHIVE },
]

class StaticAccessTokenAuthProvider implements AuthenticationProvider {
	constructor(private readonly accessToken: string) {}

	async getAccessToken(): Promise<string> {
		return this.accessToken
	}
}

export type GraphClientFactory = (accessToken: string) => Promise<GraphClient>

/**
 * Sync session to connect and retrieve mails from Graph API.
 */
export class M365SyncSession extends ApiMigrationSyncSession<GraphClient> {
	private readonly folderIdByPath = new Map<string, string>()

	constructor(
		migrationSyncEventListener: MigrationSyncEventListener,
		private readonly graphClientFactory: GraphClientFactory = async (accessToken) => {
			const { Client } = await import("./microsoft-graph-client-custom")
			return Client.initWithMiddleware({ authProvider: new StaticAccessTokenAuthProvider(accessToken) })
		},
	) {
		super(migrationSyncEventListener)
	}

	protected async createClient(migrationCredentials: MigrationCredentials): Promise<GraphClient> {
		const accessToken = migrationCredentials.tokenEndpointResponse?.access_token
		if (!accessToken) {
			throw new MigrationError("No Microsoft Graph access token available", MigrationErrorCause.AUTH_FAILED)
		}
		return this.graphClientFactory(accessToken)
	}

	protected async fetchMailboxes(client: GraphClient): Promise<MigrationMailbox[]> {
		return this.discoverFolders(client)
	}

	protected async syncMailbox(client: GraphClient, migrationMailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean> {
		const folderId = this.folderIdByPath.get(migrationMailbox.path)
		if (!folderId) {
			return false
		}

		let nextUrl: string | null = `/me/mailFolders/${encodeURIComponent(folderId)}/messages/delta?$expand=attachments`
		let migrationMailsCreate: MigrationMail[] = []
		let migrationMailsDelete: MigrationMail[] = []

		// the ids are only remembered as imported once the mails were handed over, otherwise a retry would skip them
		const emitCreate = async () => {
			const migrationMails = migrationMailsCreate
			migrationMailsCreate = []
			// a stopped session must not hand over anything anymore, a new session might already import the same mails
			if (this.stopped) {
				return
			}
			await this.migrationSyncEventListener.onMultipleMails(migrationMails, MigrationSyncEventType.CREATE)
			for (const migrationMail of migrationMails) {
				mailboxState.importedSourceIdToMailIdsMap.set(assertNotNull(migrationMail.sourceId), { sourceId: migrationMail.sourceId })
			}
		}

		while (nextUrl) {
			const response: GraphPagedResponse<GraphMessageResource> = await client.api(nextUrl).header("Prefer", IMMUTABLE_ID_HEADER).get()

			for (const message of response.value ?? []) {
				if (this.stopped) {
					return false
				}
				if (message["@removed"]) {
					if (mailboxState.importedSourceIdToMailIdsMap.has(message.id)) {
						migrationMailsDelete.push({ sourceId: message.id, belongsToMailbox: migrationMailbox })
						mailboxState.importedSourceIdToMailIdsMap.delete(message.id)
					}
					continue
				}

				if (mailboxState.importedSourceIdToMailIdsMap.has(message.id)) {
					continue
				}
				migrationMailsCreate.push(this.graphMessageToMigrationMail(message, migrationMailbox))
				if (migrationMailsCreate.length >= MAIL_DOWNLOAD_BATCH_SIZE) {
					await emitCreate()
				}
			}

			if (isNotEmpty(migrationMailsDelete)) {
				await this.migrationSyncEventListener.onMultipleMails(migrationMailsDelete, MigrationSyncEventType.DELETE)
				migrationMailsDelete = []
			}

			// The @odata.deltaLink is not persisted, there is no field for it in the folder sync state.
			// Every round walks the whole folder again and skips the mails in importedSourceIds.
			nextUrl = response["@odata.nextLink"] ?? null
		}

		if (isNotEmpty(migrationMailsCreate)) {
			await emitCreate()
		}

		return !this.stopped
	}

	private graphMessageToMigrationMail(message: GraphMessageResource, mailbox: MigrationMailbox): MigrationMail {
		const envelope: MigrationMailEnvelope = {
			date: message.sentDateTime ? new Date(message.sentDateTime) : undefined,
			subject: message.subject,
			messageId: message.internetMessageId,
			from: message.from ? [graphRecipientToMigrationMailAddress(message.from)] : undefined,
			sender: message.sender ? [graphRecipientToMigrationMailAddress(message.sender)] : undefined,
			to: message.toRecipients?.map(graphRecipientToMigrationMailAddress),
			cc: message.ccRecipients?.map(graphRecipientToMigrationMailAddress),
			bcc: message.bccRecipients?.map(graphRecipientToMigrationMailAddress),
			replyTo: message.replyTo?.map(graphRecipientToMigrationMailAddress),
		}

		const isHtml = message.body?.contentType?.toLowerCase() === "html"
		const body: MigrationMailBody = {
			html: isHtml ? (message.body?.content ?? "") : "",
			plaintext: isHtml ? "" : (message.body?.content ?? ""),
		}

		const flags = new Set<string>()
		if (message.isRead) {
			flags.add(SEEN_FLAG)
		}

		// Reference (OneDrive-shared) attachments have no contentBytes and are skipped - a known gap.
		const attachments: MigrationMailAttachment[] = (message.attachments ?? [])
			.filter((attachment) => attachment.contentBytes !== undefined)
			.map((attachment) => ({
				size: attachment.size ?? 0,
				mimeType: attachment.contentType ?? "application/octet-stream",
				content: Buffer.from(attachment.contentBytes!, "base64"),
				disposition: attachment.isInline ? MigrationMailAttachmentDisposition.Inline : MigrationMailAttachmentDisposition.Attachment,
				filename: attachment.name,
				cid: attachment.contentId,
			}))

		return {
			sourceId: message.id,
			internalDate: message.receivedDateTime ? new Date(message.receivedDateTime) : undefined,
			flags,
			envelope,
			body,
			attachments,
			headers: reconstructHeaders(message.internetMessageHeaders),
			belongsToMailbox: mailbox,
		}
	}

	private async discoverFolders(client: GraphClient): Promise<MigrationMailbox[]> {
		const folderIdToSpecialUseMap = await this.resolveWellKnownFolderIds(client)
		const topLevel = await this.fetchAllPages<GraphMailFolderResource>(client, "/me/mailFolders", { includeHiddenFolders: "true" })
		const allFolders: GraphMailFolderResource[] = []
		for (const folder of topLevel) {
			allFolders.push(folder, ...(await this.fetchChildFoldersRecursive(client, folder)))
		}
		this.folderIdByPath.clear()
		return this.buildMailboxTree(allFolders, folderIdToSpecialUseMap)
	}

	private async fetchChildFoldersRecursive(client: GraphClient, folder: GraphMailFolderResource): Promise<GraphMailFolderResource[]> {
		if (!folder.childFolderCount) {
			return []
		}
		let children: GraphMailFolderResource[]
		try {
			children = await this.fetchAllPages<GraphMailFolderResource>(client, `/me/mailFolders/${encodeURIComponent(folder.id)}/childFolders`, {
				includeHiddenFolders: "true",
			})
		} catch (e) {
			//Handle throttling.
			if (this.getRetryAfterMs(e) !== null) {
				throw e
			}

			const migrationError = this.toMigrationError(e)
			await this.migrationSyncEventListener.onError(migrationError)
			//Auth Failing must cause syncing to stop and prompt new credentials.
			if (migrationError.data.cause === MigrationErrorCause.AUTH_FAILED) {
				throw migrationError
			}
			return []
		}
		const result: GraphMailFolderResource[] = []
		for (const child of children) {
			result.push(child, ...(await this.fetchChildFoldersRecursive(client, child)))
		}
		return result
	}

	private async resolveWellKnownFolderIds(client: GraphClient): Promise<Map<string, MigrationMailboxSpecialUse>> {
		const result = new Map<string, MigrationMailboxSpecialUse>()
		for (const { name, specialUse } of WELL_KNOWN_FOLDERS) {
			try {
				const folder = await client.api(`/me/mailFolders/${name}`).header("Prefer", IMMUTABLE_ID_HEADER).select("id").get()
				result.set(folder.id, specialUse)
			} catch {
				// Not every well-known folder exists for every mailbox (e.g. Archive) - skip it.
			}
		}
		return result
	}

	private buildMailboxTree(folders: GraphMailFolderResource[], specialUseByFolderId: ReadonlyMap<string, MigrationMailboxSpecialUse>): MigrationMailbox[] {
		const byId = new Map(folders.map((folder) => [folder.id, folder]))
		const childrenByParent = new Map<string, GraphMailFolderResource[]>()
		for (const folder of folders) {
			if (folder.parentFolderId && byId.has(folder.parentFolderId)) {
				const siblings = childrenByParent.get(folder.parentFolderId) ?? []
				siblings.push(folder)
				childrenByParent.set(folder.parentFolderId, siblings)
			}
		}
		const topLevel = folders.filter((folder) => !folder.parentFolderId || !byId.has(folder.parentFolderId))

		return topLevel.map((folder) => buildMailboxNode(folder, null, null, childrenByParent, specialUseByFolderId, this.folderIdByPath))
	}

	private async fetchAllPages<T>(client: GraphClient, path: string, queryParams: Record<string, string>): Promise<T[]> {
		const results: T[] = []
		let request = client.api(path).header("Prefer", IMMUTABLE_ID_HEADER)
		for (const [key, value] of Object.entries(queryParams)) {
			request = request.query({ [key]: value })
		}
		let response: GraphPagedResponse<T> = await request.get()
		while (true) {
			results.push(...(response.value ?? []))
			const nextLink = response["@odata.nextLink"]
			if (!nextLink) {
				break
			}
			response = await client.api(nextLink).header("Prefer", IMMUTABLE_ID_HEADER).get()
		}
		return results
	}

	/**
	 * Maps a caught Microsoft Graph error to an ImapErrorCause, reusing the same buckets IMAP errors fall into
	 * (see fromImapFlowError in ImapError.ts) since callers (MigrationErrorHandler, MailboxMigrationController) already
	 * branch on cause rather than on provider-specific codes:
	 * - 401/403: no/insufficient access - same AUTH_FAILED bucket IMAP uses for AUTHENTICATIONFAILED as well as
	 *   its own permission codes (AUTHORIZATIONFAILED/NOPERM/CONTACTADMIN), which triggers the existing
	 *   refresh-token-or-reauth flow.
	 * - 400/404: the request or the resource it targets (a folder/message deleted mid-sync, a malformed query)
	 *   will not succeed on retry - IMAP's equivalent (UIDNOTSTICKY) also maps to PERMANENT_ERROR.
	 * - 429/503/504: throttling or a transient gateway failure - handled by getRetryAfterMs/onPostpone instead of
	 *   being classified here, but still labelled POSTPONE for the cases that reach this method directly (e.g.
	 *   the getImapMailboxesFromServer wizard call, which has no sync round to postpone).
	 * Anything else (including network-level failures, which this SDK collapses to a bare Error with no status -
	 * see GraphErrorHandler.constructError) falls back to UNKNOWN, same as an unrecognized IMAP error code.
	 */
	protected toMigrationError(e: any): MigrationError {
		if (e instanceof MigrationError) {
			return e
		}
		const status = e?.statusCode ?? e?.status
		switch (status) {
			case 401:
				return new MigrationError(e?.message ?? "Microsoft Graph authentication failed", MigrationErrorCause.AUTH_FAILED, "401")
			case 403:
				return new MigrationError(e?.message ?? "Microsoft Graph denied access to the requested resource", MigrationErrorCause.AUTH_FAILED, "403")
			case 400:
			case 404:
				return new MigrationError(e?.message ?? "Microsoft Graph rejected the request", MigrationErrorCause.PERMANENT_ERROR, String(status))
			case 429:
			case 503:
			case 504:
				return new MigrationError(e?.message ?? "Microsoft Graph throttled the request", MigrationErrorCause.POSTPONE, String(status))
			default:
				return new MigrationError(e?.message ?? "Unknown Microsoft Graph error", MigrationErrorCause.UNKNOWN, String(status ?? ""))
		}
	}

	/**
	 * Returns how long to postpone the sync for if `e` is a Microsoft Graph throttling response (429, 503, or 504 -
	 * the same set the Graph SDK's own default RetryHandler treats as transient), honoring the Retry-After header
	 * (seconds) when present since it is authoritative - see https://learn.microsoft.com/en-us/graph/throttling.
	 * Returns null for any other error.
	 */
	protected getRetryAfterMs(e: any): number | null {
		const status = e?.statusCode ?? e?.status
		if (status !== 429 && status !== 503 && status !== 504) {
			return null
		}
		const retryAfterHeader = e?.headers?.get?.("Retry-After")
		const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN
		const retryAfterMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : M365_RATE_LIMIT_DEFAULT_POSTPONE_TIME
		return Math.max(retryAfterMs, M365_RATE_LIMIT_MIN_POSTPONE_TIME)
	}
}

/** Builds one mailbox tree node and recurses into its children, registering each path's Graph folder id along the way. */
function buildMailboxNode(
	folder: GraphMailFolderResource,
	parentPath: string | null,
	parentMailbox: MigrationMailbox | null,
	childrenByParent: ReadonlyMap<string, GraphMailFolderResource[]>,
	specialUseByFolderId: ReadonlyMap<string, MigrationMailboxSpecialUse>,
	folderIdByPath: Map<string, string>,
): MigrationMailbox {
	const path = parentPath ? `${parentPath}/${folder.displayName}` : folder.displayName
	const mailbox: MigrationMailbox = {
		name: folder.displayName,
		path,
		pathDelimiter: "/",
		specialUse: specialUseByFolderId.get(folder.id),
		parentFolder: parentMailbox,
	}
	folderIdByPath.set(path, folder.id)
	mailbox.subFolders = (childrenByParent.get(folder.id) ?? []).map((child) =>
		buildMailboxNode(child, path, mailbox, childrenByParent, specialUseByFolderId, folderIdByPath),
	)
	return mailbox
}

function graphRecipientToMigrationMailAddress(recipient: GraphRecipient): MigrationMailAddress {
	return { name: recipient.emailAddress?.name, address: recipient.emailAddress?.address }
}

function reconstructHeaders(headers?: { name: string; value: string }[]): string | undefined {
	if (!headers || headers.length === 0) {
		return undefined
	}
	return headers.map((header) => `${header.name}: ${header.value}`).join("\r\n")
}
export function createM365Sync(migrationSyncEventListener: MigrationSyncEventListener): M365SyncSession {
	return new M365SyncSession(migrationSyncEventListener)
}
