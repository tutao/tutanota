// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const ChangePasswordDataTypeRef: TypeRef<ChangePasswordData> = new TypeRef("sys", "ChangePasswordData")
export const _TypeModel: TypeModel = {
	"name": "ChangePasswordData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 534,
	"rootId": "A3N5cwACFg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 535,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"code": {
			"name": "code",
			"id": 539,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"oldVerifier": {
			"name": "oldVerifier",
			"id": 1240,
			"since": 23,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {
			"name": "pwEncUserGroupKey",
			"id": 538,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {
			"name": "salt",
			"id": 537,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"verifier": {
			"name": "verifier",
			"id": 536,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createChangePasswordData(): ChangePasswordData {
	return create(_TypeModel)
}
