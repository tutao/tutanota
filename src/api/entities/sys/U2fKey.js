// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const U2fKeyTypeRef: TypeRef<U2fKey> = new TypeRef("sys", "U2fKey")
export const _TypeModel: TypeModel = {
	"name": "U2fKey",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1178,
	"rootId": "A3N5cwAEmg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1179,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"appId": {
			"id": 1181,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"id": 1180,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"secondFactor": {
			"id": 1182,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "SecondFactor"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createU2fKey(values?: $Shape<$Exact<U2fKey>>): U2fKey {
	return Object.assign(create(_TypeModel, U2fKeyTypeRef), values)
}

export type U2fKey = {
	_type: TypeRef<U2fKey>;

	_id: Id;
	appId: string;
	keyHandle: Uint8Array;

	secondFactor: IdTuple;
}