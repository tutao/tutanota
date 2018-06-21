// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const PushIdentifierTypeRef: TypeRef<PushIdentifier> = new TypeRef("sys", "PushIdentifier")
export const _TypeModel: TypeModel = {
	"name": "PushIdentifier",
	"since": 5,
	"type": "LIST_ELEMENT_TYPE",
	"id": 625,
	"rootId": "A3N5cwACcQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_area": {
			"name": "_area",
			"id": 631,
			"since": 5,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"name": "_format",
			"id": 629,
			"since": 5,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 627,
			"since": 5,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"name": "_owner",
			"id": 630,
			"since": 5,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1029,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 628,
			"since": 5,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"identifier": {
			"name": "identifier",
			"id": 633,
			"since": 5,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"language": {
			"name": "language",
			"id": 634,
			"since": 5,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastNotificationDate": {
			"name": "lastNotificationDate",
			"id": 1248,
			"since": 24,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pushServiceType": {
			"name": "pushServiceType",
			"id": 632,
			"since": 5,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createPushIdentifier(): PushIdentifier {
	return create(_TypeModel)
}
