// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", "UserSettingsGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "UserSettingsGroupRoot",
	"since": 34,
	"type": "ELEMENT_TYPE",
	"id": 972,
	"rootId": "CHR1dGFub3RhAAPM",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 976,
			"since": 34,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 974, "since": 34, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 978,
			"since": 34,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 977,
			"since": 34,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 975,
			"since": 34,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"startOfTheWeek": {
			"name": "startOfTheWeek",
			"id": 981,
			"since": 34,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"timeFormat": {
			"name": "timeFormat",
			"id": 980,
			"since": 34,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"groupColors": {
			"name": "groupColors",
			"id": 979,
			"since": 34,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "GroupColor",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createUserSettingsGroupRoot(values?: $Shape<$Exact<UserSettingsGroupRoot>>): UserSettingsGroupRoot {
	return Object.assign(create(_TypeModel, UserSettingsGroupRootTypeRef), values)
}
