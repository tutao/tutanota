// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailHeadersTypeRef: TypeRef<MailHeaders> = new TypeRef("tutanota", "MailHeaders")
export const _TypeModel: TypeModel = {
	"name": "MailHeaders",
	"since": 14,
	"type": "ELEMENT_TYPE",
	"id": 604,
	"rootId": "CHR1dGFub3RhAAJc",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 608,
			"since": 14,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 606, "since": 14, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 610,
			"since": 14,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 609,
			"since": 14,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 607,
			"since": 14,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"compressedHeaders": {
			"name": "compressedHeaders",
			"id": 990,
			"since": 36,
			"type": "CompressedString",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"headers": {
			"name": "headers",
			"id": 611,
			"since": 14,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createMailHeaders(values?: $Shape<$Exact<MailHeaders>>): MailHeaders {
	return Object.assign(create(_TypeModel, MailHeadersTypeRef), values)
}
