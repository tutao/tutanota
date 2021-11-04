// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
	"version": "69"
}

export function createTypeInfo(values?: $Shape<$Exact<TypeInfo>>): TypeInfo {
	return Object.assign(create(_TypeModel, TypeInfoTypeRef), values)
}

export type TypeInfo = {
	_type: TypeRef<TypeInfo>;

	_id: Id;
	application: string;
	typeId: NumberString;
}