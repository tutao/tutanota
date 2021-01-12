// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const LocationServiceGetReturnTypeRef: TypeRef<LocationServiceGetReturn> = new TypeRef("sys", "LocationServiceGetReturn")
export const _TypeModel: TypeModel = {
	"name": "LocationServiceGetReturn",
	"since": 30,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1321,
	"rootId": "A3N5cwAFKQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1322,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"country": {
			"id": 1323,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createLocationServiceGetReturn(values?: $Shape<$Exact<LocationServiceGetReturn>>): LocationServiceGetReturn {
	return Object.assign(create(_TypeModel, LocationServiceGetReturnTypeRef), values)
}

export type LocationServiceGetReturn = {
	_type: TypeRef<LocationServiceGetReturn>;

	_format: NumberString;
	country: string;
}