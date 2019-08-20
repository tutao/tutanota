// @flow

import {DesktopNotifier} from "../DesktopNotifier"
import {DesktopAlarmStorage} from "./DesktopAlarmStorage"

export class DesktopAlarmScheduler {
	_notifier: DesktopNotifier;
	_alarmStorage: DesktopAlarmStorage;

	constructor(notifier: DesktopNotifier, alarmStorage: DesktopAlarmStorage) {
		this._notifier = notifier
		this._alarmStorage = alarmStorage
		this._rescheduleAll()
	}

	processAlarmNotification(an: AlarmNotification): void {

	}

	_cancelAlarm(an: AlarmNotification): void {

	}

	_scheduleAlarm(an: AlarmNotification): void {

	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	_rescheduleAll(): void {

	}
}
