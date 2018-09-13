//@flow
import {_TypeModel as MailModel, MailTypeRef} from "../../entities/tutanota/Mail"
import {_TypeModel as ContactModel} from "../../entities/tutanota/Contact"
import {_TypeModel as GroupInfoModel} from "../../entities/sys/GroupInfo"
import {_TypeModel as WhitelabelChildModel} from "../../entities/sys/WhitelabelChild"
import {ElementDataOS, SearchIndexOS} from "./DbFacade"
import {
	compareNewestFirst,
	firstBiggerThanSecond,
	isSameTypeRef,
	resolveTypeReference,
	TypeRef
} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {arrayHash, contains} from "../../common/utils/ArrayUtils"
import {asyncFind, neverNull} from "../../common/utils/Utils"
import type {
	Db,
	ElementData,
	EncryptedSearchIndexEntry,
	KeyToEncryptedIndexEntries,
	KeyToIndexEntries,
	SearchIndexEntry
} from "./SearchTypes"
import {decryptSearchIndexEntry, encryptIndexKeyBase64, getPerformanceTimestamp} from "./IndexUtils"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {timestampToGeneratedId, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {MailIndexer} from "./MailIndexer"
import {LoginFacade} from "../facades/LoginFacade"
import {getStartOfDay} from "../../common/utils/DateUtils"
import {SuggestionFacade} from "./SuggestionFacade"
import {load} from "../EntityWorker"
import EC from "../../common/EntityConstants"
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"

const ValueType = EC.ValueType
const Cardinality = EC.Cardinality
const AssociationType = EC.AssociationType

export class SearchFacade {
	_loginFacade: LoginFacade;
	_db: Db;
	_mailIndexer: MailIndexer;
	_suggestionFacades: SuggestionFacade<any>[];

	constructor(loginFacade: LoginFacade, db: Db, mailIndexer: MailIndexer, suggestionFacades: SuggestionFacade<any>[]) {
		this._loginFacade = loginFacade
		this._db = db
		this._mailIndexer = mailIndexer
		this._suggestionFacades = suggestionFacades
	}

	/****************************** SEARCH ******************************/

	/**
	 * Invoke an AND-query.
	 * @param query is tokenized. All tokens must be matched by the result (AND-query)
	 * @param minSuggestionCount If minSuggestionCount > 0 regards the last query token as suggestion token and includes suggestion results for that token, but not less than minSuggestionCount
	 * @returns The result ids are sorted by id from newest to oldest
	 */
	search(query: string, restriction: SearchRestriction, minSuggestionCount: number): Promise<SearchResult> {
		return this._db.initialized.then(() => {
			let searchTokens = tokenize(query)

			let result = {
				query,
				restriction,
				results: [],
				currentIndexTimestamp: this._getSearchEndTimestamp(restriction)
			}
			if (searchTokens.length > 0) {
				let matchWordOrder = searchTokens.length > 1 && query.startsWith("\"") && query.endsWith("\"")
				let isFirstWordSearch = searchTokens.length === 1
				let suggestionFacade = this._suggestionFacades.find(f => isSameTypeRef(f.type, restriction.type))
				let searchPromise
				if (minSuggestionCount > 0 && isFirstWordSearch && suggestionFacade) {
					searchPromise = this._addSuggestions(searchTokens[0], suggestionFacade, minSuggestionCount, result)
					                    .then(() => {
						                    if (result.results.length < minSuggestionCount) {
							                    // there may be fields that are not indexed with suggestions but which we can find with the normal search
							                    // TODO: let suggestion facade and search facade know which fields are indexed with suggestions, so that we 1) know if we also have to search normally and 1) in which fields we have to search for second word suggestions because now we would also find words of non-suggestion fields as second words
							                    return this._searchForTokens(searchTokens, matchWordOrder, result)
						                    }
					                    })
				} else if (minSuggestionCount > 0 && !isFirstWordSearch && suggestionFacade) {
					let suggestionToken = searchTokens[searchTokens.length - 1]
					searchPromise = this._searchForTokens(searchTokens.slice(0, searchTokens.length - 1),
						matchWordOrder, result).then(() => {
						// we now filter for the suggestion token manually because searching for suggestions for the last word and reducing the initial search result with them can lead to
						// dozens of searches without any effect when the seach token is found in too many contacts, e.g. in the email address with the ending "de"
						result.results.sort(compareNewestFirst)
						return this._loadAndReduce(restriction, result.results, suggestionToken, minSuggestionCount)
						           .then(filteredResults => {
							           result.results = filteredResults
						           })
					})
				} else {
					searchPromise = this._searchForTokens(searchTokens, matchWordOrder, result)
				}

				return searchPromise.then(() => {
					result.results.sort(compareNewestFirst)
					return result
				})
			} else {
				return Promise.resolve(result)
			}
		})
	}

	_loadAndReduce(restriction: SearchRestriction, results: IdTuple[], suggestionToken: string, minSuggestionCount: number): Promise<IdTuple[]> {
		if (results.length > 0) {
			return resolveTypeReference(restriction.type).then(model => {
				// TODO enable when loadMultiple is supported by cache
				// if (restriction.listId) {
				// 	let result: IdTuple[] = []
				// 	// we can load multiple at once because they have the same list id
				// 	return executeInGroups(results, minSuggestionCount, idTuples => {
				// 		return loadMultiple(restriction.type, idTuples[0][0], idTuples.map(t => t[1])).filter(entity => {
				// 			return this._containsSuggestionToken(entity, model, restriction.attributeIds, suggestionToken)
				// 		}).then(filteredEntityGroup => {
				// 			addAll(result, filteredEntityGroup.map(entity => entity._id))
				// 			return result.length < minSuggestionCount
				// 		})
				// 	}).then(() => {
				// 		return result
				// 	})
				// } else {
				// load one by one
				return Promise.reduce(results, (finalResults, result) => {
					if (finalResults.length >= minSuggestionCount) {
						return finalResults
					} else {
						return load(restriction.type, result).then(entity => {
							return this._containsSuggestionToken(entity, model, restriction.attributeIds, suggestionToken)
							           .then(found => {
								           if (found) {
									           finalResults.push(result)
								           }
								           return finalResults
							           })
						}).catch(NotFoundError, e => {
							return finalResults
						}).catch(NotAuthorizedError, e => {
							return finalResults
						})
					}
				}, [])
				// }
			})
		} else {
			return Promise.resolve([])
		}
	}

	/**
	 * Looks for a word in any of the entities string values or aggregations string values that starts with suggestionToken.
	 * @param attributeIds Only looks in these attribute ids (or all its string values if it is an aggregation attribute id. If null, looks in all string values and aggregations.
	 */
	_containsSuggestionToken(entity: Object, model: TypeModel, attributeIds: ?number[], suggestionToken: string): Promise<boolean> {
		let attributeNames: string[]
		if (!attributeIds) {
			attributeNames = Object.keys(model.values).concat(Object.keys(model.associations))
		} else {
			attributeNames = attributeIds.map(id => neverNull(
				Object.keys(model.values).find(valueName => model.values[valueName].id === id) ||
				Object.keys(model.associations).find(associationName => model.associations[associationName].id === id)
			))
		}
		return asyncFind(attributeNames, attributeName => {
			if (model.values[attributeName] && model.values[attributeName].type === ValueType.String
				&& entity[attributeName]) {
				let words = tokenize(entity[attributeName])
				return Promise.resolve((words.find(w => w.startsWith(suggestionToken))) != null)
			} else if (model.associations[attributeName]
				&& model.associations[attributeName].type === AssociationType.Aggregation && entity[attributeName]) {
				let aggregates = (model.associations[attributeName].cardinality === Cardinality.Any) ?
					entity[attributeName] : [entity[attributeName]]
				return resolveTypeReference(new TypeRef(model.app, model.associations[attributeName].refType))
					.then(refModel => {
						return asyncFind(aggregates, aggregate => {
							return this._containsSuggestionToken(aggregate, refModel, null, suggestionToken)
						}).then(found => found != null)
					})
			} else {
				return Promise.resolve(false)
			}
		}).then(found => found != null)
	}

	/**
	 * Adds the found ids to the given search result
	 */
	_searchForTokens(searchTokens: string[], matchWordOrder: boolean, searchResult: SearchResult): Promise<void> {
		return this._tryExtendIndex(searchResult.restriction).then(() =>
			this._findIndexEntries(searchTokens)
			    .then(keyToEncryptedIndexEntries => this._filterByEncryptedId(keyToEncryptedIndexEntries))
			    .then(keyToEncryptedIndexEntries => this._decryptSearchResult(keyToEncryptedIndexEntries))
			    .then(keyToIndexEntries => this._filterByTypeAndAttributeAndTime(keyToIndexEntries, searchResult.restriction))
			    .then(keyToIndexEntries => this._reduceWords(keyToIndexEntries, matchWordOrder))
			    .then(searchIndexEntries => this._reduceToUniqueElementIds(searchIndexEntries, searchResult))
			    .then(searchIndexEntries => this._filterByListIdAndGroupSearchResults(searchIndexEntries, searchResult))
		)
	}

	/**
	 * Adds suggestions for the given searchToken to the searchResult until at least minSuggestionCount results are existing
	 */
	_addSuggestions(searchToken: string, suggestionFacade: SuggestionFacade<any>, minSuggestionCount: number, searchResult: SearchResult): Promise<void> {
		let suggestions = suggestionFacade.getSuggestions(searchToken)
		return Promise.each(suggestions, suggestion => {
			if (searchResult.results.length < minSuggestionCount) {
				return this._searchForTokens([suggestion], false, searchResult)
			}
		}).return()
	}


	_tryExtendIndex(restriction: SearchRestriction): Promise<void> {
		if (isSameTypeRef(MailTypeRef, restriction.type)) {
			return this._mailIndexer.mailboxIndexingPromise.then(() => {
				if (this._mailIndexer.currentIndexTimestamp > FULL_INDEXED_TIMESTAMP && restriction.end
					&& this._mailIndexer.currentIndexTimestamp > restriction.end) {
					this._mailIndexer.indexMailboxes(this._loginFacade.getLoggedInUser(), getStartOfDay(new Date(neverNull(restriction.end)))
						.getTime())
					return this._mailIndexer.mailboxIndexingPromise
				}
			})
		} else {
			return Promise.resolve()
		}
	}

	_findIndexEntries(searchTokens: string[]): Promise<KeyToEncryptedIndexEntries[]> {
		return this._db.dbFacade.createTransaction(true, [SearchIndexOS]).then(transaction => {
			return Promise.map(searchTokens, (token) => {
				let indexKey = encryptIndexKeyBase64(this._db.key, token)
				return transaction.getAsList(SearchIndexOS, indexKey)
				                  .then((indexEntries: EncryptedSearchIndexEntry[]) => {
					                  return {
						                  indexKey,
						                  indexEntries: indexEntries.map(ie => ({
							                  encEntry: ie,
							                  idHash: arrayHash(ie[0])
						                  }))
					                  }
				                  })
			})
		})
	}

	/**
	 * Reduces the search result by filtering out all mailIds that don't match all search tokens
	 */
	_filterByEncryptedId(results: KeyToEncryptedIndexEntries[]): KeyToEncryptedIndexEntries[] {
		// let matchingEncIds = null
		let matchingEncIds: Set<number>
		results.forEach(keyToEncryptedIndexEntry => {
			if (matchingEncIds == null) {
				matchingEncIds = new Set(keyToEncryptedIndexEntry.indexEntries.map(entry => entry.idHash))
			} else {
				let filtered = new Set()
				keyToEncryptedIndexEntry.indexEntries.forEach(indexEntry => {
					if (matchingEncIds.has(indexEntry.idHash)) {
						filtered.add(indexEntry.idHash)
					}
				})
				matchingEncIds = filtered
			}
		})
		return results.map(r => {
			return {
				indexKey: r.indexKey,
				indexEntries: r.indexEntries.filter(entry => matchingEncIds.has(entry.idHash))
			}
		})
	}


	_decryptSearchResult(results: KeyToEncryptedIndexEntries[]): KeyToIndexEntries[] {
		return results.map(searchResult => {
			return {
				indexKey: searchResult.indexKey,
				indexEntries: searchResult.indexEntries.map(entry => decryptSearchIndexEntry(this._db.key, entry.encEntry))
			}
		})
	}


	_filterByTypeAndAttributeAndTime(results: KeyToIndexEntries[], restriction: SearchRestriction): KeyToIndexEntries[] {
		// first filter each index entry by itself
		let endTimestamp = this._getSearchEndTimestamp(restriction)
		const minIncludedId = timestampToGeneratedId(endTimestamp)
		const maxExcludedId = restriction.start ? timestampToGeneratedId(restriction.start + 1) : null
		results.forEach(result => {
			result.indexEntries = result.indexEntries.filter(entry => {
				return this._isValidTypeAndAttributeAndTime(restriction, entry, minIncludedId, maxExcludedId)
			})
		})

		// now filter all ids that are in all of the search words
		let matchingIds: Set<Id>
		results.forEach(keyToIndexEntry => {
			if (!matchingIds) {
				matchingIds = new Set(keyToIndexEntry.indexEntries.map(entry => entry.id))
			} else {
				let filtered = new Set()
				keyToIndexEntry.indexEntries.forEach(entry => {
					if (matchingIds.has(entry.id)) {
						filtered.add(entry.id)
					}
				})
				matchingIds = filtered
			}
		})
		return results.map(r => {
			return {
				indexKey: r.indexKey,
				indexEntries: r.indexEntries.filter(entry => matchingIds.has(entry.id))
			}
		})
	}

	_isValidTypeAndAttributeAndTime(restriction: SearchRestriction, entry: SearchIndexEntry, minIncludedId: Id,
	                                maxExcludedId: ?Id): boolean {
		let typeInfo = typeRefToTypeInfo(restriction.type)
		if (typeInfo.appId !== entry.app || typeInfo.typeId !== entry.type) {
			return false
		}
		if (restriction.attributeIds) {
			if (!contains(restriction.attributeIds, entry.attribute)) {
				return false
			}
		}
		if (maxExcludedId) {
			// timestampToGeneratedId provides the lowest id with the given timestamp (server id and counter set to 0),
			// so we add one millisecond to make sure all ids of the timestamp are covered
			if (!firstBiggerThanSecond(maxExcludedId, entry.id)) {
				return false
			}
		}
		if (firstBiggerThanSecond(minIncludedId, entry.id)) {
			return false
		}
		return true
	}

	_reduceWords(results: KeyToIndexEntries[], matchWordOrder: boolean): SearchIndexEntry[] {
		if (matchWordOrder) {
			return results[0].indexEntries.filter(firstWordEntry => {
				// reduce the filtered positions for this first word entry and its attribute with each next word to those that are in order
				let filteredPositions = firstWordEntry.positions.slice()
				for (let i = 1; i < results.length; i++) {
					let entry = results[i].indexEntries.find(e => e.id === firstWordEntry.id
						&& e.attribute === firstWordEntry.attribute)
					if (entry) {
						filteredPositions = filteredPositions.filter(firstWordPosition => neverNull(entry)
							.positions
							.find(position => position === firstWordPosition + i))
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

	_reduceToUniqueElementIds(results: SearchIndexEntry[], previousResult: SearchResult): SearchIndexEntry[] {
		let uniqueIds = {}
		return results.filter(entry => {
			if (!uniqueIds[entry.id] && !previousResult.results.find(r => r[1] === entry.id)) {
				uniqueIds[entry.id] = true
				return true
			} else {
				return false
			}
		})
	}

	_filterByListIdAndGroupSearchResults(results: SearchIndexEntry[], searchResult: SearchResult): Promise<void> {
		return this._db.dbFacade.createTransaction(true, [ElementDataOS]).then((transaction) => {
			return Promise.map(results, entry => {
				return transaction.get(ElementDataOS, uint8ArrayToBase64(neverNull(entry.encId)))
				                  .then((elementData: ElementData) => {
					                  if (!searchResult.restriction.listId
						                  || searchResult.restriction.listId === elementData[0]) {
						                  searchResult.results.push([elementData[0], entry.id])
					                  }
				                  })
			}, {concurrency: 5})
		}).return()
	}


	_getSearchEndTimestamp(restriction: SearchRestriction): number {
		if (restriction.end) {
			return restriction.end
		} else if (isSameTypeRef(MailTypeRef, restriction.type)) {
			return this._mailIndexer.currentIndexTimestamp === NOTHING_INDEXED_TIMESTAMP
				? Date.now() : this._mailIndexer.currentIndexTimestamp
		} else {
			return FULL_INDEXED_TIMESTAMP
		}
	}
}


type TypeInfo = {
	appId: number;
	typeId: number;
	attributeIds: number[];
}

const typeInfos = {
	tutanota: {
		Mail: {
			appId: 1,
			typeId: MailModel.id,
			attributeIds: getAttributeIds(MailModel)
		},
		Contact: {
			appId: 1,
			typeId: ContactModel.id,
			attributeIds: getAttributeIds(ContactModel)
		}
	},
	sys: {
		GroupInfo: {
			appId: 0,
			typeId: GroupInfoModel.id,
			attributeIds: getAttributeIds(GroupInfoModel)
		},
		WhitelabelChild: {
			appId: 0,
			typeId: WhitelabelChildModel.id,
			attributeIds: getAttributeIds(WhitelabelChildModel)
		}
	}
}

function typeRefToTypeInfo(typeRef: TypeRef<any>): TypeInfo {
	return typeInfos[typeRef.app][typeRef.type]
}

function getAttributeIds(model: TypeModel) {
	return Object.keys(model.values)
	             .map(name => model.values[name].id)
	             .concat(Object.keys(model.associations).map(name => model.associations[name].id))
}
