// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {MailAddressAlias} from "./MailAddressAlias"

export const GroupInfoTypeRef: TypeRef<GroupInfo> = new TypeRef("sys", "GroupInfo")
export const _TypeModel: TypeModel = {
	"name": "GroupInfo",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 14,
	"rootId": "A3N5cwAO",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 16,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_listEncSessionKey": {
			"id": 19,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 984,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 983,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 17,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"created": {
			"id": 23,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deleted": {
			"id": 24,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"groupType": {
			"id": 1286,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 22,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 21,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"mailAddressAliases": {
			"id": 687,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "MailAddressAlias"
		},
		"group": {
			"id": 20,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		},
		"localAdmin": {
			"id": 1287,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createGroupInfo(values?: $Shape<$Exact<GroupInfo>>): GroupInfo {
	return Object.assign(create(_TypeModel, GroupInfoTypeRef), values)
}

export type GroupInfo = {
	_type: TypeRef<GroupInfo>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_listEncSessionKey: ?Uint8Array;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	created: Date;
	deleted: ?Date;
	groupType: ?NumberString;
	mailAddress: ?string;
	name: string;

	mailAddressAliases: MailAddressAlias[];
	group: Id;
	localAdmin: ?Id;
}