// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateTeamGroupDataTypeRef: TypeRef<CreateTeamGroupData> = new TypeRef("tutanota", "CreateTeamGroupData")
export const _TypeModel: TypeModel = {
	"name": "CreateTeamGroupData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 703,
	"rootId": "CHR1dGFub3RhAAK_",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 704,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"encryptedName": {
			"name": "encryptedName",
			"id": 705,
			"since": 19,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"groupData": {
			"name": "groupData",
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "23"
}

export function createCreateTeamGroupData(): CreateTeamGroupData {
	return create(_TypeModel)
}
