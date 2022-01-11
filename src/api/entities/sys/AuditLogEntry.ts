import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const AuditLogEntryTypeRef: TypeRef<AuditLogEntry> = new TypeRef("sys", "AuditLogEntry")
export const _TypeModel: TypeModel = {
	"name": "AuditLogEntry",
	"since": 22,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1101,
	"rootId": "A3N5cwAETQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1105,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1103,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1107,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1106,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1104,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"action": {
			"id": 1110,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"actorIpAddress": {
			"id": 1109,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"actorMailAddress": {
			"id": 1108,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"date": {
			"id": 1112,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"modifiedEntity": {
			"id": 1111,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"groupInfo": {
			"id": 1113,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "GroupInfo"
		},
		"modifiedGroupInfo": {
			"id": 1307,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "71"
}

export function createAuditLogEntry(values?: Partial<AuditLogEntry>): AuditLogEntry {
	return Object.assign(create(_TypeModel, AuditLogEntryTypeRef), downcast<AuditLogEntry>(values))
}

export type AuditLogEntry = {
	_type: TypeRef<AuditLogEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	action: string;
	actorIpAddress: null | string;
	actorMailAddress: string;
	date: Date;
	modifiedEntity: string;

	groupInfo:  null | IdTuple;
	modifiedGroupInfo:  null | IdTuple;
}