//@flow
import m from "mithril"
import {_TypeModel as MailModel, MailTypeRef} from "../api/entities/tutanota/Mail"
import {_TypeModel as ContactModel, ContactTypeRef} from "../api/entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {assertMainOrNode} from "../api/Env"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {neverNull} from "../api/common/utils/Utils"
import {getDayShifted, getStartOfDay} from "../api/common/utils/DateUtils"
import {logins} from "../api/main/LoginController"
import {WhitelabelChildTypeRef} from "../api/entities/sys/WhitelabelChild"
import {throttleRoute} from "../misc/RouteChange"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import type {SearchRestriction} from "../api/worker/search/SearchTypes"

assertMainOrNode()

const FIXED_FREE_SEARCH_DAYS = 28

export const SEARCH_CATEGORIES = [
	{name: "mail", typeRef: MailTypeRef},
	{name: "contact", typeRef: ContactTypeRef},
	{name: "groupinfo", typeRef: GroupInfoTypeRef},
	{name: "whitelabelchild", typeRef: WhitelabelChildTypeRef},
]

export const SEARCH_MAIL_FIELDS = [
	{textId: "all_label", field: null, attributeIds: null},
	{textId: "subject_label", field: "subject", attributeIds: [(MailModel.values["subject"].id: number)]},
	{textId: "mailBody_label", field: "body", attributeIds: [(MailModel.associations["body"].id: number)]},
	{textId: "from_label", field: "from", attributeIds: [(MailModel.associations["sender"].id: number)]},
	{
		textId: "to_label",
		field: "to",
		attributeIds: [
			(MailModel.associations["toRecipients"].id: number), (MailModel.associations["ccRecipients"].id: number),
			(MailModel.associations["bccRecipients"].id: number)
		]
	},
	{textId: "attachmentName_label", field: "attachment", attributeIds: [(MailModel.associations["attachments"].id: number)]}
]

const routeSetThrottled = throttleRoute()

export function setSearchUrl(url: string) {
	if (url !== m.route.get()) {
		routeSetThrottled(url)
	}
}

export function getSearchUrl(query: ?string, restriction: SearchRestriction, selectedId: ?Id): string {
	let category = neverNull(SEARCH_CATEGORIES.find(c => isSameTypeRef(c.typeRef, restriction.type))).name
	let url = "/search/" + category + (selectedId ? "/" + selectedId : "") + "?query=" + encodeURIComponent(query || '')
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

export function getFreeSearchStartDate(): Date {
	return getStartOfDay(getDayShifted(new Date(), -FIXED_FREE_SEARCH_DAYS))
}

/**
 * Adjusts the restriction according to the account type if necessary
 */
export function createRestriction(searchCategory: string, start: ?number, end: ?number, field: ?string, listId: ?string): SearchRestriction {
	if (logins.getUserController().isFreeAccount() && searchCategory === "mail") {
		start = null
		end = getFreeSearchStartDate().getTime()
		field = null
		listId = null
	}
	let r: SearchRestriction = {
		type: neverNull(SEARCH_CATEGORIES.find(c => c.name === searchCategory)).typeRef,
		start: start,
		end: end,
		field: null,
		attributeIds: null,
		listId: listId
	}
	if (field && searchCategory === "mail") {
		let fieldData = SEARCH_MAIL_FIELDS.find(f => f.field === field)
		if (fieldData) {
			r.field = field
			r.attributeIds = fieldData.attributeIds
		}
	} else if (field && searchCategory === "contact") {
		if (field === "recipient") {
			r.field = field
			r.attributeIds = [
				ContactModel.values["firstName"].id,
				ContactModel.values["lastName"].id,
				ContactModel.associations["mailAddresses"].id,
			]
		} else if (field === "mailAddress") {
			r.field = field
			r.attributeIds = [
				ContactModel.associations["mailAddresses"].id,
			]
		}
	}
	return r
}

/**
 * Adjusts the restriction according to the account type if necessary
 */
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
				let fieldData = SEARCH_MAIL_FIELDS.find(f => f.field === fieldString)
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
	} else if (route.startsWith('/settings/whitelabelaccounts')) {
		category = "whitelabelchild"
	} else {
		throw new Error("invalid type " + route)
	}
	return createRestriction(category, start, end, field, listId)
}

function getValueFromRoute(route: string, name: string): ?string {
	let key = "&" + name + "="
	let keyIndex = route.indexOf(key)
	if (keyIndex !== -1) {
		let valueStartIndex = keyIndex + key.length
		let valueEndIndex = route.indexOf("&", valueStartIndex)
		let value = (valueEndIndex
			=== -1) ? route.substring(valueStartIndex) : route.substring(valueStartIndex, valueEndIndex)
		return decodeURIComponent(value)
	} else {
		return null
	}
}

export function isAdministratedGroup(localAdminGroupIds: Id[], gi: GroupInfo): boolean {
	if (gi.localAdmin && localAdminGroupIds.indexOf(gi.localAdmin) !== -1) {
		return true // group is administrated by local admin group of this user
	} else if (localAdminGroupIds.indexOf(gi.group) !== -1) {
		return true // group is one of the local admin groups of this user
	} else {
		return false
	}
}
