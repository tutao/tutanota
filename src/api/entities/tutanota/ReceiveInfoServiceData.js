// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", "ReceiveInfoServiceData")
export const _TypeModel: TypeModel = {
	"name": "ReceiveInfoServiceData",
	"since": 12,
	"type": "DATA_TRANSFER_TYPE",
	"id": 570,
	"rootId": "CHR1dGFub3RhAAI6",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 571,
			"since": 12,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createReceiveInfoServiceData(values?: $Shape<$Exact<ReceiveInfoServiceData>>): ReceiveInfoServiceData {
	return Object.assign(create(_TypeModel, ReceiveInfoServiceDataTypeRef), values)
}
