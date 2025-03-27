import o from "@tutao/otest"
import { NotAuthorizedError } from "../../../../../src/common/api/common/error/RestError.js"
import {
	FULL_INDEXED_TIMESTAMP,
	GroupType,
	MailState,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import { GroupMembershipTypeRef, User, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import {
	_getCurrentIndexTimestamp,
	INITIAL_MAIL_INDEX_INTERVAL_DAYS,
	MailIndexer,
	MboxIndexData,
} from "../../../../../src/mail-app/workerUtils/index/MailIndexer.js"
import {
	BodyTypeRef,
	File as TutanotaFile,
	FileTypeRef,
	Mail,
	MailBagTypeRef,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailFolder,
	MailFolderRefTypeRef,
	MailFolderTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity, makeCore } from "../../../TestUtils.js"
import { DAY_IN_MILLIS, getDayShifted, getStartOfDay, neverNull } from "@tutao/tutanota-utils"
import {
	constructMailSetEntryId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
	timestampToGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { EntityRestClientMock } from "../rest/EntityRestClientMock.js"
import type { DateProvider } from "../../../../../src/common/api/worker/DateProvider.js"
import { func, matchers, object, verify, when } from "testdouble"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler.js"
import { MailFacade } from "../../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { typeModels } from "../../../../../src/common/api/entities/tutanota/TypeModels.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { BulkMailLoader, MAIL_INDEXER_CHUNK, MailWithMailDetails } from "../../../../../src/mail-app/workerUtils/index/BulkMailLoader.js"
import { ProgressMonitor } from "../../../../../src/common/api/common/utils/ProgressMonitor"
import { MailIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/MailIndexerBackend"
import { EntityUpdateData } from "../../../../../src/common/api/common/utils/EntityUpdateUtils"

class FixedDateProvider implements DateProvider {
	now: number

	constructor(now: number) {
		this.now = now
	}

	getStartOfDayShiftedBy(shiftedBy: number) {
		const date = getDayShifted(new Date(this.now), shiftedBy)
		// Making start of the day in UTC to make it determenistic. beforeNowInterval is calculated just like that and hardcoded to be reliable
		date.setUTCHours(0, 0, 0, 0)
		return date
	}
}

const mailId = "L-dNNLe----0"

o.spec("MailIndexer test", () => {
	const currentIndexTimestamp = 1554720827674 // 2019-04-08T10:53:47.674Z
	let entityMock: EntityRestClientMock
	let entityClient: EntityClient
	let bulkMailLoader: BulkMailLoader
	let dateProvider: DateProvider
	let backend: MailIndexerBackend
	let mailFacade: MailFacade
	let infoMessageHandler: InfoMessageHandler
	let indexer: MailIndexer
	const userId = "userId1"
	const mailGroup1 = "mailGroup1"
	let user: User
	o.beforeEach(function () {
		infoMessageHandler = object()
		entityMock = new EntityRestClientMock()
		entityClient = new EntityClient(entityMock)
		bulkMailLoader = new BulkMailLoader(entityClient, new EntityClient(entityMock))
		dateProvider = new FixedDateProvider(currentIndexTimestamp)
		mailFacade = object()
		backend = object()
		user = createTestEntity(UserTypeRef, {
			_id: userId,
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					group: mailGroup1,
					groupType: GroupType.Mail,
				}),
			],
		})
		indexer = new MailIndexer(
			infoMessageHandler,
			() => bulkMailLoader,
			entityClient,
			dateProvider,
			mailFacade,
			() => backend,
		)
	})

	async function initWithEnabled(enabled: boolean) {
		when(backend.isMailIndexingEnabled()).thenResolve(enabled)
		await indexer.init(user)
	}

	o.spec("enableMailIndexing", function () {
		o.test("when wasn't enabled it returns true", async function () {
			await initWithEnabled(false)
			const enabled = await indexer.enableMailIndexing()
			verify(backend.enableIndexing())
			o.check(enabled).equals(true)
		})

		o.test("when was enabled it returns false", async function () {
			await initWithEnabled(true)
			const enabled = await indexer.enableMailIndexing()
			verify(backend.enableIndexing(), { times: 0 })
			o.check(enabled).equals(false)
		})
	})

	o("disableMailIndexing", async function () {
		await initWithEnabled(true)
		await indexer.disableMailIndexing()
		verify(backend.deleteIndex())
	})

	o.spec("indexMailboxes", function () {
		o("disabled", async function () {
			await initWithEnabled(false)
			await indexer.indexMailboxes(createTestEntity(UserTypeRef), 1512946800000)
			verify(entityClient.load(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("initial indexing", async function () {
			await indexMailboxTest({
				startTimestamp: NOTHING_INDEXED_TIMESTAMP,
				endIndexTimestamp: 1512946800000,
				indexMailList: true,
			})
		})

		o.test("further indexing", async function () {
			await indexMailboxTest({
				startTimestamp: 1513033200000,
				endIndexTimestamp: 1512946800000,
				indexMailList: false,
			})
		})

		o.test("fully indexed", async function () {
			await indexMailboxTest({
				startTimestamp: FULL_INDEXED_TIMESTAMP,
				endIndexTimestamp: 1512946800000,
				indexMailList: true,
			})
		})
	})

	function _addFolder(mailbox: MailBox): MailFolder {
		const folder = createTestEntity(MailFolderTypeRef)
		folder._id = [neverNull(mailbox.folders).folders, entityMock.getNextId()]
		folder.entries = entityMock.getNextId()
		return folder
	}

	o.spec("_indexMailLists", function () {
		// now = 2019-04-04T22:00:00.000Z
		// rangeEnd = "2019-03-07T23:00:00.000Z"
		// now                                  now - 28d      now - 29d       now - 30d
		//  |--------------------------------------|---------------|---------------|
		//  rangeStart                           rangeEnd      rangeEnd2          rangeEndShifted2Days
		//                           m3      m4  m2     m1                            m0
		const rangeStart = 1554415200000 // "2019-04-04T22:00:00.000Z"
		// Simulating time zone changes by adding/subtracting one hour
		const rangeEnd = getDayShifted(new Date(rangeStart), -INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime() + 60 * 60 * 1000
		const rangeEnd2 = getDayShifted(new Date(rangeEnd), -1).getTime() - 60 * 60 * 1000
		const rangeEndShifted2Days = getDayShifted(new Date(rangeEnd), -2).getTime()
		const mailGroup = "mail-group-id"
		let mailbox: MailBox
		let folder1: MailFolder, folder2: MailFolder
		let mail0,
			details0,
			mailEntry0,
			mail1,
			details1,
			mailEntry1,
			mail2,
			details2,
			mailEntry2,
			files,
			mail3,
			details3,
			mailEntry3,
			mail4,
			details4,
			mailEntry4
		// let transaction, core, indexer, db
		o.beforeEach(() => {
			mailbox = createTestEntity(MailBoxTypeRef)
			const mailBagMailListId = "mailBagMailListId"
			mailbox.currentMailBag = createTestEntity(MailBagTypeRef, { _id: "mailBagId", mails: mailBagMailListId })
			mailbox._id = "mailbox-id"
			mailbox._ownerGroup = mailGroup
			const folderRef = createTestEntity(MailFolderRefTypeRef)
			folderRef.folders = entityMock.getNextId()
			mailbox.folders = folderRef
			folder1 = _addFolder(mailbox)
			folder2 = _addFolder(mailbox)

			// "2019-03-05T23:00:00.000Z" a.k.a Match 6th
			const mail0Id = timestampToGeneratedId(rangeEndShifted2Days, 1)
			;({
				mail: mail0,
				mailDetailsBlob: details0,
				mailSetEntry: mailEntry0,
			} = createMailInstances({
				mailSetEntryId: [folder1.entries, constructMailSetEntryId(new Date(rangeEndShifted2Days), mail0Id)],
				mailId: [mailBagMailListId, mail0Id],
				mailDetailsBlobId: ["details-list-id", entityMock.getNextId()],
			}))

			// "2019-03-07T22:59:00.000Z" a.k.a one minute before March 8th
			const mail1Timestamp = rangeEnd - 60 * 60 * 1000
			const mail1Id = timestampToGeneratedId(mail1Timestamp, 1)
			;({
				mail: mail1,
				mailDetailsBlob: details1,
				mailSetEntry: mailEntry1,
			} = createMailInstances({
				mailSetEntryId: [folder1.entries, constructMailSetEntryId(new Date(mail1Timestamp), mail1Id)],
				mailId: [mailBagMailListId, mail1Id],
				mailDetailsBlobId: ["details-list-id", entityMock.getNextId()],
			}))

			// "2019-03-07T23:01:00.000Z" a.k.a one second after March 8th
			const mail2Timestamp = rangeEnd + 60 * 60 * 1000
			const mail2Id = timestampToGeneratedId(mail2Timestamp, 1)
			;({
				mail: mail2,
				mailDetailsBlob: details2,
				mailSetEntry: mailEntry2,
				files,
			} = createMailInstances({
				mailSetEntryId: [folder1.entries, constructMailSetEntryId(new Date(mail2Timestamp), mail2Id)],
				mailId: [mailBagMailListId, mail2Id],
				mailDetailsBlobId: ["details-list-id", entityMock.getNextId()],
				attachmentIds: [
					["attachment-listId", entityMock.getNextId()],
					["attachment-listId1", entityMock.getNextId()],
				],
			}))

			// "2019-03-10T23:00:00.000Z" a.k.a March 11th
			const mail3Timestamp = rangeEnd + 3 * 24 * 60 * 60 * 1000
			const mail3Id = timestampToGeneratedId(mail3Timestamp, 1)
			;({
				mail: mail3,
				mailDetailsBlob: details3,
				mailSetEntry: mailEntry3,
			} = createMailInstances({
				mailSetEntryId: [folder1.entries, constructMailSetEntryId(new Date(mail3Timestamp), mail3Id)],
				mailId: [mailBagMailListId, mail3Id],
				mailDetailsBlobId: ["details-list-id", entityMock.getNextId()],
			}))

			// "2019-03-07T23:05:00.000Z" a.k.a 5 seconds after March 8th
			const mail4Timestamp = rangeEnd + 5 * 60 * 60 * 1000
			const mail4Id = timestampToGeneratedId(mail4Timestamp, 1)
			;({
				mail: mail4,
				mailDetailsBlob: details4,
				mailSetEntry: mailEntry4,
			} = createMailInstances({
				mailSetEntryId: [folder1.entries, constructMailSetEntryId(new Date(mail4Timestamp), mail4Id)],
				mailId: [mailBagMailListId, mail4Id],
				mailDetailsBlobId: ["details-list-id", entityMock.getNextId()],
			}))

			entityMock.addBlobInstances(details0, details1, details2, details3, details4)
			entityMock.addElementInstances(mailbox)
			entityMock.addListInstances(mail0, mail1, mail2, mail3, mail4, folder1, folder2, ...files)
			entityMock.addListInstances(mailEntry0, mailEntry1, mailEntry2, mailEntry3, mailEntry4)
			// transaction = createSearchIndexDbStub().createTransaction()
			// db = {
			// 	key: aes256RandomKey(),
			// 	iv: fixedIv,
			// 	dbFacade: {
			// 		createTransaction: () => Promise.resolve(transaction),
			// 	} as Partial<DbFacade> as DbFacade,
			// } as Partial<Db>
			// core = mock(
			// 	new IndexerCore(
			// 		db,
			// 		{
			// 			queueEvents: false,
			// 		} as any,
			// 		browserDataStub,
			// 	),
			// 	(mocked) => {
			// 		mocked.writeIndexUpdate = spy(() => Promise.resolve())
			// 	},
			// )
		})
		o("one mailbox until certain point", async function () {
			await initWithEnabled(true)
			const timestamps: Map<Id, number> = new Map([[mailGroup, NOTHING_INDEXED_TIMESTAMP]])
			when(backend.getCurrentIndexTimestamps([mailGroup])).thenResolve(timestamps)

			// initial indexing - first time range
			await indexer._indexMailLists(
				[
					{
						mbox: mailbox,
						newestTimestamp: rangeStart,
					},
				],
				rangeEnd,
			)
			verify(
				backend.indexMails(new Map([[mailGroup, rangeEnd]]), [
					{ mail: mail1, mailDetails: details1, attachments: [] },
					{ mail: mail2, mailDetails: details2, attachments: [] },
					{ mail: mail3, mailDetails: details3, attachments: [] },
					{ mail: mail4, mailDetails: details4, attachments: [] },
				]),
			)
		})
		o("one mailbox extend once", async function () {
			await initWithEnabled(true)
			const timestamps: Map<Id, number> = new Map([[mailGroup, rangeEnd]])
			when(backend.getCurrentIndexTimestamps([mailGroup])).thenResolve(timestamps)

			// next index update - continue indexing
			await indexer._indexMailLists(
				[
					{
						mbox: mailbox,
						newestTimestamp: rangeEnd,
					},
				],
				rangeEnd2,
			)

			verify(
				backend.indexMails(new Map([[mailGroup, rangeEnd2]]), [
					{
						mail: mail1,
						mailDetails: details1,
						attachments: [],
					},
				]),
			)
		})
		o("one mailbox extend till end", async function () {
			await initWithEnabled(true)
			// "2019-03-06T22:00:00.000Z" a.k.a
			const timestamps: Map<Id, number> = new Map([[mailGroup, rangeEnd2]])
			when(backend.getCurrentIndexTimestamps([mailGroup])).thenResolve(timestamps)

			// next index update - finish indexing "2019-03-05T22:00:00.000Z"
			const rangeEnd3 = getDayShifted(new Date(rangeEnd2), -1).getTime()
			await indexer._indexMailLists(
				[
					{
						mbox: mailbox,
						newestTimestamp: rangeEnd2,
					},
				],
				rangeEnd3,
			)
			verify(
				backend.indexMails(new Map([[mailGroup, FULL_INDEXED_TIMESTAMP]]), [
					{
						mail: mail1,
						mailDetails: details1,
						attachments: [],
					},
				]),
			)
		})
	})

	o.spec("processEntityEvents", function () {
		const mailListId = "mail-list"
		const mailIdTuple: IdTuple = [mailListId, mailId]

		function addEntities(mailState: MailState = MailState.RECEIVED) {
			const { mail, mailDetailsBlob, files } = createMailInstances({
				mailSetEntryId: ["mailSetListId", "mailListEntryId"],
				mailId: mailIdTuple,
				mailDetailsBlobId: ["details-list-id", "details-id"],
				attachmentIds: [["file-list-id", "file-id"]],
			})
			mail.state = mailState
			entityMock.addListInstances(mail, ...files)
			entityMock.addBlobInstances(mailDetailsBlob)
			when(mailFacade.loadAttachments(mail)).thenResolve(files)
			return { mail, mailDetailsBlob, files }
		}

		o.test("do nothing if mailIndexing is disabled", async function () {
			await initWithEnabled(false)

			const events = [
				createUpdate(OperationType.CREATE, mailListId, "1"),
				createUpdate(OperationType.UPDATE, mailListId, "2"),
				createUpdate(OperationType.DELETE, mailListId, "3"),
			]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
			verify(entityClient.load(matchers.anything(), matchers.anything()), { times: 0 })
			verify(backend.onMailCreated(matchers.anything()), { times: 0 })
			verify(backend.onMailUpdated(matchers.anything()), { times: 0 })
			verify(backend.onMailDeleted(matchers.anything()), { times: 0 })
		})

		o.test("when CREATE it should dispatch to backend", async function () {
			const { mail, mailDetailsBlob, files } = addEntities()
			const event: EntityUpdateData = {
				application: "tutanota",
				type: "Mail",
				operation: OperationType.CREATE,
				instanceListId: mailListId,
				instanceId: mailId,
			}
			await indexer.processEntityEvents([event], "groupId", "batchId")
			verify(backend.onMailCreated({ mail, mailDetails: mailDetailsBlob.details, attachments: files }))
		})

		o.test("when DELETE it should dispatch to backend", async function () {
			await initWithEnabled(true)

			const events = [createUpdate(OperationType.DELETE, mailListId, mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
			verify(backend.onMailDeleted(mailIdTuple))
		})

		o.test("when UPDATE for draft it should dispatch to backend", async function () {
			await initWithEnabled(true)
			const { mail, mailDetailsBlob, files } = addEntities(MailState.DRAFT)

			const events = [createUpdate(OperationType.UPDATE, mailListId, mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
			verify(backend.onMailUpdated({ mail, mailDetails: mailDetailsBlob.details, attachments: files }))
		})

		o.test("when UPDATE for non-draft it shouldn't do anything", async function () {
			await initWithEnabled(true)
			addEntities(MailState.RECEIVED)

			const events = [createUpdate(OperationType.UPDATE, mailListId, mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id")

			verify(backend.onMailUpdated(matchers.anything()), { times: 0 })
		})

		o.test("when CREATE but mail not found it is handled", async function () {
			await initWithEnabled(true)
			const events = [createUpdate(OperationType.CREATE, mailListId, "1")]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
		})

		o.test("when CREATE but not authorized it is handled", async function () {
			entityMock.setListElementException(mailIdTuple, new NotAuthorizedError("blah"))
			await initWithEnabled(true)
			const events = [createUpdate(OperationType.CREATE, mailListId, "1")]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
		})

		o.test("when UPDATE but mail not found it is handled", async function () {
			await initWithEnabled(true)
			const events = [createUpdate(OperationType.UPDATE, mailListId, "1")]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
		})

		o.test("when UPDATE but not authorized it is handled", async function () {
			entityMock.setListElementException(mailIdTuple, new NotAuthorizedError("blah"))
			await initWithEnabled(true)
			const events = [createUpdate(OperationType.UPDATE, mailListId, "1")]
			await indexer.processEntityEvents(events, "group-id", "batch-id")
		})
	})

	o.test("_getCurrentIndexTimestamp", () => {
		o(NOTHING_INDEXED_TIMESTAMP).equals(_getCurrentIndexTimestamp([]))
		o(NOTHING_INDEXED_TIMESTAMP).equals(_getCurrentIndexTimestamp([NOTHING_INDEXED_TIMESTAMP]))
		o(FULL_INDEXED_TIMESTAMP).equals(_getCurrentIndexTimestamp([FULL_INDEXED_TIMESTAMP]))
		let now = new Date().getTime()
		let past = now - 1000
		o(now).equals(_getCurrentIndexTimestamp([now]))
		o(past).equals(_getCurrentIndexTimestamp([now, past]))
		o(past).equals(_getCurrentIndexTimestamp([past, now]))
		o(now).equals(_getCurrentIndexTimestamp([now, now]))
		o(now).equals(_getCurrentIndexTimestamp([NOTHING_INDEXED_TIMESTAMP, now]))
		o(now).equals(_getCurrentIndexTimestamp([now, NOTHING_INDEXED_TIMESTAMP]))
		o(now).equals(_getCurrentIndexTimestamp([FULL_INDEXED_TIMESTAMP, now]))
		o(now).equals(_getCurrentIndexTimestamp([now, FULL_INDEXED_TIMESTAMP]))
		o(FULL_INDEXED_TIMESTAMP).equals(_getCurrentIndexTimestamp([FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP]))
		o(FULL_INDEXED_TIMESTAMP).equals(_getCurrentIndexTimestamp([NOTHING_INDEXED_TIMESTAMP, FULL_INDEXED_TIMESTAMP]))
		o(now).equals(_getCurrentIndexTimestamp([NOTHING_INDEXED_TIMESTAMP, now, FULL_INDEXED_TIMESTAMP, now]))
		o(now).equals(_getCurrentIndexTimestamp([now, NOTHING_INDEXED_TIMESTAMP, now, FULL_INDEXED_TIMESTAMP]))
		o(now).equals(_getCurrentIndexTimestamp([now, FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP]))
	})

	o.spec("extendIndexIfNeeded", function () {
		o.test("not extends if fully indexed", async function () {
			when(backend.getCurrentIndexTimestamps([mailGroup1])).thenResolve(new Map([[mailGroup1, FULL_INDEXED_TIMESTAMP]]))
			await initWithEnabled(true)
			await indexer.extendIndexIfNeeded(user, Date.now())
			verify(infoMessageHandler.onSearchIndexStateUpdate(matchers.anything()), { times: 0 })
			verify(bulkMailLoader.loadMailSetEntriesForTimeRange(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("not extends if already indexed range", async function () {
			const newOldTimestamp = new Date("2025-03-27T16:32:52.847Z").getTime()
			const currentIndexTimestamp = newOldTimestamp - 1000
			when(backend.getCurrentIndexTimestamps([mailGroup1])).thenResolve(new Map([[mailGroup1, currentIndexTimestamp]]))
			await initWithEnabled(true)

			verify(bulkMailLoader.loadMailSetEntriesForTimeRange(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("extends", async function () {
			when(backend.getCurrentIndexTimestamps([mailGroup1])).thenResolve(new Map([[mailGroup1, currentIndexTimestamp]]))
			const beforeNowInterval = 1552262400000 // 2019-03-11T00:00:00.000Z
			await initWithEnabled(true)

			await indexer.extendIndexIfNeeded(user, beforeNowInterval)

			// FIXME: would need to mock some stuff here?

			// // @ts-ignore
			// o(indexer.indexMailboxes.invocations).deepEquals([
			// 	// Start of the day
			// 	[user, beforeNowInterval],
			// ])
		})
	})

	o.spec("check mail index compatibility with models", function () {
		// if this test fails, you need to think about migrating (or dropping)
		// so old mail indexes use the new attribute ids.
		o.test("mail does not have an attribute with id LEGACY_TO_RECIPIENTS_ID", function () {
			o.check(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_TO_RECIPIENTS_ID).length).equals(0)
		})
		o.test("recipients does not have an attribute with id LEGACY_TO_RECIPIENTS_ID", function () {
			o.check(Object.values(typeModels.Recipients.associations).filter((v: any) => v.id === LEGACY_TO_RECIPIENTS_ID).length).equals(0)
		})
		o.test("mail does not have an attribute with id LEGACY_BODY_ID", function () {
			o.check(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_BODY_ID).length).equals(0)
		})
		o.test("maildetails does not have an attribute with id LEGACY_BODY_ID", function () {
			o.check(Object.values(typeModels.MailDetails.associations).filter((v: any) => v.id === LEGACY_BODY_ID).length).equals(0)
		})
		o.test("mail does not have an attribute with id LEGACY_CC_RECIPIENTS_ID", function () {
			o.check(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_CC_RECIPIENTS_ID).length).equals(0)
		})
		o.test("maildetails does not have an attribute with id LEGACY_CC_RECIPIENTS_ID", function () {
			o.check(Object.values(typeModels.MailDetails.associations).filter((v: any) => v.id === LEGACY_CC_RECIPIENTS_ID).length).equals(0)
		})
		o.test("mail does not have an attribute with id LEGACY_BCC_RECIPIENTS_ID", function () {
			o.check(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_BCC_RECIPIENTS_ID).length).equals(0)
		})
		o.test("maildetails does not have an attribute with id LEGACY_BCC_RECIPIENTS_ID", function () {
			o.check(Object.values(typeModels.MailDetails.associations).filter((v: any) => v.id === LEGACY_BCC_RECIPIENTS_ID).length).equals(0)
		})
	})

	o.spec("_indexMailListsInTimeBatches", () => {
		o.test("processed in fixed batches", async () => {
			const loadMailDataRequests = 5
			const totalMails = MAIL_INDEXER_CHUNK * loadMailDataRequests
			const rangeStart = DAY_IN_MILLIS * totalMails
			const rangeEnd = 0

			const core = makeCore()
			core.encryptSearchIndexEntries = () => {}
			core.writeIndexUpdateWithIndexTimestamps = () => Promise.resolve()

			const lotsOfMails: Mail[] = []
			const lotsOfMailDetailsAndMails: MailWithMailDetails[] = []
			for (let i = 0; i < MAIL_INDEXER_CHUNK; i++) {
				const _id: IdTuple = ["helloooo", "I'm a mail!"]
				const mail: Mail = createTestEntity(MailTypeRef, {
					_id,
				})
				lotsOfMails.push(mail)
				lotsOfMailDetailsAndMails.push({
					mail,
					mailDetails: createTestEntity(MailDetailsTypeRef, {
						recipients: createTestEntity(RecipientsTypeRef, {
							toRecipients: [],
							ccRecipients: [],
							bccRecipients: [],
						}),
						body: createTestEntity(BodyTypeRef, {
							compressedText: "tiiiiiiiiiiiiiny",
						}),
					}),
				})
			}

			// one mail per day
			when(bulkMailLoader.loadMailSetEntriesForTimeRange(matchers.anything(), matchers.anything())).thenResolve([createTestEntity(MailSetEntryTypeRef)])

			when(bulkMailLoader.loadMailsFromMultipleLists(matchers.anything())).thenResolve(lotsOfMails)
			when(bulkMailLoader.loadMailDetails(matchers.anything())).thenResolve(lotsOfMailDetailsAndMails)
			when(bulkMailLoader.loadAttachments(matchers.anything())).thenResolve([]) // doesn't matter for this test

			const mboxData: MboxIndexData[] = [
				{
					mailSetListDatas: [
						{
							listId: "helloooo",
							lastLoadedId: null,
							loadedButUnusedEntries: [],
							loadedCompletely: false,
						},
					],
					newestTimestamp: rangeStart,
					ownerGroup: "hi I'm an owner group",
				},
			]

			let progress = 0
			const progressMonitor: ProgressMonitor = object()
			when(progressMonitor.workDone(matchers.anything())).thenDo((amt: number) => {
				progress += amt
			})

			await indexer._indexMailListsInTimeBatches(mboxData, [rangeStart, rangeEnd], progressMonitor, bulkMailLoader)

			o(progress).equals(rangeStart - rangeEnd)
			o(core._stats.mailcount).equals(totalMails)
			verify(bulkMailLoader.loadMailSetEntriesForTimeRange(matchers.anything(), matchers.anything()), { times: totalMails })
			verify(bulkMailLoader.loadMailDetails(matchers.anything()), { times: loadMailDataRequests })
			verify(bulkMailLoader.loadAttachments(matchers.anything()), { times: loadMailDataRequests })
			verify(bulkMailLoader.loadMailsFromMultipleLists(matchers.anything()), { times: loadMailDataRequests })
		})
	})

	async function indexMailboxTest({
		startTimestamp,
		endIndexTimestamp,
		indexMailList,
	}: {
		startTimestamp: number
		endIndexTimestamp: number
		indexMailList: boolean
	}) {
		const mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef, {
			_id: mailGroup1,
			mailbox: "mailbox-id",
		})
		const mailbox = createTestEntity(MailBoxTypeRef, {
			_id: "mailbox-id",
		})
		entityMock.addElementInstances(mailbox, mailboxGroupRoot)
		when(backend.getCurrentIndexTimestamps([mailGroup1])).thenResolve(new Map([[mailGroup1, startTimestamp]]))
		let groupData = {
			indexTimestamp: startTimestamp,
		}

		// Dirty, dirty partial mock. Unfortunately fixing it would require tearing MailIndexer apart into smaller
		// pieces which would not be a bad thing to do.
		indexer._indexMailLists = func<MailIndexer["_indexMailLists"]>()

		const indexPromise = indexer.indexMailboxes(user, endIndexTimestamp)
		o(indexer.isIndexing).equals(true)
		await indexPromise
		// FIXME: should the queue be controlled from here or rather from the indexer?
		// o(indexer._core.queue.pause.invocations.length).equals(1)
		// o(indexer._core.queue.resume.invocations.length).equals(1)
		o(indexer.isIndexing).equals(false)

		if (indexMailList) {
			const expectedNewestTimestamp =
				groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP ? getDayShifted(getStartOfDay(new Date()), 1).getTime() : groupData.indexTimestamp
			verify(
				indexer._indexMailLists(
					[
						{
							mbox: mailbox,
							newestTimestamp: expectedNewestTimestamp,
						},
					],
					endIndexTimestamp,
				),
			)
		} else {
			verify(indexer._indexMailLists(matchers.anything(), matchers.anything()), { times: 0 })
		}
	}
})

function createUpdate(operation: OperationType, listId: Id, instanceId: Id): EntityUpdateData {
	return {
		operation: operation,
		instanceListId: listId,
		instanceId: instanceId,
		application: "tutanota",
		type: "Mail",
	}
}

function createMailInstances({
	mailSetEntryId,
	mailId,
	mailDetailsBlobId,
	attachmentIds = [],
}: {
	mailSetEntryId: IdTuple
	mailId: IdTuple
	mailDetailsBlobId: IdTuple
	attachmentIds?: Array<IdTuple>
}): {
	mail: Mail
	mailDetailsBlob: MailDetailsBlob
	mailSetEntry: MailSetEntry
	files: Array<TutanotaFile>
} {
	const mailSetEntry = createTestEntity(MailSetEntryTypeRef, {
		_id: mailSetEntryId,
		mail: mailId,
	})
	let mail = createTestEntity(MailTypeRef, {
		_id: mailId,
		_ownerEncSessionKey: new Uint8Array(),
		mailDetails: mailDetailsBlobId,
		attachments: attachmentIds,
	})
	let mailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
		_id: mailDetailsBlobId,
		details: createTestEntity(MailDetailsTypeRef, {
			body: createTestEntity(BodyTypeRef),
			recipients: createTestEntity(RecipientsTypeRef),
		}),
	})
	const files = attachmentIds.map((id) => {
		const file = createTestEntity(FileTypeRef)
		file._id = id
		return file
	})
	return {
		mail,
		mailDetailsBlob,
		mailSetEntry,
		files: files,
	}
}
