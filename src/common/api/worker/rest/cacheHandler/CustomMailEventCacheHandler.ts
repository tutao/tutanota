import { Mail, MailFolderTypeRef, MailSetEntryTypeRef } from "../../../entities/tutanota/TypeRefs"
import { isSameTypeRef, lazy, lazyAsync } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../../../mail-app/workerUtils/index/MailIndexer"
import { CustomCacheHandler } from "./CustomCacheHandler"
import { EntityUpdateData } from "../../../common/utils/EntityUpdateUtils"
import { MailFacade } from "../../facades/lazy/MailFacade"
import { OfflineStoragePersistence } from "../../../../../mail-app/workerUtils/index/OfflineStoragePersistence"
import { MailSetKind } from "../../../common/TutanotaConstants"
import { CacheStorage } from "../DefaultEntityRestCache"
import { isSameId, listIdPart } from "../../../common/utils/EntityUtils"

/**
 * Handles telling the indexer to index or un-index mail data on updates.
 */
export class CustomMailEventCacheHandler implements CustomCacheHandler<Mail> {
	constructor(
		private readonly indexerAndMailFacade: lazyAsync<{ mailIndexer: MailIndexer; mailFacade: MailFacade }>,
		private readonly offlineStoragePersistence: lazy<Promise<OfflineStoragePersistence>>,
		private readonly storage: CacheStorage,
	) {}

	shouldLoadOnCreateEvent(): boolean {
		// New emails should be pre-cached.
		//  - we need them to display the folder contents
		//  - will very likely be loaded by indexer later
		//  - we might have the instance in offline cache already because of notification process
		// however, they are already preloaded by the EventBusClient
		return true
	}

	async onBeforeCacheDeletion(id: IdTuple): Promise<void> {
		const { mailIndexer } = await this.indexerAndMailFacade()
		return mailIndexer.beforeMailDeleted(id)
	}

	async onEntityEventCreate(id: IdTuple, events: EntityUpdateData[]) {
		const { mailIndexer, mailFacade } = await this.indexerAndMailFacade()
		// At this point, the mail entity, itself, is cached, so when we go to download it again, it will come from cache
		const newMailData = await mailIndexer.downloadNewMailData(id)
		await mailIndexer.afterMailCreated(id, newMailData)

		// fixme extract to separate class
		// update spam classification table
		if (newMailData) {
			const allFolders = await this.storage.getWholeList(MailFolderTypeRef, listIdPart(newMailData.mail.sets[0]))
			const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!

			const isStoredInSpamFolder = newMailData.mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
			// isStoredInSpamFolder is true
			// this might be run multiple times for a single user if they use multiple devices
			const predictedSpam = await mailFacade.predictSpamResult(newMailData.mail)

			// use the server classification for initial training, mixed with data from when user moves mails in and out
			// of spam.
			const storedSpamResult = mailFacade.hasClassifier() ? predictedSpam : isStoredInSpamFolder
			const offlineStoragePersistence = await this.offlineStoragePersistence()
			await offlineStoragePersistence.storeSpamClassification(newMailData.mail, newMailData.mailDetails.body, storedSpamResult)

			if (mailFacade.hasClassifier()) {
				if (predictedSpam && !isStoredInSpamFolder) {
					await mailFacade.simpleMoveMails([id], MailSetKind.SPAM)
				} else if (!predictedSpam && isStoredInSpamFolder) {
					await mailFacade.simpleMoveMails([id], MailSetKind.INBOX)
				}
			}
		}
	}

	async onEntityEventUpdate(id: IdTuple, events: EntityUpdateData[]) {
		const { mailIndexer, mailFacade } = await this.indexerAndMailFacade()
		await mailIndexer.afterMailUpdated(id)

		const mailMoved = events.some((data) => isSameTypeRef(data.typeRef, MailSetEntryTypeRef))
		if (!mailMoved) {
			return
		}

		const newMailData = await mailIndexer.downloadNewMailData(id)
		if (newMailData) {
			const allFolders = await this.storage.getWholeList(MailFolderTypeRef, listIdPart(newMailData.mail.sets[0]))
			const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!

			// use the result of the move mail as spam classification data
			const storedSpamResult = newMailData.mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))

			const offlineStoragePersistence = await this.offlineStoragePersistence()
			const currentSpamClassification = await offlineStoragePersistence.getStoredClassification(newMailData.mail, newMailData.mailDetails.body)
			await offlineStoragePersistence.storeSpamClassification(newMailData.mail, newMailData.mailDetails.body, storedSpamResult)
			if (storedSpamResult !== currentSpamClassification) {
				// FIXME debounce
				await mailFacade.updateClassifier()
			}
		}
	}
}
