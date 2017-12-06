//@flow
import m from "mithril"
import {MailTypeRef, _TypeModel as MailModel} from "../api/entities/tutanota/Mail"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {assertMainOrNode} from "../api/Env"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {neverNull} from "../api/common/utils/Utils"

assertMainOrNode()

export const SEARCH_CATEGORIES = [
	{name: "mail", typeRef: MailTypeRef},
	{name: "contact", typeRef: ContactTypeRef},
	{name: "groupinfo", typeRef: GroupInfoTypeRef},
]

export const SEARCH_MAIL_FIELDS = [
	{textId: "all_label", field: null, attributeIds: null},
	{textId: "subject_label", field: "subject", attributeIds: [MailModel.values["subject"].id]},
	{textId: "mailBody_label", field: "body", attributeIds: [MailModel.associations["body"].id]},
	{textId: "from_label", field: "from", attributeIds: [MailModel.associations["sender"].id]},
	{
		textId: "to_label",
		field: "to",
		attributeIds: [MailModel.associations["toRecipients"].id, MailModel.associations["ccRecipients"].id, MailModel.associations["bccRecipients"].id]
	},
	{textId: "attachmentName_label", field: "attachment", attributeIds: [MailModel.associations["attachments"].id]}
]

export function setSearchUrl(url: string) {
	if (url !== m.route.get()) {
		m.route.set(url)
	}
}

export function getSearchUrl(query: string, restriction: SearchRestriction, selectedId: ?Id): string {
	let category = neverNull(SEARCH_CATEGORIES.find(c => isSameTypeRef(c.typeRef, restriction.type))).name
	let url = "/search/" + category + (selectedId ? "/" + selectedId : "") + "?query=" + encodeURIComponent(query)
	if (restriction.start) {
		url += "&start=" + restriction.start
	}
	if (restriction.end) {
		url += "&end=" + restriction.end
	}
	if (restriction.listId) {
		url += "&list=" + restriction.listId
	}
	if (restriction.field) {
		url += "&field=" + restriction.field
	}
	return url
}

export function createRestriction(searchCategory: string, start: ?number, end: ?number, field: ?string, listId: ?string): SearchRestriction {
	let r: SearchRestriction = {
		type: neverNull(SEARCH_CATEGORIES.find(c => c.name == searchCategory)).typeRef,
		start: start,
		end: end,
		field: null,
		attributeIds: null,
		listId: listId
	}
	if (field && searchCategory == "mail") {
		let fieldData = SEARCH_MAIL_FIELDS.find(f => f.field == field)
		if (fieldData) {
			r.field = field
			r.attributeIds = fieldData.attributeIds
		}
	}
	return r
}

export function getRestriction(route: string): SearchRestriction {
	let category = "mail"
	let start = null
	let end = null
	let field = null
	let listId = null
	if (route.startsWith('/mail') || route.startsWith('/search/mail')) {
		category = "mail"
		if (route.startsWith('/search/mail')) {
			try {
				let startString = getValueFromRoute(route, "start")
				if (startString) {
					start = Number(startString)
				}
				let endString = getValueFromRoute(route, "end")
				if (endString) {
					end = Number(endString)
				}
				let fieldString = getValueFromRoute(route, "field")
				let fieldData = SEARCH_MAIL_FIELDS.find(f => f.field == fieldString)
				if (fieldData) {
					field = fieldString
				}
				let listIdString = getValueFromRoute(route, "list")
				if (listIdString) {
					listId = listIdString
				}
			} catch (e) {
				console.log("invalid query: " + route, e)
			}
		}
	} else if (route.startsWith('/contact') || route.startsWith('/search/contact')) {
		category = "contact"
	} else if (route.startsWith('/settings/users') || route.startsWith('/settings/groups')) {
		category = "groupinfo"
	} else {
		throw new Error("invalid type")
	}
	return createRestriction(category, start, end, field, listId)
}

function getValueFromRoute(route: string, name: string): ?string {
	let key = "&" + name + "="
	let keyIndex = route.indexOf(key)
	if (keyIndex != -1) {
		let valueStartIndex = keyIndex + key.length
		let valueEndIndex = route.indexOf("&", valueStartIndex)
		let value = (valueEndIndex == -1) ? route.substring(valueStartIndex) : route.substring(valueStartIndex, valueEndIndex)
		return decodeURIComponent(value)
	} else {
		return null
	}
}