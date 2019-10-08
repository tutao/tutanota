// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CustomerContactFormGroupRootTypeRef: TypeRef<CustomerContactFormGroupRoot> = new TypeRef("tutanota", "CustomerContactFormGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "CustomerContactFormGroupRoot",
	"since": 19,
	"type": "ELEMENT_TYPE",
	"id": 783,
	"rootId": "CHR1dGFub3RhAAMP",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 787,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 785, "since": 19, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 788,
			"since": 19,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 786,
			"since": 19,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"contactFormConversations": {
			"name": "contactFormConversations",
			"id": 841,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "DeleteContactFormConversationIndex",
			"final": true
		},
		"statisticsLog": {
			"name": "statisticsLog",
			"id": 890,
			"since": 25,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "UnencryptedStatisticLogRef",
			"final": true
		},
		"contactForms": {
			"name": "contactForms",
			"id": 789,
			"since": 19,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "ContactForm",
			"final": true,
			"external": false
		},
		"statisticsLog_encrypted_removed": {
			"name": "statisticsLog_encrypted_removed",
			"id": 790,
			"since": 19,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "StatisticLogEntry",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCustomerContactFormGroupRoot(values?: $Shape<$Exact<CustomerContactFormGroupRoot>>): CustomerContactFormGroupRoot {
	return Object.assign(create(_TypeModel, CustomerContactFormGroupRootTypeRef), values)
}
