import { IndexedGroupData, OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { abortAware, MailIndexer, MailIndexerNewMailDownloader, MailIndexingAbortReason } from "./MailIndexer"
import { CancelledError, EnvProvider, FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "@tutao/app-env"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade"
import {
	assertNotNull,
	collectToMap,
	deduplicate,
	difference,
	getFirstOrThrow,
	groupByAndMap,
	isEmpty,
	isNotEmpty,
	isNotNull,
	lastThrow,
	LazyLoaded,
	promiseMap,
	splitInChunks,
} from "@tutao/utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { DecryptedParsedInstance, InstancePipeline, ServerTypeModelResolver } from "@tutao/instance-pipeline"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler"
import { IndexingErrorReason, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import {
	compareNewestFirst,
	compareOldestFirst,
	constructMailSetEntryId,
	elementIdPart,
	EntityIdEncoding,
	firstBiggerThanSecondBase64Ext,
	GENERATED_MAX_ID,
	getElementId,
	idToElementId,
	isSameId,
	listIdPart,
	ServerTypeModel,
	TypeRef,
} from "@tutao/meta"
import {
	FileTypeRef,
	ImportedFileMailTypeRef,
	ImportedImapMailTypeRef,
	Mail,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailSetEntryTypeRef,
	MailSetTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { User } from "@tutao/entities/sys"
import { ArchiveDataType, GroupType } from "../../../../entities/sys/Utils"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { ConnectionError, NotAuthorizedError } from "@tutao/rest-client/error"
import { IncomingServerJson } from "../../../../platform-kit/instance-pipeline/TypeMapper"
import { CommonImportedMail } from "./WebMailIndexer"
import { MailImportType, MailSetKind } from "../../../../entities/tutanota/Utils"
import { isDraft } from "../../mail/model/MailChecks"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import type { CacheStorage } from "../../../../app-kit/local-store/CacheStorage"

EnvProvider.assertWorkerOrNode()

const TAG = "[OfflineMailIndexer]"

// we do not want to bump this up any higher, as it determines how big our range requests are, and we can potentially
// break MAX_SAFE_SQL_VARS
const INDEX_CHUNK_SIZE = 1000

// the portion of the progress bar reserved for preloading archives
const PRELOAD_PROGRESS_PORTION: number = 0.25

interface MailWithDetailsAndAttachmentsBlob extends MailWithDetailsAndAttachments {
	/**
	 * This will not be set if the blob is already cached or the mail is a draft
	 */
	incomingMailDetailsBlob?: DecryptedParsedInstance
}

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
		private readonly cacheStorage: CacheStorage,
		private readonly indexChunkSize: number = INDEX_CHUNK_SIZE,
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
				this.indexTasks.push(() => this.processImport(entry.listId, entry.mailImportType))
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

		const start = performance.now()

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

				await this.indexMailbox(data, mailbox, async (fraction: number, newMailsIndexed: number) => {
					indexedMailCount += newMailsIndexed
					const progress = baseProgress + fraction / totalMailboxes
					await updateProgress(progress)
				})

				await this.offlineStoragePersistence.updateIndexingTimestamp(group, FULL_INDEXED_TIMESTAMP)

				indexedMailboxes += 1
			}

			const indexEnd = performance.now()

			console.log(TAG, `Indexed ${mailGroupsToAdd.length} mailbox(es) and ${indexedMailCount} mail(s) in ${indexEnd - indexStart} ms`)
		}

		console.log(TAG, `Updating UI...`)
		this.fullyIndexed = true
		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(0, indexedMailCount))
		const end = performance.now()
		console.log(TAG, `Fully indexed (took ${end - start} ms). Cleaning up...`)
		await this.offlineStoragePersistence.clearEncryptedMailDetailsBlobs()
		const cleanupEnd = performance.now()
		console.log(TAG, `Cleaned up and fully indexed (took ${cleanupEnd - end} ms)`)
	}

	private async indexMailbox(groupData: IndexedGroupData, mailbox: MailBox, mailboxProgress: (fraction: number, indexedMails: number) => Promise<unknown>) {
		console.log(TAG, `Began indexing mail group ${mailbox._id}`)

		const indexStart = performance.now()

		const allArchives = await this.preloadEncryptedArchivesForGroup(assertNotNull(mailbox._ownerGroup), (fraction: number) =>
			mailboxProgress(PRELOAD_PROGRESS_PORTION * fraction, 0),
		)

		let estimatedMailsWithBlobs = await this.offlineStoragePersistence.estimateTotalBlobCountForArchives(groupData.groupId, allArchives)
		let totalMailsIndexedWithBlobs = 0
		let totalMailsIndexed = 0

		console.log(TAG, `Estimated remaining number of mails with blobs for mail group ${mailbox._ownerGroup}:`, estimatedMailsWithBlobs)

		// Sort in reverse order to keep a consistent list
		const allMailBags = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags]
			.map((a) => a.mails)
			.sort((a, b) => compareNewestFirst(a, b, EntityIdEncoding.Base64Ext))

		for (const mailList of allMailBags) {
			if (groupData.lastIndexedEntityListId === mailList || !firstBiggerThanSecondBase64Ext(mailList, groupData.lastIndexedEntityListId)) {
				const startingId = groupData.lastIndexedEntityListId === mailList ? groupData.lastIndexedEntityElementId : GENERATED_MAX_ID
				console.log(TAG, `Indexing mailbag with mail list ${mailList}`)
				const indexMailbagStart = performance.now()
				await this.indexMailbag(groupData.groupId, mailList, startingId, async (newMailsWithBlobsIndexed, newMailsIndexed) => {
					totalMailsIndexedWithBlobs = totalMailsIndexedWithBlobs + newMailsWithBlobsIndexed
					newMailsIndexed += newMailsIndexed

					// We may be slightly off on our estimate (such as when resuming, especially if drafts were already indexed)
					const totalCapped = Math.min(totalMailsIndexedWithBlobs, estimatedMailsWithBlobs)
					if (totalCapped === 0) {
						await mailboxProgress(PRELOAD_PROGRESS_PORTION, newMailsIndexed)
					} else {
						await mailboxProgress(
							PRELOAD_PROGRESS_PORTION + (totalCapped / estimatedMailsWithBlobs) * (1 - PRELOAD_PROGRESS_PORTION),
							newMailsIndexed,
						)
					}
				})
				const indexMailbagEnd = performance.now()
				console.log(TAG, `Finished indexing mail list ${mailList} (took ${indexMailbagEnd - indexMailbagStart} ms)`)
			}
		}

		const indexEnd = performance.now() - indexStart
		console.log(
			TAG,
			`Finished indexing mail group ${mailbox._id}; indexed ${totalMailsIndexed} mail(s) (${totalMailsIndexedWithBlobs} with blob(s)) in ${indexEnd} ms`,
		)
	}

	/**
	 * @return a list of all archives
	 */
	private async preloadEncryptedArchivesForGroup(mailGroupId: Id, onArchivePreloaded?: (partialProgressFraction: number) => Promise<unknown>): Promise<Id[]> {
		const allArchives = await this.blobFacade.enumerateArchivesForGroup(mailGroupId, ArchiveDataType.MailDetails)

		// if the user simply hits the reindex button, we don't want to go and redownload archives...
		const archivesAlreadyStored = await this.offlineStoragePersistence.getDownloadedArchives()
		let totalArchivesPreloaded = archivesAlreadyStored.length

		const remainder = difference(allArchives, archivesAlreadyStored)
		if (isEmpty(remainder)) {
			await onArchivePreloaded?.(1)
		} else {
			await this.preloadArchives(remainder, async () => {
				if (++totalArchivesPreloaded >= allArchives.length) {
					await onArchivePreloaded?.(1)
				} else {
					await onArchivePreloaded?.(totalArchivesPreloaded / allArchives.length)
				}
			})
		}

		return allArchives
	}

	/**
	 * @return total blob count
	 * @private
	 */
	private async preloadArchives(archivesNeeded: readonly Id[], onArchivePreloaded?: () => Promise<unknown>): Promise<void> {
		const mailDetailsBlobTypeModel = await this.mailDetailsBlobTypeModel.getAsync()
		const archivesToLoad = deduplicate(archivesNeeded)

		if (isEmpty(archivesToLoad)) {
			console.log(TAG, "No archives to preload")
		} else {
			console.log(TAG, `Preloading ${archivesToLoad.length} archive(s)`)
			const everythingStart = performance.now()
			for (const archiveId of archivesToLoad) {
				console.log(TAG, `Downloading archive ${archiveId}...`)
				await abortAware(this.abortController, async () => {
					const downloadStart = performance.now()
					const blobs = await this.blobFacade.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, archiveId)
					const downloadEnd = performance.now()
					console.log(
						TAG,
						`Finished downloading archive ${archiveId} (${blobs.length} blob(s), took ${downloadEnd - downloadStart} ms), storing in offline db...`,
					)
					await this.offlineStoragePersistence.storeEncryptedMailDetailsBlobs(mailDetailsBlobTypeModel, blobs)

					// we know for sure we have the full archive now, so we do not want to redownload it even if we cancel right now
					await this.offlineStoragePersistence.markArchiveAsDownloaded(archiveId)
					const storeEnd = performance.now()
					console.log(TAG, `Finished storing archive ${archiveId} in offline db (took ${storeEnd - downloadEnd} ms)`)
				})
				await onArchivePreloaded?.()
			}

			const everythingEnd = performance.now()
			console.log(TAG, `Preloaded ${archivesToLoad.length} archive(s) (took ${everythingEnd - everythingStart} ms)`)
		}
		console.log("Preloading complete")
	}

	private async indexMailbag(
		mailGroup: Id,
		mailList: Id,
		startingId: Id,
		updateStorageProgress: (newMailsWithBlobsIndexed: number, newMailsIndexed: number) => Promise<unknown>,
	) {
		let currentId = startingId

		let mails: Mail[] = []
		while (!this.abortController.signal.aborted) {
			try {
				mails = await this.entityClient.loadRange(MailTypeRef, mailList, currentId, this.indexChunkSize, true)
			} catch (e) {
				if (e instanceof NotAuthorizedError) {
					console.warn("NotAuthorized: ", e)
					return
				} else {
					throw e
				}
			}

			if (isEmpty(mails)) {
				return
			}

			// Load all files into cache (we should be able to retrieve these later if we are successful) so we don't
			// have network requests for each email with attachments later
			const attachmentIds: IdTuple[] = mails.flatMap((mails) => mails.attachments)
			await loadMultipleFromLists(FileTypeRef, this.entityClient, attachmentIds)

			// Attempt to get all blobs from storage
			//
			// Of course, we want to do this in chunks to reduce IPC calls.
			const mailDetailsBlobIds = mails.map((mail) => mail.mailDetails).filter(isNotNull)
			const archives = groupByAndMap(mailDetailsBlobIds, listIdPart, elementIdPart)
			const mailDetailsBlobs: Map<Id, MailDetailsBlob> = new Map()
			for (const [list, blobIds] of archives.entries()) {
				const localBlobs = await this.cacheStorage.provideMultiple(MailDetailsBlobTypeRef, list, blobIds)
				for (const b of localBlobs) {
					mailDetailsBlobs.set(getElementId(b), b)
				}
			}

			const lastMail = lastThrow(mails)
			currentId = getElementId(lastMail)
			const { mailsIndexed, mailsWithBlobsIndexed } = await this.indexNonRecentMails(mails, mailDetailsBlobs)
			await this.offlineStoragePersistence.updateIndexingElement(mailGroup, lastMail._id)
			await updateStorageProgress(mailsWithBlobsIndexed, mailsIndexed)
		}

		// abort signal reached; rethrow cancellation error
		throw this.abortController.signal.reason
	}

	private async indexNonRecentMails(
		mails: readonly Mail[],
		cachedMailDetailsBlobs: Map<Id, MailDetailsBlob>,
	): Promise<{ mailsWithBlobsIndexed: number; mailsIndexed: number }> {
		const mailDetailsBlobTypeModel = await this.mailDetailsBlobTypeModel.getAsync()

		const mailsToStore: MailWithDetailsAndAttachmentsBlob[] = []
		await promiseMap(
			mails,
			async (mail) => {
				const data = await this.loadNonRecentMail(mail, mailDetailsBlobTypeModel, cachedMailDetailsBlobs)
				if (data != null) {
					mailsToStore.push(data)
				}
			},
			{ concurrency: 10 },
		)

		if (!isEmpty(mailsToStore)) {
			const mailDetailsBlobs = mailsToStore.map(({ incomingMailDetailsBlob }) => incomingMailDetailsBlob).filter(isNotNull)

			if (!isEmpty(mailDetailsBlobs)) {
				await this.cacheStorage.putMultiple(MailDetailsBlobTypeRef, mailDetailsBlobs)
			}

			await this.offlineStoragePersistence.storeMailData(mailsToStore)
		}

		return {
			mailsIndexed: mailsToStore.length,
			mailsWithBlobsIndexed: mailsToStore.filter((mail) => mail.mail.mailDetails != null).length,
		}
	}

	private async loadNonRecentMail(
		mail: Mail,
		mailDetailsBlobTypeModel: ServerTypeModel,
		cachedMailDetailsBlobs: Map<Id, MailDetailsBlob>,
	): Promise<MailWithDetailsAndAttachmentsBlob | null> {
		if (isDraft(mail)) {
			return await this.newMailDownloader(mail._id)
		}

		const mailDetailsBlobId = assertNotNull(mail.mailDetails)
		const attachments = await this.mailFacade.loadAttachments(mail)

		// if the blob is already stored, we don't want to reload it (or recache it)
		const cachedMailDetailsBlob = cachedMailDetailsBlobs.get(elementIdPart(mailDetailsBlobId))
		if (cachedMailDetailsBlob != null) {
			return {
				mail,
				mailDetails: cachedMailDetailsBlob.details,
				attachments,
			}
		}

		// Get the mail details blob cached from persistence
		let storedBlobJson: IncomingServerJson | null = await this.offlineStoragePersistence.retrieveEncryptedMailDetailsBlob(
			mailDetailsBlobTypeModel,
			elementIdPart(mailDetailsBlobId),
		)

		// Fallback if somehow we didn't archive this mail
		if (storedBlobJson == null) {
			return await this.newMailDownloader(mail._id)
		}

		try {
			const mailSessionKey = assertNotNull(await this.crypto.resolveSessionKey(mail))
			const json = await this.instancePipeline.typeMapper.parseServerJson(storedBlobJson)
			const mailDetails = await this.instancePipeline.decryptAndMapEncryptedInstanceParsed<MailDetailsBlob>(json, mailSessionKey)
			return {
				mail,
				mailDetails: mailDetails.instance.details,
				attachments,
				incomingMailDetailsBlob: mailDetails.decryptedParsedInstance,
			} satisfies MailWithDetailsAndAttachmentsBlob
		} catch (e) {
			// Usually we should be able to resolve the session key, but some emails are permanently stuck in this state
			// due to being corrupted.
			if (e instanceof CryptoError || e instanceof SessionKeyNotFoundError) {
				console.warn(`Decryption error when trying to index mail ${mail._id} (skipping):`, e)
				return null
			} else {
				console.error(`Error when trying to load mail ${mail._id} for indexing:`, e)
				throw e
			}
		}
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

	private async processImport(importList: Id, mailImportType: MailImportType) {
		// First get the queue...
		let latestCommonImportedMailElementId: Id | null = await this.offlineStoragePersistence.getImportQueueProgress(importList)
		if (latestCommonImportedMailElementId == null) {
			return
		}
		const typeRef = (mailImportType === MailImportType.FileImport ? ImportedFileMailTypeRef : ImportedImapMailTypeRef) as TypeRef<CommonImportedMail>
		const importedMails = await this.entityClient.loadAll(typeRef, importList, latestCommonImportedMailElementId)
		console.log(TAG, `Processing import of ${importedMails.length} new ${mailImportType} mails...`)
		if (isEmpty(importedMails)) {
			return
		}

		const zippedImportedIds = importedMails.map((importedMail) => {
			return {
				mailSetEntryElementId: elementIdPart(importedMail.mailSetEntry),
				commonImportedMailElementId: elementIdPart(importedMail._id),
			}
		})

		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(assertNotNull(getFirstOrThrow(importedMails)._ownerGroup)))
		const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
		const mailSets = await this.entityClient.loadAll(MailSetTypeRef, mailbox.mailSets.mailSets)
		const importedMailSet = assertNotNull(mailSets.find((mailSet) => mailSet.folderType === MailSetKind.IMPORTED))

		// Only mailSetEntry guaranteed to be there as long as the mail is there is the one on the entries list of the IMPORTED mail set,
		// the mailSetEntry referenced by the ImportedMail could already be deleted from our database if the user already moved the mail.
		const importedMailSetEntryListId = importedMailSet.entries
		const entries = await this.entityClient.loadMultiple(
			MailSetEntryTypeRef,
			importedMailSetEntryListId,
			zippedImportedIds.map((metaData) => metaData.mailSetEntryElementId),
		)

		let mailIds = entries.map((entries) => entries.mail).sort((a, b) => compareOldestFirst(elementIdPart(a), elementIdPart(b), EntityIdEncoding.Base64Ext))

		// Can happen if we finished but the app closed before this was called
		if (isEmpty(mailIds)) {
			await this.offlineStoragePersistence.removeImportQueueEntry(importList)
			return
		}

		let indexedMailCount = 0
		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(1, indexedMailCount))

		for (const chunk of splitInChunks(this.indexChunkSize, mailIds)) {
			const idsGrouped = groupByAndMap(chunk, listIdPart, elementIdPart)
			const mails = await promiseMap(idsGrouped, async ([list, elements]) => {
				return await this.entityClient.loadMultiple(MailTypeRef, list, elements)
			})
			const mailsFlat = mails.flat()

			const allArchivesForThisChunk = mailsFlat
				.map((mail: Mail) => mail.mailDetails)
				.filter(isNotNull)
				.map(listIdPart)

			await this.preloadArchives(allArchivesForThisChunk)

			const { mailsIndexed } = await this.indexNonRecentMails(mailsFlat, new Map())
			indexedMailCount += mailsIndexed

			const update = this.createSearchIndexStateInfo(Math.max(1, (indexedMailCount / mailIds.length) * 100), indexedMailCount)
			await this.infoMessageHandler.onSearchIndexStateUpdate(update)

			const latestMailId = lastThrow(chunk)
			const latestMail = assertNotNull(mailsFlat.find((mail) => isSameId(mail._id, latestMailId)))
			const latestMailSetEntryElementId = constructMailSetEntryId(latestMail.receivedDate, elementIdPart(latestMail._id))
			const latestCommonImportedMailElementId = assertNotNull(
				zippedImportedIds.find((zippedIds) => isSameId(idToElementId(zippedIds.mailSetEntryElementId), idToElementId(latestMailSetEntryElementId))),
			).commonImportedMailElementId
			await this.offlineStoragePersistence.updateImportQueueProgress(importList, latestCommonImportedMailElementId, mailImportType)
		}

		await this.infoMessageHandler.onSearchIndexStateUpdate(this.createSearchIndexStateInfo(0, indexedMailCount))
		await this.offlineStoragePersistence.clearEncryptedMailDetailsBlobs()
	}

	async rebuildIndex(user: User): Promise<void> {
		await this.offlineStoragePersistence.resetMailIndex()
		await this.extendMailIndex(user)
	}

	async onEntityUpdatesReceived(): Promise<void> {
		// no-op
	}

	async beforeImportedMailFinished(importedMailsList: Id, mailImportType: MailImportType): Promise<void> {
		// in case we never get around to importing, persist our queue
		await this.offlineStoragePersistence.enqueueImport(importedMailsList, mailImportType)

		// append to current index queue (unless the user cancelled indexing)
		if (!this.abortController.signal.aborted) {
			this.indexTasks.push(() => this.processImport(importedMailsList, mailImportType))
			this.processIndexQueue()
		}
	}

	cancelMailIndexing(): void {
		this.abortController.abort(MailIndexingAbortReason.Cancelled)
	}

	async doInitialMailIndexing() {
		// no-op, initial indexing for sqlite search is done in MailIndexerPostLoginAction
	}

	async enableMailIndexing(): Promise<boolean> {
		// no-op, mail indexing is always enabled for sqlite search
		return true
	}
}
