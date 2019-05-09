// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PasswordAutoAuthenticationReturnTypeRef: TypeRef<PasswordAutoAuthenticationReturn> = new TypeRef("tutanota", "PasswordAutoAuthenticationReturn")
export const _TypeModel: TypeModel = {
	"name": "PasswordAutoAuthenticationReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 318,
	"rootId": "CHR1dGFub3RhAAE-",
	"versioned": false,
	"encrypted": false,
	"values": {"_format": {"name": "_format", "id": 319, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createPasswordAutoAuthenticationReturn(): PasswordAutoAuthenticationReturn {
	return create(_TypeModel, PasswordAutoAuthenticationReturnTypeRef)
}
