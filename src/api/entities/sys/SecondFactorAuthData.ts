import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {U2fResponseData} from "./U2fResponseData.js"
import type {WebauthnResponseData} from "./WebauthnResponseData.js"

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
		"session": {
			"id": 1232,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Session",
			"dependency": null
		},
		"u2f": {
			"id": 1231,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "U2fResponseData",
			"dependency": null
		},
		"webauthn": {
			"id": 1905,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "WebauthnResponseData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createSecondFactorAuthData(values?: Partial<SecondFactorAuthData>): SecondFactorAuthData {
	return Object.assign(create(_TypeModel, SecondFactorAuthDataTypeRef), downcast<SecondFactorAuthData>(values))
}

export type SecondFactorAuthData = {
	_type: TypeRef<SecondFactorAuthData>;

	_format: NumberString;
	otpCode: null | NumberString;
	type: null | NumberString;

	session:  null | IdTuple;
	u2f:  null | U2fResponseData;
	webauthn:  null | WebauthnResponseData;
}