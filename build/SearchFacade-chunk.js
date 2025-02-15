import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import { TypeRef, arrayHash, asyncFind, contains, downcast, getDayShifted, getStartOfDay, isEmpty, isNotEmpty, isNotNull, isSameTypeRef, neverNull, ofClass, pMap, promiseMapCompat, tokenize, uint8ArrayToBase64 } from "./dist2-chunk.js";
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "./TutanotaConstants-chunk.js";
import { AssociationType, Cardinality, ValueType, compareNewestFirst, elementIdPart, firstBiggerThanSecond, getListId, timestampToGeneratedId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { MailTypeRef } from "./TypeRefs-chunk.js";
import "./TypeModels2-chunk.js";
import "./ParserCombinator-chunk.js";
import { resolveTypeReference } from "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import { NotAuthorizedError, NotFoundError } from "./RestError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./dist3-chunk.js";
import "./MailChecks-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./CommonMailUtils-chunk.js";
import { ElementDataOS, SearchIndexMetaDataOS, SearchIndexOS, SearchIndexWordsIndex } from "./IndexTables-chunk.js";
import { decryptMetaData, decryptSearchIndexEntry, encryptIndexKeyBase64, getIdFromEncSearchIndexEntry, getPerformanceTimestamp, iterateBinaryBlocks, markEnd, markStart, printMeasure, typeRefToTypeInfo } from "./IndexUtils-chunk.js";
import "./SearchTypes-chunk.js";
import { INITIAL_MAIL_INDEX_INTERVAL_DAYS } from "./MailIndexer-chunk.js";

//#region src/mail-app/workerUtils/index/SearchFacade.ts
var SearchFacade = class {
	_db;
	_mailIndexer;
	_suggestionFacades;
	_promiseMapCompat;
	_entityClient;
	constructor(userFacade, db, mailIndexer, suggestionFacades, browserData, entityClient) {
		this.userFacade = userFacade;
		this._db = db;
		this._mailIndexer = mailIndexer;
		this._suggestionFacades = suggestionFacades;
		this._promiseMapCompat = promiseMapCompat(browserData.needsMicrotaskHack);
		this._entityClient = entityClient;
	}
	/****************************** SEARCH ******************************/
	/**
	* Invoke an AND-query.
	* @param query is tokenized. All tokens must be matched by the result (AND-query)
	* @param minSuggestionCount If minSuggestionCount > 0 regards the last query token as suggestion token and includes suggestion results for that token, but not less than minSuggestionCount
	* @returns The result ids are sorted by id from newest to oldest
	*/
	search(query, restriction, minSuggestionCount, maxResults) {
		return this._db.initialized.then(() => {
			let searchTokens = tokenize(query);
			let result = {
				query,
				restriction,
				results: [],
				currentIndexTimestamp: this._getSearchEndTimestamp(restriction),
				lastReadSearchIndexRow: searchTokens.map((token) => [token, null]),
				matchWordOrder: searchTokens.length > 1 && query.startsWith("\"") && query.endsWith("\""),
				moreResults: [],
				moreResultsEntries: []
			};
			if (searchTokens.length > 0) {
				let isFirstWordSearch = searchTokens.length === 1;
				let before = getPerformanceTimestamp();
				let suggestionFacade = this._suggestionFacades.find((f) => isSameTypeRef(f.type, restriction.type));
				let searchPromise;
				if (minSuggestionCount > 0 && isFirstWordSearch && suggestionFacade) {
					let addSuggestionBefore = getPerformanceTimestamp();
					searchPromise = this._addSuggestions(searchTokens[0], suggestionFacade, minSuggestionCount, result).then(() => {
						if (result.results.length < minSuggestionCount) {
							let searchForTokensAfterSuggestionsBefore = getPerformanceTimestamp();
							return this._startOrContinueSearch(result).then((result$1) => {
								return result$1;
							});
						}
					});
				} else if (minSuggestionCount > 0 && !isFirstWordSearch && suggestionFacade) {
					let suggestionToken = neverNull(result.lastReadSearchIndexRow.pop())[0];
					searchPromise = this._startOrContinueSearch(result).then(() => {
						result.results.sort(compareNewestFirst);
						return this._loadAndReduce(restriction, result, suggestionToken, minSuggestionCount);
					});
				} else searchPromise = this._startOrContinueSearch(result, maxResults);
				return searchPromise.then(() => {
					result.results.sort(compareNewestFirst);
					return result;
				});
			} else return Promise.resolve(result);
		});
	}
	async _loadAndReduce(restriction, result, suggestionToken, minSuggestionCount) {
		if (result.results.length > 0) {
			const model = await resolveTypeReference(restriction.type);
			const suggestionQuery = result.matchWordOrder ? normalizeQuery(result.query) : suggestionToken;
			const finalResults = [];
			for (const id of result.results) if (finalResults.length >= minSuggestionCount) break;
else {
				let entity;
				try {
					entity = await this._entityClient.load(restriction.type, id);
				} catch (e) {
					if (e instanceof NotFoundError || e instanceof NotAuthorizedError) continue;
else throw e;
				}
				const found = await this._containsSuggestionToken(entity, model, restriction.attributeIds, suggestionQuery, result.matchWordOrder);
				if (found) finalResults.push(id);
			}
			result.results = finalResults;
		} else return Promise.resolve();
	}
	/**
	* Looks for a word in any of the entities string values or aggregations string values that starts with suggestionToken.
	* @param attributeIds Only looks in these attribute ids (or all its string values if it is an aggregation attribute id. If null, looks in all string values and aggregations.
	*/
	_containsSuggestionToken(entity, model, attributeIds, suggestionToken, matchWordOrder) {
		let attributeNames;
		if (!attributeIds) attributeNames = Object.keys(model.values).concat(Object.keys(model.associations));
else attributeNames = attributeIds.map((id) => neverNull(Object.keys(model.values).find((valueName) => model.values[valueName].id === id) || Object.keys(model.associations).find((associationName) => model.associations[associationName].id === id)));
		return asyncFind(attributeNames, async (attributeName) => {
			if (model.values[attributeName] && model.values[attributeName].type === ValueType.String && entity[attributeName]) if (matchWordOrder) return Promise.resolve(normalizeQuery(entity[attributeName]).indexOf(suggestionToken) !== -1);
else {
				let words = tokenize(entity[attributeName]);
				return Promise.resolve(words.some((w) => w.startsWith(suggestionToken)));
			}
else if (model.associations[attributeName] && model.associations[attributeName].type === AssociationType.Aggregation && entity[attributeName]) {
				let aggregates = model.associations[attributeName].cardinality === Cardinality.Any ? entity[attributeName] : [entity[attributeName]];
				const refModel = await resolveTypeReference(new TypeRef(model.app, model.associations[attributeName].refType));
				return asyncFind(aggregates, (aggregate) => {
					return this._containsSuggestionToken(downcast(aggregate), refModel, null, suggestionToken, matchWordOrder);
				}).then((found) => found != null);
			} else return Promise.resolve(false);
		}).then((found) => found != null);
	}
	_startOrContinueSearch(searchResult, maxResults) {
		markStart("findIndexEntries");
		const nextScheduledIndexingRun = getStartOfDay(getDayShifted(new Date(this._mailIndexer.currentIndexTimestamp), INITIAL_MAIL_INDEX_INTERVAL_DAYS));
		const theDayAfterTomorrow = getStartOfDay(getDayShifted(new Date(), 1));
		if (searchResult.moreResults.length === 0 && nextScheduledIndexingRun.getTime() > theDayAfterTomorrow.getTime() && !this._mailIndexer.isIndexing) this._mailIndexer.extendIndexIfNeeded(this.userFacade.getLoggedInUser(), getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL_DAYS)).getTime());
		let moreResultsEntries;
		if (maxResults && searchResult.moreResults.length >= maxResults) moreResultsEntries = Promise.resolve(searchResult.moreResults);
else moreResultsEntries = this._findIndexEntries(searchResult, maxResults).then((keyToEncryptedIndexEntries) => {
			markEnd("findIndexEntries");
			markStart("_filterByEncryptedId");
			return this._filterByEncryptedId(keyToEncryptedIndexEntries);
		}).then((keyToEncryptedIndexEntries) => {
			markEnd("_filterByEncryptedId");
			markStart("_decryptSearchResult");
			return this._decryptSearchResult(keyToEncryptedIndexEntries);
		}).then((keyToIndexEntries) => {
			markEnd("_decryptSearchResult");
			markStart("_filterByTypeAndAttributeAndTime");
			return this._filterByTypeAndAttributeAndTime(keyToIndexEntries, searchResult.restriction);
		}).then((keyToIndexEntries) => {
			markEnd("_filterByTypeAndAttributeAndTime");
			markStart("_reduceWords");
			return this._reduceWords(keyToIndexEntries, searchResult.matchWordOrder);
		}).then((searchIndexEntries) => {
			markEnd("_reduceWords");
			markStart("_reduceToUniqueElementIds");
			return this._reduceToUniqueElementIds(searchIndexEntries, searchResult);
		}).then((additionalEntries) => {
			markEnd("_reduceToUniqueElementIds");
			return additionalEntries.concat(searchResult.moreResults);
		});
		return moreResultsEntries.then((searchIndexEntries) => {
			markStart("_filterByListIdAndGroupSearchResults");
			return this._filterByListIdAndGroupSearchResults(searchIndexEntries, searchResult, maxResults);
		}).then((result) => {
			markEnd("_filterByListIdAndGroupSearchResults");
			if (typeof self !== "undefined") printMeasure("query: " + searchResult.query + ", maxResults: " + String(maxResults), [
				"findIndexEntries",
				"_filterByEncryptedId",
				"_decryptSearchResult",
				"_filterByTypeAndAttributeAndTime",
				"_reduceWords",
				"_reduceToUniqueElementIds",
				"_filterByListIdAndGroupSearchResults"
			]);
			return result;
		});
	}
	/**
	* Adds suggestions for the given searchToken to the searchResult until at least minSuggestionCount results are existing
	*/
	_addSuggestions(searchToken, suggestionFacade, minSuggestionCount, searchResult) {
		let suggestions = suggestionFacade.getSuggestions(searchToken);
		return pMap(suggestions, (suggestion) => {
			if (searchResult.results.length < minSuggestionCount) {
				const suggestionResult = {
					query: suggestion,
					restriction: searchResult.restriction,
					results: searchResult.results,
					currentIndexTimestamp: searchResult.currentIndexTimestamp,
					lastReadSearchIndexRow: [[suggestion, null]],
					matchWordOrder: false,
					moreResults: [],
					moreResultsEntries: []
				};
				return this._startOrContinueSearch(suggestionResult);
			}
		});
	}
	_findIndexEntries(searchResult, maxResults) {
		const typeInfo = typeRefToTypeInfo(searchResult.restriction.type);
		const firstSearchTokenInfo = searchResult.lastReadSearchIndexRow[0];
		return this._db.dbFacade.createTransaction(true, [SearchIndexOS, SearchIndexMetaDataOS]).then((transaction) => {
			return this._promiseMapCompat(searchResult.lastReadSearchIndexRow, (tokenInfo, index) => {
				const [searchToken] = tokenInfo;
				let indexKey = encryptIndexKeyBase64(this._db.key, searchToken, this._db.iv);
				return transaction.get(SearchIndexMetaDataOS, indexKey, SearchIndexWordsIndex).then((metaData) => {
					if (!metaData) {
						tokenInfo[1] = 0;
						return {
							id: -index,
							word: indexKey,
							rows: []
						};
					}
					return decryptMetaData(this._db.key, metaData);
				});
			}).thenOrApply((metaRows) => {
				const rowsToReadForIndexKeys = this._findRowsToReadFromMetaData(firstSearchTokenInfo, metaRows, typeInfo, maxResults);
				return this._promiseMapCompat(rowsToReadForIndexKeys, (rowsToRead) => {
					return this._promiseMapCompat(rowsToRead.rows, (entry) => this._findEntriesForMetadata(transaction, entry)).thenOrApply((a) => a.flat()).thenOrApply((indexEntries) => {
						return indexEntries.map((entry) => ({
							encEntry: entry,
							idHash: arrayHash(getIdFromEncSearchIndexEntry(entry))
						}));
					}).thenOrApply((indexEntries) => {
						return {
							indexKey: rowsToRead.indexKey,
							indexEntries
						};
					}).value;
				}).value;
			}).toPromise();
		});
	}
	_findRowsToReadFromMetaData(firstTokenInfo, safeMetaDataRows, typeInfo, maxResults) {
		const leadingRow = safeMetaDataRows[0];
		const otherRows = safeMetaDataRows.slice(1);
		const rangeForLeadingRow = this._findRowsToRead(leadingRow, typeInfo, firstTokenInfo[1] || Number.MAX_SAFE_INTEGER, maxResults);
		const rowsForLeadingRow = [{
			indexKey: leadingRow.word,
			rows: rangeForLeadingRow.metaEntries
		}];
		firstTokenInfo[1] = rangeForLeadingRow.oldestTimestamp;
		const rowsForOtherRows = otherRows.map((r) => {
			return {
				indexKey: r.word,
				rows: this._findRowsToReadByTimeRange(r, typeInfo, rangeForLeadingRow.newestRowTimestamp, rangeForLeadingRow.oldestTimestamp)
			};
		});
		return rowsForLeadingRow.concat(rowsForOtherRows);
	}
	_findEntriesForMetadata(transaction, entry) {
		return transaction.get(SearchIndexOS, entry.key).then((indexEntriesRow) => {
			if (!indexEntriesRow) return [];
			const result = new Array(entry.size);
			iterateBinaryBlocks(indexEntriesRow, (block, s, e, iteration) => {
				result[iteration] = block;
			});
			return result;
		});
	}
	_findRowsToReadByTimeRange(metaData, typeInfo, fromNewestTimestamp, toOldestTimestamp) {
		const filteredRows = metaData.rows.filter((r) => r.app === typeInfo.appId && r.type === typeInfo.typeId);
		filteredRows.reverse();
		const passedRows = [];
		for (let row of filteredRows) if (row.oldestElementTimestamp < fromNewestTimestamp) {
			passedRows.push(row);
			if (row.oldestElementTimestamp <= toOldestTimestamp) break;
		}
		return passedRows;
	}
	_findRowsToRead(metaData, typeInfo, mustBeOlderThan, maxResults) {
		const filteredRows = metaData.rows.filter((r) => r.app === typeInfo.appId && r.type === typeInfo.typeId);
		filteredRows.reverse();
		let entitiesToRead = 0;
		let lastReadRowTimestamp = 0;
		let newestRowTimestamp = Number.MAX_SAFE_INTEGER;
		let rowsToRead;
		if (maxResults) {
			rowsToRead = [];
			for (let r of filteredRows) if (r.oldestElementTimestamp < mustBeOlderThan) if (entitiesToRead < 1e3) {
				entitiesToRead += r.size;
				lastReadRowTimestamp = r.oldestElementTimestamp;
				rowsToRead.push(r);
			} else break;
else newestRowTimestamp = r.oldestElementTimestamp;
		} else rowsToRead = filteredRows;
		return {
			metaEntries: rowsToRead,
			oldestTimestamp: lastReadRowTimestamp,
			newestRowTimestamp
		};
	}
	/**
	* Reduces the search result by filtering out all mailIds that don't match all search tokens
	*/
	_filterByEncryptedId(results) {
		let matchingEncIds = null;
		for (const keyToEncryptedIndexEntry of results) if (matchingEncIds == null) matchingEncIds = new Set(keyToEncryptedIndexEntry.indexEntries.map((entry) => entry.idHash));
else {
			const filtered = new Set();
			for (const indexEntry of keyToEncryptedIndexEntry.indexEntries) if (matchingEncIds.has(indexEntry.idHash)) filtered.add(indexEntry.idHash);
			matchingEncIds = filtered;
		}
		return results.map((r) => {
			return {
				indexKey: r.indexKey,
				indexEntries: r.indexEntries.filter((entry) => matchingEncIds?.has(entry.idHash))
			};
		});
	}
	_decryptSearchResult(results) {
		return results.map((searchResult) => {
			return {
				indexKey: searchResult.indexKey,
				indexEntries: searchResult.indexEntries.map((entry) => decryptSearchIndexEntry(this._db.key, entry.encEntry, this._db.iv))
			};
		});
	}
	_filterByTypeAndAttributeAndTime(results, restriction) {
		let endTimestamp = this._getSearchEndTimestamp(restriction);
		const minIncludedId = timestampToGeneratedId(endTimestamp);
		const maxExcludedId = restriction.start ? timestampToGeneratedId(restriction.start + 1) : null;
		for (const result of results) result.indexEntries = result.indexEntries.filter((entry) => {
			return this._isValidAttributeAndTime(restriction, entry, minIncludedId, maxExcludedId);
		});
		let matchingIds = null;
		for (const keyToIndexEntry of results) if (!matchingIds) matchingIds = new Set(keyToIndexEntry.indexEntries.map((entry) => entry.id));
else {
			let filtered = new Set();
			for (const entry of keyToIndexEntry.indexEntries) if (matchingIds.has(entry.id)) filtered.add(entry.id);
			matchingIds = filtered;
		}
		return results.map((r) => {
			return {
				indexKey: r.indexKey,
				indexEntries: r.indexEntries.filter((entry) => matchingIds?.has(entry.id))
			};
		});
	}
	_isValidAttributeAndTime(restriction, entry, minIncludedId, maxExcludedId) {
		if (restriction.attributeIds) {
			if (!contains(restriction.attributeIds, entry.attribute)) return false;
		}
		if (maxExcludedId) {
			if (!firstBiggerThanSecond(maxExcludedId, entry.id)) return false;
		}
		return !firstBiggerThanSecond(minIncludedId, entry.id);
	}
	_reduceWords(results, matchWordOrder) {
		if (matchWordOrder) return results[0].indexEntries.filter((firstWordEntry) => {
			let filteredPositions = firstWordEntry.positions.slice();
			for (let i = 1; i < results.length; i++) {
				let entry = results[i].indexEntries.find((e) => e.id === firstWordEntry.id && e.attribute === firstWordEntry.attribute);
				if (entry) filteredPositions = filteredPositions.filter((firstWordPosition) => neverNull(entry).positions.find((position) => position === firstWordPosition + i));
else filteredPositions = [];
			}
			return filteredPositions.length > 0;
		});
else return results[0].indexEntries;
	}
	_reduceToUniqueElementIds(results, previousResult) {
		const uniqueIds = new Set();
		return results.filter((entry) => {
			if (!uniqueIds.has(entry.id) && !previousResult.results.some((r) => r[1] === entry.id)) {
				uniqueIds.add(entry.id);
				return true;
			} else return false;
		});
	}
	_filterByListIdAndGroupSearchResults(indexEntries, searchResult, maxResults) {
		indexEntries.sort((l, r) => compareNewestFirst(l.id, r.id));
		const entriesCopy = downcast(indexEntries.slice());
		return this._db.dbFacade.createTransaction(true, [ElementDataOS]).then((transaction) => pMap(indexEntries.slice(0, maxResults || indexEntries.length + 1), async (entry, index) => {
			return transaction.get(ElementDataOS, uint8ArrayToBase64(entry.encId)).then((elementData) => {
				entriesCopy[index] = null;
				if (elementData) return [elementData[0], entry.id];
else return null;
			});
		}, { concurrency: 5 })).then((intermediateResults) => intermediateResults.filter(isNotNull)).then(async (intermediateResults) => {
			if (isEmpty(searchResult.restriction.folderIds)) return intermediateResults;
else {
				const mails = await Promise.all(intermediateResults.map((intermediateResultId) => this._entityClient.load(MailTypeRef, intermediateResultId).catch(ofClass(NotFoundError, () => {
					console.log(`Could not find updated mail ${JSON.stringify(intermediateResultId)}`);
					return null;
				}))));
				return mails.filter(isNotNull).filter((mail) => {
					let folderIds;
					if (isNotEmpty(mail.sets)) folderIds = mail.sets.map((setId) => elementIdPart(setId));
else folderIds = [getListId(mail)];
					return folderIds.some((folderId) => searchResult.restriction.folderIds.includes(folderId));
				}).map((mail) => mail._id);
			}
		}).then((newResults) => {
			searchResult.results.push(...newResults);
			searchResult.moreResults = entriesCopy.filter(isNotNull);
		});
	}
	async getMoreSearchResults(searchResult, moreResultCount) {
		await this._startOrContinueSearch(searchResult, moreResultCount);
		return searchResult;
	}
	_getSearchEndTimestamp(restriction) {
		if (restriction.end) return restriction.end;
else if (isSameTypeRef(MailTypeRef, restriction.type)) return this._mailIndexer.currentIndexTimestamp === NOTHING_INDEXED_TIMESTAMP ? Date.now() : this._mailIndexer.currentIndexTimestamp;
else return FULL_INDEXED_TIMESTAMP;
	}
};
function normalizeQuery(query) {
	return tokenize(query).join(" ");
}

