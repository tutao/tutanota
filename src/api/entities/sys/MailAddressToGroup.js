// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const MailAddressToGroupTypeRef: TypeRef<MailAddressToGroup> = new TypeRef("sys", "MailAddressToGroup")
export const _TypeModel: TypeModel = {
	"name": "MailAddressToGroup",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 204,
	"rootId": "A3N5cwAAzA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 208,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 206,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1019,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 207,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"internalGroup": {
			"name": "internalGroup",
			"id": 209,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createMailAddressToGroup(values?: $Shape<$Exact<MailAddressToGroup>>): MailAddressToGroup {
	return Object.assign(create(_TypeModel, MailAddressToGroupTypeRef), values)
}

export type MailAddressToGroup = {
	_type: TypeRef<MailAddressToGroup>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	internalGroup: ?Id;
}