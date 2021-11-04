// @flow
import type {OperationTypeEnum} from "../../api/common/TutanotaConstants"
import {OperationType} from "../../api/common/TutanotaConstants"
import type {AlarmNotification} from "../../api/entities/sys/AlarmNotification"
import {_TypeModel as AlarmNotificationTypeModel} from "../../api/entities/sys/AlarmNotification"
import type {DesktopNotifier} from "../DesktopNotifier"
import type {WindowManager} from "../DesktopWindowManager"
import type {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import type {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {log} from "../DesktopLog"
import type {AlarmScheduler} from "../../calendar/date/AlarmScheduler"
import {NotificationResult} from "../DesktopConstants"
import {CryptoError} from "../../api/common/error/CryptoError"
import {elementIdPart, isSameId} from "../../api/common/utils/EntityUtils"

export type NotificationSessionKey = {pushIdentifierSessionEncSessionKey: string, pushIdentifier: IdTuple}
export type EncryptedAlarmInfo = {
	alarmIdentifier: string,
	...
}
export type EncryptedAlarmNotification = {
	operation: OperationTypeEnum,
	notificationSessionKeys: Array<NotificationSessionKey>,
	alarmInfo: EncryptedAlarmInfo,
	user: Id,
	...
}

export class DesktopAlarmScheduler {
	+_wm: WindowManager;
	+_notifier: DesktopNotifier;
	+_alarmStorage: DesktopAlarmStorage;
	+_crypto: DesktopCryptoFacade;
	+_alarmScheduler: AlarmScheduler;

	constructor(wm: WindowManager,
	            notifier: DesktopNotifier,
	            alarmStorage: DesktopAlarmStorage,
	            desktopCrypto: DesktopCryptoFacade,
	            alarmScheduler: AlarmScheduler,
	) {
		this._wm = wm
		this._notifier = notifier
		this._alarmStorage = alarmStorage
		this._crypto = desktopCrypto
		this._alarmScheduler = alarmScheduler
	}

	/**
	 * stores, deletes and schedules alarm notifications
	 * @param an the AlarmNotification to handle
	 */
	async handleAlarmNotification(an: EncryptedAlarmNotification): Promise<void> {
		if (an.operation === OperationType.CREATE) {
			await this._handleCreateAlarm(an)
		} else if (an.operation === OperationType.DELETE) {
			log.debug(`deleting alarm notifications for ${an.alarmInfo.alarmIdentifier}!`)
			this._handleDeleteAlarm(an)
		} else {
			console.warn(`received AlarmNotification (alarmInfo identifier ${an.alarmInfo.alarmIdentifier}) with unsupported operation ${an.operation}, ignoring`)
		}
	}

	async _decryptAndSchedule(an: EncryptedAlarmNotification): Promise<void> {
		while (an.notificationSessionKeys.length > 0) {
			const {piSk, piSkEncSk} = await this._alarmStorage.resolvePushIdentifierSessionKey(an.notificationSessionKeys)
			const decAn = await this._crypto.decryptAndMapToInstance(AlarmNotificationTypeModel, an, piSk, piSkEncSk)
			if (Object.keys(decAn).includes("_errors")) {
				// throw away the key that caused the error and try again
				const badKey = an.notificationSessionKeys.splice(-1, 1)[0]
				const badId = elementIdPart(badKey.pushIdentifier)
				// we only want to throw it away if the list of keys in the an doesn't contain a key that
				// uses the same ID
				if (!an.notificationSessionKeys.find((k: NotificationSessionKey) => isSameId(badId, elementIdPart(k.pushIdentifier)))) {
					await this._alarmStorage.removePushIdentifierKey(badId)
				}
				continue
			}
			return this._scheduleAlarms(decAn)
		}
		// none of the keys worked.
		// this is indicative of a serious problem with the stored keys.
		// therefore, we should invalidate the sseInfo and throw away
		// our pushEncSessionKeys.
		throw new CryptoError("could not decrypt alarmNotification")
	}

	async unscheduleAllAlarms(userId: ?Id = null): Promise<void> {
		const alarms = await this._alarmStorage.getScheduledAlarms()
		alarms.forEach(alarm => {
			if (userId == null || alarm.user === userId) {
				this._cancelAlarms(alarm)
			}
		})
		return this._alarmStorage.deleteAllAlarms(userId)
	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	async rescheduleAll(): Promise<void> {
		const alarms = await this._alarmStorage.getScheduledAlarms()
		for (const alarm of alarms) {
			await this._decryptAndSchedule(alarm)
		}
	}

	_handleDeleteAlarm(an: EncryptedAlarmNotification) {
		this._cancelAlarms(an)
		this._alarmStorage.deleteAlarm(an.alarmInfo.alarmIdentifier)
	}

	async _handleCreateAlarm(an: EncryptedAlarmNotification) {
		log.debug("creating alarm notification!")
		await this._decryptAndSchedule(an)
		await this._alarmStorage.storeAlarm(an)
	}

	_cancelAlarms(an: AlarmNotification | EncryptedAlarmNotification): void {
		this._alarmScheduler.cancelAlarm(an.alarmInfo.alarmIdentifier)
	}

	_scheduleAlarms(decAn: AlarmNotification): void {
		const eventInfo = {
			startTime: decAn.eventStart,
			endTime: decAn.eventEnd,
			summary: decAn.summary
		}
		this._alarmScheduler.scheduleAlarm(eventInfo, decAn.alarmInfo, decAn.repeatRule, (title, message) => {
			this._notifier.submitGroupedNotification(
				title,
				message,
				decAn.alarmInfo.alarmIdentifier,
				res => {
					if (res === NotificationResult.Click) {
						this._wm.openCalendar({userId: decAn.user})
					}
				}
			)
		})
	}
}