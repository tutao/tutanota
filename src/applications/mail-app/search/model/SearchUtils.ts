import m from "mithril"
import {
	arrayEquals,
	base64ToBase64Url,
	base64UrlToBase64,
	decodeBase64,
	filterInt,
	getDayShifted,
	getEndOfDay,
	getStartOfDay,
	incrementMonth,
	isEmpty,
	stringToBase64,
} from "../../../../platform-kit/utils"
import { RouteSetFn, throttleRoute } from "../../../../ui/utils/RouteChange"
import { SearchCategoryType, SearchRestriction, type SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { assertMainOrNode } from "../../../../platform-kit/app-env"
import { TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { SearchQuery } from "./SearchModel"
import { CalendarEvent, ContactTypeRef, MailTypeRef, tutanotaTypeModels } from "@tutao/entities/tutanota"
import {
	ATTACHMENTS_ID,
	getElementId,
	isSameTypeRef,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
	SENDER_ID,
	SUBJECT_ID,
} from "../../../../platform-kit/meta"

assertMainOrNode()

const FIXED_FREE_SEARCH_DAYS = 28

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
		attributeIds: [tutanotaTypeModels[MailTypeRef.typeId].values[SUBJECT_ID] as number],
	},
	{
		textId: "mailBody_label",
		field: "body",
		attributeIds: [LEGACY_BODY_ID /** id of the legacy typeModels.Mail.associations["body"] */],
	},
	{
		textId: "from_label",
		field: "from",
		attributeIds: [tutanotaTypeModels[MailTypeRef.typeId].associations[SENDER_ID].id as number],
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
		attributeIds: [tutanotaTypeModels[MailTypeRef.typeId].associations[ATTACHMENTS_ID].id as number],
	},
]

const routeSetThrottled: RouteSetFn = throttleRoute()

