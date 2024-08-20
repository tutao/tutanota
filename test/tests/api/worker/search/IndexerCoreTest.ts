import o from "@tutao/otest"
import type {
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
import {
	_createNewIndexUpdate,
	decryptIndexKey,
	decryptMetaData,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
	getIdFromEncSearchIndexEntry,
	typeRefToTypeInfo,
} from "../../../../../src/common/api/worker/search/IndexUtils.js"
import { base64ToUint8Array, concat, defer, downcast, neverNull, noOp, PromisableWrapper, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { spy } from "@tutao/tutanota-test-utils"
import { ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { DbTransaction } from "../../../../../src/common/api/worker/search/DbFacade.js"
import { appendBinaryBlocks } from "../../../../../src/common/api/worker/search/SearchIndexEncoding.js"
import { EntityUpdateTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { EventQueue } from "../../../../../src/common/api/worker/EventQueue.js"
import { CancelledError } from "../../../../../src/common/api/common/error/CancelledError.js"
import { createSearchIndexDbStub, DbStub, DbStubTransaction } from "./DbStub.js"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore.js"
import { elementIdPart, generatedIdToTimestamp, listIdPart, timestampToGeneratedId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { createTestEntity, makeCore } from "../../../TestUtils.js"
import { Aes256Key, aes256RandomKey, aesEncrypt, fixedIv, IV_BYTE_LENGTH, random, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { ElementDataOS, GroupDataOS, SearchIndexMetaDataOS, SearchIndexOS } from "../../../../../src/common/api/worker/search/IndexTables.js"

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
	o(Array.from(expected)).deepEquals(Array.from(actual))
}

o.spec("IndexerCore test", () => {
	o("createIndexEntriesForAttributes", async function () {
		let core = makeCore()
		let contact = createTestEntity(ContactTypeRef)
		contact._id = ["", "L-dNNLe----0"]
		contact.firstName = "Max Tim"
		contact.lastName = "Meier" // not indexed

		contact.company = undefined as any // indexed but not defined

		contact.comment = "Friend of Tim"
		const ContactModel = await resolveTypeReference(ContactTypeRef)
		let entries = core.createIndexEntriesForAttributes(contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName,
			},
			{
				attribute: ContactModel.values["company"],
				value: () => contact.company,
			},
			{
				attribute: ContactModel.values["comment"],
				value: () => contact.comment,
			},
		])
		o(entries.size).equals(4)
		o(entries.get("max")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: ContactModel.values["firstName"].id,
				positions: [0],
			},
		])
		o(entries.get("tim")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: ContactModel.values["firstName"].id,
				positions: [1],
			},
			{
				id: "L-dNNLe----0",
				attribute: ContactModel.values["comment"].id,
				positions: [2],
			},
		])
		o(entries.get("friend")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: ContactModel.values["comment"].id,
				positions: [0],
			},
		])
		o(entries.get("of")!).deepEquals([
			{
				id: "L-dNNLe----0",
				attribute: ContactModel.values["comment"].id,
				positions: [1],
			},
		])
	})
	o("encryptSearchIndexEntries", function () {
		const core = makeCore({
			db: {
				key: aes256RandomKey(),
				iv: fixedIv,
			} as any,
		})
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

		core.encryptSearchIndexEntries(instanceId, ownerGroupId, keyToIndexEntries, indexUpdate)
		o(indexUpdate.create.encInstanceIdToElementData.size).equals(1)
		const encIdB64 = encryptIndexKeyBase64(core.db.key, elementIdPart(instanceId), core.db.iv)
		let elementData: ElementDataSurrogate = neverNull(indexUpdate.create.encInstanceIdToElementData.get(encIdB64))
		const { listId, encWordsB64, ownerGroup } = elementData
		o(listId).equals(listIdPart(instanceId))
		const wordB = decryptIndexKey(core.db.key, base64ToUint8Array(encWordsB64[1]), core.db.iv)
		o(wordB).equals("b")
		o(ownerGroupId).equals(ownerGroup)
		o(indexUpdate.create.indexMap.size).equals(2)
		const aKey = encryptIndexKeyBase64(core.db.key, "a", core.db.iv)
		let encEntriesA: EncSearchIndexEntryWithTimestamp[] = neverNull(indexUpdate.create.indexMap.get(aKey))
		o(encEntriesA.length).equals(1)
		let entry: any = decryptSearchIndexEntry(core.db.key, encEntriesA[0].entry, core.db.iv)
		delete entry.encId
		o(entry).deepEquals({
			id: elementIdPart(instanceId),
			attribute: 5,
			positions: [0],
		})
		const bKey = encryptIndexKeyBase64(core.db.key, "b", core.db.iv)
		const encEntriesB: EncSearchIndexEntryWithTimestamp[] = neverNull(indexUpdate.create.indexMap.get(bKey))
		o(encEntriesB.length).equals(1)
		let entry2: any = decryptSearchIndexEntry(core.db.key, encEntriesB[0].entry, core.db.iv)
		delete entry2.encId
		o(entry2).deepEquals({
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
		core.encryptSearchIndexEntries(id2, ownerGroupId, keyToIndexEntries2, indexUpdate)
		o(indexUpdate.create.encInstanceIdToElementData.size).equals(2)
		const yKey = encryptIndexKeyBase64(core.db.key, elementIdPart(id2), core.db.iv)
		let elementData2: ElementDataSurrogate = neverNull(indexUpdate.create.encInstanceIdToElementData.get(yKey))
		let listId2 = elementData2.listId
		o(listId2).equals(id2[0])
		let words2 = decryptIndexKey(core.db.key, base64ToUint8Array(elementData2.encWordsB64[0]), core.db.iv)
		o(words2).equals("a")
		o(ownerGroupId).equals(elementData2.ownerGroup)
		encEntriesA = neverNull(indexUpdate.create.indexMap.get(encryptIndexKeyBase64(core.db.key, "a", core.db.iv)))
		o(encEntriesA.length).equals(2)
		entry = downcast(decryptSearchIndexEntry(core.db.key, encEntriesA[0].entry, core.db.iv))
		delete entry.encId
		o(entry).deepEquals({
			id: elementIdPart(instanceId),
			attribute: 5,
			positions: [0],
		})
		const newEntry: any = decryptSearchIndexEntry(core.db.key, encEntriesA[1].entry, core.db.iv)
		delete newEntry.encId
		o(newEntry).deepEquals({
			id: elementIdPart(id2),
			attribute: 2,
			positions: [7, 62],
		})
	})
	o("writeIndexUpdate _moveIndexedInstance", async function () {
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
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				return Promise.resolve(["old-list", words, groupId] as ElementDataDbRow)
			},
			put: (os, key, value) => {
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				o(value).deepEquals(["new-list", words, groupId])
			},
		}
		const core = makeCore()
		await core._moveIndexedInstance(indexUpdate, transaction)
	})
	o("writeIndexUpdate _moveIndexedInstance instance already deleted", async function () {
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
				o(os).equals(ElementDataOS)
				o(key).deepEquals(encInstanceId)
				return Promise.resolve(null)
			},
			put: (os, key, value) => {
				throw new Error("instance does not exist, should not be moved!")
			},
		}
		const core = makeCore()
		await neverNull(core._moveIndexedInstance(indexUpdate, transaction))
	})
	o("writeIndexUpdate _deleteIndexedInstance", async function () {
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
		const core = makeCore()
		const encodedMetaData = encryptMetaData(core.db.key, metaData)
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
		await core._deleteIndexedInstance(indexUpdate, transaction)
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
		o(JSON.stringify([metaPutInvocation[0], metaPutInvocation[1], decryptMetaData(core.db.key, metaPutInvocation[2])])).equals(
			JSON.stringify([SearchIndexMetaDataOS, null, expectedMeta]),
		)
		o(transaction.delete.invocations[0]).deepEquals([ElementDataOS, encInstanceIdB64])
	})
	o("writeIndexUpdate _deleteIndexedInstance last entry for word", async function () {
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
			get: (os, key) => {
				switch (os) {
					case SearchIndexMetaDataOS:
						return Promise.resolve(key === metaId ? encryptMetaData(core.db.key, metaData) : null)

					case SearchIndexOS:
						return Promise.resolve(key === searchIndexEntryId ? appendBinaryBlocks([entry, entry]) : null)
				}
			},
			put: spy((os, key, value) => Promise.resolve()),
			delete: spy((os, key) => Promise.resolve()),
		}
		await core._deleteIndexedInstance(indexUpdate, transaction)
		o(transaction.put.invocations).deepEquals([])
		o(transaction.delete.invocations).deepEquals([
			[ElementDataOS, encInstanceIdB64],
			[SearchIndexOS, 1],
			[SearchIndexMetaDataOS, metaId],
		])
	})
	o("writeIndexUpdate _deleteIndexedInstance instance already deleted", function () {
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
		const core = makeCore()
		return neverNull(core._deleteIndexedInstance(indexUpdate, transaction)).then(() => {
			o(transaction.delete.invocations).deepEquals([[ElementDataOS, uint8ArrayToBase64(getIdFromEncSearchIndexEntry(entry))]])
		})
	})
	o("writeIndexUpdate _insertNewElementData", async function () {
		const groupId = "my-group"
		const listId = "list-id"
		const core = makeCore()

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
		await neverNull(
			core._insertNewElementData(indexUpdate, transaction, {
				[encWord]: searchIndexRowKey,
			}),
		)
		const [[os, key, value]] = transaction.put.invocations
		o(os).equals(ElementDataOS)
		o(key).equals(encInstanceId)
		const [listIdValue, encRowsValue, ownerGroupValue] = value
		o(listIdValue).equals(listId)
		o(Array.from(unauthenticatedAesDecrypt(core.db.key, encRowsValue, true))).deepEquals(Array.from(new Uint8Array([searchIndexRowKey])))
		o(ownerGroupValue).equals(groupId)
	})
	o.spec("writeIndexUpdate _insertNewIndexEntries ", function () {
		const encWord = uint8ArrayToBase64(new Uint8Array([77, 83, 2, 23]))
		let indexUpdate: IndexUpdate
		let dbStub: DbStub
		let transaction: DbStubTransaction
		let core: IndexerCore
		o.beforeEach(function () {
			indexUpdate = _createNewIndexUpdate(mailTypeInfo)
			dbStub = createSearchIndexDbStub()
			transaction = dbStub.createTransaction()
			core = makeCore()
		})

		o("new word", async function () {
			let encInstanceId = new Uint8Array(16)
			let entry: EncryptedSearchIndexEntry = concat(encInstanceId, new Uint8Array(0))
			indexUpdate.create.indexMap.set(encWord, [
				{
					timestamp: 1,
					entry,
				},
			])
			await core._insertNewIndexEntries(indexUpdate, transaction)
			o(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(Array.from(appendBinaryBlocks([entry])))
			const decodedInsertedMeta = decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, 1))
			o(decodedInsertedMeta).deepEquals({
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

		o("existing word, growing the first row", async function () {
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
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			transaction.put(SearchIndexOS, searchIndexKey, existingBlock)
			await core._insertNewIndexEntries(indexUpdate, transaction)
			o(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, searchIndexKey))).deepEquals(Array.from(appendBinaryBlocks([newEntry], existingBlock)))
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
			o(decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, metaId))).deepEquals(expectedMeta)
		})
		o("add older entities to a new row", async function () {
			// 50 entries go to the existing row, everything else goes to the new row
			const newEntries: Array<EncSearchIndexEntryWithTimestamp> = makeEntries(core.db.key, core.db.iv, 200)
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
			const existingRow = appendBinaryBlocks(makeEntries(core.db.key, core.db.iv, 800, 150).map((e) => e.entry))
			await transaction.put(SearchIndexOS, 1, existingRow)
			await transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			const newKey = 3
			dbStub.getObjectStore(SearchIndexOS).lastId = 2
			await core._insertNewIndexEntries(indexUpdate, transaction)
			const searchIndexContent = dbStub.getObjectStore(SearchIndexOS).content[newKey]
			o(Array.from(searchIndexContent)).deepEquals(Array.from(appendBinaryBlocks(newEntries.slice(0, 150).map((e) => e.entry))))
			o(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(
				Array.from(
					appendBinaryBlocks(
						newEntries.slice(150).map((e) => e.entry),
						existingRow,
					),
				),
			)
			const searchIndexMetaContent = dbStub.getObjectStore(SearchIndexMetaDataOS).content[searchIndexMeta.id]
			const decryptedMeta = decryptMetaData(core.db.key, searchIndexMetaContent)
			searchIndexMeta.rows[0].size = 850
			searchIndexMeta.rows.unshift({
				app: mailTypeInfo.appId,
				type: mailTypeInfo.typeId,
				key: newKey,
				size: 150,
				oldestElementTimestamp: 0,
			})
			o(decryptedMeta).deepEquals(searchIndexMeta)
		})

		o("add newer entities to the end", async function () {
			const newEntries = makeEntries(core.db.key, core.db.iv, 200, 201)
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
			const existingRow = appendBinaryBlocks(makeEntries(core.db.key, core.db.iv, 600, 100).map((e) => e.entry))
			transaction.put(SearchIndexOS, 1, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			await core._insertNewIndexEntries(indexUpdate, transaction)
			o(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(
				Array.from(
					appendBinaryBlocks(
						newEntries.map((e) => e.entry),
						existingRow,
					),
				),
			)
			searchIndexMeta.rows[0].size = 800
			o(decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, 1))).deepEquals(searchIndexMeta)
		})
		o("add newer entities to the existing row in the beginning", async function () {
			const newEntries = makeEntries(core.db.key, core.db.iv, 200, 201)
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
			const existingRow = appendBinaryBlocks(makeEntries(core.db.key, core.db.iv, 600, 100).map((e) => e.entry))
			transaction.put(SearchIndexOS, 1, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			await core._insertNewIndexEntries(indexUpdate, transaction)
			o(Array.from(transaction.getSync<Uint8Array>(SearchIndexOS, 1))).deepEquals(
				Array.from(
					appendBinaryBlocks(
						newEntries.map((e) => e.entry),
						existingRow,
					),
				),
			)
			searchIndexMeta.rows[0].size = 800
			searchIndexMeta.rows[0].oldestElementTimestamp = 201
			o(decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, 1))).deepEquals(searchIndexMeta)
		})
		o("split row", async function () {
			// Split the row.
			const newEntries = makeEntries(core.db.key, core.db.iv, 250, 2001)
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
			const existingEntries = makeEntries(core.db.key, core.db.iv, 800, 2000)
			const existingRow = appendBinaryBlocks(existingEntries.map((e) => e.entry).reverse())
			transaction.put(SearchIndexOS, 3, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			dbStub.getObjectStore(SearchIndexOS).lastId = 4
			await core._insertNewIndexEntries(indexUpdate, transaction)
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
			o(decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, searchIndexMeta.id))).deepEquals(searchIndexMeta)
		})
		o("split last row", async function () {
			// Split the row.
			const newEntries = makeEntries(core.db.key, core.db.iv, 250, 2001)
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
			const existingEntries = makeEntries(core.db.key, core.db.iv, 800, 2000)
			const existingRow = appendBinaryBlocks(existingEntries.map((e) => e.entry).reverse())
			transaction.put(SearchIndexOS, 3, existingRow)
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			dbStub.getObjectStore(SearchIndexOS).lastId = 4
			await core._insertNewIndexEntries(indexUpdate, transaction)
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
			o(decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, searchIndexMeta.id))).deepEquals(searchIndexMeta)
		})
		o("split for big new row", async function () {
			const newEntries = makeEntries(core.db.key, core.db.iv, 2500, 2001)
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
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(core.db.key, searchIndexMeta))
			dbStub.getObjectStore(SearchIndexOS).lastId = 2
			await core._insertNewIndexEntries(indexUpdate, transaction)
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
			o(decryptMetaData(core.db.key, transaction.getSync(SearchIndexMetaDataOS, searchIndexMeta.id))).deepEquals(searchIndexMeta)
		})
	})
	o("writeIndexUpdate _updateGroupDataBatchId abort in case batch has been indexed already", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const batchId = "last-batch-id"
		const deferred = defer<void>()
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
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

	o("writeIndexUpdate _updateGroupDataBatchId", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const deferred = defer<void>()
		const batchId = "2"
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
				let groupData: GroupData = {
					lastBatchIds: ["4", "3", "1"],
				} as any
				return Promise.resolve(groupData)
			},
			aborted: false,
			put: (os, key, value) => {
				o(os).equals(GroupDataOS)
				o(key).equals(groupId)
				o(JSON.stringify(value)).equals(
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

	o("writeIndexUpdate", async function () {
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
		await core.writeIndexUpdate(groupUpdate, indexUpdate)
		o(core._moveIndexedInstance.callCount).equals(1)
		o(core._moveIndexedInstance.args).deepEquals([indexUpdate, transaction])
		o(core._deleteIndexedInstance.callCount).equals(1)
		o(core._deleteIndexedInstance.args).deepEquals([indexUpdate, transaction])
		o(core._insertNewElementData.callCount).equals(1)
		o(core._insertNewElementData.args).deepEquals([indexUpdate, transaction, encWordToMetaRow])
		o(core._insertNewIndexEntries.callCount).equals(1)
		o(core._insertNewIndexEntries.args).deepEquals([indexUpdate, transaction])
		o(core._updateGroupDataIndexTimestamp.callCount).equals(1)
		o(core._updateGroupDataIndexTimestamp.args).deepEquals([groupUpdate, transaction])
		o(waitForTransaction).equals(true)
	})

	o("processDeleted", async function () {
		const groupId = "my-group"

		const indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		const instanceId = "L-dNNLe----1"
		const instanceIdTimestamp = generatedIdToTimestamp(instanceId)
		const event = createTestEntity(EntityUpdateTypeRef)
		event.application = MailTypeRef.app
		event.type = MailTypeRef.type
		const metaRowId = 3
		const anotherMetaRowId = 4
		event.instanceId = instanceId
		const transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve(elementData)
			},
		}
		const core = makeCore({
			transaction,
		})
		const encInstanceId = encryptIndexKeyBase64(core.db.key, instanceId, core.db.iv)
		const listId = "list-id"
		const elementData: ElementDataDbRow = [
			listId,
			aesEncrypt(core.db.key, new Uint8Array([metaRowId, anotherMetaRowId]), random.generateRandomData(IV_BYTE_LENGTH), true),
			groupId,
		]
		const otherId = new Uint8Array(16).fill(88)
		indexUpdate.delete.searchMetaRowToEncInstanceIds.set(metaRowId, [
			{
				encInstanceId: otherId,
				appId: indexUpdate.typeInfo.appId,
				typeId: indexUpdate.typeInfo.typeId,
				timestamp: 1,
			},
		])
		await core._processDeleted(event, indexUpdate)
		o(indexUpdate.delete.encInstanceIds).deepEquals([encInstanceId])
		o(indexUpdate.delete.searchMetaRowToEncInstanceIds.size).equals(2)
		o(JSON.stringify(indexUpdate.delete.searchMetaRowToEncInstanceIds.get(metaRowId))).equals(
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
		o(ids2.length).equals(1)
		o(Array.from(ids2[0].encInstanceId)).deepEquals(Array.from(base64ToUint8Array(encInstanceId)))
		o(indexUpdate.delete.encInstanceIds.length).equals(1)
		o(Array.from(indexUpdate.delete.encInstanceIds[0])).deepEquals(Array.from(encInstanceId))
	})
	o("processDeleted already deleted", async function () {
		let groupId = "my-group"

		let indexUpdate = _createNewIndexUpdate(mailTypeInfo)

		let instanceId = "123"
		let event = createTestEntity(EntityUpdateTypeRef)
		event.instanceId = instanceId
		event.application = MailTypeRef.app
		event.type = MailTypeRef.type
		let transaction: any = {
			get: (os, key) => {
				o(os).equals(ElementDataOS)
				o(Array.from(key)).deepEquals(Array.from(encInstanceId))
				return Promise.resolve()
			},
		}
		const core = makeCore({
			queue: downcast({
				_eventQueue: [],
			}),
			transaction,
		})
		let encInstanceId = encryptIndexKeyBase64(core.db.key, instanceId, core.db.iv)
		await core._processDeleted(event, indexUpdate)
		o(indexUpdate.delete.searchMetaRowToEncInstanceIds.size).equals(0)
		o(indexUpdate.delete.encInstanceIds.length).equals(0)
	})
	o("stopProcessing", async function () {
		const queue: EventQueue = downcast({
			_eventQueue: [],
			clear: spy(),
		})
		const deferred = defer()
		const transaction = {
			abort: noOp,
		}
		const core = makeCore({
			queue,
			db: {
				key: aes256RandomKey(),
				iv: fixedIv,
				dbFacade: {
					createTransaction: () => deferred.promise,
				} as any,
				initialized: Promise.resolve(),
			},
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
		// @ts-ignore
		o(queue.clear.invocations).deepEquals([[]])("Should clear queue")

		try {
			deferred.resolve(transaction)
			await result
			o(false).equals(true)("Should throw an error")
		} catch (e) {
			o(e instanceof CancelledError).equals(true)("Should throw cancelledError")
		}
	})
	o("startProcessing", async function () {
		const queue: EventQueue = downcast({
			_eventQueue: [1, 2, 3],
			clear: spy(),
		})
		const transaction: DbTransaction = downcast({
			get: () =>
				Promise.resolve(() => ({
					indexTimestamp: Date.now(),
				})),
			put: () => Promise.resolve(null),
			wait: () => Promise.resolve(),
		})
		const core = makeCore({
			queue,
			transaction,
		})
		core.stopProcessing()
		core.startProcessing()
		// Should not throw
		await core.writeIndexUpdate(
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
