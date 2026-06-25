import { lazyAsync } from "@tutao/utils"
import { CustomCacheHandler } from "../../../../app-kit/local-store/CustomCacheHandler"
import { Contact } from "@tutao/entities/tutanota"
import { ContactIndexer } from "../index/ContactIndexer"

/**
 * Handles telling the indexer to index or un-index contact data on updates.
 */
export class CustomContactEventCacheHandler implements CustomCacheHandler<Contact> {
	constructor(private readonly indexer: lazyAsync<ContactIndexer>) {}

	async onBeforeCacheDeletion(id: IdTuple): Promise<void> {
		const indexer = await this.indexer()
		return indexer.beforeContactDeleted(id)
	}

	async onEntityEventCreate(id: IdTuple): Promise<void> {
		const indexer = await this.indexer()
		return indexer.afterContactCreated(id)
	}

	async onEntityEventUpdate(id: IdTuple): Promise<void> {
		const indexer = await this.indexer()
		return indexer.afterContactUpdated(id)
	}
}
