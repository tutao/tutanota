// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteSessionServicePostTypeRef: TypeRef<DeleteSessionServicePost> = new TypeRef("sys", "DeleteSessionServicePost")
export const _TypeModel: TypeModel = {
	"name": "DeleteSessionServicePost",
	"since": 50,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1595,
	"rootId": "A3N5cwAGOw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1596,
			"since": 50,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessToken": {
			"name": "accessToken",
			"id": 1597,
			"since": 50,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"sessionId": {
			"name": "sessionId",
			"id": 1598,
			"since": 50,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Session",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "50"
}

export function createDeleteSessionServicePost(values?: $Shape<$Exact<DeleteSessionServicePost>>): DeleteSessionServicePost {
	return Object.assign(create(_TypeModel, DeleteSessionServicePostTypeRef), values)
}
