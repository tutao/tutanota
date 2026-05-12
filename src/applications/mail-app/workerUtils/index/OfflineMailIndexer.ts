import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { MailIndexer, MailIndexerNewMailDownloader } from "./MailIndexer"
import { assertWorkerOrNode, FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "@tutao/app-env"
import { BlobFacade } from "../../../common/api/worker/facades/lazy/BlobFacade"
import { assertNotNull, difference, filterInt, getFirstOrThrow, groupByAndMap, isEmpty, lastThrow, LazyLoaded, promiseMap, splitInChunks } from "@tutao/utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { CryptoMapper, EntityAdapter, ModelMapper, ServerTypeModelResolver } from "@tutao/instance-pipeline"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler"
import { SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { elementIdPart, GENERATED_MIN_ID, getElementId, listIdPart, OperationType, ServerModelEncryptedParsedInstance, ServerTypeModel } from "@tutao/meta"
import {
	ImportedMailTypeRef,
	ImportMailStateTypeRef,
	Mail,
	MailBag,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ImportStatus } from "../../../../entities/tutanota/Utils"
import { User } from "@tutao/entities/sys"
import { GroupType } from "../../../../entities/sys/Utils"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { validateKdfNonceLength } from "@tutao/crypto"

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
		private readonly modelMapper: ModelMapper,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly newMailDownloader: MailIndexerNewMailDownloader,
		private readonly cryptoMapper: CryptoMapper,
		private readonly entityAdapterFactory: (model: ServerTypeModel, blob: ServerModelEncryptedParsedInstance) => Promise<EntityAdapter>,
	) {}

	private fullyIndexed: boolean = false
	private currentlyIndexingPromise: Promise<void> | null = null

	get currentIndexTimestamp(): number {
		return this.fullyIndexed ? FULL_INDEXED_TIMESTAMP : NOTHING_INDEXED_TIMESTAMP
	}

	async init(): Promise<void> {}

	get mailIndexingEnabled(): boolean {
		// mail indexing is always enabled
		return true
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

	async processEntityEvents(events: readonly EntityUpdateData[]): Promise<void> {
		for (const event of events) {
			if (isUpdateForTypeRef(ImportMailStateTypeRef, event)) {
				// we can only process create and update events (create is because of EntityEvent optimization
				// (CREATE + UPDATE = CREATE) which requires us to process CREATE events with imported mails)
				if (event.operation === OperationType.CREATE || event.operation === OperationType.UPDATE) {
					const importMailState = await this.entityClient.load(ImportMailStateTypeRef, [event.instanceListId, event.instanceId])
					const status = filterInt(importMailState.status) as ImportStatus
					if (status !== ImportStatus.Finished && status !== ImportStatus.Canceled) {
						continue
					}

					const importedMails = await this.entityClient.loadAll(ImportedMailTypeRef, importMailState.importedMails)
					if (isEmpty(importedMails)) {
						continue
					}

					const importedMailEntryIds = importedMails.map((importedMail) => importedMail.mailSetEntry)

					// This must all be in the same list
					const listId = listIdPart(getFirstOrThrow(importedMailEntryIds))
					const entries = await this.entityClient.loadMultiple(MailSetEntryTypeRef, listId, importedMailEntryIds.map(elementIdPart))
					const mailIds = entries.map((entries) => entries.mail)

					// Chain this onto the current indexing, if any
					this.currentlyIndexingPromise = (this.currentlyIndexingPromise || Promise.resolve())
						.then(async () => {
							// if this is interrupted, we need to trigger an index
							await this.offlineStoragePersistence.updateIndexingTimestamp(assertNotNull(importMailState._ownerGroup), NOTHING_INDEXED_TIMESTAMP)

							let indexedMailCount = 0
							await this.infoMessageHandler.onSearchIndexStateUpdate({
								initializing: false,
								mailIndexEnabled: this.mailIndexingEnabled,
								progress: 1,
								currentMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
								aimedMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
								indexedMailCount,
								failedIndexingUpTo: null,
							})

							const archiveDownloadPromises = new Map()

							for (const chunk of splitInChunks(INDEX_CHUNK_SIZE, mailIds)) {
								const idsGrouped = groupByAndMap(chunk, listIdPart, elementIdPart)
								const mails = await promiseMap(idsGrouped, async ([list, elements]) => {
									return await this.entityClient.loadMultiple(MailTypeRef, list, elements)
								})
								await this.indexNonRecentMails(mails.flat(), archiveDownloadPromises, async () => {
									await this.infoMessageHandler.onSearchIndexStateUpdate({
										initializing: false,
										mailIndexEnabled: this.mailIndexingEnabled,
										indexedMailCount: indexedMailCount++,
										progress: Math.max(1, (indexedMailCount / mailIds.length) * 100),
										currentMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
										aimedMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
										failedIndexingUpTo: null,
									})
								})
							}

							await this.infoMessageHandler.onSearchIndexStateUpdate({
								initializing: false,
								mailIndexEnabled: this.mailIndexingEnabled,
								progress: 0,
								currentMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
								aimedMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
								indexedMailCount,
								failedIndexingUpTo: null,
							})

							await this.offlineStoragePersistence.updateIndexingTimestamp(assertNotNull(importMailState._ownerGroup), FULL_INDEXED_TIMESTAMP)
							await this.offlineStoragePersistence.clearEncryptedMailDetailsBlobs()
						})
						.then(() => {
							this.currentlyIndexingPromise = null
						})

					await this.currentlyIndexingPromise
				}
			}
		}
	}

	async rebuildIndex(user: User): Promise<void> {
		await this.offlineStoragePersistence.resetMailIndex()
		await this.extendMailIndex(user)
	}

	async extendMailIndex(user: User): Promise<void> {
		if (this.currentlyIndexingPromise == null) {
			this.currentlyIndexingPromise = this.fullyIndexUser(user).then(() => {
				this.currentlyIndexingPromise = null
			})
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

		const indexedMailGroups = indexedGroups
			.filter((group) => group.type === GroupType.Mail && group.indexedTimestamp === FULL_INDEXED_TIMESTAMP)
			.map((group) => group.groupId)

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
				const update: SearchIndexStateInfo = {
					initializing: false,
					mailIndexEnabled: this.mailIndexingEnabled,
					progress: Math.max(progress * 100, 1),
					currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
					aimedMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
					indexedMailCount,
					failedIndexingUpTo: null,
				}

				await this.infoMessageHandler.onSearchIndexStateUpdate(update)
			}

			await updateProgress(0)

			let indexedMailboxes = 0
			for (const group of mailGroupsToAdd) {
				const baseProgress = indexedMailboxes / totalMailboxes
				const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, group)
				const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
				await this.indexMailbox(mailbox, async (mailboxProgress, newMailsIndexed) => {
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
		await this.infoMessageHandler.onSearchIndexStateUpdate({
			initializing: false,
			mailIndexEnabled: this.mailIndexingEnabled,
			progress: 0,
			currentMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
			aimedMailIndexTimestamp: FULL_INDEXED_TIMESTAMP,
			indexedMailCount,
			failedIndexingUpTo: null,
		})
		await this.offlineStoragePersistence.clearEncryptedMailDetailsBlobs()
	}

	private async indexMailbox(mailbox: MailBox, mailboxProgress: (mailboxProgress: number, newMailsIndexed?: number) => Promise<unknown>) {
		const allMailBags = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags]
		const totalMailbags = allMailBags.length
		let indexedMailbags = 0
		for (const mailbag of allMailBags) {
			await this.indexMailbag(mailbag, async (newMailsIndexed, currentMailbagMailsDownloaded) => {
				// We don't know how many mails a user has in a mailbox, so this curve actually never reaches 1 (but
				// reaches ~99.98% after 5000 mails)
				//
				// This shows the user there is progress even it isn't known how long until it's finished.
				const currentMailbagDownloadedPartialProgress = 1 - 5000 ** (-currentMailbagMailsDownloaded / 5000)
				await mailboxProgress((indexedMailbags + currentMailbagDownloadedPartialProgress) / totalMailbags, newMailsIndexed)
			})
			indexedMailbags += 1
		}
	}

	private async indexMailbag(mailbag: MailBag, updateStorageProgress: (newMailsIndexed: number, currentMailbagMailsDownloaded: number) => Promise<unknown>) {
		let currentId = GENERATED_MIN_ID

		const archiveDownloadPromises = new Map()
		let totalMailsDownloaded = 0

		while (true) {
			const mails = await this.entityClient.loadRange(MailTypeRef, mailbag.mails, currentId, INDEX_CHUNK_SIZE, false)
			if (isEmpty(mails)) {
				return
			}
			currentId = getElementId(lastThrow(mails))
			await this.indexNonRecentMails(mails, archiveDownloadPromises, async () => {
				await updateStorageProgress(1, totalMailsDownloaded++)
			})
		}
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
		if (mail.mailDetailsDraft != null) {
			return await this.newMailDownloader(mail._id)
		}

		const mailDetailsBlobId = assertNotNull(mail.mailDetails)

		const retrieveBlob = () => {
			return this.offlineStoragePersistence.retrieveEncryptedMailDetailsBlob(mailDetailsBlobTypeModel, elementIdPart(mailDetailsBlobId))
		}

		let blob: ServerModelEncryptedParsedInstance | null

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
				const storePromise = this.blobFacade
					.downloadFullEncryptedBlobElementEntityArchive(MailDetailsBlobTypeRef, listIdPart(mailDetailsBlobId))
					.then(async (blobs) => {
						await this.offlineStoragePersistence.storeEncryptedMailDetailsBlobs(mailDetailsBlobTypeModel, blobs)
					})
				archiveDownloadPromises.set(archiveId, storePromise)
				await storePromise
			}

			blob = await retrieveBlob()
		} else {
			blob = internalBlob
		}

		if (blob == null) {
			return null
		}

		const mailSessionKey = assertNotNull(await this.crypto.resolveSessionKey(mail))
		const entityAdapter = await this.entityAdapterFactory(mailDetailsBlobTypeModel, blob)
		const mailDetailsUnmapped = await this.cryptoMapper.decryptParsedInstance(
			mailDetailsBlobTypeModel,
			entityAdapter.encryptedParsedInstance as ServerModelEncryptedParsedInstance,
			mailSessionKey,
			validateKdfNonceLength(entityAdapter._kdfNonce),
			this.cryptoMapper.makeOwnerKeyProvider(entityAdapter._ownerGroup),
		)

		const mailDetails = await this.modelMapper.mapToInstance<MailDetailsBlob>(MailDetailsBlobTypeRef, mailDetailsUnmapped)
		const attachments = await this.mailFacade.loadAttachments(mail)

		return {
			mail,
			mailDetails: mailDetails.details,
			attachments,
		}
	}
}
