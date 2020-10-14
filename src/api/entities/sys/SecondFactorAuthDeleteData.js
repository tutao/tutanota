// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const SecondFactorAuthDeleteDataTypeRef: TypeRef<SecondFactorAuthDeleteData> = new TypeRef("sys", "SecondFactorAuthDeleteData")
export const _TypeModel: TypeModel = {
	"name": "SecondFactorAuthDeleteData",
	"since": 62,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1755,
	"rootId": "A3N5cwAG2w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1756,
			"since": 62,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"session": {
			"name": "session",
			"id": 1757,
			"since": 62,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Session",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createSecondFactorAuthDeleteData(values?: $Shape<$Exact<SecondFactorAuthDeleteData>>): SecondFactorAuthDeleteData {
	return Object.assign(create(_TypeModel, SecondFactorAuthDeleteDataTypeRef), values)
}

export type SecondFactorAuthDeleteData = {
	_type: TypeRef<SecondFactorAuthDeleteData>;

	_format: NumberString;

	session: IdTuple;
}