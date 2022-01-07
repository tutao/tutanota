import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const NameTypeRef: TypeRef<Name> = new TypeRef("tutanota", "Name")
export const _TypeModel: TypeModel = {
	"name": "Name",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 725,
	"rootId": "CHR1dGFub3RhAALV",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 726,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 727,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "49"
}

export function createName(values?: Partial<Name>): Name {
	return Object.assign(create(_TypeModel, NameTypeRef), downcast<Name>(values))
}

export type Name = {
	_type: TypeRef<Name>;

	_id: Id;
	name: string;
}