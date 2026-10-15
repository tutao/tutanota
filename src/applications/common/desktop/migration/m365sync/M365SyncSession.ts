import { MigrationCredentials, MigrationMailboxState } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationMail } from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError.js"
import { MigrationSyncEventType } from "../../../../../entities/tutanota/Utils.js"
import { GraphApiClient, GraphApiMailFolderResource, GraphMailApi } from "./GraphApiClient.js"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ApiMigrationSyncSession } from "../ApiMigrationSyncSession.js"
import { migrationMailFromGmailMessage, migrationMailFromGraphMessage } from "../mailparser/MailParserUtils.js"
import { isEmpty, isNotEmpty, promiseMap, splitInChunks } from "@tutao/utils"
import { MAIL_DOWNLOAD_BATCH_SIZE, SyncSessionState } from "../MigrationSyncSession"
import { GmailMailApi } from "../gmailsync/GmailApiClient"

//https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0
const MICROSOFT_SYSTEM_FOLDERS: ReadonlyArray<{ name: string; specialUse: MigrationMailboxSpecialUse }> = [
	{ name: "inbox", specialUse: MigrationMailboxSpecialUse.INBOX },
	{ name: "sentitems", specialUse: MigrationMailboxSpecialUse.SENT },
	{ name: "drafts", specialUse: MigrationMailboxSpecialUse.DRAFTS },
	{ name: "deleteditems", specialUse: MigrationMailboxSpecialUse.TRASH },
	{ name: "junkemail", specialUse: MigrationMailboxSpecialUse.JUNK },
	{ name: "archive", specialUse: MigrationMailboxSpecialUse.ARCHIVE },
]

export type GraphClientFactory = (accessToken: string) => GraphMailApi

export class M365SyncSession extends ApiMigrationSyncSession<GraphMailApi> {
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

	protected async syncMailbox(client: GraphMailApi, migrationMailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean> {
		let nextLink: string | null = null
		do {
			// state can be updated anytime from outside
			const state = this.state
			if (state === SyncSessionState.STOPPED) {
				return false
			}

			const page = await client.listMessageIds(migrationMailbox.sourceId, nextLink)
			nextLink = page.nextLink
			const idsToDownload = page.ids.filter((id) => !mailboxState.importedSourceIdToMailIdsMap.has(id))

			try {
				const messages = await client.getMessages(idsToDownload)
				const migrationMails = await promiseMap(messages, async (message) => await migrationMailFromGraphMessage(message, migrationMailbox), {
					concurrency: 10,
				})
				if (isNotEmpty(migrationMails) && this.state !== SyncSessionState.STOPPED) {
					await this.migrationSyncEventListener.onMultipleMails(migrationMails, MigrationSyncEventType.CREATE)
				}
			} catch (e) {
				throw this.toMigrationError(e)
			}
		} while (nextLink)

		return true
	}

	protected async fetchMailboxes(client: GraphMailApi): Promise<MigrationMailbox[]> {
		const systemFolderIdToSpecialUse = await this.resolveSystemFolderIds(client)
		const topLevelFolders = await client.listFolders()
		let allFolders: GraphApiMailFolderResource[] = []
		for (const folder of topLevelFolders) {
			const childFolders = await this.fetchChildFoldersRecursive(client, folder)
			allFolders = allFolders.concat(folder).concat(childFolders)
		}
		return this.buildMailboxTree(allFolders, topLevelFolders, systemFolderIdToSpecialUse)
	}

	private async resolveSystemFolderIds(client: GraphMailApi): Promise<Map<string, MigrationMailboxSpecialUse>> {
		const result = new Map<string, MigrationMailboxSpecialUse>()
		for (const { name, specialUse } of MICROSOFT_SYSTEM_FOLDERS) {
			const folderId = await client.getSystemFolderId(name)
			if (folderId !== null) {
				result.set(folderId, specialUse)
			}
		}
		return result
	}

	private async fetchChildFoldersRecursive(client: GraphMailApi, folder: GraphApiMailFolderResource): Promise<GraphApiMailFolderResource[]> {
		if (!folder.childFolderCount) {
			return []
		}
		let children: GraphApiMailFolderResource[]
		try {
			children = await client.listChildFolders(folder.id)
		} catch (e) {
			const migrationError = this.toMigrationError(e)
			await this.migrationSyncEventListener.onError(migrationError)
			if (migrationError.data.cause === MigrationErrorCause.AUTH_FAILED) {
				throw migrationError
			}
			return []
		}
		let result: GraphApiMailFolderResource[] = []
		for (const child of children) {
			const grandchildren = await this.fetchChildFoldersRecursive(client, child)
			result = result.concat(child).concat(grandchildren)
		}
		return result
	}

	private buildMailboxTree(
		allFolders: GraphApiMailFolderResource[],
		topLevelFolders: GraphApiMailFolderResource[],
		systemFolderIdToSpecialUse: ReadonlyMap<string, MigrationMailboxSpecialUse>,
	): MigrationMailbox[] {
		const parentFolderIdToChildrenFolders = new Map<string, GraphApiMailFolderResource[]>()
		for (const folder of allFolders) {
			if (folder.parentFolderId) {
				const siblings = parentFolderIdToChildrenFolders.get(folder.parentFolderId) ?? []
				siblings.push(folder)
				parentFolderIdToChildrenFolders.set(folder.parentFolderId, siblings)
			}
		}
		return topLevelFolders.map((folder) => this.buildMailboxNode(folder, null, parentFolderIdToChildrenFolders, systemFolderIdToSpecialUse))
	}

	private buildMailboxNode(
		folder: GraphApiMailFolderResource,
		parentMailbox: MigrationMailbox | null,
		childrenByParent: ReadonlyMap<string, GraphApiMailFolderResource[]>,
		systemFolderIdToSpecialUse: ReadonlyMap<string, MigrationMailboxSpecialUse>,
	): MigrationMailbox {
		const mailbox: MigrationMailbox = {
			name: folder.displayName,
			sourceId: folder.id,
			specialUse: systemFolderIdToSpecialUse.get(folder.id),
			parentFolder: parentMailbox,
		}
		mailbox.subFolders = (childrenByParent.get(folder.id) ?? []).map((child) =>
			this.buildMailboxNode(child, mailbox, childrenByParent, systemFolderIdToSpecialUse),
		)
		return mailbox
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
}

export function createM365SyncSession(migrationSyncEventListener: MigrationSyncEventListener): M365SyncSession {
	return new M365SyncSession(migrationSyncEventListener)
}
