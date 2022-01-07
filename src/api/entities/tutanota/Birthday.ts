import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const BirthdayTypeRef: TypeRef<Birthday> = new TypeRef("tutanota", "Birthday")
export const _TypeModel: TypeModel = {
	"name": "Birthday",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 844,
	"rootId": "CHR1dGFub3RhAANM",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 845,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"day": {
			"id": 846,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"month": {
			"id": 847,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"year": {
			"id": 848,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createBirthday(values?: Partial<Birthday>): Birthday {
	return Object.assign(create(_TypeModel, BirthdayTypeRef), downcast<Birthday>(values))
}

export type Birthday = {
	_type: TypeRef<Birthday>;

	_id: Id;
	day: NumberString;
	month: NumberString;
	year: null | NumberString;
}