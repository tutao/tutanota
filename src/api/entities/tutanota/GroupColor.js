// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupColorTypeRef: TypeRef<GroupColor> = new TypeRef("tutanota", "GroupColor")
export const _TypeModel: TypeModel = {
	"name": "GroupColor",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 964,
	"rootId": "CHR1dGFub3RhAAPE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 965, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"color": {"name": "color", "id": 966, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "33"
}

export function createGroupColor(): GroupColor {
	return create(_TypeModel, GroupColorTypeRef)
}
