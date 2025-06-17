import { Mail } from "../../../entities/tutanota/TypeRefs"
import { lazyAsync } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../../../mail-app/workerUtils/index/MailIndexer"
import { CustomCacheHandler } from "./CustomCacheHandler"

/**
 * Handles telling the indexer to index or un-index mail data on updates.
 */
export class CustomMailEventCacheHandler implements CustomCacheHandler<Mail> {
	constructor(private readonly indexer: lazyAsync<MailIndexer>) {}

	shouldLoadOnCreateEvent(): boolean {
		// New emails should be pre-cached.
		//  - we need them to display the folder contents
		//  - will very likely be loaded by indexer later
		//  - we might have the instance in offline cache already because of notification process
		// however, they are already preloaded by the EventBusClient
		return false
	}

	async onBeforeCacheDeletion(id: IdTuple): Promise<void> {
		const indexer = await this.indexer()
		return indexer.beforeMailDeleted(id)
	}

	async onEntityEventCreate(id: IdTuple) {
		const indexer = await this.indexer()
		return indexer.afterMailCreated(id)
	}

	async onEntityEventUpdate(id: IdTuple) {
		const indexer = await this.indexer()
		return indexer.afterMailUpdated(id)
	}
}
