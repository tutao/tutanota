import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const TypeInfoTypeRef: TypeRef<TypeInfo> = new TypeRef("sys", "TypeInfo")
export const _TypeModel: TypeModel = {
	"name": "TypeInfo",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1869,
	"rootId": "A3N5cwAHTQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1870,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"application": {
			"id": 1871,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"typeId": {
			"id": 1872,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createTypeInfo(values?: Partial<TypeInfo>): TypeInfo {
	return Object.assign(create(_TypeModel, TypeInfoTypeRef), downcast<TypeInfo>(values))
}

export type TypeInfo = {
	_type: TypeRef<TypeInfo>;

	_id: Id;
	application: string;
	typeId: NumberString;
}