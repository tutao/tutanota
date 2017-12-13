// @flow
import o from "ospec/ospec.js"
import {SearchFacade} from "../../../../src/api/worker/search/SearchFacade"
import {MailTypeRef, _TypeModel as MailTypeModel} from "../../../../src/api/entities/tutanota/Mail"
import {aes256RandomKey} from "../../../../src/api/worker/crypto/Aes"
import {SearchIndexOS, ElementDataOS} from "../../../../src/api/worker/search/DbFacade"
import {createUser} from "../../../../src/api/entities/sys/User"
import {encryptSearchIndexEntry, encryptIndexKey, getAppId} from "../../../../src/api/worker/search/IndexUtils"
import type {
	KeyToIndexEntries,
	KeyToEncryptedIndexEntries,
	SearchIndexEntry,
	EncryptedSearchIndexEntry,
	ElementData
} from "../../../../src/api/worker/search/SearchTypes"
import {arrayEquals} from "../../../../src/api/common/utils/ArrayUtils"
import {neverNull} from "../../../../src/api/common/utils/Utils"
import {firstBiggerThanSecond} from "../../../../src/api/common/EntityFunctions"
import {ContactTypeRef, _TypeModel as ContactTypeModel} from "../../../../src/api/entities/tutanota/Contact"
import {timestampToGeneratedId} from "../../../../src/api/common/utils/Encoding"

