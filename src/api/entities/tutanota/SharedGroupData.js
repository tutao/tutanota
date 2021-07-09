// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 993,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncInvitationSessionKey": {
			"id": 998,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"capability": {
			"id": 994,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sessionEncInviterName": {
			"id": 997,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sessionEncSharedGroupKey": {
			"id": 995,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sessionEncSharedGroupName": {
			"id": 996,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroup": {
			"id": 1001,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroupEncInviterGroupInfoKey": {
			"id": 999,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"sharedGroupEncSharedGroupInfoKey": {
			"id": 1000,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createSharedGroupData(values?: $Shape<$Exact<SharedGroupData>>): SharedGroupData {
	return Object.assign(create(_TypeModel, SharedGroupDataTypeRef), values)
}

export type SharedGroupData = {
	_type: TypeRef<SharedGroupData>;

	_id: Id;
	bucketEncInvitationSessionKey: Uint8Array;
	capability: NumberString;
	sessionEncInviterName: Uint8Array;
	sessionEncSharedGroupKey: Uint8Array;
	sessionEncSharedGroupName: Uint8Array;
	sharedGroup: Id;
	sharedGroupEncInviterGroupInfoKey: Uint8Array;
	sharedGroupEncSharedGroupInfoKey: Uint8Array;
}