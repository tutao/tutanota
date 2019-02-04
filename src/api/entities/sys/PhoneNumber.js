// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PhoneNumberTypeRef: TypeRef<PhoneNumber> = new TypeRef("sys", "PhoneNumber")
export const _TypeModel: TypeModel = {
	"name": "PhoneNumber",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 63,
	"rootId": "A3N5cwA_",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 64, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"number": {"name": "number", "id": 65, "since": 1, "type": "String", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "sys",
	"version": "42"
}

export function createPhoneNumber(): PhoneNumber {
	return create(_TypeModel)
}
