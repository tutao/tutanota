import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", "UserAreaGroupData")
export const _TypeModel: TypeModel = {
	"name": "UserAreaGroupData",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 956,
	"rootId": "CHR1dGFub3RhAAO8",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 957,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGroupKey": {
			"id": 959,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"customerEncGroupInfoSessionKey": {
			"id": 960,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupEncGroupRootSessionKey": {
			"id": 958,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupInfoEncName": {
			"id": 962,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEncGroupKey": {
			"id": 961,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"adminGroup": {
			"id": 963,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createUserAreaGroupData(values?: Partial<UserAreaGroupData>): UserAreaGroupData {
	return Object.assign(create(_TypeModel, UserAreaGroupDataTypeRef), downcast<UserAreaGroupData>(values))
}

export type UserAreaGroupData = {
	_type: TypeRef<UserAreaGroupData>;

	_id: Id;
	adminEncGroupKey: null | Uint8Array;
	customerEncGroupInfoSessionKey: Uint8Array;
	groupEncGroupRootSessionKey: Uint8Array;
	groupInfoEncName: Uint8Array;
	userEncGroupKey: Uint8Array;

	adminGroup:  null | Id;
}