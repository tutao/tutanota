import { Params } from "mithril"
import { base64ToBase64Url, filterInt, getEndOfDay, getStartOfDay, incrementMonth, stringToBase64 } from "@tutao/utils"
import { SearchCategoryType, SearchRestriction } from "../../../../common/api/worker/search/SearchTypes"
import { getElementId } from "@tutao/meta"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { nanToNull } from "../../../../../platform-kit/utils/Utils"
import { EnvProvider } from "@tutao/app-env"

EnvProvider.assertMainOrNode()

export function createCalendarRestriction({
	start,
	end,
	folderIds,
	eventSeries,
}: {
	start: number | null
	end: number | null
	folderIds: Array<string>
	eventSeries: boolean | null
}): SearchRestriction {
	return {
		type: SearchCategoryType.calendar,
		start: start,
		end: end,
		field: null,
		attributeIds: null,
		folderIds,
		eventSeries,
	}
}

/** parses {@link SearchRestriction} out of query parameters */
export function getCalendarRestriction(routeParams: Params): SearchRestriction {
	let start: number | null = null
	let end: number | null = null
	let folderIds: Array<string> = []
	let eventSeries: boolean = true
	if (typeof routeParams["eventSeries"] === "boolean") {
		eventSeries = routeParams["eventSeries"]
	}

	if (typeof routeParams["start"] === "string") {
		start = nanToNull(filterInt(routeParams["start"]))
	}

	if (start == null) {
		const now = new Date()
		now.setDate(1)
		start = getStartOfDay(now).getTime()
	}

	if (typeof routeParams["end"] === "string") {
		end = nanToNull(filterInt(routeParams["end"]))
	}

	if (end == null) {
		const endDate = incrementMonth(new Date(start), 3)
		endDate.setDate(0)
		end = getEndOfDay(endDate).getTime()
	}

	const folder = routeParams["folder"]
	if (Array.isArray(folder)) {
		folderIds = folder
	}

	return createCalendarRestriction({ start: start, end: end, folderIds: folderIds, eventSeries: eventSeries })
}

/**
 * Create a "search key" for a calendar event that unique identifies the occurrence.
 * This is useful e.g. to select the correct search result via URL
 */
export function encodeCalendarSearchKey(event: CalendarEvent): string {
	const eventStartTime = event.startTime.getTime()
	return base64ToBase64Url(stringToBase64(JSON.stringify({ start: eventStartTime, id: getElementId(event) })))
}
