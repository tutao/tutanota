// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UnencryptedStatisticLogRefTypeRef: TypeRef<UnencryptedStatisticLogRef> = new TypeRef("tutanota", "UnencryptedStatisticLogRef")
export const _TypeModel: TypeModel = {
	"name": "UnencryptedStatisticLogRef",
	"since": 25,
	"type": "AGGREGATED_TYPE",
	"id": 887,
	"rootId": "CHR1dGFub3RhAAN3",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 888,
			"since": 25,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 889,
			"since": 25,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "UnencryptedStatisticLogEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "40"
}

export function createUnencryptedStatisticLogRef(values?: $Shape<$Exact<UnencryptedStatisticLogRef>>): UnencryptedStatisticLogRef {
	return Object.assign(create(_TypeModel, UnencryptedStatisticLogRefTypeRef), values)
}
