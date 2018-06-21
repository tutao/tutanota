// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1322,
			"since": 30,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"country": {
			"name": "country",
			"id": 1323,
			"since": 30,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createLocationServiceGetReturn(): LocationServiceGetReturn {
	return create(_TypeModel)
}
