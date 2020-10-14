// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {Challenge} from "./Challenge"

export const SessionTypeRef: TypeRef<Session> = new TypeRef("sys", "Session")
export const _TypeModel: TypeModel = {
	"name": "Session",
	"since": 23,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1191,
	"rootId": "A3N5cwAEpw",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1195,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1193,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1197,
			"since": 23,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1196,
			"since": 23,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1194,
			"since": 23,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accessKey": {
			"name": "accessKey",
			"id": 1202,
			"since": 23,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"clientIdentifier": {
			"name": "clientIdentifier",
			"id": 1198,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"lastAccessTime": {
			"name": "lastAccessTime",
			"id": 1201,
			"since": 23,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"loginIpAddress": {
			"name": "loginIpAddress",
			"id": 1200,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"loginTime": {
			"name": "loginTime",
			"id": 1199,
			"since": 23,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"state": {
			"name": "state",
			"id": 1203,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"challenges": {
			"name": "challenges",
			"id": 1204,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "Challenge",
			"final": true
		},
		"user": {
			"name": "user",
			"id": 1205,
			"since": 23,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createSession(values?: $Shape<$Exact<Session>>): Session {
	return Object.assign(create(_TypeModel, SessionTypeRef), values)
}

export type Session = {
	_type: TypeRef<Session>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	accessKey: ?Uint8Array;
	clientIdentifier: string;
	lastAccessTime: Date;
	loginIpAddress: ?string;
	loginTime: Date;
	state: NumberString;

	challenges: Challenge[];
	user: Id;
}