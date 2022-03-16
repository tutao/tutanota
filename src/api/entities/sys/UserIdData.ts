import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UserIdDataTypeRef: TypeRef<UserIdData> = new TypeRef("sys", "UserIdData")
export const _TypeModel: TypeModel = {
	"name": "UserIdData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 424,
	"rootId": "A3N5cwABqA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 425,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 426,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createUserIdData(values?: Partial<UserIdData>): UserIdData {
	return Object.assign(create(_TypeModel, UserIdDataTypeRef), downcast<UserIdData>(values))
}

export type UserIdData = {
	_type: TypeRef<UserIdData>;

	_format: NumberString;
	mailAddress: string;
}