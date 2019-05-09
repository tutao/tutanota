// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PasswordChannelPhoneNumberTypeRef: TypeRef<PasswordChannelPhoneNumber> = new TypeRef("tutanota", "PasswordChannelPhoneNumber")
export const _TypeModel: TypeModel = {
	"name": "PasswordChannelPhoneNumber",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 136,
	"rootId": "CHR1dGFub3RhAACI",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 137, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"number": {"name": "number", "id": 138, "since": 1, "type": "String", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createPasswordChannelPhoneNumber(): PasswordChannelPhoneNumber {
	return create(_TypeModel, PasswordChannelPhoneNumberTypeRef)
}
