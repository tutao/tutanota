// @flow
import o from "ospec/ospec.js"
import {NotFoundError, NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import type {Db, IndexUpdate, ElementData} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate, encryptIndexKeyBase64} from "../../../../src/api/worker/search/IndexUtils"
import {GroupDataOS, ElementDataOS, MetaDataOS} from "../../../../src/api/worker/search/DbFacade"
import type {OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {
	MailState,
	NOTHING_INDEXED_TIMESTAMP,
	FULL_INDEXED_TIMESTAMP,
	GroupType,
	OperationType
} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {timestampToGeneratedId} from "../../../../src/api/common/utils/Encoding"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {MailIndexer, INITIAL_MAIL_INDEX_INTERVAL_DAYS} from "../../../../src/api/worker/search/MailIndexer"
import {createMail, _TypeModel as MailModel, MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody, MailBodyTypeRef} from "../../../../src/api/entities/tutanota/MailBody"
import {createFile, FileTypeRef} from "../../../../src/api/entities/tutanota/File"
import {createMailAddress} from "../../../../src/api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../../../../src/api/entities/tutanota/EncryptedMailAddress"
import {isSameId, GENERATED_MAX_ID} from "../../../../src/api/common/EntityFunctions"
import {Metadata as MetaData} from "../../../../src/api/worker/search/Indexer"
import {createMailFolder} from "../../../../src/api/entities/tutanota/MailFolder"
import {getStartOfDay, getDayShifted} from "../../../../src/api/common/utils/DateUtils"
import type {WorkerImpl} from "../../../../src/api/worker/WorkerImpl"
import {MailboxGroupRootTypeRef, createMailboxGroupRoot} from "../../../../src/api/entities/tutanota/MailboxGroupRoot"
import {createMailBox, MailBoxTypeRef} from "../../../../src/api/entities/tutanota/MailBox"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"


o.spec("MailIndexer test", () => {
	o("createMailIndexEntries without entries", function () {
		let mail = createMail()
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore((null:any), (null:any)), (null:any), (null:any), (null:any), (null:any))
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(0)
	})

	o("createMailIndexEntries with one entry", function () {
		let mail = createMail()
		mail.subject = "Hello"
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore((null:any), (null:any)), (null:any), (null:any), (null:any), (null:any))
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(1)
	})

	o("createMailIndexEntries", function () {
		let core = ({createIndexEntriesForAttributes: o.spy()}:any)
		let indexer = new MailIndexer(core, (null:any), (null:any), (null:any), (null:any))

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

		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		let core = ({createIndexEntriesForAttributes: () => keyToIndexEntries}:any)
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
		}:any)
		let indexer: any = new MailIndexer((null:any), (null:any), entity, (null:any), (null:any))
		indexer.createMailIndexEntries = o.spy((mailParam, bodyParam, filesParam) => {
			o(mailParam).deepEquals(mail)
			o(bodyParam).deepEquals(body)
			o(filesParam).deepEquals(files)
			return keyToIndexEntries
		})
		indexer.processNewMail(event).then(result => {
			o(indexer.createMailIndexEntries.callCount).equals(1)
			o(result).deepEquals({mail, keyToIndexEntries})
		}).then(done)
	})

	o("processNewMail catches NotFoundError", function (done) {
		let entity = ({
			load: () => Promise.reject(new NotFoundError("blah"))
		}:any)
		const indexer = new MailIndexer((null:any), (null:any), entity, (null:any), (null:any))
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewMail(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewMail catches NotAuthorizedError", function (done) {
		let entity = ({
			load: () => Promise.reject(new NotAuthorizedError("blah"))
		}:any)
		const indexer = new MailIndexer((null:any), (null:any), entity, (null:any), (null:any))
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewMail(event).then(result => {
			o(result).equals(null)
		}).then(done)
	})

	o("processNewMail passes other Errors", function (done) {
		let entity = ({
			load: () => Promise.reject(new Error("blah"))
		}:any)
		const indexer = new MailIndexer((null:any), (null:any), entity, (null:any), (null:any))
		let event: EntityUpdate = ({instanceListId: "lid", instanceId: "eid"}:any)
		indexer.processNewMail(event).catch(Error, e => {
			done()
		})
	})

	o("processMovedMail", function (done) {
		let event: EntityUpdate = ({instanceListId: "new-list-id", instanceId: "eid"}:any)
		let elementData: ElementData = ["old-list-id", new Uint8Array(0), "owner-group-id"]
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}:any)
		let encInstanceId = encryptIndexKeyBase64(db.key, event.instanceId)

		let transaction = {
			get: (os, id) => {
				o(os).equals(ElementDataOS)
				o(Array.from(id)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			}
		}

		const indexer = new MailIndexer((null:any), db, (null:any), (null:any), (null:any))

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

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}:any)

		let event: EntityUpdate = ({instanceListId: "new-list-id", instanceId: "eid"}:any)
		let encInstanceId = encryptIndexKeyBase64(db.key, event.instanceId)

		const core: any = {encryptSearchIndexEntries: o.spy()}
		const indexer: any = new MailIndexer(core, db, (null:any), (null:any), (null:any))
		let result = {mail: {_id: 'mail-id', _ownerGroup: 'owner-group'}, keyToIndexEntries: new Map()}
		indexer.processNewMail = o.spy(() => Promise.resolve(result))

		let indexUpdate = _createNewIndexUpdate("group-id")
		indexer.processMovedMail(event, indexUpdate).then(() => {
			o(indexUpdate.move.length).equals(0)
			o(indexer.processNewMail.callCount).equals(1)
			o(core.encryptSearchIndexEntries.callCount).equals(1)
			o(core.encryptSearchIndexEntries.args).deepEquals([result.mail._id, result.mail._ownerGroup, result.keyToIndexEntries, indexUpdate])
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

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}:any)
		const indexer: any = new MailIndexer((null:any), db, (null:any), (null:any), (null:any))
		indexer.indexMailboxes = o.spy()
		indexer.mailIndexingEnabled = false
		indexer._excludedListIds = []

		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.Mail

		let spamFolder = createMailFolder()
		spamFolder.mails = "mail-list-id"
		indexer._getSpamFolder = (membership) => {
			o(membership).deepEquals(user.memberships[0])
			return spamFolder
		}

		indexer.enableMailIndexing(user).then(() => {
			o(indexer.indexMailboxes.callCount).equals(1)
			o(indexer.indexMailboxes.args).deepEquals([user, getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL_DAYS))])

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

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}:any)
		const indexer: any = new MailIndexer((null:any), db, (null:any), (null:any), (null:any))
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
		let db: Db = ({key: aes256RandomKey(), dbFacade: {deleteDatabase: o.spy()}}:any)
		const indexer: any = new MailIndexer((null:any), db, (null:any), (null:any), (null:any))
		indexer.mailIndexingEnabled = true
		indexer._excludedListIds = [1]
		indexer.disableMailIndexing()
		o(indexer.mailIndexingEnabled).equals(false)
		o(indexer._excludedListIds).deepEquals([])
		o(db.dbFacade.deleteDatabase.callCount).equals(1)
	})

	o("indexMailboxes disabled", function (done) {
		let entity: any = {}
		const indexer: any = new MailIndexer((null:any), (null:any), entity, (null:any), (null:any))
		indexer.mailIndexingEnabled = false
		indexer.indexMailboxes(createUser(), 1512946800000).then(done)
	})

	o("indexMailboxes initial indexing", function (done) {
		indexMailboxTest(NOTHING_INDEXED_TIMESTAMP, 1512946800000, true, done)
	})

	o("indexMailboxes further indexing", function (done) {
		indexMailboxTest(1513033200000, 1512946800000, false, done)
	})

	o("indexMailboxes fully indexed", function (done) {
		indexMailboxTest(FULL_INDEXED_TIMESTAMP, 1512946800000, true, done)
	})

	o("_indexMailList", function (done) {
		let mailbox = createMailBox()
		mailbox.sentAttachments = "sent-attachments-list"
		mailbox.receivedAttachments = "received-attachments-list"
		let mailListId = "mail-list-id"
		let mailGroupId = "mail-group-id"
		let startId = timestampToGeneratedId(1513033200000)
		let endId = timestampToGeneratedId(1512946800000)
		let loadedFileLists = []
		let mails = [createMail(), createMail()]
		mails[0]._id = [mailListId, timestampToGeneratedId(1512946800000 - 1)]// should be filtered out as id < endId
		mails[1]._id = [mailListId, timestampToGeneratedId(1512946800000 + 1)]
		mails[1].body = "body-id"
		mails[1].attachments = [["attachment-listId", "attachment-element-id"]]
		let file = createFile()
		let body = createMailBody()

		let entity = ({
			_loadEntityRange: (type, listId, start, count, reverse, target) => {
				o(type).equals(MailTypeRef)
				o(listId).equals(mailListId)
				o(start).equals(startId)
				o(count).equals(500)
				o(reverse).equals(true)
				o(target).equals(entityRestClient)
				return Promise.resolve(mails)
			},
			load: (type, id) => {
				o(type).equals(FileTypeRef)
				o(id).deepEquals(mails[1].attachments[0])
				return Promise.resolve(file)
			},
			_loadEntity: (type, id, queryParams, target) => {
				o(type).equals(MailBodyTypeRef)
				o(id).deepEquals(mails[1].body)
				o(target).equals(entityRestClient)
				return Promise.resolve(body)
			},
		}:any)

		let db: Db = ({key: aes256RandomKey(), dbFacade: {}}:any)
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		let entityRestClient: any = {}
		const indexer: any = new MailIndexer(core, db, entity, (null:any), entityRestClient)

		indexer._indexMailList(mailbox, mailGroupId, mailListId, startId, endId).then(fullyIndexed => {
			o(core.writeIndexUpdate.callCount).equals(1)
			let indexUpdate: IndexUpdate = core.writeIndexUpdate.args[0]
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			let encInstanceId = encryptIndexKeyBase64(db.key, mails[1]._id[1])
			o(indexUpdate.create.encInstanceIdToElementData.get(encInstanceId) != null).equals(true)
			o(fullyIndexed).equals(false)
			done()
		})
	})

	o("processEntityEvents do nothing if mailIndexing is disabled", function (done) {
		let core: any = {writeIndexUpdate: o.spy()}
		const indexer = new MailIndexer(core, (null:any), (null:any), (null:any), (null:any))
		indexer.mailIndexingEnabled = false

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.CREATE, "mail-list", "1"), createUpdate(OperationType.UPDATE, "mail-list", "2"), createUpdate(OperationType.DELETE, "mail-list", "3")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(indexUpdate.delete.encInstanceIds.length).equals(0)
			done()
		})
	})

	o("processEntityEvents new mail", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let mail = createMail()
		mail._id = ["mail-list", "1"]
		mail.attachments = []
		mail.body = "body-id"
		let body = createMailBody()
		let entity: any = {
			load: (type, id) => {
				if (type == MailTypeRef && isSameId(id, mail._id)) return Promise.resolve(mail)
				if (type == MailBodyTypeRef && id == mail.body) return Promise.resolve(mail)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new MailIndexer(core, db, entity, (null:any), (null:any))
		indexer.mailIndexingEnabled = true

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.CREATE, "mail-list", "1")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(0)
			done()
		})
	})

	o("processEntityEvents moved mail", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let mail = createMail()
		mail._id = ["new-mail-list", "1"]
		mail.attachments = []
		mail.body = "body-id"
		let body = createMailBody()
		let entity: any = {
			load: (type, id) => {
				if (type == MailTypeRef && isSameId(id, mail._id)) return Promise.resolve(mail)
				if (type == MailBodyTypeRef && id == mail.body) return Promise.resolve(mail)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer: any = new MailIndexer(core, db, entity, (null:any), (null:any))
		indexer.mailIndexingEnabled = true
		indexer.processMovedMail = o.spy()

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.CREATE, "new-mail-list", "1"), createUpdate(OperationType.DELETE, "old-mail-list", "1")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			// nothing changed
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexer.processMovedMail.callCount).equals(1)
			o(indexer.processMovedMail.args).deepEquals([events[0], indexUpdate])
			o(core._processDeleted.callCount).equals(0)
			done()
		})
	})

	o("processEntityEvents deleted mail", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let mail = createMail()
		mail._id = ["mail-list", "1"]
		mail.attachments = []
		mail.body = "body-id"
		let body = createMailBody()
		let entity: any = {
			load: (type, id) => {
				if (type == MailTypeRef && isSameId(id, mail._id)) return Promise.resolve(mail)
				if (type == MailBodyTypeRef && id == mail.body) return Promise.resolve(mail)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new MailIndexer(core, db, entity, (null:any), (null:any))
		indexer.mailIndexingEnabled = true

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.DELETE, "mail-list", "1")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(1)
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
			done()
		})
	})

	o("processEntityEvents update draft", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let mail = createMail()
		mail._id = ["mail-list", "1"]
		mail.attachments = []
		mail.body = "body-id"
		mail.state = MailState.DRAFT
		let body = createMailBody()
		let entity: any = {
			load: (type, id) => {
				if (type == MailTypeRef && isSameId(id, mail._id)) return Promise.resolve(mail)
				if (type == MailBodyTypeRef && id == mail.body) return Promise.resolve(mail)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new MailIndexer(core, db, entity, (null:any), (null:any))
		indexer.mailIndexingEnabled = true

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.UPDATE, "mail-list", "1")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(1)
			o(core._processDeleted.args).deepEquals([events[0], indexUpdate])
			done()
		})
	})

	o("processEntityEvents don't update non-drafts", function (done) {
		let db: any = {key: aes256RandomKey()}
		let core: any = new IndexerCore(db, ({queueEvents: false}:any))
		core.writeIndexUpdate = o.spy()
		core._processDeleted = o.spy()

		let mail = createMail()
		mail._id = ["mail-list", "1"]
		mail.attachments = []
		mail.body = "body-id"
		mail.state = MailState.RECEIVED
		let body = createMailBody()
		let entity: any = {
			load: (type, id) => {
				if (type == MailTypeRef && isSameId(id, mail._id)) return Promise.resolve(mail)
				if (type == MailBodyTypeRef && id == mail.body) return Promise.resolve(mail)
				throw new Error("Not found " + JSON.stringify(type) + " / " + JSON.stringify(id))
			}
		}
		const indexer = new MailIndexer(core, db, entity, (null:any), (null:any))
		indexer.mailIndexingEnabled = true

		let indexUpdate = _createNewIndexUpdate("group-id")
		let events = [createUpdate(OperationType.UPDATE, "mail-list", "1")]
		indexer.processEntityEvents(events, "group-id", "batch-id", indexUpdate).then(() => {
			o(indexUpdate.create.encInstanceIdToElementData.size).equals(0)
			o(indexUpdate.move.length).equals(0)
			o(core._processDeleted.callCount).equals(0)
			done()
		})
	})

})

