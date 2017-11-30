// @flow
import o from "ospec/ospec.js"
import type {ElementData} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {htmlToText, Indexer} from "../../../../src/api/worker/search/Indexer"
import {createContact} from "../../../../src/api/entities/tutanota/Contact"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../../src/api/common/EntityFunctions"
import {aes256RandomKey, aes256Decrypt} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64} from "../../../../src/api/common/utils/Encoding"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody} from "../../../../src/api/entities/tutanota/MailBody"
import {encryptIndexKey} from "../../../../src/api/worker/search/IndexUtils"

o.spec("Indexer test", () => {
	o("htmlToPlainText", function () {
		o(htmlToText("")).equals("")
		o(htmlToText("test")).equals("test")
		let html = "this string has <i>html</i> code <!-- ignore comments-->i want to <b>remove</b><br>Link Number 1 -><a href='http://www.bbc.co.uk'>BBC</a> Link Number 1<br><p>Now back to normal text and stuff</p>"
		let plain = "this string has  html  code  i want to  remove  Link Number 1 -> BBC  Link Number 1  Now back to normal text and stuff "
		o(htmlToText(html)).equals(plain)
		o(htmlToText("<img src='>' >")).equals(" ' >") // TODO handle this case
		o(htmlToText("&nbsp;&amp;&lt;&gt;")).equals(" &<>")
		o(htmlToText("&ouml;")).equals("ö")
		o(htmlToText("&Ouml;")).equals("Ö")
		o(htmlToText("&Phi;")).equals("Φ")
		o(htmlToText(null)).equals("")
		o(htmlToText(undefined)).equals("")
	})

	o("new index update", function () {
		let indexUpdate = _createNewIndexUpdate("groupId")
		o(indexUpdate.groupId).equals("groupId")
		o(indexUpdate.batchId).equals(null)
		o(indexUpdate.oldestIndexedId).equals(null)
		o(indexUpdate.create.encInstanceIdToElementData instanceof Map).equals(true)
		o(indexUpdate.create.indexMap instanceof Map).equals(true)
		o(indexUpdate.move).deepEquals([])
		o(indexUpdate.delete.encWordToEncInstanceIds instanceof Map).equals(true)
		o(indexUpdate.delete.encInstanceIds).deepEquals([])
	})

	o("createNoContactIndexData", function () {
		let update = _createNewIndexUpdate("groupId")
		let c = createContact()
		c._id = [GENERATED_MIN_ID, GENERATED_MAX_ID]
		const indexer = new Indexer((null:any), (null:any))
		indexer.db = ({key: aes256RandomKey()}:any)
		indexer._createContactIndexEntries(c, update)
		o(update.create.encInstanceIdToElementData.size).equals(1)

		// empty IndexData
		let key = uint8ArrayToBase64(encryptIndexKey(indexer.db.key, GENERATED_MAX_ID))
		let value: ElementData = (update.create.encInstanceIdToElementData.get(key):any)
		o(value[0]).equals(GENERATED_MIN_ID)
		o(uint8ArrayToBase64(aes256Decrypt(indexer.db.key, value[1], true))).equals(uint8ArrayToBase64(new Uint8Array(0)))
	})


	o.only("createNoMailIndexData", function () {
		let update = _createNewIndexUpdate("groupId")
		let m = createMail()
		let b = createMailBody()
		m._id = [GENERATED_MIN_ID, GENERATED_MAX_ID]
		const indexer = new Indexer((null:any), (null:any))
		indexer.db = ({key: aes256RandomKey()}:any)
		indexer._createMailIndexEntries(m, b, update)
		o(update.create.encInstanceIdToElementData.size).equals(1)

		// empty IndexData
		let key = uint8ArrayToBase64(encryptIndexKey(indexer.db.key, GENERATED_MAX_ID))
		let value: ElementData = (update.create.encInstanceIdToElementData.get(key):any)
		o(value[0]).equals(GENERATED_MIN_ID)
		o(uint8ArrayToBase64(aes256Decrypt(indexer.db.key, value[1], true))).equals(uint8ArrayToBase64(new Uint8Array(0)))
	})
})
