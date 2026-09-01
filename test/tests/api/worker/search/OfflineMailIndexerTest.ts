import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, removeOriginals } from "../../../TestUtils"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { OfflineMailIndexer } from "../../../../../src/applications/mail-app/workerUtils/index/OfflineMailIndexer"
import { OfflineStoragePersistence } from "../../../../../src/applications/mail-app/workerUtils/index/OfflineStoragePersistence"
import { BlobFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/BlobFacade"
import { EntityRestClientMock } from "../rest/EntityRestClientMock"
import { InstancePipeline, TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"
import { InfoMessageHandler } from "../../../../../src/applications/common/gui/InfoMessageHandler"
import { MailIndexerNewMailDownloader } from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexer"
import { GroupMembershipTypeRef, User, UserTypeRef } from "@tutao/entities/sys"
import {
	compareOldestFirst,
	constructMailSetEntryId,
	CUSTOM_MIN_ID,
	elementIdPart,
	EntityIdEncoding,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getElementId,
	getListId,
	idToElementId,
	listIdPart,
	ServerTypeModel,
} from "../../../../../src/platform-kit/meta"
import {
	BodyTypeRef,
	File,
	FileTypeRef,
	ImportedFileMail,
	ImportedFileMailTypeRef,
	ImportedImapMail,
	ImportedImapMailTypeRef,
	Mail,
	MailBagTypeRef,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailSetRefTypeRef,
	MailSetTypeRef,
	MailTypeRef,
} from "@tutao/entities/tutanota"
import { func, matchers, object, verify, when } from "testdouble"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { ArchiveDataType, GroupType } from "../../../../../src/entities/sys/Utils"
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "../../../../../src/platform-kit/app-env"
import { MailWithDetailsAndAttachments } from "../../../../../src/applications/mail-app/workerUtils/index/MailIndexerBackend"
import { assertNotNull, collectToMap, deepEqual, last, stringToBase64UrlCustomId } from "../../../../../src/platform-kit/utils"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { aes256RandomKey } from "@tutao/crypto/symmetric-cipher-utils"
import { IncomingServerJson } from "../../../../../src/platform-kit/instance-pipeline/TypeMapper"
import { MailImportType, MailSetKind } from "../../../../../src/entities/tutanota/Utils"
import { CacheStorage } from "../../../../../src/app-kit/local-store/CacheStorage"
import { ArchiveDownloaderFacade, ArchiveDownloadRangeHeaders } from "../../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { Aes256Key } from "../../../../../src/platform-kit/crypto"

const TEST_INDEX_CHUNK_SIZE = 50
o.spec("OfflineMailIndexer", () => {
	let mailIndexer: OfflineMailIndexer
	let persistence: OfflineStoragePersistence
	let blobs: BlobFacade
	let mailFacade: MailFacade
	let entityRestClientMock: EntityRestClientMock
	let typeModelResolver: TypeModelResolver
	let realInstancePipeline: InstancePipeline
	let infoMessageHandler: InfoMessageHandler
	let crypto: CryptoFacade
	let newMailDownloader: MailIndexerNewMailDownloader
	let user: User
	const userId = "userId"
	const mailGroupId = "I'm a mail group!"
	const mailboxId = "I'm a mailbox!"
	const mailSetListId = "I'm a mail set list!"
	const mailBagMailListId = "---------z-z"

	const mailBox = createTestEntity(MailBoxTypeRef, {
		_id: idToElementId(mailboxId),
		_ownerGroup: mailGroupId,
		currentMailBag: createTestEntity(MailBagTypeRef, {
			mails: mailBagMailListId,
		}),
		mailSets: createTestEntity(MailSetRefTypeRef, {
			mailSets: mailSetListId,
		}),
	})
	const mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef, {
		_id: idToElementId(mailGroupId),
		mailbox: mailboxId,
	})
	const importedMailSet = createTestEntity(MailSetTypeRef, {
		_id: [mailBox.mailSets.mailSets, "imported mail set"],
		entries: "mailSetEntryList",
		folderType: MailSetKind.IMPORTED,
	})

	let mail: Mail
	let mailSetEntry: MailSetEntry
	let mailDetailsBlobModel: ServerTypeModel
	let cacheStorage: CacheStorage
	let archiveDownloader: ArchiveDownloaderFacade
	let storedBlobs: Map<Id, IncomingServerJson>

	o.beforeEach(async () => {
		typeModelResolver = clientInitializedTypeModelResolver()
		realInstancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		persistence = object()
		blobs = object()
		entityRestClientMock = new EntityRestClientMock()
		mailFacade = object()
		crypto = object()
		infoMessageHandler = object()
		cacheStorage = object()
		archiveDownloader = object()
		newMailDownloader = func<MailIndexerNewMailDownloader>()
		mailDetailsBlobModel = await typeModelResolver.resolveServerTypeReference(MailDetailsBlobTypeRef)

		mailIndexer = new OfflineMailIndexer(
			persistence,
			blobs,
			new EntityClient(entityRestClientMock, typeModelResolver),
			mailFacade,
			crypto,
			typeModelResolver,
			infoMessageHandler,
			newMailDownloader,
			realInstancePipeline,
			cacheStorage,
			archiveDownloader,
			TEST_INDEX_CHUNK_SIZE,
		)
		user = createTestEntity(UserTypeRef, {
			_id: idToElementId(userId),
		})
		mail = createTestEntity(
			MailTypeRef,
			{
				_id: [mailBagMailListId, "---------zzz"],
				_ownerGroup: mailGroupId,
			},
			{ populateAggregates: true },
		)

		mailSetEntry = createTestEntity(MailSetEntryTypeRef, {
			_id: ["mailSetEntryList", constructMailSetEntryId(mail.receivedDate, elementIdPart(mail._id))],
			mail: mail._id,
			_ownerGroup: mailGroupId,
		})

		storedBlobs = new Map()

		when(persistence.retrieveEncryptedMailDetailsBlob(matchers.anything(), matchers.anything())).thenDo(
			async (_, blobId) => storedBlobs.get(blobId) ?? null,
		)

		when(persistence.getLastLoadedArchiveForType(matchers.anything())).thenResolve(null)

		entityRestClientMock.addElementInstances(mailBox, mailboxGroupRoot)
		entityRestClientMock.addListInstances(importedMailSet)

		when(persistence.getImportQueueEntries()).thenResolve([])
	})

	function addTestMail() {
		entityRestClientMock.addListInstances(mail, mailSetEntry)
	}

	async function storeMailDetailsBlobs(detailBlobs: readonly MailDetailsBlob[], sk: Aes256Key) {
		await Promise.all(
			detailBlobs.map((blob) =>
				realInstancePipeline
					.mapAndEncrypt(MailDetailsBlobTypeRef, blob, sk)
					.then((encryptedBlob) =>
						storedBlobs.set(
							getElementId(blob),
							IncomingServerJson.expectSingleInstance(encryptedBlob.getJsonRepresentation(), mailDetailsBlobModel),
						),
					),
			),
		)
	}

	o.spec("afterMailUpdated", () => {
		o.test("non-draft", async () => {
			addTestMail()
			mail.mailDetails = ["whooooa", "i'm a blob :D"]
			await mailIndexer.afterMailUpdated(mail._id)
			verify(persistence.updateMailLocation(mail))
		})

		o.test("draft", async () => {
			addTestMail()
			const mailData = { mail } as any
			when(newMailDownloader(mail._id)).thenResolve(mailData)

			mail.mailDetailsDraft = ["whooooa", "i'm NOT a blob :D"]
			await mailIndexer.afterMailUpdated(mail._id)
			verify(persistence.storeMailData([mailData]))
		})
	})

	o.test("afterMailCreated", async () => {
		addTestMail()
		const mailData = { mail } as any
		when(newMailDownloader(mail._id)).thenResolve(mailData)
		await mailIndexer.afterMailCreated(mail._id)
		verify(persistence.storeMailData([mailData]))
	})

	o.spec("beforeMailDeleted", () => {
		o.test("non-cached mail", async () => {
			await mailIndexer.beforeMailDeleted(mail._id)
			verify(persistence.deleteMailData(mail._id))
			verify(persistence.deleteEncryptedBlob(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("cached draft", async () => {
			addTestMail()
			mail.mailDetailsDraft = ["whooooa", "i'm NOT a blob :D"]
			await mailIndexer.beforeMailDeleted(mail._id)
			verify(persistence.deleteMailData(mail._id))
			verify(persistence.deleteEncryptedBlob(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("cached non-draft", async () => {
			addTestMail()
			const archiveId = "whooooa"
			const blobId = "i'm a blob :D"
			mail.mailDetails = [archiveId, blobId]
			await mailIndexer.beforeMailDeleted(mail._id)
			verify(persistence.deleteMailData(mail._id))
			verify(persistence.deleteEncryptedBlob(MailDetailsBlobTypeRef, archiveId, blobId))
		})
	})

	o.test("index one mail initially", async () => {
		mail.mailDetails = ["whooooa", "i'm a blob :D"]

		when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())

		const mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
			_id: mail.mailDetails,
			details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
		})

		const sk = aes256RandomKey()
		when(blobs.enumerateArchivesForGroup(mailGroupId, ArchiveDataType.MailDetails)).thenResolve([listIdPart(mail.mailDetails)])
		when(blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails), archiveDownloader, null)).thenDo(async () => {
			await storeMailDetailsBlobs([mailDetails], sk)
		})

		addTestMail()

		const attachments = [
			createTestEntity(FileTypeRef, {
				name: `this is a file.txt`,
			}),
		]
		when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: NOTHING_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MAX_ID,
				lastIndexedEntityElementId: GENERATED_MAX_ID,
			},
		])
		when(cacheStorage.provideMultiple(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails), [elementIdPart(mail.mailDetails)])).thenResolve([])

		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]

		await mailIndexer.extendMailIndex(user)

		const storedMailData = matchers.captor()

		verify(persistence.storeMailData(storedMailData.capture()))

		const storedMails: Array<MailWithDetailsAndAttachments> = storedMailData.values![0]
		o.check(storedMails.length).equals(1)
		verify(cacheStorage.putMultiple(MailDetailsBlobTypeRef, [storedMails[0]["incomingMailDetailsBlob"]]))
		o.check(removeOriginals(storedMails[0].mail)).deepEquals(mail)
		o.check(removeOriginals(storedMails[0].mailDetails)).deepEquals(removeOriginals(mailDetails.details))
		o.check(storedMails[0].attachments.map(removeOriginals)).deepEquals(attachments)

		verify(persistence.updateIndexingTimestamp(mailGroupId, FULL_INDEXED_TIMESTAMP))
		verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
	})

	o.test("do not load data when group is fully indexed", async () => {
		const entityRestClient: EntityClient = object()
		mailIndexer = new OfflineMailIndexer(
			persistence,
			blobs,
			entityRestClient,
			mailFacade,
			crypto,
			typeModelResolver,
			infoMessageHandler,
			newMailDownloader,
			realInstancePipeline,
			cacheStorage,
			archiveDownloader,
			TEST_INDEX_CHUNK_SIZE,
		)

		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]
		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: FULL_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MIN_ID,
				lastIndexedEntityElementId: GENERATED_MIN_ID,
			},
		])

		await mailIndexer.extendMailIndex(user)

		verify(entityRestClient.load(matchers.anything(), matchers.anything()), { times: 0 })
		verify(entityRestClient.loadRange(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything()), {
			times: 0,
		})
		verify(blobs.enumerateArchivesForGroup(matchers.anything(), matchers.anything()), { times: 0 })
		verify(persistence.getLastLoadedArchiveForType(MailDetailsBlobTypeRef), { times: 0 })
		verify(blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, matchers.anything(), matchers.anything(), matchers.anything()), {
			times: 0,
		})
		verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
	})

	o.test("do not re-load already loaded archives", async () => {
		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]
		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: NOTHING_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MIN_ID,
				lastIndexedEntityElementId: GENERATED_MIN_ID,
			},
		])

		const rangeHeaders: ArchiveDownloadRangeHeaders = {
			rangeStart: 1,
			reprDigest: "hashBrownIsDelecious",
		}
		when(blobs.enumerateArchivesForGroup(mailGroupId, ArchiveDataType.MailDetails)).thenResolve(["archive-c", "archive-b", "archive-a", "archive-d"])
		when(persistence.getLastLoadedArchiveForType(MailDetailsBlobTypeRef)).thenResolve({
			archiveId: "archive-c",
			modelVersion: mailDetailsBlobModel.version,
			serverHostname: "blobtown.tuta.com",
		})
		when(persistence.getArchiveDownloadRangeHeaders("archive-c", MailDetailsBlobTypeRef, mailDetailsBlobModel.version)).thenResolve(rangeHeaders)

		await mailIndexer.extendMailIndex(user)

		const archivePreloadCaptor = matchers.captor()
		const resumeParamsCaptor = matchers.captor()

		verify(
			blobs.downloadAndStoreEncryptedBlobArchive(
				MailDetailsBlobTypeRef,
				archivePreloadCaptor.capture(),
				matchers.anything(),
				resumeParamsCaptor.capture(),
			),
			{ times: 2 },
		)
		o.check(archivePreloadCaptor.values).deepEquals(["archive-c", "archive-d"])
		o.check(resumeParamsCaptor.values).deepEquals([{ serverHostname: "blobtown.tuta.com", rangeHeaders }, null])
	})

	o.test("index one mail that was cached already", async () => {
		mail.mailDetails = ["whooooa", "i'm a blob :D"]

		when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())

		const mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
			_id: mail.mailDetails,
			details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
		})

		addTestMail()

		const attachments = [
			createTestEntity(FileTypeRef, {
				name: `this is a file.txt`,
			}),
		]
		when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: NOTHING_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MAX_ID,
				lastIndexedEntityElementId: GENERATED_MAX_ID,
			},
		])
		when(cacheStorage.provideMultiple(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails), [elementIdPart(mail.mailDetails)])).thenResolve([mailDetails])

		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]

		const archiveId = listIdPart(mail.mailDetails)
		const rangeHeaders: ArchiveDownloadRangeHeaders = {
			rangeStart: 1,
			reprDigest: "hashBrownIsDelecious",
		}

		when(blobs.enumerateArchivesForGroup(mailGroupId, ArchiveDataType.MailDetails)).thenResolve([archiveId])
		when(persistence.getArchiveDownloadRangeHeaders(archiveId, MailDetailsBlobTypeRef, mailDetailsBlobModel.version)).thenResolve(rangeHeaders)
		when(persistence.getLastLoadedArchiveForType(MailDetailsBlobTypeRef)).thenResolve({
			archiveId,
			serverHostname: "blobtown.tuta.com",
			modelVersion: mailDetailsBlobModel.version,
		})

		await mailIndexer.extendMailIndex(user)

		const storedMailData = matchers.captor()

		verify(persistence.storeMailData(storedMailData.capture()))

		const storedMails: Array<MailWithDetailsAndAttachments> = storedMailData.values![0]
		o.check(storedMails.length).equals(1)
		o.check(removeOriginals(storedMails[0].mail)).deepEquals(mail)
		o.check(removeOriginals(storedMails[0].mailDetails)).deepEquals(removeOriginals(mailDetails.details))
		o.check(storedMails[0].attachments.map(removeOriginals)).deepEquals(attachments)
		verify(cacheStorage.putMultiple(matchers.anything(), matchers.anything()), { times: 0 })
		verify(
			blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, archiveId, archiveDownloader, {
				serverHostname: "blobtown.tuta.com",
				rangeHeaders,
			}),
			{ times: 1 },
		)

		verify(persistence.updateIndexingTimestamp(mailGroupId, FULL_INDEXED_TIMESTAMP))
		verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
	})

	o.test("index 2000 mails", async () => {
		// two pages
		const mailCount = 2 * 1000

		const mails: MailWithDetailsAndAttachments[] = []
		const detailBlobs: MailDetailsBlob[] = []

		const archiveId = "WHOA, I store LOTS of cool stuff!"

		when(blobs.enumerateArchivesForGroup(mailGroupId, ArchiveDataType.MailDetails)).thenResolve([archiveId])

		for (let i = 0; i < mailCount; i++) {
			const mailDetails = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: [archiveId, `I am blob #${i}. FEAR ME!`],
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							body: createTestEntity(BodyTypeRef, {
								compressedText: `I am smol compressed text #${i}. You will INDEX me and you will LIKE it.`,
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)
			const mailMail = createTestEntity(
				MailTypeRef,
				{
					_id: [getListId(mail), `${i}`.padStart(GENERATED_MIN_ID.length, "0")],
					mailDetails: mailDetails._id,
				},
				{ populateAggregates: true },
			)
			const mailAttachments = [
				createTestEntity(
					FileTypeRef,
					{
						name: `mail_${i}.jxl`,
					},
					{ populateAggregates: true },
				),
			]
			mails.push({
				mailDetails: mailDetails.details,
				mail: mailMail,
				attachments: mailAttachments,
			})
			detailBlobs.push(mailDetails)
			entityRestClientMock.addListInstances(mailMail)
		}

		// adding a stub for every single mail is slow
		const mailsMap = collectToMap(mails, (m) => getElementId(m.mail))
		when(mailFacade.loadAttachments(matchers.anything())).thenDo((mailToFind: Mail) => {
			return Promise.resolve(assertNotNull(mailsMap.get(getElementId(mailToFind)), `no ${getElementId(mailToFind)}`).attachments)
		})
		when(cacheStorage.provideMultiple(MailDetailsBlobTypeRef, matchers.anything(), matchers.anything())).thenResolve([])

		const sk = aes256RandomKey()
		when(crypto.resolveSessionKey(matchers.anything())).thenResolve(sk)
		when(blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, archiveId, archiveDownloader, null)).thenDo(async () => {
			await storeMailDetailsBlobs(detailBlobs, sk)
		})

		when(persistence.getIndexedGroups()).thenResolve([
			{
				groupId: mailGroupId,
				type: GroupType.Mail,
				indexedTimestamp: NOTHING_INDEXED_TIMESTAMP,
				lastIndexedEntityListId: GENERATED_MAX_ID,
				lastIndexedEntityElementId: GENERATED_MAX_ID,
			},
		])

		user.memberships = [
			createTestEntity(GroupMembershipTypeRef, {
				group: mailGroupId,
				groupType: GroupType.Mail,
			}),
		]

		await mailIndexer.extendMailIndex(user)

		// note: getRange just gets everything with the mock, and we're not guaranteed (or likely) to store in order, so
		// we need to compare sorted
		const mailCaptor = matchers.captor()
		verify(persistence.storeMailData(mailCaptor.capture()))

		const allMailsStored: MailWithDetailsAndAttachments[] = mailCaptor
			.values!.flat()
			.toSorted((a, b) => compareOldestFirst(getElementId(a.mail), getElementId(b.mail), EntityIdEncoding.Base64Ext))

		const allBlobs = new Set()

		// was everything stored?
		o.check(
			deepEqual(
				allMailsStored.map((s): MailWithDetailsAndAttachments => {
					removeOriginals(s.mail)
					removeOriginals(s.mailDetails)
					allBlobs.add(assertNotNull(s["incomingMailDetailsBlob"]))
					return { mail: s.mail, mailDetails: s.mailDetails, attachments: s.attachments }
				}),
				mails,
			),
		).equals(true)

		// and were all blobs saved?
		const blobCaptor = matchers.captor()
		verify(cacheStorage.putMultiple(MailDetailsBlobTypeRef, blobCaptor.capture()))
		o.check(blobCaptor.values?.flat().every((a) => allBlobs.has(a))).equals(true)

		verify(persistence.updateIndexingTimestamp(mailGroupId, FULL_INDEXED_TIMESTAMP))
		verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
	})

	o.spec("import mails", () => {
		const archiveId = "archiveId"
		let importedMail: ImportedFileMail
		let mailDetails: MailDetailsBlob
		let attachments: File[]

		o.beforeEach(async () => {
			mail.mailDetails = [archiveId, "i'm a blob :D"]

			importedMail = createTestEntity(
				ImportedFileMailTypeRef,
				{
					_id: ["imported mails list", "an imported mail"],
					mailSetEntry: mailSetEntry._id,
					_ownerGroup: mailGroupId,
				},
				{ populateAggregates: true },
			)

			mailDetails = createTestEntity(MailDetailsBlobTypeRef, {
				_id: mail.mailDetails,
				details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
			})
			attachments = []

			when(mailFacade.loadAttachments(mail)).thenResolve(attachments)
			entityRestClientMock.addListInstances(importedMail)

			const sk = aes256RandomKey()
			when(persistence.getImportQueueProgress(listIdPart(importedMail._id))).thenResolve(GENERATED_MIN_ID)
			when(persistence.getLastLoadedArchiveForType(MailDetailsBlobTypeRef)).thenResolve(null)
			when(crypto.resolveSessionKey(matchers.anything())).thenResolve(sk)

			when(blobs.enumerateArchivesForGroup(mailGroupId, ArchiveDataType.MailDetails)).thenResolve([archiveId])
			when(blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, listIdPart(mail.mailDetails), archiveDownloader, null)).thenDo(async () => {
				await storeMailDetailsBlobs([mailDetails], sk)
			})

			addTestMail()
		})

		function createId(idText: string): string {
			return Array(13 - idText.length).join("-") + idText
		}

		function do_verify() {
			const storeMailData = matchers.captor()
			verify(persistence.storeMailData(storeMailData.capture()))
			const storedMails: Array<MailWithDetailsAndAttachments> = storeMailData.values![0]

			o.check(storedMails.length).equals(1)
			o.check(removeOriginals(storedMails[0].mail)).deepEquals(removeOriginals(mail))
			o.check(removeOriginals(storedMails[0].mailDetails)).deepEquals(removeOriginals(mailDetails.details))
			o.check(storedMails[0].attachments.map(removeOriginals)).deepEquals(attachments)

			verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
			verify(persistence.updateImportQueueProgress(listIdPart(importedMail._id), elementIdPart(importedMail._id), MailImportType.FileImport))
		}

		o.test("beforeImportedMailFinished", async () => {
			await mailIndexer.beforeImportedMailFinished(listIdPart(importedMail._id), MailImportType.FileImport)
			await mailIndexer.waitForIndex()
			do_verify()
		})

		o.test("resume", async () => {
			when(persistence.getIndexedGroups()).thenResolve([])
			when(persistence.getImportQueueEntries()).thenResolve([{ listId: listIdPart(importedMail._id), mailImportType: MailImportType.FileImport }])

			await mailIndexer.extendMailIndex(user)
			await mailIndexer.waitForIndex()
			do_verify()
		})

		o.test("indexes all mails when starting from beginning", async () => {
			const importList = "imported mails list"
			const mailImportType = MailImportType.ImapImport
			const totalMails = TEST_INDEX_CHUNK_SIZE * 5

			const mails: Mail[] = []
			const mailSetEntries: MailSetEntry[] = []
			const importedMails: ImportedImapMail[] = []

			for (let i = 1; i <= totalMails; i++) {
				const mailElementId = createId(i.toString())
				const mailId: IdTuple = [mailBagMailListId, mailElementId]
				const mailObj = createTestEntity(
					MailTypeRef,
					{
						_id: mailId,
						_ownerGroup: mailGroupId,
						receivedDate: new Date(2020, 1, i + 1),
						mailDetails: [archiveId, `blob${i}`],
					},
					{ populateAggregates: true },
				)
				mails.push(mailObj)

				const mailSetEntryId: IdTuple = ["mailSetEntryList", constructMailSetEntryId(mailObj.receivedDate, mailElementId)]
				const mailSetEntryObj = createTestEntity(MailSetEntryTypeRef, {
					_id: mailSetEntryId,
					mail: mailId,
					_ownerGroup: mailGroupId,
				})
				mailSetEntries.push(mailSetEntryObj)

				const importedMailId: IdTuple = [importList, stringToBase64UrlCustomId(i.toString())]
				const importedMailObj = createTestEntity(ImportedImapMailTypeRef, {
					_id: importedMailId,
					mailSetEntry: mailSetEntryId,
					_ownerGroup: mailGroupId,
				})
				importedMails.push(importedMailObj)
			}

			entityRestClientMock.addListInstances(...mails, ...mailSetEntries, ...importedMails)

			when(persistence.getImportQueueProgress(importList)).thenResolve(stringToBase64UrlCustomId("0"))

			when(persistence.getIndexedGroups()).thenResolve([])
			when(persistence.getImportQueueEntries()).thenResolve([{ listId: importList, mailImportType }])

			when(blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, archiveId, archiveDownloader, null)).thenDo(async () => {
				const sk = aes256RandomKey()
				const detailsBlobs = mails.map((mail) =>
					createTestEntity(
						MailDetailsBlobTypeRef,
						{
							_id: mail.mailDetails!,
							details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
						},
						{ populateAggregates: true },
					),
				)
				await storeMailDetailsBlobs(detailsBlobs, sk)
			})
			when(mailFacade.loadAttachments(matchers.anything())).thenResolve([])
			when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())

			await mailIndexer.beforeImportedMailFinished(importList, mailImportType)
			await mailIndexer.waitForIndex()

			const storeMailDataCaptor = matchers.captor()
			verify(persistence.storeMailData(storeMailDataCaptor.capture()))
			const storedMails = storeMailDataCaptor.values!.reduce((acc, val) => acc.concat(val), [])
			o.check(storedMails.length).equals(totalMails)

			const updateProgressCaptor = matchers.captor()
			verify(persistence.updateImportQueueProgress(importList, updateProgressCaptor.capture(), mailImportType))
			o.check(last(updateProgressCaptor.values!)).equals(elementIdPart(importedMails[totalMails - 1]._id))

			verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
			verify(persistence.removeImportQueueEntry(matchers.anything()), { times: 0 })
		})

		o.test("index initial mails and then index newly imported mails from where we left off", async () => {
			const listId = "imported mails list"
			const mailImportType = MailImportType.ImapImport
			const FIRST_BATCH = TEST_INDEX_CHUNK_SIZE * 10
			const SECOND_BATCH = TEST_INDEX_CHUNK_SIZE * 2
			const TOTAL_MAILS = FIRST_BATCH + SECOND_BATCH

			const mails: Mail[] = []
			const mailSetEntries: MailSetEntry[] = []
			const importedMails: ImportedImapMail[] = []

			const createMailInstances = (index: number) => {
				const mailElementId = createId(index.toString())
				const mailId: IdTuple = [mailBagMailListId, mailElementId]
				const mailObj = createTestEntity(
					MailTypeRef,
					{
						_id: mailId,
						_ownerGroup: mailGroupId,
						receivedDate: new Date(2020, 0, index), // sequential dates
						mailDetails: [archiveId, `blob${index}`],
					},
					{ populateAggregates: true },
				)
				mails.push(mailObj)

				const mailSetEntryId: IdTuple = ["mailSetEntryList", constructMailSetEntryId(mailObj.receivedDate, mailElementId)]
				const mailSetEntryObj = createTestEntity(MailSetEntryTypeRef, {
					_id: mailSetEntryId,
					mail: mailId,
					_ownerGroup: mailGroupId,
				})
				mailSetEntries.push(mailSetEntryObj)

				const importedMailId: IdTuple = [listId, stringToBase64UrlCustomId(index.toString())]
				const importedMailObj = createTestEntity(ImportedImapMailTypeRef, {
					_id: importedMailId,
					mailSetEntry: mailSetEntryId,
					_ownerGroup: mailGroupId,
				})
				importedMails.push(importedMailObj)
			}

			for (let i = 1; i <= FIRST_BATCH; i++) {
				createMailInstances(i)
			}
			entityRestClientMock.addListInstances(...mails, ...mailSetEntries, ...importedMails)

			let importQueueProgress = CUSTOM_MIN_ID
			when(persistence.getImportQueueProgress(listId)).thenDo(() => {
				return importQueueProgress
			})
			const updateProgressCaptor = matchers.captor()
			when(persistence.updateImportQueueProgress(listId, updateProgressCaptor.capture(), mailImportType)).thenDo(() => {
				importQueueProgress = last(updateProgressCaptor.values!)
			})

			when(persistence.getIndexedGroups()).thenResolve([])
			when(persistence.getImportQueueEntries()).thenResolve([{ listId, mailImportType }])

			when(blobs.downloadAndStoreEncryptedBlobArchive(MailDetailsBlobTypeRef, archiveId, archiveDownloader, null)).thenDo(async () => {
				const sk = aes256RandomKey()
				const detailsBlobs = mails.map((mail) =>
					createTestEntity(
						MailDetailsBlobTypeRef,
						{
							_id: mail.mailDetails!,
							details: createTestEntity(MailDetailsTypeRef, {}, { populateAggregates: true }),
						},
						{ populateAggregates: true },
					),
				)
				await storeMailDetailsBlobs(detailsBlobs, sk)
			})

			when(mailFacade.loadAttachments(matchers.anything())).thenResolve([])
			when(crypto.resolveSessionKey(matchers.anything())).thenResolve(aes256RandomKey())

			let totalStored = 0
			let storedFirstRun = 0
			let firstRun = true
			const mailDataCaptor = matchers.captor()
			let callCount = 0
			when(persistence.storeMailData(mailDataCaptor.capture())).thenDo(async () => {
				const batch = mailDataCaptor.values![callCount]
				totalStored += batch.length
				if (firstRun) {
					storedFirstRun += batch.length
				}
				callCount++
			})

			await mailIndexer.beforeImportedMailFinished(listId, mailImportType)
			await mailIndexer.waitForIndex()
			firstRun = false
			const progressAfterFirstRun = updateProgressCaptor.values![updateProgressCaptor.values!.length - 1]
			const lastMailFirstBatch = importedMails[FIRST_BATCH - 1]
			o.check(progressAfterFirstRun).equals(elementIdPart(lastMailFirstBatch._id))

			for (let i = FIRST_BATCH + 1; i <= TOTAL_MAILS; i++) {
				createMailInstances(i)
			}

			entityRestClientMock.addListInstances(...mails, ...mailSetEntries, ...importedMails)

			await mailIndexer.beforeImportedMailFinished(listId, mailImportType)
			await mailIndexer.waitForIndex()

			o.check(totalStored).equals(TOTAL_MAILS)
			o.check(storedFirstRun).equals(FIRST_BATCH)

			const finalProgress = updateProgressCaptor.values![updateProgressCaptor.values!.length - 1]
			const lastMailTotal = importedMails[TOTAL_MAILS - 1]
			o.check(finalProgress).equals(elementIdPart(lastMailTotal._id))

			verify(persistence.removeImportQueueEntry(matchers.anything()), { times: 0 })
			verify(persistence.clearEncryptedBlobsForType(MailDetailsBlobTypeRef))
		})
	})
})
