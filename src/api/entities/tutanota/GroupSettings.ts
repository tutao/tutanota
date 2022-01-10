import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "49"
}

export function createGroupSettings(values?: Partial<GroupSettings>): GroupSettings {
	return Object.assign(create(_TypeModel, GroupSettingsTypeRef), downcast<GroupSettings>(values))
}

export type GroupSettings = {
	_type: TypeRef<GroupSettings>;

	_id: Id;
	color: string;
	name: null | string;

	group: Id;
}