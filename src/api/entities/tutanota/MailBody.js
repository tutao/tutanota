// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailBodyTypeRef: TypeRef<MailBody> = new TypeRef("tutanota", "MailBody")
export const _TypeModel: TypeModel = {
	"name": "MailBody",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 37,
	"rootId": "CHR1dGFub3RhACU",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_area": {"name": "_area", "id": 43, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"_format": {"name": "_format", "id": 41, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 39, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_owner": {"name": "_owner", "id": 42, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 585,
			"since": 13,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 584, "since": 13, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 40, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"text": {"name": "text", "id": 44, "since": 1, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createMailBody(): MailBody {
	return create(_TypeModel, MailBodyTypeRef)
}
