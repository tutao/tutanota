import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const WhitelabelParentTypeRef: TypeRef<WhitelabelParent> = new TypeRef("sys", "WhitelabelParent")
export const _TypeModel: TypeModel = {
	"name": "WhitelabelParent",
	"since": 26,
	"type": "AGGREGATED_TYPE",
	"id": 1272,
	"rootId": "A3N5cwAE-A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1273,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"customer": {
			"id": 1274,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Customer",
			"dependency": null
		},
		"whitelabelChildInParent": {
			"id": 1275,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "WhitelabelChild",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createWhitelabelParent(values?: Partial<WhitelabelParent>): WhitelabelParent {
	return Object.assign(create(_TypeModel, WhitelabelParentTypeRef), downcast<WhitelabelParent>(values))
}

export type WhitelabelParent = {
	_type: TypeRef<WhitelabelParent>;

	_id: Id;

	customer: Id;
	whitelabelChildInParent: IdTuple;
}