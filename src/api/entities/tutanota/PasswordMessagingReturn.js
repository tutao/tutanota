// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 314,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"autoAuthenticationId": {
			"id": 315,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createPasswordMessagingReturn(values?: $Shape<$Exact<PasswordMessagingReturn>>): PasswordMessagingReturn {
	return Object.assign(create(_TypeModel, PasswordMessagingReturnTypeRef), values)
}

export type PasswordMessagingReturn = {
	_type: TypeRef<PasswordMessagingReturn>;

	_format: NumberString;
	autoAuthenticationId: Id;
}