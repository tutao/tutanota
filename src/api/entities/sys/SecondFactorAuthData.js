// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {U2fResponseData} from "./U2fResponseData"

export const SecondFactorAuthDataTypeRef: TypeRef<SecondFactorAuthData> = new TypeRef("sys", "SecondFactorAuthData")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 541,
	"rootId": "A3N5cwACHQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 542,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"otpCode": {
			"name": "otpCode",
			"id": 1243,
			"since": 24,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 1230,
			"since": 23,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"u2f": {
			"name": "u2f",
			"id": 1231,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "U2fResponseData",
			"final": true
		},
		"session": {
			"name": "session",
			"id": 1232,
			"since": 23,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Session",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createSecondFactorAuthData(values?: $Shape<$Exact<SecondFactorAuthData>>): SecondFactorAuthData {
	return Object.assign(create(_TypeModel, SecondFactorAuthDataTypeRef), values)
}

export type SecondFactorAuthData = {
	_type: TypeRef<SecondFactorAuthData>;

	_format: NumberString;
	otpCode: ?NumberString;
	type: ?NumberString;

	u2f: ?U2fResponseData;
	session: ?IdTuple;
}