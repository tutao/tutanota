import { Mail, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs"
import { assertNotNull, isSameTypeRef, lazy, lazyAsync } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../../../mail-app/workerUtils/index/MailIndexer"
import { CustomCacheHandler } from "./CustomCacheHandler"
import { EntityUpdateData } from "../../../common/utils/EntityUpdateUtils"
import { MailFacade } from "../../facades/lazy/MailFacade"
import { OfflineStoragePersistence } from "../../../../../mail-app/workerUtils/index/OfflineStoragePersistence"
import { MailSetKind } from "../../../common/TutanotaConstants"
import { CacheStorage } from "../DefaultEntityRestCache"
import { elementIdPart, isSameId, listIdPart } from "../../../common/utils/EntityUtils"
import { ClientClassifierType } from "../../../../../mail-app/workerUtils/spamClassification/ClientClassifierType"
import { MailWithDetailsAndAttachments } from "../../../../../mail-app/workerUtils/index/MailIndexerBackend"

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
		await this.processSpam(newMailData, mailFacade, id)
	}

	async onEntityEventUpdate(id: IdTuple, events: EntityUpdateData[]) {
		const { mailIndexer, mailFacade } = await this.indexerAndMailFacade()
		await mailIndexer.afterMailUpdated(id)
		await this.updateSpamClassificationData(events, id, mailFacade)
	}

	private async processSpam(newMailData: MailWithDetailsAndAttachments | null, mailFacade: MailFacade, id: readonly [string, string]) {
		if (newMailData == null) {
			return
		}

		// update spam classification table
		const allFolders = await this.storage.getWholeList(MailFolderTypeRef, listIdPart(newMailData.mail.sets[0]))
		const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!

		const isStoredInSpamFolder = newMailData.mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
		const usedClientSpamClassifier = ClientClassifierType.CLIENT_CLASSIFICATION

		// isStoredInSpamFolder is true
		// this might be run multiple times for a single user if they use multiple devices
		const predictedSpam = await mailFacade.predictSpamResult(newMailData.mail)

		// use the server classification for initial training, mixed with data from when user moves mails in and out of spam
		const isSpam = mailFacade.isSpamClassificationEnabled() ? predictedSpam : isStoredInSpamFolder
		const offlineStoragePersistence = await this.offlineStoragePersistence()
		const isCertain = isSpam
		await offlineStoragePersistence.storeSpamClassification(newMailData.mail, newMailData.mailDetails.body, isSpam, isCertain)

		if (mailFacade.isSpamClassificationEnabled()) {
			if (predictedSpam && !isStoredInSpamFolder) {
				await mailFacade.simpleMoveMails([id], MailSetKind.SPAM, usedClientSpamClassifier)
			} else if (!predictedSpam && isStoredInSpamFolder) {
				await mailFacade.simpleMoveMails([id], MailSetKind.INBOX, usedClientSpamClassifier)
			}
		}
	}

	private async updateSpamClassificationData(events: EntityUpdateData[], id: readonly [string, string], mailFacade: MailFacade) {
		const mailMovedOrLabelApplied = events.some((data) => isSameTypeRef(data.typeRef, MailSetEntryTypeRef))
		const mail = assertNotNull(await this.storage.get(MailTypeRef, listIdPart(id), elementIdPart(id)))
		const mailHasBeenRead = !mail.unread
		if (mailHasBeenRead || mailMovedOrLabelApplied) {
			const offlineStoragePersistence = await this.offlineStoragePersistence()
			const allFolders = await this.storage.getWholeList(MailFolderTypeRef, listIdPart(mail.sets[0]))
			const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!
			const isSpam = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))

			const { isSpam: isAlreadySpam, isCertain: isAlreadyCertain } = assertNotNull(
				await offlineStoragePersistence.getStoredClassification(mail),
				"We expect to always call storeSpamClassification before updating model",
			)
			if (!isAlreadyCertain || isAlreadySpam !== isSpam) {
				await offlineStoragePersistence.updateSpamClassificationData(id, isSpam, true)
				await mailFacade.updateClassifier()
			}
		}
	}
}
