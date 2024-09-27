import o from "@tutao/otest"
import { SearchFacade } from "../../../../../src/mail-app/workerUtils/index/SearchFacade.js"
import { ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import type { TypeInfo } from "../../../../../src/common/api/worker/search/IndexUtils.js"
import {
	encryptIndexKeyBase64,
	encryptIndexKeyUint8Array,
	encryptMetaData,
	encryptSearchIndexEntry,
	typeRefToTypeInfo,
} from "../../../../../src/common/api/worker/search/IndexUtils.js"
import type { ElementDataDbRow, SearchIndexEntry, SearchIndexMetaDataRow, SearchRestriction } from "../../../../../src/common/api/worker/search/SearchTypes.js"
import {
	compareOldestFirst,
	elementIdPart,
	firstBiggerThanSecond,
	generatedIdToTimestamp,
	listIdPart,
	timestampToGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import type { Base64 } from "@tutao/tutanota-utils"
import { groupBy, numberRange, splitInChunks } from "@tutao/tutanota-utils"
import { appendBinaryBlocks } from "../../../../../src/common/api/worker/search/SearchIndexEncoding.js"
import { createSearchIndexDbStub, DbStub, DbStubTransaction } from "./DbStub.js"
import type { BrowserData } from "../../../../../src/common/misc/ClientConstants.js"
import { browserDataStub, createTestEntity } from "../../../TestUtils.js"
import { aes256RandomKey, fixedIv } from "@tutao/tutanota-crypto"
import { ElementDataOS, SearchIndexMetaDataOS, SearchIndexOS } from "../../../../../src/common/api/worker/search/IndexTables.js"
import { object, when } from "testdouble"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"

type SearchIndexEntryWithType = SearchIndexEntry & {
	typeInfo: TypeInfo
}
type KeyToIndexEntriesWithType = {
	indexKey: Base64
	indexEntries: SearchIndexEntryWithType[]
}
let dbKey
const contactTypeInfo = typeRefToTypeInfo(ContactTypeRef)
const mailTypeInfo = typeRefToTypeInfo(MailTypeRef)
const browserData: BrowserData = browserDataStub
const entityClient: EntityClient = object()
o.spec("SearchFacade test", () => {
	let mail = createTestEntity(MailTypeRef)
	let user = createTestEntity(UserTypeRef)
	let id1 = "L0YED5d----1"
	let id2 = "L0YED5d----2"
	let id3 = "L0YED5d----3"

	function createSearchFacade(transaction: DbStubTransaction, currentIndexTimestamp: number) {
		return new SearchFacade(
			{
				getLoggedInUser: () => user,
			} as any,
			{
				key: dbKey,
				iv: fixedIv,
				dbFacade: {
					createTransaction: () => Promise.resolve(transaction),
				} as any,
				initialized: Promise.resolve(),
			},
			{
				mailboxIndexingPromise: Promise.resolve(),
				currentIndexTimestamp: currentIndexTimestamp,
			} as any,
			[],
			browserData,
			entityClient,
		)
	}

	function createDbContent(transaction: DbStubTransaction, dbData: KeyToIndexEntriesWithType[], fullIds: IdTuple[]) {
		let counter = 0
		for (const [index, keyToIndexEntries] of dbData.entries()) {
			keyToIndexEntries.indexEntries.sort((a, b) => compareOldestFirst(a.id, b.id))
			const indexEntriesByType = groupBy(keyToIndexEntries.indexEntries, (e) => e.typeInfo)
			const metaDataRow: SearchIndexMetaDataRow = {
				id: index + 1,
				word: keyToIndexEntries.indexKey,
				rows: [],
			}
			for (const [typeInfo, entries] of indexEntriesByType.entries()) {
				const chunks = splitInChunks(2, entries)
				for (const chunk of chunks) {
					counter++
					metaDataRow.rows.push({
						app: typeInfo.appId,
						type: typeInfo.typeId,
						key: counter,
						size: chunk.length,
						oldestElementTimestamp: generatedIdToTimestamp(chunk[0].id),
					})
					const encSearchIndexRow = appendBinaryBlocks(
						chunk.map((entry) => encryptSearchIndexEntry(dbKey, entry, encryptIndexKeyUint8Array(dbKey, entry.id, fixedIv))),
					)
					transaction.put(SearchIndexOS, counter, encSearchIndexRow)
				}
			}
			transaction.put(SearchIndexMetaDataOS, null, encryptMetaData(dbKey, metaDataRow))
			for (const id of fullIds) {
				let encId = encryptIndexKeyBase64(dbKey, elementIdPart(id), fixedIv)
				const elementDataEntry: ElementDataDbRow = [listIdPart(id), new Uint8Array(0), ""] // rows not needed for search

				transaction.put(ElementDataOS, encId, elementDataEntry)
			}
		}
	}

	let createKeyToIndexEntries = (word: string, entries: SearchIndexEntryWithType[]): KeyToIndexEntriesWithType => {
		return {
			indexKey: encryptIndexKeyBase64(dbKey, word, fixedIv),
			indexEntries: entries,
		}
	}

	let createMailEntry = (id: Id, attribute: number, positions: number[]): SearchIndexEntryWithType => {
		return {
			id: id,
			attribute: attribute,
			positions: positions,
			typeInfo: mailTypeInfo,
		}
	}

	let createContactEntry = (id: Id, attribute: number, positions: number[]): SearchIndexEntryWithType => {
		return {
			id: id,
			attribute: attribute,
			positions: positions,
			typeInfo: contactTypeInfo,
		}
	}

	let createMailRestriction = (attributeIds?: number[] | null, listId?: Id | null, start?: number | null, end?: number | null): SearchRestriction => {
		return {
			type: MailTypeRef,
			start: start ?? null,
			end: end ?? null,
			field: null,
			attributeIds: attributeIds ?? null,
			folderIds: listId != null ? [listId] : [],
			eventSeries: true,
		}
	}

	let testSearch = (
		dbData: KeyToIndexEntriesWithType[],
		dbListIds: IdTuple[],
		query: string,
		restriction: SearchRestriction,
		expectedResult: IdTuple[],
		currentIndexTimestamp: number = 0,
		minSuggestionCount: number = 0,
		maxResults?: number,
	): Promise<void> => {
		createDbContent(transaction, dbData, dbListIds)
		let s = createSearchFacade(transaction, currentIndexTimestamp)
		return s.search(query, restriction, minSuggestionCount, maxResults).then((result) => {
			o(result.query).equals(query)
			o(result.restriction).deepEquals(restriction)
			o(result.results).deepEquals(expectedResult.sort((idTuple1, idTuple2) => (firstBiggerThanSecond(idTuple1[1], idTuple2[1]) ? -1 : 1)))
		})
	}

	let dbStub: DbStub
	let transaction: DbStubTransaction
	o.beforeEach(() => {
		dbKey = aes256RandomKey()
		dbStub = createSearchIndexDbStub()
		transaction = dbStub.createTransaction()
	})
	o("empty db", () => {
		return testSearch([], [], "test", createMailRestriction(), [])
	})
	o("empty query", () => {
		return testSearch([], [], "", createMailRestriction(), [])
	})
	o("no words in query", () => {
		return testSearch([], [], " %.,:", createMailRestriction(), [])
	})
	o("find single entry", () => {
		return testSearch([createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0])])], [["listId1", id1]], "test", createMailRestriction(), [
			["listId1", id1],
		])
	})
	o("find two entries", () => {
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
			],
			"test",
			createMailRestriction(),
			[
				["listId1", id1],
				["listId2", id2],
			],
		)
	})
	o("find entries from different rows", () => {
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0]), createMailEntry(id3, 0, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
				["listId3", id3],
			],
			"test",
			createMailRestriction(),
			[
				["listId1", id1],
				["listId2", id2],
				["listId3", id3],
			],
		)
	})
	o("find type", () => {
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createContactEntry(id2, 0, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
			],
			"test",
			createMailRestriction(),
			[["listId1", id1]],
		)
	})
	o("find attribute", () => {
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 1, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
			],
			"test",
			createMailRestriction([1]),
			[["listId2", id2]],
		)
	})
	o("find folderId legacy MailFolders (non-static mail listIds)", () => {
		let mail1 = createTestEntity(MailTypeRef, { _id: ["mailListId1", id1] })
		when(entityClient.load(MailTypeRef, mail1._id)).thenReturn(Promise.resolve(mail1))
		let mail2 = createTestEntity(MailTypeRef, { _id: ["mailListId2", id2] })
		when(entityClient.load(MailTypeRef, mail2._id)).thenReturn(Promise.resolve(mail2))

		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[mail1._id, mail2._id],
			"test",
			createMailRestriction(null, listIdPart(mail2._id)),
			[mail2._id],
		)
	})
	o("find folderId new MailSets (static mail listIds)", () => {
		const mail1 = createTestEntity(MailTypeRef, {
			_id: ["mailListId", id1],
			sets: [["setListId", "folderId1"]],
		})
		when(entityClient.load(MailTypeRef, mail1._id)).thenReturn(Promise.resolve(mail1))
		const mail2 = createTestEntity(MailTypeRef, {
			_id: ["mailListId", id2],
			sets: [["setListId", "folderId2"]],
		})
		when(entityClient.load(MailTypeRef, mail2._id)).thenReturn(Promise.resolve(mail2))

		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[mail1._id, mail2._id],
			"test",
			createMailRestriction(null, elementIdPart(mail2.sets[0])),
			[mail2._id],
		)
	})
	o("find with start time", () => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 8).getTime())
		let start = new Date(2017, 5, 9).getTime()
		let id2 = timestampToGeneratedId(new Date(2017, 5, 10).getTime())
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
			],
			"test",
			createMailRestriction(null, null, start, null),
			[["listId1", id1]],
		)
	})
	o("find with end time", () => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 8).getTime())
		let end = new Date(2017, 5, 9).getTime()
		let id2 = timestampToGeneratedId(new Date(2017, 5, 10).getTime())
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
			],
			"test",
			createMailRestriction(null, null, null, end),
			[["listId2", id2]],
		)
	})
	o("find with start and end time", () => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 8).getTime())
		let end = new Date(2017, 5, 9).getTime()
		let id2 = timestampToGeneratedId(new Date(2017, 5, 10).getTime())
		let start = new Date(2017, 5, 11).getTime()
		let id3 = timestampToGeneratedId(new Date(2017, 5, 12).getTime())
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0]), createMailEntry(id3, 0, [0])])],
			[
				["listId1", id1],
				["listId2", id2],
				["listId3", id3],
			],
			"test",
			createMailRestriction(null, null, start, end),
			[["listId2", id2]],
		)
	})
	o("find two search words", () => {
		return testSearch(
			[
				createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])]),
				createKeyToIndexEntries("ja", [createMailEntry(id1, 0, [0])]),
			],
			[
				["listId1", id1],
				["listId2", id2],
			],
			"ja,test",
			createMailRestriction(),
			[["listId1", id1]],
		)
	})
	o("find two search words in multiple rows", () => {
		const firstWordIds: Array<IdTuple> = numberRange(1, 1500).map((i) => ["listId1", timestampToGeneratedId(i, 1)])
		const secondWordIds: Array<IdTuple> = numberRange(1, 1500).map((i) => ["listId1", timestampToGeneratedId(i, 1)])
		const firstWordEntries = firstWordIds.map((idTuple) => createMailEntry(elementIdPart(idTuple), 0, [0]))
		const secondWordEntries = secondWordIds.map((idTuple) => createMailEntry(elementIdPart(idTuple), 0, [0]))
		//const oldestId = in
		return testSearch(
			[createKeyToIndexEntries("test", firstWordEntries), createKeyToIndexEntries("ja", secondWordEntries)],
			firstWordIds.concat(secondWordIds),
			"ja,test",
			createMailRestriction(),
			secondWordIds.slice(500).reverse(),
			0,
			0,
			1000,
		)
	})
	o("find two search words with a time gap", () => {
		const firstWordIds: Array<IdTuple> = numberRange(1, 1200).map((i) => ["listId1", timestampToGeneratedId(i, 1)])
		const secondWordIds: Array<IdTuple> = numberRange(1, 10).map((i) => ["listId1", timestampToGeneratedId(i, 1)])
		const firstWordEntries = firstWordIds.map((idTuple) => createMailEntry(elementIdPart(idTuple), 0, [0]))
		const secondWordEntries = secondWordIds.map((idTuple) => createMailEntry(elementIdPart(idTuple), 0, [0]))
		//const oldestId = in
		return testSearch(
			[createKeyToIndexEntries("test", firstWordEntries), createKeyToIndexEntries("ja", secondWordEntries)],
			firstWordIds.concat(secondWordIds),
			"ja,test",
			createMailRestriction(),
			secondWordIds,
			0,
			0,
			100,
		)
	})
	o("find two search words ordered", () => {
		return testSearch(
			[
				// id1 must be found, id2 does not have the correct order, id3 has the order but in different attributes
				createKeyToIndexEntries("test", [createMailEntry(id1, 0, [6]), createMailEntry(id2, 0, [6]), createMailEntry(id3, 1, [6])]),
				createKeyToIndexEntries("ja", [createMailEntry(id1, 0, [5]), createMailEntry(id2, 0, [4]), createMailEntry(id3, 0, [5])]),
			],
			[
				["listId1", id1],
				["listId2", id2],
				["listId3", id3],
			],
			'"ja,test"',
			createMailRestriction(),
			[["listId1", id1]],
		)
	})
	o("reduce ids", () => {
		return testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id1, 1, [0])])],
			[["listId1", id1]],
			"test",
			createMailRestriction(),
			[["listId1", id1]],
		)
	})
})
