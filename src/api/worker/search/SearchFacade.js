//@flow
import {_TypeModel as MailModel, MailTypeRef} from "../../entities/tutanota/Mail"
import {_TypeModel as ContactModel} from "../../entities/tutanota/Contact"
import {_TypeModel as GroupInfoModel} from "../../entities/sys/GroupInfo"
import {SearchIndexOS, ElementDataOS} from "./DbFacade"
import {TypeRef, firstBiggerThanSecond, isSameTypeRef} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {arrayEquals, contains} from "../../common/utils/ArrayUtils"
import {neverNull} from "../../common/utils/Utils"
import type {
	KeyToEncryptedIndexEntries,
	EncryptedSearchIndexEntry,
	KeyToIndexEntries,
	ElementData,
	SearchIndexEntry,
	Db
} from "./SearchTypes"
import {encryptIndexKey, decryptSearchIndexEntry} from "./IndexUtils"
import {NOTHING_INDEXED_TIMESTAMP, FULL_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {timestampToGeneratedId} from "../../common/utils/Encoding"
import {MailIndexer} from "./MailIndexer"
import {LoginFacade} from "../facades/LoginFacade"
import {getStartOfDay} from "../../common/utils/DateUtils"

export class SearchFacade {
	_loginFacade: LoginFacade;
	_db: Db;
	_mailIndexer: MailIndexer;

	constructor(loginFacade: LoginFacade, db: Db, mailIndexer: MailIndexer) {
		this._loginFacade = loginFacade
		this._db = db
		this._mailIndexer = mailIndexer
	}

	/****************************** SEARCH ******************************/

	/**
	 * Invoke an AND-query.
	 * @param query is tokenized. All tokens must be matched by the result (AND-query)
	 * @param type
	 * @param attributes
	 * @returns {Promise.<U>|Promise.<SearchResult>}
	 */
	search(query: string, restriction: SearchRestriction): Promise<SearchResult> {
		let searchTokens = tokenize(query)
		if (searchTokens.length > 0) {
			let matchWordOrder = searchTokens.length > 1 && query.startsWith("\"") && query.endsWith("\"")
			return this._tryExtendIndex(restriction).then(() => this._findIndexEntries(searchTokens)
					.then(keyToEncryptedIndexEntries => this._filterByEncryptedId(keyToEncryptedIndexEntries))
					.then(keyToEncryptedIndexEntries => this._decryptSearchResult(keyToEncryptedIndexEntries))
					.then(keyToIndexEntries => this._filterByTypeAndAttributeAndTime(keyToIndexEntries, restriction))
					.then(keyToIndexEntries => this._reduceWords(keyToIndexEntries, matchWordOrder))
					.then(searchIndexEntries => this._reduceToUniqueElementIds(searchIndexEntries))
					.then(searchIndexEntries => this._filterByListIdAndGroupSearchResults(query, restriction, searchIndexEntries))
				// ranking ->all tokens are in correct order in the same attribute
			).then(searchResult => {
				// default sort order for mails
				searchResult.results.sort((id1, id2) => firstBiggerThanSecond(id1[1], id2[1]) ? -1 : 1)
				return searchResult
			})
		} else {
			return Promise.resolve({
				query,
				restriction,
				results: [],
				currentIndexTimestamp: this._getSearchTimestamp(restriction)
			})
		}
	}

	_tryExtendIndex(restriction: SearchRestriction): Promise<void> {
		if (isSameTypeRef(MailTypeRef, restriction.type)) {
			return this._mailIndexer.mailboxIndexingPromise.then(() => {
				if (this._mailIndexer.currentIndexTimestamp > FULL_INDEXED_TIMESTAMP && restriction.end && this._mailIndexer.currentIndexTimestamp > restriction.end) {
					this._mailIndexer.indexMailbox(this._loginFacade.getLoggedInUser(), getStartOfDay(new Date(neverNull(restriction.end))).getTime())
					return this._mailIndexer.mailboxIndexingPromise
				}
			})
		} else {
			return Promise.resolve()
		}
	}

	_findIndexEntries(searchTokens: string[]): Promise<KeyToEncryptedIndexEntries[]> {
		let transaction = this._db.dbFacade.createTransaction(true, [SearchIndexOS])
		return Promise.map(searchTokens, (token) => {
			let indexKey = encryptIndexKey(this._db.key, token)
			return transaction.getAsList(SearchIndexOS, indexKey).then((indexEntries: EncryptedSearchIndexEntry[]) => {
				return {indexKey, indexEntries}
			})
		})
	}

	/**
	 * Reduces the search result by filtering out all mailIds that don't match all search tokens
	 */
	_filterByEncryptedId(results: KeyToEncryptedIndexEntries[]): KeyToEncryptedIndexEntries[] {
		let matchingEncIds = null
		results.forEach(keyToEncryptedIndexEntry => {
			if (matchingEncIds == null) {
				matchingEncIds = keyToEncryptedIndexEntry.indexEntries.map(entry => entry[0])
			} else {
				matchingEncIds = matchingEncIds.filter((encId) => {
					return keyToEncryptedIndexEntry.indexEntries.find(entry => arrayEquals(entry[0], encId))
				})
			}
		})
		return results.map(r => {
			return {
				indexKey: r.indexKey,
				indexEntries: r.indexEntries.filter(entry => neverNull(matchingEncIds).find(encId => arrayEquals(entry[0], encId)))
			}
		})
	}


	_decryptSearchResult(results: KeyToEncryptedIndexEntries[]): KeyToIndexEntries[] {
		return results.map(searchResult => {
			return {
				indexKey: searchResult.indexKey,
				indexEntries: searchResult.indexEntries.map(entry => decryptSearchIndexEntry(this._db.key, entry))
			}
		})
	}


	_filterByTypeAndAttributeAndTime(results: KeyToIndexEntries[], restriction: SearchRestriction): KeyToIndexEntries[] {
		// first filter each index entry by itself
		results.forEach(result => {
			result.indexEntries = result.indexEntries.filter(entry => {
				return this._isValidTypeAndAttributeAndTime(restriction, entry)
			})
		})

		// now filter all ids that are in all of the search words
		let matchingIds: ?Id[] = null
		results.forEach(keyToIndexEntry => {
			if (!matchingIds) {
				matchingIds = keyToIndexEntry.indexEntries.map(entry => entry.id)
			} else {
				matchingIds = matchingIds.filter(id => {
					return keyToIndexEntry.indexEntries.find(entry => entry.id == id)
				})
			}
		})
		return results.map(r => {
			return {
				indexKey: r.indexKey,
				indexEntries: r.indexEntries.filter(entry => neverNull(matchingIds).find(id => entry.id == id))
			}
		})
	}

	_isValidTypeAndAttributeAndTime(restriction: SearchRestriction, entry: SearchIndexEntry): boolean {
		let typeInfo = typeRefToTypeInfo(restriction.type)
		if (typeInfo.appId != entry.app || typeInfo.typeId != entry.type) {
			return false
		}
		if (restriction.attributeIds) {
			if (!contains(restriction.attributeIds, entry.attribute)) {
				return false
			}
		}
		if (restriction.start) {
			// timestampToGeneratedId provides the lowest id with the given timestamp (server id and counter set to 0), so we add one millisecond to make sure all ids of the timestamp are covered
			let maxExcluded = timestampToGeneratedId(restriction.start + 1)
			if (!firstBiggerThanSecond(maxExcluded, entry.id)) {
				return false
			}
		}
		if (restriction.end) {
			let minIncluded = timestampToGeneratedId(restriction.end)
			if (firstBiggerThanSecond(minIncluded, entry.id)) {
				return false
			}
		}
		return true
	}

	_reduceWords(results: KeyToIndexEntries[], matchWordOrder: boolean): SearchIndexEntry[] {
		if (matchWordOrder) {
			return results[0].indexEntries.filter(firstWordEntry => {
				// reduce the filtered positions for this first word entry and its attribute with each next word to those that are in order
				let filteredPositions = firstWordEntry.positions.slice()
				for (let i = 1; i < results.length; i++) {
					let entry = results[i].indexEntries.find(e => e.id == firstWordEntry.id && e.attribute == firstWordEntry.attribute)
					if (entry) {
						filteredPositions = filteredPositions.filter(firstWordPosition => neverNull(entry).positions.find(position => position == firstWordPosition + i))
					} else {
						// the id was probably not found for the same attribute as the current filtered positions, so we could not find all words in order in the same attribute
						filteredPositions = []
					}
				}
				return filteredPositions.length > 0
			})
		} else {
			// all ids must appear in all words now, so we can use any of the entries lists
			return results[0].indexEntries
		}
	}

	_reduceToUniqueElementIds(results: SearchIndexEntry[]): SearchIndexEntry[] {
		let uniqueIds = {}
		return results.filter(entry => {
			if (!uniqueIds[entry.id]) {
				uniqueIds[entry.id] = true
				return true
			} else {
				return false
			}
		})
	}

	_filterByListIdAndGroupSearchResults(query: string, restriction: SearchRestriction, results: SearchIndexEntry[]): Promise<SearchResult> {
		return Promise.reduce(results, (searchResult, entry: SearchIndexEntry) => {
			let transaction = this._db.dbFacade.createTransaction(true, [ElementDataOS])
			return transaction.get(ElementDataOS, neverNull(entry.encId)).then((elementData: ElementData) => {
				let safeSearchResult = neverNull(searchResult)
				if (!restriction.listId || restriction.listId == elementData[0]) {
					safeSearchResult.results.push([elementData[0], entry.id])
				}
				return searchResult
			})
		}, {
			query,
			restriction,
			results: [],
			currentIndexTimestamp: this._getSearchTimestamp(restriction)
		})
	}


	_getSearchTimestamp(restriction: ?SearchRestriction): number {
		if (!restriction || isSameTypeRef(MailTypeRef, restriction.type)) {
			return this._mailIndexer.currentIndexTimestamp == NOTHING_INDEXED_TIMESTAMP ? new Date().getTime() : this._mailIndexer.currentIndexTimestamp
		} else {
			return FULL_INDEXED_TIMESTAMP
		}
	}
}


type TypeInfo ={
	appId: number;
	typeId: number;
	attributeIds: number[];
}

const typeInfos = {
	"tutanota|Mail": {
		appId: 1,
		typeId: MailModel.id,
		attributeIds: getAttributeIds(MailModel)
	},
	"tutanota|Contact": {
		appId: 1,
		typeId: ContactModel.id,
		attributeIds: getAttributeIds(ContactModel)
	},
	"sys|GroupInfo": {
		appId: 0,
		typeId: GroupInfoModel.id,
		attributeIds: getAttributeIds(GroupInfoModel)
	}
}

function typeRefToTypeInfo(typeRef: TypeRef<any>): TypeInfo {
	return typeInfos[typeRef.app + "|" + typeRef.type]
}

function getAttributeIds(model: TypeModel) {
	return Object.keys(model.values).map(name => model.values[name].id).concat(Object.keys(model.associations).map(name => model.associations[name].id))
}
