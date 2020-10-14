// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const AdministratedGroupTypeRef: TypeRef<AdministratedGroup> = new TypeRef("sys", "AdministratedGroup")
export const _TypeModel: TypeModel = {
	"name": "AdministratedGroup",
	"since": 27,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1294,
	"rootId": "A3N5cwAFDg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1298,
			"since": 27,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1296,
			"since": 27,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1299,
			"since": 27,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1297,
			"since": 27,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"groupType": {
			"name": "groupType",
			"id": 1300,
			"since": 27,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"groupInfo": {
			"name": "groupInfo",
			"id": 1301,
			"since": 27,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": false,
			"external": false
		},
		"localAdminGroup": {
			"name": "localAdminGroup",
			"id": 1302,
			"since": 27,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createAdministratedGroup(values?: $Shape<$Exact<AdministratedGroup>>): AdministratedGroup {
	return Object.assign(create(_TypeModel, AdministratedGroupTypeRef), values)
}

export type AdministratedGroup = {
	_type: TypeRef<AdministratedGroup>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	groupType: NumberString;

	groupInfo: IdTuple;
	localAdminGroup: Id;
}