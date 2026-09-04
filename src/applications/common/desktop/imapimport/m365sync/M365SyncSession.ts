import { ImapCredentials, ImapMailboxState, ImapSyncContext } from "../../../api/common/utils/imapImportUtils/ImapSyncContext.js"
import { ImapMailbox, ImapMailboxSpecialUse } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import {
	ImapMail,
	ImapMailAddress,
	ImapMailAttachment,
	ImapMailAttachmentDisposition,
	ImapMailBody,
	ImapMailEnvelope,
} from "../../../api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError, ImapErrorCause } from "../../../api/common/error/ImapError.js"
import { ImapFolderSyncStatus, ImapSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import type { AuthenticationProvider, Client as GraphClient } from "@microsoft/microsoft-graph-client"
import type { ImapSyncEventListener } from "../imapsync/ImapSyncEventListener.js"

const MAIL_DOWNLOAD_BATCH_SIZE = 125
const IMAP_FLAG_SEEN = "\\Seen"
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
const WELL_KNOWN_FOLDERS: ReadonlyArray<{ name: string; specialUse: ImapMailboxSpecialUse }> = [
	{ name: "inbox", specialUse: ImapMailboxSpecialUse.INBOX },
	{ name: "sentitems", specialUse: ImapMailboxSpecialUse.SENT },
	{ name: "drafts", specialUse: ImapMailboxSpecialUse.DRAFTS },
	{ name: "deleteditems", specialUse: ImapMailboxSpecialUse.TRASH },
	{ name: "junkemail", specialUse: ImapMailboxSpecialUse.JUNK },
	{ name: "archive", specialUse: ImapMailboxSpecialUse.ARCHIVE },
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
export class M365SyncSession {
	private stopped = false
	private readonly mailboxStateByPath = new Map<string, ImapMailboxState>()
	private readonly folderIdByPath = new Map<string, string>()

	constructor(
		private readonly listener: ImapSyncEventListener,
		private readonly graphClientFactory: GraphClientFactory = async (accessToken) => {
			const { Client } = await import("./microsoft-graph-client-custom")
			return Client.initWithMiddleware({ authProvider: new StaticAccessTokenAuthProvider(accessToken) })
		},
	) {}

	stop(): void {
		this.stopped = true
	}

	async startSync(imapSyncContext: ImapSyncContext): Promise<void> {
		for (const mailboxState of imapSyncContext.imapMailboxStates) {
			this.mailboxStateByPath.set(mailboxState.path, mailboxState)
		}

		const client = await this.createGraphClient(imapSyncContext.imapCredentials)

		let mailboxes: ImapMailbox[]
		try {
			mailboxes = await this.discoverFolders(client)
		} catch (e) {
			const retryAfterMs = this.getRetryAfterMs(e)
			if (retryAfterMs !== null) {
				await this.listener.onPostpone(Date.now() + retryAfterMs)
				return
			}
			throw this.toImapError(e)
		}

		const flatMailboxes = collectMailboxesDepthFirst(mailboxes)
		for (const mailbox of flatMailboxes) {
			await this.listener.onMailbox(mailbox, ImapSyncEventType.CREATE)
		}

		// Download mail per folder without awaiting it here: mirrors ImapSyncSession.runSyncSession, which fires
		// off its per-mailbox chain (startNextMailboxSync) without awaiting it, so that the caller (ultimately
		// the import wizard's progress dialog) resolves once folders are discovered rather than once the whole
		// account has synced. Progress/completion is reported asynchronously through the listener.
		this.syncFolders(client, flatMailboxes).catch((e) => {
			console.error("M365 sync round failed", e)
		})
	}

	private async syncFolders(client: GraphClient, flatMailboxes: ImapMailbox[]): Promise<void> {
		for (const mailbox of flatMailboxes) {
			if (this.stopped) {
				// stop() can be triggered mid-loop by ImapImporter.onMultipleMails/onPostpone/pauseImport calling
				// back into stopSync (e.g. a SuspensionError from Tuta's own import service, not just a Graph
				// throttle) - see the guard below, which is what actually prevents this from being misreported as
				// a completed round.
				console.log(`M365 sync stopped mid-round after folder "${mailbox.path}" - remaining folders will resume next round.`)
				break
			}
			// mailboxStateByPath is a snapshot taken before this round's discovery, so a folder discovered for the
			// first time this round is never in it - even though the onMailbox loop above already created its
			// ImapFolderSyncState. Build a fresh local state and sync it immediately instead of deferring to the
			// next round (which silently dropped every custom folder's mail on its first sync round), mirroring
			// ImapSyncSession.traverseImapMailboxes: noSync is inherited from an already-known parent - safe
			// because collectMailboxesDepthFirst visits parents before children, so the parent's state (existing
			// or just constructed here) is always present by the time a child is reached.
			let mailboxState = this.mailboxStateByPath.get(mailbox.path)
			if (!mailboxState) {
				const parentMailboxState = mailbox.parentFolder ? this.mailboxStateByPath.get(mailbox.parentFolder.path) : undefined
				mailboxState = {
					path: mailbox.path,
					importedUidToMailIdsMap: new Map(),
					importedSourceIds: new Set(),
					noSync: parentMailboxState?.noSync ?? false,
				}
				this.mailboxStateByPath.set(mailbox.path, mailboxState)
			}
			if (mailboxState.noSync) {
				continue
			}
			try {
				await this.syncFolder(client, mailbox, mailboxState)
			} catch (e) {
				// Throttling applies tenant/app-wide, not per folder - continuing to the next folder would just
				// trip the limit again, so the whole round is postponed instead of being logged and skipped.
				const retryAfterMs = this.getRetryAfterMs(e)
				if (retryAfterMs !== null) {
					await this.listener.onPostpone(Date.now() + retryAfterMs)
					return
				}
				const imapError = this.toImapError(e)
				await this.listener.onError(imapError)
				if (imapError.data.cause === ImapErrorCause.AUTH_FAILED) {
					throw imapError
				}
			}
		}

		if (this.stopped) {
			// Do not report a round as finished when it was stopped part-way through (e.g. onMultipleMails
			// postponing/stopping the account after a Tuta-side SuspensionError on some folder's import batch,
			// or a manual pause/delete) - onFinish marks every folder FINISHED server-side
			// (updateAccountSyncStateAndAllFolderSyncStates), which would wrongly cover folders never even
			// reached this round. Mirrors ImapSyncSession, where the STOPPED state is checked before the
			// equivalent onAllMailboxesFinish() call is ever reached.
			console.log("M365 sync round ended early (stopped) - skipping onFinish so the remaining folders are retried next round.")
			return
		}

		console.log("Finished M365 Sync.")
		await this.listener.onFinish()
	}

	/**
	 * Fetches the mailbox's folders via Microsoft Graph, mirroring ImapSyncSession.getImapMailboxesFromServer's
	 * role for IMAP - used for the import wizard's folder-mapping step, independent of an active sync.
	 */
	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapMailbox[]> {
		const client = await this.createGraphClient(imapCredentials)
		try {
			return await this.discoverFolders(client)
		} catch (e) {
			throw this.toImapError(e)
		}
	}

	private async createGraphClient(imapCredentials: ImapCredentials): Promise<GraphClient> {
		const accessToken = imapCredentials.tokenEndpointResponse?.access_token
		if (!accessToken) {
			throw new ImapError("No Microsoft Graph access token available", ImapErrorCause.AUTH_FAILED)
		}
		return this.graphClientFactory(accessToken)
	}

	private async syncFolder(client: GraphClient, mailbox: ImapMailbox, mailboxState: ImapMailboxState): Promise<void> {
		const folderId = this.folderIdByPath.get(mailbox.path)
		if (!folderId) {
			return
		}

		await this.listener.onMailboxStatus({ path: mailbox.path, uidNext: 0, uidValidity: 1n, syncStatus: ImapFolderSyncStatus.RUNNING })

		let nextUrl: string | null = `/me/mailFolders/${encodeURIComponent(folderId)}/messages/delta?$expand=attachments`
		let createBatch: ImapMail[] = []
		let deleteBatch: ImapMail[] = []
		let isFinished = false

		while (nextUrl) {
			const response: GraphPagedResponse<GraphMessageResource> = await client.api(nextUrl).header("Prefer", IMMUTABLE_ID_HEADER).get()

			for (const message of response.value ?? []) {
				if (this.stopped) {
					break
				}
				if (message["@removed"]) {
					if (mailboxState.importedSourceIds.has(message.id)) {
						deleteBatch.push({ sourceId: message.id, belongsToMailbox: mailbox })
						mailboxState.importedSourceIds.delete(message.id)
					}
					continue
				}

				if (mailboxState.importedSourceIds.has(message.id)) {
					// already imported in a previous round (or earlier in this one) - idempotent, skip
					continue
				}
				mailboxState.importedSourceIds.add(message.id)
				createBatch.push(this.graphMessageToImapMail(message, mailbox))
				if (createBatch.length >= MAIL_DOWNLOAD_BATCH_SIZE) {
					await this.listener.onMultipleMails(createBatch, ImapSyncEventType.CREATE)
					createBatch = []
				}
			}

			if (deleteBatch.length > 0) {
				await this.listener.onMultipleMails(deleteBatch, ImapSyncEventType.DELETE)
				deleteBatch = []
			}

			if (this.stopped) {
				nextUrl = null
				break
			}

			// The @odata.deltaLink reached at the end of a round is intentionally not persisted: ImapFolderSyncState
			// (a generated server entity) has no free field to hold an opaque per-folder cursor for a non-IMAP
			// provider. Each sync round therefore re-walks the whole folder via delta's own full-listing behavior.
			// Correctness is unaffected - already-imported messages are recognized via the persisted immutable
			// Graph message id in importedSourceIds - only the bandwidth benefit of resuming from a stored
			// deltaLink is lost until ImapFolderSyncState gains a persisted cursor field.
			nextUrl = response["@odata.nextLink"] ?? null
			if (!nextUrl) {
				isFinished = true
			}
		}

		if (createBatch.length > 0) {
			await this.listener.onMultipleMails(createBatch, ImapSyncEventType.CREATE)
		}

		if (isFinished) {
			await this.listener.onMailboxStatus({ path: mailbox.path, uidNext: 0, uidValidity: 1n, syncStatus: ImapFolderSyncStatus.FINISHED })
		}
	}

	private graphMessageToImapMail(message: GraphMessageResource, mailbox: ImapMailbox): ImapMail {
		const envelope: ImapMailEnvelope = {
			date: message.sentDateTime ? new Date(message.sentDateTime) : undefined,
			subject: message.subject,
			messageId: message.internetMessageId,
			from: message.from ? [graphRecipientToImapMailAddress(message.from)] : undefined,
			sender: message.sender ? [graphRecipientToImapMailAddress(message.sender)] : undefined,
			to: message.toRecipients?.map(graphRecipientToImapMailAddress),
			cc: message.ccRecipients?.map(graphRecipientToImapMailAddress),
			bcc: message.bccRecipients?.map(graphRecipientToImapMailAddress),
			replyTo: message.replyTo?.map(graphRecipientToImapMailAddress),
		}

		const isHtml = message.body?.contentType?.toLowerCase() === "html"
		const body: ImapMailBody = {
			html: isHtml ? (message.body?.content ?? "") : "",
			plaintext: isHtml ? "" : (message.body?.content ?? ""),
		}

		const flags = new Set<string>()
		if (message.isRead) {
			flags.add(IMAP_FLAG_SEEN)
		}

		// Reference (OneDrive-shared) attachments have no contentBytes and are skipped - a known gap.
		const attachments: ImapMailAttachment[] = (message.attachments ?? [])
			.filter((attachment) => attachment.contentBytes !== undefined)
			.map((attachment) => ({
				size: attachment.size ?? 0,
				mimeType: attachment.contentType ?? "application/octet-stream",
				content: Buffer.from(attachment.contentBytes!, "base64"),
				disposition: attachment.isInline ? ImapMailAttachmentDisposition.Inline : ImapMailAttachmentDisposition.Attachment,
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

	private async discoverFolders(client: GraphClient): Promise<ImapMailbox[]> {
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

			const imapError = this.toImapError(e)
			await this.listener.onError(imapError)
			//Auth Failing must cause syncing to stop and prompt new credentials.
			if (imapError.data.cause === ImapErrorCause.AUTH_FAILED) {
				throw imapError
			}
			return []
		}
		const result: GraphMailFolderResource[] = []
		for (const child of children) {
			result.push(child, ...(await this.fetchChildFoldersRecursive(client, child)))
		}
		return result
	}

	private async resolveWellKnownFolderIds(client: GraphClient): Promise<Map<string, ImapMailboxSpecialUse>> {
		const result = new Map<string, ImapMailboxSpecialUse>()
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

	private buildMailboxTree(folders: GraphMailFolderResource[], specialUseByFolderId: ReadonlyMap<string, ImapMailboxSpecialUse>): ImapMailbox[] {
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
	 * (see fromImapFlowError in ImapError.ts) since callers (ImapErrorHandler, ImapMailImportController) already
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
	private toImapError(e: any): ImapError {
		if (e instanceof ImapError) {
			return e
		}
		const status = e?.statusCode ?? e?.status
		switch (status) {
			case 401:
				return new ImapError(e?.message ?? "Microsoft Graph authentication failed", ImapErrorCause.AUTH_FAILED, "401")
			case 403:
				return new ImapError(e?.message ?? "Microsoft Graph denied access to the requested resource", ImapErrorCause.AUTH_FAILED, "403")
			case 400:
			case 404:
				return new ImapError(e?.message ?? "Microsoft Graph rejected the request", ImapErrorCause.PERMANENT_ERROR, String(status))
			case 429:
			case 503:
			case 504:
				return new ImapError(e?.message ?? "Microsoft Graph throttled the request", ImapErrorCause.POSTPONE, String(status))
			default:
				return new ImapError(e?.message ?? "Unknown Microsoft Graph error", ImapErrorCause.UNKNOWN, String(status ?? ""))
		}
	}

	/**
	 * Returns how long to postpone the sync for if `e` is a Microsoft Graph throttling response (429, 503, or 504 -
	 * the same set the Graph SDK's own default RetryHandler treats as transient), honoring the Retry-After header
	 * (seconds) when present since it is authoritative - see https://learn.microsoft.com/en-us/graph/throttling.
	 * Returns null for any other error.
	 */
	private getRetryAfterMs(e: any): number | null {
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
	parentMailbox: ImapMailbox | null,
	childrenByParent: ReadonlyMap<string, GraphMailFolderResource[]>,
	specialUseByFolderId: ReadonlyMap<string, ImapMailboxSpecialUse>,
	folderIdByPath: Map<string, string>,
): ImapMailbox {
	const path = parentPath ? `${parentPath}/${folder.displayName}` : folder.displayName
	const mailbox: ImapMailbox = {
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

/** Flattens a mailbox tree (as produced by buildMailboxNode) into a single depth-first list. */
function collectMailboxesDepthFirst(mailboxes: ImapMailbox[]): ImapMailbox[] {
	const result: ImapMailbox[] = []
	for (const mailbox of mailboxes) {
		result.push(mailbox)
		result.push(...collectMailboxesDepthFirst(mailbox.subFolders ?? []))
	}
	return result
}

function graphRecipientToImapMailAddress(recipient: GraphRecipient): ImapMailAddress {
	return { name: recipient.emailAddress?.name, address: recipient.emailAddress?.address }
}

function reconstructHeaders(headers?: { name: string; value: string }[]): string | undefined {
	if (!headers || headers.length === 0) {
		return undefined
	}
	return headers.map((header) => `${header.name}: ${header.value}`).join("\r\n")
}
