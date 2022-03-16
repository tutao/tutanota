import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1756,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"session": {
			"id": 1757,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Session",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createSecondFactorAuthDeleteData(values?: Partial<SecondFactorAuthDeleteData>): SecondFactorAuthDeleteData {
	return Object.assign(create(_TypeModel, SecondFactorAuthDeleteDataTypeRef), downcast<SecondFactorAuthDeleteData>(values))
}

export type SecondFactorAuthDeleteData = {
	_type: TypeRef<SecondFactorAuthDeleteData>;

	_format: NumberString;

	session: IdTuple;
}