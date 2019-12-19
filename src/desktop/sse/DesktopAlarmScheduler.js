// @flow

import {lang} from "../../misc/LanguageViewModel"
import {AlarmInterval, EndType, OperationType, RepeatPeriod} from "../../api/common/TutanotaConstants"
import {_TypeModel as AlarmNotificationTypeModel} from "../../api/entities/sys/AlarmNotification"
import {last} from "../../api/common/utils/ArrayUtils"
import type {DesktopNotifier} from "../DesktopNotifier"
import {NotificationResult} from "../DesktopConstants"
import type {WindowManager} from "../DesktopWindowManager"
import type {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import {downcast} from "../../api/common/utils/Utils"
import {getAllDayDateLocal, isAllDayEventByTimes} from "../../api/common/utils/CommonCalendarUtils"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"

export type TimeoutData = {
	id: TimeoutID,
	time: number,
}

export const MAX_SAFE_DATE = 8640000000000000
export const MAX_SAFE_DELAY = 2147483647
export const TRIGGER_TIMES_IN_MS = {
	[AlarmInterval.FIVE_MINUTES]: 1000 * 60 * 5,
	[AlarmInterval.TEN_MINUTES]: 1000 * 60 * 10,
	[AlarmInterval.THIRTY_MINUTES]: 1000 * 60 * 30,
	[AlarmInterval.ONE_HOUR]: 1000 * 60 * 60,
	[AlarmInterval.ONE_DAY]: 1000 * 60 * 60 * 24,
	[AlarmInterval.TWO_DAYS]: 1000 * 60 * 60 * 24 * 2,
	[AlarmInterval.THREE_DAYS]: 1000 * 60 * 60 * 24 * 3,
	[AlarmInterval.ONE_WEEK]: 1000 * 60 * 60 * 24 * 7,
}
const MAX_SCHEDULED_OCCURRENCES = 10
const defaultTimeProvider = {
	setTimeout: global.setTimeout,
	clearTimeout: global.clearTimeout,
	now: global.Date.now
}
let {now, setTimeout, clearTimeout} = defaultTimeProvider

export class DesktopAlarmScheduler {
	_wm: WindowManager;
	_notifier: DesktopNotifier;
	_alarmStorage: DesktopAlarmStorage;
	_crypto: DesktopCryptoFacade;
	_scheduledNotifications: {[alarmIdentifier: string]: {timeouts: Array<TimeoutData>, an: AlarmNotification}}

	constructor(wm: WindowManager,
	            notifier: DesktopNotifier,
	            alarmStorage: DesktopAlarmStorage,
	            desktopCrypto: DesktopCryptoFacade,
	            timeProvider: typeof defaultTimeProvider = defaultTimeProvider
	) {
		this._wm = wm
		this._notifier = notifier
		this._alarmStorage = alarmStorage
		this._crypto = desktopCrypto
		this._scheduledNotifications = {}
		setTimeout = (what, when) => timeProvider.setTimeout(what, when)
		clearTimeout = id => timeProvider.clearTimeout(id)
		now = () => timeProvider.now()
		this._rescheduleAll()
	}

	/**
	 * stores, deletes and schedules alarm notifications
	 * @param an the AlarmNotification to handle
	 */
	handleAlarmNotification(an: any): void {
		if (an.operation === OperationType.CREATE) {
			console.log("creating alarm notification!")
			this._alarmStorage.resolvePushIdentifierSessionKey(an.notificationSessionKeys)
			    .then(({piSk, piSkEncSk}) => this._crypto.decryptAndMapToInstance(AlarmNotificationTypeModel, an, piSk, piSkEncSk))
			    .then(decAn => {
				    const identifier = decAn.alarmInfo.alarmIdentifier
				    if (!this._scheduledNotifications[identifier]) {
					    this._scheduledNotifications[identifier] = {timeouts: [], an}
				    }
				    return decAn
			    })
			    .then(decAn => this._scheduleAlarms(decAn))
			    .then(() => this._alarmStorage.storeScheduledAlarms(this._scheduledNotifications))
			    .catch(e => console.error("failed to schedule alarm!", e))
		} else if (an.operation === OperationType.DELETE) {
			console.log(`deleting alarm notifications for ${an.alarmInfo.alarmIdentifier}!`)
			this._cancelAlarms(an)
			this._alarmStorage.storeScheduledAlarms(this._scheduledNotifications)
		} else {
			console.warn(`received AlarmNotification (alarmInfo identifier ${an.alarmInfo.alarmIdentifier}) with unsupported operation ${an.operation}, ignoring`)
		}
	}

	_cancelAlarms(an: AlarmNotification): void {
		if (this._scheduledNotifications[an.alarmInfo.alarmIdentifier]) {
			this._scheduledNotifications[an.alarmInfo.alarmIdentifier].timeouts.forEach(to => {
				clearTimeout(to.id)
			})
			delete this._scheduledNotifications[an.alarmInfo.alarmIdentifier]
		}
	}

	_scheduleAlarms(decAn: AlarmNotification): void {
		const identifier = decAn.alarmInfo.alarmIdentifier
		let hasScheduledAlarms = false
		let mightNeedIntermediateSchedule = false
		decAn[Symbol.iterator] = occurrenceIterator
		for (const occurrence of downcast(decAn)) {
			if (this._scheduledNotifications[identifier].timeouts.length >= MAX_SCHEDULED_OCCURRENCES) break
			// this should work independently of Time Zones and DST, because the dates in the alarm notification
			// are already converted to Unix time stamps.
			const reminderTime = occurrence.getTime() - TRIGGER_TIMES_IN_MS[decAn.alarmInfo.trigger]
			const lastTimeInArray = (last(this._scheduledNotifications[identifier].timeouts) || {time: 0}).time
			if (reminderTime <= now() || reminderTime < lastTimeInArray) continue
			const reminderDelay = reminderTime - now()
			if (reminderDelay >= MAX_SAFE_DELAY) {
				mightNeedIntermediateSchedule = true
				break
			}
			hasScheduledAlarms = true
			const id = setTimeout(() => {
				clearTimeout(this._scheduledNotifications[identifier].timeouts.shift().id)
				this._scheduleAlarms(decAn)
				this._notifier.submitGroupedNotification(
					lang.get('reminder_label'),
					`${occurrence.toLocaleString()} ${decAn.summary}`,
					identifier,
					res => {
						if (res === NotificationResult.Click) {
							this._wm.openCalendar({userId: decAn.user})
						}
					}
				)
			}, reminderDelay)
			this._scheduledNotifications[identifier].timeouts.push({id: id, time: reminderTime})
		}
		// the next alarm was too far in the future for 31bit milliseconds (~25 days)
		if (!hasScheduledAlarms && mightNeedIntermediateSchedule) {
			const id = setTimeout(() => {
				clearTimeout(this._scheduledNotifications[identifier].timeouts.shift().id)
				console.log("intermediate alarm timeout, rescheduling")
				this._scheduleAlarms(decAn)
			}, MAX_SAFE_DELAY)
			this._scheduledNotifications[identifier].timeouts.push({id: id, time: now() + MAX_SAFE_DELAY})
		}
		console.log("scheduled", this._scheduledNotifications[identifier].timeouts.length, "alarm timeouts for ", decAn.alarmInfo.alarmIdentifier)
		if (this._scheduledNotifications[identifier].timeouts.length === 0) {
			delete this._scheduledNotifications[identifier]
		}
	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	_rescheduleAll(): void {
		const alarms = this._alarmStorage.getScheduledAlarms()
		alarms.forEach(an => this.handleAlarmNotification(an))
	}
}


/**
 * yield event occurrences according to the repeatRule contained in the AlarmNotification
 */
export function occurrenceIterator() {
	let maxOccurrences: number = 1
	let lastOccurrenceDate: Date = new Date(MAX_SAFE_DATE)
	let occurrenceIncrement = null
	let occurrenceInterval = null
	let isAllDayEvent = isAllDayEventByTimes(this.eventStart, this.eventEnd)
	let firstOccurrence: Date = isAllDayEvent
		? getAllDayDateLocal(this.eventStart)
		: this.eventStart

	if (this.repeatRule) {
		if (this.repeatRule.endType === EndType.Never) {
			maxOccurrences = Infinity
		} else if (this.repeatRule.endType === EndType.Count) {
			maxOccurrences = this.repeatRule.endValue
		} else if (this.repeatRule.endType === EndType.UntilDate) {
			maxOccurrences = Infinity
			lastOccurrenceDate = isAllDayEvent
				? getAllDayDateLocal(new Date(parseInt(this.repeatRule.endValue)))
				: new Date(parseInt(this.repeatRule.endValue))
			lastOccurrenceDate.setDate(lastOccurrenceDate.getDate())
		}
		occurrenceIncrement = this.repeatRule.frequency
		occurrenceInterval = parseInt(this.repeatRule.interval)
	}

	return {
		firstOccurrence,
		maxOccurrences,
		lastOccurrenceDate,
		occurrenceIncrement,
		occurrenceInterval,
		numYieldedOccurrences: 1,
		lastYieldedOccurrence: null,
		nextYieldedOccurrence: firstOccurrence,

		next() {
			let newOccurrence
			if (this.numYieldedOccurrences < maxOccurrences && !!this.nextYieldedOccurrence) {
				newOccurrence = new Date(this.nextYieldedOccurrence.getTime())
				switch (this.occurrenceIncrement) {
					case RepeatPeriod.DAILY:
						newOccurrence.setDate(newOccurrence.getDate() + this.occurrenceInterval)
						break
					case RepeatPeriod.WEEKLY:
						newOccurrence.setDate(newOccurrence.getDate() + this.occurrenceInterval * 7)
						break
					case RepeatPeriod.MONTHLY: {
						const newMonth = newOccurrence.getMonth() + this.occurrenceInterval
						const daysInNewMonth = new Date(newOccurrence.getFullYear(), newMonth + 1, 0).getDate()
						const newDay = Math.min(firstOccurrence.getDate(), daysInNewMonth)
						newOccurrence.setMonth(newMonth, newDay)
					}
						break
					case RepeatPeriod.ANNUALLY:
						const newYear = newOccurrence.getFullYear() + this.occurrenceInterval
						const newMonth = newOccurrence.getMonth()
						const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate()
						const newDay = Math.min(firstOccurrence.getDate(), daysInNewMonth)
						newOccurrence.setFullYear(newYear, newMonth, newDay)
						break
				}

				if (newOccurrence > this.lastOccurrenceDate) {
					newOccurrence = undefined
				}
			}

			this.lastYieldedOccurrence = this.nextYieldedOccurrence
			this.nextYieldedOccurrence = newOccurrence
			this.numYieldedOccurrences += 1
			return {value: this.lastYieldedOccurrence, done: !this.lastYieldedOccurrence}
		}
	}
}


