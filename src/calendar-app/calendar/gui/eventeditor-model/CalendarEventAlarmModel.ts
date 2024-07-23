import { generateEventElementId, serializeAlarmInterval } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { noOp, remove } from "@tutao/tutanota-utils"
import { EventType } from "./CalendarEventModel.js"
import { DateProvider } from "../../../../common/api/common/DateProvider.js"
import { AlarmInterval, alarmIntervalToLuxonDurationLikeObject } from "../../../../common/calendar/date/CalendarUtils.js"
import { Duration } from "luxon"
import { AlarmInfoTemplate } from "../../../../common/api/worker/facades/lazy/CalendarFacade.js"

export type CalendarEventAlarmModelResult = {
	alarms: Array<AlarmInfoTemplate>
}

/**
 * edit the alarms set on a calendar event.
 */
export class CalendarEventAlarmModel {
	private readonly _alarms: Array<AlarmInterval> = []
	/** we can set reminders only if we're able to edit the event on the server because we have to add them to the entity. */
	readonly canEditReminders: boolean

	constructor(
		eventType: EventType,
		alarms: Array<AlarmInterval> = [],
		private readonly dateProvider: DateProvider,
		private readonly uiUpdateCallback: () => void = noOp,
	) {
		this.canEditReminders =
			eventType === EventType.OWN || eventType === EventType.SHARED_RW || eventType === EventType.LOCKED || eventType === EventType.INVITE
		this._alarms = [...alarms]
	}

	/**
	 * @param trigger the interval to add.
	 */
	addAlarm(trigger: AlarmInterval | null) {
		if (trigger == null) return

		// Checks if an alarm with the same duration already exists
		const alreadyHasAlarm = this._alarms.some((e) => this.isEqualAlarms(trigger, e))
		if (alreadyHasAlarm) return

		this._alarms.push(trigger)
		this.uiUpdateCallback()
	}

	/**
	 * deactivate the alarm for the given interval.
	 */
	removeAlarm(alarmInterval: AlarmInterval) {
		remove(this._alarms, alarmInterval)
		this.uiUpdateCallback()
	}

	removeAll() {
		this._alarms.splice(0)
	}

	addAll(alarmIntervalList: AlarmInterval[]) {
		this._alarms.push(...alarmIntervalList)
	}

	get alarms(): ReadonlyArray<AlarmInterval> {
		return this._alarms
	}

	get result(): CalendarEventAlarmModelResult {
		return {
			alarms: Array.from(this._alarms.values()).map((t) => this.makeNewAlarm(t)),
		}
	}

	private makeNewAlarm(alarmInterval: AlarmInterval): AlarmInfoTemplate {
		return {
			alarmIdentifier: generateEventElementId(this.dateProvider.now()),
			trigger: serializeAlarmInterval(alarmInterval),
		}
	}

	/**
	 * Compares two AlarmIntervals if they have the same duration
	 * eg: 60 minutes === 1 hour
	 * @param alarmOne base interval
	 * @param alarmTwo interval to be compared with
	 * @return true if they have the same duration
	 */
	isEqualAlarms(alarmOne: AlarmInterval, alarmTwo: AlarmInterval): boolean {
		const luxonAlarmOne = Duration.fromDurationLike(alarmIntervalToLuxonDurationLikeObject(alarmOne)).shiftToAll()
		const luxonAlarmTwo = Duration.fromDurationLike(alarmIntervalToLuxonDurationLikeObject(alarmTwo)).shiftToAll()

		return luxonAlarmOne.equals(luxonAlarmTwo)
	}
}
