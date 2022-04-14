import {OperationType} from "../../api/common/TutanotaConstants"
import type {AlarmNotification} from "../../api/entities/sys/TypeRefs.js"
import {AlarmInfoTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {DesktopNotifier} from "../DesktopNotifier"
import type {WindowManager} from "../DesktopWindowManager"
import type {DesktopAlarmStorage} from "./DesktopAlarmStorage"
import type {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {log} from "../DesktopLog"
import type {AlarmScheduler} from "../../calendar/date/AlarmScheduler"
import {CryptoError} from "../../api/common/error/CryptoError"
import {elementIdPart} from "../../api/common/utils/EntityUtils"
import {hasError} from "../../api/common/utils/ErrorCheckUtils"
import {NotificationResult} from "../DesktopNotifier";
import {resolveTypeReference} from "../../api/common/EntityFunctions"

export type NotificationSessionKey = {
	pushIdentifierSessionEncSessionKey: string
	pushIdentifier: IdTuple
}
export type EncryptedAlarmInfo = {
	alarmIdentifier: string
}
export type EncryptedAlarmNotification = {
	operation: OperationType
	notificationSessionKeys: Array<NotificationSessionKey>
	alarmInfo: EncryptedAlarmInfo
	user: Id
}

export class DesktopAlarmScheduler {
	readonly _wm: WindowManager
	readonly _notifier: DesktopNotifier
	readonly _alarmStorage: DesktopAlarmStorage
	readonly _crypto: DesktopCryptoFacade
	readonly _alarmScheduler: AlarmScheduler

	constructor(
		wm: WindowManager,
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
			console.warn(
				`received AlarmNotification (alarmInfo identifier ${an.alarmInfo.alarmIdentifier}) with unsupported operation ${an.operation}, ignoring`,
			)
		}
	}

	async _decryptAndSchedule(an: EncryptedAlarmNotification): Promise<void> {
		for (const currentKey of an.notificationSessionKeys) {
			const pushIdentifierSessionKey = await this._alarmStorage.getPushIdentifierSessionKey(currentKey)

			if (!pushIdentifierSessionKey) {
				// this key is either not for us (we don't have the right PushIdentifierSessionKey in our local storage)
				// or we couldn't decrypt the NotificationSessionKey for some reason
				// either way, we probably can't use it.
				continue
			}

			const decAn: AlarmNotification = await this._crypto.decryptAndMapToInstance(
				await resolveTypeReference(AlarmInfoTypeRef),
				an,
				pushIdentifierSessionKey,
				currentKey.pushIdentifierSessionEncSessionKey,
			)

			if (hasError(decAn)) {
				// some property of the AlarmNotification couldn't be decrypted with the selected key
				// throw away the key that caused the error and try the next one
				await this._alarmStorage.removePushIdentifierKey(elementIdPart(currentKey.pushIdentifier))
				continue
			}

			// we just want to keep the key that can decrypt the AlarmNotification
			an.notificationSessionKeys = [currentKey]
			return this._scheduleAlarms(decAn)
		}

		// none of the NotificationSessionKeys in the AlarmNotification worked.
		// this is indicative of a serious problem with the stored keys.
		// therefore, we should invalidate the sseInfo and throw away
		// our pushEncSessionKeys.
		throw new CryptoError("could not decrypt alarmNotification")
	}

	async unscheduleAllAlarms(userId: Id | null = null): Promise<void> {
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
			summary: decAn.summary,
		}

		this._alarmScheduler.scheduleAlarm(eventInfo, decAn.alarmInfo, decAn.repeatRule, (title, message) => {
			this._notifier.submitGroupedNotification(title, message, decAn.alarmInfo.alarmIdentifier, res => {
				if (res === NotificationResult.Click) {
					this._wm.openCalendar({
						userId: decAn.user,
					})
				}
			})
		})
	}
}