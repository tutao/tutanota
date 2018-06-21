// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const DomainsRefTypeRef: TypeRef<DomainsRef> = new TypeRef("sys", "DomainsRef")
export const _TypeModel: TypeModel = {
	"name": "DomainsRef",
	"since": 21,
	"type": "AGGREGATED_TYPE",
	"id": 1096,
	"rootId": "A3N5cwAESA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1097,
			"since": 21,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1098,
			"since": 21,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Domain",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createDomainsRef(): DomainsRef {
	return create(_TypeModel)
}
