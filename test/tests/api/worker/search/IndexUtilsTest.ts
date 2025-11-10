import o from "@tutao/otest"
import {
	_createNewIndexUpdate,
	filterIndexMemberships,
	filterMailMemberships,
	htmlToText,
	typeRefToTypeInfo,
	userIsGlobalAdmin,
} from "../../../../../src/common/api/common/utils/IndexUtils.js"
import { base64ToUint8Array, byteLength, concat, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type { SearchIndexEntry, SearchIndexMetaDataRow } from "../../../../../src/common/api/worker/search/SearchTypes.js"
import { GroupMembershipTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { GroupType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { aes256RandomKey, FIXED_IV, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import { createTestEntity } from "../../../TestUtils.js"
import { ClientModelInfo } from "../../../../../src/common/api/common/EntityFunctions"
import {
	decryptMetaData,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
	encryptSearchIndexEntry,
} from "../../../../../src/common/api/worker/search/IndexEncryptionUtils"

o.spec("Index Utils", () => {
	o("encryptIndexKey", function () {
		let key = aes256RandomKey()
		let encryptedKey = encryptIndexKeyBase64(key, "blubb", FIXED_IV)
		let decrypted = unauthenticatedAesDecrypt(key, base64ToUint8Array(encryptedKey))
		o(utf8Uint8ArrayToString(decrypted)).equals("blubb")
	})
	o("encryptSearchIndexEntry + decryptSearchIndexEntry", function () {
		let key = aes256RandomKey()
		let entry: SearchIndexEntry = {
			id: "L0YED5d----1",
			attribute: 84,
			positions: [12, 536, 3],
		}
		let encId = encryptIndexKeyUint8Array(key, entry.id, FIXED_IV)
		let encryptedEntry = encryptSearchIndexEntry(key, entry, encId)
		// attribute 84 => 0x54,
		// position[0] 12 => 0xC
		// position[1] 536 = 0x218 => length of number = 2 | 0x80 = 0x82 numbers: 0x02, 0x18
		// position[2] 3 => 0x03
		const encodedIndexEntry = [0x54, 0xc, 0x82, 0x02, 0x18, 0x03]
		const result = unauthenticatedAesDecrypt(key, encryptedEntry.slice(16))
		o(Array.from(result)).deepEquals(Array.from(encodedIndexEntry))
		let decrypted = decryptSearchIndexEntry(key, encryptedEntry, FIXED_IV)
		o(JSON.stringify(decrypted.encId)).equals(JSON.stringify(encId))
		const withoutEncId: any = decrypted
		delete withoutEncId.encId
		o(JSON.stringify(decrypted)).equals(JSON.stringify(entry))
	})
	o("encryptMetaData", function () {
		const key = aes256RandomKey()
		const meta: SearchIndexMetaDataRow = {
			id: 3,
			word: "asdsadasds",
			rows: [
				{
					app: 1,
					type: 64,
					key: 3,
					size: 10,
					oldestElementTimestamp: 6,
				},
				{
					app: 2,
					type: 66,
					key: 4,
					size: 8,
					oldestElementTimestamp: 15,
				},
			],
		}
		const encryptedMeta = encryptMetaData(key, meta)
		o(encryptedMeta.id).equals(meta.id)
		o(encryptedMeta.word).equals(meta.word)
		o(Array.from(unauthenticatedAesDecrypt(key, encryptedMeta.rows))).deepEquals([
			// First row
			1,
			64,
			3,
			10,
			6, // Second row
			2,
			66,
			4,
			8,
			15,
		])
		o(decryptMetaData(key, encryptedMeta)).deepEquals(meta)
	})
	o("decryptMetaData with empty rows", function () {
		o(
			decryptMetaData(aes256RandomKey(), {
				id: 1,
				word: "tuta",
				rows: new Uint8Array(0),
			}),
		).deepEquals({
			id: 1,
			word: "tuta",
			rows: [],
		})
	})
	o("typeRefToTypeInfo", async function () {
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
		const ContactTypeModel = await ClientModelInfo.getNewInstanceForTestsOnly().resolveClientTypeReference(ContactTypeRef)
		o(typeRefToTypeInfo(ContactTypeRef).typeId).equals(ContactTypeModel.id)
	})
	o("userIsGlobalAdmin", function () {
		let user = createTestEntity(UserTypeRef)
		user.memberships.push(createTestEntity(GroupMembershipTypeRef))
		user.memberships[0].groupType = GroupType.Admin
		o(userIsGlobalAdmin(user)).equals(true)
		user.memberships[0].groupType = GroupType.Deprecated_LocalAdmin
		o(userIsGlobalAdmin(user)).equals(false)
		user.memberships[0].groupType = GroupType.Mail
		o(userIsGlobalAdmin(user)).equals(false)
	})
	o("filterIndexMemberships", function () {
		const adminGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Admin,
		})
		const contactGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Contact,
		})
		const customerGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Customer,
		})
		const externalGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.External,
		})
		const fileGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.File,
		})
		const mailGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Mail,
		})
		const mailingListGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.MailingList,
		})
		const userGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.User,
		})
		const user = createTestEntity(UserTypeRef, {
			memberships: [adminGroup, contactGroup, customerGroup, externalGroup, fileGroup, mailGroup, mailingListGroup, userGroup],
		})
		o(filterIndexMemberships(user)).deepEquals([contactGroup, mailGroup])
	})
	o("filterMailMemberships", function () {
		const adminGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Admin,
		})
		const contactGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Contact,
		})
		const customerGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Customer,
		})
		const externalGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.External,
		})
		const fileGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.File,
		})
		const mailGroup1 = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Mail,
		})
		const mailingListGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.MailingList,
		})
		const userGroup = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.User,
		})
		const mailGroup2 = createTestEntity(GroupMembershipTypeRef, {
			groupType: GroupType.Mail,
		})
		const user = createTestEntity(UserTypeRef, {
			memberships: [adminGroup, contactGroup, customerGroup, externalGroup, fileGroup, mailGroup1, mailGroup2, mailingListGroup, userGroup],
		})

		o(filterMailMemberships(user)).deepEquals([mailGroup1, mailGroup2])
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
		let html =
			"this string has <i>html</i> code <!-- ignore comments-->i want to <b>remove</b><br>Link Number 1 -><a href='http://www.bbc.co.uk'>BBC</a> Link Number 1<br><p>Now back to normal text and stuff</p>"
		let plain = "this string has  html  code  i want to  remove  Link Number 1 -> BBC  Link Number 1  Now back to normal text and stuff "
		o(htmlToText(html)).equals(plain)
		o(htmlToText("<img src='>' >")).equals(" ' >")

		o(htmlToText("&nbsp;&amp;&lt;&gt;")).equals(" &<>")
		o(htmlToText("&ouml;")).equals("ö")
		o(htmlToText("&Ouml;")).equals("Ö")
		o(htmlToText("&Phi;")).equals("Φ")
		o(htmlToText(null)).equals("")
		o(htmlToText("&#10595;&#1339;")).equals("⥣Ի")
	})
})
