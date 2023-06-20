import m from "mithril"
import type { GroupInfo } from "../../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, WhitelabelChildTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { assertNotNull, filterInt, getDayShifted, getStartOfDay, isSameTypeRef, neverNull } from "@tutao/tutanota-utils"
import { RouteSetFn, throttleRoute } from "../../misc/RouteChange"
import type { SearchRestriction } from "../../api/worker/search/SearchTypes"
import { assertMainOrNode } from "../../api/common/Env"
import { TranslationKey } from "../../misc/LanguageViewModel"
import { ContactTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs"
import { typeModels } from "../../api/entities/tutanota/TypeModels.js"
import { locator } from "../../api/main/MainLocator.js"

assertMainOrNode()

const FIXED_FREE_SEARCH_DAYS = 28

export const SEARCH_CATEGORIES = [
	{
		name: "mail",
		typeRef: MailTypeRef,
	},
	{
		name: "contact",
		typeRef: ContactTypeRef,
	},
	{
		name: "groupinfo",
		typeRef: GroupInfoTypeRef,
	},
	{
		name: "whitelabelchild",
		typeRef: WhitelabelChildTypeRef,
	},
]

interface SearchMailField {
	readonly textId: TranslationKey
	readonly field: string | null
	readonly attributeIds: number[] | null
}

export const SEARCH_MAIL_FIELDS: ReadonlyArray<SearchMailField> = [
	{
		textId: "all_label",
		field: null,
		attributeIds: null,
	},
	{
		textId: "subject_label",
		field: "subject",
		attributeIds: [typeModels.Mail.values["subject"].id as number],
	},
	{
		textId: "mailBody_label",
		field: "body",
		attributeIds: [typeModels.Mail.associations["body"].id as number],
	},
	{
		textId: "from_label",
		field: "from",
		attributeIds: [typeModels.Mail.associations["sender"].id as number],
	},
	{
		textId: "to_label",
		field: "to",
		attributeIds: [
			typeModels.Mail.associations["toRecipients"].id as number,
			typeModels.Mail.associations["ccRecipients"].id as number,
			typeModels.Mail.associations["bccRecipients"].id as number,
		],
	},
	{
		textId: "attachmentName_label",
		field: "attachment",
		attributeIds: [typeModels.Mail.associations["attachments"].id as number],
	},
]

const routeSetThrottled: RouteSetFn = throttleRoute()

export function setSearchUrl(url: string) {
	if (url !== m.route.get()) {
		routeSetThrottled(url, {})
	}
}

export function searchCategoryForRestriction(restriction: SearchRestriction): string {
	return assertNotNull(SEARCH_CATEGORIES.find((c) => isSameTypeRef(c.typeRef, restriction.type))).name
}

export function getSearchUrl(
	query: string | null,
	restriction: SearchRestriction,
	selectedId?: Id,
): {
	path: string
	params: Record<string, string | number>
} {
	const category = searchCategoryForRestriction(restriction)
	const params: Record<string, string | number> = {
		query: query ?? "",
		category,
	}
	// a bit annoying but avoids putting unnecessary things into the url (if we woudl put undefined into it)
	if (restriction.start) {
		params.start = restriction.start
	}
	if (restriction.end) {
		params.end = restriction.end
	}
	if (restriction.listId) {
		params.list = restriction.listId
	}
	if (restriction.field) {
		params.field = restriction.field
	}
	return {
		path: "/search/:category" + (selectedId ? "/" + selectedId : ""),
		params: params,
	}
}

export function getFreeSearchStartDate(): Date {
	return getStartOfDay(getDayShifted(new Date(), -FIXED_FREE_SEARCH_DAYS))
}

/**
 * Adjusts the restriction according to the account type if necessary
 */
export function createRestriction(
	searchCategory: string,
	start: number | null,
	end: number | null,
	field: string | null,
	listId: string | null,
): SearchRestriction {
	if (locator.logins.getUserController().isFreeAccount() && searchCategory === "mail") {
		start = null
		end = getFreeSearchStartDate().getTime()
		field = null
		listId = null
	}

	let r: SearchRestriction = {
		type: neverNull(SEARCH_CATEGORIES.find((c) => c.name === searchCategory)).typeRef,
		start: start,
		end: end,
		field: null,
		attributeIds: null,
		listId: listId,
	}

	if (field && searchCategory === "mail") {
		let fieldData = SEARCH_MAIL_FIELDS.find((f) => f.field === field)

		if (fieldData) {
			r.field = field
			r.attributeIds = fieldData.attributeIds
		}
	} else if (field && searchCategory === "contact") {
		if (field === "recipient") {
			r.field = field
			r.attributeIds = [
				typeModels.Contact.values["firstName"].id,
				typeModels.Contact.values["lastName"].id,
				typeModels.Contact.associations["mailAddresses"].id,
			]
		} else if (field === "mailAddress") {
			r.field = field
			r.attributeIds = [typeModels.Contact.associations["mailAddresses"].id]
		}
	}

	return r
}

/**
 * Adjusts the restriction according to the account type if necessary
 */
export function getRestriction(route: string): SearchRestriction {
	let category: string
	let start: number | null = null
	let end: number | null = null
	let field: string | null = null
	let listId: string | null = null

	if (route.startsWith("/mail") || route.startsWith("/search/mail")) {
		category = "mail"

		if (route.startsWith("/search/mail")) {
			try {
				// mithril will parse boolean but not numbers
				const { params } = m.parsePathname(route)
				if (typeof params["start"] === "string") {
					start = filterInt(params["start"])
				}

				if (typeof params["end"] === "string") {
					end = filterInt(params["end"])
				}

				if (typeof params["field"] === "string") {
					const fieldString = params["field"]
					field = SEARCH_MAIL_FIELDS.find((f) => f.field === fieldString)?.field ?? null
				}

				if (typeof params["list"] === "string") {
					listId = params["list"]
				}
			} catch (e) {
				console.log("invalid query: " + route, e)
			}
		}
	} else if (route.startsWith("/contact") || route.startsWith("/search/contact")) {
		category = "contact"
	} else if (route.startsWith("/settings/users") || route.startsWith("/settings/groups")) {
		category = "groupinfo"
	} else if (route.startsWith("/settings/whitelabelaccounts")) {
		category = "whitelabelchild"
	} else {
		throw new Error("invalid type " + route)
	}

	return createRestriction(category, start, end, field, listId)
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
