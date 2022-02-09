import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestAssignmentPostInTypeRef: TypeRef<UsageTestAssignmentPostIn> = new TypeRef("sys", "UsageTestAssignmentPostIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignmentPostIn",
	"since": 72,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1946,
	"rootId": "A3N5cwAHmg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1947,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createUsageTestAssignmentPostIn(values?: Partial<UsageTestAssignmentPostIn>): UsageTestAssignmentPostIn {
	return Object.assign(create(_TypeModel, UsageTestAssignmentPostInTypeRef), downcast<UsageTestAssignmentPostIn>(values))
}

export type UsageTestAssignmentPostIn = {
	_type: TypeRef<UsageTestAssignmentPostIn>;

	_format: NumberString;
}