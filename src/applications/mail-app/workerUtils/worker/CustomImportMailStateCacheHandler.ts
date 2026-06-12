import { ImportFileMailState, ImportFileMailStateTypeRef } from "@tutao/entities/tutanota"
import { CustomCacheHandler } from "../../../../app-kit/local-store/CustomCacheHandler"
import { filterInt, lazyAsync } from "@tutao/utils"
import { MailIndexer } from "../index/MailIndexer"
import { FileImportStatus } from "../../../../entities/tutanota/Utils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"

/**
 * Handles telling the indexer to index imported mails.
 *
 * We need to do this to avoid potentially missing events before the batch id is written.
 */
export class CustomImportMailStateCacheHandler implements CustomCacheHandler<ImportFileMailState> {
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
		const importMailState = await this.entityClient.load(ImportFileMailStateTypeRef, id)
		const status = filterInt(importMailState.status) as FileImportStatus
		if (status === FileImportStatus.Finished || status === FileImportStatus.Canceled) {
			const indexer = await this.indexer()
			return await indexer.beforeImportedMailFinished(importMailState.importedMails)
		}
	}
}
