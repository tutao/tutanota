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
	SearchIndexEntry
} from "./SearchTypes"
import {encryptIndexKey, decryptSearchIndexEntry} from "./IndexUtils"
import type {Indexer} from "./Indexer"
import {INDEX_TIMESTAMP_MAX, INDEX_TIMESTAMP_MIN} from "../../common/TutanotaConstants"
import {timestampToGeneratedId} from "../../common/utils/Encoding"

export class SearchFacade {
	_indexer: Indexer;

	constructor(indexer: Indexer) {
		this._indexer = indexer
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
		let indexingPromise = Promise.resolve()
		if (restriction && isSameTypeRef(MailTypeRef, restriction.type)) {
			indexingPromise = this._indexer.mailboxIndexingPromise
		}
		return indexingPromise.then(() => this._findIndexEntries(searchTokens)
				.then(results => this._filterByEncryptedId(results))
				.then(results => this._decryptSearchResult(results))
				.then(results => this._filterByTypeAndAttributeAndTime(results, restriction))
				.then(results => this._filterByListIdAndGroupSearchResults(query, restriction, results))
			// ranking ->all tokens are in correct order in the same attribute
		)
	}

	_findIndexEntries(searchTokens: string[]): Promise<KeyToEncryptedIndexEntries[]> {
		let transaction = this._indexer.db.dbFacade.createTransaction(true, [SearchIndexOS])
		return Promise.map(searchTokens, (token) => {
			let indexKey = encryptIndexKey(this._indexer.db.key, token)
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
				indexEntries: searchResult.indexEntries.map(entry => decryptSearchIndexEntry(this._indexer.db.key, entry))
			}
		})
	}


	_filterByTypeAndAttributeAndTime(results: KeyToIndexEntries[], restriction: SearchRestriction): SearchIndexEntry[] {
		let indexEntries = null
		results.forEach(r => {
			let currentIndexEntries = r.indexEntries.filter(entry => {
				return this._isValidTypeAndAttributeAndTime(restriction, entry)
			})
			if (indexEntries == null) {
				indexEntries = currentIndexEntries
			} else {
				indexEntries = indexEntries.filter(e1 => {
					return currentIndexEntries.find(e2 => e1.id == e2.id) != null
				})
			}
		})
		if (indexEntries) {
			return indexEntries
		} else {
			return []
		}
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

	_filterByListIdAndGroupSearchResults(query: string, restriction: SearchRestriction, results: SearchIndexEntry[]): Promise<SearchResult> {
		let uniqueIds = {}
		let searchIndexTimestamp = new Date().getTime()
		if (this._indexer.currentIndexTimestamp == searchIndexTimestamp) {
			searchIndexTimestamp = this._indexer.currentIndexTimestamp
		}
		return Promise.reduce(results, (searchResult, entry: SearchIndexEntry, index) => {
			//console.log(entry)
			let transaction = this._indexer.db.dbFacade.createTransaction(true, [ElementDataOS])
			return transaction.get(ElementDataOS, neverNull(entry.encId)).then((elementData: ElementData) => {
				let safeSearchResult = neverNull(searchResult)
				if (!uniqueIds[entry.id] && (!restriction.listId || restriction.listId == elementData[0])) {
					uniqueIds[entry.id] = true
					if (entry.type == MailModel.id) {
						safeSearchResult.mails.push([elementData[0], entry.id])
					} else if (entry.type == ContactModel.id) {
						safeSearchResult.contacts.push([elementData[0], entry.id])
					} else if (entry.type == GroupInfoModel.id) {
						safeSearchResult.groupInfos.push([elementData[0], entry.id])
					}
				}
				return searchResult
			})
		}, {
			query,
			restriction,
			mails: [],
			contacts: [],
			groupInfos: [],
			currentIndexTimestamp: this._getSearchTimestamp(restriction)
		})
	}


	_getSearchTimestamp(restriction: ?SearchRestriction): number {
		if (!restriction || isSameTypeRef(MailTypeRef, restriction.type)) {
			return this._indexer.currentIndexTimestamp == INDEX_TIMESTAMP_MAX ? new Date().getTime() : this._indexer.currentIndexTimestamp
		} else {
			return INDEX_TIMESTAMP_MIN
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
