// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const EncDateWrapperTypeRef: TypeRef<EncDateWrapper> = new TypeRef("tutanota", "EncDateWrapper")
export const _TypeModel: TypeModel = {
	"name": "EncDateWrapper",
	"since": 33,
	"type": "AGGREGATED_TYPE",
	"id": 926,
	"rootId": "CHR1dGFub3RhAAOe",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 927, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"value": {"name": "value", "id": 928, "since": 33, "type": "Date", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "33"
}

export function createEncDateWrapper(): EncDateWrapper {
	return create(_TypeModel, EncDateWrapperTypeRef)
}
