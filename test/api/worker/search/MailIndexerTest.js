// @flow
import o from "ospec"
import {NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import type {Db, ElementDataDbRow, IndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate, encryptIndexKeyBase64, typeRefToTypeInfo} from "../../../../src/api/worker/search/IndexUtils"
import type {MailStateEnum, OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {
	FULL_INDEXED_TIMESTAMP,
	GroupType,
	MailState,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType
} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {_getCurrentIndexTimestamp, INITIAL_MAIL_INDEX_INTERVAL_DAYS, MailIndexer} from "../../../../src/api/worker/search/MailIndexer"
import type {Mail} from "../../../../src/api/entities/tutanota/Mail"
import {_TypeModel as MailModel, createMail, MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import type {MailBody} from "../../../../src/api/entities/tutanota/MailBody"
import {createMailBody} from "../../../../src/api/entities/tutanota/MailBody"
import type {File as TutanotaFile} from "../../../../src/api/entities/tutanota/File"
import {createFile} from "../../../../src/api/entities/tutanota/File"
import {createMailAddress} from "../../../../src/api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../../../../src/api/entities/tutanota/EncryptedMailAddress"
import {ElementDataOS, GroupDataOS, Metadata as MetaData, MetaDataOS} from "../../../../src/api/worker/search/Indexer"
import type {MailFolder} from "../../../../src/api/entities/tutanota/MailFolder"
import {createMailFolder} from "../../../../src/api/entities/tutanota/MailFolder"
import type {EntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {mock, spy} from "@tutao/tutanota-test-utils"
import {browserDataStub, makeCore} from "../../TestUtils"
import {downcast, getDayShifted, getStartOfDay, neverNull} from "@tutao/tutanota-utils"
import {fixedIv} from "../../../../src/api/worker/crypto/CryptoUtils"
import {EventQueue} from "../../../../src/api/worker/search/EventQueue"
import {createMailboxGroupRoot} from "../../../../src/api/entities/tutanota/MailboxGroupRoot"
import type {MailBox} from "../../../../src/api/entities/tutanota/MailBox"
import {createMailBox} from "../../../../src/api/entities/tutanota/MailBox"
import {createSearchIndexDbStub} from "./DbStub"
import {WorkerImpl} from "../../../../src/api/worker/WorkerImpl"
import {getElementId, getListId, timestampToGeneratedId} from "../../../../src/api/common/utils/EntityUtils"
import {createMailFolderRef} from "../../../../src/api/entities/tutanota/MailFolderRef"
import {EntityRestClientMock} from "../EntityRestClientMock"
import type {DateProvider} from "../../../../src/api/worker/DateProvider"
import {LocalTimeDateProvider} from "../../../../src/api/worker/DateProvider"

class FixedDateProvider implements DateProvider {
	now: number;

	constructor(now: number) {
		this.now = now;
	}

	getStartOfDayShiftedBy(shiftedBy: number) {
		const date = getDayShifted(new Date(this.now), shiftedBy)
		// Making start of the day in UTC to make it determenistic. beforeNowInterval is calculated just like that and hardcoded to be reliable
		date.setUTCHours(0, 0, 0, 0)
		return date
	}
}

const dbMock: any = {iv: fixedIv}
const emptyFutureActionsObj = {deleted: {}, moved: {}}
const mailId = "L-dNNLe----0"

o.spec("MailIndexer test", () => {

	let entityMock: EntityRestClientMock
	let dateProvider: DateProvider
	o.beforeEach(function () {
		entityMock = new EntityRestClientMock()
		dateProvider = new LocalTimeDateProvider()
	})

	o("createMailIndexEntries without entries", function () {
		let mail = createMail()
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore(dbMock, (null: any), browserDataStub), (null: any), (null: any), (null: any), (null: any), dateProvider)
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(0)
	})

	o("createMailIndexEntries with one entry", function () {
		let mail = createMail()
		mail.subject = "Hello"
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore(dbMock, (null: any), browserDataStub), (null: any), (null: any), (null: any), (null: any), dateProvider)
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(1)
	})

	o("createMailIndexEntries", function () {
		let core: IndexerCore = ({createIndexEntriesForAttributes: o.spy(), _stats: {}}: any)
		let indexer = new MailIndexer(core, dbMock, (null: any), (null: any), (null: any), dateProvider)

		let toRecipients = [createMailAddress(), createMailAddress()]
		toRecipients[0].address = "tr0A"
		toRecipients[0].name = "tr0N"
		toRecipients[1].address = "tr1A"
		toRecipients[1].name = "tr1N"

		let ccRecipients = [createMailAddress(), createMailAddress()]
		ccRecipients[0].address = "ccr0A"
		ccRecipients[0].name = "ccr0N"
		ccRecipients[1].address = "ccr1A"
		ccRecipients[1].name = "ccr1N"

		let bccRecipients = [createMailAddress(), createMailAddress()]
		bccRecipients[0].address = "bccr0A"
		bccRecipients[0].name = "bccr0N"
		bccRecipients[1].address = "bccr1A"
		bccRecipients[1].name = "bccr1N"

		let replyTo = createEncryptedMailAddress()
		replyTo.address = "rToA"
		replyTo.address = "rToN"

		let sender = createMailAddress()
		sender.address = "SA"
		sender.name = "SN"

		let mail = createMail()
		mail.differentEnvelopeSender = "ES" // not indexed
		mail.subject = "Su"
		mail.bccRecipients = bccRecipients
		mail.ccRecipients = ccRecipients
		mail.toRecipients = toRecipients
		mail.replyTos = [replyTo] // not indexed
		mail.sender = sender

		let body = createMailBody()
		body.text = "BT"
		let files = [createFile()]
		files[0].mimeType = "binary" // not indexed
		files[0].name = "FN"

		indexer.createMailIndexEntries(mail, body, files)

		let args = core.createIndexEntriesForAttributes.args
		o(args[0]).equals(MailModel)
		o(args[1]).equals(mail)
		let attributeHandlers = core.createIndexEntriesForAttributes.args[2]
		let attributes = attributeHandlers.map(h => {
			return {attribute: h.attribute.id, value: h.value()}
		})
		o(JSON.stringify(attributes)).deepEquals(JSON.stringify([
			{attribute: MailModel.values["subject"].id, value: "Su"},
			{attribute: MailModel.associations["toRecipients"].id, value: "tr0N <tr0A>,tr1N <tr1A>"},
			{attribute: MailModel.associations["ccRecipients"].id, value: "ccr0N <ccr0A>,ccr1N <ccr1A>"},
			{attribute: MailModel.associations["bccRecipients"].id, value: "bccr0N <bccr0A>,bccr1N <bccr1A>"},
			{attribute: MailModel.associations["sender"].id, value: "SN <SA>"},
			{attribute: MailModel.associations["body"].id, value: "BT"},
			{attribute: MailModel.associations["attachments"].id, value: "FN"},
		]))
	})


	o("processNewMail", function (done) {
		const [mailListId, mailElementId] = ["mail-list-id", "mail-element-id"]
		const {mail, body, files} = createMailInstances([mailListId, mailElementId], "body-id", ["file-list-id", "file-id"])
		let keyToIndexEntries = new Map()
		let event: EntityUpdate = ({instanceListId: mailListId, instanceId: mailElementId}: any)
		entityMock.addListInstances(mail, ...files)
		entityMock.addElementInstances(body)
		let indexer = mock(new MailIndexer((null: any), dbMock, (null: any), entityMock, entityMock, dateProvider), mocked => {
			mocked.createMailIndexEntries = o.spy((mailParam, bodyParam, filesParam) => {
				o(mailParam).deepEquals(mail)
				o(bodyParam).deepEquals(body)
				o(filesParam).deepEquals(files)
				return keyToIndexEntries
			})
		})
		indexer.processNewMail(event).then(result => {
			o(indexer.createMailIndexEntries.callCount).equals(1)
			o(result).deepEquals({mail, keyToIndexEntries})
		}).then(done)
	})

	o("processNewMail catches NotFoundError", async function () {
		const indexer = new MailIndexer((null: any), (null: any), (null: any), entityMock, entityMock, dateProvider)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		const result = await indexer.processNewMail(event)
		o(result).equals(null)
	})

	o("processNewMail catches NotAuthorizedError", function (done) {
		entityMock.setException("eid", new NotAuthorizedError("blah"))
		const indexer = new MailIndexer((null: any), (null: any), (null: any), entityMock, entityMock, dateProvider)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		indexer.processNewMail(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewMail passes other Errors", function (done) {
		entityMock.setException(["lid", "eid"], new Error("blah"))
		const indexer = new MailIndexer((null: any), (null: any), (null: any), entityMock, entityMock, dateProvider)
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		indexer.processNewMail(event).catch(e => {
			done()
		})
	})

	o("processMovedMail", function (done) {
		let event: EntityUpdate = ({instanceListId: "new-list-id", instanceId: "eid"}: any)
		let elementData: ElementDataDbRow = ["old-list-id", new Uint8Array(0), "owner-group-id"]
		let db: Db = ({
			key: aes256RandomKey(),
			iv: fixedIv,
			dbFacade: {createTransaction: () => Promise.resolve(transaction)}
		}: any)
		let encInstanceId = encryptIndexKeyBase64(db.key, event.instanceId, fixedIv)

		let transaction = {
			get: (os, id) => {
				o(os).equals(ElementDataOS)
				o(Array.from(id)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			}
		}

		const indexer = new MailIndexer((null: any), db, (null: any), (null: any), (null: any), dateProvider)

		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		indexer.processMovedMail(event, indexUpdate).then(() => {
			o(indexUpdate.move.length).equals(1)
			o(Array.from(indexUpdate.move[0].encInstanceId)).deepEquals(Array.from(encInstanceId))
			o(indexUpdate.move[0].newListId).equals(event.instanceListId)
			done()
		})
	})

	o("processMovedMail that does not exist", function (done) {
		let transaction = {
			get: (os, id) => {
				o(os).equals(ElementDataOS)
				o(Array.from(id)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(null)
			}
		}

		let db: Db = ({
			key: aes256RandomKey(),
			iv: fixedIv,
			dbFacade: {createTransaction: () => Promise.resolve(transaction)}
		}: any)

		let event: EntityUpdate = ({instanceListId: "new-list-id", instanceId: "eid"}: any)
		let encInstanceId = encryptIndexKeyBase64(db.key, event.instanceId, fixedIv)

		const core: any = {encryptSearchIndexEntries: o.spy()}
		const indexer: any = new MailIndexer(core, db, (null: any), (null: any), (null: any), dateProvider)
		let result = {mail: {_id: 'mail-id', _ownerGroup: 'owner-group'}, keyToIndexEntries: new Map()}
		indexer.processNewMail = o.spy(() => Promise.resolve(result))

		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		indexer.processMovedMail(event, indexUpdate).then(() => {
			o(indexUpdate.move.length).equals(0)
			o(indexer.processNewMail.callCount).equals(1)
			o(core.encryptSearchIndexEntries.callCount).equals(1)
			o(core.encryptSearchIndexEntries.args)
				.deepEquals([result.mail._id, result.mail._ownerGroup, result.keyToIndexEntries, indexUpdate])
			done()
		})
	})

	o("enableMailIndexing", function (done) {
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
			wait: () => Promise.resolve()
		}


		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.Mail

		let spamFolder = createMailFolder()
		spamFolder.mails = "mail-list-id"
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}: any)

		// There was a timezone shift in Germany in this time range
		const now = 1554720827674 // 2019-04-08T10:53:47.674Z
		const beforeNowInterval = 1552262400000 // 2019-03-11T00:00:00.000Z
		const dateProvider = new FixedDateProvider(now)

		const indexer = mock(new MailIndexer((null: any), db, (null: any), (null: any), (null: any), dateProvider), (mocked) => {
			mocked.indexMailboxes = spy(() => Promise.resolve())
			mocked.mailIndexingEnabled = false
			mocked._excludedListIds = []
			mocked._getSpamFolder = (membership) => {
				o(membership).deepEquals(user.memberships[0])
				return spamFolder
			}
		})

		indexer.enableMailIndexing(user).then(() => {
			o(indexer.indexMailboxes.invocations[0])
				.deepEquals([user, beforeNowInterval])

			o(indexer.mailIndexingEnabled).equals(true)
			o(indexer._excludedListIds).deepEquals([spamFolder.mails])
			o(JSON.stringify(metadata)).deepEquals(JSON.stringify({
				[MetaData.mailIndexingEnabled]: true,
				[MetaData.excludedListIds]: [spamFolder.mails]
			}))
			done()
		})
	})

	o("enableMailIndexing already enabled", function (done) {
		let transaction = {
			get: (os, key) => {
				o(os).equals(MetaDataOS)
				if (key == MetaData.mailIndexingEnabled) {
					return Promise.resolve(true)
				} else if (key == MetaData.excludedListIds) {
					return Promise.resolve([1, 2])
				}
				throw new Error("wrong key / os")
			}
		}

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}: any)
		const indexer: any = new MailIndexer((null: any), db, (null: any), (null: any), (null: any), dateProvider)
		indexer.indexMailboxes = o.spy()

		indexer.mailIndexingEnabled = false
		indexer._excludedListIds = []

		let user = createUser()
		indexer.enableMailIndexing(user).then(() => {
			o(indexer.indexMailboxes.callCount).equals(0)
			o(indexer.mailIndexingEnabled).equals(true)
			o(indexer._excludedListIds).deepEquals([1, 2])
			done()
		})
	})

	o("disableMailIndexing", function () {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {deleteDatabase: o.spy()}}: any)
		const indexer: any = new MailIndexer((null: any), db, (null: any), (null: any), (null: any), dateProvider)
		indexer.mailIndexingEnabled = true
		indexer._excludedListIds = [1]
		indexer.disableMailIndexing()
		o(indexer.mailIndexingEnabled).equals(false)
		o(indexer._excludedListIds).deepEquals([])
		o(db.dbFacade.deleteDatabase.callCount).equals(1)
	})

	o("indexMailboxes disabled", function (done) {
		const indexer = mock(new MailIndexer((null: any), (null: any), (null: any), entityMock, entityMock, dateProvider), (mocked) => {
			mocked.mailIndexingEnabled = false
			mocked.indexMailboxes(createUser(), 1512946800000).then(done)
		})
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
		const folder = createMailFolder()
		folder._id = [neverNull(mailbox.systemFolders).folders, entityMock.getNextId()]
		folder.mails = entityMock.getNextId()
		folder.subFolders = entityMock.getNextId()
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
		let mail0, body0, mail1, body1, mail2, body2, files, mail3, body3, mail4, body4;
		let transaction, core, indexer, db

		o.beforeEach(() => {
			mailbox = createMailBox()
			mailbox._id = "mailbox-id"
			mailbox._ownerGroup = mailGroup

			const folderRef = createMailFolderRef()
			folderRef.folders = entityMock.getNextId()
			mailbox.systemFolders = folderRef
			folder1 = _addFolder(mailbox)
			folder2 = _addFolder(mailbox)

			;({mail: mail0, body: body0} = createMailInstances([
				folder1.mails, timestampToGeneratedId(rangeEndShifted2Days, 1)
			], entityMock.getNextId()))
			;({mail: mail1, body: body1} = createMailInstances([
				folder1.mails, timestampToGeneratedId(rangeEnd - 1, 1)
			], entityMock.getNextId()))
			;({mail: mail2, body: body2, files} = createMailInstances([
					folder1.mails, timestampToGeneratedId(rangeEnd + 1, 1)
				], entityMock.getNextId(),
				["attachment-listId", entityMock.getNextId()],
				["attachment-listId1", entityMock.getNextId()]))
			;({mail: mail3, body: body3} = createMailInstances([
				folder1.mails, timestampToGeneratedId(rangeEnd + 3 * 24 * 60 * 60 * 1000, 1)
			], entityMock.getNextId()))
			;({mail: mail4, body: body4} = createMailInstances([
				folder2.mails, timestampToGeneratedId(rangeEnd + 5, 1)
			], entityMock.getNextId()))

			entityMock.addElementInstances(body0, body1, body2, body3, body4, mailbox)
			entityMock.addListInstances(mail0, mail1, mail2, mail3, mail4, folder1, folder2, ...files)

			transaction = createSearchIndexDbStub().createTransaction()
			db = ({key: aes256RandomKey(), iv: fixedIv, dbFacade: {createTransaction: () => Promise.resolve(transaction)}}: any)
			core = mock(new IndexerCore(db, ({queueEvents: false}: any), browserDataStub), (mocked) => {
				mocked.writeIndexUpdate = o.spy(() => Promise.resolve())
			})

			const worker = ({sendIndexState: () => Promise.resolve()}: any)
			indexer = new MailIndexer(core, db, worker, entityMock, entityMock, dateProvider)
		})

		o("one mailbox until certain point", async function () {
			transaction.put(GroupDataOS, mailGroup, {indexTimestamp: NOTHING_INDEXED_TIMESTAMP})

			// initial indexing - first time range
			await indexer._indexMailLists([{mbox: mailbox, newestTimestamp: rangeStart}], rangeEnd)

			o(core.writeIndexUpdate.callCount).equals(1)
			const [mailboxesData1, indexUpdate1] = core.writeIndexUpdate.args
			o(indexUpdate1.create.encInstanceIdToElementData.size).equals(3)
			_checkMailsInIndexUpdate(db, indexUpdate1, mail2, mail3, mail4)
			o(mailboxesData1).deepEquals([{groupId: mailGroup, indexTimestamp: rangeEnd}])

		})

		o("one mailbox extend once", async function () {
			transaction.put(GroupDataOS, mailGroup, {indexTimestamp: rangeEnd})

			// next index update - continue indexing
			await indexer._indexMailLists([{mbox: mailbox, newestTimestamp: rangeEnd}], rangeEnd2)

			const [mailboxesData2, indexUpdateNew2] = core.writeIndexUpdate.args
			_checkMailsInIndexUpdate(db, indexUpdateNew2, mail1)
			o(mailboxesData2).deepEquals([{groupId: mailGroup, indexTimestamp: rangeEnd2}])
		})

		o("one mailbox extend till end", async function () {
			transaction.put(GroupDataOS, mailGroup, {indexTimestamp: rangeEnd2})

			// next index update - finish indexing
			const rangeEnd3 = getDayShifted(new Date(rangeEnd2), -1).getTime()

			await indexer._indexMailLists([{mbox: mailbox, newestTimestamp: rangeEnd2}], rangeEnd3)
			const [mailboxesData3, indexUpdateNew3] = core.writeIndexUpdate.args
			_checkMailsInIndexUpdate(db, indexUpdateNew3, mail0)
			o(mailboxesData3).deepEquals([{groupId: mailGroup, indexTimestamp: FULL_INDEXED_TIMESTAMP}])
		})
	})


	function _checkMailsInIndexUpdate(db: Db, indexUpdate: IndexUpdate, ...includedMails: Array<Mail>) {
		includedMails.forEach((mail, index) => {
			let encInstanceId = encryptIndexKeyBase64(db.key, getElementId(mail), fixedIv)
			if (indexUpdate.create.encInstanceIdToElementData.get(encInstanceId) == null) {
				console.error("mail is not written", mail._id, index)
			}
			o(indexUpdate.create.encInstanceIdToElementData.get(encInstanceId) != null).equals(true)
		})
	}

	o.spec("processEntityEvents", function () {
		let indexUpdate: IndexUpdate
		o.beforeEach(function () {
			indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		})

		o("do nothing if mailIndexing is disabled", async function () {
			const indexer = _prepareProcessEntityTests(false)
			let events = [
				createUpdate(OperationType.CREATE, "mail-list", "1"), createUpdate(OperationType.UPDATE, "mail-list", "2"),
				createUpdate(OperationType.DELETE, "mail-list", "3")
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
			o(indexer.processNewMail.invocations.length).equals(1)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(0)
		})

		o("moved mail", async function () {
			const indexer = _prepareProcessEntityTests(true)
			let events = [
				createUpdate(OperationType.CREATE, "new-mail-list", mailId),
				createUpdate(OperationType.DELETE, "old-mail-list", mailId)
			]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexer.processMovedMail.invocations.length).equals(1)
			o(indexer.processMovedMail.invocations[0]).deepEquals([events[0], indexUpdate])
			o(indexer._core._processDeleted.callCount).equals(0)
		})


		o("deleted mail", async function () {
			const indexer = _prepareProcessEntityTests(true)
			let events = [createUpdate(OperationType.DELETE, "mail-list", mailId)]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(1)
			o(indexer._core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})

		o("update draft", async function () {
			const indexer = _prepareProcessEntityTests(true, MailState.DRAFT)
			let events = [createUpdate(OperationType.UPDATE, "new-mail-list", mailId)]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(1)
			o(indexer._core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})

		o("don't update non-drafts", async function () {
			const indexer = _prepareProcessEntityTests(true, MailState.RECEIVED)
			let events = [createUpdate(OperationType.UPDATE, "new-mail-list", mailId)]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
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

	o.spec("extendIndexIfNeeded", async function () {
		o("not extends if fully indexed", function () {
			const core = makeCore()
			const db = (null: any)
			const worker = (null: any)
			const indexer = new MailIndexer(core, db, worker, entityMock, entityMock, dateProvider)
			const user = (null: any)
			indexer.currentIndexTimestamp = FULL_INDEXED_TIMESTAMP

			// Would blow up if we started indexing because we passed nulls
			return indexer.extendIndexIfNeeded(user, Date.now())
		})

		o("not extends if already indexed range", function () {
			const core = makeCore()
			const db = (null: any)
			const worker = (null: any)
			const indexer = new MailIndexer(core, db, worker, entityMock, entityMock, dateProvider)
			const user = (null: any)
			const newOldTimestamp = Date.now()
			indexer.currentIndexTimestamp = newOldTimestamp - 1000

			// Would blow up if we started indexing because we passed nulls
			return indexer.extendIndexIfNeeded(user, newOldTimestamp)
		})

		o("extends", async function () {
			const user = createUser()

			const currentIndexTimestamp = 1554720827674 // 2019-04-08T10:53:47.674Z
			const beforeNowInterval = 1552262400000 // 2019-03-11T00:00:00.000Z
			const dateProvider = new FixedDateProvider(currentIndexTimestamp)
			const indexer = mock(new MailIndexer((null: any), (null: any), (null: any), entityMock, entityMock, dateProvider), (mocked) => {
				mocked.indexMailboxes = spy(() => Promise.resolve())
			})
			indexer.currentIndexTimestamp = currentIndexTimestamp

			await indexer.extendIndexIfNeeded(user, beforeNowInterval)

			o(indexer.indexMailboxes.invocations).deepEquals([
				// Start of the day
				[user, beforeNowInterval]
			])
		})
	})
})

function createUpdate(type: OperationTypeEnum, listId: Id, instanceId: Id, eventId?: Id) {
	let update = createEntityUpdate()
	update.operation = type
	update.instanceListId = listId
	update.instanceId = instanceId
	if (eventId) {
		update._id = eventId
	}
	return update
}


async function indexMailboxTest(startTimestamp: number, endIndexTimstamp: number, fullyIndexed: boolean, indexMailList: boolean) {
	let user = createUser()
	user.memberships.push(createGroupMembership())
	user.memberships[0].groupType = GroupType.Mail
	user.memberships[0].group = "mail-group-id"

	let mailboxGroupRoot = createMailboxGroupRoot()
	mailboxGroupRoot.mailbox = "mailbox-id"
	const groupId = user.memberships[0].group
	mailboxGroupRoot._id = groupId
	let mailbox = createMailBox()
	let mailListId = ["mail-list-id"]
	mailbox._id = "mailbox-id"

	const entityMock = new EntityRestClientMock()
	entityMock.addElementInstances(mailbox, mailboxGroupRoot)

	const dbMock = createSearchIndexDbStub()
	const t = dbMock.createTransaction()
	let groupData = {indexTimestamp: startTimestamp}
	t.put(GroupDataOS, groupId, groupData)
	let core: IndexerCore = downcast({
		printStatus: () => {
		},
		queue: mock(new EventQueue(true, () => Promise.resolve()), (mock) => {
			mock.pause = spy(mock.pause.bind(mock))
			mock.resume = spy(mock.resume.bind(mock))
		}),
		_stats: {},
		resetStats: () => {}
	})
	let db: Db = ({
		key: aes256RandomKey(),
		dbFacade: {createTransaction: () => Promise.resolve(t)},
		iv: fixedIv
	}: any)
	let worker: WorkerImpl = ({sendIndexState: o.spy()}: any)
	const indexer = mock(new MailIndexer(core, db, worker, entityMock, entityMock, new LocalTimeDateProvider()), (mock) => {
		mock.mailIndexingEnabled = true
		mock._loadMailListIds = (mbox) => {
			o(mbox).equals(mailbox)
			return Promise.resolve([mailListId])
		}
		mock._indexMailLists = o.spy(() => Promise.resolve())
	})

	const indexPromise = indexer.indexMailboxes(user, endIndexTimstamp)
	o(indexer.isIndexing).equals(true)
	await indexPromise

	o(indexer._core.queue.pause.invocations.length).equals(1)
	o(indexer._core.queue.resume.invocations.length).equals(1)
	o(indexer.isIndexing).equals(false)
	if (indexMailList) {
		o(indexer._indexMailLists.callCount).equals(1)
		const [mailData, oldestTimestamp] = indexer._indexMailLists.args
		const expectedNewestTimestamp = groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP
			? getDayShifted(getStartOfDay(new Date()), 1).getTime()
			: groupData.indexTimestamp
		o(mailData).deepEquals([
			{
				mbox: mailbox, newestTimestamp: expectedNewestTimestamp
			}
		])
		o(oldestTimestamp).deepEquals(endIndexTimstamp)
	} else {
		o(indexer._indexMailLists.callCount).equals(0)
	}
}


function _prepareProcessEntityTests(indexingEnabled: boolean, mailState: MailStateEnum = MailState.RECEIVED): MailIndexer {

	let transaction = {
		get: (os, id) => {
			let elementData: ElementDataDbRow = [getListId(mail), new Uint8Array(0), "group-id"]
			return Promise.resolve(elementData)
		}
	}
	let db: Db = downcast({
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: {createTransaction: () => Promise.resolve(transaction)}
	})

	let core = mock(new IndexerCore(db, ({queueEvents: false}: any), browserDataStub), (mocked) => {
		mocked.writeIndexUpdate = o.spy()
		mocked._processDeleted = o.spy()
	})

	const {mail, body} = createMailInstances(["new-mail-list", mailId], "body-id")
	mail.state = mailState
	const entityMock = new EntityRestClientMock()
	entityMock.addElementInstances(body)
	entityMock.addListInstances(mail)
	return mock(new MailIndexer(core, db, (null: any), entityMock, entityMock, new LocalTimeDateProvider()), (mocked) => {
		mocked.processNewMail = spy(mocked.processNewMail.bind(mocked))
		mocked.processMovedMail = spy(mocked.processMovedMail.bind(mocked))
		mocked.mailIndexingEnabled = indexingEnabled
	})
}

function createMailInstances(mailId: IdTuple, bodyId: Id, ...attachmentIds: Array<IdTuple>): {mail: Mail, body: MailBody, files: Array<TutanotaFile>} {
	let mail = createMail()
	mail._id = mailId
	mail.body = bodyId
	mail.attachments = attachmentIds
	let body = createMailBody()
	body._id = bodyId
	return {
		mail,
		body,
		files: attachmentIds.map(id => {
			const file = createFile()
			file._id = id
			return file
		})
	}
}
