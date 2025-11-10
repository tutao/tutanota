import o from "@tutao/otest"
import {
	DbEncryptionData,
	ElementDataDbRow,
	ElementDataSurrogate,
	EncryptedSearchIndexEntry,
	EncSearchIndexEntryWithTimestamp,
	EncWordToMetaRow,
	GroupData,
	IndexUpdate,
	SearchIndexEntry,
	SearchIndexMetaDataRow,
} from "../../../../../src/common/api/worker/search/SearchTypes.js"
import { _createNewIndexUpdate, getIdFromEncSearchIndexEntry, typeRefToTypeInfo } from "../../../../../src/common/api/common/utils/IndexUtils.js"
import { base64ToUint8Array, concat, defer, downcast, neverNull, noOp, PromisableWrapper, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { spy } from "@tutao/tutanota-test-utils"
import { ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { DbKey, DbTransaction } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { appendBinaryBlocks } from "../../../../../src/common/api/worker/search/SearchIndexEncoding.js"
import { createSearchIndexDbStub, DbStub, DbStubTransaction } from "./DbStub.js"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore.js"
import { elementIdPart, generatedIdToTimestamp, listIdPart, timestampToGeneratedId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { createTestEntity, makeCore } from "../../../TestUtils.js"
import { Aes256Key, aes256RandomKey, aesEncrypt, FIXED_IV, IV_BYTE_LENGTH, random, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import { ElementDataOS, GroupDataOS, ObjectStoreName, SearchIndexMetaDataOS, SearchIndexOS } from "../../../../../src/common/api/worker/search/IndexTables.js"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel"
import { ClientModelInfo } from "../../../../../src/common/api/common/EntityFunctions"
import { EntityUpdateData } from "../../../../../src/common/api/common/utils/EntityUpdateUtils"
import { CancelledError } from "../../../../../src/common/api/common/error/CancelledError.js"
import {
	decryptIndexKey,
	decryptMetaData,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
} from "../../../../../src/common/api/worker/search/IndexEncryptionUtils"

const mailTypeInfo = typeRefToTypeInfo(MailTypeRef)
const contactTypeInfo = typeRefToTypeInfo(ContactTypeRef)

function makeEntries(key: Aes256Key, iv: Uint8Array, n: number, baseTimestamp: number = 0): Array<EncSearchIndexEntryWithTimestamp> {
	const newEntries: EncSearchIndexEntryWithTimestamp[] = []

	for (let i = 0; i < n; i++) {
		const timestamp = baseTimestamp + i
		const instanceIdB64 = timestampToGeneratedId(timestamp)
		const encId = encryptIndexKeyUint8Array(key, instanceIdB64, iv)
		newEntries.push({
			entry: concat(encId, new Uint8Array(0)),
			timestamp,
		})
	}

	return newEntries
}

function compareBinaryBlocks(actual: Uint8Array, expected: Uint8Array) {
	o.check(Array.from(expected)).deepEquals(Array.from(actual))
}

o.spec("IndexerCore", () => {
	let key: Aes256Key
	let iv: Uint8Array
	let encryptionData: DbEncryptionData

	o.beforeEach(function () {
		key = aes256RandomKey()
		iv = FIXED_IV
		encryptionData = { key, iv }
	})

	o.test("createIndexEntriesForAttributes", async function () {
		const ContactModel = await ClientModelInfo.getNewInstanceForTestsOnly().resolveClientTypeReference(ContactTypeRef)

		let core = makeCore({ encryptionData })
		let contact = createTestEntity(ContactTypeRef)
		contact._id = ["", "L-dNNLe----0"]
		contact.firstName = "Max Tim"
		contact.lastName = "Meier" // not indexed

		contact.company = undefined as any // indexed but not defined

		contact.comment = "Friend of Tim"
		let entries = core.createIndexEntriesForAttributes(contact, [
			{
				id: AttributeModel.getModelValue(ContactModel, "firstName").id,
				value: () => contact.firstName,
			},
			{
				id: AttributeModel.getModelValue(ContactModel, "company").id,
				value: () => contact.company,
			},
			{
				id: AttributeModel.getModelValue(ContactModel, "comment").id,
				value: () => contact.comment,
			},
		])
		o.check(entries.size).equals(4)
		o.check(entries.get("max")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: AttributeModel.getModelValue(ContactModel, "firstName").id,
				positions: [0],
			},
		])
		o.check(entries.get("tim")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: AttributeModel.getModelValue(ContactModel, "firstName").id,
				positions: [1],
			},
			{
				id: "L-dNNLe----0",
				attribute: AttributeModel.getModelValue(ContactModel, "comment").id,
				positions: [2],
			},
		])
		o.check(entries.get("friend")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: AttributeModel.getModelValue(ContactModel, "comment").id,
				positions: [0],
			},
		])
		o.check(entries.get("of")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: AttributeModel.getModelValue(ContactModel, "comment").id,
				positions: [1],
			},
		])
	})
	o.test("encryptSearchIndexEntries", async function () {
		const core = makeCore({ encryptionData })
		const instanceId: IdTuple = ["L-dNNLe----0", "L-dNNLe----1"]
		const ownerGroupId = "ownerGroupId"
		const keyToIndexEntries: Map<string, SearchIndexEntry[]> = new Map([
			[
				"a",
				[
					{
						id: "L-dNNLe----1",
						attribute: 5,
						positions: [0],
					},
				],
			],
			[
				"b",
				[
					{
						id: "L-dNNLe----1",
						attribute: 4,
						positions: [8, 27],
					},
				],
			],
		])

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		await core.encryptSearchIndexEntries(instanceId, ownerGroupId, keyToIndexEntries, indexUpdate)
		o.check(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		const encIdB64 = encryptIndexKeyBase64(key, elementIdPart(instanceId), iv)
		let elementData: ElementDataSurrogate = neverNull(indexUpdate.create.encInstanceIdToElementData.get(encIdB64))
		const { listId, encWordsB64, ownerGroup } = elementData
		o.check(listId).equals(listIdPart(instanceId))
		const wordB = decryptIndexKey(key, base64ToUint8Array(encWordsB64[1]), iv)
		o.check(wordB).equals("b")
		o.check(ownerGroupId).equals(ownerGroup)
		o.check(indexUpdate.create.indexMap.size).equals(2)
		const aKey = encryptIndexKeyBase64(key, "a", iv)
		let encEntriesA: EncSearchIndexEntryWithTimestamp[] = neverNull(indexUpdate.create.indexMap.get(aKey))
		o.check(encEntriesA.length).equals(1)
		let entry: any = decryptSearchIndexEntry(key, encEntriesA[0].entry, iv)
		delete entry.encId
		o.check(entry).deepEquals({
			id: elementIdPart(instanceId),
			attribute: 5,
			positions: [0],
		})
		const bKey = encryptIndexKeyBase64(key, "b", iv)
		const encEntriesB: EncSearchIndexEntryWithTimestamp[] = neverNull(indexUpdate.create.indexMap.get(bKey))
		o.check(encEntriesB.length).equals(1)
		let entry2: any = decryptSearchIndexEntry(key, encEntriesB[0].entry, iv)
		delete entry2.encId
		o.check(entry2).deepEquals({
			id: elementIdPart(instanceId),
			attribute: 4,
			positions: [8, 27],
		})
		// add another entry
		let id2: IdTuple = ["L-dNNLe----1", "L-dNNLe----2"]
		let keyToIndexEntries2: Map<string, SearchIndexEntry[]> = new Map([
			[
				"a",
				[
					{
						id: elementIdPart(id2),
						attribute: 2,
						positions: [7, 62],
					},
				],
			],
		])
		await core.encryptSearchIndexEntries(id2, ownerGroupId, keyToIndexEntries2, indexUpdate)
		o.check(indexUpdate.create.encInstanceIdToElementData.size).equals(2)
		const yKey = encryptIndexKeyBase64(key, elementIdPart(id2), iv)
		let elementData2: ElementDataSurrogate = neverNull(indexUpdate.create.encInstanceIdToElementData.get(yKey))
		let listId2 = elementData2.listId
		o.check(listId2).equals(id2[0])
		let words2 = decryptIndexKey(key, base64ToUint8Array(elementData2.encWordsB64[0]), iv)
		o.check(words2).equals("a")
		o.check(ownerGroupId).equals(elementData2.ownerGroup)
		encEntriesA = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(key, "a", iv)))
		o.check(encEntriesA.length).equals(2)
		entry = downcast(decryptSearchIndexEntry(key, encEntriesA[0].entry, iv))
		delete entry.encId
		o.check(entry).deepEquals({
			id: elementIdPart(instanceId),
			attribute: 5,
			positions: [0],
		})
		const newEntry: any = decryptSearchIndexEntry(key, encEntriesA[1].entry, iv)
		delete newEntry.encId
		o.check(newEntry).deepEquals({
			id: elementIdPart(id2),
			attribute: 2,
			positions: [7, 62],
		})
	})
	o.test("writeIndexUpdate _moveIndexedInstance", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		let encInstanceId = uint8ArrayToBase64(new Uint8Array([8]))
		indexUpdate.move.push({
			encInstanceId,
			newListId: "new-list",
		})
		let words = new Uint8Array(0)
		let transaction: any = {
			get: (os, key) => {
				o.check(os).equals(ElementDataOS)
				o.check(key).deepEquals(encInstanceId)
				return Promise.resolve(["old-list", words, groupId] as ElementDataDbRow)
			},
			put: (os, key, value) => {
				o.check(os).equals(ElementDataOS)
				o.check(key).deepEquals(encInstanceId)
				o.check(value).deepEquals(["new-list", words, groupId])
			},
		}
		const core = makeCore()
		await core._moveIndexedInstance(indexUpdate, transaction)
	})
	o.test("writeIndexUpdate _moveIndexedInstance instance already deleted", async function () {
		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		let encInstanceId = uint8ArrayToBase64(new Uint8Array([8]))
		indexUpdate.move.push({
			encInstanceId,
			newListId: "new-list",
		})
		let words = new Uint8Array(0)
		let transaction: any = {
			get: (os, key) => {
				o.check(os).equals(ElementDataOS)
				o.check(key).deepEquals(encInstanceId)
				return Promise.resolve(null)
			},
			put: (os, key, value) => {
				throw new Error("instance does not exist, should not be moved!")
			},
		}
		const core = makeCore()
		await neverNull(core._moveIndexedInstance(indexUpdate, transaction))
	})
	o.test("writeIndexUpdate _deleteIndexedInstance", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const instanceId = new Uint8Array(16).fill(1)
		const metaId = 3
		let entry: EncryptedSearchIndexEntry = concat(instanceId, new Uint8Array([4, 7, 6]))
		let other1: EncryptedSearchIndexEntry = concat(new Uint8Array(16).fill(2), new Uint8Array([1, 12]))
		let other2: EncryptedSearchIndexEntry = concat(instanceId, new Uint8Array([1, 12]))
		let encWord = uint8ArrayToBase64(new Uint8Array([7, 8, 23]))
		let encInstanceIdB64 = uint8ArrayToBase64(instanceId)
		indexUpdate.delete.searchMetaRowToEncInstanceIds.set(metaId, [
			{
				encInstanceId: instanceId,
				timestamp: 5,
				appId: 1,
				typeId: 1,
			},
		])
		indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)
		const metaData: SearchIndexMetaDataRow = Object.freeze({
			id: metaId,
			word: encWord,
			rows: [
				{
					app: 1,
					type: 1,
					key: 1,
					size: 2,
					oldestElementTimestamp: 1,
				},
				{
					app: 1,
					type: 1,
					key: 2,
					size: 1,
					oldestElementTimestamp: 10,
				},
			],
		})
		const core = makeCore({ encryptionData })
		const encodedMetaData = encryptMetaData(key, metaData)
		let transaction: any = {
			get: (os, key) => {
				switch (os) {
					case SearchIndexMetaDataOS:
						return Promise.resolve(
							key === metaId
								? Object.assign({}, encodedMetaData) // copy it
								: null,
						)

					case SearchIndexOS:
						return Promise.resolve(key === 1 ? appendBinaryBlocks([entry, other1]) : appendBinaryBlocks([other2]))
				}
			},
			put: spy((os, key, value) => Promise.resolve()),
			delete: spy((os, key) => Promise.resolve()),
		}
		await core._deleteIndexedInstance(indexUpdate, transaction, encryptionData)
		const expectedMeta = Object.assign({}, metaData, {
			rows: [
				{
					app: 1,
					type: 1,
					key: 1,
					size: 1,
					oldestElementTimestamp: 1,
				},
				{
					app: 1,
					type: 1,
					key: 2,
					size: 1,
					oldestElementTimestamp: 10,
				},
			],
		})
		// Reminder: you cannot match on encrypted data, IV is random!
		const metaPutInvocation = transaction.put.invocations[1]
		o.check(JSON.stringify([metaPutInvocation[0], metaPutInvocation[1], decryptMetaData(key, metaPutInvocation[2])])).equals(
			JSON.stringify([SearchIndexMetaDataOS, null, expectedMeta]),
		)
		o.check(transaction.delete.invocations[0]).deepEquals([ElementDataOS, encInstanceIdB64])
	})
	o.test("writeIndexUpdate _deleteIndexedInstance last entry for word", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const instanceId = new Uint8Array(16).fill(8)
		const metaId = 3
		const searchIndexEntryId = 1
		const metaData: SearchIndexMetaDataRow = {
			id: metaId,
			word: "asasdla",
			rows: [
				{
					app: 1,
					type: 1,
					key: searchIndexEntryId,
					size: 2,
					oldestElementTimestamp: 1,
				},
			],
		}
		let entry: EncryptedSearchIndexEntry = concat(instanceId, new Uint8Array([4, 7, 6]))
		let encInstanceIdB64 = uint8ArrayToBase64(instanceId)
		indexUpdate.delete.searchMetaRowToEncInstanceIds.set(metaId, [
			{
				encInstanceId: instanceId,
				timestamp: 5,
				appId: 1,
				typeId: 1,
			},
		])
		indexUpdate.delete.encInstanceIds.push(encInstanceIdB64)
		const core = makeCore()
		let transaction: any = {
			get: (os: ObjectStoreName, rowKey: DbKey) => {
				switch (os) {
					case SearchIndexMetaDataOS:
						return Promise.resolve(rowKey === metaId ? encryptMetaData(key, metaData) : null)

					case SearchIndexOS:
						return Promise.resolve(rowKey === searchIndexEntryId ? appendBinaryBlocks([entry, entry]) : null)
				}
			},
			put: spy((os, key, value) => Promise.resolve()),
			delete: spy((os, key) => Promise.resolve()),
		}
		await core._deleteIndexedInstance(indexUpdate, transaction, encryptionData)
		o.check(transaction.put.invocations).deepEquals([])
		o.check(transaction.delete.invocations).deepEquals([
			[ElementDataOS, encInstanceIdB64],
			[SearchIndexOS, 1],
			[SearchIndexMetaDataOS, metaId],
		])
	})
	o.test("writeIndexUpdate _deleteIndexedInstance instance already deleted", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		let entry: EncryptedSearchIndexEntry = concat(new Uint8Array(16), new Uint8Array([4, 7, 6]))
		indexUpdate.delete.searchMetaRowToEncInstanceIds.set(1, [
			{
				encInstanceId: getIdFromEncSearchIndexEntry(entry),
				timestamp: 1,
				appId: mailTypeInfo.appId,
				typeId: mailTypeInfo.typeId,
			},
		])
		indexUpdate.delete.encInstanceIds.push(uint8ArrayToBase64(getIdFromEncSearchIndexEntry(entry)))
		let transaction: any = {
			get: (os, key) => Promise.resolve(null),
			put: (os, key, value) => {
				throw new Error("instance does not exist, should not be moved!")
			},
			delete: spy(() => Promise.resolve()),
		}
		const core = makeCore({ encryptionData })
		await core._deleteIndexedInstance(indexUpdate, transaction, encryptionData)
		o.check(transaction.delete.invocations).deepEquals([[ElementDataOS, uint8ArrayToBase64(getIdFromEncSearchIndexEntry(entry))]])
	})
	o.test("writeIndexUpdate _insertNewElementData", async function () {
		const groupId = "my-group"
		const listId = "list-id"
		const core = makeCore({ encryptionData })

		const indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const encInstanceId = uint8ArrayToBase64(new Uint8Array(16))
		const encWord = uint8ArrayToBase64(new Uint8Array([1, 2, 3]))
		const searchIndexRowKey = 3
		const elementDataSurrogate: ElementDataSurrogate = {
			listId,
			encWordsB64: [encWord],
			ownerGroup: groupId,
		}
		indexUpdate.create.encInstanceIdToElementData.set(encInstanceId, elementDataSurrogate)
		const transaction: any = {
			get: spy(() => Promise.resolve()),
			put: spy(() => Promise.resolve()),
		}
		await core._insertNewElementData(
			indexUpdate,
			transaction,
			{
				[encWord]: searchIndexRowKey,
			},
			encryptionData,
		)

		const [[os, rowKey, value]] = transaction.put.invocations
		o.check(os).equals(ElementDataOS)
		o.check(rowKey).equals(encInstanceId)
		const [listIdValue, encRowsValue, ownerGroupValue] = value
		o.check(listIdValue).equals(listId)
		o.check(Array.from(unauthenticatedAesDecrypt(key, encRowsValue))).deepEquals(Array.from(new Uint8Array([searchIndexRowKey])))
		o.check(ownerGroupValue).equals(groupId)
	})
	o.spec("writeIndexUpdate _insertNewIndexEntries ", function () {
		const encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let indexUpdate: IndexUpdate
		let dbStub: DbStub
		let transaction: DbStubTransaction
		let core: IndexerCore
		o.beforeEach(async function () {
			indexUpdate = _createNewIndexUpdate(mailTypeInfo)
			dbStub = createSearchIndexDbStub()
			transaction = await dbStub.createTransaction()
			core = makeCore({ encryptionData })
		})
		o.test("new word", async function () {
			let encInstanceId = new Uint8Array(16)
			let entry: EncryptedSearchIndexEntry = concat(encInstanceId, new Uint8Array(0))
			indexUpdate.create.indexMap.set(encWord, [
				{
					timestamp: 1,
					entry,
				},
			])
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			o.check(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(Array.from(appendBinaryBlocks([entry])))
			const decodedInsertedMeta = decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, 1))
			o.check(decodedInsertedMeta).deepEquals({
				id: 1,
				word: encWord,
				rows: [
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 1,
						size: 1,
						oldestElementTimestamp: 1,
					},
				],
			})
		})
		o.test("existing word, growing the first row", async function () {
			let encInstanceId = new Uint8Array(16)
			let newEntry: EncryptedSearchIndexEntry = concat(encInstanceId, new Uint8Array(0))
			const { appId, typeId } = indexUpdate.typeInfo
			const metaId = 3
			const existingBlock = appendBinaryBlocks([new Uint8Array([2, 0])])
			const searchIndexKey = 1
			indexUpdate.create.indexMap.set(encWord, [
				{
					entry: newEntry,
					timestamp: 1,
				},
			])
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: metaId,
				word: encWord,
				rows: [
					{
						app: appId,
						type: typeId,
						key: searchIndexKey,
						size: 1,
						oldestElementTimestamp: 2,
					},
				],
			}
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			transaction.put(SearchIndexOS, searchIndexKey, existingBlock)
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			o.check(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, searchIndexKey))).deepEquals(
				Array.from(appendBinaryBlocks([newEntry], existingBlock)),
			)
			const expectedMeta = Object.assign({}, searchIndexMeta, {
				rows: [
					{
						app: appId,
						type: typeId,
						key: 1,
						size: 2,
						oldestElementTimestamp: 1,
					},
				],
			})
			o.check(decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, metaId))).deepEquals(expectedMeta)
		})
		o.test("add older entities to a new row", async function () {
			// 50 entries go to the existing row, everything else goes to the new row
			const newEntries: Array<EncSearchIndexEntryWithTimestamp> = makeEntries(key, iv, 200)
			indexUpdate.create.indexMap.set(encWord, newEntries)
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: 1,
				word: encWord,
				rows: [
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 1,
						size: 800,
						oldestElementTimestamp: 150,
					}, // new entry dos not fit into row so create new row
					{
						app: contactTypeInfo.appId,
						type: contactTypeInfo.typeId,
						key: 2,
						size: 800,
						oldestElementTimestamp: 200,
					}, // different app id, new entries should not be added to this row
				],
			}
			const existingRow = appendBinaryBlocks(makeEntries(key, iv, 800, 150).map((e) => e.entry))
			await transaction.put(SearchIndexOS, 1, existingRow)
			await transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			const newKey = 3
			dbStub.getObjectStore(SearchIndexOS).lastId = 2
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			const searchIndexContent = dbStub.getObjectStore(SearchIndexOS).content[newKey]
			o.check(Array.from(searchIndexContent)).deepEquals(Array.from(appendBinaryBlocks(newEntries.slice(0, 150).map((e) => e.entry))))
			o.check(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(
				Array.from(
					appendBinaryBlocks(
						newEntries.slice(150).map((e) => e.entry),
						existingRow,
					),
				),
			)
			const searchIndexMetaContent = dbStub.getObjectStore(SearchIndexMetaDataOS).content[searchIndexMeta.id]
			const decryptedMeta = decryptMetaData(key, searchIndexMetaContent)
			searchIndexMeta.rows[0].size = 850
			searchIndexMeta.rows.unshift({
				app: mailTypeInfo.appId,
				type: mailTypeInfo.typeId,
				key: newKey,
				size: 150,
				oldestElementTimestamp: 0,
			})
			o.check(decryptedMeta).deepEquals(searchIndexMeta)
		})
		o.test("add newer entities to the end", async function () {
			const newEntries = makeEntries(key, iv, 200, 201)
			indexUpdate.create.indexMap.set(encWord, newEntries)
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: 1,
				word: encWord,
				rows: [
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 1,
						size: 600,
						oldestElementTimestamp: 100,
					},
					{
						app: contactTypeInfo.appId,
						type: contactTypeInfo.typeId,
						key: 2,
						size: 800,
						oldestElementTimestamp: 200,
					}, // different app id, new entries should not be added to this row
				],
			}
			const existingRow = appendBinaryBlocks(makeEntries(key, iv, 600, 100).map((e) => e.entry))
			transaction.put(SearchIndexOS, 1, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			o.check(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(
				Array.from(
					appendBinaryBlocks(
						newEntries.map((e) => e.entry),
						existingRow,
					),
				),
			)
			searchIndexMeta.rows[0].size = 800
			o.check(decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, 1))).deepEquals(searchIndexMeta)
		})
		o.test("add newer entities to the existing row in the beginning", async function () {
			const newEntries = makeEntries(key, iv, 200, 201)
			indexUpdate.create.indexMap.set(encWord, newEntries)
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: 1,
				word: encWord,
				rows: [
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 1,
						size: 600,
						oldestElementTimestamp: 300,
					},
					{
						app: contactTypeInfo.appId,
						type: contactTypeInfo.typeId,
						key: 2,
						size: 800,
						oldestElementTimestamp: 200,
					}, // different app id, new entries should not be added to this row
				],
			}
			const existingRow = appendBinaryBlocks(makeEntries(key, iv, 600, 100).map((e) => e.entry))
			transaction.put(SearchIndexOS, 1, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			o.check(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(
				Array.from(
					appendBinaryBlocks(
						newEntries.map((e) => e.entry),
						existingRow,
					),
				),
			)
			searchIndexMeta.rows[0].size = 800
			searchIndexMeta.rows[0].oldestElementTimestamp = 201
			o.check(decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, 1))).deepEquals(searchIndexMeta)
		})
		o.test("split row", async function () {
			// Split the row.
			const newEntries = makeEntries(key, iv, 250, 2001)
			indexUpdate.create.indexMap.set(encWord, newEntries)
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: 1,
				word: encWord,
				rows: [
					{
						app: contactTypeInfo.appId,
						type: contactTypeInfo.typeId,
						key: 2,
						size: 800,
						oldestElementTimestamp: 200,
					},
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 1,
						size: 600,
						oldestElementTimestamp: 1000,
					},
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 3,
						size: 800,
						oldestElementTimestamp: 2000,
					}, // Split this row
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 4,
						size: 600,
						oldestElementTimestamp: 3000,
					},
				],
			}
			const existingEntries = makeEntries(key, iv, 800, 2000)
			const existingRow = appendBinaryBlocks(existingEntries.map((e) => e.entry).reverse())
			transaction.put(SearchIndexOS, 3, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			dbStub.getObjectStore(SearchIndexOS).lastId = 4
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			const allEntries = existingEntries.concat(newEntries).sort((l, r) => l.timestamp - r.timestamp)
			const firstRowEntries = allEntries.slice(0, -999)
			const secondRowEntries = allEntries.slice(-999)
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 3), appendBinaryBlocks(firstRowEntries.map((e) => e.entry)))
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 5), appendBinaryBlocks(secondRowEntries.map((e) => e.entry)))
			searchIndexMeta.rows = [
				{
					app: contactTypeInfo.appId,
					type: contactTypeInfo.typeId,
					key: 2,
					size: 800,
					oldestElementTimestamp: 200,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 1,
					size: 600,
					oldestElementTimestamp: 1000,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 3,
					size: firstRowEntries.length,
					oldestElementTimestamp: 2000,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 5,
					size: secondRowEntries.length,
					oldestElementTimestamp: secondRowEntries[0].timestamp,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 4,
					size: 600,
					oldestElementTimestamp: 3000,
				},
			]
			o.check(decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, searchIndexMeta.id))).deepEquals(searchIndexMeta)
		})
		o.test("split last row", async function () {
			// Split the row.
			const newEntries = makeEntries(key, iv, 250, 2001)
			indexUpdate.create.indexMap.set(encWord, newEntries)
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: 1,
				word: encWord,
				rows: [
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 1,
						size: 600,
						oldestElementTimestamp: 1000,
					},
					{
						app: mailTypeInfo.appId,
						type: mailTypeInfo.typeId,
						key: 3,
						size: 800,
						oldestElementTimestamp: 2000,
					}, // Split this row
					{
						app: contactTypeInfo.appId,
						type: contactTypeInfo.typeId,
						key: 2,
						size: 800,
						oldestElementTimestamp: 3000,
					},
				],
			}
			const existingEntries = makeEntries(key, iv, 800, 2000)
			const existingRow = appendBinaryBlocks(existingEntries.map((e) => e.entry).reverse())
			transaction.put(SearchIndexOS, 3, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			dbStub.getObjectStore(SearchIndexOS).lastId = 4
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			const allEntries = existingEntries.concat(newEntries).sort((l, r) => l.timestamp - r.timestamp)
			const firstRowEntries = allEntries.slice(0, 1000)
			const secondRowEntries = allEntries.slice(1000)
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 3), appendBinaryBlocks(firstRowEntries.map((e) => e.entry)))
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 5), appendBinaryBlocks(secondRowEntries.map((e) => e.entry)))
			searchIndexMeta.rows = [
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 1,
					size: 600,
					oldestElementTimestamp: 1000,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 3,
					size: firstRowEntries.length,
					oldestElementTimestamp: 2000,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 5,
					size: secondRowEntries.length,
					oldestElementTimestamp: secondRowEntries[0].timestamp,
				},
				{
					app: contactTypeInfo.appId,
					type: contactTypeInfo.typeId,
					key: 2,
					size: 800,
					oldestElementTimestamp: 3000,
				},
			]
			o.check(decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, searchIndexMeta.id))).deepEquals(searchIndexMeta)
		})
		o.test("split for big new row", async function () {
			const newEntries = makeEntries(key, iv, 2500, 2001)
			indexUpdate.create.indexMap.set(encWord, newEntries)
			const searchIndexMeta: SearchIndexMetaDataRow = {
				id: 1,
				word: encWord,
				rows: [
					{
						app: contactTypeInfo.appId,
						type: contactTypeInfo.typeId,
						key: 2,
						size: 800,
						oldestElementTimestamp: 500,
					},
				],
			}
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(key, searchIndexMeta))
			dbStub.getObjectStore(SearchIndexOS).lastId = 2
			await core._insertNewIndexEntries(indexUpdate, transaction, encryptionData)
			// Because there's nothing on the right side, we put entries from the end and the first row will not be full.
			const firstRow = newEntries.slice(0, 500)
			const secondRow = newEntries.slice(500, 1500)
			const thirdRow = newEntries.slice(1500, 2500)
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 3), appendBinaryBlocks(firstRow.map((e) => e.entry)))
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 4), appendBinaryBlocks(secondRow.map((e) => e.entry)))
			compareBinaryBlocks(transaction.getSync(SearchIndexOS, 5), appendBinaryBlocks(thirdRow.map((e) => e.entry)))
			searchIndexMeta.rows = [
				{
					app: contactTypeInfo.appId,
					type: contactTypeInfo.typeId,
					key: 2,
					size: 800,
					oldestElementTimestamp: 500,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 3,
					size: firstRow.length,
					oldestElementTimestamp: firstRow[0].timestamp,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 4,
					size: secondRow.length,
					oldestElementTimestamp: secondRow[0].timestamp,
				},
				{
					app: mailTypeInfo.appId,
					type: mailTypeInfo.typeId,
					key: 5,
					size: thirdRow.length,
					oldestElementTimestamp: thirdRow[0].timestamp,
				},
			]
			o.check(decryptMetaData(key, transaction.getSync(SearchIndexMetaDataOS, searchIndexMeta.id))).deepEquals(searchIndexMeta)
		})
	})
	o.test("writeIndexUpdate _updateGroupDataBatchId abort in case batch has been indexed already", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const batchId = "last-batch-id"
		const deferred = defer<void>()
		let transaction: any = {
			get: (os, key) => {
				o.check(os).equals(GroupDataOS)
				o.check(key).equals(groupId)
				let groupData: GroupData = {
					lastBatchIds: ["1", "last-batch-id", "3"],
				} as any
				return Promise.resolve(groupData)
			},
			aborted: true,
			abort: () => {
				deferred.resolve()
			},
		}
		const core = makeCore()

		core._updateGroupDataBatchId(groupId, batchId, transaction)
		await deferred.promise
	})
	o.test("writeIndexUpdate _updateGroupDataBatchId", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const deferred = defer<void>()
		const batchId = "2"
		let transaction: any = {
			get: (os, key) => {
				o.check(os).equals(GroupDataOS)
				o.check(key).equals(groupId)
				let groupData: GroupData = {
					lastBatchIds: ["4", "3", "1"],
				} as any
				return Promise.resolve(groupData)
			},
			aborted: false,
			put: (os, key, value) => {
				o.check(os).equals(GroupDataOS)
				o.check(key).equals(groupId)
				o.check(JSON.stringify(value)).equals(
					JSON.stringify({
						lastBatchIds: ["4", "3", "2", "1"],
					}),
				)
				deferred.resolve()
			},
		}
		const core = makeCore()

		core._updateGroupDataBatchId(groupId, batchId, transaction)
		await deferred.promise
	})
	o.test("writeIndexUpdate", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const indexTimestamp = Date.now()
		let waitForTransaction = false
		let transaction: any = {
			wait: () => {
				waitForTransaction = true
				return Promise.resolve()
			},
		}
		const encWordToMetaRow: EncWordToMetaRow = {}
		const core = makeCore(
			{
				transaction,
				encryptionData,
			},
			(mocked) => {
				mocked._moveIndexedInstance = spy(() => PromisableWrapper.from(undefined))
				mocked._deleteIndexedInstance = spy()
				mocked._insertNewElementData = spy(() => Promise.resolve())
				mocked._insertNewIndexEntries = spy(() => Promise.resolve(encWordToMetaRow))
				mocked._updateGroupDataIndexTimestamp = spy()
			},
		)
		const groupUpdate = [
			{
				groupId,
				indexTimestamp,
			},
		]
		await core.writeIndexUpdateWithIndexTimestamps(groupUpdate, indexUpdate)
		o.check(core._moveIndexedInstance.callCount).equals(1)
		o.check(core._moveIndexedInstance.args).deepEquals([indexUpdate, transaction])
		o.check(core._deleteIndexedInstance.callCount).equals(1)
		o.check(core._deleteIndexedInstance.args).deepEquals([indexUpdate, transaction, encryptionData])
		o.check(core._insertNewElementData.callCount).equals(1)
		o.check(core._insertNewElementData.args).deepEquals([indexUpdate, transaction, encWordToMetaRow, encryptionData])
		o.check(core._insertNewIndexEntries.callCount).equals(1)
		o.check(core._insertNewIndexEntries.args).deepEquals([indexUpdate, transaction, encryptionData])
		o.check(core._updateGroupDataIndexTimestamp.callCount).equals(1)
		o.check(core._updateGroupDataIndexTimestamp.args).deepEquals([groupUpdate, transaction])
		o.check(waitForTransaction).equals(true)
	})
	o.test("processDeleted", async function () {
		const groupId = "my-group"

		const indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const instanceId = "L-dNNLe----1"
		const instanceIdTimestamp = generatedIdToTimestamp(instanceId)
		const metaRowId = 3
		const anotherMetaRowId = 4
		const transaction: any = {
			get: (os, key) => {
				o.check(os).equals(ElementDataOS)
				o.check(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			},
		}
		const core = makeCore({
			transaction,
			encryptionData,
		})
		const encInstanceId = encryptIndexKeyBase64(key, instanceId, iv)
		const listId = "list-id"
		const elementData: ElementDataDbRow = [listId, aesEncrypt(key, new Uint8Array([metaRowId, anotherMetaRowId])), groupId]
		const otherId = new Uint8Array(16).fill(88)
		indexUpdate.delete.searchMetaRowToEncInstanceIds.set(metaRowId, [
			{
				encInstanceId: otherId,
				appId: indexUpdate.typeInfo.appId,
				typeId: indexUpdate.typeInfo.typeId,
				timestamp: 1,
			},
		])
		await core._processDeleted(MailTypeRef, instanceId, indexUpdate)
		o.check(indexUpdate.delete.encInstanceIds).deepEquals([encInstanceId])
		o.check(indexUpdate.delete.searchMetaRowToEncInstanceIds.size).equals(2)
		o.check(JSON.stringify(indexUpdate.delete.searchMetaRowToEncInstanceIds.get(metaRowId))).equals(
			JSON.stringify([
				{
					encInstanceId: otherId,
					appId: indexUpdate.typeInfo.appId,
					typeId: indexUpdate.typeInfo.typeId,
					timestamp: 1,
				},
				{
					encInstanceId: base64ToUint8Array(encInstanceId),
					appId: indexUpdate.typeInfo.appId,
					typeId: indexUpdate.typeInfo.typeId,
					timestamp: instanceIdTimestamp,
				},
			]),
		)
		let ids2 = neverNull(indexUpdate.delete.searchMetaRowToEncInstanceIds.get(anotherMetaRowId))
		o.check(ids2.length).equals(1)
		o.check(Array.from(ids2[0].encInstanceId)).deepEquals(Array.from(base64ToUint8Array(encInstanceId)))
		o.check(indexUpdate.delete.encInstanceIds.length).equals(1)
		o.check(Array.from(indexUpdate.delete.encInstanceIds[0])).deepEquals(Array.from(encInstanceId))
	})
	o.test("processDeleted already deleted", async function () {
		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		let instanceId = "123"
		let transaction: any = {
			get: (os, key) => {
				o.check(os).equals(ElementDataOS)
				o.check(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve()
			},
		}
		const core = makeCore({
			encryptionData,
			transaction,
		})
		let encInstanceId = encryptIndexKeyBase64(key, instanceId, iv)
		await core._processDeleted(MailTypeRef, instanceId, indexUpdate)
		o.check(indexUpdate.delete.searchMetaRowToEncInstanceIds.size).equals(0)
		o.check(indexUpdate.delete.encInstanceIds.length).equals(0)
	})

	o.test("stopProcessing", async function () {
		const deferred = defer()
		const transaction = {
			abort: noOp,
		}
		const core = makeCore({
			encryptionData: {
				key: aes256RandomKey(),
				iv: FIXED_IV,
			},
			transaction: {
				createTransaction: () => deferred.promise,
			} as any,
		})

		const result = core._writeIndexUpdate(
			{
				move: [],
				delete: {
					searchMetaRowToEncInstanceIds: new Map(),
					encInstanceIds: [],
				},
				create: {
					encInstanceIdToElementData: new Map(),
					indexMap: new Map(),
				},
			} as any,
			null as any,
		)

		core.stopProcessing()
		try {
			deferred.resolve(transaction)
			await result
			o.check(false).equals(true)("Should throw an error")
		} catch (e) {
			o.check(e instanceof CancelledError).equals(true)("Should throw cancelledError")
		}
	})
	o.test("startProcessing", async function () {
		const transaction: DbTransaction = downcast({
			get: () =>
				Promise.resolve(() => ({
					indexTimestamp: Date.now(),
				})),
			put: () => Promise.resolve(null),
			wait: () => Promise.resolve(),
		})
		const core = makeCore({
			transaction,
		})
		core.stopProcessing()
		core.startProcessing()
		// Should not throw
		await core.writeIndexUpdateWithIndexTimestamps(
			[
				{
					groupId: "group-id",
					indexTimestamp: 0,
				},
			],
			_createNewIndexUpdate(mailTypeInfo),
		)
	})
})
