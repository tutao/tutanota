// @flow
import o from "ospec/ospec.js"
import type {
	ElementData,
	SearchIndexEntry,
	EncryptedSearchIndexEntry
} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {Indexer} from "../../../../src/api/worker/search/Indexer"
import {createContact, _TypeModel as ContactModel, ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../../src/api/common/EntityFunctions"
import {aes256RandomKey, aes256Decrypt} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64, utf8Uint8ArrayToString} from "../../../../src/api/common/utils/Encoding"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody} from "../../../../src/api/entities/tutanota/MailBody"
import {encryptIndexKey, getAppId, decryptSearchIndexEntry} from "../../../../src/api/worker/search/IndexUtils"
import {neverNull} from "../../../../src/api/common/utils/Utils"

o.spec("Indexer test", () => {
	o("new index update", function () {
		let indexUpdate = _createNewIndexUpdate("groupId")
		o(indexUpdate.groupId).equals("groupId")
		o(indexUpdate.batchId).equals(null)
		o(indexUpdate.indexTimestamp).equals(null)
		o(indexUpdate.create.encInstanceIdToElementData instanceof Map).equals(true)
		o(indexUpdate.create.indexMap instanceof Map).equals(true)
		o(indexUpdate.move).deepEquals([])
		o(indexUpdate.delete.encWordToEncInstanceIds instanceof Map).equals(true)
		o(indexUpdate.delete.encInstanceIds).deepEquals([])
	})

	o("createIndexEntriesForAttributes", function () {
		let indexer = new Indexer((null:any), (null:any))

		let contact = createContact()
		contact._id = ["", "L-dNNLe----0"]
		contact.firstName = "Max Tim"
		contact.lastName = "Meier" // not indexed
		contact.company = (undefined:any) // indexed but not defined
		contact.comment = "Friend of Tim"
		let entries = indexer.createIndexEntriesForAttributes(ContactModel, contact, [
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
		const indexer = new Indexer((null:any), (null:any))
		indexer.db.key = aes256RandomKey()
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
		indexer.encryptSearchIndexEntries(id, ownerGroupId, keyToIndexEntries, indexUpdate)

		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		let elementData: ElementData = neverNull(indexUpdate.create.encInstanceIdToElementData.get(uint8ArrayToBase64(encryptIndexKey(indexer.db.key, "2"))))
		let listId = elementData[0]
		o(listId).equals(id[0])
		let words = utf8Uint8ArrayToString(aes256Decrypt(indexer.db.key, elementData[1], true))
		o(words).equals("a b")
		o(ownerGroupId).equals(elementData[2])

		o(indexUpdate.create.indexMap.size).equals(2)

		let a: EncryptedSearchIndexEntry[] = neverNull(indexUpdate.create.indexMap.get(uint8ArrayToBase64(encryptIndexKey(indexer.db.key, "a"))))
		o(a.length).equals(1)
		let entry = decryptSearchIndexEntry(indexer.db.key, a[0])
		delete entry.encId
		o(entry).deepEquals({
			id: "2",
			app: 1,
			type: 64,
			attribute: 5,
			positions: [0],
		})

		let b: EncryptedSearchIndexEntry[] = neverNull(indexUpdate.create.indexMap.get(uint8ArrayToBase64(encryptIndexKey(indexer.db.key, "b"))))
		o(b.length).equals(1)
		let entry2 = decryptSearchIndexEntry(indexer.db.key, b[0])
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
		indexer.encryptSearchIndexEntries(id2, ownerGroupId, keyToIndexEntries2, indexUpdate)

		o(indexUpdate.create.encInstanceIdToElementData.size).equals(2)
		let elementData2: ElementData = neverNull(indexUpdate.create.encInstanceIdToElementData.get(uint8ArrayToBase64(encryptIndexKey(indexer.db.key, "y"))))
		let listId2 = elementData2[0]
		o(listId2).equals(id2[0])
		let words2 = utf8Uint8ArrayToString(aes256Decrypt(indexer.db.key, elementData2[1], true))
		o(words2).equals("a")
		o(ownerGroupId).equals(elementData2[2])

		a = neverNull(indexUpdate.create.indexMap.get(uint8ArrayToBase64(encryptIndexKey(indexer.db.key, "a"))))
		o(a.length).equals(2)
		entry = decryptSearchIndexEntry(indexer.db.key, a[0])
		delete entry.encId
		o(entry).deepEquals({
			id: "2",
			app: 1,
			type: 64,
			attribute: 5,
			positions: [0],
		})
		let newEntry = decryptSearchIndexEntry(indexer.db.key, a[1])
		delete newEntry.encId
		o(newEntry).deepEquals({
			id: "y",
			app: 0,
			type: 34,
			attribute: 2,
			positions: [7, 62],
		})
	})

	o("writeIndexUpdate move", function() {

	})

	o("createNoMailIndexData", function () {
		let update = _createNewIndexUpdate("groupId")
		let m = createMail()
		let b = createMailBody()
		m._id = [GENERATED_MIN_ID, GENERATED_MAX_ID]
		const indexer = new Indexer((null:any), (null:any))
		indexer.db = ({key: aes256RandomKey()}:any)
		indexer._createMailIndexEntries(m, b, [], update)
		o(update.create.encInstanceIdToElementData.size).equals(1)

		// empty IndexData
		let key = uint8ArrayToBase64(encryptIndexKey(indexer.db.key, GENERATED_MAX_ID))
		let value: ElementData = (update.create.encInstanceIdToElementData.get(key):any)
		o(value[0]).equals(GENERATED_MIN_ID)
		o(uint8ArrayToBase64(aes256Decrypt(indexer.db.key, value[1], true))).equals(uint8ArrayToBase64(new Uint8Array(0)))
	})
})
