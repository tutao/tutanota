// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 888,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 889,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "UnencryptedStatisticLogEntry"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createUnencryptedStatisticLogRef(values?: $Shape<$Exact<UnencryptedStatisticLogRef>>): UnencryptedStatisticLogRef {
	return Object.assign(create(_TypeModel, UnencryptedStatisticLogRefTypeRef), values)
}

export type UnencryptedStatisticLogRef = {
	_type: TypeRef<UnencryptedStatisticLogRef>;

	_id: Id;

	items: Id;
}