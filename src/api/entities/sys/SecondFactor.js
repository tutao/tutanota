// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {U2fRegisteredDevice} from "./U2fRegisteredDevice"

export const SecondFactorTypeRef: TypeRef<SecondFactor> = new TypeRef("sys", "SecondFactor")
export const _TypeModel: TypeModel = {
	"name": "SecondFactor",
	"since": 23,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1169,
	"rootId": "A3N5cwAEkQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1173,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1171,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1174,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1172,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1176,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"otpSecret": {
			"id": 1242,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 1175,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"u2f": {
			"id": 1177,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "U2fRegisteredDevice"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createSecondFactor(values?: $Shape<$Exact<SecondFactor>>): SecondFactor {
	return Object.assign(create(_TypeModel, SecondFactorTypeRef), values)
}

export type SecondFactor = {
	_type: TypeRef<SecondFactor>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	name: string;
	otpSecret: ?Uint8Array;
	type: NumberString;

	u2f: ?U2fRegisteredDevice;
}