//#endregion
export { SearchFacade };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VhcmNoRmFjYWRlLWNodW5rLmpzIiwibmFtZXMiOlsidXNlckZhY2FkZTogVXNlckZhY2FkZSIsImRiOiBEYiIsIm1haWxJbmRleGVyOiBNYWlsSW5kZXhlciIsInN1Z2dlc3Rpb25GYWNhZGVzOiBTdWdnZXN0aW9uRmFjYWRlPGFueT5bXSIsImJyb3dzZXJEYXRhOiBCcm93c2VyRGF0YSIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwicXVlcnk6IHN0cmluZyIsInJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbiIsIm1pblN1Z2dlc3Rpb25Db3VudDogbnVtYmVyIiwibWF4UmVzdWx0cz86IG51bWJlciIsInJlc3VsdDogU2VhcmNoUmVzdWx0IiwicmVzdWx0Iiwic3VnZ2VzdGlvblRva2VuOiBzdHJpbmciLCJmaW5hbFJlc3VsdHM6IElkVHVwbGVbXSIsImVudGl0eTogUmVjb3JkPHN0cmluZywgYW55PiIsIm1vZGVsOiBUeXBlTW9kZWwiLCJhdHRyaWJ1dGVJZHM6IG51bWJlcltdIHwgbnVsbCIsIm1hdGNoV29yZE9yZGVyOiBib29sZWFuIiwiYXR0cmlidXRlTmFtZXM6IHN0cmluZ1tdIiwic2VhcmNoUmVzdWx0OiBTZWFyY2hSZXN1bHQiLCJtb3JlUmVzdWx0c0VudHJpZXM6IFByb21pc2U8QXJyYXk8TW9yZVJlc3VsdHNJbmRleEVudHJ5Pj4iLCJzZWFyY2hJbmRleEVudHJpZXM6IE1vcmVSZXN1bHRzSW5kZXhFbnRyeVtdIiwic2VhcmNoVG9rZW46IHN0cmluZyIsInN1Z2dlc3Rpb25GYWNhZGU6IFN1Z2dlc3Rpb25GYWNhZGU8YW55PiIsInN1Z2dlc3Rpb25SZXN1bHQ6IFNlYXJjaFJlc3VsdCIsIm1heFJlc3VsdHM6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQiLCJtZXRhRGF0YTogU2VhcmNoSW5kZXhNZXRhRGF0YURiUm93IHwgbnVsbCIsInJvd3NUb1JlYWQ6IFJvd3NUb1JlYWRGb3JJbmRleEtleSIsImluZGV4RW50cmllczogRW5jcnlwdGVkU2VhcmNoSW5kZXhFbnRyeVtdIiwiaW5kZXhFbnRyaWVzOiBFbmNyeXB0ZWRTZWFyY2hJbmRleEVudHJ5V2l0aEhhc2hbXSIsImZpcnN0VG9rZW5JbmZvOiBbc3RyaW5nLCBudW1iZXIgfCBudWxsXSIsInNhZmVNZXRhRGF0YVJvd3M6IEFycmF5PFNlYXJjaEluZGV4TWV0YURhdGFSb3c+IiwidHlwZUluZm86IFR5cGVJbmZvIiwidHJhbnNhY3Rpb246IERiVHJhbnNhY3Rpb24iLCJlbnRyeTogU2VhcmNoSW5kZXhNZXRhZGF0YUVudHJ5IiwibWV0YURhdGE6IFNlYXJjaEluZGV4TWV0YURhdGFSb3ciLCJmcm9tTmV3ZXN0VGltZXN0YW1wOiBudW1iZXIiLCJ0b09sZGVzdFRpbWVzdGFtcDogbnVtYmVyIiwicGFzc2VkUm93czogU2VhcmNoSW5kZXhNZXRhZGF0YUVudHJ5W10iLCJtdXN0QmVPbGRlclRoYW46IG51bWJlciIsInJlc3VsdHM6IEtleVRvRW5jcnlwdGVkSW5kZXhFbnRyaWVzW10iLCJtYXRjaGluZ0VuY0lkczogU2V0PG51bWJlcj4gfCBudWxsIiwicmVzdWx0czogS2V5VG9JbmRleEVudHJpZXNbXSIsIm1hdGNoaW5nSWRzOiBTZXQ8SWQ+IHwgbnVsbCIsImVudHJ5OiBTZWFyY2hJbmRleEVudHJ5IiwibWluSW5jbHVkZWRJZDogSWQiLCJtYXhFeGNsdWRlZElkOiBJZCB8IG51bGwiLCJyZXN1bHRzOiBSZWFkb25seUFycmF5PERlY3J5cHRlZFNlYXJjaEluZGV4RW50cnk+IiwicHJldmlvdXNSZXN1bHQ6IFNlYXJjaFJlc3VsdCIsImluZGV4RW50cmllczogQXJyYXk8TW9yZVJlc3VsdHNJbmRleEVudHJ5PiIsImVudHJpZXNDb3B5OiBBcnJheTxNb3JlUmVzdWx0c0luZGV4RW50cnkgfCBudWxsPiIsImVsZW1lbnREYXRhOiBFbGVtZW50RGF0YURiUm93IHwgbnVsbCIsImZvbGRlcklkczogQXJyYXk8SWQ+IiwibW9yZVJlc3VsdENvdW50OiBudW1iZXIiXSwic291cmNlcyI6WyIuLi9zcmMvbWFpbC1hcHAvd29ya2VyVXRpbHMvaW5kZXgvU2VhcmNoRmFjYWRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRGJUcmFuc2FjdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvRGJGYWNhZGUuanNcIlxuaW1wb3J0IHsgcmVzb2x2ZVR5cGVSZWZlcmVuY2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5RnVuY3Rpb25zLmpzXCJcbmltcG9ydCB7XG5cdGFycmF5SGFzaCxcblx0YXN5bmNGaW5kLFxuXHRjb250YWlucyxcblx0ZG93bmNhc3QsXG5cdGdldERheVNoaWZ0ZWQsXG5cdGdldFN0YXJ0T2ZEYXksXG5cdGlzRW1wdHksXG5cdGlzTm90RW1wdHksXG5cdGlzTm90TnVsbCxcblx0aXNTYW1lVHlwZVJlZixcblx0bmV2ZXJOdWxsLFxuXHRvZkNsYXNzLFxuXHRwcm9taXNlTWFwLFxuXHRwcm9taXNlTWFwQ29tcGF0LFxuXHRQcm9taXNlTWFwRm4sXG5cdHRva2VuaXplLFxuXHRUeXBlUmVmLFxuXHR1aW50OEFycmF5VG9CYXNlNjQsXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHR5cGUge1xuXHREYixcblx0RGVjcnlwdGVkU2VhcmNoSW5kZXhFbnRyeSxcblx0RWxlbWVudERhdGFEYlJvdyxcblx0RW5jcnlwdGVkU2VhcmNoSW5kZXhFbnRyeSxcblx0RW5jcnlwdGVkU2VhcmNoSW5kZXhFbnRyeVdpdGhIYXNoLFxuXHRLZXlUb0VuY3J5cHRlZEluZGV4RW50cmllcyxcblx0S2V5VG9JbmRleEVudHJpZXMsXG5cdE1vcmVSZXN1bHRzSW5kZXhFbnRyeSxcblx0U2VhcmNoSW5kZXhFbnRyeSxcblx0U2VhcmNoSW5kZXhNZXRhRGF0YURiUm93LFxuXHRTZWFyY2hJbmRleE1ldGFkYXRhRW50cnksXG5cdFNlYXJjaEluZGV4TWV0YURhdGFSb3csXG5cdFNlYXJjaFJlc3RyaWN0aW9uLFxuXHRTZWFyY2hSZXN1bHQsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvU2VhcmNoVHlwZXMuanNcIlxuaW1wb3J0IHR5cGUgeyBUeXBlSW5mbyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvSW5kZXhVdGlscy5qc1wiXG5pbXBvcnQge1xuXHRkZWNyeXB0TWV0YURhdGEsXG5cdGRlY3J5cHRTZWFyY2hJbmRleEVudHJ5LFxuXHRlbmNyeXB0SW5kZXhLZXlCYXNlNjQsXG5cdGdldElkRnJvbUVuY1NlYXJjaEluZGV4RW50cnksXG5cdGdldFBlcmZvcm1hbmNlVGltZXN0YW1wLFxuXHRtYXJrRW5kLFxuXHRtYXJrU3RhcnQsXG5cdHByaW50TWVhc3VyZSxcblx0dHlwZVJlZlRvVHlwZUluZm8sXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvSW5kZXhVdGlscy5qc1wiXG5pbXBvcnQgeyBGVUxMX0lOREVYRURfVElNRVNUQU1QLCBOT1RISU5HX0lOREVYRURfVElNRVNUQU1QIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGNvbXBhcmVOZXdlc3RGaXJzdCwgZWxlbWVudElkUGFydCwgZmlyc3RCaWdnZXJUaGFuU2Vjb25kLCBnZXRMaXN0SWQsIHRpbWVzdGFtcFRvR2VuZXJhdGVkSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgSU5JVElBTF9NQUlMX0lOREVYX0lOVEVSVkFMX0RBWVMsIE1haWxJbmRleGVyIH0gZnJvbSBcIi4vTWFpbEluZGV4ZXIuanNcIlxuaW1wb3J0IHsgU3VnZ2VzdGlvbkZhY2FkZSB9IGZyb20gXCIuL1N1Z2dlc3Rpb25GYWNhZGUuanNcIlxuaW1wb3J0IHsgQXNzb2NpYXRpb25UeXBlLCBDYXJkaW5hbGl0eSwgVmFsdWVUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBOb3RBdXRob3JpemVkRXJyb3IsIE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IGl0ZXJhdGVCaW5hcnlCbG9ja3MgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL1NlYXJjaEluZGV4RW5jb2RpbmcuanNcIlxuaW1wb3J0IHR5cGUgeyBCcm93c2VyRGF0YSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9DbGllbnRDb25zdGFudHMuanNcIlxuaW1wb3J0IHR5cGUgeyBUeXBlTW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5VHlwZXMuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBVc2VyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvVXNlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBFbGVtZW50RGF0YU9TLCBTZWFyY2hJbmRleE1ldGFEYXRhT1MsIFNlYXJjaEluZGV4T1MsIFNlYXJjaEluZGV4V29yZHNJbmRleCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvSW5kZXhUYWJsZXMuanNcIlxuXG50eXBlIFJvd3NUb1JlYWRGb3JJbmRleEtleSA9IHtcblx0aW5kZXhLZXk6IHN0cmluZ1xuXHRyb3dzOiBBcnJheTxTZWFyY2hJbmRleE1ldGFkYXRhRW50cnk+XG59XG5cbmV4cG9ydCBjbGFzcyBTZWFyY2hGYWNhZGUge1xuXHRfZGI6IERiXG5cdF9tYWlsSW5kZXhlcjogTWFpbEluZGV4ZXJcblx0X3N1Z2dlc3Rpb25GYWNhZGVzOiBTdWdnZXN0aW9uRmFjYWRlPGFueT5bXVxuXHRfcHJvbWlzZU1hcENvbXBhdDogUHJvbWlzZU1hcEZuXG5cdF9lbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudFxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXNlckZhY2FkZTogVXNlckZhY2FkZSxcblx0XHRkYjogRGIsXG5cdFx0bWFpbEluZGV4ZXI6IE1haWxJbmRleGVyLFxuXHRcdHN1Z2dlc3Rpb25GYWNhZGVzOiBTdWdnZXN0aW9uRmFjYWRlPGFueT5bXSxcblx0XHRicm93c2VyRGF0YTogQnJvd3NlckRhdGEsXG5cdFx0ZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQsXG5cdCkge1xuXHRcdHRoaXMuX2RiID0gZGJcblx0XHR0aGlzLl9tYWlsSW5kZXhlciA9IG1haWxJbmRleGVyXG5cdFx0dGhpcy5fc3VnZ2VzdGlvbkZhY2FkZXMgPSBzdWdnZXN0aW9uRmFjYWRlc1xuXHRcdHRoaXMuX3Byb21pc2VNYXBDb21wYXQgPSBwcm9taXNlTWFwQ29tcGF0KGJyb3dzZXJEYXRhLm5lZWRzTWljcm90YXNrSGFjaylcblx0XHR0aGlzLl9lbnRpdHlDbGllbnQgPSBlbnRpdHlDbGllbnRcblx0fVxuXG5cdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogU0VBUkNIICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQvKipcblx0ICogSW52b2tlIGFuIEFORC1xdWVyeS5cblx0ICogQHBhcmFtIHF1ZXJ5IGlzIHRva2VuaXplZC4gQWxsIHRva2VucyBtdXN0IGJlIG1hdGNoZWQgYnkgdGhlIHJlc3VsdCAoQU5ELXF1ZXJ5KVxuXHQgKiBAcGFyYW0gbWluU3VnZ2VzdGlvbkNvdW50IElmIG1pblN1Z2dlc3Rpb25Db3VudCA+IDAgcmVnYXJkcyB0aGUgbGFzdCBxdWVyeSB0b2tlbiBhcyBzdWdnZXN0aW9uIHRva2VuIGFuZCBpbmNsdWRlcyBzdWdnZXN0aW9uIHJlc3VsdHMgZm9yIHRoYXQgdG9rZW4sIGJ1dCBub3QgbGVzcyB0aGFuIG1pblN1Z2dlc3Rpb25Db3VudFxuXHQgKiBAcmV0dXJucyBUaGUgcmVzdWx0IGlkcyBhcmUgc29ydGVkIGJ5IGlkIGZyb20gbmV3ZXN0IHRvIG9sZGVzdFxuXHQgKi9cblx0c2VhcmNoKHF1ZXJ5OiBzdHJpbmcsIHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbiwgbWluU3VnZ2VzdGlvbkNvdW50OiBudW1iZXIsIG1heFJlc3VsdHM/OiBudW1iZXIpOiBQcm9taXNlPFNlYXJjaFJlc3VsdD4ge1xuXHRcdHJldHVybiB0aGlzLl9kYi5pbml0aWFsaXplZC50aGVuKCgpID0+IHtcblx0XHRcdGxldCBzZWFyY2hUb2tlbnMgPSB0b2tlbml6ZShxdWVyeSlcblx0XHRcdGxldCByZXN1bHQ6IFNlYXJjaFJlc3VsdCA9IHtcblx0XHRcdFx0cXVlcnksXG5cdFx0XHRcdHJlc3RyaWN0aW9uLFxuXHRcdFx0XHRyZXN1bHRzOiBbXSxcblx0XHRcdFx0Y3VycmVudEluZGV4VGltZXN0YW1wOiB0aGlzLl9nZXRTZWFyY2hFbmRUaW1lc3RhbXAocmVzdHJpY3Rpb24pLFxuXHRcdFx0XHRsYXN0UmVhZFNlYXJjaEluZGV4Um93OiBzZWFyY2hUb2tlbnMubWFwKCh0b2tlbikgPT4gW3Rva2VuLCBudWxsXSksXG5cdFx0XHRcdG1hdGNoV29yZE9yZGVyOiBzZWFyY2hUb2tlbnMubGVuZ3RoID4gMSAmJiBxdWVyeS5zdGFydHNXaXRoKCdcIicpICYmIHF1ZXJ5LmVuZHNXaXRoKCdcIicpLFxuXHRcdFx0XHRtb3JlUmVzdWx0czogW10sXG5cdFx0XHRcdG1vcmVSZXN1bHRzRW50cmllczogW10sXG5cdFx0XHR9XG5cblx0XHRcdGlmIChzZWFyY2hUb2tlbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRsZXQgaXNGaXJzdFdvcmRTZWFyY2ggPSBzZWFyY2hUb2tlbnMubGVuZ3RoID09PSAxXG5cdFx0XHRcdGxldCBiZWZvcmUgPSBnZXRQZXJmb3JtYW5jZVRpbWVzdGFtcCgpXG5cblx0XHRcdFx0bGV0IHN1Z2dlc3Rpb25GYWNhZGUgPSB0aGlzLl9zdWdnZXN0aW9uRmFjYWRlcy5maW5kKChmKSA9PiBpc1NhbWVUeXBlUmVmKGYudHlwZSwgcmVzdHJpY3Rpb24udHlwZSkpXG5cblx0XHRcdFx0bGV0IHNlYXJjaFByb21pc2VcblxuXHRcdFx0XHRpZiAobWluU3VnZ2VzdGlvbkNvdW50ID4gMCAmJiBpc0ZpcnN0V29yZFNlYXJjaCAmJiBzdWdnZXN0aW9uRmFjYWRlKSB7XG5cdFx0XHRcdFx0bGV0IGFkZFN1Z2dlc3Rpb25CZWZvcmUgPSBnZXRQZXJmb3JtYW5jZVRpbWVzdGFtcCgpXG5cdFx0XHRcdFx0c2VhcmNoUHJvbWlzZSA9IHRoaXMuX2FkZFN1Z2dlc3Rpb25zKHNlYXJjaFRva2Vuc1swXSwgc3VnZ2VzdGlvbkZhY2FkZSwgbWluU3VnZ2VzdGlvbkNvdW50LCByZXN1bHQpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHJlc3VsdC5yZXN1bHRzLmxlbmd0aCA8IG1pblN1Z2dlc3Rpb25Db3VudCkge1xuXHRcdFx0XHRcdFx0XHQvLyB0aGVyZSBtYXkgYmUgZmllbGRzIHRoYXQgYXJlIG5vdCBpbmRleGVkIHdpdGggc3VnZ2VzdGlvbnMgYnV0IHdoaWNoIHdlIGNhbiBmaW5kIHdpdGggdGhlIG5vcm1hbCBzZWFyY2hcblx0XHRcdFx0XHRcdFx0Ly8gVE9ETzogbGV0IHN1Z2dlc3Rpb24gZmFjYWRlIGFuZCBzZWFyY2ggZmFjYWRlIGtub3cgd2hpY2ggZmllbGRzIGFyZVxuXHRcdFx0XHRcdFx0XHQvLyBpbmRleGVkIHdpdGggc3VnZ2VzdGlvbnMsIHNvIHRoYXQgd2Vcblx0XHRcdFx0XHRcdFx0Ly8gMSkga25vdyBpZiB3ZSBhbHNvIGhhdmUgdG8gc2VhcmNoIG5vcm1hbGx5IGFuZFxuXHRcdFx0XHRcdFx0XHQvLyAyKSBpbiB3aGljaCBmaWVsZHMgd2UgaGF2ZSB0byBzZWFyY2ggZm9yIHNlY29uZCB3b3JkIHN1Z2dlc3Rpb25zIGJlY2F1c2Ugbm93IHdlIHdvdWxkIGFsc28gZmluZCB3b3JkcyBvZiBub24tc3VnZ2VzdGlvbiBmaWVsZHMgYXMgc2Vjb25kIHdvcmRzXG5cdFx0XHRcdFx0XHRcdGxldCBzZWFyY2hGb3JUb2tlbnNBZnRlclN1Z2dlc3Rpb25zQmVmb3JlID0gZ2V0UGVyZm9ybWFuY2VUaW1lc3RhbXAoKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fc3RhcnRPckNvbnRpbnVlU2VhcmNoKHJlc3VsdCkudGhlbigocmVzdWx0KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSBpZiAobWluU3VnZ2VzdGlvbkNvdW50ID4gMCAmJiAhaXNGaXJzdFdvcmRTZWFyY2ggJiYgc3VnZ2VzdGlvbkZhY2FkZSkge1xuXHRcdFx0XHRcdGxldCBzdWdnZXN0aW9uVG9rZW4gPSBuZXZlck51bGwocmVzdWx0Lmxhc3RSZWFkU2VhcmNoSW5kZXhSb3cucG9wKCkpWzBdXG5cdFx0XHRcdFx0c2VhcmNoUHJvbWlzZSA9IHRoaXMuX3N0YXJ0T3JDb250aW51ZVNlYXJjaChyZXN1bHQpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0Ly8gd2Ugbm93IGZpbHRlciBmb3IgdGhlIHN1Z2dlc3Rpb24gdG9rZW4gbWFudWFsbHkgYmVjYXVzZSBzZWFyY2hpbmcgZm9yIHN1Z2dlc3Rpb25zIGZvciB0aGUgbGFzdCB3b3JkIGFuZCByZWR1Y2luZyB0aGUgaW5pdGlhbCBzZWFyY2ggcmVzdWx0IHdpdGggdGhlbSBjYW4gbGVhZCB0b1xuXHRcdFx0XHRcdFx0Ly8gZG96ZW5zIG9mIHNlYXJjaGVzIHdpdGhvdXQgYW55IGVmZmVjdCB3aGVuIHRoZSBzZWFjaCB0b2tlbiBpcyBmb3VuZCBpbiB0b28gbWFueSBjb250YWN0cywgZS5nLiBpbiB0aGUgZW1haWwgYWRkcmVzcyB3aXRoIHRoZSBlbmRpbmcgXCJkZVwiXG5cdFx0XHRcdFx0XHRyZXN1bHQucmVzdWx0cy5zb3J0KGNvbXBhcmVOZXdlc3RGaXJzdClcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLl9sb2FkQW5kUmVkdWNlKHJlc3RyaWN0aW9uLCByZXN1bHQsIHN1Z2dlc3Rpb25Ub2tlbiwgbWluU3VnZ2VzdGlvbkNvdW50KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VhcmNoUHJvbWlzZSA9IHRoaXMuX3N0YXJ0T3JDb250aW51ZVNlYXJjaChyZXN1bHQsIG1heFJlc3VsdHMpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gc2VhcmNoUHJvbWlzZS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRyZXN1bHQucmVzdWx0cy5zb3J0KGNvbXBhcmVOZXdlc3RGaXJzdClcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XG5cdFx0XHRcdH0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdClcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0YXN5bmMgX2xvYWRBbmRSZWR1Y2UocmVzdHJpY3Rpb246IFNlYXJjaFJlc3RyaWN0aW9uLCByZXN1bHQ6IFNlYXJjaFJlc3VsdCwgc3VnZ2VzdGlvblRva2VuOiBzdHJpbmcsIG1pblN1Z2dlc3Rpb25Db3VudDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKHJlc3VsdC5yZXN1bHRzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IG1vZGVsID0gYXdhaXQgcmVzb2x2ZVR5cGVSZWZlcmVuY2UocmVzdHJpY3Rpb24udHlwZSlcblx0XHRcdC8vIGlmIHdlIHdhbnQgdGhlIGV4YWN0IHNlYXJjaCBvcmRlciB3ZSB0cnkgdG8gZmluZCB0aGUgY29tcGxldGUgc2VxdWVuY2Ugb2Ygd29yZHMgaW4gYW4gYXR0cmlidXRlIG9mIHRoZSBpbnN0YW5jZS5cblx0XHRcdC8vIGZvciBvdGhlciBjYXNlcyB3ZSBvbmx5IGNoZWNrIHRoYXQgYW4gYXR0cmlidXRlIGNvbnRhaW5zIGEgd29yZCB0aGF0IHN0YXJ0cyB3aXRoIHN1Z2dlc3Rpb24gd29yZFxuXHRcdFx0Y29uc3Qgc3VnZ2VzdGlvblF1ZXJ5ID0gcmVzdWx0Lm1hdGNoV29yZE9yZGVyID8gbm9ybWFsaXplUXVlcnkocmVzdWx0LnF1ZXJ5KSA6IHN1Z2dlc3Rpb25Ub2tlblxuXHRcdFx0Y29uc3QgZmluYWxSZXN1bHRzOiBJZFR1cGxlW10gPSBbXVxuXG5cdFx0XHRmb3IgKGNvbnN0IGlkIG9mIHJlc3VsdC5yZXN1bHRzKSB7XG5cdFx0XHRcdGlmIChmaW5hbFJlc3VsdHMubGVuZ3RoID49IG1pblN1Z2dlc3Rpb25Db3VudCkge1xuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bGV0IGVudGl0eVxuXG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGVudGl0eSA9IGF3YWl0IHRoaXMuX2VudGl0eUNsaWVudC5sb2FkKHJlc3RyaWN0aW9uLnR5cGUsIGlkKVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvciB8fCBlIGluc3RhbmNlb2YgTm90QXV0aG9yaXplZEVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc3QgZm91bmQgPSBhd2FpdCB0aGlzLl9jb250YWluc1N1Z2dlc3Rpb25Ub2tlbihlbnRpdHksIG1vZGVsLCByZXN0cmljdGlvbi5hdHRyaWJ1dGVJZHMsIHN1Z2dlc3Rpb25RdWVyeSwgcmVzdWx0Lm1hdGNoV29yZE9yZGVyKVxuXG5cdFx0XHRcdFx0aWYgKGZvdW5kKSB7XG5cdFx0XHRcdFx0XHRmaW5hbFJlc3VsdHMucHVzaChpZClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmVzdWx0LnJlc3VsdHMgPSBmaW5hbFJlc3VsdHNcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIExvb2tzIGZvciBhIHdvcmQgaW4gYW55IG9mIHRoZSBlbnRpdGllcyBzdHJpbmcgdmFsdWVzIG9yIGFnZ3JlZ2F0aW9ucyBzdHJpbmcgdmFsdWVzIHRoYXQgc3RhcnRzIHdpdGggc3VnZ2VzdGlvblRva2VuLlxuXHQgKiBAcGFyYW0gYXR0cmlidXRlSWRzIE9ubHkgbG9va3MgaW4gdGhlc2UgYXR0cmlidXRlIGlkcyAob3IgYWxsIGl0cyBzdHJpbmcgdmFsdWVzIGlmIGl0IGlzIGFuIGFnZ3JlZ2F0aW9uIGF0dHJpYnV0ZSBpZC4gSWYgbnVsbCwgbG9va3MgaW4gYWxsIHN0cmluZyB2YWx1ZXMgYW5kIGFnZ3JlZ2F0aW9ucy5cblx0ICovXG5cdF9jb250YWluc1N1Z2dlc3Rpb25Ub2tlbihcblx0XHRlbnRpdHk6IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0bW9kZWw6IFR5cGVNb2RlbCxcblx0XHRhdHRyaWJ1dGVJZHM6IG51bWJlcltdIHwgbnVsbCxcblx0XHRzdWdnZXN0aW9uVG9rZW46IHN0cmluZyxcblx0XHRtYXRjaFdvcmRPcmRlcjogYm9vbGVhbixcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0bGV0IGF0dHJpYnV0ZU5hbWVzOiBzdHJpbmdbXVxuXG5cdFx0aWYgKCFhdHRyaWJ1dGVJZHMpIHtcblx0XHRcdGF0dHJpYnV0ZU5hbWVzID0gT2JqZWN0LmtleXMobW9kZWwudmFsdWVzKS5jb25jYXQoT2JqZWN0LmtleXMobW9kZWwuYXNzb2NpYXRpb25zKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXR0cmlidXRlTmFtZXMgPSBhdHRyaWJ1dGVJZHMubWFwKChpZCkgPT5cblx0XHRcdFx0bmV2ZXJOdWxsKFxuXHRcdFx0XHRcdE9iamVjdC5rZXlzKG1vZGVsLnZhbHVlcykuZmluZCgodmFsdWVOYW1lKSA9PiBtb2RlbC52YWx1ZXNbdmFsdWVOYW1lXS5pZCA9PT0gaWQpIHx8XG5cdFx0XHRcdFx0XHRPYmplY3Qua2V5cyhtb2RlbC5hc3NvY2lhdGlvbnMpLmZpbmQoKGFzc29jaWF0aW9uTmFtZSkgPT4gbW9kZWwuYXNzb2NpYXRpb25zW2Fzc29jaWF0aW9uTmFtZV0uaWQgPT09IGlkKSxcblx0XHRcdFx0KSxcblx0XHRcdClcblx0XHR9XG5cblx0XHRyZXR1cm4gYXN5bmNGaW5kKGF0dHJpYnV0ZU5hbWVzLCBhc3luYyAoYXR0cmlidXRlTmFtZSkgPT4ge1xuXHRcdFx0aWYgKG1vZGVsLnZhbHVlc1thdHRyaWJ1dGVOYW1lXSAmJiBtb2RlbC52YWx1ZXNbYXR0cmlidXRlTmFtZV0udHlwZSA9PT0gVmFsdWVUeXBlLlN0cmluZyAmJiBlbnRpdHlbYXR0cmlidXRlTmFtZV0pIHtcblx0XHRcdFx0aWYgKG1hdGNoV29yZE9yZGVyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShub3JtYWxpemVRdWVyeShlbnRpdHlbYXR0cmlidXRlTmFtZV0pLmluZGV4T2Yoc3VnZ2VzdGlvblRva2VuKSAhPT0gLTEpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bGV0IHdvcmRzID0gdG9rZW5pemUoZW50aXR5W2F0dHJpYnV0ZU5hbWVdKVxuXHRcdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUod29yZHMuc29tZSgodykgPT4gdy5zdGFydHNXaXRoKHN1Z2dlc3Rpb25Ub2tlbikpKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKG1vZGVsLmFzc29jaWF0aW9uc1thdHRyaWJ1dGVOYW1lXSAmJiBtb2RlbC5hc3NvY2lhdGlvbnNbYXR0cmlidXRlTmFtZV0udHlwZSA9PT0gQXNzb2NpYXRpb25UeXBlLkFnZ3JlZ2F0aW9uICYmIGVudGl0eVthdHRyaWJ1dGVOYW1lXSkge1xuXHRcdFx0XHRsZXQgYWdncmVnYXRlcyA9IG1vZGVsLmFzc29jaWF0aW9uc1thdHRyaWJ1dGVOYW1lXS5jYXJkaW5hbGl0eSA9PT0gQ2FyZGluYWxpdHkuQW55ID8gZW50aXR5W2F0dHJpYnV0ZU5hbWVdIDogW2VudGl0eVthdHRyaWJ1dGVOYW1lXV1cblx0XHRcdFx0Y29uc3QgcmVmTW9kZWwgPSBhd2FpdCByZXNvbHZlVHlwZVJlZmVyZW5jZShuZXcgVHlwZVJlZihtb2RlbC5hcHAsIG1vZGVsLmFzc29jaWF0aW9uc1thdHRyaWJ1dGVOYW1lXS5yZWZUeXBlKSlcblx0XHRcdFx0cmV0dXJuIGFzeW5jRmluZChhZ2dyZWdhdGVzLCAoYWdncmVnYXRlKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX2NvbnRhaW5zU3VnZ2VzdGlvblRva2VuKGRvd25jYXN0PFJlY29yZDxzdHJpbmcsIGFueT4+KGFnZ3JlZ2F0ZSksIHJlZk1vZGVsLCBudWxsLCBzdWdnZXN0aW9uVG9rZW4sIG1hdGNoV29yZE9yZGVyKVxuXHRcdFx0XHR9KS50aGVuKChmb3VuZCkgPT4gZm91bmQgIT0gbnVsbClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpXG5cdFx0XHR9XG5cdFx0fSkudGhlbigoZm91bmQpID0+IGZvdW5kICE9IG51bGwpXG5cdH1cblxuXHRfc3RhcnRPckNvbnRpbnVlU2VhcmNoKHNlYXJjaFJlc3VsdDogU2VhcmNoUmVzdWx0LCBtYXhSZXN1bHRzPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0bWFya1N0YXJ0KFwiZmluZEluZGV4RW50cmllc1wiKVxuXG5cdFx0Y29uc3QgbmV4dFNjaGVkdWxlZEluZGV4aW5nUnVuID0gZ2V0U3RhcnRPZkRheShnZXREYXlTaGlmdGVkKG5ldyBEYXRlKHRoaXMuX21haWxJbmRleGVyLmN1cnJlbnRJbmRleFRpbWVzdGFtcCksIElOSVRJQUxfTUFJTF9JTkRFWF9JTlRFUlZBTF9EQVlTKSlcblx0XHRjb25zdCB0aGVEYXlBZnRlclRvbW9ycm93ID0gZ2V0U3RhcnRPZkRheShnZXREYXlTaGlmdGVkKG5ldyBEYXRlKCksIDEpKVxuXG5cdFx0aWYgKHNlYXJjaFJlc3VsdC5tb3JlUmVzdWx0cy5sZW5ndGggPT09IDAgJiYgbmV4dFNjaGVkdWxlZEluZGV4aW5nUnVuLmdldFRpbWUoKSA+IHRoZURheUFmdGVyVG9tb3Jyb3cuZ2V0VGltZSgpICYmICF0aGlzLl9tYWlsSW5kZXhlci5pc0luZGV4aW5nKSB7XG5cdFx0XHR0aGlzLl9tYWlsSW5kZXhlci5leHRlbmRJbmRleElmTmVlZGVkKFxuXHRcdFx0XHR0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCksXG5cdFx0XHRcdGdldFN0YXJ0T2ZEYXkoZ2V0RGF5U2hpZnRlZChuZXcgRGF0ZSgpLCAtSU5JVElBTF9NQUlMX0lOREVYX0lOVEVSVkFMX0RBWVMpKS5nZXRUaW1lKCksXG5cdFx0XHQpXG5cdFx0fVxuXG5cdFx0bGV0IG1vcmVSZXN1bHRzRW50cmllczogUHJvbWlzZTxBcnJheTxNb3JlUmVzdWx0c0luZGV4RW50cnk+PlxuXG5cdFx0aWYgKG1heFJlc3VsdHMgJiYgc2VhcmNoUmVzdWx0Lm1vcmVSZXN1bHRzLmxlbmd0aCA+PSBtYXhSZXN1bHRzKSB7XG5cdFx0XHRtb3JlUmVzdWx0c0VudHJpZXMgPSBQcm9taXNlLnJlc29sdmUoc2VhcmNoUmVzdWx0Lm1vcmVSZXN1bHRzKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtb3JlUmVzdWx0c0VudHJpZXMgPSB0aGlzLl9maW5kSW5kZXhFbnRyaWVzKHNlYXJjaFJlc3VsdCwgbWF4UmVzdWx0cylcblx0XHRcdFx0LnRoZW4oKGtleVRvRW5jcnlwdGVkSW5kZXhFbnRyaWVzKSA9PiB7XG5cdFx0XHRcdFx0bWFya0VuZChcImZpbmRJbmRleEVudHJpZXNcIilcblx0XHRcdFx0XHRtYXJrU3RhcnQoXCJfZmlsdGVyQnlFbmNyeXB0ZWRJZFwiKVxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9maWx0ZXJCeUVuY3J5cHRlZElkKGtleVRvRW5jcnlwdGVkSW5kZXhFbnRyaWVzKVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbigoa2V5VG9FbmNyeXB0ZWRJbmRleEVudHJpZXMpID0+IHtcblx0XHRcdFx0XHRtYXJrRW5kKFwiX2ZpbHRlckJ5RW5jcnlwdGVkSWRcIilcblx0XHRcdFx0XHRtYXJrU3RhcnQoXCJfZGVjcnlwdFNlYXJjaFJlc3VsdFwiKVxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9kZWNyeXB0U2VhcmNoUmVzdWx0KGtleVRvRW5jcnlwdGVkSW5kZXhFbnRyaWVzKVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbigoa2V5VG9JbmRleEVudHJpZXMpID0+IHtcblx0XHRcdFx0XHRtYXJrRW5kKFwiX2RlY3J5cHRTZWFyY2hSZXN1bHRcIilcblx0XHRcdFx0XHRtYXJrU3RhcnQoXCJfZmlsdGVyQnlUeXBlQW5kQXR0cmlidXRlQW5kVGltZVwiKVxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9maWx0ZXJCeVR5cGVBbmRBdHRyaWJ1dGVBbmRUaW1lKGtleVRvSW5kZXhFbnRyaWVzLCBzZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24pXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50aGVuKChrZXlUb0luZGV4RW50cmllcykgPT4ge1xuXHRcdFx0XHRcdG1hcmtFbmQoXCJfZmlsdGVyQnlUeXBlQW5kQXR0cmlidXRlQW5kVGltZVwiKVxuXHRcdFx0XHRcdG1hcmtTdGFydChcIl9yZWR1Y2VXb3Jkc1wiKVxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9yZWR1Y2VXb3JkcyhrZXlUb0luZGV4RW50cmllcywgc2VhcmNoUmVzdWx0Lm1hdGNoV29yZE9yZGVyKVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbigoc2VhcmNoSW5kZXhFbnRyaWVzKSA9PiB7XG5cdFx0XHRcdFx0bWFya0VuZChcIl9yZWR1Y2VXb3Jkc1wiKVxuXHRcdFx0XHRcdG1hcmtTdGFydChcIl9yZWR1Y2VUb1VuaXF1ZUVsZW1lbnRJZHNcIilcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcmVkdWNlVG9VbmlxdWVFbGVtZW50SWRzKHNlYXJjaEluZGV4RW50cmllcywgc2VhcmNoUmVzdWx0KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbigoYWRkaXRpb25hbEVudHJpZXMpID0+IHtcblx0XHRcdFx0XHRtYXJrRW5kKFwiX3JlZHVjZVRvVW5pcXVlRWxlbWVudElkc1wiKVxuXHRcdFx0XHRcdHJldHVybiBhZGRpdGlvbmFsRW50cmllcy5jb25jYXQoc2VhcmNoUmVzdWx0Lm1vcmVSZXN1bHRzKVxuXHRcdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBtb3JlUmVzdWx0c0VudHJpZXNcblx0XHRcdC50aGVuKChzZWFyY2hJbmRleEVudHJpZXM6IE1vcmVSZXN1bHRzSW5kZXhFbnRyeVtdKSA9PiB7XG5cdFx0XHRcdG1hcmtTdGFydChcIl9maWx0ZXJCeUxpc3RJZEFuZEdyb3VwU2VhcmNoUmVzdWx0c1wiKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZmlsdGVyQnlMaXN0SWRBbmRHcm91cFNlYXJjaFJlc3VsdHMoc2VhcmNoSW5kZXhFbnRyaWVzLCBzZWFyY2hSZXN1bHQsIG1heFJlc3VsdHMpXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRtYXJrRW5kKFwiX2ZpbHRlckJ5TGlzdElkQW5kR3JvdXBTZWFyY2hSZXN1bHRzXCIpXG5cdFx0XHRcdGlmICh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRcdHByaW50TWVhc3VyZShcInF1ZXJ5OiBcIiArIHNlYXJjaFJlc3VsdC5xdWVyeSArIFwiLCBtYXhSZXN1bHRzOiBcIiArIFN0cmluZyhtYXhSZXN1bHRzKSwgW1xuXHRcdFx0XHRcdFx0XCJmaW5kSW5kZXhFbnRyaWVzXCIsXG5cdFx0XHRcdFx0XHRcIl9maWx0ZXJCeUVuY3J5cHRlZElkXCIsXG5cdFx0XHRcdFx0XHRcIl9kZWNyeXB0U2VhcmNoUmVzdWx0XCIsXG5cdFx0XHRcdFx0XHRcIl9maWx0ZXJCeVR5cGVBbmRBdHRyaWJ1dGVBbmRUaW1lXCIsXG5cdFx0XHRcdFx0XHRcIl9yZWR1Y2VXb3Jkc1wiLFxuXHRcdFx0XHRcdFx0XCJfcmVkdWNlVG9VbmlxdWVFbGVtZW50SWRzXCIsXG5cdFx0XHRcdFx0XHRcIl9maWx0ZXJCeUxpc3RJZEFuZEdyb3VwU2VhcmNoUmVzdWx0c1wiLFxuXHRcdFx0XHRcdF0pXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJlc3VsdFxuXHRcdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGRzIHN1Z2dlc3Rpb25zIGZvciB0aGUgZ2l2ZW4gc2VhcmNoVG9rZW4gdG8gdGhlIHNlYXJjaFJlc3VsdCB1bnRpbCBhdCBsZWFzdCBtaW5TdWdnZXN0aW9uQ291bnQgcmVzdWx0cyBhcmUgZXhpc3Rpbmdcblx0ICovXG5cdF9hZGRTdWdnZXN0aW9ucyhzZWFyY2hUb2tlbjogc3RyaW5nLCBzdWdnZXN0aW9uRmFjYWRlOiBTdWdnZXN0aW9uRmFjYWRlPGFueT4sIG1pblN1Z2dlc3Rpb25Db3VudDogbnVtYmVyLCBzZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCk6IFByb21pc2U8YW55PiB7XG5cdFx0bGV0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdGlvbkZhY2FkZS5nZXRTdWdnZXN0aW9ucyhzZWFyY2hUb2tlbilcblx0XHRyZXR1cm4gcHJvbWlzZU1hcChzdWdnZXN0aW9ucywgKHN1Z2dlc3Rpb24pID0+IHtcblx0XHRcdGlmIChzZWFyY2hSZXN1bHQucmVzdWx0cy5sZW5ndGggPCBtaW5TdWdnZXN0aW9uQ291bnQpIHtcblx0XHRcdFx0Y29uc3Qgc3VnZ2VzdGlvblJlc3VsdDogU2VhcmNoUmVzdWx0ID0ge1xuXHRcdFx0XHRcdHF1ZXJ5OiBzdWdnZXN0aW9uLFxuXHRcdFx0XHRcdHJlc3RyaWN0aW9uOiBzZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24sXG5cdFx0XHRcdFx0cmVzdWx0czogc2VhcmNoUmVzdWx0LnJlc3VsdHMsXG5cdFx0XHRcdFx0Y3VycmVudEluZGV4VGltZXN0YW1wOiBzZWFyY2hSZXN1bHQuY3VycmVudEluZGV4VGltZXN0YW1wLFxuXHRcdFx0XHRcdGxhc3RSZWFkU2VhcmNoSW5kZXhSb3c6IFtbc3VnZ2VzdGlvbiwgbnVsbF1dLFxuXHRcdFx0XHRcdG1hdGNoV29yZE9yZGVyOiBmYWxzZSxcblx0XHRcdFx0XHRtb3JlUmVzdWx0czogW10sXG5cdFx0XHRcdFx0bW9yZVJlc3VsdHNFbnRyaWVzOiBbXSxcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fc3RhcnRPckNvbnRpbnVlU2VhcmNoKHN1Z2dlc3Rpb25SZXN1bHQpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdF9maW5kSW5kZXhFbnRyaWVzKHNlYXJjaFJlc3VsdDogU2VhcmNoUmVzdWx0LCBtYXhSZXN1bHRzOiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbWlzZTxLZXlUb0VuY3J5cHRlZEluZGV4RW50cmllc1tdPiB7XG5cdFx0Y29uc3QgdHlwZUluZm8gPSB0eXBlUmVmVG9UeXBlSW5mbyhzZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24udHlwZSlcblx0XHRjb25zdCBmaXJzdFNlYXJjaFRva2VuSW5mbyA9IHNlYXJjaFJlc3VsdC5sYXN0UmVhZFNlYXJjaEluZGV4Um93WzBdXG5cdFx0Ly8gRmlyc3QgcmVhZCBhbGwgbWV0YWRhdGEgdG8gbmFycm93IHRpbWUgcmFuZ2Ugd2Ugc2VhcmNoIGluLlxuXHRcdHJldHVybiB0aGlzLl9kYi5kYkZhY2FkZS5jcmVhdGVUcmFuc2FjdGlvbih0cnVlLCBbU2VhcmNoSW5kZXhPUywgU2VhcmNoSW5kZXhNZXRhRGF0YU9TXSkudGhlbigodHJhbnNhY3Rpb24pID0+IHtcblx0XHRcdHJldHVybiB0aGlzLl9wcm9taXNlTWFwQ29tcGF0KHNlYXJjaFJlc3VsdC5sYXN0UmVhZFNlYXJjaEluZGV4Um93LCAodG9rZW5JbmZvLCBpbmRleCkgPT4ge1xuXHRcdFx0XHRjb25zdCBbc2VhcmNoVG9rZW5dID0gdG9rZW5JbmZvXG5cdFx0XHRcdGxldCBpbmRleEtleSA9IGVuY3J5cHRJbmRleEtleUJhc2U2NCh0aGlzLl9kYi5rZXksIHNlYXJjaFRva2VuLCB0aGlzLl9kYi5pdilcblx0XHRcdFx0cmV0dXJuIHRyYW5zYWN0aW9uLmdldChTZWFyY2hJbmRleE1ldGFEYXRhT1MsIGluZGV4S2V5LCBTZWFyY2hJbmRleFdvcmRzSW5kZXgpLnRoZW4oKG1ldGFEYXRhOiBTZWFyY2hJbmRleE1ldGFEYXRhRGJSb3cgfCBudWxsKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFtZXRhRGF0YSkge1xuXHRcdFx0XHRcdFx0dG9rZW5JbmZvWzFdID0gMCAvLyBcIndlJ3ZlIHJlYWQgYWxsXCIgKGJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSBhbnl0aGluZ1xuXG5cdFx0XHRcdFx0XHQvLyBJZiB0aGVyZSdzIG5vIG1ldGFkYXRhIGZvciBrZXksIHJldHVybiBlbXB0eSByZXN1bHRcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGlkOiAtaW5kZXgsXG5cdFx0XHRcdFx0XHRcdHdvcmQ6IGluZGV4S2V5LFxuXHRcdFx0XHRcdFx0XHRyb3dzOiBbXSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZGVjcnlwdE1ldGFEYXRhKHRoaXMuX2RiLmtleSwgbWV0YURhdGEpXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0XHQudGhlbk9yQXBwbHkoKG1ldGFSb3dzKSA9PiB7XG5cdFx0XHRcdFx0Ly8gRmluZCBpbmRleCBlbnRyeSByb3dzIGluIHdoaWNoIHdlIHdpbGwgc2VhcmNoLlxuXHRcdFx0XHRcdGNvbnN0IHJvd3NUb1JlYWRGb3JJbmRleEtleXMgPSB0aGlzLl9maW5kUm93c1RvUmVhZEZyb21NZXRhRGF0YShmaXJzdFNlYXJjaFRva2VuSW5mbywgbWV0YVJvd3MsIHR5cGVJbmZvLCBtYXhSZXN1bHRzKVxuXG5cdFx0XHRcdFx0Ly8gSXRlcmF0ZSBlYWNoIHF1ZXJ5IHRva2VuXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX3Byb21pc2VNYXBDb21wYXQocm93c1RvUmVhZEZvckluZGV4S2V5cywgKHJvd3NUb1JlYWQ6IFJvd3NUb1JlYWRGb3JJbmRleEtleSkgPT4ge1xuXHRcdFx0XHRcdFx0Ly8gRm9yIGVhY2ggdG9rZW4gZmluZCB0b2tlbiBlbnRyaWVzIGluIHRoZSByb3dzIHdlJ3ZlIGZvdW5kXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcHJvbWlzZU1hcENvbXBhdChyb3dzVG9SZWFkLnJvd3MsIChlbnRyeSkgPT4gdGhpcy5fZmluZEVudHJpZXNGb3JNZXRhZGF0YSh0cmFuc2FjdGlvbiwgZW50cnkpKVxuXHRcdFx0XHRcdFx0XHQudGhlbk9yQXBwbHkoKGEpID0+IGEuZmxhdCgpKVxuXHRcdFx0XHRcdFx0XHQudGhlbk9yQXBwbHkoKGluZGV4RW50cmllczogRW5jcnlwdGVkU2VhcmNoSW5kZXhFbnRyeVtdKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGluZGV4RW50cmllcy5tYXAoKGVudHJ5KSA9PiAoe1xuXHRcdFx0XHRcdFx0XHRcdFx0ZW5jRW50cnk6IGVudHJ5LFxuXHRcdFx0XHRcdFx0XHRcdFx0aWRIYXNoOiBhcnJheUhhc2goZ2V0SWRGcm9tRW5jU2VhcmNoSW5kZXhFbnRyeShlbnRyeSkpLFxuXHRcdFx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQudGhlbk9yQXBwbHkoKGluZGV4RW50cmllczogRW5jcnlwdGVkU2VhcmNoSW5kZXhFbnRyeVdpdGhIYXNoW10pID0+IHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXhLZXk6IHJvd3NUb1JlYWQuaW5kZXhLZXksXG5cdFx0XHRcdFx0XHRcdFx0XHRpbmRleEVudHJpZXM6IGluZGV4RW50cmllcyxcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pLnZhbHVlXG5cdFx0XHRcdFx0fSkudmFsdWVcblx0XHRcdFx0fSlcblx0XHRcdFx0LnRvUHJvbWlzZSgpXG5cdFx0fSlcblx0fVxuXG5cdF9maW5kUm93c1RvUmVhZEZyb21NZXRhRGF0YShcblx0XHRmaXJzdFRva2VuSW5mbzogW3N0cmluZywgbnVtYmVyIHwgbnVsbF0sXG5cdFx0c2FmZU1ldGFEYXRhUm93czogQXJyYXk8U2VhcmNoSW5kZXhNZXRhRGF0YVJvdz4sXG5cdFx0dHlwZUluZm86IFR5cGVJbmZvLFxuXHRcdG1heFJlc3VsdHM6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsXG5cdCk6IEFycmF5PFJvd3NUb1JlYWRGb3JJbmRleEtleT4ge1xuXHRcdC8vIFwiTGVhZGluZyByb3dcIiBuYXJyb3dzIGRvd24gdGltZSByYW5nZSBpbiB3aGljaCB3ZSBzZWFyY2ggaW4gdGhpcyBpdGVyYXRpb25cblx0XHQvLyBEb2Vzbid0IG1hdHRlciBmb3IgY29ycmVjdG5lc3Mgd2hpY2ggb25lIGl0IGlzIChiZWNhdXNlIHF1ZXJ5IGlzIGFsd2F5cyBBTkQpIGJ1dCBtYXR0ZXJzIGZvciBwZXJmb3JtYW5jZVxuXHRcdC8vIEZvciBub3cgYXJiaXRyYXJpbHkgcGlja2VkIGZpcnN0ICh1c3VhbGx5IGl0J3MgdGhlIG1vc3Qgc3BlY2lmaWMgcGFydCBhbnl3YXkpXG5cdFx0Y29uc3QgbGVhZGluZ1JvdyA9IHNhZmVNZXRhRGF0YVJvd3NbMF1cblx0XHRjb25zdCBvdGhlclJvd3MgPSBzYWZlTWV0YURhdGFSb3dzLnNsaWNlKDEpXG5cblx0XHRjb25zdCByYW5nZUZvckxlYWRpbmdSb3cgPSB0aGlzLl9maW5kUm93c1RvUmVhZChsZWFkaW5nUm93LCB0eXBlSW5mbywgZmlyc3RUb2tlbkluZm9bMV0gfHwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIG1heFJlc3VsdHMpXG5cblx0XHRjb25zdCByb3dzRm9yTGVhZGluZ1JvdyA9IFtcblx0XHRcdHtcblx0XHRcdFx0aW5kZXhLZXk6IGxlYWRpbmdSb3cud29yZCxcblx0XHRcdFx0cm93czogcmFuZ2VGb3JMZWFkaW5nUm93Lm1ldGFFbnRyaWVzLFxuXHRcdFx0fSxcblx0XHRdXG5cdFx0Zmlyc3RUb2tlbkluZm9bMV0gPSByYW5nZUZvckxlYWRpbmdSb3cub2xkZXN0VGltZXN0YW1wXG5cdFx0Y29uc3Qgcm93c0Zvck90aGVyUm93cyA9IG90aGVyUm93cy5tYXAoKHIpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGluZGV4S2V5OiByLndvcmQsXG5cdFx0XHRcdHJvd3M6IHRoaXMuX2ZpbmRSb3dzVG9SZWFkQnlUaW1lUmFuZ2UociwgdHlwZUluZm8sIHJhbmdlRm9yTGVhZGluZ1Jvdy5uZXdlc3RSb3dUaW1lc3RhbXAsIHJhbmdlRm9yTGVhZGluZ1Jvdy5vbGRlc3RUaW1lc3RhbXApLFxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0cmV0dXJuIHJvd3NGb3JMZWFkaW5nUm93LmNvbmNhdChyb3dzRm9yT3RoZXJSb3dzKVxuXHR9XG5cblx0X2ZpbmRFbnRyaWVzRm9yTWV0YWRhdGEodHJhbnNhY3Rpb246IERiVHJhbnNhY3Rpb24sIGVudHJ5OiBTZWFyY2hJbmRleE1ldGFkYXRhRW50cnkpOiBQcm9taXNlPEVuY3J5cHRlZFNlYXJjaEluZGV4RW50cnlbXT4ge1xuXHRcdHJldHVybiB0cmFuc2FjdGlvbi5nZXQoU2VhcmNoSW5kZXhPUywgZW50cnkua2V5KS50aGVuKChpbmRleEVudHJpZXNSb3cpID0+IHtcblx0XHRcdGlmICghaW5kZXhFbnRyaWVzUm93KSByZXR1cm4gW11cblx0XHRcdGNvbnN0IHJlc3VsdCA9IG5ldyBBcnJheShlbnRyeS5zaXplKVxuXHRcdFx0aXRlcmF0ZUJpbmFyeUJsb2NrcyhpbmRleEVudHJpZXNSb3cgYXMgVWludDhBcnJheSwgKGJsb2NrLCBzLCBlLCBpdGVyYXRpb24pID0+IHtcblx0XHRcdFx0cmVzdWx0W2l0ZXJhdGlvbl0gPSBibG9ja1xuXHRcdFx0fSlcblx0XHRcdHJldHVybiByZXN1bHRcblx0XHR9KVxuXHR9XG5cblx0X2ZpbmRSb3dzVG9SZWFkQnlUaW1lUmFuZ2UoXG5cdFx0bWV0YURhdGE6IFNlYXJjaEluZGV4TWV0YURhdGFSb3csXG5cdFx0dHlwZUluZm86IFR5cGVJbmZvLFxuXHRcdGZyb21OZXdlc3RUaW1lc3RhbXA6IG51bWJlcixcblx0XHR0b09sZGVzdFRpbWVzdGFtcDogbnVtYmVyLFxuXHQpOiBBcnJheTxTZWFyY2hJbmRleE1ldGFkYXRhRW50cnk+IHtcblx0XHRjb25zdCBmaWx0ZXJlZFJvd3MgPSBtZXRhRGF0YS5yb3dzLmZpbHRlcigocikgPT4gci5hcHAgPT09IHR5cGVJbmZvLmFwcElkICYmIHIudHlwZSA9PT0gdHlwZUluZm8udHlwZUlkKVxuXHRcdGZpbHRlcmVkUm93cy5yZXZlcnNlKClcblx0XHRjb25zdCBwYXNzZWRSb3dzOiBTZWFyY2hJbmRleE1ldGFkYXRhRW50cnlbXSA9IFtdXG5cblx0XHRmb3IgKGxldCByb3cgb2YgZmlsdGVyZWRSb3dzKSB7XG5cdFx0XHRpZiAocm93Lm9sZGVzdEVsZW1lbnRUaW1lc3RhbXAgPCBmcm9tTmV3ZXN0VGltZXN0YW1wKSB7XG5cdFx0XHRcdHBhc3NlZFJvd3MucHVzaChyb3cpXG5cblx0XHRcdFx0aWYgKHJvdy5vbGRlc3RFbGVtZW50VGltZXN0YW1wIDw9IHRvT2xkZXN0VGltZXN0YW1wKSB7XG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBwYXNzZWRSb3dzXG5cdH1cblxuXHRfZmluZFJvd3NUb1JlYWQoXG5cdFx0bWV0YURhdGE6IFNlYXJjaEluZGV4TWV0YURhdGFSb3csXG5cdFx0dHlwZUluZm86IFR5cGVJbmZvLFxuXHRcdG11c3RCZU9sZGVyVGhhbjogbnVtYmVyLFxuXHRcdG1heFJlc3VsdHM6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsXG5cdCk6IHtcblx0XHRtZXRhRW50cmllczogQXJyYXk8U2VhcmNoSW5kZXhNZXRhZGF0YUVudHJ5PlxuXHRcdG9sZGVzdFRpbWVzdGFtcDogbnVtYmVyXG5cdFx0bmV3ZXN0Um93VGltZXN0YW1wOiBudW1iZXJcblx0fSB7XG5cdFx0Y29uc3QgZmlsdGVyZWRSb3dzID0gbWV0YURhdGEucm93cy5maWx0ZXIoKHIpID0+IHIuYXBwID09PSB0eXBlSW5mby5hcHBJZCAmJiByLnR5cGUgPT09IHR5cGVJbmZvLnR5cGVJZClcblx0XHRmaWx0ZXJlZFJvd3MucmV2ZXJzZSgpXG5cdFx0bGV0IGVudGl0aWVzVG9SZWFkID0gMFxuXHRcdGxldCBsYXN0UmVhZFJvd1RpbWVzdGFtcCA9IDBcblx0XHRsZXQgbmV3ZXN0Um93VGltZXN0YW1wID0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJcblx0XHRsZXQgcm93c1RvUmVhZFxuXG5cdFx0aWYgKG1heFJlc3VsdHMpIHtcblx0XHRcdHJvd3NUb1JlYWQgPSBbXVxuXG5cdFx0XHRmb3IgKGxldCByIG9mIGZpbHRlcmVkUm93cykge1xuXHRcdFx0XHRpZiAoci5vbGRlc3RFbGVtZW50VGltZXN0YW1wIDwgbXVzdEJlT2xkZXJUaGFuKSB7XG5cdFx0XHRcdFx0aWYgKGVudGl0aWVzVG9SZWFkIDwgMTAwMCkge1xuXHRcdFx0XHRcdFx0ZW50aXRpZXNUb1JlYWQgKz0gci5zaXplXG5cdFx0XHRcdFx0XHRsYXN0UmVhZFJvd1RpbWVzdGFtcCA9IHIub2xkZXN0RWxlbWVudFRpbWVzdGFtcFxuXHRcdFx0XHRcdFx0cm93c1RvUmVhZC5wdXNoKHIpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG5ld2VzdFJvd1RpbWVzdGFtcCA9IHIub2xkZXN0RWxlbWVudFRpbWVzdGFtcFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJvd3NUb1JlYWQgPSBmaWx0ZXJlZFJvd3Ncblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0bWV0YUVudHJpZXM6IHJvd3NUb1JlYWQsXG5cdFx0XHRvbGRlc3RUaW1lc3RhbXA6IGxhc3RSZWFkUm93VGltZXN0YW1wLFxuXHRcdFx0bmV3ZXN0Um93VGltZXN0YW1wOiBuZXdlc3RSb3dUaW1lc3RhbXAsXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJlZHVjZXMgdGhlIHNlYXJjaCByZXN1bHQgYnkgZmlsdGVyaW5nIG91dCBhbGwgbWFpbElkcyB0aGF0IGRvbid0IG1hdGNoIGFsbCBzZWFyY2ggdG9rZW5zXG5cdCAqL1xuXHRfZmlsdGVyQnlFbmNyeXB0ZWRJZChyZXN1bHRzOiBLZXlUb0VuY3J5cHRlZEluZGV4RW50cmllc1tdKTogS2V5VG9FbmNyeXB0ZWRJbmRleEVudHJpZXNbXSB7XG5cdFx0bGV0IG1hdGNoaW5nRW5jSWRzOiBTZXQ8bnVtYmVyPiB8IG51bGwgPSBudWxsXG5cdFx0Zm9yIChjb25zdCBrZXlUb0VuY3J5cHRlZEluZGV4RW50cnkgb2YgcmVzdWx0cykge1xuXHRcdFx0aWYgKG1hdGNoaW5nRW5jSWRzID09IG51bGwpIHtcblx0XHRcdFx0bWF0Y2hpbmdFbmNJZHMgPSBuZXcgU2V0KGtleVRvRW5jcnlwdGVkSW5kZXhFbnRyeS5pbmRleEVudHJpZXMubWFwKChlbnRyeSkgPT4gZW50cnkuaWRIYXNoKSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGZpbHRlcmVkID0gbmV3IFNldDxudW1iZXI+KClcblx0XHRcdFx0Zm9yIChjb25zdCBpbmRleEVudHJ5IG9mIGtleVRvRW5jcnlwdGVkSW5kZXhFbnRyeS5pbmRleEVudHJpZXMpIHtcblx0XHRcdFx0XHRpZiAobWF0Y2hpbmdFbmNJZHMuaGFzKGluZGV4RW50cnkuaWRIYXNoKSkge1xuXHRcdFx0XHRcdFx0ZmlsdGVyZWQuYWRkKGluZGV4RW50cnkuaWRIYXNoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRtYXRjaGluZ0VuY0lkcyA9IGZpbHRlcmVkXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHRzLm1hcCgocikgPT4ge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aW5kZXhLZXk6IHIuaW5kZXhLZXksXG5cdFx0XHRcdGluZGV4RW50cmllczogci5pbmRleEVudHJpZXMuZmlsdGVyKChlbnRyeSkgPT4gbWF0Y2hpbmdFbmNJZHM/LmhhcyhlbnRyeS5pZEhhc2gpKSxcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0X2RlY3J5cHRTZWFyY2hSZXN1bHQocmVzdWx0czogS2V5VG9FbmNyeXB0ZWRJbmRleEVudHJpZXNbXSk6IEtleVRvSW5kZXhFbnRyaWVzW10ge1xuXHRcdHJldHVybiByZXN1bHRzLm1hcCgoc2VhcmNoUmVzdWx0KSA9PiB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRpbmRleEtleTogc2VhcmNoUmVzdWx0LmluZGV4S2V5LFxuXHRcdFx0XHRpbmRleEVudHJpZXM6IHNlYXJjaFJlc3VsdC5pbmRleEVudHJpZXMubWFwKChlbnRyeSkgPT4gZGVjcnlwdFNlYXJjaEluZGV4RW50cnkodGhpcy5fZGIua2V5LCBlbnRyeS5lbmNFbnRyeSwgdGhpcy5fZGIuaXYpKSxcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0X2ZpbHRlckJ5VHlwZUFuZEF0dHJpYnV0ZUFuZFRpbWUocmVzdWx0czogS2V5VG9JbmRleEVudHJpZXNbXSwgcmVzdHJpY3Rpb246IFNlYXJjaFJlc3RyaWN0aW9uKTogS2V5VG9JbmRleEVudHJpZXNbXSB7XG5cdFx0Ly8gZmlyc3QgZmlsdGVyIGVhY2ggaW5kZXggZW50cnkgYnkgaXRzZWxmXG5cdFx0bGV0IGVuZFRpbWVzdGFtcCA9IHRoaXMuX2dldFNlYXJjaEVuZFRpbWVzdGFtcChyZXN0cmljdGlvbilcblxuXHRcdGNvbnN0IG1pbkluY2x1ZGVkSWQgPSB0aW1lc3RhbXBUb0dlbmVyYXRlZElkKGVuZFRpbWVzdGFtcClcblx0XHRjb25zdCBtYXhFeGNsdWRlZElkID0gcmVzdHJpY3Rpb24uc3RhcnQgPyB0aW1lc3RhbXBUb0dlbmVyYXRlZElkKHJlc3RyaWN0aW9uLnN0YXJ0ICsgMSkgOiBudWxsXG5cdFx0Zm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuXHRcdFx0cmVzdWx0LmluZGV4RW50cmllcyA9IHJlc3VsdC5pbmRleEVudHJpZXMuZmlsdGVyKChlbnRyeSkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5faXNWYWxpZEF0dHJpYnV0ZUFuZFRpbWUocmVzdHJpY3Rpb24sIGVudHJ5LCBtaW5JbmNsdWRlZElkLCBtYXhFeGNsdWRlZElkKVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0Ly8gbm93IGZpbHRlciBhbGwgaWRzIHRoYXQgYXJlIGluIGFsbCBvZiB0aGUgc2VhcmNoIHdvcmRzXG5cdFx0bGV0IG1hdGNoaW5nSWRzOiBTZXQ8SWQ+IHwgbnVsbCA9IG51bGxcblx0XHRmb3IgKGNvbnN0IGtleVRvSW5kZXhFbnRyeSBvZiByZXN1bHRzKSB7XG5cdFx0XHRpZiAoIW1hdGNoaW5nSWRzKSB7XG5cdFx0XHRcdG1hdGNoaW5nSWRzID0gbmV3IFNldChrZXlUb0luZGV4RW50cnkuaW5kZXhFbnRyaWVzLm1hcCgoZW50cnkpID0+IGVudHJ5LmlkKSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxldCBmaWx0ZXJlZCA9IG5ldyBTZXQ8SWQ+KClcblx0XHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiBrZXlUb0luZGV4RW50cnkuaW5kZXhFbnRyaWVzKSB7XG5cdFx0XHRcdFx0aWYgKG1hdGNoaW5nSWRzLmhhcyhlbnRyeS5pZCkpIHtcblx0XHRcdFx0XHRcdGZpbHRlcmVkLmFkZChlbnRyeS5pZClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0bWF0Y2hpbmdJZHMgPSBmaWx0ZXJlZFxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0cy5tYXAoKHIpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGluZGV4S2V5OiByLmluZGV4S2V5LFxuXHRcdFx0XHRpbmRleEVudHJpZXM6IHIuaW5kZXhFbnRyaWVzLmZpbHRlcigoZW50cnkpID0+IG1hdGNoaW5nSWRzPy5oYXMoZW50cnkuaWQpKSxcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0X2lzVmFsaWRBdHRyaWJ1dGVBbmRUaW1lKHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbiwgZW50cnk6IFNlYXJjaEluZGV4RW50cnksIG1pbkluY2x1ZGVkSWQ6IElkLCBtYXhFeGNsdWRlZElkOiBJZCB8IG51bGwpOiBib29sZWFuIHtcblx0XHRpZiAocmVzdHJpY3Rpb24uYXR0cmlidXRlSWRzKSB7XG5cdFx0XHRpZiAoIWNvbnRhaW5zKHJlc3RyaWN0aW9uLmF0dHJpYnV0ZUlkcywgZW50cnkuYXR0cmlidXRlKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAobWF4RXhjbHVkZWRJZCkge1xuXHRcdFx0Ly8gdGltZXN0YW1wVG9HZW5lcmF0ZWRJZCBwcm92aWRlcyB0aGUgbG93ZXN0IGlkIHdpdGggdGhlIGdpdmVuIHRpbWVzdGFtcCAoc2VydmVyIGlkIGFuZCBjb3VudGVyIHNldCB0byAwKSxcblx0XHRcdC8vIHNvIHdlIGFkZCBvbmUgbWlsbGlzZWNvbmQgdG8gbWFrZSBzdXJlIGFsbCBpZHMgb2YgdGhlIHRpbWVzdGFtcCBhcmUgY292ZXJlZFxuXHRcdFx0aWYgKCFmaXJzdEJpZ2dlclRoYW5TZWNvbmQobWF4RXhjbHVkZWRJZCwgZW50cnkuaWQpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAhZmlyc3RCaWdnZXJUaGFuU2Vjb25kKG1pbkluY2x1ZGVkSWQsIGVudHJ5LmlkKVxuXHR9XG5cblx0X3JlZHVjZVdvcmRzKHJlc3VsdHM6IEtleVRvSW5kZXhFbnRyaWVzW10sIG1hdGNoV29yZE9yZGVyOiBib29sZWFuKTogUmVhZG9ubHlBcnJheTxEZWNyeXB0ZWRTZWFyY2hJbmRleEVudHJ5PiB7XG5cdFx0aWYgKG1hdGNoV29yZE9yZGVyKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0c1swXS5pbmRleEVudHJpZXMuZmlsdGVyKChmaXJzdFdvcmRFbnRyeSkgPT4ge1xuXHRcdFx0XHQvLyByZWR1Y2UgdGhlIGZpbHRlcmVkIHBvc2l0aW9ucyBmb3IgdGhpcyBmaXJzdCB3b3JkIGVudHJ5IGFuZCBpdHMgYXR0cmlidXRlIHdpdGggZWFjaCBuZXh0IHdvcmQgdG8gdGhvc2UgdGhhdCBhcmUgaW4gb3JkZXJcblx0XHRcdFx0bGV0IGZpbHRlcmVkUG9zaXRpb25zID0gZmlyc3RXb3JkRW50cnkucG9zaXRpb25zLnNsaWNlKClcblxuXHRcdFx0XHRmb3IgKGxldCBpID0gMTsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRsZXQgZW50cnkgPSByZXN1bHRzW2ldLmluZGV4RW50cmllcy5maW5kKChlKSA9PiBlLmlkID09PSBmaXJzdFdvcmRFbnRyeS5pZCAmJiBlLmF0dHJpYnV0ZSA9PT0gZmlyc3RXb3JkRW50cnkuYXR0cmlidXRlKVxuXG5cdFx0XHRcdFx0aWYgKGVudHJ5KSB7XG5cdFx0XHRcdFx0XHRmaWx0ZXJlZFBvc2l0aW9ucyA9IGZpbHRlcmVkUG9zaXRpb25zLmZpbHRlcigoZmlyc3RXb3JkUG9zaXRpb24pID0+XG5cdFx0XHRcdFx0XHRcdG5ldmVyTnVsbChlbnRyeSkucG9zaXRpb25zLmZpbmQoKHBvc2l0aW9uKSA9PiBwb3NpdGlvbiA9PT0gZmlyc3RXb3JkUG9zaXRpb24gKyBpKSxcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gdGhlIGlkIHdhcyBwcm9iYWJseSBub3QgZm91bmQgZm9yIHRoZSBzYW1lIGF0dHJpYnV0ZSBhcyB0aGUgY3VycmVudCBmaWx0ZXJlZCBwb3NpdGlvbnMsIHNvIHdlIGNvdWxkIG5vdCBmaW5kIGFsbCB3b3JkcyBpbiBvcmRlciBpbiB0aGUgc2FtZSBhdHRyaWJ1dGVcblx0XHRcdFx0XHRcdGZpbHRlcmVkUG9zaXRpb25zID0gW11cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZmlsdGVyZWRQb3NpdGlvbnMubGVuZ3RoID4gMFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gYWxsIGlkcyBtdXN0IGFwcGVhciBpbiBhbGwgd29yZHMgbm93LCBzbyB3ZSBjYW4gdXNlIGFueSBvZiB0aGUgZW50cmllcyBsaXN0c1xuXHRcdFx0cmV0dXJuIHJlc3VsdHNbMF0uaW5kZXhFbnRyaWVzXG5cdFx0fVxuXHR9XG5cblx0X3JlZHVjZVRvVW5pcXVlRWxlbWVudElkcyhyZXN1bHRzOiBSZWFkb25seUFycmF5PERlY3J5cHRlZFNlYXJjaEluZGV4RW50cnk+LCBwcmV2aW91c1Jlc3VsdDogU2VhcmNoUmVzdWx0KTogUmVhZG9ubHlBcnJheTxNb3JlUmVzdWx0c0luZGV4RW50cnk+IHtcblx0XHRjb25zdCB1bmlxdWVJZHMgPSBuZXcgU2V0PHN0cmluZz4oKVxuXHRcdHJldHVybiByZXN1bHRzLmZpbHRlcigoZW50cnkpID0+IHtcblx0XHRcdGlmICghdW5pcXVlSWRzLmhhcyhlbnRyeS5pZCkgJiYgIXByZXZpb3VzUmVzdWx0LnJlc3VsdHMuc29tZSgocikgPT4gclsxXSA9PT0gZW50cnkuaWQpKSB7XG5cdFx0XHRcdHVuaXF1ZUlkcy5hZGQoZW50cnkuaWQpXG5cdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0X2ZpbHRlckJ5TGlzdElkQW5kR3JvdXBTZWFyY2hSZXN1bHRzKFxuXHRcdGluZGV4RW50cmllczogQXJyYXk8TW9yZVJlc3VsdHNJbmRleEVudHJ5Pixcblx0XHRzZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCxcblx0XHRtYXhSZXN1bHRzOiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkLFxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpbmRleEVudHJpZXMuc29ydCgobCwgcikgPT4gY29tcGFyZU5ld2VzdEZpcnN0KGwuaWQsIHIuaWQpKVxuXHRcdC8vIFdlIGZpbHRlciBvdXQgZXZlcnl0aGluZyB3ZSd2ZSBwcm9jZXNzZWQgZnJvbSBtb3JlRW50cmllcywgZXZlbiBpZiB3ZSBkaWRuJ3QgaW5jbHVkZSBpdFxuXHRcdC8vIGRvd25jYXN0OiBBcnJheSBvZiBvcHRpb25hbCBlbGVtZW50cyBpbiBub3Qgc3VidHlwZSBvZiBub24tb3B0aW9uYWwgZWxlbWVudHNcblx0XHRjb25zdCBlbnRyaWVzQ29weTogQXJyYXk8TW9yZVJlc3VsdHNJbmRleEVudHJ5IHwgbnVsbD4gPSBkb3duY2FzdChpbmRleEVudHJpZXMuc2xpY2UoKSlcblx0XHQvLyBSZXN1bHRzIGFyZSBhZGRlZCBpbiB0aGUgcmFuZG9tIG9yZGVyIGFuZCB3ZSBtYXkgZmlsdGVyIHNvbWUgb2YgdGhlbSBvdXQuIFdlIG5lZWQgdG8gc29ydCB0aGVtLlxuXHRcdC8vIFVzZSBzZXBhcmF0ZSBhcnJheSB0byBvbmx5IHNvcnQgbmV3IHJlc3VsdHMgYW5kIG5vdCBhbGwgb2YgdGhlbS5cblx0XHRyZXR1cm4gdGhpcy5fZGIuZGJGYWNhZGVcblx0XHRcdC5jcmVhdGVUcmFuc2FjdGlvbih0cnVlLCBbRWxlbWVudERhdGFPU10pXG5cdFx0XHQudGhlbigodHJhbnNhY3Rpb24pID0+XG5cdFx0XHRcdC8vIEFzIGFuIGF0dGVtcHQgdG8gb3B0aW1pemUgc2VhcmNoIHdlIGxvb2sgZm9yIGl0ZW1zIGluIHBhcmFsbGVsLiBQcm9taXNlLm1hcCBpdGVyYXRlcyBpbiBhcmJpdHJhcnkgb3JkZXIhXG5cdFx0XHRcdC8vIEJVVCEgd2UgaGF2ZSB0byBsb29rIGF0IGFsbCBvZiB0aGVtISBPdGhlcndpc2UsIHdlIG1heSByZXR1cm4gdGhlbSBpbiB0aGUgd3Jvbmcgb3JkZXIuXG5cdFx0XHRcdC8vIFdlIGNhbm5vdCByZXR1cm4gZWxlbWVudHMgMTAsIDE1LCAyMCBpZiB3ZSBkaWRuJ3QgcmV0dXJuIGVsZW1lbnQgNSBmaXJzdCwgbm8gb25lIHdpbGwgYXNrIGZvciBpdCBsYXRlci5cblx0XHRcdFx0Ly8gVGhlIGJlc3QgdGhpbmcgcGVyZm9ybWFuY2Utd2lzZSB3b3VsZCBiZSB0byBzcGxpdCBpbnRvIGNodW5rcyBvZiBjZXJ0YWluIGxlbmd0aCBhbmQgcHJvY2VzcyB0aGVtIGluIHBhcmFsbGVsIGFuZCBzdG9wIGFmdGVyIGNlcnRhaW4gY2h1bmsuXG5cdFx0XHRcdHByb21pc2VNYXAoXG5cdFx0XHRcdFx0aW5kZXhFbnRyaWVzLnNsaWNlKDAsIG1heFJlc3VsdHMgfHwgaW5kZXhFbnRyaWVzLmxlbmd0aCArIDEpLFxuXHRcdFx0XHRcdGFzeW5jIChlbnRyeSwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB0cmFuc2FjdGlvbi5nZXQoRWxlbWVudERhdGFPUywgdWludDhBcnJheVRvQmFzZTY0KGVudHJ5LmVuY0lkKSkudGhlbigoZWxlbWVudERhdGE6IEVsZW1lbnREYXRhRGJSb3cgfCBudWxsKSA9PiB7XG5cdFx0XHRcdFx0XHRcdC8vIG1hcmsgcmVzdWx0IGluZGV4IGlkIGFzIHByb2Nlc3NlZCB0byBub3QgcXVlcnkgcmVzdWx0IGluIG5leHQgbG9hZCBtb3JlIG9wZXJhdGlvblxuXHRcdFx0XHRcdFx0XHRlbnRyaWVzQ29weVtpbmRleF0gPSBudWxsXG5cblx0XHRcdFx0XHRcdFx0aWYgKGVsZW1lbnREYXRhKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFtlbGVtZW50RGF0YVswXSwgZW50cnkuaWRdIGFzIElkVHVwbGVcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uY3VycmVuY3k6IDUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0KSxcblx0XHRcdClcblx0XHRcdC50aGVuKChpbnRlcm1lZGlhdGVSZXN1bHRzKSA9PiBpbnRlcm1lZGlhdGVSZXN1bHRzLmZpbHRlcihpc05vdE51bGwpKVxuXHRcdFx0LnRoZW4oYXN5bmMgKGludGVybWVkaWF0ZVJlc3VsdHMpID0+IHtcblx0XHRcdFx0Ly8gYXBwbHkgZm9sZGVyIHJlc3RyaWN0aW9ucyB0byBpbnRlcm1lZGlhdGVSZXN1bHRzXG5cblx0XHRcdFx0aWYgKGlzRW1wdHkoc2VhcmNoUmVzdWx0LnJlc3RyaWN0aW9uLmZvbGRlcklkcykpIHtcblx0XHRcdFx0XHQvLyBubyBmb2xkZXIgcmVzdHJpY3Rpb25zIChBTEwpXG5cdFx0XHRcdFx0cmV0dXJuIGludGVybWVkaWF0ZVJlc3VsdHNcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBzb21lIGZvbGRlciByZXN0cmljdGlvbnMgKGUuZy4gSU5CT1gpXG5cblx0XHRcdFx0XHQvLyBXaXRoIHRoZSBuZXcgbWFpbFNldCBhcmNoaXRlY3R1cmUgKHN0YXRpYyBtYWlsIGxpc3RzKSB3ZSBuZWVkIHRvIGxvYWQgZXZlcnkgbWFpbFxuXHRcdFx0XHRcdC8vIGluIG9yZGVyIHRvIGNoZWNrIGluIHdoaWNoIG1haWxTZXQgKGZvbGRlcikgYSBtYWlsIGlzIGluY2x1ZGVkIGluLlxuXHRcdFx0XHRcdGNvbnN0IG1haWxzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG5cdFx0XHRcdFx0XHRpbnRlcm1lZGlhdGVSZXN1bHRzLm1hcCgoaW50ZXJtZWRpYXRlUmVzdWx0SWQpID0+XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2VudGl0eUNsaWVudC5sb2FkKE1haWxUeXBlUmVmLCBpbnRlcm1lZGlhdGVSZXN1bHRJZCkuY2F0Y2goXG5cdFx0XHRcdFx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgQ291bGQgbm90IGZpbmQgdXBkYXRlZCBtYWlsICR7SlNPTi5zdHJpbmdpZnkoaW50ZXJtZWRpYXRlUmVzdWx0SWQpfWApXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0cmV0dXJuIG1haWxzXG5cdFx0XHRcdFx0XHQuZmlsdGVyKGlzTm90TnVsbClcblx0XHRcdFx0XHRcdC5maWx0ZXIoKG1haWwpID0+IHtcblx0XHRcdFx0XHRcdFx0bGV0IGZvbGRlcklkczogQXJyYXk8SWQ+XG5cdFx0XHRcdFx0XHRcdGlmIChpc05vdEVtcHR5KG1haWwuc2V0cykpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBuZXcgbWFpbFNldCBmb2xkZXJzXG5cdFx0XHRcdFx0XHRcdFx0Zm9sZGVySWRzID0gbWFpbC5zZXRzLm1hcCgoc2V0SWQpID0+IGVsZW1lbnRJZFBhcnQoc2V0SWQpKVxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdC8vIGxlZ2FjeSBtYWlsIGZvbGRlciAobWFpbCBsaXN0KVxuXHRcdFx0XHRcdFx0XHRcdGZvbGRlcklkcyA9IFtnZXRMaXN0SWQobWFpbCldXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZvbGRlcklkcy5zb21lKChmb2xkZXJJZCkgPT4gc2VhcmNoUmVzdWx0LnJlc3RyaWN0aW9uLmZvbGRlcklkcy5pbmNsdWRlcyhmb2xkZXJJZCkpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0Lm1hcCgobWFpbCkgPT4gbWFpbC5faWQpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGhlbigobmV3UmVzdWx0cykgPT4ge1xuXHRcdFx0XHRzZWFyY2hSZXN1bHQucmVzdWx0cy5wdXNoKC4uLihuZXdSZXN1bHRzIGFzIElkVHVwbGVbXSkpXG5cdFx0XHRcdHNlYXJjaFJlc3VsdC5tb3JlUmVzdWx0cyA9IGVudHJpZXNDb3B5LmZpbHRlcihpc05vdE51bGwpXG5cdFx0XHR9KVxuXHR9XG5cblx0YXN5bmMgZ2V0TW9yZVNlYXJjaFJlc3VsdHMoc2VhcmNoUmVzdWx0OiBTZWFyY2hSZXN1bHQsIG1vcmVSZXN1bHRDb3VudDogbnVtYmVyKTogUHJvbWlzZTxTZWFyY2hSZXN1bHQ+IHtcblx0XHRhd2FpdCB0aGlzLl9zdGFydE9yQ29udGludWVTZWFyY2goc2VhcmNoUmVzdWx0LCBtb3JlUmVzdWx0Q291bnQpXG5cdFx0cmV0dXJuIHNlYXJjaFJlc3VsdFxuXHR9XG5cblx0X2dldFNlYXJjaEVuZFRpbWVzdGFtcChyZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24pOiBudW1iZXIge1xuXHRcdGlmIChyZXN0cmljdGlvbi5lbmQpIHtcblx0XHRcdHJldHVybiByZXN0cmljdGlvbi5lbmRcblx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYoTWFpbFR5cGVSZWYsIHJlc3RyaWN0aW9uLnR5cGUpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fbWFpbEluZGV4ZXIuY3VycmVudEluZGV4VGltZXN0YW1wID09PSBOT1RISU5HX0lOREVYRURfVElNRVNUQU1QID8gRGF0ZS5ub3coKSA6IHRoaXMuX21haWxJbmRleGVyLmN1cnJlbnRJbmRleFRpbWVzdGFtcFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gRlVMTF9JTkRFWEVEX1RJTUVTVEFNUFxuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVRdWVyeShxdWVyeTogc3RyaW5nKTogc3RyaW5nIHtcblx0cmV0dXJuIHRva2VuaXplKHF1ZXJ5KS5qb2luKFwiIFwiKVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFxRWEsZUFBTixNQUFtQjtDQUN6QjtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBRUEsWUFDa0JBLFlBQ2pCQyxJQUNBQyxhQUNBQyxtQkFDQUMsYUFDQUMsY0FDQztFQTJuQkYsS0Fqb0JrQjtBQU9qQixPQUFLLE1BQU07QUFDWCxPQUFLLGVBQWU7QUFDcEIsT0FBSyxxQkFBcUI7QUFDMUIsT0FBSyxvQkFBb0IsaUJBQWlCLFlBQVksbUJBQW1CO0FBQ3pFLE9BQUssZ0JBQWdCO0NBQ3JCOzs7Ozs7OztDQVVELE9BQU9D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