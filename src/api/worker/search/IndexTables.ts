export type ObjectStoreName = string
export type IndexName = string

export const SearchIndexOS: ObjectStoreName = "SearchIndex"
export const SearchIndexMetaDataOS: ObjectStoreName = "SearchIndexMeta"
export const ElementDataOS: ObjectStoreName = "ElementData"
export const MetaDataOS: ObjectStoreName = "MetaData"
export const GroupDataOS: ObjectStoreName = "GroupMetaData"
export const SearchTermSuggestionsOS: ObjectStoreName = "SearchTermSuggestions"
export const SearchIndexWordsIndex: IndexName = "SearchIndexWords"

export const Metadata = {
	userEncDbKey: "userEncDbKey",
	mailIndexingEnabled: "mailIndexingEnabled",
	excludedListIds: "excludedListIds",
	// stored in the database, so the mailbox does not need to be loaded when starting to index mails except spam folder after login
	encDbIv: "encDbIv",
	// server timestamp of the last time we indexed on this client, in millis
	lastEventIndexTimeMs: "lastEventIndexTimeMs",
}
