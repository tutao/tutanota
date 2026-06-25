import { SearchCategoryType, SearchRestriction } from "../../../common/api/worker/search/SearchTypes"
import { Params } from "mithril"
import { filterInt } from "@tutao/utils"
import { nanToNull } from "../../../../platform-kit/utils/Utils"

/** Parse {@link SearchRestriction} out of url params */
export function getDriveRestriction(routeParams: Params): SearchRestriction {
	let start: number | null = null
	let end: number | null = null

	// mithril will parse boolean but not numbers
	if (typeof routeParams["start"] === "string") {
		start = nanToNull(filterInt(routeParams["start"]))
	}

	if (typeof routeParams["end"] === "string") {
		end = nanToNull(filterInt(routeParams["end"]))
	}

	return createDriveRestriction({ start: start, end: end })
}

export function createDriveRestriction({ start, end }: { start: number | null; end: number | null }): SearchRestriction {
	return {
		type: SearchCategoryType.drive,
		start,
		end,
		field: null,
		attributeIds: null,
		folderIds: [],
		eventSeries: null,
	}
}
