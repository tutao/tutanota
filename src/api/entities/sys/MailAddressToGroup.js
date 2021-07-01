// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 208,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 206,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1019,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 207,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"internalGroup": {
			"id": 209,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "69"
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