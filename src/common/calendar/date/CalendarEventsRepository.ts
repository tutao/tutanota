import Stream from "mithril/stream"
import stream from "mithril/stream"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { IProgressMonitor } from "../../api/common/utils/ProgressMonitor.js"
import { addDaysForRecurringEvent, CalendarTimeRange, getEventEnd, getEventStart, getMonthRange } from "./CalendarUtils.js"
import { CalendarEvent, CalendarEventTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { getListId, isSameId } from "../../api/common/utils/EntityUtils.js"
import { DateTime } from "luxon"
import { AlarmInfoTemplate, CalendarFacade } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { findAllAndRemove } from "@tutao/tutanota-utils"
import { OperationType } from "../../api/common/TutanotaConstants.js"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError.js"
import { EventController } from "../../api/main/EventController.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { locator } from "../../api/main/MainLocator.js"
import { getEventType } from "../../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { getEnabledMailAddressesForGroupInfo } from "../../api/common/utils/GroupUtils.js"
import { GroupInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { CalendarOperation, EventType } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils.js"

const LIMIT_PAST_EVENTS_YEARS = 100

const TAG = "[CalendarEventRepository]"

/** Map from timestamp of beginnings of days to events that occur on those days. */
export type DaysToEvents = ReadonlyMap<number, ReadonlyArray<CalendarEvent>>

/**
 * Loads and keeps calendar events up to date.
 *
 * If you need to load calendar events there's a good chance you should just use this
 */
export class CalendarEventsRepository {
	/** timestamps of the beginning of months that we already loaded */
	private readonly loadedMonths = new Set<number>()
	private daysToEvents: Stream<DaysToEvents> = stream(new Map())
	private pendingLoadRequest: Promise<void> = Promise.resolve()

	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly calendarFacade: CalendarFacade,
		private readonly zone: string,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
	) {
		eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId))

		// Detect when group infos has been reset and reset our data in turn.
		// There is probably another way, we could reduce and also compute symmetric difference.
		// This might fire right away but it should be harmless then.
		this.calendarModel.getCalendarInfosStream().map((infos) => {
			if (infos.size === 0) {
				this.loadedMonths.clear()
				this.daysToEvents(new Map())
			}
		})
	}

	getEventsForMonths(): Stream<DaysToEvents> {
		return this.daysToEvents
	}

	async loadMonthsIfNeeded(daysInMonths: Array<Date>, progressMonitor: IProgressMonitor, canceled: Stream<boolean>): Promise<void> {
		const promiseForThisLoadRequest = this.pendingLoadRequest.then(async () => {
			for (const dayInMonth of daysInMonths) {
				if (canceled()) return

				const month = getMonthRange(dayInMonth, this.zone)

				if (!this.loadedMonths.has(month.start)) {
					this.loadedMonths.add(month.start)

					try {
						const calendarInfos = await this.calendarModel.getCalendarInfos()
						this.replaceEvents(await this.calendarFacade.updateEventMap(month, calendarInfos, this.daysToEvents(), this.zone))
					} catch (e) {
						this.loadedMonths.delete(month.start)
						throw e
					}
				}
				progressMonitor.workDone(1)
			}
		})
		this.pendingLoadRequest = promiseForThisLoadRequest
		await promiseForThisLoadRequest
	}

	private async addOrUpdateEvent(calendarInfo: CalendarInfo | null, event: CalendarEvent) {
		if (calendarInfo == null) {
			return
		}
		const eventListId = getListId(event)
		if (isSameId(calendarInfo.groupRoot.shortEvents, eventListId)) {
			// to prevent unnecessary churn, we only add the event if we have the months it covers loaded.
			const eventStartMonth = getMonthRange(getEventStart(event, this.zone), this.zone)
			const eventEndMonth = getMonthRange(getEventEnd(event, this.zone), this.zone)
			if (this.loadedMonths.has(eventStartMonth.start)) await this.addDaysForEvent(event, eventStartMonth)
			// no short event covers more than two months, so this should cover everything.
			if (eventEndMonth.start != eventStartMonth.start && this.loadedMonths.has(eventEndMonth.start)) await this.addDaysForEvent(event, eventEndMonth)
		} else if (isSameId(calendarInfo.groupRoot.longEvents, eventListId)) {
			this.removeExistingEvent(event)

			for (const firstDayTimestamp of this.loadedMonths) {
				const loadedMonth = getMonthRange(new Date(firstDayTimestamp), this.zone)

				if (event.repeatRule != null) {
					await this.addDaysForRecurringEvent(event, loadedMonth)
				} else {
					await this.addDaysForEvent(event, loadedMonth)
				}
			}
		}
	}

	private replaceEvents(newMap: DaysToEvents): void {
		// We rely on typescript ReadonlyMap type because freezing
		// this map throws "The object can not be cloned" on iOS
		// when the source of newMap is updateEventMap
		this.daysToEvents(newMap)
	}

	private cloneEvents(): Map<number, Array<CalendarEvent>> {
		return new Map(Array.from(this.daysToEvents().entries()).map(([day, events]) => [day, events.slice()]))
	}

	private addDaysForRecurringEvent(event: CalendarEvent, month: CalendarTimeRange): void {
		if (-DateTime.fromJSDate(event.startTime).diffNow("year").years > LIMIT_PAST_EVENTS_YEARS) {
			console.log("repeating event is too far into the past", event)
			return
		}

		const newMap = this.cloneEvents()

		addDaysForRecurringEvent(newMap, event, month, this.zone)

		this.replaceEvents(newMap)
	}

	private removeDaysForEvent(id: IdTuple): void {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, id))
		}

		this.replaceEvents(newMap)
	}

	/**
	 * Removes {@param eventToRemove} from {@param events} using isSameEvent()
	 */
	private removeExistingEvent(eventToRemove: CalendarEvent) {
		const newMap = this.cloneEvents()

		for (const dayEvents of newMap.values()) {
			findAllAndRemove(dayEvents, (e) => isSameId(e._id, eventToRemove._id))
		}

		this.replaceEvents(newMap)
	}

	private async addDaysForEvent(event: CalendarEvent, month: CalendarTimeRange) {
		const { addDaysForEventInstance } = await import("./CalendarUtils.js")
		const newMap = this.cloneEvents()
		addDaysForEventInstance(newMap, event, month, this.zone)
		this.replaceEvents(newMap)
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: string) {
		const calendarInfos = await this.calendarModel.getCalendarInfos()
		for (const update of updates) {
			if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
				if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
					try {
						let event = await this.entityClient.load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
						const { userSettingsGroupRoot, user } = locator.logins.getUserController()

						const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
						const mailAddresses = getEnabledMailAddressesForGroupInfo(userGroupInfo)
						const eventType = getEventType(event, calendarInfos, mailAddresses, user)

						if (eventType === EventType.INVITE) {
							// TODO Use user default calendar
						}

						const calendarInfo = calendarInfos.get(eventOwnerGroupId) ?? null
						const calendarGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === calendarInfo?.groupInfo.group)
						if (eventType !== EventType.OWN && calendarInfo && calendarGroupSettings) {
							const alarmInfos: AlarmInfoTemplate[] =
								calendarGroupSettings.defaultAlarmsList.map((defaultAlarm) => ({
									alarmIdentifier: generateEventElementId(event.startTime.valueOf()),
									trigger: defaultAlarm.trigger,
								})) ?? []

							// TODO Save this event with the new alarms
							//event = await this.entityClient.load(CalendarEventTypeRef, [update.instanceListId, update.instanceId])
							const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
							const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
							//const model = await locator.calendarEventModel(CalendarOperation.EditThis, event, mailboxDetails, mailboxProperties, null)

							this.calendarFacade.updateCalendarEvent(event, alarmInfos, event)
						}

						await this.addOrUpdateEvent(calendarInfo, event)
					} catch (e) {
						if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
							console.log(TAG, e.name, "updated event is not accessible anymore")
						}
						throw e
					}
				} else if (update.operation === OperationType.DELETE) {
					this.removeDaysForEvent([update.instanceListId, update.instanceId])
				}
			}
		}
	}
}
