import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", "SpamResults")
export const _TypeModel: TypeModel = {
	"name": "SpamResults",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1217,
	"rootId": "CHR1dGFub3RhAATB",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1218,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"id": 1219,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SpamResult"
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createSpamResults(values?: Partial<SpamResults>): SpamResults {
	return Object.assign(create(_TypeModel, SpamResultsTypeRef), downcast<SpamResults>(values))
}

export type SpamResults = {
	_type: TypeRef<SpamResults>;

	_id: Id;

	list: Id;
}