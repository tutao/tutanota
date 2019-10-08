// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PasswordMessagingReturnTypeRef: TypeRef<PasswordMessagingReturn> = new TypeRef("tutanota", "PasswordMessagingReturn")
export const _TypeModel: TypeModel = {
	"name": "PasswordMessagingReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 313,
	"rootId": "CHR1dGFub3RhAAE5",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 314,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"autoAuthenticationId": {
			"name": "autoAuthenticationId",
			"id": 315,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createPasswordMessagingReturn(values?: $Shape<$Exact<PasswordMessagingReturn>>): PasswordMessagingReturn {
	return Object.assign(create(_TypeModel, PasswordMessagingReturnTypeRef), values)
}
