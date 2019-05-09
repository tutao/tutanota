// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", "InternalGroupData")
export const _TypeModel: TypeModel = {
	"name": "InternalGroupData",
	"since": 16,
	"type": "AGGREGATED_TYPE",
	"id": 643,
	"rootId": "CHR1dGFub3RhAAKD",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 644, "since": 16, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"adminEncGroupKey": {"name": "adminEncGroupKey", "id": 647, "since": 16, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"groupEncPrivateKey": {"name": "groupEncPrivateKey", "id": 646, "since": 16, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"ownerEncGroupInfoSessionKey": {
			"name": "ownerEncGroupInfoSessionKey",
			"id": 648,
			"since": 16,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"publicKey": {"name": "publicKey", "id": 645, "since": 16, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"adminGroup": {
			"name": "adminGroup",
			"id": 875,
			"since": 25,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": true,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createInternalGroupData(): InternalGroupData {
	return create(_TypeModel, InternalGroupDataTypeRef)
}
