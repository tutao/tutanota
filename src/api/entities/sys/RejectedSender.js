// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1740,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1738,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1741,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1739,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"reason": {
			"id": 1746,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"recipientMailAddress": {
			"id": 1745,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderHostname": {
			"id": 1744,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderIp": {
			"id": 1743,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"senderMailAddress": {
			"id": 1742,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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