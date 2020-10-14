// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1105,
			"since": 22,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1103,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1107,
			"since": 22,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1106,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1104,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"action": {
			"name": "action",
			"id": 1110,
			"since": 22,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"actorIpAddress": {
			"name": "actorIpAddress",
			"id": 1109,
			"since": 22,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"actorMailAddress": {
			"name": "actorMailAddress",
			"id": 1108,
			"since": 22,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"date": {
			"name": "date",
			"id": 1112,
			"since": 22,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"modifiedEntity": {
			"name": "modifiedEntity",
			"id": 1111,
			"since": 22,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"groupInfo": {
			"name": "groupInfo",
			"id": 1113,
			"since": 22,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"modifiedGroupInfo": {
			"name": "modifiedGroupInfo",
			"id": 1307,
			"since": 27,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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