// @flow

import {DesktopNotifier} from "./DesktopNotifier"
import {DesktopAlarmStorage} from "./DesktopAlarmStorage"

export class DesktopAlarmScheduler {
	_notifier: DesktopNotifier;
	_alarmStorage: DesktopAlarmStorage;

	constructor(notifier: DesktopNotifier, alarmStorage: DesktopAlarmStorage) {
		this._notifier = notifier
		this._alarmStorage = alarmStorage

		// load from disk and reschedule
	}

	schedule(): void {

	}

	cancel(): void {

	}
}
