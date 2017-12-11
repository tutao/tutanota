// @flow
import o from "ospec/ospec.js"
import type {ElementData} from "../../../../src/api/worker/search/SearchTypes"
import {_createNewIndexUpdate} from "../../../../src/api/worker/search/SearchTypes"
import {Indexer} from "../../../../src/api/worker/search/Indexer"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../../src/api/common/EntityFunctions"
import {aes256RandomKey, aes256Decrypt} from "../../../../src/api/worker/crypto/Aes"
import {uint8ArrayToBase64} from "../../../../src/api/common/utils/Encoding"
import {createMail} from "../../../../src/api/entities/tutanota/Mail"
import {createMailBody} from "../../../../src/api/entities/tutanota/MailBody"
import {encryptIndexKey} from "../../../../src/api/worker/search/IndexUtils"

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


})
