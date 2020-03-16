// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", "GroupSettings")
export const _TypeModel: TypeModel = {
	"name": "GroupSettings",
	"since": 34,
	"type": "AGGREGATED_TYPE",
	"id": 968,
	"rootId": "CHR1dGFub3RhAAPI",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 969,
			"since": 34,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"color": {
			"name": "color",
			"id": 971,
			"since": 34,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"name": {
			"name": "name",
			"id": 1020,
			"since": 39,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 970,
			"since": 34,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "40"
}

export function createGroupSettings(values?: $Shape<$Exact<GroupSettings>>): GroupSettings {
	return Object.assign(create(_TypeModel, GroupSettingsTypeRef), values)
}
