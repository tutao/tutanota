// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const RejectedSenderTypeRef: TypeRef<RejectedSender> = new TypeRef("sys", "RejectedSender")
export const _TypeModel: TypeModel = {
	"name": "RejectedSender",
	"since": 60,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1736,
	"rootId": "A3N5cwAGyA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1740,
			"since": 60,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1738,
			"since": 60,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1741,
			"since": 60,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1739,
			"since": 60,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"reason": {
			"name": "reason",
			"id": 1746,
			"since": 60,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recipientMailAddress": {
			"name": "recipientMailAddress",
			"id": 1745,
			"since": 60,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderHostname": {
			"name": "senderHostname",
			"id": 1744,
			"since": 60,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderIp": {
			"name": "senderIp",
			"id": 1743,
			"since": 60,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderMailAddress": {
			"name": "senderMailAddress",
			"id": 1742,
			"since": 60,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createRejectedSender(values?: $Shape<$Exact<RejectedSender>>): RejectedSender {
	return Object.assign(create(_TypeModel, RejectedSenderTypeRef), values)
}

export type RejectedSender = {
	_type: TypeRef<RejectedSender>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	reason: string;
	recipientMailAddress: string;
	senderHostname: string;
	senderIp: string;
	senderMailAddress: string;
}