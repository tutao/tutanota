// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const AuditLogRefTypeRef: TypeRef<AuditLogRef> = new TypeRef("sys", "AuditLogRef")
export const _TypeModel: TypeModel = {
	"name": "AuditLogRef",
	"since": 22,
	"type": "AGGREGATED_TYPE",
	"id": 1114,
	"rootId": "A3N5cwAEWg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1115,
			"since": 22,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1116,
			"since": 22,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "AuditLogEntry",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createAuditLogRef(): AuditLogRef {
	return create(_TypeModel)
}
