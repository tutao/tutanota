import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", "InternalGroupData")
export const _TypeModel: TypeModel = {
	"name": "InternalGroupData",
	"since": 16,
	"type": "AGGREGATED_TYPE",
	"id": 642,
	"rootId": "CHR1dGFub3RhAAKC",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 643,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGroupKey": {
			"id": 646,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupEncPrivateKey": {
			"id": 645,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncGroupInfoSessionKey": {
			"id": 647,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"publicKey": {
			"id": 644,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroup": {
			"id": 874,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group"
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createInternalGroupData(values?: Partial<InternalGroupData>): InternalGroupData {
	return Object.assign(create(_TypeModel, InternalGroupDataTypeRef), downcast<InternalGroupData>(values))
}

export type InternalGroupData = {
	_type: TypeRef<InternalGroupData>;

	_id: Id;
	adminEncGroupKey: Uint8Array;
	groupEncPrivateKey: Uint8Array;
	ownerEncGroupInfoSessionKey: Uint8Array;
	publicKey: Uint8Array;

	adminGroup:  null | Id;
}