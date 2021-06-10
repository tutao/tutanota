// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 969,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"color": {
			"id": 971,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"name": {
			"id": 1020,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"group": {
			"id": 970,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createGroupSettings(values?: $Shape<$Exact<GroupSettings>>): GroupSettings {
	return Object.assign(create(_TypeModel, GroupSettingsTypeRef), values)
}

export type GroupSettings = {
	_type: TypeRef<GroupSettings>;

	_id: Id;
	color: string;
	name: ?string;

	group: Id;
}