o.spec("SearchFacade test", () => {
	let dbKey
	let user = createUser()
	let indexMailBoxReceiver = {indexMailbox: (user, endIndexTime) => null}

	let createDbContent = (dbData: KeyToIndexEntries[]): KeyToEncryptedIndexEntries[] => {
		return dbData.map(keyToIndexEntries => {
			let encryptedSearchIndexEntries = keyToIndexEntries.indexEntries.map(entry => {
				return encryptSearchIndexEntry(dbKey, entry, encryptIndexKey(dbKey, entry.id))
			})
			return {
				indexKey: keyToIndexEntries.indexKey,
				indexEntries: encryptedSearchIndexEntries
			}
		})
	}

	let createSearchFacade = (dbData: KeyToIndexEntries[], fullIds: IdTuple[], currentIndexTimestamp: number) => {
		let dbContent = createDbContent(dbData)
		let transaction: any = {
			getAsList: (os, indexKey): Promise<EncryptedSearchIndexEntry[]> => {
				o(os).equals(SearchIndexOS)
				let line = dbContent.find(keyToEncryptedIndexEntries => arrayEquals(keyToEncryptedIndexEntries.indexKey, indexKey))
				return Promise.resolve(line ? line.indexEntries : [])
			},
			get: (os, idKey): Promise<ElementData> => {
				o(os).equals(ElementDataOS)
				return Promise.resolve([neverNull(fullIds.find(id => {
					let encId = encryptIndexKey(dbKey, id[1])
					return arrayEquals(encId, idKey)
				}))[0], new Uint8Array(0), ""])
			}
		}

		return new SearchFacade(({
			getLoggedInUser: () => user
		}:any), {
			key: dbKey,
			dbFacade: ({createTransaction: () => transaction}:any)
		}, ({
			mailboxIndexingPromise: Promise.resolve(),
			currentIndexTimestamp: currentIndexTimestamp,
			indexMailbox: (user, endIndexTime) => indexMailBoxReceiver.indexMailbox(user, endIndexTime)
		}:any))
	}

	let createKeyToIndexEntries = (word: string, entries: SearchIndexEntry[]): KeyToIndexEntries => {
		return {
			indexKey: encryptIndexKey(dbKey, word),
			indexEntries: entries
		}
	}

	let createMailEntry = (id: Id, attribute: number, positions: number[]): SearchIndexEntry => {
		return {
			id: id,
			app: getAppId(MailTypeRef),
			type: MailTypeModel.id,
			attribute: attribute,
			positions: positions
		}
	}

	let createContactEntry = (id: Id, attribute: number, positions: number[]): SearchIndexEntry => {
		return {
			id: id,
			app: getAppId(ContactTypeRef),
			type: ContactTypeModel.id,
			attribute: attribute,
			positions: positions
		}
	}

	let createMailRestriction = (attributeIds: ?number[], listId: ?Id, start: ?number, end: ?number) => {
		return {
			type: MailTypeRef,
			start: start,
			end: end,
			field: null,
			attributeIds: attributeIds,
			listId: listId
		}
	}

	o.before(() => {
		dbKey = aes256RandomKey()
	})

	o("empty db", done => {
		testSearch([], [], "test", createMailRestriction(), []).then(() => done())
	})

	o("empty query", done => {
		testSearch([], [], "", createMailRestriction(), []).then(() => done())
	})

	o("no words in query", done => {
		testSearch([], [], " %.,:", createMailRestriction(), []).then(() => done())
	})

	o("find single entry", done => {
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0])])],
			[["listId1", "id1"]],
			"test",
			createMailRestriction(),
			[["listId1", "id1"]]
		).then(() => done())
	})

	o("find two entries", done => {
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0]), createMailEntry("id2", 0, [0])])],
			[["listId1", "id1"], ["listId2", "id2"]],
			"test",
			createMailRestriction(),
			[["listId1", "id1"], ["listId2", "id2"]]
		).then(() => done())
	})

	o("find type", done => {
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0]), createContactEntry("id2", 0, [0])])],
			[["listId1", "id1"], ["listId2", "id2"]],
			"test",
			createMailRestriction(),
			[["listId1", "id1"]]
		).then(() => done())
	})

	o("find attribute", done => {
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0]), createMailEntry("id2", 1, [0])])],
			[["listId1", "id1"], ["listId2", "id2"]],
			"test",
			createMailRestriction([1]),
			[["listId2", "id2"]]
		).then(() => done())
	})

	o("find listId", done => {
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0]), createMailEntry("id2", 0, [0])])],
			[["listId1", "id1"], ["listId2", "id2"]],
			"test",
			createMailRestriction(null, "listId2"),
			[["listId2", "id2"]]
		).then(() => done())
	})

	o("find with start time", done => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 8).getTime())
		let start = new Date(2017, 5, 9).getTime()
		let id2 = timestampToGeneratedId(new Date(2017, 5, 10).getTime())
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[["listId1", id1], ["listId2", id2]],
			"test",
			createMailRestriction(null, null, start, null),
			[["listId1", id1]]
		).then(() => done())
	})

	o("find with end time", done => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 8).getTime())
		let end = new Date(2017, 5, 9).getTime()
		let id2 = timestampToGeneratedId(new Date(2017, 5, 10).getTime())
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0])])],
			[["listId1", id1], ["listId2", id2]],
			"test",
			createMailRestriction(null, null, null, end),
			[["listId2", id2]]
		).then(() => done())
	})

	o("find with start and end time", done => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 8).getTime())
		let end = new Date(2017, 5, 9).getTime()
		let id2 = timestampToGeneratedId(new Date(2017, 5, 10).getTime())
		let start = new Date(2017, 5, 11).getTime()
		let id3 = timestampToGeneratedId(new Date(2017, 5, 12).getTime())
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0]), createMailEntry(id2, 0, [0]), createMailEntry(id3, 0, [0])])],
			[["listId1", id1], ["listId2", id2], ["listId3", id3]],
			"test",
			createMailRestriction(null, null, start, end),
			[["listId2", id2]]
		).then(() => done())
	})

	o("find two search words", done => {
		testSearch(
			[
				createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0]), createMailEntry("id2", 0, [0])]),
				createKeyToIndexEntries("ja", [createMailEntry("id1", 0, [0])])
			],
			[["listId1", "id1"], ["listId2", "id2"]],
			"ja,test",
			createMailRestriction(),
			[["listId1", "id1"]]
		).then(() => done())
	})

	o("find two search words ordered", done => {
		testSearch(
			[
				// id1 must be found, id2 does not have the correct order, id3 has the order but in different attributes
				createKeyToIndexEntries("test", [createMailEntry("id1", 0, [6]), createMailEntry("id2", 0, [6]), createMailEntry("id3", 1, [6])]),
				createKeyToIndexEntries("ja", [createMailEntry("id1", 0, [5]), createMailEntry("id2", 0, [4]), createMailEntry("id3", 0, [5])])
			],
			[["listId1", "id1"], ["listId2", "id2"], ["listId3", "id3"]],
			"\"ja,test\"",
			createMailRestriction(),
			[["listId1", "id1"]]
		).then(() => done())
	})

	o("reduce ids", done => {
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry("id1", 0, [0]), createMailEntry("id1", 1, [0])])],
			[["listId1", "id1"]],
			"test",
			createMailRestriction(),
			[["listId1", "id1"]]
		).then(() => done())
	})

	o("index mailbox", done => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 9).getTime())
		let currentIndexTimestamp = new Date(2017, 5, 8).getTime()
		let end = new Date(2017, 5, 7).getTime()

		let indexCalled = false
		indexMailBoxReceiver.indexMailbox = (user, endIndexTime) => {
			o(user).deepEquals(user)
			o(endIndexTime).equals(end)
			indexCalled = true
		}
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0])])],
			[["listId1", id1]],
			"test",
			createMailRestriction(null, null, null, end),
			[["listId1", id1]],
			currentIndexTimestamp
		).then(() => {
			o(indexCalled).equals(true)
			indexMailBoxReceiver.indexMailbox = () => null
			done()
		})
	})

	o("do not index mailbox", done => {
		let id1 = timestampToGeneratedId(new Date(2017, 5, 9).getTime())
		let currentIndexTimestamp = new Date(2017, 5, 8).getTime()
		let end = new Date(2017, 5, 8).getTime()

		let indexCalled = false
		indexMailBoxReceiver.indexMailbox = (user, endIndexTime) => {
			indexCalled = true
		}
		testSearch(
			[createKeyToIndexEntries("test", [createMailEntry(id1, 0, [0])])],
			[["listId1", id1]],
			"test",
			createMailRestriction(null, null, null, end),
			[["listId1", id1]],
			currentIndexTimestamp
		).then(() => {
			o(indexCalled).equals(false)
			indexMailBoxReceiver.indexMailbox = () => null
			done()
		})
	})

	let testSearch = (dbData: KeyToIndexEntries[], listIds: IdTuple[], query: string, restriction: SearchRestriction, expectedResult: IdTuple[], currentIndexTimestamp: number = 0): Promise<void> => {
		let s = createSearchFacade(dbData, listIds, currentIndexTimestamp)
		return s.search(query, restriction).then(result => {
			o(result.query).equals(query)
			o(result.restriction).deepEquals(restriction)
			o(result.results).deepEquals(expectedResult.sort((idTuple1, idTuple2) => firstBiggerThanSecond(idTuple1[1], idTuple2[1]) ? -1 : 1))
		})
	}
})
