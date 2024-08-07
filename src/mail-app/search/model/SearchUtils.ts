import m from "mithril"
import {
	assertNotNull,
	base64ToBase64Url,
	base64UrlToBase64,
	decodeBase64,
	filterInt,
	getDayShifted,
	getEndOfDay,
	getStartOfDay,
	incrementMonth,
	isSameTypeRef,
	stringToBase64,
	TypeRef,
} from "@tutao/tutanota-utils"
import { RouteSetFn, throttleRoute } from "../../../common/misc/RouteChange"
import { SearchRestriction } from "../../../common/api/worker/search/SearchTypes"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { typeModels } from "../../../common/api/entities/tutanota/TypeModels.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import {
	getElementId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
} from "../../../common/api/common/utils/EntityUtils.js"

assertMainOrNode()

const FIXED_FREE_SEARCH_DAYS = 28

export const enum SearchCategoryTypes {
	mail = "mail",
	contact = "contact",
	calendar = "calendar",
}

const SEARCH_CATEGORIES = [
	{
		name: SearchCategoryTypes.mail,
		typeRef: MailTypeRef,
	},
	{
		name: SearchCategoryTypes.contact,
		typeRef: ContactTypeRef,
	},
	{
		name: SearchCategoryTypes.calendar,
		typeRef: CalendarEventTypeRef,
	},
] as const

/** get the TypeRef that corresponds to the selected category (as taken from the URL: <host>/search/<category>?<query> */
export function getSearchType(category: string): TypeRef<CalendarEvent> | TypeRef<Mail> | TypeRef<Contact> {
	return assertNotNull(SEARCH_CATEGORIES.find((c) => c.name === category)).typeRef
}

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
		attributeIds: [LEGACY_BODY_ID /** id of the legacy typeModels.Mail.associations["body"] */],
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
			LEGACY_TO_RECIPIENTS_ID /** id of the legacy Mail.toRecipients */,
			LEGACY_CC_RECIPIENTS_ID /** id of the legacy Mail.ccRecipients */,
			LEGACY_BCC_RECIPIENTS_ID /** id of the legacy Mail.bccRecipients */,
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

export function searchCategoryForRestriction(restriction: SearchRestriction): SearchCategoryTypes {
	return assertNotNull(SEARCH_CATEGORIES.find((c) => isSameTypeRef(c.typeRef, restriction.type))).name
}

// Gets the resulting URL if the output of `getSearchParameters()` was routed to
export function getSearchUrl(query: string | null, restriction: SearchRestriction, selectionKey: string | null = null): string {
	const { path, params } = getSearchParameters(query, restriction, selectionKey)
	return m.buildPathname(path, params as m.Params)
}

export function getSearchParameters(
	query: string | null,
	restriction: SearchRestriction,
	selectionKey: string | null,
): {
	path: string
	params: Record<string, string | number | Array<string>>
} {
	const category = searchCategoryForRestriction(restriction)
	const params: Record<string, string | number | Array<string>> = {
		query: query ?? "",
		category,
	}
	// a bit annoying but avoids putting unnecessary things into the url (if we would put undefined into it)
	if (restriction.start) {
		params.start = restriction.start
	}
	if (restriction.end) {
		params.end = restriction.end
	}
	if (restriction.folderIds.length > 0) {
		params.folder = restriction.folderIds
	}
	if (restriction.field) {
		params.field = restriction.field
	}
	if (restriction.eventSeries != null) {
		params.eventSeries = String(restriction.eventSeries)
	}

	return {
		path: "/search/:category" + (selectionKey ? "/" + selectionKey : ""),
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
	searchCategory: SearchCategoryTypes,
	start: number | null,
	end: number | null,
	field: string | null,
	folderIds: Array<string>,
	eventSeries: boolean | null,
): SearchRestriction {
	if (locator.logins.getUserController().isFreeAccount() && searchCategory === SearchCategoryTypes.mail) {
		start = null
		end = getFreeSearchStartDate().getTime()
		field = null
		folderIds = []
		eventSeries = null
	}

	let r: SearchRestriction = {
		type: getSearchType(searchCategory),
		start: start,
		end: end,
		field: null,
		attributeIds: null,
		folderIds,
		eventSeries,
	}

	if (!field) {
		return r
	}

	if (searchCategory === SearchCategoryTypes.mail) {
		let fieldData = SEARCH_MAIL_FIELDS.find((f) => f.field === field)

		if (fieldData) {
			r.field = field
			r.attributeIds = fieldData.attributeIds
		}
	} else if (searchCategory === SearchCategoryTypes.contact) {
		// nothing to do, the calendar restriction was completely set up already.
	} else if (searchCategory === SearchCategoryTypes.calendar) {
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
	let category: SearchCategoryTypes
	let start: number | null = null
	let end: number | null = null
	let field: string | null = null
	let folderIds: Array<string> = []
	let eventSeries: boolean | null = null

	if (route.startsWith("/mail") || route.startsWith("/search/mail")) {
		category = SearchCategoryTypes.mail

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

				if (Array.isArray(params["folder"])) {
					folderIds = params["folder"]
				}
			} catch (e) {
				console.log("invalid query: " + route, e)
			}
		}
	} else if (route.startsWith("/contact") || route.startsWith("/search/contact")) {
		category = SearchCategoryTypes.contact
	} else if (route.startsWith("/calendar") || route.startsWith("/search/calendar")) {
		const { params } = m.parsePathname(route)

		try {
			if (typeof params["eventSeries"] === "boolean") {
				eventSeries = params["eventSeries"]
			}

			if (typeof params["start"] === "string") {
				start = filterInt(params["start"])
			}

			if (typeof params["end"] === "string") {
				end = filterInt(params["end"])
			}

			const folder = params["folder"]
			if (Array.isArray(folder)) {
				folderIds = folder
			}
		} catch (e) {
			console.log("invalid query: " + route, e)
		}

		category = SearchCategoryTypes.calendar
		if (start == null) {
			const now = new Date()
			now.setDate(1)
			start = getStartOfDay(now).getTime()
		}

		if (end == null) {
			const endDate = incrementMonth(new Date(start), 3)
			endDate.setDate(0)
			end = getEndOfDay(endDate).getTime()
		}
	} else {
		throw new Error("invalid type " + route)
	}

	return createRestriction(category, start, end, field, folderIds, eventSeries)
}

export function decodeCalendarSearchKey(searchKey: string): { id: Id; start: number } {
	return JSON.parse(decodeBase64("utf-8", base64UrlToBase64(searchKey))) as { id: Id; start: number }
}

export function encodeCalendarSearchKey(event: CalendarEvent): string {
	const eventStartTime = event.startTime.getTime()
	return base64ToBase64Url(stringToBase64(JSON.stringify({ start: eventStartTime, id: getElementId(event) })))
}
