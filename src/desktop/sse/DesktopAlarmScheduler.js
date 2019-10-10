// @flow

import {lang} from "../../misc/LanguageViewModel"
import {OperationType} from "../../api/common/TutanotaConstants"
import {decryptAndMapToInstance} from "../../api/worker/crypto/InstanceMapper"
import {uint8ArrayToBitArray} from "../../api/worker/crypto/CryptoUtils"
import {_TypeModel} from "../../api/entities/sys/AlarmNotification"
import {decrypt256Key} from "../../api/worker/crypto/KeyCryptoUtils"
import {last} from "../../api/common/utils/ArrayUtils"
import {downcast} from "../../api/common/utils/Utils"
import type {DesktopNotifier} from "../DesktopNotifier"
import {NotificationResult} from "../DesktopConstants"
import type {WindowManager} from "../DesktopWindowManager"
import type {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import {MAX_SAFE_DELAY, occurrenceIterator, scheduleAction, TRIGGER_TIMES_IN_MS} from "../ScheduleUtils"

export type TimeoutData = {
	id: TimeoutID,
	time: number,
}
const MAX_SCHEDULED_OCCURRENCES = 10

export class DesktopAlarmScheduler {
	_wm: WindowManager;
	_notifier: DesktopNotifier;
	_alarmStorage: DesktopAlarmStorage;
	_scheduledNotifications: {[string]: {timeouts: Array<TimeoutData>, an: AlarmNotification}}

	constructor(wm: WindowManager, notifier: DesktopNotifier, alarmStorage: DesktopAlarmStorage) {
		this._wm = wm
		this._notifier = notifier
		this._alarmStorage = alarmStorage
		this._scheduledNotifications = {}
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
			    .then(({piSk, piSkEncSk}) => {
				    const piSkBuffer = Buffer.from(piSk, 'base64')
				    const piSkEncSkBuffer = Buffer.from(piSkEncSk, 'base64')
				    const piSkArray = uint8ArrayToBitArray(Uint8Array.from(piSkBuffer))
				    const piSkEncSkArray = Uint8Array.from(piSkEncSkBuffer)
				    return decrypt256Key(piSkArray, piSkEncSkArray)
			    })
			    .then(sk => decryptAndMapToInstance(_TypeModel, an, sk))
			    .then(decAn => {
				    const identifier = decAn.alarmInfo.alarmIdentifier
				    if (!this._scheduledNotifications[identifier]) {
					    this._scheduledNotifications[identifier] = {timeouts: [], an}
				    }
				    return decAn
			    })
			    .then(decAn => this._scheduleAlarms(decAn))
			    .catch(e => console.error("failed to schedule alarm!", e))
			    .then(() => this._alarmStorage.storeScheduledAlarms(this._scheduledNotifications))
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

	_scheduleAlarms(decAn: AlarmNotification): Promise<void> {
		return new Promise(resolve => {
			const identifier = decAn.alarmInfo.alarmIdentifier
			decAn[Symbol.iterator] = occurrenceIterator
			let hasScheduledAlarms = false
			let mightNeedIntermediateSchedule = false
			for (const occurrence of downcast(decAn)) {
				if (this._scheduledNotifications[identifier].timeouts.length >= MAX_SCHEDULED_OCCURRENCES) break
				const reminderTime = occurrence.getTime() - TRIGGER_TIMES_IN_MS[decAn.alarmInfo.trigger]
				const lastTimeInArray = (last(this._scheduledNotifications[identifier].timeouts) || {time: 0}).time
				if (reminderTime < Date.now() || reminderTime < lastTimeInArray) continue
				const reminderDelay = reminderTime - Date.now()
				if (reminderDelay >= MAX_SAFE_DELAY) {
					mightNeedIntermediateSchedule = true
					break
				}
				hasScheduledAlarms = true
				const id = scheduleAction(() => {
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
				const id = scheduleAction(() => {
					clearTimeout(this._scheduledNotifications[identifier].timeouts.shift().id)
					console.log("intermediate alarm timeout, rescheduling")
					this._scheduleAlarms(decAn)
				}, MAX_SAFE_DELAY)
				this._scheduledNotifications[identifier].timeouts.push({id: id, time: Date.now() + MAX_SAFE_DELAY})
			}
			console.log("scheduled", this._scheduledNotifications[identifier].timeouts.length, "alarm timeouts for ", decAn.alarmInfo.alarmIdentifier)
			if (this._scheduledNotifications[identifier].timeouts.length === 0) {
				delete this._scheduledNotifications[identifier]
			}
			resolve()
		})
	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	_rescheduleAll(): void {
		const alarms = this._alarmStorage.getScheduledAlarms()
		alarms.forEach(an => this.handleAlarmNotification(an))
	}
}


