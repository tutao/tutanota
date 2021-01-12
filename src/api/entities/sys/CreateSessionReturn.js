// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {Challenge} from "./Challenge"

export const CreateSessionReturnTypeRef: TypeRef<CreateSessionReturn> = new TypeRef("sys", "CreateSessionReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateSessionReturn",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1219,
	"rootId": "A3N5cwAEww",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1220,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessToken": {
			"id": 1221,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"challenges": {
			"id": 1222,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "Challenge"
		},
		"user": {
			"id": 1223,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createCreateSessionReturn(values?: $Shape<$Exact<CreateSessionReturn>>): CreateSessionReturn {
	return Object.assign(create(_TypeModel, CreateSessionReturnTypeRef), values)
}

export type CreateSessionReturn = {
	_type: TypeRef<CreateSessionReturn>;

	_format: NumberString;
	accessToken: string;

	challenges: Challenge[];
	user: Id;
}