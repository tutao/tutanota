import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", "UserAreaGroupDeleteData")
export const _TypeModel: TypeModel = {
	"name": "UserAreaGroupDeleteData",
	"since": 45,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1190,
	"rootId": "CHR1dGFub3RhAASm",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1191,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 1192,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createUserAreaGroupDeleteData(values?: Partial<UserAreaGroupDeleteData>): UserAreaGroupDeleteData {
	return Object.assign(create(_TypeModel, UserAreaGroupDeleteDataTypeRef), downcast<UserAreaGroupDeleteData>(values))
}

export type UserAreaGroupDeleteData = {
	_type: TypeRef<UserAreaGroupDeleteData>;

	_format: NumberString;

	group: Id;
}