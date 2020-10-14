// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const AdministratedGroupsRefTypeRef: TypeRef<AdministratedGroupsRef> = new TypeRef("sys", "AdministratedGroupsRef")
export const _TypeModel: TypeModel = {
	"name": "AdministratedGroupsRef",
	"since": 27,
	"type": "AGGREGATED_TYPE",
	"id": 1303,
	"rootId": "A3N5cwAFFw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1304,
			"since": 27,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1305,
			"since": 27,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "AdministratedGroup",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createAdministratedGroupsRef(values?: $Shape<$Exact<AdministratedGroupsRef>>): AdministratedGroupsRef {
	return Object.assign(create(_TypeModel, AdministratedGroupsRefTypeRef), values)
}

export type AdministratedGroupsRef = {
	_type: TypeRef<AdministratedGroupsRef>;

	_id: Id;

	items: Id;
}