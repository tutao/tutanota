// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailHeadersTypeRef: TypeRef<MailHeaders> = new TypeRef("tutanota", "MailHeaders")
export const _TypeModel: TypeModel = {
	"name": "MailHeaders",
	"since": 14,
	"type": "ELEMENT_TYPE",
	"id": 605,
	"rootId": "CHR1dGFub3RhAAJd",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 609, "since": 14, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 607, "since": 14, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 611,
			"since": 14,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 610, "since": 14, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 608, "since": 14, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"headers": {"name": "headers", "id": 612, "since": 14, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createMailHeaders(): MailHeaders {
	return create(_TypeModel, MailHeadersTypeRef)
}
