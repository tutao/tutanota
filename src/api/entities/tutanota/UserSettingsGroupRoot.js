// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", "UserSettingsGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "UserSettingsGroupRoot",
	"since": 33,
	"type": "ELEMENT_TYPE",
	"id": 968,
	"rootId": "CHR1dGFub3RhAAPI",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 972, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 970, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 974,
			"since": 33,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 973, "since": 33, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 971, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"calendarColors": {
			"name": "calendarColors",
			"id": 975,
			"since": 33,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "GroupColor",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "33"
}

export function createUserSettingsGroupRoot(): UserSettingsGroupRoot {
	return create(_TypeModel, UserSettingsGroupRootTypeRef)
}
