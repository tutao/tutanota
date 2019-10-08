// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", "MailboxGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "MailboxGroupRoot",
	"since": 18,
	"type": "ELEMENT_TYPE",
	"id": 693,
	"rootId": "CHR1dGFub3RhAAK1",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 697,
			"since": 18,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 695, "since": 18, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 698,
			"since": 18,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 696,
			"since": 18,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"contactFormUserContactForm": {
			"name": "contactFormUserContactForm",
			"id": 748,
			"since": 19,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "ContactForm",
			"final": true,
			"external": false
		},
		"mailbox": {
			"name": "mailbox",
			"id": 699,
			"since": 18,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailBox",
			"final": true,
			"external": false
		},
		"participatingContactForms": {
			"name": "participatingContactForms",
			"id": 842,
			"since": 22,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "ContactForm",
			"final": false,
			"external": false
		},
		"serverProperties": {
			"name": "serverProperties",
			"id": 700,
			"since": 18,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailboxServerProperties",
			"final": true,
			"external": false
		},
		"targetMailGroupContactForm": {
			"name": "targetMailGroupContactForm",
			"id": 749,
			"since": 19,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "ContactForm",
			"final": true,
			"external": false
		},
		"whitelistRequests": {
			"name": "whitelistRequests",
			"id": 701,
			"since": 18,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "WhitelistRequest",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createMailboxGroupRoot(values?: $Shape<$Exact<MailboxGroupRoot>>): MailboxGroupRoot {
	return Object.assign(create(_TypeModel, MailboxGroupRootTypeRef), values)
}
