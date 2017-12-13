//@flow
import type {DbFacade} from "./DbFacade"
import type {GroupTypeEnum} from "../../common/TutanotaConstants"


// db types
export type EncryptedSearchIndexEntry = [Uint8Array, Uint8Array] // first entry encrypted element id, second entry encrypted app, attribute, type and positions

export type ElementData = [Id, Uint8Array, Id] // first element of value is listId, second is encrypted words of instance seperated by whitespace, third is the ownerGroup of the element

export type GroupData = {
	lastBatchIds:Id[];
	indexTimestamp:number;
	groupType: GroupTypeEnum;
}

// runtime types
type B64EncIndexKey = Base64;
type EncIndexKey = Uint8Array
type EncInstanceId = Uint8Array;
export type B64EncInstanceId = Base64;

export type AttributeHandler ={
	attribute: ModelValue|ModelAssociation;
	value: lazy<string>;
}

export type KeyToIndexEntries = {
	indexKey: Base64;
	indexEntries: SearchIndexEntry[];
}

export type KeyToEncryptedIndexEntries = {
	indexKey: Base64;
	indexEntries: EncryptedSearchIndexEntry[];
}

export type SearchIndexEntry = {
	id:Id;
	app:number;
	type:number;
	attribute: number;
	positions:number[];
	// encId and is only set for entries that are retrived from the db (see decryptSearchIndexEntry)
	encId?: Uint8Array;
}

export type IndexUpdate = {
	groupId:Id;
	batchId: ?IdTuple;
	indexTimestamp:?number;
	create : {
		encInstanceIdToElementData: Map<B64EncInstanceId,ElementData>;
		indexMap: Map<B64EncIndexKey, EncryptedSearchIndexEntry[]>;
	};
	move: {
		encInstanceId: B64EncInstanceId;
		newListId: Id;
	}[];
	delete: {
		encWordToEncInstanceIds: Map<Base64, B64EncInstanceId[]>;
		encInstanceIds: B64EncInstanceId[];
	};
}

export type Db = {
	key: Aes256Key;
	dbFacade: DbFacade;
}


