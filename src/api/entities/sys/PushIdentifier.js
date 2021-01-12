// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const PushIdentifierTypeRef: TypeRef<PushIdentifier> = new TypeRef("sys", "PushIdentifier")
export const _TypeModel: TypeModel = {
	"name": "PushIdentifier",
	"since": 5,
	"type": "LIST_ELEMENT_TYPE",
	"id": 625,
	"rootId": "A3N5cwACcQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_area": {
			"id": 631,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"id": 629,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 627,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"id": 630,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1497,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1029,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 628,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"disabled": {
			"id": 1476,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"displayName": {
			"id": 1498,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"identifier": {
			"id": 633,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"id": 634,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastNotificationDate": {
			"id": 1248,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"lastUsageTime": {
			"id": 1704,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pushServiceType": {
			"id": 632,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createPushIdentifier(values?: $Shape<$Exact<PushIdentifier>>): PushIdentifier {
	return Object.assign(create(_TypeModel, PushIdentifierTypeRef), values)
}

export type PushIdentifier = {
	_type: TypeRef<PushIdentifier>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	disabled: boolean;
	displayName: string;
	identifier: string;
	language: string;
	lastNotificationDate: ?Date;
	lastUsageTime: Date;
	pushServiceType: NumberString;
}