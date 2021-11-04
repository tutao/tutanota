// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {DeleteContactFormConversationIndex} from "./DeleteContactFormConversationIndex"
import type {UnencryptedStatisticLogRef} from "./UnencryptedStatisticLogRef"

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
			"id": 787,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 785,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 788,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 786,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"contactFormConversations": {
			"id": 841,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "DeleteContactFormConversationIndex",
			"dependency": null
		},
		"statisticsLog": {
			"id": 890,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "UnencryptedStatisticLogRef",
			"dependency": null
		},
		"contactForms": {
			"id": 789,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "ContactForm"
		},
		"statisticsLog_encrypted_removed": {
			"id": 790,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "StatisticLogEntry"
		}
	},
	"app": "tutanota",
	"version": "48"
}

export function createCustomerContactFormGroupRoot(values?: $Shape<$Exact<CustomerContactFormGroupRoot>>): CustomerContactFormGroupRoot {
	return Object.assign(create(_TypeModel, CustomerContactFormGroupRootTypeRef), values)
}

export type CustomerContactFormGroupRoot = {
	_type: TypeRef<CustomerContactFormGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	contactFormConversations: ?DeleteContactFormConversationIndex;
	statisticsLog: ?UnencryptedStatisticLogRef;
	contactForms: Id;
	statisticsLog_encrypted_removed: Id;
}