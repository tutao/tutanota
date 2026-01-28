import type { DesktopConfig } from "../config/DesktopConfig"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { DesktopConfigKey } from "../config/ConfigKeys"
import type { DesktopKeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { assertNotNull, Base64, base64ToUint8Array, findAllAndRemove, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog"
import { AesKey, base64ToKey, decryptKey, keyToBase64, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { ClientModelUntypedInstance, ServerModelUntypedInstance, UntypedInstance } from "../../api/common/EntityTypes"
import { AlarmNotification, AlarmNotificationTypeRef, NotificationSessionKey } from "../../api/entities/sys/TypeRefs"
import { InstancePipeline } from "../../api/worker/crypto/InstancePipeline"
import { hasError } from "../../api/common/utils/ErrorUtils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification"
import { AttributeModel } from "../../api/common/AttributeModel"
import { ClientTypeModelResolver } from "../../api/common/EntityFunctions"

/**
 * manages session keys used for decrypting alarm notifications, encrypting & persisting them to disk
 */
export class DesktopAlarmStorage {
	/** push identifier id to key */
	private unencryptedSessionKeys: Record<string, string>

	constructor(
		private readonly conf: DesktopConfig,
		private readonly cryptoFacade: DesktopNativeCryptoFacade,
		private readonly keyStoreFacade: DesktopKeyStoreFacade,
		private readonly alarmStorageInstancePipeline: InstancePipeline,
		private readonly typeModelResolver: ClientTypeModelResolver,
	) {
		this.unencryptedSessionKeys = {}
	}

	/**
	 * encrypt & store a session key to disk
	 * @param pushIdentifierId pushIdentifier the key belongs to
	 * @param pushIdentifierSessionKey unencrypted B64 encoded key to store
	 * @returns {*}
	 */
	async storePushIdentifierSessionKey(pushIdentifierId: string, pushIdentifierSessionKey: Uint8Array): Promise<void> {
		const keys: Record<string, Base64> = (await this.conf.getVar(DesktopConfigKey.pushEncSessionKeys)) || {}

		if (!keys[pushIdentifierId]) {
			this.unencryptedSessionKeys[pushIdentifierId] = uint8ArrayToBase64(pushIdentifierSessionKey)
			return this.keyStoreFacade.getDeviceKey().then((pw) => {
				keys[pushIdentifierId] = uint8ArrayToBase64(this.cryptoFacade.aes256EncryptKey(pw, uint8ArrayToKey(pushIdentifierSessionKey)))
				return this.conf.setVar(DesktopConfigKey.pushEncSessionKeys, keys)
			})
		}

		return Promise.resolve()
	}

	removeAllPushIdentifierKeys(): Promise<void> {
		this.unencryptedSessionKeys = {}
		return this.conf.setVar(DesktopConfigKey.pushEncSessionKeys, null)
	}

	async removePushIdentifierKey(piId: string): Promise<void> {
		log.debug("Remove push identifier key. elementId=" + piId)
		delete this.unencryptedSessionKeys[piId]

		const keys: Record<string, Base64> = (await this.conf.getVar(DesktopConfigKey.pushEncSessionKeys)) || {}
		delete keys[piId]
		return this.conf.setVar(DesktopConfigKey.pushEncSessionKeys, keys)
	}

	/**
	 * try to get a PushIdentifierSessionKey that can decrypt a notificationSessionKey from memory or decrypt it from disk storage
	 * @return {Promise<?AesKey>} a stored pushIdentifierSessionKey that should be able to decrypt the given notificationSessionKey
	 * @param pushIdentifier
	 */
	async getPushIdentifierSessionKey(pushIdentifier: IdTuple): Promise<AesKey | null> {
		const pushIdentifierId = elementIdPart(pushIdentifier)

		if (this.unencryptedSessionKeys[pushIdentifierId]) {
			return base64ToKey(this.unencryptedSessionKeys[pushIdentifierId])
		} else {
			const keys: Record<string, Base64> = (await this.conf.getVar(DesktopConfigKey.pushEncSessionKeys)) || {}
			const encryptedSessionKeyFromConf = keys[pushIdentifierId]

			if (encryptedSessionKeyFromConf == null) {
				// key with this id is not saved in local conf, so we can't resolve it
				return null
			}

			try {
				const pw = await this.keyStoreFacade.getDeviceKey()
				const decryptedKey = this.cryptoFacade.unauthenticatedAes256DecryptKey(pw, base64ToUint8Array(encryptedSessionKeyFromConf))
				this.unencryptedSessionKeys[pushIdentifierId] = keyToBase64(decryptedKey)
				return decryptedKey
			} catch (e) {
				console.warn("could not decrypt pushIdentifierSessionKey")
				return null
			}
		}
	}

	public async getNotificationSessionKey(notificationSessionKeys: Array<NotificationSessionKey>): Promise<{
		sessionKey: AesKey
		notificationSessionKey: NotificationSessionKey
	} | null> {
		for (const notificationSessionKey of notificationSessionKeys) {
			const pushIdentifierSessionKey = await this.getPushIdentifierSessionKey(notificationSessionKey.pushIdentifier)
			if (pushIdentifierSessionKey) {
				return {
					sessionKey: decryptKey(pushIdentifierSessionKey, notificationSessionKey.pushIdentifierSessionEncSessionKey),
					notificationSessionKey,
				}
			}
		}
		return null
	}

	async storeAlarm(alarm: AlarmNotification): Promise<void> {
		const allAlarms = await this.getScheduledAlarms()
		findAllAndRemove(allAlarms, (an) => an.getAlarmId() === alarm.alarmInfo.alarmIdentifier)
		const sessionKeyWrapper = await this.getNotificationSessionKey(alarm.notificationSessionKeys)
		const encryptedAlarm = await this.encryptAlarmNotification(alarm, assertNotNull(sessionKeyWrapper).sessionKey)
		allAlarms.push(await EncryptedAlarmNotification.from(encryptedAlarm as ServerModelUntypedInstance, this.typeModelResolver))
		await this._saveAlarms(allAlarms.map((alarm) => alarm.untypedInstance))
	}

	async deleteAlarm(identifier: string): Promise<void> {
		const allAlarms = await this.getScheduledAlarms()
		findAllAndRemove(allAlarms, (an) => an.getAlarmId() === identifier)

		await this._saveAlarms(allAlarms.map((an) => an.untypedInstance))
	}

	/**
	 * If userId is null then we delete alarms for all users
	 */
	async deleteAllAlarms(userId: Id | null): Promise<void> {
		if (userId == null) {
			return this._saveAlarms([])
		} else {
			const allScheduledAlarms = await this.getScheduledAlarms()
			findAllAndRemove(allScheduledAlarms, (alarm) => alarm.getUser() === userId)
			const untypedAlarms = allScheduledAlarms.map((an) => an.untypedInstance)
			return this._saveAlarms(untypedAlarms)
		}
	}

	async getScheduledAlarms(): Promise<Array<EncryptedAlarmNotification>> {
		// the model for alarm notifications changed, and we may have stored some that are missing the
		// excludedDates field.
		// to be able to decrypt & map these we need to at least add a plausible value there
		// we'll unschedule, redownload and reschedule the fixed instances after login.
		const alarms: Array<ClientModelUntypedInstance> = await this.conf.getVar(DesktopConfigKey.scheduledAlarms)
		if (!alarms) {
			return []
		} else if (alarms.length > 0 && typeof alarms[0]["_format"] === "string") {
			// Legacy code path before migration to type and attribute ids
			// CalendarFacade.scheduleAlarmsForNewDevice is anyway invoked if SystemModel has changed.
			await this.deleteAllAlarms(null)
			return []
		} else {
			return Promise.all(alarms.map((alarm) => EncryptedAlarmNotification.from(alarm as unknown as ServerModelUntypedInstance, this.typeModelResolver)))
		}
	}

	_saveAlarms(alarms: ReadonlyArray<UntypedInstance>): Promise<void> {
		return this.conf.setVar(DesktopConfigKey.scheduledAlarms, alarms)
	}

	async encryptAlarmNotification(an: AlarmNotification, newDeviceSessionKey: AesKey | null): Promise<UntypedInstance> {
		let sk = newDeviceSessionKey
		if (!newDeviceSessionKey) {
			let notificationSessionKeyWrapper = await this.getNotificationSessionKey(an.notificationSessionKeys)
			sk = assertNotNull(notificationSessionKeyWrapper).sessionKey
		}

		const untypedAlarmNotification = await this.alarmStorageInstancePipeline.mapAndEncrypt(AlarmNotificationTypeRef, an, sk)
		return AttributeModel.removeNetworkDebuggingInfoIfNeeded(untypedAlarmNotification)
	}

	public async decryptAlarmNotification(an: ClientModelUntypedInstance): Promise<AlarmNotification> {
		const encryptedAlarmNotification = await EncryptedAlarmNotification.from(an as unknown as ServerModelUntypedInstance, this.typeModelResolver)
		for (const currentNotificationSessionKey of encryptedAlarmNotification.getNotificationSessionKeys()) {
			const pushIdentifierSessionKey = await this.getPushIdentifierSessionKey(currentNotificationSessionKey.pushIdentifier)

			if (!pushIdentifierSessionKey) {
				// this key is either not for us (we don't have the right PushIdentifierSessionKey in our local storage)
				// or we couldn't decrypt the NotificationSessionKey for some reason
				// either way, we probably can't use it.
				continue
			}

			const sessionKey = decryptKey(pushIdentifierSessionKey, currentNotificationSessionKey.pushIdentifierSessionEncSessionKey)
			const decryptedAlarmNotification: AlarmNotification = await this.alarmStorageInstancePipeline.decryptAndMap(
				AlarmNotificationTypeRef,
				an as unknown as ServerModelUntypedInstance,
				sessionKey,
			)

			if (hasError(decryptedAlarmNotification)) {
				// some property of the AlarmNotification couldn't be decrypted with the selected key
				// throw away the key that caused the error and try the next one
				await this.removePushIdentifierKey(elementIdPart(currentNotificationSessionKey.pushIdentifier))
				continue
			}

			// discard irrelevant session keys, keep correct encrypted session key
			decryptedAlarmNotification.notificationSessionKeys = [currentNotificationSessionKey]
			return decryptedAlarmNotification
		}

		// none of the NotificationSessionKeys in the AlarmNotification worked.
		// this is indicative of a serious problem with the stored keys.
		// therefore, we should invalidate the sseInfo and throw away
		// our pushEncSessionKeys.
		throw new CryptoError("could not decrypt alarmNotification")
	}
}
