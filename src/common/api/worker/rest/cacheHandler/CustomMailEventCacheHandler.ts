import { Mail, MailFolder, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef } from "../../../entities/tutanota/TypeRefs"
import { assertNotNull, isSameTypeRef, lazy, lazyAsync } from "@tutao/tutanota-utils"
import { MailIndexer } from "../../../../../mail-app/workerUtils/index/MailIndexer"
import { CustomCacheHandler } from "./CustomCacheHandler"
import { EntityUpdateData } from "../../../common/utils/EntityUpdateUtils"
import { MailFacade } from "../../facades/lazy/MailFacade"
import { OfflineStoragePersistence } from "../../../../../mail-app/workerUtils/index/OfflineStoragePersistence"
import { MailSetKind } from "../../../common/TutanotaConstants"
import { CacheStorage } from "../DefaultEntityRestCache"
import { elementIdPart, isSameId, listIdPart } from "../../../common/utils/EntityUtils"
import { ClientClassifierType } from "../../../common/ClientClassifierType"
import { MailWithDetailsAndAttachments } from "../../../../../mail-app/workerUtils/index/MailIndexerBackend"
import { getMailBodyText } from "../../../common/CommonMailUtils"
import { SpamTrainMailDatum } from "../../../../../mail-app/workerUtils/spamClassification/SpamClassifier"

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
		const { mailIndexer } = await this.indexerAndMailFacade()
		await mailIndexer.afterMailUpdated(id)
		await this.updateSpamClassificationData(events, id)
	}

	private async processSpam(newMailData: MailWithDetailsAndAttachments | null, mailFacade: MailFacade, id: readonly [string, string]) {
		const usedClientSpamClassifier = ClientClassifierType.CLIENT_CLASSIFICATION
		if (newMailData == null) {
			return
		}

		// update spam classification table
		const mail = newMailData.mail
		const allFolders = await this.storage.getWholeList(MailFolderTypeRef, listIdPart(mail.sets[0]))
		const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!

		const isStoredInSpamFolder = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
		const { isStoredInTrashFolder, confidence } = this.getSpamConfidence(allFolders, mail)

		// isStoredInSpamFolder is true
		// this might be run multiple times for a single user if they use multiple devices
		const predictedSpam = isStoredInTrashFolder ? null : await mailFacade.predictSpamResult(mail)
		// use the server classification for initial training, mixed with data from when user moves mails in and out of spam
		const isSpam = predictedSpam ?? isStoredInSpamFolder
		const offlineStoragePersistence = await this.offlineStoragePersistence()

		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(newMailData.mailDetails.body),
			isSpam,
			isSpamConfidence: confidence,
			ownerGroup: assertNotNull(mail._ownerGroup),
		}

		let moveServiceCall
		if (!isStoredInTrashFolder && isSpam && !isStoredInSpamFolder) {
			spamTrainMailDatum.isSpamConfidence = 1
			moveServiceCall = mailFacade.simpleMoveMails([id], MailSetKind.SPAM, usedClientSpamClassifier)
		} else if (!isStoredInTrashFolder && !isSpam && isStoredInSpamFolder) {
			spamTrainMailDatum.isSpamConfidence = 0
			moveServiceCall = mailFacade.simpleMoveMails([id], MailSetKind.INBOX, usedClientSpamClassifier)
		}
		await offlineStoragePersistence.storeSpamClassification(spamTrainMailDatum)
		await moveServiceCall
	}

	private async updateSpamClassificationData(events: EntityUpdateData[], id: readonly [string, string]) {
		const mail = assertNotNull(await this.storage.get(MailTypeRef, listIdPart(id), elementIdPart(id)))
		const changedMailSetEntry = events.some((ev) => isSameTypeRef(ev.typeRef, MailSetEntryTypeRef))
		const mailHasBeenRead = !mail.unread

		if (!mailHasBeenRead && !changedMailSetEntry) {
			return
		}

		const allFolders = await this.storage.getWholeList(MailFolderTypeRef, listIdPart(mail.sets[0]))
		const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!
		const isSpam = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
		let { confidence: isSpamConfidence, isStoredInTrashFolder } = this.getSpamConfidence(allFolders, mail)

		const offlineStoragePersistence = await this.offlineStoragePersistence()
		const storedClassification = await offlineStoragePersistence.getStoredClassification(mail)

		if (storedClassification != null) {
			// email is in classification data

			const wasDeletedFromSpamFolder = isStoredInTrashFolder && storedClassification.isSpam
			if (wasDeletedFromSpamFolder) {
				// This is the case if we delete from spam Folder, in that case we do not need any change in storedClassification
			} else if (isSpam !== storedClassification.isSpam || isSpamConfidence !== storedClassification.isSpamConfidence) {
				// the model has trained on the mail but the spamFlag was wrong so we refit with higher isSpamConfidence
				await offlineStoragePersistence.updateSpamClassificationData(id, isSpam, isSpamConfidence)
			}
		} else {
			const { mailIndexer } = await this.indexerAndMailFacade()
			// At this point, the mail entity, itself, is cached, so when we go to download it again, it will come from cache
			const newMailData = await mailIndexer.downloadNewMailData(id)
			if (newMailData) {
				const spamTrainMailDatum: SpamTrainMailDatum = {
					mailId: mail._id,
					subject: mail.subject,
					body: getMailBodyText(newMailData.mailDetails.body),
					isSpam,
					isSpamConfidence,
					ownerGroup: assertNotNull(mail._ownerGroup),
				}

				await offlineStoragePersistence.storeSpamClassification(spamTrainMailDatum)
			} else {
				// race: mail deleted in meantime
			}
		}
	}

	// visible for testing
	public getSpamConfidence(allFolders: Array<MailFolder>, mail: Mail): { confidence: number; isStoredInTrashFolder: boolean } {
		const spamFolder = allFolders.find((folder) => folder.folderType === MailSetKind.SPAM)!
		const trashFolder = allFolders.find((folder) => folder.folderType === MailSetKind.TRASH)!

		const isStoredInSpamFolder = mail.sets.some((folderId) => isSameId(folderId, spamFolder._id))
		const isStoredInTrashFolder = mail.sets.some((folderId) => isSameId(folderId, trashFolder._id))

		const isReadAndNotInSpamAndNotInTrash = !mail.unread && !isStoredInSpamFolder && !isStoredInTrashFolder
		if (isStoredInSpamFolder || isReadAndNotInSpamAndNotInTrash) {
			return { confidence: 1, isStoredInTrashFolder }
		} else {
			return { confidence: 0, isStoredInTrashFolder }
		}
	}
}
