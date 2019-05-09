// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailboxServerPropertiesTypeRef: TypeRef<MailboxServerProperties> = new TypeRef("tutanota", "MailboxServerProperties")
export const _TypeModel: TypeModel = {
	"name": "MailboxServerProperties",
	"since": 18,
	"type": "ELEMENT_TYPE",
	"id": 678,
	"rootId": "CHR1dGFub3RhAAKm",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 682, "since": 18, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 680, "since": 18, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {"name": "_ownerGroup", "id": 683, "since": 18, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 681, "since": 18, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"whitelistProtectionEnabled": {
			"name": "whitelistProtectionEnabled",
			"id": 684,
			"since": 18,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createMailboxServerProperties(): MailboxServerProperties {
	return create(_TypeModel, MailboxServerPropertiesTypeRef)
}
