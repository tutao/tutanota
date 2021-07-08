// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {CalendarEventUpdateList} from "./CalendarEventUpdateList"
import type {OutOfOfficeNotificationRecipientList} from "./OutOfOfficeNotificationRecipientList"

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
			"refType": "CalendarEventUpdateList"
		},
		"outOfOfficeNotificationRecipientList": {
			"id": 1151,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OutOfOfficeNotificationRecipientList"
		},
		"contactFormUserContactForm": {
			"id": 748,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ContactForm"
		},
		"mailbox": {
			"id": 699,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailBox"
		},
		"outOfOfficeNotification": {
			"id": 1150,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "OutOfOfficeNotification"
		},
		"participatingContactForms": {
			"id": 842,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactForm"
		},
		"serverProperties": {
			"id": 700,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailboxServerProperties"
		},
		"targetMailGroupContactForm": {
			"id": 749,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ContactForm"
		},
		"whitelistRequests": {
			"id": 701,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "WhitelistRequest"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createMailboxGroupRoot(values?: $Shape<$Exact<MailboxGroupRoot>>): MailboxGroupRoot {
	return Object.assign(create(_TypeModel, MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	calendarEventUpdates: ?CalendarEventUpdateList;
	outOfOfficeNotificationRecipientList: ?OutOfOfficeNotificationRecipientList;
	contactFormUserContactForm: ?IdTuple;
	mailbox: Id;
	outOfOfficeNotification: ?Id;
	participatingContactForms: IdTuple[];
	serverProperties: Id;
	targetMailGroupContactForm: ?IdTuple;
	whitelistRequests: Id;
}