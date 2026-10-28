import { CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel"
import { assertNotNull, DateProvider, filterNull, first, groupBy, isNotNull } from "@tutao/utils"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { repeatRuleWithExcludedAlteredInstances } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventWhenModel"
import { clone } from "@tutao/meta"
import { TutanotaError } from "@tutao/app-env"
import { CalendarEventAlteredInstance, CalendarEventProgenitor } from "../../api/worker/facades/lazy/CalendarFacade"

/**
 * Handles complex cases with event series and its altered instances
 */
export class EventSeriesResolver {
	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly dateProvider: DateProvider,
	) {}

	/**
	 * Updates exclusion dates from existing progenitors with the given altered instances
	 *
	 * @param alteredInstances Altered instances to extract {@link CalendarEvent.recurrenceId} and add to the progenitor {@link RepeatRule.excludedDates}
	 * @param calendarGroupId Calendar group to look up the progenitors
	 *
	 * @returns Updated progenitors
	 */
	async updateExistingProgenitorForNewAlteredInstances(alteredInstances: CalendarEvent[], calendarGroupId: Id): Promise<CalendarEventProgenitor[]> {
		const alteredInstanceByUid = groupBy(alteredInstances, (event) => event.uid)
		if (alteredInstanceByUid.has(null)) {
			throw new TutanotaError("EventSeriesResolver", "found altered instance without UID while trying to update progenitor with new excluded dates")
		}
		const uids: string[] = Array.from(alteredInstanceByUid.keys()) as string[]

		const allProgenitors: CalendarEventProgenitor[] = filterNull(
			await Promise.all(uids.map((uid) => this.calendarModel.resolveCalendarEventProgenitor({ uid, _ownerGroup: calendarGroupId }))),
		)

		const updatedProgenitors: CalendarEventProgenitor[] = await Promise.all(
			allProgenitors.map((progenitor) => {
				const newAlteredInstances = assertNotNull(
					alteredInstanceByUid.get(progenitor.uid),
					"Trying to update a progenitor but there are no new altered instances. Possible error at uid lookup.",
				)
				const datesToExclude = filterNull(newAlteredInstances.map((alteredInstance) => alteredInstance.recurrenceId))
				const repeatRuleWithExcludedDates = repeatRuleWithExcludedAlteredInstances(progenitor, datesToExclude, this.dateProvider.timeZone())
				const progenitorWithNewExcludedDates = clone(progenitor)
				progenitorWithNewExcludedDates.repeatRule = repeatRuleWithExcludedDates
				return this.calendarModel.doUpdateEvent(progenitor, progenitorWithNewExcludedDates) as Promise<CalendarEventProgenitor>
			}),
		)

		return updatedProgenitors
	}

	/**
	 * Look up existing altered instances for each new progenitor and merge them with the given altered instances,
	 * updating the excluded dates **in place**.
	 *
	 * @param newProgenitors
	 * @param newAlteredInstances
	 * @param calendarGroupId Calendar group to look up the altered instances
	 *
	 * @throws TutanotaError If the progenitor already exists in the database
	 */
	async resolveAllExcludedDatesForNewProgenitors(
		newProgenitors: CalendarEventProgenitor[],
		newAlteredInstances: CalendarEventAlteredInstance[],
		calendarGroupId: Id,
	) {
		const newProgenitorsByUid = groupBy(newProgenitors, (progenitor) => progenitor.uid)
		const newAlteredInstancesByUid = groupBy(newAlteredInstances, (alteredInstance) => alteredInstance.uid)

		for (const [uid, progenitors] of newProgenitorsByUid) {
			if (progenitors.length > 1) {
				throw new TutanotaError("EventSeriesResolverError", "Trying to resolve excluded dates but found two progenitors")
			}
			const progenitor = first(progenitors)!
			const newAlteredInstancesRecurrenceIds = (newAlteredInstancesByUid.get(uid) ?? []).map((alteredInstance) => alteredInstance.recurrenceId)
			progenitor.repeatRule = repeatRuleWithExcludedAlteredInstances(progenitor, newAlteredInstancesRecurrenceIds, this.dateProvider.timeZone())
		}

		const progenitorUidIndexEntries = filterNull(
			await Promise.all(newProgenitors.map((progenitor) => this.calendarModel.getEventsByUid(assertNotNull(progenitor.uid), calendarGroupId))),
		)
		for (const entry of progenitorUidIndexEntries) {
			if (isNotNull(entry.progenitor)) {
				throw new TutanotaError("EventSeriesResolverError", "Tried to resolve a new progenitor but a saved counterpart was found.")
			}

			const datesToExclude = entry.alteredInstances.map((alteredInstance) => alteredInstance.recurrenceId)
			const uid = first(entry.alteredInstances)?.uid
			if (datesToExclude && uid) {
				const progenitor = assertNotNull(first(newProgenitorsByUid.get(uid)!))
				progenitor.repeatRule = repeatRuleWithExcludedAlteredInstances(progenitor, datesToExclude, this.dateProvider.timeZone())
			}
		}
	}
}
