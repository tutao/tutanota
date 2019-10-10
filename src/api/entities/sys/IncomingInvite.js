// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const IncomingInviteTypeRef: TypeRef<IncomingInvite> = new TypeRef("sys", "IncomingInvite")
export const _TypeModel: TypeModel = {
	"name": "IncomingInvite",
	"since": 51,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1602,
	"rootId": "A3N5cwAGQg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1606,
			"since": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 1604, "since": 51, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1607,
			"since": 51,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1605,
			"since": 51,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncGroupKey": {
			"name": "bucketEncGroupKey",
			"id": 1609,
			"since": 51,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubEncBucketKey": {
			"name": "pubEncBucketKey",
			"id": 1608,
			"since": 51,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKeyVersion": {
			"name": "pubKeyVersion",
			"id": 1610,
			"since": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"groupInfo": {
			"name": "groupInfo",
			"id": 1612,
			"since": 51,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": false,
			"external": false
		},
		"groupInvitation": {
			"name": "groupInvitation",
			"id": 1611,
			"since": 51,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInvitation",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "51"
}

export function createIncomingInvite(values?: $Shape<$Exact<IncomingInvite>>): IncomingInvite {
	return Object.assign(create(_TypeModel, IncomingInviteTypeRef), values)
}
