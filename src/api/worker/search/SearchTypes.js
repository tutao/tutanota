//@flow
import type {DbFacade} from "./DbFacade"
import type {GroupTypeEnum} from "../../common/TutanotaConstants"


// db types
export type EncryptedSearchIndexEntry = Uint8Array // first part encrypted element id (16 bytes), second part encrypted app, attribute, type and positions

export type EncryptedSearchIndexEntryWithHash = {
	encEntry: EncryptedSearchIndexEntry,
	idHash: number
}

export type ElementData = [Id, Uint8Array, Id] // first element of value is listId (we store it here instead of SearchIndexEntry to allow moving mails without changing the SearchIndexEntries for the mail), second is encrypted words of instance seperated by whitespace, third is the ownerGroup of the element

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

export type KeyToIndexEntries = {
	indexKey: Base64;
	indexEntries: SearchIndexEntry[];
}

export type KeyToEncryptedIndexEntries = {
	indexKey: Base64;
	indexEntries: EncryptedSearchIndexEntryWithHash[];
}

export type SearchIndexEntry = {
	id: Id;
	app: number; // we have app and type on SearchIndexEntry instead of ElementData to be able to filter them before loading ElementData for each found instance
	type: number;
	attribute: number;
	positions: number[];
	// encId and is only set for entries that are retrived from the db (see decryptSearchIndexEntry)
	encId?: Uint8Array;
}

export type IndexUpdate = {
	groupId: Id;
	batchId: ?IdTuple;
	indexTimestamp: ?number;
	create: {
		encInstanceIdToElementData: Map<B64EncInstanceId, ElementData>;
		indexMap: Map<B64EncIndexKey, EncryptedSearchIndexEntry[]>;
	};
	move: {
		encInstanceId: B64EncInstanceId;
		newListId: Id;
	}[];
	delete: {
		encWordToEncInstanceIds: Map<Base64, Uint8Array[]>;
		encInstanceIds: B64EncInstanceId[];
	};
}

export type Db = {
	key: Aes256Key; // @pre: must not be accessed before initialized promise is resolved.
	iv: Uint8Array; // fixed iv for all search index entries
	dbFacade: DbFacade;
	initialized: Promise<void>;
}

export type SearchIndexMetadataEntry = {
	key: number,
	size: number
}

export type MoreResultsIndexEntry = {
	id: Id,
	encId: Uint8Array
}

