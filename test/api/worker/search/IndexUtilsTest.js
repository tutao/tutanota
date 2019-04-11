// @flow
import o from "ospec/ospec.js"
import {
	_createNewIndexUpdate,
	byteLength,
	decryptMetaData,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
	encryptSearchIndexEntry,
	filterIndexMemberships,
	filterMailMemberships,
	htmlToText,
	typeRefToTypeInfo,
	userIsGlobalAdmin,
	userIsLocalOrGlobalAdmin
} from "../../../../src/api/worker/search/IndexUtils"
import {aes256Decrypt, aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {base64ToUint8Array, utf8Uint8ArrayToString} from "../../../../src/api/common/utils/Encoding"
import {fixedIv} from "../../../../src/api/worker/crypto/CryptoFacade"
import {concat} from "../../../../src/api/common/utils/ArrayUtils"
import type {SearchIndexEntry, SearchIndexMetaDataRow} from "../../../../src/api/worker/search/SearchTypes"
import {createUser, UserTypeRef} from "../../../../src/api/entities/sys/User"
import {_TypeModel as ContactTypeModel, ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import type {OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {GroupType, OperationType} from "../../../../src/api/common/TutanotaConstants"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {containsEventOfType} from "../../../../src/api/common/utils/Utils"
import {MailTypeRef} from "../../../../src/api/entities/tutanota/Mail"

o.spec("Index Utils", () => {
	o("encryptIndexKey", function () {
		let key = aes256RandomKey()
		let encryptedKey = encryptIndexKeyBase64(key, "blubb", fixedIv)
		let decrypted = aes256Decrypt(key, concat(fixedIv, base64ToUint8Array(encryptedKey)), true, false)
		o(utf8Uint8ArrayToString(decrypted)).equals("blubb")
	})

	o("encryptSearchIndexEntry + decryptSearchIndexEntry", function () {
		let key = aes256RandomKey()
		let entry: SearchIndexEntry = {id: "L0YED5d----1", attribute: 84, positions: [12, 536, 3]}
		let encId = encryptIndexKeyUint8Array(key, entry.id, fixedIv)
		let encryptedEntry = encryptSearchIndexEntry(key, entry, encId)

		// attribute 84 => 0x54,
		// position[0] 12 => 0xC
		// position[1] 536 = 0x218 => length of number = 2 | 0x80 = 0x82 numbers: 0x02, 0x18
		// position[2] 3 => 0x03
		const encodedIndexEntry = [0x54, 0xC, 0x82, 0x02, 0x18, 0x03]

		const result = aes256Decrypt(key, encryptedEntry.slice(16), true, false)
		o(Array.from(result))
			.deepEquals(Array.from(encodedIndexEntry))

		let decrypted = decryptSearchIndexEntry(key, encryptedEntry, fixedIv)
		o(JSON.stringify(decrypted.encId)).deepEquals(JSON.stringify(encId))
		delete decrypted.encId
		o(JSON.stringify(decrypted)).deepEquals(JSON.stringify(entry))
	})

	o("encryptMetaData", function () {
		const key = aes256RandomKey()
		const meta: SearchIndexMetaDataRow = {
			id: 3,
			word: "asdsadasds",
			rows: [{app: 1, type: 64, key: 3, size: 10, oldestElementTimestamp: 6}, {app: 2, type: 66, key: 4, size: 8, oldestElementTimestamp: 15}]
		}
		const encryptedMeta = encryptMetaData(key, meta)
		o(encryptedMeta.id).equals(meta.id)
		o(encryptedMeta.word).equals(meta.word)
		o(Array.from(aes256Decrypt(key, encryptedMeta.rows, true, false))).deepEquals([
			// First row
			1, 64, 3, 10, 6,
			// Second row
			2, 66, 4, 8, 15
		])

		o(decryptMetaData(key, encryptedMeta)).deepEquals(meta)
	})

	o("decryptMetaData with empty rows", function () {
		o(decryptMetaData(aes256RandomKey(), {id: 1, word: "tuta", rows: new Uint8Array(0)})).deepEquals({id: 1, word: "tuta", rows: []})
	})

	o("typeRefToTypeInfo", function () {
		let thrown = false
		try {
			typeRefToTypeInfo(UserTypeRef)
		} catch (e) {
			thrown = true
		}
		o(thrown).equals(true)
		// o(typeRefToTypeInfo(UserTypeRef).appId).equals(0)
		// o(typeRefToTypeInfo(UserTypeRef).typeId).equals(UserTypeModel.id)
		o(typeRefToTypeInfo(ContactTypeRef).appId).equals(1)
		o(typeRefToTypeInfo(ContactTypeRef).typeId).equals(ContactTypeModel.id)
	})

	o("userIsLocalOrGlobalAdmin", function () {
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.Admin
		o(userIsLocalOrGlobalAdmin(user)).equals(true)

		user.memberships[0].groupType = GroupType.LocalAdmin
		o(userIsLocalOrGlobalAdmin(user)).equals(true)

		user.memberships[0].groupType = GroupType.Mail
		o(userIsLocalOrGlobalAdmin(user)).equals(false)
	})

	o("userIsGlobalAdmin", function () {
		let user = createUser()
		user.memberships.push(createGroupMembership())
		user.memberships[0].groupType = GroupType.Admin
		o(userIsGlobalAdmin(user)).equals(true)

		user.memberships[0].groupType = GroupType.LocalAdmin
		o(userIsGlobalAdmin(user)).equals(false)

		user.memberships[0].groupType = GroupType.Mail
		o(userIsGlobalAdmin(user)).equals(false)
	})


	o("filterIndexMemberships", function () {
		let user = createUser()
		user.memberships = [
			createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership(),
			createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership()
		]
		user.memberships[0].groupType = GroupType.Admin
		user.memberships[1].groupType = GroupType.Contact
		user.memberships[2].groupType = GroupType.Customer
		user.memberships[3].groupType = GroupType.External
		user.memberships[4].groupType = GroupType.File
		user.memberships[5].groupType = GroupType.Mail
		user.memberships[6].groupType = GroupType.MailingList
		user.memberships[7].groupType = GroupType.User
		o(filterIndexMemberships(user))
			.deepEquals([user.memberships[0], user.memberships[1], user.memberships[2], user.memberships[5]])
	})

	o("filterMailMemberships", function () {
		let user = createUser()
		user.memberships = [
			createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership(),
			createGroupMembership(), createGroupMembership(), createGroupMembership(), createGroupMembership(),
			createGroupMembership()
		]
		user.memberships[0].groupType = GroupType.Admin
		user.memberships[1].groupType = GroupType.Contact
		user.memberships[2].groupType = GroupType.Customer
		user.memberships[3].groupType = GroupType.External
		user.memberships[4].groupType = GroupType.File
		user.memberships[5].groupType = GroupType.Mail
		user.memberships[6].groupType = GroupType.MailingList
		user.memberships[7].groupType = GroupType.User
		user.memberships[8].groupType = GroupType.Mail
		o(filterMailMemberships(user)).deepEquals([user.memberships[5], user.memberships[8]])
	})

	o("containsEventOfType", function () {
		function createUpdate(type: OperationTypeEnum, id: Id) {
			let update = createEntityUpdate()
			update.operation = type
			update.instanceId = id
			return update
		}

		o(containsEventOfType([], OperationType.CREATE, "1")).equals(false)
		o(containsEventOfType([createUpdate(OperationType.CREATE, "1")], OperationType.CREATE, "1")).equals(true)
		o(containsEventOfType([createUpdate(OperationType.DELETE, "1")], OperationType.CREATE, "1")).equals(false)
		o(containsEventOfType([createUpdate(OperationType.DELETE, "2")], OperationType.DELETE, "1")).equals(false)
	})


	o("byteLength", function () {
		o(byteLength("")).equals(0)
		o(byteLength("A")).equals(1)
		o(byteLength("A B")).equals(3)
		o(byteLength("µ")).equals(2)
		o(byteLength("€")).equals(3)
		o(byteLength("💩")).equals(4)
	})

	o("new index update", function () {
		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		o(indexUpdate.create.encInstanceIdToElementData instanceof Map).equals(true)
		o(indexUpdate.create.indexMap instanceof Map).equals(true)
		o(indexUpdate.move).deepEquals([])
		o(indexUpdate.delete.searchMetaRowToEncInstanceIds instanceof Map).equals(true)
		o(indexUpdate.delete.encInstanceIds).deepEquals([])
	})


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
		o(htmlToText("&#10595;&#1339;")).equals("⥣Ի")
	})
})

