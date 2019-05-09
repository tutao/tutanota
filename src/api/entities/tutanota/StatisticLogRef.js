// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const StatisticLogRefTypeRef: TypeRef<StatisticLogRef> = new TypeRef("tutanota", "StatisticLogRef")
export const _TypeModel: TypeModel = {
	"name": "StatisticLogRef",
	"since": 25,
	"type": "AGGREGATED_TYPE",
	"id": 876,
	"rootId": "CHR1dGFub3RhAANs",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 877, "since": 25, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"items": {
			"name": "items",
			"id": 878,
			"since": 25,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "StatisticLogEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createStatisticLogRef(): StatisticLogRef {
	return create(_TypeModel, StatisticLogRefTypeRef)
}
