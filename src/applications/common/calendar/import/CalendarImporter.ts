import { ParsedEventAlarmTuple } from "../../../calendar-app/calendar/export/CalendarParser"
import { deferWithHandler, groupBy, isEmpty, isNotEmpty, isNotNull } from "@tutao/utils"
import { generateEventElementId, isBefore } from "../../api/common/utils/CommonCalendarUtils"
import { assignEventId, CalendarEventValidity, CalendarType, checkEventValidity } from "../date/CalendarUtils"
import { EventAlarmInfoTemplatesTuple, makeCalendarEventFromIcsCalendarEvent, shallowIsSameEvent } from "./ImportExportUtils"
import { CalendarInfoBase, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel"
import { ImportInteractionHandler } from "../gui/ImportInteractionHandler"
import {
	AlarmInfoTemplate,
	CalendarEventAlteredInstance,
	CalendarEventProgenitor,
	CreateCalendarEventsResult,
} from "../../api/worker/facades/lazy/CalendarFacade"
import { ImportError } from "../../api/common/error/ImportError"
import { OperationHandle, OperationProgressTracker } from "../../api/main/OperationProgressTracker"
import { CalendarEvent, CalendarGroupRoot } from "@tutao/entities/tutanota"
import { EventSeriesResolver } from "./EventSeriesResolver"
import { Dialog } from "../../../../ui/base/Dialog"
import { DateTime } from "luxon"
import { clone, elementIdToId } from "@tutao/meta"
import { EndType } from "@tutao/app-env"
import { errorsToString } from "../../../../platform-kit/utils/Utils"

export class CalendarImporter {
	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly importInteractionHandler: ImportInteractionHandler,
		private readonly operationProgressTracker: OperationProgressTracker,
		private readonly eventSeriesResolver: EventSeriesResolver,
		private readonly timezone: string,
	) {}

	/** Sort parsed events into event to create and rejected events with a rejection reason
	 *
	 * This function will assign event id according to the calendarGroupRoot and the long/short event list
	 **/
	static classifyImportedEvents(
		parsedEventAlarmTuples: ParsedEventAlarmTuple[],
		existingEvents: Array<CalendarEvent>,
		calendarGroupRoot: CalendarGroupRoot,
		zone: string,
	): ClassifiedParsedEvents {
		const parsedEventsByUid = groupBy(parsedEventAlarmTuples, (e) => e.icsCalendarEvent.uid)
		const existingEventsByUid = groupBy(existingEvents, (e) => e.uid)

		const result: ClassifiedParsedEvents = { rejectedEvents: new Map(), eventsForCreationTuples: [] }

		for (const [uid, parsedEventsAlarmTuples] of parsedEventsByUid) {
			const existingUidGroup = existingEventsByUid.get(uid) ?? []

			const classification = classifyUidGroup(parsedEventsAlarmTuples, existingUidGroup, calendarGroupRoot, zone)

			appendClassificationResult(result, classification)
		}

		return result
	}

	/**
	 * Public function responsible to:
	 * - Import ICS user flow from the calendar view
	 * - First time Calendar subscriptions
	 * - Importing ics file from email attachment
	 *
	 * @param calendarGroupRoot
	 * @param calendarInfo
	 * @param parsedEventAlarmTuples
	 * @param eventsClassifier
	 * @param calendarType
	 */
	async import(
		calendarGroupRoot: CalendarGroupRoot,
		calendarInfo: CalendarInfoBase,
		parsedEventAlarmTuples: ParsedEventAlarmTuple[],
		eventsClassifier: EventsClassifier,
		calendarType: CalendarType = CalendarType.Private,
	): Promise<CreateCalendarEventsResult | null> {
		if (isEmpty(parsedEventAlarmTuples)) {
			this.importInteractionHandler.showEmptyFileMessage()
			return null
		}

		const existingEvents = await this.calendarModel.loadAllEvents(calendarGroupRoot)
		const { rejectedEvents, eventsForCreationTuples } = eventsClassifier(parsedEventAlarmTuples, existingEvents, calendarGroupRoot, this.timezone)
		const continueWithImportAndSkipRejectedEvents = await this.importInteractionHandler.confirmPartialImport(rejectedEvents, parsedEventAlarmTuples)
		if (!continueWithImportAndSkipRejectedEvents) {
			return null
		}

		const operation = this.operationProgressTracker.startNewOperation()
		const deferredImportEventHandler = this.getDeferredImportEventHandler(eventsForCreationTuples, operation, calendarGroupRoot)

		const calendarEvents = eventsForCreationTuples.map((ev) => ev.event)

		try {
			if (calendarType === CalendarType.External) {
				deferredImportEventHandler.resolve(null)
				return await this.importInteractionHandler.doActionWithProgressDialog("importCalendar_label", deferredImportEventHandler.promise, operation)
			}
			const onConfirmAction = async (dialog: Dialog) => {
				dialog.close()
				deferredImportEventHandler.resolve(null)
				await this.importInteractionHandler.doActionWithProgressDialog("importCalendar_label", deferredImportEventHandler.promise, operation)
			}

			this.importInteractionHandler.showImportSummaryDialog("importEvents_label", calendarEvents, onConfirmAction, calendarInfo)
			return await deferredImportEventHandler.promise
		} catch (e) {
			if (e instanceof ImportError) {
				if (e.message.includes("Failed to create events")) {
					await this.importInteractionHandler.showImportEventsError(e, calendarEvents)
				} else if (e.message.includes("Failed to create some alarms for imported events")) {
					console.warn(`Some alarms could not be imported!\n\n${e.message}`)
					await this.importInteractionHandler.showImportAlarmsError(e)
				}
			}
		}

		return null
	}

	/**
	 * Import action that will be executed after reviewing the import summary dialog and confirming the previewed results.
	 * @param eventsForCreationTuples
	 * @param operation
	 * @param calendarGroupRoot
	 * @private
	 */
	private getDeferredImportEventHandler(
		eventsForCreationTuples: Array<EventAlarmInfoTemplatesTuple>,
		operation: OperationHandle,
		calendarGroupRoot: CalendarGroupRoot,
	) {
		return deferWithHandler(async () => {
			const progressData = {
				maxOperations: eventsForCreationTuples.length,
			}

			await this.prepareProgenitorsAndAlteredInstances(eventsForCreationTuples, operation, elementIdToId(calendarGroupRoot._id), progressData)
			const prioritizedEvents = this.prioritizeRelevantEventsForImport(eventsForCreationTuples)

			const result = await this.calendarModel.createCalendarEvents(prioritizedEvents, operation.id)
			await this.operationProgressTracker.onProgress(operation.id, (prioritizedEvents.length / progressData.maxOperations) * 100)

			if (isNotEmpty(result.failedEventErrors)) {
				const errors = errorsToString(result.failedEventErrors)
				throw new ImportError(Error(errors), "Failed to create calendar events", result.failedEvents.length)
			}

			if (isNotEmpty(result.failedAlarms)) {
				const errors = errorsToString(result.failedAlarmErrors)
				throw new ImportError(Error(errors), "Failed to create some alarms for imported events", result.failedAlarms.length)
			}

			return result
		})
	}

	/**
	 * Modifies array in-place by moving events occurring close to Today or repeating with EndType.Never to the front.
	 *
	 * On large calendars, it sometimes takes a long time for the events to all show up.  This process prioritizes events close to
	 * Today they so they imported to the calendar first and show up much sooner.
	 *
	 * @param eventsForCreationTuples
	 * @private
	 */
	private prioritizeRelevantEventsForImport(eventsForCreationTuples: EventAlarmInfoTemplatesTuple[]): EventAlarmInfoTemplatesTuple[] {
		const today = new Date()
		const startOfRange = DateTime.fromJSDate(today).minus({ month: 1 }).startOf("month")
		const endOfRange = clone(startOfRange).plus({ month: 3 })
		const prioritizedEvents: EventAlarmInfoTemplatesTuple[] = []

		for (const tuple of eventsForCreationTuples) {
			const isBeforeEndOfCurrentRange = isBefore(tuple.event.startTime, endOfRange.toJSDate())
			if (
				(isBeforeEndOfCurrentRange && tuple.event.repeatRule?.endType === EndType.Never) ||
				(isBeforeEndOfCurrentRange && !isBefore(tuple.event.startTime, startOfRange.toJSDate()))
			) {
				prioritizedEvents.unshift(tuple)
			} else {
				prioritizedEvents.push(tuple)
			}
		}
		return prioritizedEvents
	}

	private async prepareProgenitorsAndAlteredInstances(
		eventsForCreationTuples: Array<EventAlarmInfoTemplatesTuple>,
		operation: OperationHandle,
		calendarGroupId: Id,
		progressData: { maxOperations: number },
	) {
		const newAlteredInstances = eventsForCreationTuples
			.filter((tuple) => isNotNull(tuple.event.recurrenceId))
			.map((tuple) => tuple.event as CalendarEventAlteredInstance)
		const newProgenitors = eventsForCreationTuples
			.filter((tuple) => isNotNull(tuple.event.repeatRule))
			.map((tuple) => tuple.event as CalendarEventProgenitor)

		progressData.maxOperations += newAlteredInstances.length + newProgenitors.length

		await this.eventSeriesResolver.updateExistingProgenitorForNewAlteredInstances(newAlteredInstances, calendarGroupId)
		await this.operationProgressTracker.onProgress(operation.id, (newAlteredInstances.length / progressData.maxOperations) * 100)

		await this.eventSeriesResolver.resolveAllExcludedDatesForNewProgenitors(newProgenitors, newAlteredInstances, calendarGroupId)
		await this.operationProgressTracker.onProgress(operation.id, (newProgenitors.length / progressData.maxOperations) * 100)
	}
}