function createUpdate(type: OperationTypeEnum, listId: Id, id: Id) {
	let update = createEntityUpdate()
	update.operation = type
	update.instanceListId = listId
	update.instanceId = id
	return update
}


function indexMailboxTest(startTimestamp: number, endIndexTimstamp: number, fullyIndexed: boolean, done: Function) {
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
			if (type == MailboxGroupRootTypeRef && id == user.memberships[0].group) {
				return Promise.resolve(mailboxGroupRoot)
			} else if (type == MailBoxTypeRef && id == mailboxGroupRoot.mailbox) {
				return Promise.resolve(mailbox)
			}
			return Promise.reject("Wrong type / id")
		},
	}:any)
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
	let core: any = {
		printStatus: () => {
		},
		queue: {queue: o.spy(), processNext: o.spy()}
	}
	let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => Promise.resolve(transaction)}}:any)
	let worker: WorkerImpl = ({sendIndexState: o.spy()}:any)
	const indexer: any = new MailIndexer(core, db, entity, worker, (null:any))
	indexer.mailIndexingEnabled = true
	indexer._loadMailListIds = (mbox) => {
		o(mbox).equals(mailbox)
		return Promise.resolve([mailListId])
	}
	indexer._indexMailList = o.spy(() => Promise.resolve(fullyIndexed))

	let promise = indexer.indexMailboxes(user, endIndexTimstamp)
	o(indexer._core.queue.queue.callCount).equals(1)
	promise.then(() => {
		o(indexer._core.queue.processNext.callCount).equals(1)

		o(indexer.mailboxIndexingPromise.isFulfilled()).equals(true)

		o(indexer._indexMailList.callCount).equals(1)
		o(indexer._indexMailList.args).deepEquals([mailbox, user.memberships[0].group, mailListId, startTimestamp == NOTHING_INDEXED_TIMESTAMP ? GENERATED_MAX_ID : timestampToGeneratedId(startTimestamp), timestampToGeneratedId(endIndexTimstamp)])

		done()
	})
	o(indexer.mailboxIndexingPromise.isPending()).equals(true)
}