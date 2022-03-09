import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {CalendarEventUpdateList} from "./CalendarEventUpdateList.js"
import type {OutOfOfficeNotificationRecipientList} from "./OutOfOfficeNotificationRecipientList.js"

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
			"id": 697,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 695,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 698,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 696,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"calendarEventUpdates": {
			"id": 1119,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "CalendarEventUpdateList",
			"dependency": null
		},
		"contactFormUserContactForm": {
			"id": 748,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ContactForm",
			"dependency": null
		},
		"mailbox": {
			"id": 699,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailBox",
			"dependency": null
		},
		"mailboxProperties": {
			"id": 1203,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailboxProperties",
			"dependency": null
		},
		"outOfOfficeNotification": {
			"id": 1150,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OutOfOfficeNotification",
			"dependency": null
		},
		"outOfOfficeNotificationRecipientList": {
			"id": 1151,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OutOfOfficeNotificationRecipientList",
			"dependency": null
		},
		"participatingContactForms": {
			"id": 842,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactForm",
			"dependency": null
		},
		"serverProperties": {
			"id": 700,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailboxServerProperties",
			"dependency": null
		},
		"targetMailGroupContactForm": {
			"id": 749,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ContactForm",
			"dependency": null
		},
		"whitelistRequests": {
			"id": 701,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "WhitelistRequest",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createMailboxGroupRoot(values?: Partial<MailboxGroupRoot>): MailboxGroupRoot {
	return Object.assign(create(_TypeModel, MailboxGroupRootTypeRef), downcast<MailboxGroupRoot>(values))
}

export type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	calendarEventUpdates:  null | CalendarEventUpdateList;
	contactFormUserContactForm:  null | IdTuple;
	mailbox: Id;
	mailboxProperties:  null | Id;
	outOfOfficeNotification:  null | Id;
	outOfOfficeNotificationRecipientList:  null | OutOfOfficeNotificationRecipientList;
	participatingContactForms: IdTuple[];
	serverProperties: Id;
	targetMailGroupContactForm:  null | IdTuple;
	whitelistRequests: Id;
}