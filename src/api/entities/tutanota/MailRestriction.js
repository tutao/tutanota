// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailRestrictionTypeRef: TypeRef<MailRestriction> = new TypeRef("tutanota", "MailRestriction")
export const _TypeModel: TypeModel = {
	"name": "MailRestriction",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 720,
	"rootId": "CHR1dGFub3RhAALQ",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 721, "since": 19, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"delegationGroups_removed": {
			"name": "delegationGroups_removed",
			"id": 723,
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Group",
			"final": true,
			"external": true
		},
		"participantGroupInfos": {
			"name": "participantGroupInfos",
			"id": 821,
			"since": 21,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "GroupInfo",
			"final": true,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createMailRestriction(): MailRestriction {
	return create(_TypeModel, MailRestrictionTypeRef)
}
