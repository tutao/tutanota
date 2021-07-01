// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 469,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"msg": {
			"id": 471,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 470,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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