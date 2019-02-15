//@flow
import type {DbFacade} from "./DbFacade"
import type {GroupTypeEnum} from "../../common/TutanotaConstants"


// db types
export type EncryptedSearchIndexEntry = Uint8Array // first part encrypted element id (16 bytes), second part encrypted app, attribute, type and positions

export type SearchIndexRow = [
	number, // Metadata reference
	Uint8Array // Binary encoded EncryptedSearchIndexEntries (see SearchIndexEncoding.js)
	]

export type EncryptedSearchIndexMetaDataRow = {
	id: number,
	word: string,
	rows: Uint8Array // sequences of numbers like: [app, type, indexRowId, size, app, type, ...]
}

export type ElementData = [Id, Uint8Array, Id] //first list id, second is enc search index row keys, third is owner group id

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

export type ElementDataSurrogate = {
	listId: Id, // we store it here instead of SearchIndexEntry to allow moving mails without changing the SearchIndexEntries for the mail
	encWordsB64: Array<B64EncIndexKey>,
	ownerGroup: Id
}

export type KeyToIndexEntries = {
	indexKey: Base64;
	indexEntries: SearchIndexEntry[];
}

export type KeyToEncryptedIndexEntries = {
	indexKey: Base64;
	indexEntries: EncryptedSearchIndexEntryWithHash[];
}

export type SearchIndexEntry = {
	id: Id,
	attribute: number,
	positions: number[],
	// encId and is only set for entries that are retrived from the db (see decryptSearchIndexEntry)
	encId?: Uint8Array
}

export type SearchIndexEntriesByAppType = {
	[number]: {
		[number]: Array<EncryptedSearchIndexEntry>
	}
}

export type IndexUpdate = {
	groupId: Id;
	batchId: ?IdTuple;
	indexTimestamp: ?number;
	create: {
		encInstanceIdToElementData: Map<B64EncInstanceId, ElementDataSurrogate>;
		indexMap: Map<B64EncIndexKey, SearchIndexEntriesByAppType>;
	};
	move: {
		encInstanceId: B64EncInstanceId;
		newListId: Id;
	}[];
	delete: {
		searchIndexRowToEncInstanceIds: Map<number, Uint8Array[]>;
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
}

export type MoreResultsIndexEntry = {
	id: Id,
	encId: Uint8Array
}

