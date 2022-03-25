import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1115,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 1116,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "AuditLogEntry",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "73"
}

export function createAuditLogRef(values?: Partial<AuditLogRef>): AuditLogRef {
	return Object.assign(create(_TypeModel, AuditLogRefTypeRef), downcast<AuditLogRef>(values))
}

export type AuditLogRef = {
	_type: TypeRef<AuditLogRef>;

	_id: Id;

	items: Id;
}