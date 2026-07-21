import { IndexedGroupData, OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { abortAware, MailIndexer, MailIndexerNewMailDownloader, MailIndexingAbortReason } from "./MailIndexer"
import { assertWorkerOrNode, CancelledError, FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "@tutao/app-env"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade"
import {
	assertNotNull,
	collectToMap,
	difference,
	getFirstOrThrow,
	groupByAndMap,
	isEmpty,
	isNotEmpty,
	lastThrow,
	LazyLoaded,
	promiseMap,
	splitInChunks,
} from "@tutao/utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { EncryptedParsedInstance, EntityAdapter, InstancePipeline, ServerTypeModelResolver } from "@tutao/instance-pipeline"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler"
import { IndexingErrorReason, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import {
	compareNewestFirst,
	elementIdPart,
	EntityIdEncoding,
	firstBiggerThanSecondBase64Ext,
	GENERATED_MAX_ID,
	getElementId,
	idToElementId,
	listIdPart,
	ServerTypeModel,
} from "@tutao/meta"
import {
	ImportedFileMailTypeRef,
	Mail,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { User } from "@tutao/entities/sys"
import { GroupType } from "../../../../entities/sys/Utils"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { isDraft } from "../../mail/model/MailChecks"
import { ConnectionError } from "@tutao/rest-client/error"
import { IncomingServerJson } from "../../../../platform-kit/instance-pipeline/TypeMapper"

assertWorkerOrNode()

const TAG = "[OfflineMailIndexer]"
const INDEX_CHUNK_SIZE = 1000

/**
 * Mail indexer that efficiently indexes the entire user (i.e. all mailboxes they have access to)
 */
export class OfflineMailIndexer implements MailIndexer {
	constructor(
		private readonly offlineStoragePersistence: OfflineStoragePersistence,
		private readonly blobFacade: BlobFacade,
		private readonly entityClient: EntityClient,
		private readonly mailFacade: MailFacade,
		private readonly crypto: CryptoFacade,
		private readonly serverTypeModelResolver: ServerTypeModelResolver,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly newMailDownloader: MailIndexerNewMailDownloader,
		private readonly instancePipeline: InstancePipeline,
	) {}

	private fullyIndexed: boolean = false
	private currentlyIndexingPromise: Promise<void> | null = null
	private indexTasks: (() => Promise<unknown>)[] = []
	private abortController: AbortController = new AbortController()

	get currentIndexTimestamp(): number {
		return this.fullyIndexed ? FULL_INDEXED_TIMESTAMP : NOTHING_INDEXED_TIMESTAMP
	}

	get mailIndexingEnabled(): boolean {
		// mail indexing is always enabled
		return true
	}

	private createSearchIndexStateInfo(progress: number, indexedMailCount: number = 0): SearchIndexStateInfo {
		return {
			initializing: false,
			mailIndexEnabled: this.mailIndexingEnabled,
			progress,
			currentMailIndexTimestamp: this.currentIndexTimestamp,
			aimedMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
			indexedMailCount,
			failedIndexingUpTo: null,
		}
	}

	async init(): Promise<void> {
		const mailIndexedGroups = (await this.offlineStoragePersistence.getIndexedGroups()).filter((indexedGroup) => indexedGroup.type === GroupType.Mail)
		this.fullyIndexed = isNotEmpty(mailIndexedGroups) && mailIndexedGroups.every(({ indexedTimestamp }) => indexedTimestamp === FULL_INDEXED_TIMESTAMP)
		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(0))
	}

	async afterMailCreated(mailid: IdTuple): Promise<void> {
		const mail = await this.newMailDownloader(mailid)
		if (mail != null) {
			await this.offlineStoragePersistence.storeMailData([mail])
		}
	}

	async afterMailDeleted(): Promise<void> {
		// no-op
	}

	async afterMailUpdated(mailid: IdTuple): Promise<void> {
		const mail = await this.entityClient.load(MailTypeRef, mailid)
		if (mail.mailDetailsDraft != null) {
			// update the entire mail
			await this.afterMailCreated(mailid)
		} else {
			// update just the mail's location in persistence (other indexed fields are immutable for non-draft mail)
			await this.offlineStoragePersistence.updateMailLocation(mail)
		}
	}

	async beforeMailDeleted(mailid: IdTuple): Promise<void> {
		return await this.offlineStoragePersistence.deleteMailData(mailid)
	}

	async extendMailIndex(user: User): Promise<void> {
		if (this.currentlyIndexingPromise == null) {
			this.abortController = new AbortController()

			this.indexTasks.push(async () => this.fullyIndexUser(user))

			const entries = await this.offlineStoragePersistence.getImportQueueEntries()
			for (const entry of entries) {
				this.indexTasks.push(() => this.processImport(entry))
			}

			this.processIndexQueue()
		}
		await this.currentlyIndexingPromise
	}

	private mailDetailsBlobTypeModel = new LazyLoaded(async () => {
		return await this.serverTypeModelResolver.resolveServerTypeReference(MailDetailsBlobTypeRef)
	})

	private async fullyIndexUser(user: User): Promise<void> {
		this.fullyIndexed = false

		const mailGroups = filterMailMemberships(user).map((membership) => membership.group)
		const indexedGroups = await this.offlineStoragePersistence.getIndexedGroups()

		const mailGroupData = collectToMap(
			indexedGroups.filter((group) => group.type === GroupType.Mail),
			(g) => g.groupId,
		)

		const indexedMailGroups = [...mailGroupData.values()].filter((group) => group.indexedTimestamp === FULL_INDEXED_TIMESTAMP).map((group) => group.groupId)

		const mailGroupsToAdd = difference(mailGroups, indexedMailGroups)
		const mailGroupsToRemove = difference(indexedMailGroups, mailGroups)

		console.log(
			TAG,
			`Extending mail index... Removing ${mailGroupsToRemove.length} group(s) and adding ${mailGroupsToAdd.length} group(s) so that we have ${mailGroups.length} group(s) indexed.`,
		)

		await promiseMap(mailGroupsToRemove, async (group) => {
			return await this.offlineStoragePersistence.removeIndexedGroup(group)
		})

		const totalMailboxes = mailGroupsToAdd.length
		let indexedMailCount = 0

		if (!isEmpty(mailGroupsToAdd)) {
			const indexStart = performance.now()

			const updateProgress = async (progress: number) => {
				const update = this.createSearchIndexStateInfo(Math.max(progress * 100, 1), indexedMailCount)
				await this.infoMessageHandler.onSearchIndexStateUpdate(update)
			}

			await updateProgress(0)

			let indexedMailboxes = 0
			for (const group of mailGroupsToAdd) {
				const baseProgress = indexedMailboxes / totalMailboxes
				const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(group))
				const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
				const data = assertNotNull(mailGroupData.get(group))

				await this.indexMailbox(data, mailbox, async (mailboxProgress, newMailsIndexed) => {
					if (newMailsIndexed != null) {
						indexedMailCount += newMailsIndexed
					}
					const progress = baseProgress + mailboxProgress / totalMailboxes
					await updateProgress(progress)
				})

				await this.offlineStoragePersistence.updateIndexingTimestamp(group, FULL_INDEXED_TIMESTAMP)

				indexedMailboxes += 1
			}

			const indexEnd = performance.now()

			console.log(TAG, `Indexed ${mailGroupsToAdd.length} mailbox(es) and ${indexedMailCount} mail(s) in ${indexEnd - indexStart} ms`)
		}

		this.fullyIndexed = true
		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(0, indexedMailCount))
		await this.offlineStoragePersistence.clearEncryptedMailDetailsBlobs()
	}

	private async indexMailbox(
		groupData: IndexedGroupData,
		mailbox: MailBox,
		mailboxProgress: (mailboxProgress: number, newMailsIndexed?: number) => Promise<unknown>,
	) {
		// Sort in reverse order to keep a consistent list
		const allMailBags = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags]
			.map((a) => a.mails)
			.sort((a, b) => compareNewestFirst(a, b, EntityIdEncoding.Base64Ext))

		const totalMailbags = allMailBags.length
		let indexedMailbags = 0

		for (const mailList of allMailBags) {
			if (groupData.lastIndexedEntityListId === mailList || !firstBiggerThanSecondBase64Ext(mailList, groupData.lastIndexedEntityListId)) {
				const startingId = groupData.lastIndexedEntityListId === mailList ? groupData.lastIndexedEntityElementId : GENERATED_MAX_ID
				await this.indexMailbag(groupData.groupId, mailList, startingId, async (newMailsIndexed, currentMailbagMailsDownloaded) => {
					// We don't know how many mails a user has in a mailbox, so this curve actually never reaches 1 (but
					// reaches ~99.98% after 5000 mails)
					//
					// This shows the user there is progress even it isn't known how long until it's finished.
					const currentMailbagDownloadedPartialProgress = 1 - 5000 ** (-currentMailbagMailsDownloaded / 5000)
					await mailboxProgress((indexedMailbags + currentMailbagDownloadedPartialProgress) / totalMailbags, newMailsIndexed)
				})
			}

			indexedMailbags += 1
		}
	}

	private async indexMailbag(
		mailGroup: Id,
		mailList: Id,
		startingId: Id,
		updateStorageProgress: (newMailsIndexed: number, currentMailbagMailsDownloaded: number) => Promise<unknown>,
	) {
		let currentId = startingId

		const archiveDownloadPromises = new Map()
		let totalMailsDownloaded = 0

		while (!this.abortController.signal.aborted) {
			const mails = await this.entityClient.loadRange(MailTypeRef, mailList, currentId, INDEX_CHUNK_SIZE, true)
			if (isEmpty(mails)) {
				return
			}

			const lastMail = lastThrow(mails)
			currentId = getElementId(lastMail)
			await this.indexNonRecentMails(mails, archiveDownloadPromises, async () => {
				await updateStorageProgress(1, totalMailsDownloaded++)
			})
			await this.offlineStoragePersistence.updateIndexingElement(mailGroup, lastMail._id)
		}

		// abort signal reached; rethrow cancellation error
		throw this.abortController.signal.reason
	}

	private async indexNonRecentMails(
		mails: readonly Mail[],
		archiveDownloadPromises: Map<Id, Promise<unknown>> = new Map(),
		onMailStore?: () => Promise<unknown>,
	) {
		const mailDetailsBlobTypeModel = await this.mailDetailsBlobTypeModel.getAsync()

		const mailsToStore: MailWithDetailsAndAttachments[] = []
		await promiseMap(
			mails,
			async (mail) => {
				const data = await this.loadNonRecentMail(mail, mailDetailsBlobTypeModel, archiveDownloadPromises)
				if (data != null) {
					mailsToStore.push(data)
					await onMailStore?.()
				}
			},
			{ concurrency: 10 },
		)

		if (!isEmpty(mailsToStore)) {
			await this.offlineStoragePersistence.storeMailData(mailsToStore)
		}
	}

	private async loadNonRecentMail(
		mail: Mail,
		mailDetailsBlobTypeModel: ServerTypeModel,
		archiveDownloadPromises: Map<Id, Promise<unknown>>,
	): Promise<MailWithDetailsAndAttachments | null> {
		if (isDraft(mail)) {
			return await this.newMailDownloader(mail._id)
		}

		const mailDetailsBlobId = assertNotNull(mail.mailDetails)

		const retrieveBlob = () => {
			return this.offlineStoragePersistence.retrieveEncryptedMailDetailsBlob(mailDetailsBlobTypeModel, elementIdPart(mailDetailsBlobId))
		}

		let storedBlobJson: IncomingServerJson | null

		// Get the mail details blob cached from persistence, first
		const internalBlob = await retrieveBlob()
		if (internalBlob == null) {
			// Wasn't there; we'll need to download the archive
			const archiveId = listIdPart(mailDetailsBlobId)
			const pendingPromise = archiveDownloadPromises.get(archiveId)

			// Prevent concurrent downloading of the same archive
			if (pendingPromise != null) {
				await pendingPromise
			} else {
				console.log(TAG, `Downloading archive ${archiveId}...`)
				const storePromise = abortAware(this.abortController, async () => {
					const blobs = await this.blobFacade.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, archiveId)
					return await this.offlineStoragePersistence.storeEncryptedMailDetailsBlobs(mailDetailsBlobTypeModel, blobs)
				})

				archiveDownloadPromises.set(archiveId, storePromise)
				await storePromise
			}

			storedBlobJson = await retrieveBlob()
		} else {
			storedBlobJson = internalBlob
		}

		if (storedBlobJson == null) {
			return null
		}
		const mailSessionKey = assertNotNull(await this.crypto.resolveSessionKey(mail))
		const mailDetails = await this.instancePipeline.decryptAndMap<MailDetailsBlob>(storedBlobJson, mailSessionKey)
		const attachments = await this.mailFacade.loadAttachments(mail)

		return {
			mail,
			mailDetails: mailDetails.details,
			attachments,
		} satisfies MailWithDetailsAndAttachments
	}

	private processIndexQueue() {
		if (this.currentlyIndexingPromise != null || this.abortController.signal.aborted) {
			// we do not want to resume indexing (even for imported emails) if the user manually cancelled
			return
		}

		this.currentlyIndexingPromise = (async () => {
			try {
				while (isNotEmpty(this.indexTasks)) {
					await abortAware(this.abortController, assertNotNull(this.indexTasks.shift()))
				}
			} catch (e) {
				// clear queue (prevents memory usage)
				this.indexTasks = []

				const update = this.createSearchIndexStateInfo(0)
				if (e instanceof CancelledError) {
					console.log("Mail indexing cancelled finally!")
					update.error = null
				} else {
					console.warn("Mail indexing failed: ", e)
					update.error = e instanceof ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown
					update.failedIndexingUpTo = e instanceof ConnectionError ? this.currentIndexTimestamp : null
				}
				await this.infoMessageHandler.onSearchIndexStateUpdate(update)
			} finally {
				this.currentlyIndexingPromise = null
			}
		})()
	}

	async waitForIndex(): Promise<void> {
		await this.currentlyIndexingPromise
	}

	private async processImport(importList: Id) {
		// First get the queue...
		let latestId: Id | null = await this.offlineStoragePersistence.getImportQueueProgress(importList)
		if (latestId == null) {
			return
		}

		const importedMails = await this.entityClient.loadAll(ImportedFileMailTypeRef, importList)
		const importedMailEntryIds = importedMails.map((importedMail) => importedMail.mailSetEntry)

		// This must all be in the same list
		const listId = listIdPart(getFirstOrThrow(importedMailEntryIds))
		const entries = await this.entityClient.loadMultiple(MailSetEntryTypeRef, listId, importedMailEntryIds.map(elementIdPart))

		let mailIds = entries
			.map((entries) => entries.mail)
			.filter((a) => compareNewestFirst(elementIdPart(a), latestId, EntityIdEncoding.Base64Ext) > 0)
			.sort((a, b) => compareNewestFirst(elementIdPart(a), elementIdPart(b), EntityIdEncoding.Base64Ext))

		// Can happen if we finished but the app closed before this was called
		if (isEmpty(mailIds)) {
			await this.offlineStoragePersistence.removeImportQueueEntry(importList)
			return
		}

		let indexedMailCount = 0
		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(1, indexedMailCount))

		const archiveDownloadPromises = new Map()

		for (const chunk of splitInChunks(INDEX_CHUNK_SIZE, mailIds)) {
			const idsGrouped = groupByAndMap(chunk, listIdPart, elementIdPart)
			const mails = await promiseMap(idsGrouped, async ([list, elements]) => {
				return await this.entityClient.loadMultiple(MailTypeRef, list, elements)
			})
			await this.indexNonRecentMails(mails.flat(), archiveDownloadPromises, async () => {
				const update = this.createSearchIndexStateInfo(Math.max(1, (indexedMailCount / mailIds.length) * 100), indexedMailCount++)
				await this.infoMessageHandler.onSearchIndexStateUpdate(update)
			})

			const latestMail = elementIdPart(lastThrow(chunk))
			await this.offlineStoragePersistence.updateImportQueueProgress(importList, latestMail)
		}

		await this.offlineStoragePersistence.removeImportQueueEntry(importList)
		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(0, indexedMailCount))
		await this.offlineStoragePersistence.clearEncryptedMailDetailsBlobs()
	}

	async rebuildIndex(user: User): Promise<void> {
		await this.offlineStoragePersistence.resetMailIndex()
		await this.extendMailIndex(user)
	}

	async processEntityEvents(): Promise<void> {
		// no-op
	}

	async beforeImportedMailFinished(importedMailsList: Id): Promise<void> {
		// in case we never get around to importing, persist our queue
		await this.offlineStoragePersistence.enqueueImport(importedMailsList)

		// append to current index queue (unless the user cancelled indexing)
		if (!this.abortController.signal.aborted) {
			this.indexTasks.push(() => this.processImport(importedMailsList))
			this.processIndexQueue()
		}
	}

	cancelMailIndexing(): void {
		this.abortController.abort(MailIndexingAbortReason.Cancelled)
	}
}
