import { AlarmInterval } from "../../../api/common/TutanotaConstants.js"
import { AlarmInfo, createAlarmInfo } from "../../../api/entities/sys/TypeRefs.js"
import { generateEventElementId } from "../../../api/common/utils/CommonCalendarUtils.js"
import { noOp, partition } from "@tutao/tutanota-utils"
import { EventType } from "./CalendarEventModel.js"
import { DateProvider } from "../../../api/common/DateProvider.js"

export type CalendarEventAlarmModelResult = {
	alarms: Array<AlarmInfo>
}

/**
 * edit the alarms set on a calendar event.
 */
export class CalendarEventAlarmModel {
	private readonly _alarms: Set<AlarmInterval> = new Set()
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
		for (const alarm of alarms) {
			this._alarms.add(alarm)
		}
	}

	/**
	 * idempotent: each event has at most one alarm of each alarm interval.
	 * @param trigger the interval to add.
	 */
	addAlarm(trigger: AlarmInterval | null) {
		if (trigger == null) return
		this._alarms.add(trigger)
		this.uiUpdateCallback()
	}

	/**
	 * deactivate the alarm for the given interval.
	 */
	removeAlarm(trigger: AlarmInterval) {
		this._alarms.delete(trigger)
		this.uiUpdateCallback()
	}

	/**
	 * split a collection of triggers into those that are already set and those that are not set.
	 * @param items
	 * @param unwrap
	 */
	splitTriggers<T>(items: ReadonlyArray<T>, unwrap: (item: T) => AlarmInterval): { taken: ReadonlyArray<T>; available: ReadonlyArray<T> } {
		const [taken, available] = partition(items, (candidate) => this._alarms.has(unwrap(candidate)))

		return { taken, available }
	}

	get result(): CalendarEventAlarmModelResult {
		return {
			alarms: Array.from(this._alarms.values()).map((t) => this.makeNewAlarm(t)),
		}
	}

	private makeNewAlarm(trigger: AlarmInterval) {
		return createAlarmInfo({
			alarmIdentifier: generateEventElementId(this.dateProvider.now()),
			trigger,
		})
	}
}
