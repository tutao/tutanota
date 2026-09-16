import { Params } from "mithril"
import { arrayEquals, filterInt, getDayShifted, getStartOfDay, isEmpty } from "../../../../platform-kit/utils"
import { SearchCategoryType, SearchRestriction, type SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { Mail, MailTypeRef, tutanotaTypeModels } from "@tutao/entities/tutanota"
import {
	ATTACHMENTS_ID,
	EntityIdEncoding,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
	SENDER_ID,
	sortCompareByReverseId,
	SUBJECT_ID,
} from "../../../../platform-kit/meta"

import { SearchQuery } from "../../../common/search/SearchUtils"
import { nanToNull } from "../../../../platform-kit/utils/Utils"
import { compareMails } from "../../mail/model/MailUtils"
import { EnvProvider } from "@tutao/app-env"

EnvProvider.assertMainOrNode()

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
		attributeIds: [tutanotaTypeModels[MailTypeRef.typeId].values[SUBJECT_ID].id as number],
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

export function getFreeSearchStartDate(): Date {
	return getStartOfDay(getDayShifted(new Date(), -FIXED_FREE_SEARCH_DAYS))
}

export function createMailRestriction({
	start,
	end,
	field,
	folderIds,
}: {
	start: number | null
	end: number | null
	field: string | null
	folderIds: Array<string>
}) {
	const restriction: SearchRestriction = {
		type: SearchCategoryType.mail,
		start: start,
		end: end,
		field: null,
		attributeIds: null,
		folderIds,
		eventSeries: false,
	}

	if (field) {
		const fieldData = SEARCH_MAIL_FIELDS.find((f) => f.field === field)
		if (fieldData) {
			restriction.field = field
			restriction.attributeIds = fieldData.attributeIds
		}
	}
	return restriction
}

export function getMailRestriction(params: Params, isEndRestricted: boolean): SearchRestriction {
	let start: number | null = null
	let end: number | null = null
	let field: string | null = null
	let folderIds: Array<string> = []

	// mithril will parse boolean but not numbers
	if (typeof params["start"] === "string") {
		start = nanToNull(filterInt(params["start"]))
	}

	if (isEndRestricted) {
		end = getFreeSearchStartDate().getTime()
	} else if (typeof params["end"] === "string") {
		end = nanToNull(filterInt(params["end"]))
	}

	if (typeof params["field"] === "string") {
		const fieldString = params["field"]
		field = SEARCH_MAIL_FIELDS.find((f) => f.field === fieldString)?.field ?? null
	}

	if (Array.isArray(params["folder"])) {
		folderIds = params["folder"]
	}
	return createMailRestriction({ start: start, end: end, field: field, folderIds: folderIds })
}

export function searchQueryEquals(a: SearchQuery, b: SearchQuery): boolean {
	return a.query === b.query && isSameSearchRestriction(a.restriction, b.restriction) && a.maxResults === b.maxResults
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

export function isSameSearchWithExtendedRange(oldQuery: SearchQuery, newQuery: SearchQuery): boolean {
	return oldQuery.query === newQuery.query && isSameSearchRestrictionWithRangeExtended(oldQuery.restriction, newQuery.restriction)
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

	return a.type === b.type && isRangeExtended && a.field === b.field && isSameAttributeIds && arrayEquals(a.folderIds, b.folderIds)
}

export function areResultsForTheSameQuery(a: SearchResult, b: SearchResult) {
	return a.query === b.query && isSameSearchRestriction(a.restriction, b.restriction)
}

export function hasMoreResults(searchResult: SearchResult): boolean {
	return (
		!isEmpty(searchResult.moreResults) ||
		!isEmpty(searchResult.moreResultsEntries) ||
		(!isEmpty(searchResult.lastReadSearchIndexRow) && searchResult.lastReadSearchIndexRow.every(([word, id]) => id !== 0))
	)
}

/**
 * @return true for mail result where search range goes beyond indexed range, and indexed range was extended since
 * the search result was created
 */
export function isIncompleteMailResult(searchResult: SearchResult, currentIndexTimestamp: number): boolean {
	if (searchResult.restriction.end != null && searchResult.restriction.end >= searchResult.currentIndexTimestamp) {
		return false
	}

	return searchResult.currentIndexTimestamp > currentIndexTimestamp
}

/**
 * @return true if non-blocking search is used on the current client
 */
export function isNonBlockingSearchAvailable(): boolean {
	return EnvProvider.get().isBrowser()
}
export const mailSearchComparator: (l: Mail, r: Mail) => number = EnvProvider.get().isOfflineStorageAvailable()
	? (l, r) => compareMails(l, r)
	: (l, r) => sortCompareByReverseId(l, r, EntityIdEncoding.Base64Ext)
