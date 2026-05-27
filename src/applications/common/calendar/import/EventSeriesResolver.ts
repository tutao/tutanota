import { CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel"
import { assertNotNull, filterNull, first, groupBy, isNotNull } from "@tutao/utils"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { repeatRuleWithExcludedAlteredInstances } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventWhenModel"
import { getTimeZone } from "../date/CalendarUtils"
import { clone } from "@tutao/meta"
import { TutanotaError } from "@tutao/app-env"
import { CalendarEventAlteredInstance, CalendarEventProgenitor } from "../../api/worker/facades/lazy/CalendarFacade"

export class EventSeriesResolver {
	constructor(private readonly calendarModel: CalendarModel) {}

	async updateExistingProgenitorForNewAlteredInstances(alteredInstances: CalendarEvent[], calendarGroupId: Id) {
		const alteredInstanceByUid = groupBy(alteredInstances, (event) => event.uid)
		const uids = filterNull(Array.from(alteredInstanceByUid.keys()))

		const allProgenitors = filterNull(
			await Promise.all(uids.map((uid) => this.calendarModel.resolveCalendarEventProgenitor({ uid, _ownerGroup: calendarGroupId }))),
		)

		await Promise.all(
			allProgenitors.map((progenitor) => {
				const datesToExclude = assertNotNull(alteredInstanceByUid.get(progenitor.uid)).map((alteredInstance) =>
					assertNotNull(alteredInstance.recurrenceId),
				)
				const repeatRuleWithExcludedDates = repeatRuleWithExcludedAlteredInstances(progenitor, datesToExclude, getTimeZone())
				const progenitorWithNewExcludedDates = clone(progenitor)
				progenitorWithNewExcludedDates.repeatRule = repeatRuleWithExcludedDates
				return this.calendarModel.doUpdateEvent(progenitor, progenitorWithNewExcludedDates)
			}),
		)
	}

	async resolveAllExcludedDatesForNewProgenitors(
		newProgenitors: CalendarEventProgenitor[],
		newAlteredInstances: CalendarEventAlteredInstance[],
		calendarGroupId: Id,
	) {
		const newProgenitorsByUid = groupBy(newProgenitors, (progenitor) => progenitor.uid)
		const newAlteredInstancesByUid = groupBy(newAlteredInstances, (alteredInstance) => alteredInstance.uid)

		const progenitorUidIndexEntries = filterNull(
			await Promise.all(newProgenitors.map((progenitor) => this.calendarModel.getEventsByUid(assertNotNull(progenitor.uid), calendarGroupId))),
		)

		for (const entry of progenitorUidIndexEntries) {
			if (isNotNull(entry.progenitor)) {
				throw new TutanotaError("EventSeriesResolverError", "Tried to resolve a new progenitor but a saved counterpart was found.")
			}

			const uid = assertNotNull(first(entry.alteredInstances)?.uid)
			const datesToExclude = assertNotNull(newAlteredInstancesByUid.get(uid))
				.concat(entry.alteredInstances)
				.map((alteredInstance) => alteredInstance.recurrenceId)

			const progenitor = assertNotNull(first(newProgenitorsByUid.get(uid)!))
			progenitor.repeatRule = repeatRuleWithExcludedAlteredInstances(progenitor, datesToExclude, getTimeZone())
		}
	}
}
