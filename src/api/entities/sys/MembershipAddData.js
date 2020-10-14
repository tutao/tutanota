// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const MembershipAddDataTypeRef: TypeRef<MembershipAddData> = new TypeRef("sys", "MembershipAddData")
export const _TypeModel: TypeModel = {
	"name": "MembershipAddData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 505,
	"rootId": "A3N5cwAB-Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 506,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncGKey": {
			"name": "symEncGKey",
			"id": 507,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 509,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		},
		"user": {
			"name": "user",
			"id": 508,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createMembershipAddData(values?: $Shape<$Exact<MembershipAddData>>): MembershipAddData {
	return Object.assign(create(_TypeModel, MembershipAddDataTypeRef), values)
}

export type MembershipAddData = {
	_type: TypeRef<MembershipAddData>;

	_format: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
	user: Id;
}