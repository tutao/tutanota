import { CalendarInfoBase, CalendarModel, isBirthdayCalendarInfo, isCalendarInfo } from "../../model/CalendarModel"
import Id from "../../../../../ui/translations/id"
import { isSameId } from "@tutao/meta"
import { SearchCategoryType } from "../../../../common/api/worker/search/SearchTypes"
import { createRestriction, getSearchUrl } from "../../../../mail-app/search/model/SearchUtils"
import { incrementMonth } from "@tutao/utils"
import { ListModel } from "../../../../common/misc/ListModel"
import { SearchResultListEntry } from "../../../../mail-app/search/view/SearchListView"
import { emptyListModel } from "../../../../mail-app/search/view/SearchViewModel"
import { CalendarEvent } from "@tutao/entities/tutanota"

export class NewCalendarSearchViewModel {
	#listModel: ListModel<SearchResultListEntry, Id> = emptyListModel()
	get listModel(): ListModel<SearchResultListEntry, Id> {
		return this.#listModel
	}
	#startDate: Date | null = null
	#endDate: Date | null = null
	#selectedCalendar: readonly [Id, Id] | Id | null = null // [longListId, shorListId] || birthDay_calendar_id | null
	private currentQuery: string | null = null
	includeRepeatingEvents: boolean | any
	get selectedCalendar(): CalendarInfoBase | null {
		const calendars = this.getAvailableCalendars(true)
		const selectedCalendar =
			calendars.find((calendarInfo) => {
				if (isBirthdayCalendarInfo(calendarInfo)) {
					return calendarInfo.id === this.#selectedCalendar
				}
				if (isCalendarInfo(calendarInfo)) {
					const groupRoot = calendarInfo.groupRoot
					return isSameId([groupRoot.longEvents, groupRoot.shortEvents], this.#selectedCalendar)
				}
			}) ?? null
		return selectedCalendar
	}
	constructor(private readonly calendarModel: CalendarModel) {}
	get startDate(): Date | null {
		return this.#startDate
	}
	get endDate(): Date {
		if (this.#endDate) {
			return this.#endDate
		} else {
			let returnDate = incrementMonth(new Date(), 3)
			returnDate.setDate(0)
			return returnDate
		}
	}
	getStartofTheWeekOffSet() {
		return 0
	}
	getAvailableCalendars(includesBirthday: boolean): ReadonlyArray<CalendarInfoBase> {
		return this.calendarModel.getAvailableCalendars(includesBirthday)
	}

	loadCalendarInfos() {
		return this.calendarModel.getCalendarInfos()
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
	}

	canSelectTimePeriod() {
		return false
	}

	checkDates(startDate: Date | null, endDate: Date | null): "long" | "extendIndex" | "startafterend" | null {
		return "long"
	}

	selectStartDate(start: Date | null) {}

	selectEndDate(end: Date) {}

	selectCalendar(calendarInfo: CalendarInfoBase | null) {}

	selectIncludeRepeatingEvents(b: boolean) {}

	getSelectedEvents(): CalendarEvent[] {
		return []
	}
}
