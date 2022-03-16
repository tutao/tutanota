import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 506,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncGKey": {
			"id": 507,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 509,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group",
			"dependency": null
		},
		"user": {
			"id": 508,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createMembershipAddData(values?: Partial<MembershipAddData>): MembershipAddData {
	return Object.assign(create(_TypeModel, MembershipAddDataTypeRef), downcast<MembershipAddData>(values))
}

export type MembershipAddData = {
	_type: TypeRef<MembershipAddData>;

	_format: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
	user: Id;
}