export enum EventImportRejectionReason {
	Pre1970,
	Inversed,
	InvalidDate,
	Duplicate,
	DuplicateInIcs,
}

export type RejectedEvents = Map<EventImportRejectionReason, Array<CalendarEvent>>
export type ClassifiedParsedEvents = {
	rejectedEvents: RejectedEvents
	eventsForCreationTuples: Array<EventAlarmInfoTemplatesTuple>
}

export type EventsClassifier = (
	parsedEventAlarmTuples: ParsedEventAlarmTuple[],
	existingEvents: Array<CalendarEvent>,
	calendarGroupRoot: CalendarGroupRoot,
	zone: string,
) => ClassifiedParsedEvents

function classifyUidGroup(
	parsedUidGroup: ParsedEventAlarmTuple[],
	existingUidGroup: CalendarEvent[],
	calendarGroupRoot: CalendarGroupRoot,
	zone: string,
): ClassifiedParsedEvents {
	const result: ClassifiedParsedEvents = {
		rejectedEvents: new Map(),
		eventsForCreationTuples: [],
	}

	for (let i = 0; i < parsedUidGroup.length; i++) {
		const parsedTuple = parsedUidGroup[i]

		const classification = classifyParsedEvent(parsedTuple, parsedUidGroup.slice(i + 1), existingUidGroup, calendarGroupRoot, zone)

		appendClassificationResult(result, classification)
	}

	return result
}

