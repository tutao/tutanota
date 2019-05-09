// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", "InboxRule")
export const _TypeModel: TypeModel = {
	"name": "InboxRule",
	"since": 12,
	"type": "AGGREGATED_TYPE",
	"id": 574,
	"rootId": "CHR1dGFub3RhAAI-",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 575, "since": 12, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"type": {"name": "type", "id": 576, "since": 12, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"value": {"name": "value", "id": 577, "since": 12, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"targetFolder": {
			"name": "targetFolder",
			"id": 578,
			"since": 12,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailFolder",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createInboxRule(): InboxRule {
	return create(_TypeModel, InboxRuleTypeRef)
}
