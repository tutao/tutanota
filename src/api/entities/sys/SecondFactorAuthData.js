// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 542,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"otpCode": {
			"id": 1243,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 1230,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"u2f": {
			"id": 1231,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "U2fResponseData"
		},
		"session": {
			"id": 1232,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Session"
		}
	},
	"app": "sys",
	"version": "68"
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