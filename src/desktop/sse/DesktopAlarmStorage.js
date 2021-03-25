// @flow
import {downcast} from "../../api/common/utils/Utils"
import type {DesktopConfig} from "../config/DesktopConfig"
import type {EncryptedAlarmNotification, TimeoutData} from "./DesktopAlarmScheduler"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {elementIdPart} from "../../api/common/utils/EntityUtils"
import {DesktopConfigKey} from "../config/ConfigKeys"
import type {DeviceKeyProvider} from "../DeviceKeyProviderImpl"


/**
 * manages session keys used for decrypting alarm notifications, encrypting & persisting them to disk
 */
export class DesktopAlarmStorage {
	_deviceKeyProvider: DeviceKeyProvider
	_conf: DesktopConfig;
	_crypto: DesktopCryptoFacade
	_sessionKeysB64: {[pushIdentifierId: string]: string};

	constructor(conf: DesktopConfig, desktopCryptoFacade: DesktopCryptoFacade, deviceKeyProvider: DeviceKeyProvider) {
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
		return this._conf.setVar(DesktopConfigKey.pushEncSessionKeys, null)
	}

	/**
	 * get a B64 encoded sessionKey from memory or decrypt it from disk storage
	 * @param sessionKeys array of notificationSessionKeys
	 */
	async resolvePushIdentifierSessionKey(sessionKeys: Array<{pushIdentifierSessionEncSessionKey: string, pushIdentifier: IdTuple}>): Promise<{piSkEncSk: string, piSk: string}> {
		const pw = await this._deviceKeyProvider.getDeviceKey()
		const keys = await this._conf.getVar(DesktopConfigKey.pushEncSessionKeys) || {}
		let ret = null
		// find a working sessionkey and delete all the others
		for (let i = sessionKeys.length - 1; i >= 0; i--) {
			const notificationSessionKey = sessionKeys[i]
			const pushIdentifierId = elementIdPart(notificationSessionKey.pushIdentifier)
			if (this._sessionKeysB64[pushIdentifierId]) {
				ret = {
					piSk: this._sessionKeysB64[pushIdentifierId],
					piSkEncSk: notificationSessionKey.pushIdentifierSessionEncSessionKey
				}
			} else {
				if (keys[pushIdentifierId] == null) {
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
				ret = {
					piSk: decryptedKeyB64,
					piSkEncSk: notificationSessionKey.pushIdentifierSessionEncSessionKey
				}
			}
		}
		if (ret) {
			return ret
		}
		throw new Error("could not resolve pushIdentifierSessionKey")
	}

	storeScheduledAlarms(scheduledNotifications: {[string]: {timeouts: Array<TimeoutData>, an: EncryptedAlarmNotification}}): Promise<void> {
		return this._conf.setVar(DesktopConfigKey.scheduledAlarms, Object.values(scheduledNotifications).map(val => downcast(val).an))
	}

	async getScheduledAlarms(): Promise<Array<EncryptedAlarmNotification>> {
		return await this._conf.getVar(DesktopConfigKey.scheduledAlarms) || []
	}
}
