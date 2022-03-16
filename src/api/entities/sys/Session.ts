import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {Challenge} from "./Challenge.js"

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
			"id": 1195,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1193,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1197,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1196,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1194,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"accessKey": {
			"id": 1202,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"clientIdentifier": {
			"id": 1198,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"lastAccessTime": {
			"id": 1201,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"loginIpAddress": {
			"id": 1200,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"loginTime": {
			"id": 1199,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"state": {
			"id": 1203,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"challenges": {
			"id": 1204,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "Challenge",
			"dependency": null
		},
		"user": {
			"id": 1205,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createSession(values?: Partial<Session>): Session {
	return Object.assign(create(_TypeModel, SessionTypeRef), downcast<Session>(values))
}

export type Session = {
	_type: TypeRef<Session>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	accessKey: null | Uint8Array;
	clientIdentifier: string;
	lastAccessTime: Date;
	loginIpAddress: null | string;
	loginTime: Date;
	state: NumberString;

	challenges: Challenge[];
	user: Id;
}