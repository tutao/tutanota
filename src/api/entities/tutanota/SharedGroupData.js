// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", "SharedGroupData")
export const _TypeModel: TypeModel = {
	"name": "SharedGroupData",
	"since": 38,
	"type": "AGGREGATED_TYPE",
	"id": 992,
	"rootId": "CHR1dGFub3RhAAPg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 993,
			"since": 38,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncInvitationSessionKey": {
			"name": "bucketEncInvitationSessionKey",
			"id": 998,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"capability": {
			"name": "capability",
			"id": 994,
			"since": 38,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sessionEncInviterName": {
			"name": "sessionEncInviterName",
			"id": 997,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sessionEncSharedGroupKey": {
			"name": "sessionEncSharedGroupKey",
			"id": 995,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sessionEncSharedGroupName": {
			"name": "sessionEncSharedGroupName",
			"id": 996,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroup": {
			"name": "sharedGroup",
			"id": 1001,
			"since": 38,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroupEncInviterGroupInfoKey": {
			"name": "sharedGroupEncInviterGroupInfoKey",
			"id": 999,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sharedGroupEncSharedGroupInfoKey": {
			"name": "sharedGroupEncSharedGroupInfoKey",
			"id": 1000,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "40"
}

export function createSharedGroupData(values?: $Shape<$Exact<SharedGroupData>>): SharedGroupData {
	return Object.assign(create(_TypeModel, SharedGroupDataTypeRef), values)
}
