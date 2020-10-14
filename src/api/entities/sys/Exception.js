// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const ExceptionTypeRef: TypeRef<Exception> = new TypeRef("sys", "Exception")
export const _TypeModel: TypeModel = {
	"name": "Exception",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 468,
	"rootId": "A3N5cwAB1A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 469,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"msg": {
			"name": "msg",
			"id": 471,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 470,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createException(values?: $Shape<$Exact<Exception>>): Exception {
	return Object.assign(create(_TypeModel, ExceptionTypeRef), values)
}

export type Exception = {
	_type: TypeRef<Exception>;

	_id: Id;
	msg: string;
	type: string;
}