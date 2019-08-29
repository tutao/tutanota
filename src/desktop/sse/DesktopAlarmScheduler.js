// @flow

import {DesktopNotifier} from "../DesktopNotifier"
import {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import {OperationType} from "../../api/common/TutanotaConstants"
import {decryptAndMapToInstance} from "../../api/worker/crypto/InstanceMapper"
import {aes128Decrypt} from "../../api/worker/crypto/Aes.js"
import {uint8ArrayToBitArray} from "../../api/worker/crypto/CryptoUtils"
import {hexToUint8Array, utf8Uint8ArrayToString} from "../../api/common/utils/Encoding"
import {concat} from "../../api/common/utils/ArrayUtils"
import {AlarmNotificationTypeRef} from "../../api/entities/sys/AlarmNotification"

const fixedIv = hexToUint8Array('88888888888888888888888888888888')

export class DesktopAlarmScheduler {
	_notifier: DesktopNotifier;
	_alarmStorage: DesktopAlarmStorage;
	// map alarmIdentifier -> Timeout/AlarmNotification
	_scheduledNotifications: {[string]: {timeout: TimeoutID, an: AlarmNotification}}

	constructor(notifier: DesktopNotifier, alarmStorage: DesktopAlarmStorage) {
		this._notifier = notifier
		this._alarmStorage = alarmStorage
		this._scheduledNotifications = {}
		this._rescheduleAll()
	}

	/**
	 * stores, deletes and schedules alarm notifications
	 * @param an the AlarmNotification to handle
	 */
	handleAlarmNotification(an: AlarmNotification): void {
		if (an.operation === OperationType.CREATE) {
			this._scheduleAlarm(an)
			this._alarmStorage.storeScheduledAlarms(this._scheduledNotifications)
		} else if (an.operation === OperationType.DELETE) {
			this._cancelAlarm(an)
			this._alarmStorage.storeScheduledAlarms(this._scheduledNotifications)
		} else {
			console.warn(`received AlarmNotification (alarmInfo identifier ${an.alarmInfo.alarmIdentifier}) with unsupported operation ${an.operation}, ignoring`)
		}
	}

	_cancelAlarm(an: AlarmNotification): void {
		console.log("deleting alarm notification:", an)
		if (this._scheduledNotifications[an.alarmInfo.alarmIdentifier]) {
			clearTimeout(this._scheduledNotifications[an.alarmInfo.alarmIdentifier].timeout)
			delete this._scheduledNotifications[an.alarmInfo.alarmIdentifier]
		}
	}

	_scheduleAlarm(an: AlarmNotification): void {
		console.log("creating alarm notification:", an)
		this._alarmStorage.resolvePushIdentifierSessionKey(an.notificationSessionKeys[0].pushIdentifier[1])
		    .then(piSk => {
			    const piSkBuffer = Buffer.from(piSk, 'base64')
			    // TODO: when do we have more than one notificationSessionKey?
			    const piSkEncSkBuffer = Buffer.from(an.notificationSessionKeys[0].pushIdentifierSessionEncSessionKey, 'base64')
			    const piSkArray = uint8ArrayToBitArray(Uint8Array.from(piSkBuffer))
			    const piSkEncSkArray = Uint8Array.from(piSkEncSkBuffer)
			    return aes128Decrypt(piSkArray, concat(fixedIv, piSkEncSkArray), false)
		    })
		    .then(sk => decryptAndMapToInstance(AlarmNotificationTypeRef, an, sk))
		    .then(res => setTimeout(() => {
			    console.log("scheduled:", utf8Uint8ArrayToString(res))
		    }, 3000))
		    .then(to => {
			    this._scheduledNotifications[an.alarmInfo.alarmIdentifier] = {to, an}
		    })
	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	_rescheduleAll(): void {
		console.log("rescheduling stored alarms")
		const alarms = this._alarmStorage.getScheduledAlarms()
		alarms.forEach(an => this._scheduleAlarm(an))
	}
}
