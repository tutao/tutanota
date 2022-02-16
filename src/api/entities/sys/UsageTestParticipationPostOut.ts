import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestParticipationPostOutTypeRef: TypeRef<UsageTestParticipationPostOut> = new TypeRef("sys", "UsageTestParticipationPostOut")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPostOut",
	"since": 72,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1968,
	"rootId": "A3N5cwAHsA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1969,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"participationId": {
			"id": 1970,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createUsageTestParticipationPostOut(values?: Partial<UsageTestParticipationPostOut>): UsageTestParticipationPostOut {
	return Object.assign(create(_TypeModel, UsageTestParticipationPostOutTypeRef), downcast<UsageTestParticipationPostOut>(values))
}

export type UsageTestParticipationPostOut = {
	_type: TypeRef<UsageTestParticipationPostOut>;

	_format: NumberString;
	participationId: Id;
}