import { MigrationCredentials, MigrationMailboxState } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationMail } from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError.js"
import { MigrationSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import { GraphApiClient, GraphMailApi, GraphMailFolderResource, parseRetryAfterMs } from "./GraphApiClient.js"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ApiMigrationSyncSession } from "../ApiMigrationSyncSession.js"
import { migrationMailFromGraphMessage } from "../mailparser/MailParserUtils.js"
import { MAIL_DOWNLOAD_BATCH_SIZE } from "../imapsync/DifferentialUidLoader.js"
import { assertNotNull, isNotEmpty } from "@tutao/utils"

const M365_RATE_LIMIT_DEFAULT_POSTPONE_TIME = 60 * 1000 // 60 seconds
const M365_RATE_LIMIT_MIN_POSTPONE_TIME = 30 * 1000 // 30 seconds

//https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0
const WELL_KNOWN_FOLDERS: ReadonlyArray<{ name: string; specialUse: MigrationMailboxSpecialUse }> = [
	{ name: "inbox", specialUse: MigrationMailboxSpecialUse.INBOX },
	{ name: "sentitems", specialUse: MigrationMailboxSpecialUse.SENT },
	{ name: "drafts", specialUse: MigrationMailboxSpecialUse.DRAFTS },
	{ name: "deleteditems", specialUse: MigrationMailboxSpecialUse.TRASH },
	{ name: "junkemail", specialUse: MigrationMailboxSpecialUse.JUNK },
	{ name: "archive", specialUse: MigrationMailboxSpecialUse.ARCHIVE },
]

export type GraphClientFactory = (accessToken: string) => GraphMailApi

/**
 * Sync session to connect and retrieve mails from Graph API.
 */
export class M365SyncSession extends ApiMigrationSyncSession<GraphMailApi> {
	private readonly folderIdByPath = new Map<string, string>()

	constructor(
		migrationSyncEventListener: MigrationSyncEventListener,
		private readonly graphClientFactory: GraphClientFactory = (accessToken) => new GraphApiClient(accessToken),
	) {
		super(migrationSyncEventListener)
	}

	protected async createClient(migrationCredentials: MigrationCredentials): Promise<GraphMailApi> {
		const accessToken = migrationCredentials.tokenEndpointResponse?.access_token
		if (!accessToken) {
			throw new MigrationError("No Microsoft Graph access token available", MigrationErrorCause.AUTH_FAILED)
		}
		return this.graphClientFactory(accessToken)
	}

	protected async fetchMailboxes(client: GraphMailApi): Promise<MigrationMailbox[]> {
		return this.discoverFolders(client)
	}

	protected async syncMailbox(client: GraphMailApi, migrationMailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean> {
		const folderId = this.folderIdByPath.get(migrationMailbox.path)
		if (!folderId) {
			return false
		}

		let migrationMailsCreate: MigrationMail[] = []
		let migrationMailsDelete: MigrationMail[] = []

		const emitCreate = async () => {
			const migrationMails = migrationMailsCreate
			migrationMailsCreate = []
			if (this.stopped) {
				return
			}
			await this.migrationSyncEventListener.onMultipleMails(migrationMails, MigrationSyncEventType.CREATE)
			for (const migrationMail of migrationMails) {
				mailboxState.importedSourceIdToMailIdsMap.set(assertNotNull(migrationMail.sourceId), { sourceId: migrationMail.sourceId })
			}
		}

		// First only the ids of the folder are listed, so that the mails that were imported before are not downloaded (with their attachments) again.
		const idsToDownload = new Set<string>()
		let nextLink: string | null = null
		do {
			if (this.stopped) {
				return false
			}
			const page = await client.listMessageIds(folderId, nextLink)

			for (const removedId of page.removedIds) {
				if (mailboxState.importedSourceIdToMailIdsMap.has(removedId)) {
					migrationMailsDelete.push({ sourceId: removedId, belongsToMailbox: migrationMailbox })
					mailboxState.importedSourceIdToMailIdsMap.delete(removedId)
				}
			}
			for (const id of page.ids) {
				if (!mailboxState.importedSourceIdToMailIdsMap.has(id)) {
					idsToDownload.add(id)
				}
			}

			nextLink = page.nextLink
		} while (nextLink)

		if (isNotEmpty(migrationMailsDelete)) {
			await this.migrationSyncEventListener.onMultipleMails(migrationMailsDelete, MigrationSyncEventType.DELETE)
			migrationMailsDelete = []
		}

		const ids = Array.from(idsToDownload)
		for (let i = 0; i < ids.length; ) {
			if (this.stopped) {
				return false
			}
			const batchSize = client.messageBatchSize
			const messages = await client.getMessages(ids.slice(i, i + batchSize))
			i += batchSize

			for (const message of messages) {
				// null: deleted or moved after it was listed
				if (message == null) {
					continue
				}
				migrationMailsCreate.push(migrationMailFromGraphMessage(message, migrationMailbox))
				if (migrationMailsCreate.length >= MAIL_DOWNLOAD_BATCH_SIZE) {
					await emitCreate()
				}
			}
		}

		if (isNotEmpty(migrationMailsCreate)) {
			await emitCreate()
		}

		return !this.stopped
	}

	private async discoverFolders(client: GraphMailApi): Promise<MigrationMailbox[]> {
		const folderIdToSpecialUseMap = await this.resolveWellKnownFolderIds(client)
		const topLevel = await client.listFolders()
		const allFolders: GraphMailFolderResource[] = []
		for (const folder of topLevel) {
			allFolders.push(folder, ...(await this.fetchChildFoldersRecursive(client, folder)))
		}
		this.folderIdByPath.clear()
		return this.buildMailboxTree(allFolders, folderIdToSpecialUseMap)
	}

	private async fetchChildFoldersRecursive(client: GraphMailApi, folder: GraphMailFolderResource): Promise<GraphMailFolderResource[]> {
		if (!folder.childFolderCount) {
			return []
		}
		let children: GraphMailFolderResource[]
		try {
			children = await client.listChildFolders(folder.id)
		} catch (e) {
			if (this.getRetryAfterMs(e) !== null) {
				throw e
			}

			const migrationError = this.toMigrationError(e)
			await this.migrationSyncEventListener.onError(migrationError)
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

	private async resolveWellKnownFolderIds(client: GraphMailApi): Promise<Map<string, MigrationMailboxSpecialUse>> {
		const result = new Map<string, MigrationMailboxSpecialUse>()
		for (const { name, specialUse } of WELL_KNOWN_FOLDERS) {
			const folderId = await client.getWellKnownFolderId(name)
			if (folderId !== null) {
				result.set(folderId, specialUse)
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

	protected toMigrationError(e: any): MigrationError {
		if (e instanceof MigrationError) {
			return e
		}
		const status = e?.status
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
	 * See {@link GraphApiClient.ts}'s comments
	 */
	protected getRetryAfterMs(e: any): number | null {
		const status = e?.status
		if (status !== 429 && status !== 503 && status !== 504) {
			return null
		}
		const retryAfterMs = parseRetryAfterMs(e?.retryAfter) ?? M365_RATE_LIMIT_DEFAULT_POSTPONE_TIME
		return Math.max(retryAfterMs, M365_RATE_LIMIT_MIN_POSTPONE_TIME)
	}
}

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

export function createM365Sync(migrationSyncEventListener: MigrationSyncEventListener): M365SyncSession {
	return new M365SyncSession(migrationSyncEventListener)
}
