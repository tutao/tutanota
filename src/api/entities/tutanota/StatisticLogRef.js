// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const StatisticLogRefTypeRef: TypeRef<StatisticLogRef> = new TypeRef("tutanota", "StatisticLogRef")
export const _TypeModel: TypeModel = {
	"name": "StatisticLogRef",
	"since": 25,
	"type": "AGGREGATED_TYPE",
	"id": 875,
	"rootId": "CHR1dGFub3RhAANr",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 876,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 877,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "StatisticLogEntry"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createStatisticLogRef(values?: $Shape<$Exact<StatisticLogRef>>): StatisticLogRef {
	return Object.assign(create(_TypeModel, StatisticLogRefTypeRef), values)
}

export type StatisticLogRef = {
	_type: TypeRef<StatisticLogRef>;

	_id: Id;

	items: Id;
}