import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { GroupTimestamps, MailIndexerBackend, MailWithDetailsAndAttachments } from "./MailIndexerBackend"

export class OfflineStorageMailIndexerBackend implements MailIndexerBackend {
	constructor(private readonly persistence: OfflineStoragePersistence) {}

	async init(): Promise<void> {}

	async getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>> {
		const groupData = await this.persistence.getIndexedGroups()
		const map = new Map<Id, number>()
		for (const group of groupData) {
			map.set(group.groupId, group.indexedTimestamp)
		}
		return map
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailData: readonly MailWithDetailsAndAttachments[]): Promise<void> {
		await this.persistence.storeMailData(mailData)
		for (const [groupId, timestamp] of dataPerGroup) {
			await this.persistence.updateIndexingTimestamp(groupId, timestamp)
		}
	}

	async enableIndexing(): Promise<boolean> {
		const wasEnabled = await this.isMailIndexingEnabled()
		await this.persistence.setMailIndexingEnabled(true)
		return wasEnabled
	}

	async deleteIndex() {
		/* no-op */
	}

	async isMailIndexingEnabled(): Promise<boolean> {
		return this.persistence.isMailIndexingEnabled()
	}

	async onMailCreated(mailData: MailWithDetailsAndAttachments): Promise<void> {
		await this.persistence.storeMailData([mailData])
	}

	async onMailUpdated(mailData: MailWithDetailsAndAttachments): Promise<void> {
		await this.persistence.storeMailData([mailData])
	}

	async onMailDeleted(_: IdTuple): Promise<void> {
		// no-op: processed in onBeforeMailDeleted()
	}

	async onBeforeMailDeleted(mailId: IdTuple): Promise<void> {
		await this.persistence.deleteMailData(mailId)
	}
}
