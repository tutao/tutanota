// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const NameTypeRef: TypeRef<Name> = new TypeRef("tutanota", "Name")
export const _TypeModel: TypeModel = {
	"name": "Name",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 726,
	"rootId": "CHR1dGFub3RhAALW",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 727, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"name": {"name": "name", "id": 728, "since": 19, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createName(): Name {
	return create(_TypeModel, NameTypeRef)
}
