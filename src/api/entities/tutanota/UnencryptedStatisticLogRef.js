// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UnencryptedStatisticLogRefTypeRef: TypeRef<UnencryptedStatisticLogRef> = new TypeRef("tutanota", "UnencryptedStatisticLogRef")
export const _TypeModel: TypeModel = {
	"name": "UnencryptedStatisticLogRef",
	"since": 25,
	"type": "AGGREGATED_TYPE",
	"id": 888,
	"rootId": "CHR1dGFub3RhAAN4",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 889, "since": 25, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"items": {
			"name": "items",
			"id": 890,
			"since": 25,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "UnencryptedStatisticLogEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createUnencryptedStatisticLogRef(): UnencryptedStatisticLogRef {
	return create(_TypeModel, UnencryptedStatisticLogRefTypeRef)
}
