//@flow
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {DbTransaction} from "./DbFacade"
import {resolveTypeReference} from "../../common/EntityFunctions"
import {tokenize} from "./Tokenizer"
import {arrayHash, contains, flat} from "../../common/utils/ArrayUtils"
import {asyncFind, defer, downcast, neverNull} from "../../common/utils/Utils"
import type {
	Db,
	DecryptedSearchIndexEntry,
	ElementDataDbRow,
	EncryptedSearchIndexEntry,
	EncryptedSearchIndexEntryWithHash,
	KeyToEncryptedIndexEntries,
	KeyToIndexEntries,
	MoreResultsIndexEntry,
	SearchIndexEntry,
	SearchIndexMetaDataDbRow,
	SearchIndexMetadataEntry,
	SearchIndexMetaDataRow,
	SearchRestriction,
	SearchResult
} from "./SearchTypes"
import type {TypeInfo} from "./IndexUtils"
import {
	decryptMetaData,
	decryptSearchIndexEntry,
	encryptIndexKeyBase64,
	getIdFromEncSearchIndexEntry,
	getPerformanceTimestamp,
	markEnd,
	markStart,
	printMeasure,
	typeRefToTypeInfo
} from "./IndexUtils"
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {timestampToGeneratedId, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {INITIAL_MAIL_INDEX_INTERVAL_DAYS, MailIndexer} from "./MailIndexer"
import {LoginFacade} from "../facades/LoginFacade"
import {SuggestionFacade} from "./SuggestionFacade"
import {load} from "../EntityWorker"
import {AssociationType, Cardinality, ValueType} from "../../common/EntityConstants"
import {NotAuthorizedError, NotFoundError} from "../../common/error/RestError"
import {iterateBinaryBlocks} from "./SearchIndexEncoding"
import {getDayShifted, getStartOfDay} from "../../common/utils/DateUtils"
import type {PromiseMapFn} from "../../common/utils/PromiseUtils"
import {ofClass, promiseMap, promiseMapCompat} from "../../common/utils/PromiseUtils"
import type {BrowserData} from "../../../misc/ClientConstants"
import {compareNewestFirst, firstBiggerThanSecond} from "../../common/utils/EntityUtils";
import {isSameTypeRef, TypeRef} from "../../common/utils/TypeRef";
import {ElementDataOS, SearchIndexMetaDataOS, SearchIndexOS, SearchIndexWordsIndex} from "./Indexer"
import type {TypeModel} from "../../common/EntityTypes"

type RowsToReadForIndexKey = {indexKey: string, rows: Array<SearchIndexMetadataEntry>}

export class SearchFacade {
	_loginFacade: LoginFacade;
	_db: Db;
	_mailIndexer: MailIndexer;
	_suggestionFacades: SuggestionFacade<any>[];
	_promiseMapCompat: PromiseMapFn;

	constructor(loginFacade: LoginFacade, db: Db, mailIndexer: MailIndexer, suggestionFacades: SuggestionFacade<any>[], browserData: BrowserData) {
		this._loginFacade = loginFacade
		this._db = db
		this._mailIndexer = mailIndexer
		this._suggestionFacades = suggestionFacades
		this._promiseMapCompat = promiseMapCompat(browserData.needsMicrotaskHack)
	}

	/****************************** SEARCH ******************************/

	/**
	 * Invoke an AND-query.
	 * @param query is tokenized. All tokens must be matched by the result (AND-query)
	 * @param minSuggestionCount If minSuggestionCount > 0 regards the last query token as suggestion token and includes suggestion results for that token, but not less than minSuggestionCount
	 * @returns The result ids are sorted by id from newest to oldest
	 */
	search(query: string, restriction: SearchRestriction, minSuggestionCount: number, maxResults: ?number): Promise<SearchResult> {
		return this._db.initialized.then(() => {
			let searchTokens = tokenize(query)


			let result: SearchResult = {
				query,
				restriction,
				results: [],
				currentIndexTimestamp: this._getSearchEndTimestamp(restriction),
				moreResultsEntries: [],
				lastReadSearchIndexRow: searchTokens.map((token) => [token, null]),
				matchWordOrder: searchTokens.length > 1 && query.startsWith("\"") && query.endsWith("\""),
				moreResults: []
			}
			if (searchTokens.length > 0) {
				let isFirstWordSearch = searchTokens.length === 1
				let before = getPerformanceTimestamp()
				let suggestionFacade = this._suggestionFacades.find(f => isSameTypeRef(f.type, restriction.type))
				let searchPromise
				if (minSuggestionCount > 0 && isFirstWordSearch && suggestionFacade) {
					let addSuggestionBefore = getPerformanceTimestamp()
					searchPromise = this._addSuggestions(searchTokens[0], suggestionFacade, minSuggestionCount, result)
					                    .then(() => {
						                    if (result.results.length < minSuggestionCount) {
							                    // there may be fields that are not indexed with suggestions but which we can find with the normal search
							                    // TODO: let suggestion facade and search facade know which fields are
							                    // indexed with suggestions, so that we
							                    // 1) know if we also have to search normally and
							                    // 2) in which fields we have to search for second word suggestions because now we would also find words of non-suggestion fields as second words
							                    let searchForTokensAfterSuggestionsBefore = getPerformanceTimestamp()
							                    return this._startOrContinueSearch(result)
							                               .then((result) => {
								                               return result
							                               })
						                    }
					                    })
				} else if (minSuggestionCount > 0 && !isFirstWordSearch && suggestionFacade) {
					let suggestionToken = neverNull(result.lastReadSearchIndexRow.pop())[0]
					searchPromise = this._startOrContinueSearch(result).then(() => {
						// we now filter for the suggestion token manually because searching for suggestions for the last word and reducing the initial search result with them can lead to
						// dozens of searches without any effect when the seach token is found in too many contacts, e.g. in the email address with the ending "de"
						result.results.sort(compareNewestFirst)
						return this._loadAndReduce(restriction, result, suggestionToken, minSuggestionCount)
					})
				} else {
					searchPromise = this._startOrContinueSearch(result, maxResults)
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

	async _loadAndReduce(
		restriction: SearchRestriction,
		result: SearchResult,
		suggestionToken: string,
		minSuggestionCount: number
	): Promise<void> {
		if (result.results.length > 0) {
			const model = await resolveTypeReference(restriction.type)

			// if we want the exact search order we try to find the complete sequence of words in an attribute of the instance.
			// for other cases we only check that an attribute contains a word that starts with suggestion word
			const suggestionQuery = result.matchWordOrder ? normalizeQuery(result.query) : suggestionToken
			const finalResults = []
			for (const id of result.results) {
				if (finalResults.length >= minSuggestionCount) {
					break
				} else {
					let entity
					try {
						entity = await load(restriction.type, id)
					} catch (e) {
						if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
							continue
						} else {
							throw e
						}
					}
					const found = await this._containsSuggestionToken(
						entity,
						model,
						restriction.attributeIds,
						suggestionQuery,
						result.matchWordOrder
					)
					if (found) {
						finalResults.push(id)
					}
				}
			}
			result.results = finalResults
		} else {
			return Promise.resolve()
		}
	}

	/**
	 * Looks for a word in any of the entities string values or aggregations string values that starts with suggestionToken.
	 * @param attributeIds Only looks in these attribute ids (or all its string values if it is an aggregation attribute id. If null, looks in all string values and aggregations.
	 */
	_containsSuggestionToken(entity: Object, model: TypeModel, attributeIds: ?number[], suggestionToken: string, matchWordOrder: boolean): Promise<boolean> {
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
			if (model.values[attributeName] && model.values[attributeName].type === ValueType.String && entity[attributeName]) {
				if (matchWordOrder) {
					return Promise.resolve(normalizeQuery(entity[attributeName]).indexOf(suggestionToken) !== -1)
				} else {
					let words = tokenize(entity[attributeName])
					return Promise.resolve(words.find(w => w.startsWith(suggestionToken)) != null)
				}
			} else if (model.associations[attributeName] && model.associations[attributeName].type === AssociationType.Aggregation
				&& entity[attributeName]) {
				let aggregates = (model.associations[attributeName].cardinality
					=== Cardinality.Any) ? entity[attributeName] : [entity[attributeName]]
				return resolveTypeReference(new TypeRef(model.app, model.associations[attributeName].refType))
					.then(refModel => {
						return asyncFind(aggregates, aggregate => {
							return this._containsSuggestionToken(aggregate, refModel, null, suggestionToken, matchWordOrder)
						}).then(found => found != null)
					})
			} else {
				return Promise.resolve(false)
			}
		}).then(found => found != null)
	}


	_startOrContinueSearch(searchResult: SearchResult, maxResults: ?number): Promise<void> {
		markStart("findIndexEntries")
		if (searchResult.moreResults.length === 0
			&& getStartOfDay(getDayShifted(new Date(this._mailIndexer.currentIndexTimestamp), INITIAL_MAIL_INDEX_INTERVAL_DAYS)).getTime()
			> getStartOfDay(getDayShifted(new Date(), 1))
			&& !this._mailIndexer.isIndexing) {
			this._mailIndexer.extendIndexIfNeeded(this._loginFacade.getLoggedInUser(),
				getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL_DAYS)).getTime())
		}

		let moreResultsEntries: Promise<Array<MoreResultsIndexEntry>>
		if (maxResults && searchResult.moreResults.length >= maxResults) {
			moreResultsEntries = Promise.resolve(searchResult.moreResults)
		} else {
			moreResultsEntries = this
				._findIndexEntries(searchResult, maxResults)
				.then(keyToEncryptedIndexEntries => {
					markEnd("findIndexEntries")
					markStart("_filterByEncryptedId")
					return this._filterByEncryptedId(keyToEncryptedIndexEntries)
				})
				.then(keyToEncryptedIndexEntries => {
					markEnd("_filterByEncryptedId")
					markStart("_decryptSearchResult")
					return this._decryptSearchResult(keyToEncryptedIndexEntries)
				})
				.then(keyToIndexEntries => {
					markEnd("_decryptSearchResult")
					markStart("_filterByTypeAndAttributeAndTime")
					return this._filterByTypeAndAttributeAndTime(keyToIndexEntries, searchResult.restriction)
				})
				.then(keyToIndexEntries => {
					markEnd("_filterByTypeAndAttributeAndTime")
					markStart("_reduceWords")
					return this._reduceWords(keyToIndexEntries, searchResult.matchWordOrder)
				})
				.then(searchIndexEntries => {
					markEnd("_reduceWords")
					markStart("_reduceToUniqueElementIds")
					return this._reduceToUniqueElementIds(searchIndexEntries, searchResult)
				})
				.then((additionalEntries) => {
					markEnd("_reduceToUniqueElementIds")
					return additionalEntries.concat(searchResult.moreResults)
				})
		}
		return moreResultsEntries
			.then((searchIndexEntries: MoreResultsIndexEntry[]) => {
				markStart("_filterByListIdAndGroupSearchResults")
				return this._filterByListIdAndGroupSearchResults(searchIndexEntries, searchResult, maxResults)
			})
			.then((result) => {
				markEnd("_filterByListIdAndGroupSearchResults")
				typeof self !== "undefined" && printMeasure("query: " + searchResult.query + ", maxResults: " + String(maxResults), [
					"findIndexEntries", "_filterByEncryptedId", "_decryptSearchResult", "_filterByTypeAndAttributeAndTime", "_reduceWords",
					"_reduceToUniqueElementIds", "_filterByListIdAndGroupSearchResults"
				])
				return result
			})

	}

	/**
	 * Adds suggestions for the given searchToken to the searchResult until at least minSuggestionCount results are existing
	 */
	_addSuggestions(searchToken: string, suggestionFacade: SuggestionFacade<any>, minSuggestionCount: number, searchResult: SearchResult): Promise<*> {
		let suggestions = suggestionFacade.getSuggestions(searchToken)
		return promiseMap(suggestions, suggestion => {
			if (searchResult.results.length < minSuggestionCount) {
				const suggestionResult: SearchResult = {
					query: suggestion,
					restriction: searchResult.restriction,
					results: searchResult.results,
					currentIndexTimestamp: searchResult.currentIndexTimestamp,
					moreResultsEntries: [],
					lastReadSearchIndexRow: [[suggestion, null]],
					matchWordOrder: false,
					moreResults: []
				}
				return this._startOrContinueSearch(suggestionResult)
			}
		})
	}


	_findIndexEntries(searchResult: SearchResult, maxResults: ?number): Promise<KeyToEncryptedIndexEntries[]> {
		const typeInfo = typeRefToTypeInfo(searchResult.restriction.type)
		const firstSearchTokenInfo = searchResult.lastReadSearchIndexRow[0]
		// First read all metadata to narrow time range we search in.
		return this._db.dbFacade.createTransaction(true, [SearchIndexOS, SearchIndexMetaDataOS])
		           .then(transaction => {
			           return this
				           ._promiseMapCompat(searchResult.lastReadSearchIndexRow, (tokenInfo, index) => {
					           const [searchToken] = tokenInfo
					           let indexKey = encryptIndexKeyBase64(this._db.key, searchToken, this._db.iv)
					           return transaction
						           .get(SearchIndexMetaDataOS, indexKey, SearchIndexWordsIndex)
						           .then((metaData: ?SearchIndexMetaDataDbRow) => {
							           if (!metaData) {
								           tokenInfo[1] = 0 // "we've read all" (because we don't have anything
								           // If there's no metadata for key, return empty result
								           return {id: -index, word: indexKey, rows: []}
							           }
							           return decryptMetaData(this._db.key, metaData)
						           })
				           })
				           .thenOrApply((metaRows) => {
					           // Find index entry rows in which we will search.
					           const rowsToReadForIndexKeys = this._findRowsToReadFromMetaData(firstSearchTokenInfo, metaRows, typeInfo, maxResults)

					           // Iterate each query token
					           return this._promiseMapCompat(rowsToReadForIndexKeys, (rowsToRead: RowsToReadForIndexKey) => {
						           // For each token find token entries in the rows we've found
						           return this._promiseMapCompat(rowsToRead.rows, (entry) => this._findEntriesForMetadata(transaction, entry))
						                      .thenOrApply(flat)
						                      .thenOrApply((indexEntries: EncryptedSearchIndexEntry[]) => {
							                      return indexEntries.map(entry => ({
								                      encEntry: entry,
								                      idHash: arrayHash(getIdFromEncSearchIndexEntry(entry))
							                      }))
						                      })
						                      .thenOrApply((indexEntries: EncryptedSearchIndexEntryWithHash[]) => {
							                      return {
								                      indexKey: rowsToRead.indexKey,
								                      indexEntries: indexEntries
							                      }
						                      }).value
					           }).value
				           })
				           .toPromise()
		           })
	}

	_findRowsToReadFromMetaData(firstTokenInfo: [string, ?number], safeMetaDataRows: Array<SearchIndexMetaDataRow>, typeInfo: TypeInfo, maxResults: ?number): Array<RowsToReadForIndexKey> {
		// "Leading row" narrows down time range in which we search in this iteration
		// Doesn't matter for correctness which one it is (because query is always AND) but matters for performance
		// For now arbitrarily picked first (usually it's the most specific part anyway)
		const leadingRow = safeMetaDataRows[0]
		const otherRows = safeMetaDataRows.slice(1)
		const rangeForLeadingRow = this._findRowsToRead(leadingRow, typeInfo, firstTokenInfo[1] || Number.MAX_SAFE_INTEGER, maxResults)
		const rowsForLeadingRow = [
			{
				indexKey: leadingRow.word,
				rows: rangeForLeadingRow.metaEntries
			}
		]
		firstTokenInfo[1] = rangeForLeadingRow.oldestTimestamp
		const rowsForOtherRows = otherRows.map((r) => {
			return {
				indexKey: r.word,
				rows: this._findRowsToReadByTimeRange(r, typeInfo, rangeForLeadingRow.newestRowTimestamp, rangeForLeadingRow.oldestTimestamp)
			}
		})
		return rowsForLeadingRow.concat(rowsForOtherRows)
	}

	_findEntriesForMetadata(transaction: DbTransaction, entry: SearchIndexMetadataEntry): Promise<EncryptedSearchIndexEntry[]> {
		return transaction.get(SearchIndexOS, entry.key).then((indexEntriesRow) => {
			if (!indexEntriesRow) return []
			const result = new Array(entry.size)
			iterateBinaryBlocks(indexEntriesRow, (block, s, e, iteration) => {
				result[iteration] = block
			})
			return result
		})
	}


	_findRowsToReadByTimeRange(metaData: SearchIndexMetaDataRow, typeInfo: TypeInfo, fromNewestTimestamp: number, toOldestTimestamp: number): Array<SearchIndexMetadataEntry> {
		const filteredRows = metaData.rows.filter(r => r.app === typeInfo.appId && r.type === typeInfo.typeId)
		filteredRows.reverse()
		const passedRows = []
		for (let row of filteredRows) {
			if (row.oldestElementTimestamp < fromNewestTimestamp) {
				passedRows.push(row)
				if (row.oldestElementTimestamp <= toOldestTimestamp) {
					break
				}
			}
		}
		return passedRows
	}

	_findRowsToRead(metaData: SearchIndexMetaDataRow, typeInfo: TypeInfo, mustBeOlderThan: number,
	                maxResults: ?number): {metaEntries: Array<SearchIndexMetadataEntry>, oldestTimestamp: number, newestRowTimestamp: number} {
		const filteredRows = metaData.rows.filter(r => r.app === typeInfo.appId && r.type === typeInfo.typeId)
		filteredRows.reverse()
		let entitiesToRead = 0
		let lastReadRowTimestamp = 0
		let newestRowTimestamp = Number.MAX_SAFE_INTEGER
		let rowsToRead
		if (maxResults) {
			rowsToRead = []
			for (let r of filteredRows) {
				if (r.oldestElementTimestamp < mustBeOlderThan) {
					if (entitiesToRead < 1000) {
						entitiesToRead += r.size
						lastReadRowTimestamp = r.oldestElementTimestamp
						rowsToRead.push(r)
					} else {
						break
					}
				} else {
					newestRowTimestamp = r.oldestElementTimestamp
				}
			}
		} else {
			rowsToRead = filteredRows
		}
		return {metaEntries: rowsToRead, oldestTimestamp: lastReadRowTimestamp, newestRowTimestamp: newestRowTimestamp}
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
				indexEntries: searchResult.indexEntries.map(entry => decryptSearchIndexEntry(this._db.key, entry.encEntry, this._db.iv))
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
				return this._isValidAttributeAndTime(restriction, entry, minIncludedId, maxExcludedId)
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

	_isValidAttributeAndTime(restriction: SearchRestriction, entry: SearchIndexEntry, minIncludedId: Id,
	                         maxExcludedId: ?Id): boolean {
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
		return !firstBiggerThanSecond(minIncludedId, entry.id);

	}

	_reduceWords(results: KeyToIndexEntries[], matchWordOrder: boolean): $ReadOnlyArray<DecryptedSearchIndexEntry> {
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

	_reduceToUniqueElementIds(results: $ReadOnlyArray<DecryptedSearchIndexEntry>, previousResult: SearchResult): $ReadOnlyArray<MoreResultsIndexEntry> {
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

	_filterByListIdAndGroupSearchResults(indexEntries: Array<MoreResultsIndexEntry>, searchResult: SearchResult,
	                                     maxResults: ?number): Promise<void> {
		indexEntries.sort((l, r) => compareNewestFirst(l.id, r.id))
		// We filter out everything we've processed from moreEntries, even if we didn't include it
		const {resolve: stop, promise: whenToStop} = defer()
		// downcast: Array of optional elements in not subtype of non-optional elements
		const entriesCopy: Array<?MoreResultsIndexEntry> = downcast(indexEntries.slice())
		// Results are added in the random order and we may filter some of them out. We need to sort them.
		// Use separate array to only sort new results and not all of them.
		return this
			._db.dbFacade.createTransaction(true, [ElementDataOS])
			.then((transaction) =>
				// As an attempt to optimize search we look for items in parallel. Promise.map iterates in arbitrary order!
				// BUT! we have to look at all of them! Otherwise we may return them in the wrong order. We cannot return elements 10, 15, 20 if we didn't
				// return element 5 first, no one will ask for it later.
				// The best thing performance-wise would be to split into chunks of certain length and process them in parallel and stop after certain chunk.
				promiseMap(indexEntries.slice(0, (maxResults || indexEntries.length + 1)), (entry, index) => {
					return transaction.get(ElementDataOS, uint8ArrayToBase64(entry.encId))
					                  .then((elementData: ?ElementDataDbRow) => {
						                  // mark result index id as processed to not query result in next load more operation
						                  entriesCopy[index] = null
						                  if (elementData
							                  && (!searchResult.restriction.listId
								                  || searchResult.restriction.listId === elementData[0])) {
							                  return [elementData[0], entry.id]
						                  }
						                  return null
					                  })
				}, {concurrency: 5}))
			.then((newResults) => {
				searchResult.results.push(...newResults.filter(Boolean))
				searchResult.moreResults = entriesCopy.filter(Boolean)
			})
	}

	getMoreSearchResults(searchResult: SearchResult, moreResultCount: number): Promise<void> {
		return this._startOrContinueSearch(searchResult, moreResultCount)
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


function normalizeQuery(query: string): string {
	return tokenize(query).join(" ")
}


