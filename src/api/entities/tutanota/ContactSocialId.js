// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", "ContactSocialId")
export const _TypeModel: TypeModel = {
	"name": "ContactSocialId",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 59,
	"rootId": "CHR1dGFub3RhADs",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 60, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"customTypeName": {
			"name": "customTypeName",
			"id": 63,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"socialId": {"name": "socialId", "id": 62, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"type": {"name": "type", "id": 61, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createContactSocialId(values?: $Shape<$Exact<ContactSocialId>>): ContactSocialId {
	return Object.assign(create(_TypeModel, ContactSocialIdTypeRef), values)
}
