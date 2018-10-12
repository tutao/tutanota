// @flow
import o from "ospec/ospec.js"
import type {
	B64EncInstanceId, Db,
	ElementData,
	EncryptedSearchIndexEntry,
	GroupData,
	SearchIndexEntry
} from "../../../../src/api/worker/search/SearchTypes"
import {
	_createNewIndexUpdate,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	getAppId
} from "../../../../src/api/worker/search/IndexUtils"
import {_TypeModel as ContactModel, ContactTypeRef, createContact} from "../../../../src/api/entities/tutanota/Contact"
import {aes256Decrypt, aes256Encrypt, aes256RandomKey, IV_BYTE_LENGTH} from "../../../../src/api/worker/crypto/Aes"
import {
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "../../../../src/api/common/utils/Encoding"
import {defer, downcast, neverNull} from "../../../../src/api/common/utils/Utils"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {
	DbTransaction,
	ElementDataOS,
	GroupDataOS,
	SearchIndexMetaDataOS,
	SearchIndexOS
} from "../../../../src/api/worker/search/DbFacade"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {random} from "../../../../src/api/worker/crypto/Randomizer"
import {browserDataStub, makeCore, mock, spy} from "../../TestUtils"
import {fixedIv} from "../../../../src/api/worker/crypto/CryptoFacade"
import {EventQueue} from "../../../../src/api/worker/search/EventQueue"
import {CancelledError} from "../../../../src/api/common/error/CancelledError"
import type {BrowserData} from "../../../../src/misc/ClientConstants"


o.spec("IndexerCore test", () => {

	o("createIndexEntriesForAttributes", function () {
		let core = makeCore()

		let contact = createContact()
		contact._id = ["", "L-dNNLe----0"]
		contact.firstName = "Max Tim"
		contact.lastName = "Meier" // not indexed
		contact.company = (undefined: any) // indexed but not defined
		contact.comment = "Friend of Tim"
		let entries = core.createIndexEntriesForAttributes(ContactModel, contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName
			},
			{
				attribute: ContactModel.values["company"],
				value: () => contact.company
			},
			{
				attribute: ContactModel.values["comment"],
				value: () => contact.comment
			},
		])
		o(entries.size).equals(4)
		o(entries.get("max")).deepEquals([
			{
				id: "L-dNNLe----0",
				app: getAppId(ContactTypeRef),
				type: ContactModel.id,
				attribute: ContactModel.values["firstName"].id,
				positions: [0]
			}
		])
		o(entries.get("tim")).deepEquals([
			{
				id: "L-dNNLe----0",
				app: getAppId(ContactTypeRef),
				type: ContactModel.id,
				attribute: ContactModel.values["firstName"].id,
				positions: [1]
			},
			{
				id: "L-dNNLe----0",
				app: getAppId(ContactTypeRef),
				type: ContactModel.id,
				attribute: ContactModel.values["comment"].id,
				positions: [2]
			}
		])
		o(entries.get("friend")).deepEquals([
			{
				id: "L-dNNLe----0",
				app: getAppId(ContactTypeRef),
				type: ContactModel.id,
				attribute: ContactModel.values["comment"].id,
				positions: [0]
			}
		])
		o(entries.get("of")).deepEquals([
			{
				id: "L-dNNLe----0",
				app: getAppId(ContactTypeRef),
				type: ContactModel.id,
				attribute: ContactModel.values["comment"].id,
				positions: [1]
			}
		])
	})


	o("encryptSearchIndexEntries", function () {
		const core = makeCore({
			db: ({key: aes256RandomKey(), iv: fixedIv}: any)
		})
		let id = ["1", "2"]
		let ownerGroupId = "ownerGroupId"
		let keyToIndexEntries: Map<string, SearchIndexEntry[]> = new Map([
			[
				"a", [
				{
					id: "2",
					app: 1,
					type: 64,
					attribute: 5,
					positions: [0],
				}
			]
			],
			[
				"b", [
				{
					id: "2",
					app: 0,
					type: 7,
					attribute: 4,
					positions: [8, 27],
				}
			]
			],
		])
		let indexUpdate = _createNewIndexUpdate(ownerGroupId)
		core.encryptSearchIndexEntries(id, ownerGroupId, keyToIndexEntries, indexUpdate)

		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		let elementData: ElementData = neverNull(indexUpdate.create.encInstanceIdToElementData.get(encryptIndexKeyBase64(core.db.key, "2", core.db.iv)))
		let listId = elementData[0]
		o(listId).equals(id[0])
		let words = utf8Uint8ArrayToString(aes256Decrypt(core.db.key, elementData[1], true, false))
		o(words).equals("a b")
		o(ownerGroupId).equals(elementData[2])

		o(indexUpdate.create.indexMap.size).equals(2)

		let a: EncryptedSearchIndexEntry[] = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "a", core.db.iv)))
		o(a.length).equals(1)
		let entry = decryptSearchIndexEntry(core.db.key, a[0], core.db.iv)
		delete entry.encId
		o(entry).deepEquals({
			id: "2",
			app: 1,
			type: 64,
			attribute: 5,
			positions: [0],
		})

		let b: EncryptedSearchIndexEntry[] = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "b", core.db.iv)))
		o(b.length).equals(1)
		let entry2 = decryptSearchIndexEntry(core.db.key, b[0], core.db.iv)
		delete entry2.encId
		o(entry2).deepEquals({
			id: "2",
			app: 0,
			type: 7,
			attribute: 4,
			positions: [8, 27],
		})


		// add another entry
		let id2 = ["x", "y"]
		let keyToIndexEntries2: Map<string, SearchIndexEntry[]> = new Map([
			[
				"a", [
				{
					id: "y",
					app: 0,
					type: 34,
					attribute: 2,
					positions: [7, 62],
				}
			]
			]
		])
		core.encryptSearchIndexEntries(id2, ownerGroupId, keyToIndexEntries2, indexUpdate)

		o(indexUpdate.create.encInstanceIdToElementData.size).equals(2)
		let elementData2: ElementData = neverNull(indexUpdate.create.encInstanceIdToElementData.get(encryptIndexKeyBase64(core.db.key, "y", core.db.iv)))
		let listId2 = elementData2[0]
		o(listId2).equals(id2[0])
		let words2 = utf8Uint8ArrayToString(aes256Decrypt(core.db.key, elementData2[1], true, false))
		o(words2).equals("a")
		o(ownerGroupId).equals(elementData2[2])

		a = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "a", core.db.iv)))
		o(a.length).equals(2)
		entry = decryptSearchIndexEntry(core.db.key, a[0], core.db.iv)
		delete entry.encId
		o(entry).deepEquals({
			id: "2",
			app: 1,
			type: 64,
			attribute: 5,
			positions: [0],
		})
		let newEntry = decryptSearchIndexEntry(core.db.key, a[1], core.db.iv)
		delete newEntry.encId
		o(newEntry).deepEquals({
			id: "y",
			app: 0,
			type: 34,
			attribute: 2,
			positions: [7, 62],
		})
	})

	o("writeIndexUpdate _moveIndexedInstance", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = uint8ArrayToBase64(new Uint8Array([8]))
		indexUpdate.move.push({
			encInstanceId,
			newListId: "new-list"
		})

		let words = new Uint8Array(0)
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				return Promise.resolve((["old-list", words, groupId]: ElementData))
			},
			put: (os, key, value) => {
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				o(value).deepEquals(["new-list", words, groupId])
				done()
			}
		}

		const core = makeCore()
		core._moveIndexedInstance(indexUpdate, transaction)
	})

	o("writeIndexUpdate _moveIndexedInstance instance already deleted", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = uint8ArrayToBase64(new Uint8Array([8]))
		indexUpdate.move.push({
			encInstanceId,
			newListId: "new-list"
		})

		let words = new Uint8Array(0)
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				return Promise.resolve(null)
			},
			put: (os, key, value) => {
				throw new Error("instance does not exist, should not be moved!")
			}
		}

		const core = makeCore()
		neverNull(core._moveIndexedInstance(indexUpdate, transaction)).then(() => done())
	})

	o("writeIndexUpdate _deleteIndexedInstance", function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		const instanceId = new Uint8Array([8])
		let entry: EncryptedSearchIndexEntry = [instanceId, new Uint8Array([4, 7, 6])]
		let other1: EncryptedSearchIndexEntry = [new Uint8Array([17]), new Uint8Array([1, 12])]
		let other2: EncryptedSearchIndexEntry = [instanceId, new Uint8Array([1, 12])]

		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		let encInstanceIdB64 = uint8ArrayToBase64(instanceId)
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord, [encInstanceIdB64])
		indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)

		const metaData = [{key: 1, size: 2}, {key: 2, size: 1}]
		let transaction: any = {
			getAsList: (os, key) => {
				return os === SearchIndexMetaDataOS
					? Promise.resolve(metaData)
					: Promise.resolve(key === 1 ? [entry, other1] : [other2])
			},
			put: spy((os, key, value) => Promise.resolve()),
			delete: spy((os, key) => Promise.resolve())
		}
		const core = makeCore()
		return neverNull(core._deleteIndexedInstance(indexUpdate, transaction)).then(() => {
			o(transaction.put.invocations[0]).deepEquals([SearchIndexOS, 1, [other1]])
			o(transaction.put.invocations[1]).deepEquals([SearchIndexMetaDataOS, encWord, [{key: 1, size: 1}]])
			o(transaction.delete.invocations[0]).deepEquals([ElementDataOS, encInstanceIdB64])
			o(transaction.delete.invocations[1]).deepEquals([SearchIndexOS, 2])
		})
	})

	o("writeIndexUpdate _deleteIndexedInstance last entry for word", function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		const instanceId = new Uint8Array([8])
		let entry: EncryptedSearchIndexEntry = [instanceId, new Uint8Array([4, 7, 6])]

		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		let encInstanceIdB64 = uint8ArrayToBase64(instanceId)
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord, [encInstanceIdB64])
		indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)

		const metaData = [{key: 1, size: 1}]
		let transaction: any = {
			getAsList: (os, key) => {
				return os === SearchIndexMetaDataOS
					? Promise.resolve(metaData)
					: Promise.resolve([entry])
			},
			put: spy((os, key, value) => Promise.resolve()),
			delete: spy((os, key) => Promise.resolve())
		}
		const core = makeCore()
		return neverNull(core._deleteIndexedInstance(indexUpdate, transaction)).then(() => {
			o(transaction.put.invocations).deepEquals([])
			o(transaction.delete.invocations).deepEquals([
				[ElementDataOS, encInstanceIdB64],
				[SearchIndexOS, 1],
				[SearchIndexMetaDataOS, encWord]
			])
		})
	})

	o("writeIndexUpdate _deleteIndexedInstance instance already deleted", function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let entry: EncryptedSearchIndexEntry = [new Uint8Array([8]), new Uint8Array([4, 7, 6])]
		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord, [uint8ArrayToBase64(entry[0])])
		indexUpdate.delete.encInstanceIds.push(uint8ArrayToBase64(entry[0]))

		let transaction: any = {
			getAsList: (os, key) => Promise.resolve([]),
			put: (os, key, value) => {
				throw new Error("instance does not exist, should not be moved!")
			},
			delete: spy(() => Promise.resolve())
		}

		const core = makeCore()
		return neverNull(core._deleteIndexedInstance(indexUpdate, transaction)).then(() => {
			o(transaction.delete.invocations).deepEquals([
				[ElementDataOS, uint8ArrayToBase64(entry[0])]
			])
		})
	})

	o("writeIndexUpdate _insertNewElementData", function (done) {
		let groupId = "my-group"
		let listId = "list-id"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = uint8ArrayToBase64(new Uint8Array([8]))
		let elementData: ElementData = [listId, new Uint8Array(0), groupId]
		indexUpdate.create.encInstanceIdToElementData.set(encInstanceId, elementData)

		let insertedElementData = false
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(key).equals(encInstanceId)
				return Promise.resolve()
			},
			put: (os, key, value) => {
				o(os).equals(ElementDataOS)
				o(key).equals(encInstanceId)
				o(value).deepEquals(elementData)
				insertedElementData = true
				return Promise.resolve()
			}
		}

		const core = makeCore()
		neverNull(core._insertNewElementData(indexUpdate, transaction)).then(keysToUpdate => {
			o(JSON.stringify(keysToUpdate)).equals(JSON.stringify({[encInstanceId]: true}))
			if (insertedElementData) done()
		})
	})

	o("writeIndexUpdate _insertNewElementData already indexed", function (done) {
		let groupId = "my-group"
		let listId = "list-id"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = uint8ArrayToBase64(new Uint8Array([8]))
		let elementData: ElementData = [listId, new Uint8Array(0), groupId]
		indexUpdate.create.encInstanceIdToElementData.set(encInstanceId, elementData)

		let insertedElementData = false
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(key).equals(encInstanceId)
				return Promise.resolve(elementData)
			},
			put: (os, key, value) => {
				o(os).equals(ElementDataOS)
				o(key).equals(encInstanceId)
				o(value).deepEquals(elementData)
				insertedElementData = true
			}
		}

		const core = makeCore()
		neverNull(core._insertNewElementData(indexUpdate, transaction)).then(keysToUpdate => {
			o(JSON.stringify(keysToUpdate)).equals(JSON.stringify({}))
			if (!insertedElementData) done()
		})
	})

	o("writeIndexUpdate _insertNewIndexEntries new word", async function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = new Uint8Array([8])
		let encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let entry: EncryptedSearchIndexEntry = [encInstanceId, new Uint8Array(0)]
		indexUpdate.create.indexMap.set((encWord), [entry])
		const searchIndexEntryId = 1

		let transaction: any = {
			get: spy((os, key) => {
				return os === SearchIndexOS
					? Promise.resolve()
					: Promise.resolve(null)
			}),
			put: spy((os, key, value) => {
				return os === SearchIndexOS
					? Promise.resolve(searchIndexEntryId)
					: Promise.resolve(null)
			})
		}

		const core = makeCore()
		await core._insertNewIndexEntries(indexUpdate, {[uint8ArrayToBase64(encInstanceId)]: true}, transaction)

		o(transaction.put.invocations[0]).deepEquals([SearchIndexOS, null, [entry]])
		o(transaction.put.invocations[1])
			.deepEquals([SearchIndexMetaDataOS, encWord, [{key: searchIndexEntryId, size: 1}]])

	})

	o("writeIndexUpdate _insertNewIndexEntries existing word", async function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = new Uint8Array([8])
		let encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let entry: EncryptedSearchIndexEntry = [encInstanceId, new Uint8Array(0)]
		let existingEntry: EncryptedSearchIndexEntry = [new Uint8Array([2]), new Uint8Array(0)]
		indexUpdate.create.indexMap.set(encWord, [entry])

		const searchIndexMeta = {key: 1, size: 1}

		let transaction: any = {
			get: (os, key) => {
				return os === SearchIndexOS
					? key === searchIndexMeta.key ? Promise.resolve([existingEntry]) : Promise.resolve(null)
					: Promise.resolve([searchIndexMeta])
			},
			put: spy((os, key, value) => {
				return os === SearchIndexOS
					? Promise.resolve(searchIndexMeta.key)
					: Promise.resolve()
			})
		}

		const core = makeCore()
		await core._insertNewIndexEntries(indexUpdate, {[uint8ArrayToBase64(encInstanceId)]: true}, transaction)

		o(transaction.put.invocations[0])
			.deepEquals([SearchIndexOS, searchIndexMeta.key, [existingEntry, entry]])
		let updatedMetadata = {key: 1, size: 2}
		o(transaction.put.invocations[1]).deepEquals([SearchIndexMetaDataOS, encWord, [updatedMetadata]])

	})

	o("writeIndexUpdate _insertNewIndexEntries metadata limit reached", async function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		const newEntries = []
		const keysToUpdate = {}
		for (let i = 0; i < 2000; i++) {
			const instanceId = new Uint8Array([i])
			const base64 = uint8ArrayToBase64(instanceId)
			newEntries.push([instanceId, new Uint8Array(0)])
			keysToUpdate[base64] = true
		}
		indexUpdate.create.indexMap.set(encWord, newEntries)
		const searchIndexMeta = [{key: 1, size: 8000}, {key: 2, size: 9000}]
		const newKey = 3

		let transaction: any = {
			get: (os, key) => {
				return os === SearchIndexOS
					? Promise.reject()
					: Promise.resolve(searchIndexMeta.slice())
			},
			put: spy((os, key, value) => {
				return os === SearchIndexOS
					? key == null ? Promise.resolve(newKey) : Promise.reject()
					: Promise.resolve()
			})
		}

		const core = makeCore()
		await core._insertNewIndexEntries(indexUpdate, keysToUpdate, transaction)
		o(transaction.put.invocations[0]).deepEquals([SearchIndexOS, null, newEntries])
		let updatedMetadata = searchIndexMeta.concat({key: newKey, size: newEntries.length})
		o(transaction.put.invocations[1]).deepEquals([SearchIndexMetaDataOS, encWord, updatedMetadata])
	})

	o("writeIndexUpdate _insertNewIndexEntries already indexed (keysToUpdate param empty)", function () {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = new Uint8Array([8])
		let encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let entry: EncryptedSearchIndexEntry = [encInstanceId, new Uint8Array(0)]
		indexUpdate.create.indexMap.set(encWord, [entry])

		let transaction: any = {
			get: (os, key) => {
				throw new Error("should not be called")
			},
			put: (os, key, value) => {
				throw new Error("should not be called")
			}
		}

		const core = makeCore()
		return core._insertNewIndexEntries(indexUpdate, {}, transaction)
	})

	o("writeIndexUpdate _updateGroupData abort in case batch has been indexed already", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		indexUpdate.batchId = [groupId, "last-batch-id"]

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
				let groupData: GroupData = ({lastBatchIds: ["1", "last-batch-id", "3"]}: any)
				return Promise.resolve(groupData)
			},
			aborted: true,
			abort: () => {
				done()
			}
		}

		const core = makeCore()
		core._updateGroupData(indexUpdate, transaction)
	})

	o("writeIndexUpdate _updateGroupData", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		indexUpdate.batchId = [groupId, "2"]

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
				let groupData: GroupData = ({lastBatchIds: ["4", "3", "1"]}: any)
				return Promise.resolve(groupData)
			},
			aborted: false,
			put: (os, key, value) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
				o(JSON.stringify(value)).deepEquals(JSON.stringify({lastBatchIds: ["4", "3", "2", "1"]}))
				done()
			}
		}

		const core = makeCore()
		core._updateGroupData(indexUpdate, transaction)
	})


	o("writeIndexUpdate", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)

		let waitForTransaction = false
		let transaction: any = {
			wait: () => {
				waitForTransaction = true
				return Promise.resolve()
			},
		}

		let keysToUpdate: {[B64EncInstanceId]: boolean} = {"test": true}

		const core = makeCore({transaction}, (mocked) => {
			mocked._moveIndexedInstance = o.spy(() => Promise.resolve())
			mocked._deleteIndexedInstance = o.spy()
			mocked._insertNewElementData = o.spy(() => Promise.resolve(keysToUpdate))
			mocked._insertNewIndexEntries = o.spy()
			mocked._updateGroupData = o.spy()
		})

		core.writeIndexUpdate(indexUpdate).then(() => {
			o(core._moveIndexedInstance.callCount).equals(1)
			o(core._moveIndexedInstance.args).deepEquals([indexUpdate, transaction])

			o(core._deleteIndexedInstance.callCount).equals(1)
			o(core._deleteIndexedInstance.args).deepEquals([indexUpdate, transaction])

			o(core._insertNewElementData.callCount).equals(1)
			o(core._insertNewElementData.args).deepEquals([indexUpdate, transaction])

			o(core._insertNewIndexEntries.callCount).equals(1)
			o(core._insertNewIndexEntries.args).deepEquals([indexUpdate, keysToUpdate, transaction])

			o(core._updateGroupData.callCount).equals(1)
			o(core._updateGroupData.args).deepEquals([indexUpdate, transaction])

			if (waitForTransaction) done()
		})
	})

	o("processDeleted", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let instanceId = "123"
		let event = createEntityUpdate()
		event.instanceId = instanceId

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			},
		}

		const core = makeCore({transaction})

		let listId = "list-id"
		let encryptedWords = aes256Encrypt(core.db.key, stringToUtf8Uint8Array("one two"), random.generateRandomData(IV_BYTE_LENGTH), true, false)
		let elementData: ElementData = [listId, encryptedWords, groupId]

		let encInstanceId = encryptIndexKeyBase64(core.db.key, instanceId, core.db.iv)

		let encWord1 = encryptIndexKeyBase64(core.db.key, "one", core.db.iv)
		let otherId = uint8ArrayToBase64(new Uint8Array([88]))
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord1, [otherId])

		core._processDeleted(event, indexUpdate).then(() => {
			o(indexUpdate.delete.encInstanceIds.length).equals(1)
			o(indexUpdate.delete.encInstanceIds[0]).deepEquals(encInstanceId)

			o(indexUpdate.delete.encWordToEncInstanceIds.size).equals(2)

			let ids = neverNull(indexUpdate.delete.encWordToEncInstanceIds.get(encWord1))
			o(ids.length).equals(2)
			o(Array.from(ids[0])).deepEquals(Array.from(otherId))
			o(Array.from(ids[1])).deepEquals(Array.from(encInstanceId))

			let encWord2 = encryptIndexKeyBase64(core.db.key, "two", core.db.iv)
			let ids2 = neverNull(indexUpdate.delete.encWordToEncInstanceIds.get(encWord2))
			o(ids2.length).equals(1)
			o(Array.from(ids2[0])).deepEquals(Array.from(encInstanceId))

			o(indexUpdate.delete.encInstanceIds.length).equals(1)
			o(Array.from(indexUpdate.delete.encInstanceIds[0])).deepEquals(Array.from(encInstanceId))

			done()
		})
	})

	o("processDeleted already deleted", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let instanceId = "123"
		let event = createEntityUpdate()
		event.instanceId = instanceId

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve()
			},
		}

		const core = makeCore({
			queue: downcast({_eventQueue: []}),
			transaction
		})

		let encInstanceId = encryptIndexKeyBase64(core.db.key, instanceId, core.db.iv)

		core._processDeleted(event, indexUpdate).then(() => {
			o(indexUpdate.delete.encWordToEncInstanceIds.size).equals(0)
			o(indexUpdate.delete.encInstanceIds.length).equals(0)
			done()
		})
	})

	o("stopProcessing", async function () {
		const queue: EventQueue = downcast({_eventQueue: [], clear: spy()})
		const deferred = defer()

		const core = makeCore({
			queue,
			db: {
				key: aes256RandomKey(),
				iv: fixedIv,
				dbFacade: ({createTransaction: () => deferred.promise}: any),
				initialized: Promise.resolve()
			}
		})

		const result = core.writeIndexUpdate((null: any))
		core.stopProcessing()
		o(queue.clear.invocations).deepEquals([[]])("Should clear queue")

		try {
			deferred.resolve()
			await result
			o(false).equals(true)("Should throw an error")
		} catch (e) {
			o(e instanceof CancelledError).equals(true)("Should throw cancelledError")
		}
	})

	o("startProcessing", async function () {
		const queue: EventQueue = downcast({_eventQueue: [1, 2, 3], clear: spy()})

		const transaction: DbTransaction = downcast({
			get: () => Promise.resolve(null),
			put: () => Promise.resolve(null),
			wait: () => Promise.resolve()
		})

		const core = makeCore({queue, transaction})

		core.stopProcessing()
		core.startProcessing()

		// Should not throw
		await core.writeIndexUpdate(_createNewIndexUpdate("group-id"))
	})
})