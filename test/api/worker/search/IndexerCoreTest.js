// @flow
import o from "ospec/ospec.js"
import type {
	ElementData,
	SearchIndexEntry,
	EncryptedSearchIndexEntry,
	GroupData,
	B64EncInstanceId
} from "../../../../src/api/worker/search/SearchTypes"
import {
	_createNewIndexUpdate,
	encryptIndexKeyBase64,
	getAppId,
	decryptSearchIndexEntry
} from "../../../../src/api/worker/search/IndexUtils"
import {createContact, _TypeModel as ContactModel, ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {aes256RandomKey, aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../../../../src/api/worker/crypto/Aes"
import {
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
	stringToUtf8Uint8Array
} from "../../../../src/api/common/utils/Encoding"
import {neverNull} from "../../../../src/api/common/utils/Utils"
import {IndexerCore} from "../../../../src/api/worker/search/IndexerCore"
import {ElementDataOS, SearchIndexOS, GroupDataOS} from "../../../../src/api/worker/search/DbFacade"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {random} from "../../../../src/api/worker/crypto/Randomizer"

o.spec("IndexerCore test", () => {

	o("createIndexEntriesForAttributes", function () {
		let core = new IndexerCore((null:any), (null:any))

		let contact = createContact()
		contact._id = ["", "L-dNNLe----0"]
		contact.firstName = "Max Tim"
		contact.lastName = "Meier" // not indexed
		contact.company = (undefined:any) // indexed but not defined
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
		o(entries.get("max")).deepEquals([{
			id: "L-dNNLe----0",
			app: getAppId(ContactTypeRef),
			type: ContactModel.id,
			attribute: ContactModel.values["firstName"].id,
			positions: [0]
		}])
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
		o(entries.get("friend")).deepEquals([{
			id: "L-dNNLe----0",
			app: getAppId(ContactTypeRef),
			type: ContactModel.id,
			attribute: ContactModel.values["comment"].id,
			positions: [0]
		}])
		o(entries.get("of")).deepEquals([{
			id: "L-dNNLe----0",
			app: getAppId(ContactTypeRef),
			type: ContactModel.id,
			attribute: ContactModel.values["comment"].id,
			positions: [1]
		}])
	})


	o("encryptSearchIndexEntries", function () {
		const core = new IndexerCore(({key: aes256RandomKey()}:any), (null:any))
		let id = ["1", "2"]
		let ownerGroupId = "ownerGroupId"
		let keyToIndexEntries: Map<string,SearchIndexEntry[]> = new Map([
			["a", [{
				id: "2",
				app: 1,
				type: 64,
				attribute: 5,
				positions: [0],
			}]],
			["b", [{
				id: "2",
				app: 0,
				type: 7,
				attribute: 4,
				positions: [8, 27],
			}]],
		])
		let indexUpdate = _createNewIndexUpdate(ownerGroupId)
		core.encryptSearchIndexEntries(id, ownerGroupId, keyToIndexEntries, indexUpdate)

		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		let elementData: ElementData = neverNull(indexUpdate.create.encInstanceIdToElementData.get(encryptIndexKeyBase64(core.db.key, "2")))
		let listId = elementData[0]
		o(listId).equals(id[0])
		let words = utf8Uint8ArrayToString(aes256Decrypt(core.db.key, elementData[1], true, false))
		o(words).equals("a b")
		o(ownerGroupId).equals(elementData[2])

		o(indexUpdate.create.indexMap.size).equals(2)

		let a: EncryptedSearchIndexEntry[] = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "a")))
		o(a.length).equals(1)
		let entry = decryptSearchIndexEntry(core.db.key, a[0])
		delete entry.encId
		o(entry).deepEquals({
			id: "2",
			app: 1,
			type: 64,
			attribute: 5,
			positions: [0],
		})

		let b: EncryptedSearchIndexEntry[] = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "b")))
		o(b.length).equals(1)
		let entry2 = decryptSearchIndexEntry(core.db.key, b[0])
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
		let keyToIndexEntries2: Map<string,SearchIndexEntry[]> = new Map([
			["a", [{
				id: "y",
				app: 0,
				type: 34,
				attribute: 2,
				positions: [7, 62],
			}]]
		])
		core.encryptSearchIndexEntries(id2, ownerGroupId, keyToIndexEntries2, indexUpdate)

		o(indexUpdate.create.encInstanceIdToElementData.size).equals(2)
		let elementData2: ElementData = neverNull(indexUpdate.create.encInstanceIdToElementData.get(encryptIndexKeyBase64(core.db.key, "y")))
		let listId2 = elementData2[0]
		o(listId2).equals(id2[0])
		let words2 = utf8Uint8ArrayToString(aes256Decrypt(core.db.key, elementData2[1], true, false))
		o(words2).equals("a")
		o(ownerGroupId).equals(elementData2[2])

		a = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "a")))
		o(a.length).equals(2)
		entry = decryptSearchIndexEntry(core.db.key, a[0])
		delete entry.encId
		o(entry).deepEquals({
			id: "2",
			app: 1,
			type: 64,
			attribute: 5,
			positions: [0],
		})
		let newEntry = decryptSearchIndexEntry(core.db.key, a[1])
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
				return Promise.resolve((["old-list", words, groupId]:ElementData))
			},
			put: (os, key, value) => {
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				o(value).deepEquals(["new-list", words, groupId])
				done()
			}
		}

		const core = new IndexerCore((null:any), (null:any))
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

		const core = new IndexerCore((null:any), (null:any))
		neverNull(core._moveIndexedInstance(indexUpdate, transaction)).then(() => done())
	})

	o("writeIndexUpdate _deleteIndexedInstance", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let entry: EncryptedSearchIndexEntry = [new Uint8Array([8]), new Uint8Array([4, 7, 6])]
		let other: EncryptedSearchIndexEntry = [new Uint8Array([17]), new Uint8Array([1, 12])]
		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord, [uint8ArrayToBase64(entry[0])])
		indexUpdate.delete.encInstanceIds.push(uint8ArrayToBase64(entry[0]))

		let deletedElementData = false
		let transaction: any = {
			getAsList: (os, key) => {
				o(os).equals(SearchIndexOS)
				o(key).deepEquals(encWord)
				return Promise.resolve(([other, entry]:EncryptedSearchIndexEntry[]))
			},
			put: (os, key, value) => {
				o(os).equals(SearchIndexOS)
				o(key).deepEquals(encWord)
				o(value).deepEquals([other])
				if (deletedElementData) done()
			},
			delete: (os, key) => {
				o(os).equals(ElementDataOS)
				o(key).deepEquals(uint8ArrayToBase64(entry[0]))
				deletedElementData = true
			}
		}

		const core = new IndexerCore((null:any), (null:any))
		core._deleteIndexedInstance(indexUpdate, transaction)
	})

	o("writeIndexUpdate _deleteIndexedInstance last entry for word", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let entry: EncryptedSearchIndexEntry = [new Uint8Array([8]), new Uint8Array([4, 7, 6])]
		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord, [uint8ArrayToBase64(entry[0])])
		indexUpdate.delete.encInstanceIds.push(uint8ArrayToBase64(entry[0]))

		let deletedElementData = false
		let transaction: any = {
			getAsList: (os, key) => {
				o(os).equals(SearchIndexOS)
				o(key).deepEquals(encWord)
				return Promise.resolve(([entry]:EncryptedSearchIndexEntry[]))
			},
			delete: (os, key) => {
				if (!deletedElementData) {
					o(os).equals(ElementDataOS)
					o(key).deepEquals(uint8ArrayToBase64(entry[0]))
					deletedElementData = true
				} else {
					o(os).equals(SearchIndexOS)
					o(key).deepEquals(encWord)
					done()
				}
			}
		}

		const core = new IndexerCore((null:any), (null:any))
		core._deleteIndexedInstance(indexUpdate, transaction)
	})

	o("writeIndexUpdate _deleteIndexedInstance instance already deleted", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let entry: EncryptedSearchIndexEntry = [new Uint8Array([8]), new Uint8Array([4, 7, 6])]
		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		indexUpdate.delete.encWordToEncInstanceIds.set(encWord, [uint8ArrayToBase64(entry[0])])
		indexUpdate.delete.encInstanceIds.push(uint8ArrayToBase64(entry[0]))

		let transaction: any = {
			getAsList: (os, key) => {
				o(os).equals(SearchIndexOS)
				o(key).deepEquals(encWord)
				return Promise.resolve([])
			},
			put: (os, key, value) => {
				throw new Error("instance does not exist, should not be moved!")
			},
			delete: (os, key) => {
				throw new Error("instance does not exist, should not be deleted!")
			}
		}

		const core = new IndexerCore((null:any), (null:any))
		neverNull(core._deleteIndexedInstance(indexUpdate, transaction)).then(done)
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
			}
		}

		const core = new IndexerCore((null:any), (null:any))
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

		const core = new IndexerCore((null:any), (null:any))
		neverNull(core._insertNewElementData(indexUpdate, transaction)).then(keysToUpdate => {
			o(JSON.stringify(keysToUpdate)).equals(JSON.stringify({}))
			if (!insertedElementData) done()
		})
	})

	o("writeIndexUpdate _insertNewIndexEntries new word", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = new Uint8Array([8])
		let encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let entry: EncryptedSearchIndexEntry = [encInstanceId, new Uint8Array(0)]
		indexUpdate.create.indexMap.set((encWord), [entry])

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(SearchIndexOS)
				o(key).equals(encWord)
				return Promise.resolve()
			},
			put: (os, key, value) => {
				o(os).equals(SearchIndexOS)
				o(key).equals(encWord)
				o(value).deepEquals([entry])
				done()
				return Promise.resolve()
			}
		}

		const core = new IndexerCore((null:any), (null:any))
		core._insertNewIndexEntries(indexUpdate, {[uint8ArrayToBase64(encInstanceId)]: true}, transaction)
	})

	o("writeIndexUpdate _insertNewIndexEntries existing word", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		let encInstanceId = new Uint8Array([8])
		let encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let entry: EncryptedSearchIndexEntry = [encInstanceId, new Uint8Array(0)]
		let existingEntry: EncryptedSearchIndexEntry = [new Uint8Array([2]), new Uint8Array(0)]
		indexUpdate.create.indexMap.set(encWord, [entry])

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(SearchIndexOS)
				o(key).equals(encWord)
				return Promise.resolve([existingEntry])
			},
			put: (os, key, value) => {
				o(os).equals(SearchIndexOS)
				o(key).equals(encWord)
				o(value).deepEquals([existingEntry, entry])
				done()
				return Promise.resolve()
			}
		}

		const core = new IndexerCore((null:any), (null:any))
		core._insertNewIndexEntries(indexUpdate, {[uint8ArrayToBase64(encInstanceId)]: true}, transaction)
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

		const core = new IndexerCore((null:any), (null:any))
		o(core._insertNewIndexEntries(indexUpdate, {}, transaction)).equals(null)
	})

	o("writeIndexUpdate _updateGroupData abort in case batch has been indexed already", function (done) {
		let groupId = "my-group"
		let indexUpdate = _createNewIndexUpdate(groupId)
		indexUpdate.batchId = [groupId, "last-batch-id"]

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
				let groupData: GroupData = ({lastBatchIds: ["1", "last-batch-id", "3"]}:any)
				return Promise.resolve(groupData)
			},
			aborted: true,
			abort: () => {
				done()
			}
		}

		const core = new IndexerCore((null:any), (null:any))
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
				let groupData: GroupData = ({lastBatchIds: ["4", "3", "1"]}:any)
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

		const core = new IndexerCore((null:any), (null:any))
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

		let keysToUpdate: {[B64EncInstanceId]:boolean} = {"test": true}

		const core: any = new IndexerCore({
			key: aes256RandomKey(),
			dbFacade: ({createTransaction: () => transaction}:any)
		}, ({queueEvents: false}:any))
		core._moveIndexedInstance = o.spy(() => Promise.resolve())
		core._deleteIndexedInstance = o.spy()
		core._insertNewElementData = o.spy(() => Promise.resolve(keysToUpdate))
		core._insertNewIndexEntries = o.spy()
		core._updateGroupData = o.spy()
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

		const core: any = new IndexerCore({
			key: aes256RandomKey(),
			dbFacade: ({createTransaction: () => transaction}:any)
		}, ({queueEvents: false}:any))

		let listId = "list-id"
		let encryptedWords = aes256Encrypt(core.db.key, stringToUtf8Uint8Array("one two"), random.generateRandomData(IV_BYTE_LENGTH), true, false)
		let elementData: ElementData = [listId, encryptedWords, groupId]

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			},
		}

		let encInstanceId = encryptIndexKeyBase64(core.db.key, instanceId)

		let encWord1 = encryptIndexKeyBase64(core.db.key, "one")
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

			let encWord2 = encryptIndexKeyBase64(core.db.key, "two")
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

		const core: any = new IndexerCore({
			key: aes256RandomKey(),
			dbFacade: ({createTransaction: () => transaction}:any)
		}, ({queueEvents: false}:any))

		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve()
			},
		}

		let encInstanceId = encryptIndexKeyBase64(core.db.key, instanceId)

		core._processDeleted(event, indexUpdate).then(() => {
			o(indexUpdate.delete.encWordToEncInstanceIds.size).equals(0)
			o(indexUpdate.delete.encInstanceIds.length).equals(0)
			done()
		})
	})

})