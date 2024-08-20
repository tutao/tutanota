import o from "@tutao/otest"
import { NotAuthorizedError } from "../../../../../src/common/api/common/error/RestError.js"
import { Db, ElementDataDbRow, IndexUpdate } from "../../../../../src/common/api/worker/search/SearchTypes.js"
import { _createNewIndexUpdate, encryptIndexKeyBase64, typeRefToTypeInfo } from "../../../../../src/common/api/worker/search/IndexUtils.js"
import {
	FULL_INDEXED_TIMESTAMP,
	GroupType,
	MailState,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore.js"
import type { EntityUpdate } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { EntityUpdateTypeRef, GroupMembershipTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { _getCurrentIndexTimestamp, INITIAL_MAIL_INDEX_INTERVAL_DAYS, MailIndexer } from "../../../../../src/mail-app/workerUtils/index/MailIndexer.js"
import {
	BodyTypeRef,
	EncryptedMailAddressTypeRef,
	File as TutanotaFile,
	FileTypeRef,
	Mail,
	MailAddressTypeRef,
	MailBox,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailFolder,
	MailFolderRefTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { mock, spy } from "@tutao/tutanota-test-utils"
import { browserDataStub, createTestEntity, makeCore } from "../../../TestUtils.js"
import { downcast, getDayShifted, getStartOfDay, neverNull } from "@tutao/tutanota-utils"
import { EventQueue } from "../../../../../src/common/api/worker/EventQueue.js"
import { createSearchIndexDbStub } from "./DbStub.js"
import {
	getElementId,
	getListId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
	timestampToGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { EntityRestClientMock } from "../rest/EntityRestClientMock.js"
import type { DateProvider } from "../../../../../src/common/api/worker/DateProvider.js"
import { LocalTimeDateProvider } from "../../../../../src/common/api/worker/DateProvider.js"
import { aes256RandomKey, fixedIv } from "@tutao/tutanota-crypto"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { object, when } from "testdouble"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler.js"
import { ElementDataOS, GroupDataOS, Metadata as MetaData, MetaDataOS } from "../../../../../src/common/api/worker/search/IndexTables.js"
import { MailFacade } from "../../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { typeModels } from "../../../../../src/common/api/entities/tutanota/TypeModels.js"

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

const dbMock: any = {
	iv: fixedIv,
}

const mailId = "L-dNNLe----0"

o.spec("MailIndexer test", () => {
	let entityMock: EntityRestClientMock
	let entityCache: DefaultEntityRestCache
	let dateProvider: DateProvider
	let mailFacade: MailFacade
	o.beforeEach(function () {
		entityMock = new EntityRestClientMock()
		entityCache = downcast(entityMock)
		dateProvider = new LocalTimeDateProvider()
		mailFacade = object()
	})
	o("createMailIndexEntries without entries", function () {
		let mail = createTestEntity(MailTypeRef)
		let mailDetails = createTestEntity(MailDetailsTypeRef, {
			body: createTestEntity(BodyTypeRef),
			recipients: createTestEntity(RecipientsTypeRef),
		})
		let files = [createTestEntity(FileTypeRef)]
		let indexer = new MailIndexer(
			new IndexerCore(dbMock, null as any, browserDataStub),
			null as any,
			null as any,
			null as any,
			null as any,
			dateProvider,
			mailFacade,
		)
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, mailDetails, files)
		o(keyToIndexEntries.size).equals(0)
	})
	o("createMailIndexEntries with one entry", function () {
		let mail = createTestEntity(MailTypeRef)
		mail.subject = "Hello"
		let mailDetails = createTestEntity(MailDetailsTypeRef, {
			body: createTestEntity(BodyTypeRef),
			recipients: createTestEntity(RecipientsTypeRef),
		})
		let files = [createTestEntity(FileTypeRef)]
		let indexer = new MailIndexer(
			new IndexerCore(dbMock, null as any, browserDataStub),
			null as any,
			null as any,
			null as any,
			null as any,
			dateProvider,
			mailFacade,
		)
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, mailDetails, files)
		o(keyToIndexEntries.size).equals(1)
	})
	o("createMailIndexEntries", async function () {
		let core: IndexerCore = {
			createIndexEntriesForAttributes: spy(),
			_stats: {},
		} as any
		let indexer = new MailIndexer(core, dbMock, null as any, null as any, null as any, dateProvider, mailFacade)
		let toRecipients = [createTestEntity(MailAddressTypeRef), createTestEntity(MailAddressTypeRef)]
		toRecipients[0].address = "tr0A"
		toRecipients[0].name = "tr0N"
		toRecipients[1].address = "tr1A"
		toRecipients[1].name = "tr1N"
		let ccRecipients = [createTestEntity(MailAddressTypeRef), createTestEntity(MailAddressTypeRef)]
		ccRecipients[0].address = "ccr0A"
		ccRecipients[0].name = "ccr0N"
		ccRecipients[1].address = "ccr1A"
		ccRecipients[1].name = "ccr1N"
		let bccRecipients = [createTestEntity(MailAddressTypeRef), createTestEntity(MailAddressTypeRef)]
		bccRecipients[0].address = "bccr0A"
		bccRecipients[0].name = "bccr0N"
		bccRecipients[1].address = "bccr1A"
		bccRecipients[1].name = "bccr1N"
		let replyTo = createTestEntity(EncryptedMailAddressTypeRef)
		replyTo.address = "rToA"
		replyTo.address = "rToN"
		let sender = createTestEntity(MailAddressTypeRef)
		sender.address = "SA"
		sender.name = "SN"
		let mail = createTestEntity(MailTypeRef)
		mail.differentEnvelopeSender = "ES" // not indexed

		mail.subject = "Su"
		const recipients = createTestEntity(RecipientsTypeRef)
		recipients.bccRecipients = bccRecipients
		recipients.ccRecipients = ccRecipients
		recipients.toRecipients = toRecipients

		mail.sender = sender
		mail.mailDetails = ["details-list-id", "details-id"]
		let mailDetails = createTestEntity(MailDetailsTypeRef, {
			_id: "details-id",
			body: createTestEntity(BodyTypeRef, { text: "BT" }),
			recipients,
			replyTos: [replyTo],
		})
		let files = [createTestEntity(FileTypeRef)]
		files[0].mimeType = "binary" // not indexed

		files[0].name = "FN"
		indexer.createMailIndexEntries(mail, mailDetails, files)
		let args = core.createIndexEntriesForAttributes.args
		o(args[0]).equals(mail)
		let attributeHandlers = core.createIndexEntriesForAttributes.args[1]
		let attributes = attributeHandlers.map((h) => {
			return {
				attribute: h.attribute.id,
				value: h.value(),
			}
		})
		const MailModel = await resolveTypeReference(MailTypeRef)
		const DetailsMailModel = await resolveTypeReference(MailDetailsTypeRef)
		const RecipientModel = await resolveTypeReference(RecipientsTypeRef)
		o(JSON.stringify(attributes)).equals(
			JSON.stringify([
				{
					attribute: MailModel.values["subject"].id,
					value: "Su",
				},
				{
					attribute: LEGACY_TO_RECIPIENTS_ID,
					value: "tr0N <tr0A>,tr1N <tr1A>",
				},
				{
					attribute: LEGACY_CC_RECIPIENTS_ID,
					value: "ccr0N <ccr0A>,ccr1N <ccr1A>",
				},
				{
					attribute: LEGACY_BCC_RECIPIENTS_ID,
					value: "bccr0N <bccr0A>,bccr1N <bccr1A>",
				},
				{
					attribute: MailModel.associations["sender"].id,
					value: "SN <SA>",
				},
				{
					attribute: LEGACY_BODY_ID,
					value: "BT",
				},
				{
					attribute: MailModel.associations["attachments"].id,
					value: "FN",
				},
			]),
		)
	})
	o("processNewMail", function () {
		const [mailListId, mailElementId] = ["mail-list-id", "mail-element-id"]
		const { mail, mailDetailsBlob, files } = createMailInstances(
			mailFacade,
			[mailListId, mailElementId],
			["details-list-id", "details-id"],
			["file-list-id", "file-id"],
		)
		let keyToIndexEntries = new Map()
		let event: EntityUpdate = {
			instanceListId: mailListId,
			instanceId: mailElementId,
		} as any
		entityMock.addListInstances(mail, ...files)
		entityMock.addBlobInstances(mailDetailsBlob)
		let indexer = mock(new MailIndexer(null as any, dbMock, null as any, entityMock, entityCache, dateProvider, mailFacade), (mocked) => {
			mocked.createMailIndexEntries = spy((mailParam, detailsParam, filesParam) => {
				o(mailParam).deepEquals(mail)
				o(detailsParam).deepEquals(mailDetailsBlob.details)
				o(filesParam).deepEquals(files)
				return keyToIndexEntries
			})
		})
		return indexer.processNewMail(event).then((result) => {
			o(indexer.createMailIndexEntries.callCount).equals(1)
			o(result).deepEquals({
				mail,
				keyToIndexEntries,
			})
		})
	})
	o("processNewMail catches NotFoundError", async function () {
		const indexer = new MailIndexer(null as any, null as any, null as any, entityMock, entityCache, dateProvider, mailFacade)
		let event: EntityUpdate = {
			instanceListId: "lid",
			instanceId: "eid",
		} as any
		const result = await indexer.processNewMail(event)
		o(result).equals(null)
	})
	o("processNewMail catches NotAuthorizedError", function () {
		entityMock.setElementException("eid", new NotAuthorizedError("blah"))
		const indexer = new MailIndexer(null as any, null as any, null as any, entityMock, entityCache, dateProvider, mailFacade)
		let event: EntityUpdate = {
			instanceListId: "lid",
			instanceId: "eid",
		} as any
		return indexer.processNewMail(event).then((result) => {
			o(result).equals(null)
		})
	})
	o("processNewMail passes other Errors", async function () {
		entityMock.setListElementException(["lid", "eid"], new Error("blah"))
		const indexer = new MailIndexer(null as any, null as any, null as any, entityMock, entityCache, dateProvider, mailFacade)
		let event: EntityUpdate = {
			instanceListId: "lid",
			instanceId: "eid",
		} as any
		await o(() => indexer.processNewMail(event)).asyncThrows(Error)
	})
	o("processMovedMail", async function () {
		let event: EntityUpdate = {
			instanceListId: "new-list-id",
			instanceId: "eid",
		} as any
		let elementData: ElementDataDbRow = ["old-list-id", new Uint8Array(0), "owner-group-id"]
		let db: Db = {
			key: aes256RandomKey(),
			iv: fixedIv,
			dbFacade: {
				createTransaction: () => Promise.resolve(transaction),
			},
		} as any
		let encInstanceId = encryptIndexKeyBase64(db.key, event.instanceId, fixedIv)
		let transaction = {
			get: (os, id) => {
				o(os).equals(ElementDataOS)
				o(Array.from(id)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			},
		}
		const indexer = new MailIndexer(null as any, db, null as any, null as any, null as any, dateProvider, mailFacade)

		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))

		await indexer.processMovedMail(event, indexUpdate)
		o(indexUpdate.move.length).equals(1)
		o(Array.from(indexUpdate.move[0].encInstanceId)).deepEquals(Array.from(encInstanceId))
		o(indexUpdate.move[0].newListId).equals(event.instanceListId)
	})
	o("processMovedMail that does not exist", async function () {
		let transaction = {
			get: (os, id) => {
				o(os).equals(ElementDataOS)
				o(Array.from(id)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(null)
			},
		}
		let db: Db = {
			key: aes256RandomKey(),
			iv: fixedIv,
			dbFacade: {
				createTransaction: () => Promise.resolve(transaction),
			},
		} as any
		let event: EntityUpdate = {
			instanceListId: "new-list-id",
			instanceId: "eid",
		} as any
		let encInstanceId = encryptIndexKeyBase64(db.key, event.instanceId, fixedIv)
		const core: any = {
			encryptSearchIndexEntries: spy(),
		}
		const indexer: any = new MailIndexer(core, db, null as any, null as any, null as any, dateProvider, mailFacade)
		let result = {
			mail: {
				_id: "mail-id",
				_ownerGroup: "owner-group",
			},
			keyToIndexEntries: new Map(),
		}
		indexer.processNewMail = spy(() => Promise.resolve(result))

		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))

		await indexer.processMovedMail(event, indexUpdate)
		o(indexUpdate.move.length).equals(0)
		o(indexer.processNewMail.callCount).equals(1)
		o(core.encryptSearchIndexEntries.callCount).equals(1)
		o(core.encryptSearchIndexEntries.args).deepEquals([result.mail._id, result.mail._ownerGroup, result.keyToIndexEntries, indexUpdate])
	})
	o("enableMailIndexing", async function () {
		let metadata = {}
		let transaction = {
			get: (os, key) => {
				o(os).equals(MetaDataOS)
				o(key).equals(MetaData.mailIndexingEnabled)
				return Promise.resolve(false)
			},
			put: (os, key, value) => {
				o(os).equals(MetaDataOS)
				metadata[key] = value
			},
			wait: () => Promise.resolve(),
		}
		let user = createTestEntity(UserTypeRef)
		user.memberships.push(createTestEntity(GroupMembershipTypeRef))
		user.memberships[0].groupType = GroupType.Mail
		let spamFolder = createTestEntity(MailFolderTypeRef)
		spamFolder.mails = "mail-list-id"
		let db: Db = {
			key: aes256RandomKey(),
			dbFacade: {
				createTransaction: () => Promise.resolve(transaction),
			},
		} as any
		// There was a timezone shift in Germany in this time range
		const now = 1554720827674 // 2019-04-08T10:53:47.674Z

		const beforeNowInterval = 1552262400000 // 2019-03-11T00:00:00.000Z

		const dateProvider = new FixedDateProvider(now)
		const indexer = mock(new MailIndexer(null as any, db, null as any, null as any, null as any, dateProvider, mailFacade), (mocked) => {
			mocked.indexMailboxes = spy(() => Promise.resolve())
			mocked.mailIndexingEnabled = false

			mocked._getSpamFolder = (membership) => {
				o(membership).deepEquals(user.memberships[0])
				return spamFolder
			}
		})
		await indexer.enableMailIndexing(user)
		o(indexer.indexMailboxes.invocations[0]).deepEquals([user, beforeNowInterval])
		o(indexer.mailIndexingEnabled).equals(true)
		o(JSON.stringify(metadata)).equals(
			JSON.stringify({
				[MetaData.mailIndexingEnabled]: true,
				[MetaData.excludedListIds]: [],
			}),
		)
	})
	o("enableMailIndexing already enabled", async function () {
		let transaction = {
			get: (os, key) => {
				o(os).equals(MetaDataOS)

				if (key == MetaData.mailIndexingEnabled) {
					return Promise.resolve(true)
				} else if (key == MetaData.excludedListIds) {
					return Promise.resolve([])
				}

				throw new Error("wrong key / os")
			},
		}
		let db: Db = {
			key: aes256RandomKey(),
			dbFacade: {
				createTransaction: () => Promise.resolve(transaction),
			},
		} as any
		const indexer: any = new MailIndexer(null as any, db, null as any, null as any, null as any, dateProvider, mailFacade)
		indexer.indexMailboxes = spy()
		indexer.mailIndexingEnabled = false
		let user = createTestEntity(UserTypeRef)
		await await indexer.enableMailIndexing(user)
		o(indexer.indexMailboxes.callCount).equals(0)
		o(indexer.mailIndexingEnabled).equals(true)
	})
	o("disableMailIndexing", function () {
		let db: Db = {
			key: aes256RandomKey(),
			dbFacade: {
				deleteDatabase: spy(),
			},
		} as any
		const indexer: any = new MailIndexer(null as any, db, null as any, null as any, null as any, dateProvider, mailFacade)
		indexer.mailIndexingEnabled = true
		indexer.disableMailIndexing()
		o(indexer.mailIndexingEnabled).equals(false)
		// @ts-ignore
		o(db.dbFacade.deleteDatabase.callCount).equals(1)
	})
	o("indexMailboxes disabled", async function () {
		const indexer = mock(new MailIndexer(null as any, null as any, null as any, entityMock, entityCache, dateProvider, mailFacade), (mocked) => {
			mocked.mailIndexingEnabled = false
		})
		await indexer.indexMailboxes(createTestEntity(UserTypeRef), 1512946800000)
	})
	o.spec("indexMailboxes", function () {
		o("initial indexing", function () {
			return indexMailboxTest(NOTHING_INDEXED_TIMESTAMP, 1512946800000, true, true)
		})
		o("further indexing", function () {
			return indexMailboxTest(1513033200000, 1512946800000, false, true)
		})
		o("fully indexed", function () {
			return indexMailboxTest(FULL_INDEXED_TIMESTAMP, 1512946800000, true, false)
		})
	})

	function _addFolder(mailbox: MailBox): MailFolder {
		const folder = createTestEntity(MailFolderTypeRef)
		folder._id = [neverNull(mailbox.folders).folders, entityMock.getNextId()]
		folder.mails = entityMock.getNextId()
		return folder
	}

	o.spec("_indexMailLists", function () {
		// now                                  now - 28d      now - 29d       now - 30d
		//  |--------------------------------------|---------------|---------------|
		//  rangeStart                           rangeEnd      rangeEnd2          rangeEndShifted2Days
		//                     m4    m3        m2     m1                            m0
		const rangeStart = 1554415200000
		// Simulating time zone changes by adding/subtracting one hour
		const rangeEnd = getDayShifted(new Date(rangeStart), -INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime() + 60 * 60 * 1000
		const rangeEnd2 = getDayShifted(new Date(rangeEnd), -1).getTime() - 60 * 60 * 1000
		const rangeEndShifted2Days = getDayShifted(new Date(rangeEnd), -2).getTime()
		const mailGroup = "mail-group-id"
		let mailbox: MailBox
		let folder1, folder2
		let mail0, details0, mail1, details1, mail2, details2, files, mail3, details3, mail4, details4
		let transaction, core, indexer, db
		o.beforeEach(() => {
			mailbox = createTestEntity(MailBoxTypeRef)
			mailbox._id = "mailbox-id"
			mailbox._ownerGroup = mailGroup
			const folderRef = createTestEntity(MailFolderRefTypeRef)
			folderRef.folders = entityMock.getNextId()
			mailbox.folders = folderRef
			folder1 = _addFolder(mailbox)
			folder2 = _addFolder(mailbox)
			;({ mail: mail0, mailDetailsBlob: details0 } = createMailInstances(
				mailFacade,
				[folder1.mails, timestampToGeneratedId(rangeEndShifted2Days, 1)],
				["details-list-id", entityMock.getNextId()],
			))
			;({ mail: mail1, mailDetailsBlob: details1 } = createMailInstances(
				mailFacade,
				[folder1.mails, timestampToGeneratedId(rangeEnd - 1, 1)],
				["details-list-id", entityMock.getNextId()],
			))
			;({
				mail: mail2,
				mailDetailsBlob: details2,
				files,
			} = createMailInstances(
				mailFacade,
				[folder1.mails, timestampToGeneratedId(rangeEnd + 1, 1)],
				["details-list-id", entityMock.getNextId()],
				["attachment-listId", entityMock.getNextId()],
				["attachment-listId1", entityMock.getNextId()],
			))
			;({ mail: mail3, mailDetailsBlob: details3 } = createMailInstances(
				mailFacade,
				[folder1.mails, timestampToGeneratedId(rangeEnd + 3 * 24 * 60 * 60 * 1000, 1)],
				["details-list-id", entityMock.getNextId()],
			))
			;({ mail: mail4, mailDetailsBlob: details4 } = createMailInstances(
				mailFacade,
				[folder2.mails, timestampToGeneratedId(rangeEnd + 5, 1)],
				["details-list-id", entityMock.getNextId()],
			))
			entityMock.addBlobInstances(details0, details1, details2, details3, details4)
			entityMock.addElementInstances(mailbox)
			entityMock.addListInstances(mail0, mail1, mail2, mail3, mail4, folder1, folder2, ...files)
			transaction = createSearchIndexDbStub().createTransaction()
			db = {
				key: aes256RandomKey(),
				iv: fixedIv,
				dbFacade: {
					createTransaction: () => Promise.resolve(transaction),
				},
			} as any
			core = mock(
				new IndexerCore(
					db,
					{
						queueEvents: false,
					} as any,
					browserDataStub,
				),
				(mocked) => {
					mocked.writeIndexUpdate = spy(() => Promise.resolve())
				},
			)
			const infoMessageHandler = object<InfoMessageHandler>()
			indexer = new MailIndexer(core, db, infoMessageHandler, entityMock, entityCache, dateProvider, mailFacade)
		})
		o("one mailbox until certain point", async function () {
			transaction.put(GroupDataOS, mailGroup, {
				indexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			})
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
			o(core.writeIndexUpdate.callCount).equals(1)
			const [mailboxesData1, indexUpdate1] = core.writeIndexUpdate.args
			o(indexUpdate1.create.encInstanceIdToElementData.size).equals(3)

			_checkMailsInIndexUpdate(db, indexUpdate1, mail2, mail3, mail4)

			o(mailboxesData1).deepEquals([
				{
					groupId: mailGroup,
					indexTimestamp: rangeEnd,
				},
			])
		})
		o("one mailbox extend once", async function () {
			transaction.put(GroupDataOS, mailGroup, {
				indexTimestamp: rangeEnd,
			})
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
			const [mailboxesData2, indexUpdateNew2] = core.writeIndexUpdate.args

			_checkMailsInIndexUpdate(db, indexUpdateNew2, mail1)

			o(mailboxesData2).deepEquals([
				{
					groupId: mailGroup,
					indexTimestamp: rangeEnd2,
				},
			])
		})
		o("one mailbox extend till end", async function () {
			transaction.put(GroupDataOS, mailGroup, {
				indexTimestamp: rangeEnd2,
			})
			// next index update - finish indexing
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
			const [mailboxesData3, indexUpdateNew3] = core.writeIndexUpdate.args

			_checkMailsInIndexUpdate(db, indexUpdateNew3, mail0)

			o(mailboxesData3).deepEquals([
				{
					groupId: mailGroup,
					indexTimestamp: FULL_INDEXED_TIMESTAMP,
				},
			])
		})
	})

	function _checkMailsInIndexUpdate(db: Db, indexUpdate: IndexUpdate, ...includedMails: Array<Mail>) {
		for (const [index, mail] of includedMails.entries()) {
			let encInstanceId = encryptIndexKeyBase64(db.key, getElementId(mail), fixedIv)

			if (indexUpdate.create.encInstanceIdToElementData.get(encInstanceId) == null) {
				console.error("mail is not written", mail._id, index)
			}

			o(indexUpdate.create.encInstanceIdToElementData.get(encInstanceId) != null).equals(true)
		}
	}

	o.spec("processEntityEvents", function () {
		let indexUpdate: IndexUpdate
		o.beforeEach(function () {
			indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		})
		o("do nothing if mailIndexing is disabled", async function () {
			const indexer = _prepareProcessEntityTests(false)

			let events = [
				createUpdate(OperationType.CREATE, "mail-list", "1"),
				createUpdate(OperationType.UPDATE, "mail-list", "2"),
				createUpdate(OperationType.DELETE, "mail-list", "3"),
			]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(indexUpdate.delete.encInstanceIds.length).equals(0)
		})
		o("new mail", async function () {
			const indexer = _prepareProcessEntityTests(true)

			let events = [createUpdate(OperationType.CREATE, "new-mail-list", mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			// nothing changed
			// @ts-ignore
			o(indexer.processNewMail.invocations.length).equals(1)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			// @ts-ignore
			o(indexer._core._processDeleted.callCount).equals(0)
		})
		o("moved mail", async function () {
			const indexer = _prepareProcessEntityTests(true)

			let events = [createUpdate(OperationType.CREATE, "new-mail-list", mailId), createUpdate(OperationType.DELETE, "old-mail-list", mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			// @ts-ignore
			o(indexer.processMovedMail.invocations.length).equals(1)
			// @ts-ignore
			o(indexer.processMovedMail.invocations[0]).deepEquals([events[0], indexUpdate])
			// @ts-ignore
			o(indexer._core._processDeleted.callCount).equals(0)
		})
		o("deleted mail", async function () {
			const indexer = _prepareProcessEntityTests(true)

			let events = [createUpdate(OperationType.DELETE, "mail-list", mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			// @ts-ignore
			o(indexer._core._processDeleted.callCount).equals(1)
			// @ts-ignore
			o(indexer._core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})
		o("update draft", async function () {
			const indexer = _prepareProcessEntityTests(true, MailState.DRAFT)

			let events = [createUpdate(OperationType.UPDATE, "new-mail-list", mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			// @ts-ignore
			o(indexer._core._processDeleted.callCount).equals(1)
			// @ts-ignore
			o(indexer._core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})
		o("don't update non-drafts", async function () {
			const indexer = _prepareProcessEntityTests(true, MailState.RECEIVED)

			let events = [createUpdate(OperationType.UPDATE, "new-mail-list", mailId)]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			// @ts-ignore
			o(indexer._core._processDeleted.callCount).equals(0)
		})
	})
	o("_getCurrentIndexTimestamp", () => {
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
		o("not extends if fully indexed", function () {
			const core = makeCore()
			const db = null as any
			const worker = null as any
			const indexer = new MailIndexer(core, db, worker, entityMock, entityCache, dateProvider, mailFacade)
			const user = null as any
			indexer.currentIndexTimestamp = FULL_INDEXED_TIMESTAMP
			// Would blow up if we started indexing because we passed nulls
			return indexer.extendIndexIfNeeded(user, Date.now())
		})
		o("not extends if already indexed range", function () {
			const core = makeCore()
			const db = null as any
			const worker = null as any
			const indexer = new MailIndexer(core, db, worker, entityMock, entityCache, dateProvider, mailFacade)
			const user = null as any
			const newOldTimestamp = Date.now()
			indexer.currentIndexTimestamp = newOldTimestamp - 1000
			// Would blow up if we started indexing because we passed nulls
			return indexer.extendIndexIfNeeded(user, newOldTimestamp)
		})
		o("extends", async function () {
			const user = createTestEntity(UserTypeRef)
			const currentIndexTimestamp = 1554720827674 // 2019-04-08T10:53:47.674Z

			const beforeNowInterval = 1552262400000 // 2019-03-11T00:00:00.000Z

			const dateProvider = new FixedDateProvider(currentIndexTimestamp)
			const indexer = mock(new MailIndexer(null as any, null as any, null as any, entityMock, entityCache, dateProvider, mailFacade), (mocked) => {
				mocked.indexMailboxes = spy(() => Promise.resolve())
			})
			indexer.currentIndexTimestamp = currentIndexTimestamp
			await indexer.extendIndexIfNeeded(user, beforeNowInterval)
			// @ts-ignore
			o(indexer.indexMailboxes.invocations).deepEquals([
				// Start of the day
				[user, beforeNowInterval],
			])
		})
	})

	o.spec("check mail index compatibility with models", function () {
		// if this test fails, you need to think about migrating (or dropping)
		// so old mail indexes use the new attribute ids.
		o("mail does not have an attribute with id LEGACY_TO_RECIPIENTS_ID", function () {
			o(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_TO_RECIPIENTS_ID).length).equals(0)
		})
		o("recipients does not have an attribute with id LEGACY_TO_RECIPIENTS_ID", function () {
			o(Object.values(typeModels.Recipients.associations).filter((v: any) => v.id === LEGACY_TO_RECIPIENTS_ID).length).equals(0)
		})
		o("mail does not have an attribute with id LEGACY_BODY_ID", function () {
			o(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_BODY_ID).length).equals(0)
		})
		o("maildetails does not have an attribute with id LEGACY_BODY_ID", function () {
			o(Object.values(typeModels.MailDetails.associations).filter((v: any) => v.id === LEGACY_BODY_ID).length).equals(0)
		})
		o("mail does not have an attribute with id LEGACY_CC_RECIPIENTS_ID", function () {
			o(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_CC_RECIPIENTS_ID).length).equals(0)
		})
		o("maildetails does not have an attribute with id LEGACY_CC_RECIPIENTS_ID", function () {
			o(Object.values(typeModels.MailDetails.associations).filter((v: any) => v.id === LEGACY_CC_RECIPIENTS_ID).length).equals(0)
		})
		o("mail does not have an attribute with id LEGACY_BCC_RECIPIENTS_ID", function () {
			o(Object.values(typeModels.Mail.associations).filter((v: any) => v.id === LEGACY_BCC_RECIPIENTS_ID).length).equals(0)
		})
		o("maildetails does not have an attribute with id LEGACY_BCC_RECIPIENTS_ID", function () {
			o(Object.values(typeModels.MailDetails.associations).filter((v: any) => v.id === LEGACY_BCC_RECIPIENTS_ID).length).equals(0)
		})
	})
})

function createUpdate(type: OperationType, listId: Id, instanceId: Id, eventId?: Id) {
	let update = createTestEntity(EntityUpdateTypeRef)
	update.operation = type
	update.instanceListId = listId
	update.instanceId = instanceId

	if (eventId) {
		update._id = eventId
	}

	return update
}

async function indexMailboxTest(startTimestamp: number, endIndexTimstamp: number, fullyIndexed: boolean, indexMailList: boolean) {
	let user = createTestEntity(UserTypeRef)
	user.memberships.push(createTestEntity(GroupMembershipTypeRef))
	user.memberships[0].groupType = GroupType.Mail
	user.memberships[0].group = "mail-group-id"
	let mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef)
	mailboxGroupRoot.mailbox = "mailbox-id"
	const groupId = user.memberships[0].group
	mailboxGroupRoot._id = groupId
	let mailbox = createTestEntity(MailBoxTypeRef)
	let mailListId = ["mail-list-id"]
	mailbox._id = "mailbox-id"
	const entityMock = new EntityRestClientMock()
	const entityCacheMock = downcast<DefaultEntityRestCache>(entityMock)
	entityMock.addElementInstances(mailbox, mailboxGroupRoot)
	const dbMock = createSearchIndexDbStub()
	const t = dbMock.createTransaction()
	let groupData = {
		indexTimestamp: startTimestamp,
	}
	t.put(GroupDataOS, groupId, groupData)
	let core: IndexerCore = downcast({
		printStatus: () => {},
		queue: mock(new EventQueue("mailindexer-queue", true, () => Promise.resolve()), (mock) => {
			mock.pause = spy(mock.pause.bind(mock))
			mock.resume = spy(mock.resume.bind(mock))
		}),
		_stats: {},
		resetStats: () => {},
	})
	let db: Db = {
		key: aes256RandomKey(),
		dbFacade: {
			createTransaction: () => Promise.resolve(t),
		},
		iv: fixedIv,
	} as any
	const infoMessageHandler = object<InfoMessageHandler>()
	const indexer = mock(new MailIndexer(core, db, infoMessageHandler, entityMock, entityCacheMock, new LocalTimeDateProvider(), null as any), (mock) => {
		mock.mailIndexingEnabled = true

		mock._loadMailListIds = (mbox) => {
			o(mbox).equals(mailbox)
			return Promise.resolve([mailListId])
		}

		mock._indexMailLists = spy(() => Promise.resolve())
	})
	const indexPromise = indexer.indexMailboxes(user, endIndexTimstamp)
	o(indexer.isIndexing).equals(true)
	await indexPromise
	// @ts-ignore
	o(indexer._core.queue.pause.invocations.length).equals(1)
	// @ts-ignore
	o(indexer._core.queue.resume.invocations.length).equals(1)
	o(indexer.isIndexing).equals(false)

	if (indexMailList) {
		// @ts-ignore
		o(indexer._indexMailLists.callCount).equals(1)
		// @ts-ignore
		const [mailData, oldestTimestamp] = indexer._indexMailLists.args
		const expectedNewestTimestamp =
			groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP ? getDayShifted(getStartOfDay(new Date()), 1).getTime() : groupData.indexTimestamp
		o(mailData).deepEquals([
			{
				mbox: mailbox,
				newestTimestamp: expectedNewestTimestamp,
			},
		])
		o(oldestTimestamp).deepEquals(endIndexTimstamp)
	} else {
		// @ts-ignore
		o(indexer._indexMailLists.callCount).equals(0)
	}
}

function _prepareProcessEntityTests(indexingEnabled: boolean, mailState: MailState = MailState.RECEIVED): MailIndexer {
	let transaction = {
		get: (os, id) => {
			let elementData: ElementDataDbRow = [getListId(mail), new Uint8Array(0), "group-id"]
			return Promise.resolve(elementData)
		},
	}
	let db: Db = downcast({
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: {
			createTransaction: () => Promise.resolve(transaction),
		},
	})
	let core = mock(
		new IndexerCore(
			db,
			{
				queueEvents: false,
			} as any,
			browserDataStub,
		),
		(mocked) => {
			mocked.writeIndexUpdate = spy()
			mocked._processDeleted = spy()
		},
	)
	let mailFacade: MailFacade = object()
	const { mail, mailDetailsBlob } = createMailInstances(mailFacade, ["new-mail-list", mailId], ["details-list-id", "details-id"])
	mail.state = mailState
	const entityMock = new EntityRestClientMock()
	entityMock.addBlobInstances(mailDetailsBlob)
	entityMock.addListInstances(mail)
	return mock(new MailIndexer(core, db, null as any, entityMock, downcast(entityMock), new LocalTimeDateProvider(), mailFacade), (mocked) => {
		mocked.processNewMail = spy(mocked.processNewMail.bind(mocked))
		mocked.processMovedMail = spy(mocked.processMovedMail.bind(mocked))
		mocked.mailIndexingEnabled = indexingEnabled
	})
}

function createMailInstances(
	mailFacade: MailFacade,
	mailId: IdTuple,
	mailDetailsBlobId: IdTuple,
	...attachmentIds: Array<IdTuple>
): {
	mail: Mail
	mailDetailsBlob: MailDetailsBlob
	files: Array<TutanotaFile>
} {
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
	when(mailFacade.loadAttachments(mail)).thenResolve(files)
	return {
		mail,
		mailDetailsBlob,
		files: files,
	}
}
