// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", "MailboxProperties")
export const _TypeModel: TypeModel = {
	"name": "MailboxProperties",
	"since": 47,
	"type": "ELEMENT_TYPE",
	"id": 1195,
	"rootId": "CHR1dGFub3RhAASr",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1199,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1197,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1201,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1200,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1198,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"reportMovedMails": {
			"id": 1202,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "48"
}

export function createMailboxProperties(values?: $Shape<$Exact<MailboxProperties>>): MailboxProperties {
	return Object.assign(create(_TypeModel, MailboxPropertiesTypeRef), values)
}

export type MailboxProperties = {
	_type: TypeRef<MailboxProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	reportMovedMails: NumberString;
}