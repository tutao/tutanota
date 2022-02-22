import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestParticipationPostOutTypeRef: TypeRef<UsageTestParticipationPostOut> = new TypeRef("sys", "UsageTestParticipationPostOut")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPostOut",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1980,
	"rootId": "A3N5cwAHvA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1981,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"participationId": {
			"id": 1982,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createUsageTestParticipationPostOut(values?: Partial<UsageTestParticipationPostOut>): UsageTestParticipationPostOut {
	return Object.assign(create(_TypeModel, UsageTestParticipationPostOutTypeRef), downcast<UsageTestParticipationPostOut>(values))
}

export type UsageTestParticipationPostOut = {
	_type: TypeRef<UsageTestParticipationPostOut>;

	_format: NumberString;
	participationId: Id;
}