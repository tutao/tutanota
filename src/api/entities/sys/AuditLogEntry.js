// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "69"
}

export function createAuditLogEntry(values?: $Shape<$Exact<AuditLogEntry>>): AuditLogEntry {
	return Object.assign(create(_TypeModel, AuditLogEntryTypeRef), values)
}

export type AuditLogEntry = {
	_type: TypeRef<AuditLogEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	action: string;
	actorIpAddress: ?string;
	actorMailAddress: string;
	date: Date;
	modifiedEntity: string;

	groupInfo: ?IdTuple;
	modifiedGroupInfo: ?IdTuple;
}