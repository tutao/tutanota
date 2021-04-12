//@flow

import type {IndexName, ObjectStoreName} from "./DbFacade"
import {DbFacade,} from "./DbFacade"

const DB_VERSION = 4

export const SearchIndexOS: ObjectStoreName = "SearchIndex"
export const SearchIndexMetaDataOS: ObjectStoreName = "SearchIndexMeta"
export const ElementDataOS: ObjectStoreName = "ElementData"
export const MetaDataOS: ObjectStoreName = "MetaData"
export const GroupDataOS: ObjectStoreName = "GroupMetaData"
export const SearchTermSuggestionsOS: ObjectStoreName = "SearchTermSuggestions"

export const SearchIndexWordsIndex: IndexName = "SearchIndexWords"

export function newSearchIndexDB(): DbFacade {
	return new DbFacade(DB_VERSION, (event, db) => {
		if (event.oldVersion !== DB_VERSION && event.oldVersion !== 0) {

			this._deleteObjectStores(db,
				SearchIndexOS,
				ElementDataOS,
				MetaDataOS,
				GroupDataOS,
				SearchTermSuggestionsOS,
				SearchIndexMetaDataOS
			)
		}

		db.createObjectStore(SearchIndexOS, {autoIncrement: true})
		const metaOS = db.createObjectStore(SearchIndexMetaDataOS, {autoIncrement: true, keyPath: "id"})
		db.createObjectStore(ElementDataOS)
		db.createObjectStore(MetaDataOS)
		db.createObjectStore(GroupDataOS)
		db.createObjectStore(SearchTermSuggestionsOS)
		metaOS.createIndex(SearchIndexWordsIndex, "word", {unique: true})
	})
}