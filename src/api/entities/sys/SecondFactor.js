// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1173,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1171,
			"since": 23,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1174,
			"since": 23,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1172,
			"since": 23,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 1176,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"otpSecret": {
			"name": "otpSecret",
			"id": 1242,
			"since": 24,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 1175,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"u2f": {
			"name": "u2f",
			"id": 1177,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "U2fRegisteredDevice",
			"final": true
		}
	},
	"app": "sys",
	"version": "63"
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