function classifyParsedEvent(
	parsedTuple: ParsedEventAlarmTuple,
	followingParsedEvents: ParsedEventAlarmTuple[],
	existingEvents: CalendarEvent[],
	calendarGroupRoot: CalendarGroupRoot,
	zone: string,
): ClassifiedParsedEvents {
	const calendarEvent = makeCalendarEventFromIcsCalendarEvent(parsedTuple.icsCalendarEvent)

	const rejectionReason = determineRejectionReason(calendarEvent, followingParsedEvents, existingEvents)

	if (rejectionReason != null) {
		return {
			rejectedEvents: new Map([[rejectionReason, [calendarEvent]]]),
			eventsForCreationTuples: [],
		}
	}

	const preparedEvent = prepareEventForImport(calendarEvent, parsedTuple.alarms, calendarGroupRoot, zone)

	return {
		rejectedEvents: new Map(),
		eventsForCreationTuples: [preparedEvent],
	}
}

function prepareEventForImport(
	calendarEvent: CalendarEvent,
	alarms: AlarmInfoTemplate[],
	calendarGroupRoot: CalendarGroupRoot,
	zone: string,
): EventAlarmInfoTemplatesTuple {
	const preparedAlarms = alarms.map((alarm) => ({
		...alarm,
		alarmIdentifier: generateEventElementId(Date.now()),
	}))

	const preparedEvent: CalendarEvent = {
		...calendarEvent,
		_ownerGroup: elementIdToId(calendarGroupRoot._id),
	}

	assignEventId(preparedEvent, zone, calendarGroupRoot)

	return {
		event: preparedEvent,
		alarmInfoTemplates: preparedAlarms,
	}
}

/**
 * Check multiple conditions to try to determine a rejection reason.
 **/
function determineRejectionReason(
	event: CalendarEvent,
	parsedEventUidGroup: Array<ParsedEventAlarmTuple>,
	existingEventUidGroup: Array<CalendarEvent>,
): EventImportRejectionReason | null {
	if (!event.uid) {
		// should not happen because calendar parser will generate uids if they do not exist
		throw new Error("Uid is not set for imported event")
	}
	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate:
			return EventImportRejectionReason.InvalidDate
		case CalendarEventValidity.InvalidEndBeforeStart:
			return EventImportRejectionReason.Inversed
		case CalendarEventValidity.InvalidPre1970:
			return EventImportRejectionReason.Pre1970
	}

	const isExistingDuplicate = existingEventUidGroup.some((ev) => shallowIsSameEvent(ev, event))
	const isExistingParsedEventDuplicate = parsedEventUidGroup.some((ev) => shallowIsSameEvent(ev.icsCalendarEvent, event))
	if (isExistingDuplicate) {
		return EventImportRejectionReason.Duplicate
	} else if (isExistingParsedEventDuplicate) {
		return EventImportRejectionReason.DuplicateInIcs
	}

	return null
}

function appendClassificationResult(target: ClassifiedParsedEvents, source: ClassifiedParsedEvents): void {
	for (const [reason, rejectedEvents] of source.rejectedEvents) {
		const existingRejectedEvents = target.rejectedEvents.get(reason) ?? []

		target.rejectedEvents.set(reason, [...existingRejectedEvents, ...rejectedEvents])
	}

	target.eventsForCreationTuples.push(...source.eventsForCreationTuples)
}
