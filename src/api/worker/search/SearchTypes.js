//@flow
import type {DbFacade} from "./DbFacade"
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import type {TypeInfo} from "./IndexUtils"
import {TypeRef} from "../../common/EntityFunctions"


// db types

/**
 * First part encrypted element id (16 bytes), second part encoded and encrypted attribute and positions
 */
export type EncryptedSearchIndexEntry = Uint8Array

/**
 * Binary encoded EncryptedSearchIndexEntries SearchIndexEncoding).
 */
export type SearchIndexDbRow = Uint8Array

export type SearchIndexMetaDataDbRow = {
	id: number,
	word: string,
	rows: Uint8Array // sequences of numbers like: [app, type, indexRowId, size, app, type, ...] encoded and encrypted SearchIndexMetadataEntry
}

export type ElementDataDbRow = [
	Id,  // first list id
	Uint8Array,  // second is enc meta row keys encoded in binary format
	Id // third is owner group id
]

export type EncryptedSearchIndexEntryWithHash = {
	encEntry: EncryptedSearchIndexEntry,
	idHash: number
}

export type GroupData = {
	lastBatchIds: Id[];
	indexTimestamp: number;
	groupType: GroupTypeEnum;
}


// runtime types
export type B64EncIndexKey = Base64;
type EncIndexKey = Uint8Array
type EncInstanceId = Uint8Array;
export type B64EncInstanceId = Base64;

export type AttributeHandler = {
	attribute: ModelValue | ModelAssociation;
	value: lazy<string>;
}

export type ElementDataSurrogate = {|
	listId: Id, // we store it here instead of SearchIndexEntry to allow moving mails without changing the SearchIndexEntries for the mail
	encWordsB64: Array<B64EncIndexKey>,
	ownerGroup: Id
|}

export type KeyToIndexEntries = {
	indexKey: Base64;
	indexEntries: DecryptedSearchIndexEntry[];
}

export type KeyToEncryptedIndexEntries = {
	indexKey: Base64;
	indexEntries: EncryptedSearchIndexEntryWithHash[];
}

export type SearchIndexEntry = {
	id: Id,
	attribute: number,
	positions: number[],

}

export type DecryptedSearchIndexEntry = SearchIndexEntry & {encId: Uint8Array}

// We calculate timestamp upfront because we need it for sorting when inserting
export type EncSearchIndexEntryWithTimestamp = {|
	entry: EncryptedSearchIndexEntry,
	timestamp: number
|}

export type EncWordToMetaRow = {[Base64]: number}

export type EncInstanceIdWithTimestamp = {encInstanceId: Uint8Array, timestamp: number, appId: number, typeId: number}

export type IndexUpdate = {
	typeInfo: TypeInfo;// index update must be unique for type
	create: {
		encInstanceIdToElementData: Map<B64EncInstanceId, ElementDataSurrogate>;
		// For each word there's a list of entries we want to insert
		indexMap: Map<B64EncIndexKey, Array<EncSearchIndexEntryWithTimestamp>>;
	};
	move: Array<{encInstanceId: B64EncInstanceId; newListId: Id}>;
	delete: {
		// For each metadata row there's a list of entries we want to delete
		searchMetaRowToEncInstanceIds: Map<number, Array<EncInstanceIdWithTimestamp>>;
		encInstanceIds: B64EncInstanceId[];
	};
}

export type Db = {
	key: Aes256Key; // @pre: must not be accessed before initialized promise is resolved.
	iv: Uint8Array; // fixed iv for all search index entries
	dbFacade: DbFacade;
	initialized: Promise<void>;
}

export type SearchIndexMetaDataRow = {
	id: number,
	word: B64EncIndexKey,
	rows: Array<SearchIndexMetadataEntry>
}

export type SearchIndexMetadataEntry = {
	key: number,
	size: number,
	app: number,
	type: number, // we have app and type in search index meta to filter for type (mail, contact, users) before loading and decrypting index rows.
	oldestElementTimestamp: number
}

export type MoreResultsIndexEntry = {
	id: Id,
	encId: Uint8Array
}

export type SearchRestriction = {
	type: TypeRef<any>;
	start: ?number; // timestamp
	end: ?number; // timestamp
	field: ?string; // must be kept in sync with attributeIds
	attributeIds: ?number[]; // must be kept in sync with field
	listId: ?Id;
}