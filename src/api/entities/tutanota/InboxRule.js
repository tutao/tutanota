// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", "InboxRule")
export const _TypeModel: TypeModel = {
	"name": "InboxRule",
	"since": 12,
	"type": "AGGREGATED_TYPE",
	"id": 573,
	"rootId": "CHR1dGFub3RhAAI9",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 574,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 575,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"value": {
			"id": 576,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"targetFolder": {
			"id": 577,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "MailFolder"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createInboxRule(values?: $Shape<$Exact<InboxRule>>): InboxRule {
	return Object.assign(create(_TypeModel, InboxRuleTypeRef), values)
}

export type InboxRule = {
	_type: TypeRef<InboxRule>;

	_id: Id;
	type: string;
	value: string;

	targetFolder: IdTuple;
}