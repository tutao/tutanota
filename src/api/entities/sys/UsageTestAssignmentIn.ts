import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestAssignmentInTypeRef: TypeRef<UsageTestAssignmentIn> = new TypeRef("sys", "UsageTestAssignmentIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignmentIn",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1956,
	"rootId": "A3N5cwAHpA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1957,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testDeviceId": {
			"id": 1958,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createUsageTestAssignmentIn(values?: Partial<UsageTestAssignmentIn>): UsageTestAssignmentIn {
	return Object.assign(create(_TypeModel, UsageTestAssignmentInTypeRef), downcast<UsageTestAssignmentIn>(values))
}

export type UsageTestAssignmentIn = {
	_type: TypeRef<UsageTestAssignmentIn>;

	_format: NumberString;
	testDeviceId: null | Id;
}