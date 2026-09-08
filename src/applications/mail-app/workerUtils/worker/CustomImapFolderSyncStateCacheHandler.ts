import { MailboxMigrationFolderSyncStateTypeRef, MailboxMigrationFolderSyncState } from "@tutao/entities/tutanota"
import { CustomCacheHandler } from "../../../../app-kit/local-store/CustomCacheHandler"
import { lazyAsync } from "@tutao/utils"
import { MailIndexer } from "../index/MailIndexer"
import { MailboxMigrationFolderSyncStatus, MailImportType } from "../../../../entities/tutanota/Utils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"

/**
 * Handles telling the indexer to index IMAP imported mails.
 *
 * We need to do this to avoid potentially missing events before the batch id is written.
 */
export class CustomImapFolderSyncStateCacheHandler implements CustomCacheHandler<MailboxMigrationFolderSyncState> {
	constructor(
		private readonly indexer: lazyAsync<MailIndexer>,
		private readonly entityClient: EntityClient,
	) {}

	onCreateEntityUpdate(id: IdTuple) {
		return this.handle(id)
	}

	onUpdateEntityUpdate(id: IdTuple) {
		return this.handle(id)
	}

	private async handle(id: IdTuple) {
		const mailboxMigrationFolderSyncState = await this.entityClient.load(MailboxMigrationFolderSyncStateTypeRef, id)
		const status = mailboxMigrationFolderSyncState.status as MailboxMigrationFolderSyncStatus
		if (!(status === MailboxMigrationFolderSyncStatus.RUNNING || status === MailboxMigrationFolderSyncStatus.NO_SYNC)) {
			const indexer = await this.indexer()
			return await indexer.beforeImportedMailFinished(mailboxMigrationFolderSyncState.importedMails, MailImportType.ImapImport)
		}
	}
}