export function setSearchUrl(url: string) {
	if (url !== m.route.get()) {
		routeSetThrottled(url, {})
	}
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
	const params: Record<string, string | number | Array<string>> = {
		query: query ?? "",
		category: restriction.type,
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
	searchCategory: SearchCategoryType,
	start: number | null,
	end: number | null,
	field: string | null,
	folderIds: Array<string>,
	eventSeries: boolean | null,
): SearchRestriction {
	if (locator.logins.getUserController().isFreeAccount() && searchCategory === SearchCategoryType.mail) {
		start = null
		end = getFreeSearchStartDate().getTime()
		field = null
		folderIds = []
		eventSeries = null
	}

	let r: SearchRestriction = {
		type: searchCategory,
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

	switch (searchCategory) {
		case SearchCategoryType.mail:
			{
				let fieldData = SEARCH_MAIL_FIELDS.find((f) => f.field === field)

				if (fieldData) {
					r.field = field
					r.attributeIds = fieldData.attributeIds
				}
			}
			break
		case SearchCategoryType.contact:
			// nothing to do
			break
		case SearchCategoryType.calendar:
			{
				if (field === "recipient") {
					r.field = field
					r.attributeIds = [
						tutanotaTypeModels[ContactTypeRef.typeId].values["firstName"].id,
						tutanotaTypeModels[ContactTypeRef.typeId].values["lastName"].id,
						tutanotaTypeModels[ContactTypeRef.typeId].associations["mailAddresses"].id,
					]
				} else if (field === "mailAddress") {
					r.field = field
					r.attributeIds = [tutanotaTypeModels[ContactTypeRef.typeId].associations["mailAddresses"].id]
				}
			}
			break
		case SearchCategoryType.drive:
			break
	}

	return r
}

/**
 * Adjusts the restriction according to the account type if necessary
 */
export function getRestriction(route: string): SearchRestriction {
	let category: SearchCategoryType
	let start: number | null = null
	let end: number | null = null
	let field: string | null = null
	let folderIds: Array<string> = []
	let eventSeries: boolean | null = null

	if (route.startsWith("/mail") || route.startsWith("/search/mail")) {
		category = SearchCategoryType.mail

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
		category = SearchCategoryType.contact
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

			// Special case for handling dates change on Calendar View. `date` is part of the path and `parsePathname()` returns query params only
			// from the route string, forcing us to use m.route.param. We always call this function using m.route.get, so it's safe
			// to use m.route.param to get the missing parameters.
			if (!route.startsWith("/search/calendar") && m.route.param("date")) {
				const parsedStart = new Date(m.route.param("date"))
				parsedStart.setDate(1)

				if (parsedStart.getTime() < (start ?? Number.MAX_VALUE)) {
					start = parsedStart.getTime()
				}
			}

			const folder = params["folder"]
			if (Array.isArray(folder)) {
				folderIds = folder
			}
		} catch (e) {
			console.log("invalid query: " + route, e)
		}

		category = SearchCategoryType.calendar
		if (start == null || locator.logins.getUserController().isFreeAccount()) {
			const now = new Date()
			now.setDate(1)
			start = getStartOfDay(now).getTime()
		}

		if (end == null || locator.logins.getUserController().isFreeAccount()) {
			const endDate = incrementMonth(new Date(start), 3)
			endDate.setDate(0)
			end = getEndOfDay(endDate).getTime()
		}
	} else if (route.startsWith("/drive") || route.startsWith("/search/drive")) {
		category = SearchCategoryType.drive
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

export function searchQueryEquals(a: SearchQuery, b: SearchQuery): boolean {
	return (
		a.query === b.query &&
		isSameSearchRestriction(a.restriction, b.restriction) &&
		a.minSuggestionCount === b.minSuggestionCount &&
		a.maxResults === b.maxResults
	)
}

export function isSameSearchRestriction(a: SearchRestriction, b: SearchRestriction): boolean {
	const isSameAttributeIds = a.attributeIds === b.attributeIds || (!!a.attributeIds && !!b.attributeIds && arrayEquals(a.attributeIds, b.attributeIds))
	return (
		a.type === b.type &&
		a.start === b.start &&
		a.end === b.end &&
		a.field === b.field &&
		isSameAttributeIds &&
		(a.eventSeries === b.eventSeries || (a.eventSeries === null && b.eventSeries === true) || (a.eventSeries === true && b.eventSeries === null)) &&
		arrayEquals(a.folderIds, b.folderIds)
	)
}

/**
 * Returns true when search results have the same restriction but {@link b}'s restriction end is further in the past.
 *
 * @param a search result before possible extension
 * @param b search result after possible extension
 */
export function isSameSearchRestrictionWithRangeExtended(a: SearchRestriction, b: SearchRestriction): boolean {
	const isSameAttributeIds = a.attributeIds === b.attributeIds || (!!a.attributeIds && !!b.attributeIds && arrayEquals(a.attributeIds, b.attributeIds))
	const isRangeExtended = a.start === b.start && a.end != null && (b.end == null || b.end < a.end)

	return (
		a.type === b.type &&
		isRangeExtended &&
		a.field === b.field &&
		isSameAttributeIds &&
		(a.eventSeries === b.eventSeries || (a.eventSeries === null && b.eventSeries === true) || (a.eventSeries === true && b.eventSeries === null)) &&
		arrayEquals(a.folderIds, b.folderIds)
	)
}

export function areResultsForTheSameQuery(a: SearchResult, b: SearchResult) {
	return a.query === b.query && isSameSearchRestriction(a.restriction, b.restriction)
}

export function areResultsForTheSameQueryWithRangeExtended(oldResult: SearchResult, newResult: SearchResult) {
	return oldResult.query === newResult.query && isSameSearchRestrictionWithRangeExtended(oldResult.restriction, newResult.restriction)
}

export function hasMoreResults(searchResult: SearchResult): boolean {
	return (
		!isEmpty(searchResult.moreResults) ||
		!isEmpty(searchResult.moreResultsEntries) ||
		(!isEmpty(searchResult.lastReadSearchIndexRow) && searchResult.lastReadSearchIndexRow.every(([word, id]) => id !== 0))
	)
}
