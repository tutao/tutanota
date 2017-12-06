// @flow
import o from "ospec/ospec.js"
import type {ElementData} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {Indexer} from "../../../../src/api/worker/search/Indexer"
import {createContact, _TypeModel as ContactModel, ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../../src/api/common/EntityFunctions"
import {aes256RandomKey, aes256Decrypt} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64} from "../../../../src/api/common/utils/Encoding"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody} from "../../../../src/api/entities/tutanota/MailBody"
import {encryptIndexKey, getAppId} from "../../../../src/api/worker/search/IndexUtils"

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
