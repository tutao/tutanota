// @flow
import type {DesktopConfig} from "../config/DesktopConfig"
import type {EncryptedAlarmNotification} from "./DesktopAlarmScheduler"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {elementIdPart} from "../../api/common/utils/EntityUtils"
import {DesktopConfigKey} from "../config/ConfigKeys"
import type {DesktopDeviceKeyProvider} from "../DeviceKeyProviderImpl"
import {findAllAndRemove} from "@tutao/tutanota-utils"


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
		delete this._sessionKeysB64[piId]
		return this._conf.setVar(DesktopConfigKey.pushEncSessionKeys, this._sessionKeysB64)
	}

	/**
	 * get a B64 encoded sessionKey from memory or decrypt it from disk storage
	 * @param sessionKeys array of notificationSessionKeys from an alarmNotification. will be modified in place.
	 * @return {Promise<{piSkEncSk: string, piSk: string}>} one of the pushIdentifierSessionKeyEncSessionKeys from the list and a
	 * pushIdentifierSessionKey that can decrypt it.
	 */
	async resolvePushIdentifierSessionKey(sessionKeys: Array<{pushIdentifierSessionEncSessionKey: string, pushIdentifier: IdTuple}>): Promise<{piSkEncSk: string, piSk: string}> {
		const pw = await this._deviceKeyProvider.getDeviceKey()
		const keys = await this._conf.getVar(DesktopConfigKey.pushEncSessionKeys) || {}
		for (let i = sessionKeys.length - 1; i >= 0; i--) {
			const notificationSessionKey = sessionKeys[i]
			const pushIdentifierId = elementIdPart(notificationSessionKey.pushIdentifier)
			if (this._sessionKeysB64[pushIdentifierId]) {
				return {
					piSk: this._sessionKeysB64[pushIdentifierId],
					piSkEncSk: notificationSessionKey.pushIdentifierSessionEncSessionKey
				}
			} else {
				if (keys[pushIdentifierId] == null) {
					// we don't have that pushIdentifier on this device, so we don't
					// need it on the alarm notification which is saved locally
					sessionKeys.splice(i, 1)
					continue
				}
				let decryptedKeyB64
				try {
					decryptedKeyB64 = this._crypto.aes256DecryptKeyToB64(pw, keys[pushIdentifierId])
				} catch (e) {
					console.warn("could not decrypt pushIdentifierSessionKey, trying next one...")
					sessionKeys.splice(i, 1)
					continue
				}
				this._sessionKeysB64[pushIdentifierId] = decryptedKeyB64
				return {
					piSk: decryptedKeyB64,
					piSkEncSk: notificationSessionKey.pushIdentifierSessionEncSessionKey
				}
			}
		}
		// the list was empty or did not contain a key that we could decrypt
		throw new Error("could not resolve pushIdentifierSessionKey")
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
