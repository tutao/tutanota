// @flow
import o from "ospec/ospec.js"
import {
	_createNewIndexUpdate,
	byteLength,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptSearchIndexEntry,
	filterIndexMemberships,
	filterMailMemberships,
	getAppId,
	htmlToText,
	userIsGlobalAdmin,
	userIsLocalOrGlobalAdmin
} from "../../../../src/api/worker/search/IndexUtils"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {createUser, UserTypeRef} from "../../../../src/api/entities/sys/User"
import {aes256Decrypt, aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {base64ToUint8Array, utf8Uint8ArrayToString} from "../../../../src/api/common/utils/Encoding"
import {fixedIv} from "../../../../src/api/worker/crypto/CryptoFacade"
import {concat} from "../../../../src/api/common/utils/ArrayUtils"
import type {SearchIndexEntry} from "../../../../src/api/worker/search/SearchTypes"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import type {OperationTypeEnum} from "../../../../src/api/common/TutanotaConstants"
import {GroupType, OperationType} from "../../../../src/api/common/TutanotaConstants"
import {createEntityUpdate} from "../../../../src/api/entities/sys/EntityUpdate"
import {containsEventOfType} from "../../../../src/api/common/utils/Utils"

o.spec("Index Utils", () => {
	o("encryptIndexKey", function () {
		let key = aes256RandomKey()
		let encryptedKey = encryptIndexKeyBase64(key, "blubb", fixedIv)
		let decrypted = aes256Decrypt(key, concat(fixedIv, base64ToUint8Array(encryptedKey)), true, false)
		o(utf8Uint8ArrayToString(decrypted)).equals("blubb")
	})

	o("encryptSearchIndexEntry + decryptSearchIndexEntry", function () {
		let key = aes256RandomKey()
		let entry: SearchIndexEntry = {id: "L0YED5d----1", app: 0, type: 64, attribute: 84, positions: [12, 536, 3]}
		let encId = encryptIndexKeyUint8Array(key, entry.id, fixedIv)
		let encryptedEntry = encryptSearchIndexEntry(key, entry, encId)

		const result = aes256Decrypt(key, encryptedEntry.slice(16), true, false)
		o(Array.from(result))
			.deepEquals(Array.from(new Uint8Array([0, 64, 84, 12, 0x82, 0x02, 0x18, 3])))

		let decrypted = decryptSearchIndexEntry(key, encryptedEntry, fixedIv)
		o(JSON.stringify(decrypted.encId)).deepEquals(JSON.stringify(encId))
		delete decrypted.encId
		o(JSON.stringify(decrypted)).deepEquals(JSON.stringify(entry))
	})

	o("getAppId", function () {
		o(getAppId(UserTypeRef)).equals(0)
		o(getAppId(ContactTypeRef)).equals(1)
		try {
			getAppId({app: 5})
			o("Failure, non supported appid").equals(false)
		} catch (e) {
			o(e.message.startsWith("non indexed application")).equals(true)
		}
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
		let indexUpdate = _createNewIndexUpdate("groupId")
		o(indexUpdate.groupId).equals("groupId")
		o(indexUpdate.batchId).equals(null)
		o(indexUpdate.indexTimestamp).equals(null)
		o(indexUpdate.create.encInstanceIdToElementData instanceof Map).equals(true)
		o(indexUpdate.create.indexMap instanceof Map).equals(true)
		o(indexUpdate.move).deepEquals([])
		o(indexUpdate.delete.searchIndexRowToEncInstanceIds instanceof Map).equals(true)
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

