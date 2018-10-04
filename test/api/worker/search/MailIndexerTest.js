// @flow
import o from "ospec/ospec.js"
import {NotAuthorizedError, NotFoundError} from "../../../../src/api/common/error/RestError"
import type {Db, ElementData, IndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate, encryptIndexKeyBase64} from "../../../../src/api/worker/search/IndexUtils"
import {ElementDataOS, GroupDataOS, MetaDataOS} from "../../../../src/api/worker/search/DbFacade"
import type {MailStateEnum, OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {FULL_INDEXED_TIMESTAMP, GroupType, MailState, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {timestampToGeneratedId} from "../../../../src/api/common/utils/Encoding"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {_getCurrentIndexTimestamp, INITIAL_MAIL_INDEX_INTERVAL_DAYS, MAIL_INDEXER_CHUNK, MailIndexer} from "../../../../src/api/worker/search/MailIndexer"
import {_TypeModel as MailModel, createMail, MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody, MailBodyTypeRef} from "../../../../src/api/entities/tutanota/MailBody"
import {createFile, FileTypeRef} from "../../../../src/api/entities/tutanota/File"
import {createMailAddress} from "../../../../src/api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../../../../src/api/entities/tutanota/EncryptedMailAddress"
import {GENERATED_MAX_ID, getListId, isSameId, isSameTypeRef} from "../../../../src/api/common/EntityFunctions"
import {Metadata as MetaData} from "../../../../src/api/worker/search/Indexer"
import {createMailFolder} from "../../../../src/api/entities/tutanota/MailFolder"
import {getDayShifted, getStartOfDay} from "../../../../src/api/common/utils/DateUtils"
import type {WorkerImpl} from "../../../../src/api/worker/WorkerImpl"
import {createMailboxGroupRoot, MailboxGroupRootTypeRef} from "../../../../src/api/entities/tutanota/MailboxGroupRoot"
import {createMailBox, MailBoxTypeRef} from "../../../../src/api/entities/tutanota/MailBox"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {mock, replaceAllMaps, spy} from "../../TestUtils"
import {downcast, neverNull} from "../../../../src/api/common/utils/Utils"
import {deepEqual} from "../../common/UtilsTest"
import {fixedIv} from "../../../../src/api/worker/crypto/CryptoFacade"
import type {FutureBatchActions} from "../../../../src/api/worker/search/EventQueue"
import {EventQueue} from "../../../../src/api/worker/search/EventQueue"


const dbMock: any = {iv: fixedIv}
const emptyFutureActions: FutureBatchActions = {deleted: new Map(), moved: new Map()}
const emptyFutureActionsObj = {deleted: {}, moved: {}}

o.spec("MailIndexer test", () => {
	o("createMailIndexEntries without entries", function () {
		let mail = createMail()
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore(dbMock, (null: any)), (null: any), (null: any), (null: any), (null: any))
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(0)
	})

	o("createMailIndexEntries with one entry", function () {
		let mail = createMail()
		mail.subject = "Hello"
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore(dbMock, (null: any)), (null: any), (null: any), (null: any), (null: any))
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(1)
	})

	o("createMailIndexEntries", function () {
		let core: IndexerCore = ({createIndexEntriesForAttributes: o.spy(), _stats: {}}: any)
		let indexer = new MailIndexer(core, dbMock, (null: any), (null: any), (null: any))

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
			return {attribute: h.attribute.name, value: h.value()}
		})
		o(JSON.stringify(attributes)).deepEquals(JSON.stringify([
			{attribute: "subject", value: "Su"},
			{attribute: "toRecipients", value: "tr0N <tr0A>,tr1N <tr1A>"},
			{attribute: "ccRecipients", value: "ccr0N <ccr0A>,ccr1N <ccr1A>"},
			{attribute: "bccRecipients", value: "bccr0N <bccr0A>,bccr1N <bccr1A>"},
			{attribute: "sender", value: "SN <SA>"},
			{attribute: "body", value: "BT"},
			{attribute: "attachments", value: "FN"},
		]))
	})


	o("processNewMail", function (done) {
		let mail = createMail()
		mail.body = "body-id"
		mail.attachments = [["file-list-id", "file-id"]]
		let body = createMailBody()
		let files = [createFile()]
		let keyToIndexEntries = new Map()

		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		let entity = ({
			load: (type, id) => {
				if (type === MailTypeRef && isSameId(id, [event.instanceListId, event.instanceId])) {
					return Promise.resolve(mail)
				} else if (type === MailBodyTypeRef && isSameId(id, mail.body)) {
					return Promise.resolve(body)
				} else if (type === FileTypeRef && isSameId(id, mail.attachments[0])) {
					return Promise.resolve(files[0])
				}
				Promise.reject("Wrong type / id")
			}
		}: any)
		let indexer = mock(new MailIndexer((null: any), dbMock, entity, (null: any), (null: any)), mocked => {
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

	o("processNewMail catches NotFoundError", function (done) {
		let entity = ({
			load: () => Promise.reject(new NotFoundError("blah"))
		}: any)
		const indexer = new MailIndexer((null: any), (null: any), entity, (null: any), (null: any))
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		indexer.processNewMail(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewMail catches NotAuthorizedError", function (done) {
		let entity = ({
			load: () => Promise.reject(new NotAuthorizedError("blah"))
		}: any)
		const indexer = new MailIndexer((null: any), (null: any), entity, (null: any), (null: any))
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		indexer.processNewMail(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewMail passes other Errors", function (done) {
		let entity = ({
			load: () => Promise.reject(new Error("blah"))
		}: any)
		const indexer = new MailIndexer((null: any), (null: any), entity, (null: any), (null: any))
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}: any)
		indexer.processNewMail(event).catch(Error, e => {
			done()
		})
	})

	o("processMovedMail", function (done) {
		let event: EntityUpdate = ({instanceListId: "new-list-id", instanceId: "eid"}: any)
		let elementData: ElementData = ["old-list-id", new Uint8Array(0), "owner-group-id"]
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

		const indexer = new MailIndexer((null: any), db, (null: any), (null: any), (null: any))

		let indexUpdate = _createNewIndexUpdate("group-id")
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
		const indexer: any = new MailIndexer(core, db, (null: any), (null: any), (null: any))
		let result = {mail: {_id: 'mail-id', _ownerGroup: 'owner-group'}, keyToIndexEntries: new Map()}
		indexer.processNewMail = o.spy(() => Promise.resolve(result))

		let indexUpdate = _createNewIndexUpdate("group-id")
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
		const indexer = mock(new MailIndexer((null: any), db, (null: any), (null: any), (null: any)), (mocked) => {
			mocked.indexMailboxes = spy(() => Promise.resolve())
			mocked.mailIndexingEnabled = false
			mocked._excludedListIds = []
			mocked._getSpamFolder = (membership) => {
				o(membership).deepEquals(user.memberships[0])
				return spamFolder
			}
		})

		indexer.enableMailIndexing(user).then(() => {
			o(indexer.indexMailboxes.invocations)
				.deepEquals([
					[user, getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL_DAYS))]
				])

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
		const indexer: any = new MailIndexer((null: any), db, (null: any), (null: any), (null: any))
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
		const indexer: any = new MailIndexer((null: any), db, (null: any), (null: any), (null: any))
		indexer.mailIndexingEnabled = true
		indexer._excludedListIds = [1]
		indexer.disableMailIndexing()
		o(indexer.mailIndexingEnabled).equals(false)
		o(indexer._excludedListIds).deepEquals([])
		o(db.dbFacade.deleteDatabase.callCount).equals(1)
	})

	o("indexMailboxes disabled", function (done) {
		let entity: any = {}
		const indexer = mock(new MailIndexer((null: any), (null: any), entity, (null: any), (null: any)), (mocked) => {
			mocked.mailIndexingEnabled = false
			mocked.indexMailboxes(createUser(), 1512946800000).then(done)
		})
	})

	o.spec("indexMailboxes", function () {
		o("initial indexing", function (done) {
			indexMailboxTest(NOTHING_INDEXED_TIMESTAMP, 1512946800000, true, done, true)
		})

		o("further indexing", function (done) {
			indexMailboxTest(1513033200000, 1512946800000, false, done, true)
		})

		o("fully indexed", function (done) {
			indexMailboxTest(FULL_INDEXED_TIMESTAMP, 1512946800000, true, done, false)
		})
	})

	o("_indexMailList", function () {
		let mailbox = createMailBox()
		mailbox.sentAttachments = "sent-attachments-list"
		mailbox.receivedAttachments = "received-attachments-list"
		let mailListId = "mail-list-id"
		let mailGroupId = "mail-group-id"
		let startId = timestampToGeneratedId(1513033200000)
		let endId = timestampToGeneratedId(1512946800000)
		let mails = [createMail(), createMail()]
		mails[0]._id = [mailListId, timestampToGeneratedId(1512946800000 - 1)]// should be filtered out as id < endId
		mails[1]._id = [mailListId, timestampToGeneratedId(1512946800000 + 1)]
		mails[1].body = "body-id1"
		const fileIds = [
			["attachment-listId", "attachment-element-id"], ["attachment-listId1", "attachment-element-id1"]
		]
		mails[1].attachments = fileIds

		let entity = ({
			_loadEntityRange: (...args) => {
				o(args).deepEquals([MailTypeRef, mailListId, startId, MAIL_INDEXER_CHUNK, true, entityRestClient])
				return Promise.resolve(mails)
			},
			_loadMultipleEntities: spy((typeRef, listId: ?Id, elementIds: Id[], target: EntityRestInterface): Promise<(MailBody | TutanotaFile)[]> => {
				return Promise.resolve(elementIds.map((elId) => {
					if (isSameTypeRef(typeRef, MailBodyTypeRef)) {
						const body = createMailBody()
						body._id = elId
						return body
					} else if (isSameTypeRef(typeRef, FileTypeRef)) {
						const file = createFile()
						file._id = [neverNull(listId), elId]
						return file
					} else {
						throw new Error("Should not be called")
					}
				}))
			})
		}: any)

		let db: Db = ({key: aes256RandomKey(), iv: fixedIv, dbFacade: {}}: any)
		let core = mock(new IndexerCore(db, ({queueEvents: false}: any)), (mocked) => {
			mocked.writeIndexUpdate = o.spy()
		})
		let entityRestClient: any = {}
		const indexer = new MailIndexer(core, db, entity, (null: any), entityRestClient)

		return indexer._indexMailList(mailbox, mailGroupId, mailListId, startId, endId).then(fullyIndexed => {
			o(core.writeIndexUpdate.callCount).equals(1)
			let indexUpdate: IndexUpdate = core.writeIndexUpdate.args[0]
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			let encInstanceId = encryptIndexKeyBase64(db.key, mails[1]._id[1], fixedIv)
			o(indexUpdate.create.encInstanceIdToElementData.get(encInstanceId) != null).equals(true)
			o(fullyIndexed).equals(false)

			const expectedInvocations = [
				[FileTypeRef, fileIds[0][0], [fileIds[0][1]], entityRestClient],
				[FileTypeRef, fileIds[1][0], [fileIds[1][1]], entityRestClient],
				[MailBodyTypeRef, null, [mails[1].body], entityRestClient],
			]

			o(entity._loadMultipleEntities.invocations.length).equals(expectedInvocations.length)
			for (let expected of expectedInvocations) {
				o(!!entity._loadMultipleEntities.invocations.find(i => deepEqual(i, expected)))
					.equals(true)("Should have invocation " + JSON.stringify(expected))
			}
		})
	})

	o.spec("processEntityEvents", function () {
		let indexUpdate: IndexUpdate
		o.beforeEach(function () {
			indexUpdate = _createNewIndexUpdate("group-id")
		})

		o("do nothing if mailIndexing is disabled", async function () {
			const indexer = _prepareProcessEntityTests(false)
			let events = [
				createUpdate(OperationType.CREATE, "mail-list", "1"), createUpdate(OperationType.UPDATE, "mail-list", "2"),
				createUpdate(OperationType.DELETE, "mail-list", "3")
			]
			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, emptyFutureActions)
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(indexUpdate.delete.encInstanceIds.length).equals(0)

		})

		o("new mail", async function () {
			const indexer = _prepareProcessEntityTests(true)
			let events = [createUpdate(OperationType.CREATE, "new-mail-list", "1")]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, emptyFutureActions)
			// nothing changed
			o(indexer.processNewMail.invocations.length).equals(1)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(0)
		})

		o("moved mail", async function () {
			const indexer = _prepareProcessEntityTests(true)
			let events = [
				createUpdate(OperationType.CREATE, "new-mail-list", "1"),
				createUpdate(OperationType.DELETE, "old-mail-list", "1")
			]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, emptyFutureActions)
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexer.processMovedMail.invocations.length).equals(1)
			o(indexer.processMovedMail.invocations[0]).deepEquals([events[0], indexUpdate])
			o(indexer._core._processDeleted.callCount).equals(0)
		})


		o("deleted mail", async function () {
			const indexer = _prepareProcessEntityTests(true)
			let events = [createUpdate(OperationType.DELETE, "mail-list", "1")]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, emptyFutureActions)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(1)
			o(indexer._core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})

		o("update draft", async function () {
			const indexer = _prepareProcessEntityTests(true, MailState.DRAFT)
			let events = [createUpdate(OperationType.UPDATE, "new-mail-list", "1")]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, emptyFutureActions)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(1)
			o(indexer._core._processDeleted.args).deepEquals([events[0], indexUpdate])
		})

		o("don't update non-drafts", async function () {
			const indexer = _prepareProcessEntityTests(true, MailState.RECEIVED)
			let events = [createUpdate(OperationType.UPDATE, "new-mail-list", "1")]

			await indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate, emptyFutureActions)
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(indexer._core._processDeleted.callCount).equals(0)
		})
	})

	o.spec("processEntityEvents + futureActions", function () {
		let indexer: MailIndexer
		let indexUpdate: IndexUpdate
		o.beforeEach(function () {
			indexer = _prepareProcessEntityTests(true)
			indexUpdate = _createNewIndexUpdate("group-id")
		})

		o("create & delete == delete", async function () {
			const event = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const deleteEvent = createUpdate(OperationType.DELETE, event.instanceListId, event.instanceId, "u2")
			const deleted = {[deleteEvent.instanceId]: deleteEvent}
			const futureActions = makeFutureActions({}, deleted)

			await indexer.processEntityEvents([event], "group-id", "batch-id", indexUpdate, futureActions)
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals({
				moved: {},
				deleted
			})("Should not change futureActions")

			await indexer.processEntityEvents([deleteEvent], "group-id", "batch-id2", indexUpdate, futureActions)
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer._core._processDeleted.callCount).equals(1)("Should call processDeleted")
			o(indexer._core._processDeleted.args).deepEquals([deleteEvent, indexUpdate])
			o(replaceAllMaps(futureActions)).deepEquals(emptyFutureActionsObj)("Should clear futureActions")
		})

		o("create & move == create*", async function () {
			const event = createUpdate(OperationType.CREATE, "new-mail-list", "1", "u1")
			const deleteEvent = createUpdate(OperationType.DELETE, event.instanceListId, event.instanceId, "u2")
			const createAgainEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", event.instanceId, "u3")
			const moved = {[event.instanceId]: createAgainEvent}
			const futureActions = makeFutureActions(moved, {})

			await indexer.processEntityEvents([event], "group-id", "batch-id", indexUpdate, futureActions)
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals({
				moved,
				deleted: {}
			})("Should not change futureActions")

			await indexer.processEntityEvents([deleteEvent, createAgainEvent], "group-id", "batch-id2", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([[createAgainEvent, indexUpdate]])("Should call processMovedMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals(emptyFutureActionsObj)("Should clear futureActions")
		})

		o("move + delete == delete", async function () {
			const instanceId = "new-mail"
			// Two parts of the "move" event in the firts batch
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list-1", instanceId, "u1")
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u2")
			// One event from the second batch
			const deleteAgainEvent = createUpdate(OperationType.DELETE, createEvent.instanceListId, instanceId, "u3")
			const moved = {[createEvent.instanceId]: createEvent}
			const deleted = {[deleteAgainEvent.instanceId]: deleteAgainEvent}
			const futureActions = makeFutureActions(moved, deleted)

			await indexer.processEntityEvents([deleteEvent, createEvent], "group-id", "batch-id", indexUpdate, futureActions)
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals({
				deleted,
				moved: {}
			})("Should clear move actions")

			await indexer.processEntityEvents([deleteAgainEvent], "group-id", "batch-id2", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer._core._processDeleted.callCount).equals(1)("Should call processDeleted once")
			o(indexer._core._processDeleted.args).deepEquals([deleteAgainEvent, indexUpdate])
			o(replaceAllMaps(futureActions)).deepEquals(emptyFutureActionsObj)("Should clear deleted actions")
		})

		o("move + move == move", async function () {
			const instanceId = "new-mail"
			// Two parts of the "move" event in the firts batch
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list-1", instanceId, "u1")
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u2")
			// Two parts of the "move" event in the second batch
			const deleteAgainEvent = createUpdate(OperationType.DELETE, "new-mail-list-2", instanceId, "u3")
			const createAgainEvent = createUpdate(OperationType.CREATE, "new-mail-list-3", instanceId, "u4")
			const moved = {[createAgainEvent.instanceId]: createAgainEvent}
			const futureActions = makeFutureActions(moved, {})

			await indexer.processEntityEvents([deleteEvent, createEvent], "group-id", "batch-id", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals({
				moved,
				deleted: {}
			})("Should not change futureActions")


			await indexer.processEntityEvents([deleteAgainEvent, createAgainEvent], "group-id", "batch-id2", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([
				[createAgainEvent, indexUpdate]
			])("Should call processMovedMail")
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals(emptyFutureActionsObj)("Should clear futureActions")
		})

		o("update + move == update* + move", async function () {
			indexer = _prepareProcessEntityTests(true, MailState.DRAFT)
			const instanceId = "1"
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", instanceId, "u1")
			// Two parts of the "move" event in the second batch
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", instanceId, "u2")
			const createEvent = createUpdate(OperationType.CREATE, "new-mail-list-2", instanceId, "u3")
			const moved = {[createEvent.instanceId]: createEvent}
			const futureActions = makeFutureActions(moved, {})

			await indexer.processEntityEvents([updateEvent], "group-id", "batch-id", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer._core._processDeleted.callCount).equals(1)("Should call processDeleted")
			o(indexer._core._processDeleted.args).deepEquals([updateEvent, indexUpdate])("Should call processDeleted with right args")
			o(replaceAllMaps(futureActions)).deepEquals({
				moved,
				deleted: {}
			})("Should not change futureActions")

			await indexer.processEntityEvents([deleteEvent, createEvent], "group-id", "batch-id2", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([
				[createEvent, indexUpdate]
			])("Should call processMovedMail")
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer._core._processDeleted.callCount).equals(1)("Should not call processDeleted again")
			o(replaceAllMaps(futureActions)).deepEquals(emptyFutureActionsObj)("Should clear futureActions")
		})


		o("update + delete == delete", async function () {
			indexer = _prepareProcessEntityTests(true, MailState.DRAFT)
			const instanceId = "1"
			const updateEvent = createUpdate(OperationType.UPDATE, "new-mail-list", instanceId, "u1")
			const deleteEvent = createUpdate(OperationType.DELETE, "new-mail-list", instanceId, "u2")
			const deleted = {[deleteEvent.instanceId]: deleteEvent}
			const futureActions = makeFutureActions({}, deleted)

			await indexer.processEntityEvents([updateEvent], "group-id", "batch-id", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer._core._processDeleted.callCount).equals(0)("Should not call processDeleted")
			o(replaceAllMaps(futureActions)).deepEquals({
				deleted,
				moved: {}
			})("Should not change futureActions")

			await indexer.processEntityEvents([deleteEvent], "group-id", "batch-id2", indexUpdate, futureActions)
			o(indexer.processMovedMail.invocations).deepEquals([])("Should not call processMovedMail")
			o(indexer.processNewMail.invocations).deepEquals([])("Should not call processNewMail")
			o(indexer._core._processDeleted.callCount).equals(1)("Should call processDeleted")
			o(indexer._core._processDeleted.args).deepEquals([deleteEvent, indexUpdate])("Should call processDeleted with right args")
			o(replaceAllMaps(futureActions)).deepEquals(emptyFutureActionsObj)("Should clear futureActions")
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


function indexMailboxTest(startTimestamp: number, endIndexTimstamp: number, fullyIndexed: boolean, done: Function, indexMailList: boolean) {
	let user = createUser()
	user.memberships.push(createGroupMembership())
	user.memberships[0].groupType = GroupType.Mail
	user.memberships[0].group = "mail-group-id"

	let mailboxGroupRoot = createMailboxGroupRoot()
	mailboxGroupRoot.mailbox = "mailbox-id"
	let mailbox = createMailBox()
	let mailListId = ["mail-list-id"]
	let entity = ({
		load: (type, id) => {
			if (type === MailboxGroupRootTypeRef && id === user.memberships[0].group) {
				return Promise.resolve(mailboxGroupRoot)
			} else if (type === MailBoxTypeRef && id === mailboxGroupRoot.mailbox) {
				return Promise.resolve(mailbox)
			}
			return Promise.reject("Wrong type / id")
		},
	}: any)
	let groupData = {indexTimestamp: startTimestamp}
	let transaction = {
		get: (os, groupId) => {
			o(os).equals(GroupDataOS)
			o(groupId).equals(user.memberships[0].group)
			return Promise.resolve(groupData)
		},
		put: o.spy((os, groupId, value) => {
			o(os).equals(GroupDataOS)
			o(groupId).equals(user.memberships[0].group)
			o(value.indexTimestamp).equals(fullyIndexed ? FULL_INDEXED_TIMESTAMP : endIndexTimstamp)
			return Promise.resolve()
		}),
		wait: () => Promise.resolve()
	}
	let core: IndexerCore = downcast({
		printStatus: () => {
		},
		queue: mock(new EventQueue(() => Promise.resolve()), (mock) => {
			mock.pause = spy(mock.pause.bind(mock))
			mock.resume = spy(mock.resume.bind(mock))
		})
	})
	let db: Db = ({
		key: aes256RandomKey(),
		dbFacade: {createTransaction: () => Promise.resolve(transaction)},
		iv: fixedIv
	}: any)
	let worker: WorkerImpl = ({sendIndexState: o.spy()}: any)
	const indexer = mock(new MailIndexer(core, db, entity, worker, (null: any)), (mock) => {
		mock.mailIndexingEnabled = true
		mock._loadMailListIds = (mbox) => {
			o(mbox).equals(mailbox)
			console.log("_loadMailListIds called")
			return Promise.resolve([mailListId])
		}
		mock._indexMailList = o.spy(() => Promise.resolve(fullyIndexed))

	})

	let promise = indexer.indexMailboxes(user, endIndexTimstamp)
	o(indexer._core.queue.pause.invocations.length).equals(1)
	promise.then(() => {
		o(indexer._core.queue.resume.invocations.length).equals(1)

		o(indexer.mailboxIndexingPromise.isFulfilled()).equals(true)

		if (indexMailList) {
			o(indexer._indexMailList.callCount).equals(1)
			o(indexer._indexMailList.args)
				.deepEquals([
					mailbox, user.memberships[0].group, mailListId,
					startTimestamp == NOTHING_INDEXED_TIMESTAMP ? GENERATED_MAX_ID : timestampToGeneratedId(startTimestamp),
					timestampToGeneratedId(endIndexTimstamp)
				])
		} else {
			o(indexer._indexMailList.callCount).equals(0)
		}

		done()
	})
	o(indexer.mailboxIndexingPromise.isPending()).equals(true)
}


function _prepareProcessEntityTests(indexingEnabled: boolean, mailState: MailStateEnum = MailState.RECEIVED): MailIndexer {

	let transaction = {
		get: (os, id) => {
			let elementData: ElementData = [getListId(mail), new Uint8Array(0), "group-id"]
			return Promise.resolve(elementData)
		}
	}
	let db: Db = downcast({
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: {createTransaction: () => Promise.resolve(transaction)}
	})

	let core = mock(new IndexerCore(db, ({queueEvents: false}: any)), (mocked) => {
		mocked.writeIndexUpdate = o.spy()
		mocked._processDeleted = o.spy()
	})

	let mail = createMail()
	mail._id = ["new-mail-list", "1"]
	mail.attachments = []
	mail.body = "body-id"
	mail.state = mailState
	let body = createMailBody()
	let entityWorker: any = {
		load: (type, id) => {
			if (type == MailTypeRef && isSameId(id, mail._id)) return Promise.resolve(mail)
			if (type == MailBodyTypeRef && id == mail.body) return Promise.resolve(mail)
			throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
		}
	}
	return mock(new MailIndexer(core, db, entityWorker, (null: any), (null: any)), (mocked) => {
		mocked.processNewMail = spy(mocked.processNewMail.bind(mocked))
		mocked.processMovedMail = spy(mocked.processMovedMail.bind(mocked))
		mocked.mailIndexingEnabled = indexingEnabled
	})
}

function makeFutureActions(moved: {[string]: EntityUpdate}, deleted: {[string]: EntityUpdate}): FutureBatchActions {
	const movedMap = new Map()
	for (let mk of Object.keys(moved)) {
		movedMap.set(mk, moved[mk])
	}
	const deletedMap = new Map()
	for (let dk of Object.keys(deleted)) {
		deletedMap.set(dk, deleted[dk])
	}
	return {moved: movedMap, deleted: deletedMap}
}
