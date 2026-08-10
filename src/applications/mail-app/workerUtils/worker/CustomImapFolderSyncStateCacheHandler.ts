import { ImapFolderSyncState, ImapFolderSyncStateTypeRef } from "@tutao/entities/tutanota"
import { CustomCacheHandler } from "../../../../app-kit/local-store/CustomCacheHandler"
import { lazyAsync } from "@tutao/utils"
import { MailIndexer } from "../index/MailIndexer"
import { ImapFolderSyncStatus, MailImportType } from "../../../../entities/tutanota/Utils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"

/**
 * Handles telling the indexer to index IMAP imported mails.
 *
 * We need to do this to avoid potentially missing events before the batch id is written.
 */
export class CustomImapFolderSyncStateCacheHandler implements CustomCacheHandler<ImapFolderSyncState> {
	constructor(
		private readonly indexer: lazyAsync<MailIndexer>,
		private readonly entityClient: EntityClient,
	) {}

	onEntityEventCreate(id: IdTuple) {
		return this.handle(id)
	}

	onEntityEventUpdate(id: IdTuple) {
		return this.handle(id)
	}

	private async handle(id: IdTuple) {
		const imapFolderSyncState = await this.entityClient.load(ImapFolderSyncStateTypeRef, id)
		const status = imapFolderSyncState.status as ImapFolderSyncStatus
		if (!(status === ImapFolderSyncStatus.RUNNING || status === ImapFolderSyncStatus.NO_SYNC)) {
			const indexer = await this.indexer()
			return await indexer.beforeImportedMailFinished(imapFolderSyncState.importedMails, MailImportType.ImapImport)
		}
	}
}
