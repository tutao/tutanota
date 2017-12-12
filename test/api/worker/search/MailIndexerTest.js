// @flow
import o from "ospec/ospec.js"
import {createGroupInfo, GroupInfoTypeRef} from "../../../../src/api/entities/sys/GroupInfo"
import {NotFoundError, NotAuthorizedError} from "../../../../src/api/common/error/RestError"
import type {Db, IndexUpdate, ElementData} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {GroupDataOS, ElementDataOS, MetaDataOS} from "../../../../src/api/worker/search/DbFacade"
import {
	NOTHING_INDEXED_TIMESTAMP,
	FULL_INDEXED_TIMESTAMP,
	GroupType
} from "../../../../src/api/common/TutanotaConstants"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {encryptIndexKey} from "../../../../src/api/worker/search/IndexUtils"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64} from "../../../../src/api/common/utils/Encoding"
import {GroupInfoIndexer} from "../../../../src/api/worker/search/GroupInfoIndexer"
import {createUser} from "../../../../src/api/entities/sys/User"
import {createCustomer, CustomerTypeRef} from "../../../../src/api/entities/sys/Customer"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {MailIndexer, INITIAL_MAIL_INDEX_INTERVAL} from "../../../../src/api/worker/search/MailIndexer"
import {createMail, _TypeModel as MailModel, MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody, MailBodyTypeRef} from "../../../../src/api/entities/tutanota/MailBody"
import {createFile, FileTypeRef} from "../../../../src/api/entities/tutanota/File"
import {createMailAddress} from "../../../../src/api/entities/tutanota/MailAddress"
import {createEncryptedMailAddress} from "../../../../src/api/entities/tutanota/EncryptedMailAddress"
import {isSameId} from "../../../../src/api/common/EntityFunctions"
import {Metadata as MetaData} from "../../../../src/api/worker/search/Indexer"
import {createMailFolder} from "../../../../src/api/entities/tutanota/MailFolder"
import {getStartOfDay, getDayShifted} from "../../../../src/api/common/utils/DateUtils"

o.spec("MailIndexer test", () => {
	o("createMailIndexEntries without entries", function () {
		let mail = createMail()
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore((null:any)), (null:any), (null:any), (null:any), (null:any))
		let keyToIndexEntries = indexer.createMailIndexEntries(mail, body, files)
		o(keyToIndexEntries.size).equals(0)
	})

	o("createMailIndexEntries with one entry", function () {
		let mail = createMail()
		mail.subject = "Hello"
		let body = createMailBody()
		let files = [createFile()]
		let indexer = new MailIndexer(new IndexerCore((null:any)), (null:any), (null:any), (null:any), (null:any))
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
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let encInstanceId = encryptIndexKey(db.key, event.instanceId)

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

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)

		let event: EntityUpdate = ({instanceListId: "new-list-id", instanceId: "eid"}:any)
		let encInstanceId = encryptIndexKey(db.key, event.instanceId)

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
			await: () => Promise.resolve()
		}

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		const indexer: any = new MailIndexer((null:any), db, (null:any), (null:any), (null:any))
		indexer.indexMailbox = o.spy()
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
			o(indexer.indexMailbox.callCount).equals(1)
			o(indexer.indexMailbox.args).deepEquals([user, getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL))])

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

		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		const indexer: any = new MailIndexer((null:any), db, (null:any), (null:any), (null:any))
		indexer.indexMailbox = o.spy()

		indexer.mailIndexingEnabled = false
		indexer._excludedListIds = []

		let user = createUser()
		indexer.enableMailIndexing(user).then(() => {
			o(indexer.indexMailbox.callCount).equals(0)
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

	// TODO indexMailbox
	// TODO _indexMailList
	// TODO updateCurrentIndexTimestamp

	o("indexAllUserAndTeamGroupInfosForAdmin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db)
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = true
		user.customer = "customer-id"

		let customer = createCustomer()
		customer.customerGroup = "customerGroupId"
		customer.userGroups = "userGroupsId"
		customer.teamGroups = "teamGroupsId"

		let userGroupInfo = createGroupInfo()
		userGroupInfo._id = [customer.userGroups, "ug"]

		let teamGroupInfo = createGroupInfo()
		teamGroupInfo._id = [customer.teamGroups, "tg"]

		let entity = ({
			load: (type, customerId) => {
				o(type).deepEquals(CustomerTypeRef)
				o(customerId).equals(user.customer)
				return Promise.resolve(customer)
			},
			loadAll: (type, listId) => {
				o(type).equals(GroupInfoTypeRef)
				if (listId == customer.userGroups) {
					return Promise.resolve([userGroupInfo])
				} else if (listId == customer.teamGroups) {
					return Promise.resolve([teamGroupInfo])
				}
				return Promise.reject("Wrong unexpected listId")
			}
		}:any)

		let groupData = {indexTimestamp: NOTHING_INDEXED_TIMESTAMP}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(customer.customerGroup)
				return Promise.resolve(groupData)
			}
		}

		const indexer = new GroupInfoIndexer(core, db, entity)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(1)
			let indexUpdate: IndexUpdate = core.writeIndexUpdate.args[0]
			o(indexUpdate.indexTimestamp).equals(FULL_INDEXED_TIMESTAMP)
			o(indexUpdate.groupId).equals(customer.customerGroup)

			let expectedKeys = [uint8ArrayToBase64(encryptIndexKey(db.key, userGroupInfo._id[1])), uint8ArrayToBase64(encryptIndexKey(db.key, teamGroupInfo._id[1]))]
			o(Array.from(indexUpdate.create.encInstanceIdToElementData.keys())).deepEquals(expectedKeys)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin not an admin", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {}}:any)
		let core: any = new IndexerCore(db)
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = false
		user.customer = "customer-id"


		const indexer = new GroupInfoIndexer(core, db, (null:any))
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

	o("indexAllUserAndTeamGroupInfosForAdmin already indexed", function (done) {
		let db: Db = ({key: aes256RandomKey(), dbFacade: {createTransaction: () => transaction}}:any)
		let core: any = new IndexerCore(db)
		core.writeIndexUpdate = o.spy()

		let userGroupId = "userGroupId"
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].admin = true
		user.customer = "customer-id"

		let customer = createCustomer()
		customer.customerGroup = "customerGroupId"
		customer.userGroups = "userGroupsId"
		customer.teamGroups = "teamGroupsId"

		let entity = ({
			load: (type, customerId) => {
				o(type).deepEquals(CustomerTypeRef)
				o(customerId).equals(user.customer)
				return Promise.resolve(customer)
			},
		}:any)

		let groupData = {indexTimestamp: FULL_INDEXED_TIMESTAMP}
		let transaction = {
			get: (os, groupId) => {
				o(os).equals(GroupDataOS)
				o(groupId).equals(customer.customerGroup)
				return Promise.resolve(groupData)
			}
		}

		const indexer = new GroupInfoIndexer(core, db, entity)
		indexer.indexAllUserAndTeamGroupInfosForAdmin(user).then(() => {
			o(core.writeIndexUpdate.callCount).equals(0)
		}).then(done)
	})

})
