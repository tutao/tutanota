// @flow
import type {DesktopConfig} from "../config/DesktopConfig"
import type {EncryptedAlarmNotification, NotificationSessionKey} from "./DesktopAlarmScheduler"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {elementIdPart} from "../../api/common/utils/EntityUtils"
import {DesktopConfigKey} from "../config/ConfigKeys"
import type {DesktopDeviceKeyProvider} from "../DeviceKeyProviderImpl"
import type {Base64} from "@tutao/tutanota-utils"
import {findAllAndRemove} from "@tutao/tutanota-utils"
import {log} from "../DesktopLog"

/**
 * manages session keys used for decrypting alarm notifications, encrypting & persisting them to disk
 */
export class DesktopAlarmStorage {
	_deviceKeyProvider: DesktopDeviceKeyProvider
	_conf: DesktopConfig;
	_crypto: DesktopCryptoFacade
	_sessionKeysB64: {[pushIdentifierId: string]: string};

	constructor(conf: DesktopConfig, desktopCryptoFacade: DesktopCryptoFacade, deviceKeyProvider: DesktopDeviceKeyProvider) {
		this._deviceKeyProvider = deviceKeyProvider
		this._conf = conf
		this._crypto = desktopCryptoFacade
		this._sessionKeysB64 = {}
	}

	/**
	 * encrypt & store a session key to disk
	 * @param pushIdentifierId pushIdentifier the key belongs to
	 * @param pushIdentifierSessionKeyB64 unencrypted B64 encoded key to store
	 * @returns {*}
	 */
	async storePushIdentifierSessionKey(pushIdentifierId: string, pushIdentifierSessionKeyB64: string): Promise<void> {
		const keys = await this._conf.getVar(DesktopConfigKey.pushEncSessionKeys) || {}
		if (!keys[pushIdentifierId]) {
			this._sessionKeysB64[pushIdentifierId] = pushIdentifierSessionKeyB64
			return this._deviceKeyProvider.getDeviceKey()
			           .then(pw => {
				           keys[pushIdentifierId] = this._crypto.aes256EncryptKeyToB64(pw, pushIdentifierSessionKeyB64)
				           return this._conf.setVar(DesktopConfigKey.pushEncSessionKeys, keys)
			           })
		}
		return Promise.resolve()
	}

	removePushIdentifierKeys(): Promise<void> {
		this._sessionKeysB64 = {}
		return this._conf.setVar(DesktopConfigKey.pushEncSessionKeys, null)
	}

	removePushIdentifierKey(piId: string): Promise<void> {
		log.debug("Remove push identifier key. elementId=" + piId)
		delete this._sessionKeysB64[piId]
		return this._conf.setVar(DesktopConfigKey.pushEncSessionKeys, this._sessionKeysB64)
	}

	/**
	 * try to get a B64 encoded PushIdentifierSessionKey that can decrypt a notificationSessionKey from memory or decrypt it from disk storage
	 * @param notificationSessionKey one notificationSessionKey from an alarmNotification.
	 * @return {Promise<?Base64>} a stored pushIdentifierSessionKey that should be able to decrypt the given notificationSessionKey
	 */
	async getPushIdentifierSessionKey(notificationSessionKey: NotificationSessionKey): Promise<?Base64> {
		const pw = await this._deviceKeyProvider.getDeviceKey()
		const pushIdentifierId = elementIdPart(notificationSessionKey.pushIdentifier)
		if (this._sessionKeysB64[pushIdentifierId]) {
			return this._sessionKeysB64[pushIdentifierId]
		} else {
			const keys = await this._conf.getVar(DesktopConfigKey.pushEncSessionKeys) || {}
			const sessionKeyFromConf = keys[pushIdentifierId]
			if (sessionKeyFromConf == null) {
				// key with this id is not saved in local conf, so we can't resolve it
				return null
			}

			try {
				const decryptedKeyB64 = this._crypto.aes256DecryptKeyToB64(pw, sessionKeyFromConf)
				this._sessionKeysB64[pushIdentifierId] = decryptedKeyB64
				return decryptedKeyB64
			} catch (e) {
				console.warn("could not decrypt pushIdentifierSessionKey")
				return null
			}
		}
	}

	async storeAlarm(alarm: EncryptedAlarmNotification): Promise<void> {
		const allAlarms = await this.getScheduledAlarms()
		findAllAndRemove(allAlarms, (an) => an.alarmInfo.alarmIdentifier === alarm.alarmInfo.alarmIdentifier)
		allAlarms.push(alarm)
		await this._saveAlarms(allAlarms)
	}

	async deleteAlarm(identifier: string): Promise<void> {
		const allAlarms = await this.getScheduledAlarms()
		findAllAndRemove(allAlarms, (an) => an.alarmInfo.alarmIdentifier === identifier)
		await this._saveAlarms(allAlarms)
	}

	/**
	 * If userId is null then we delete alarms for all users
	 */
	async deleteAllAlarms(userId: ?Id): Promise<void> {
		if (userId == null) {
			return this._saveAlarms([])
		} else {
			const allScheduledAlarms = await this.getScheduledAlarms()
			findAllAndRemove(allScheduledAlarms, alarm => alarm.user === userId)
			return this._saveAlarms(allScheduledAlarms)
		}
	}

	async getScheduledAlarms(): Promise<Array<EncryptedAlarmNotification>> {
		return await this._conf.getVar(DesktopConfigKey.scheduledAlarms) || []
	}

	_saveAlarms(alarms: $ReadOnlyArray<EncryptedAlarmNotification>): Promise<void> {
		return this._conf.setVar(DesktopConfigKey.scheduledAlarms, alarms)
	}
}
