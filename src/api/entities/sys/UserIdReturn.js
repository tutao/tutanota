// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const UserIdReturnTypeRef: TypeRef<UserIdReturn> = new TypeRef("sys", "UserIdReturn")
export const _TypeModel: TypeModel = {
	"name": "UserIdReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 427,
	"rootId": "A3N5cwABqw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 428,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"userId": {
			"name": "userId",
			"id": 429,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createUserIdReturn(): UserIdReturn {
	return create(_TypeModel)
}
