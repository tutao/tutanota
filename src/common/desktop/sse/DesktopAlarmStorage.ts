import type { DesktopConfig } from "../config/DesktopConfig"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { DesktopConfigKey } from "../config/ConfigKeys"
import type { DesktopKeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { assertNotNull, Base64, base64ToUint8Array, findAllAndRemove, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog"
import { AesKey, decryptKey, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { EncryptedParsedInstance, UntypedInstance } from "../../api/common/EntityTypes"
import { AlarmNotification, AlarmNotificationTypeRef, createNotificationSessionKey, NotificationSessionKeyTypeRef } from "../../api/entities/sys/TypeRefs"
import { InstancePipeline } from "../../api/worker/crypto/InstancePipeline"
import { resolveTypeReference } from "../../api/common/EntityFunctions"
import { AttributeModel } from "../../api/common/AttributeModel"
import { hasError } from "../../api/common/utils/ErrorUtils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

/**
 * manages session keys used for decrypting alarm notifications, encrypting & persisting them to disk
 */
export class DesktopAlarmStorage {
	/** push identifier id to key */
	private sessionKeys: Record<string, string>

	constructor(
		private readonly conf: DesktopConfig,
		private readonly cryptoFacade: DesktopNativeCryptoFacade,
		private readonly keyStoreFacade: DesktopKeyStoreFacade,
		private readonly instancePipeline: InstancePipeline,
	) {
		this.sessionKeys = {}
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
			this.sessionKeys[pushIdentifierId] = uint8ArrayToBase64(pushIdentifierSessionKey)
			return this.keyStoreFacade.getDeviceKey().then((pw) => {
				keys[pushIdentifierId] = uint8ArrayToBase64(this.cryptoFacade.aes256EncryptKey(pw, pushIdentifierSessionKey))
				return this.conf.setVar(DesktopConfigKey.pushEncSessionKeys, keys)
			})
		}

		return Promise.resolve()
	}

	removePushIdentifierKeys(): Promise<void> {
		this.sessionKeys = {}
		return this.conf.setVar(DesktopConfigKey.pushEncSessionKeys, null)
	}

	removePushIdentifierKey(piId: string): Promise<void> {
		log.debug("Remove push identifier key. elementId=" + piId)
		delete this.sessionKeys[piId]
		return this.conf.setVar(DesktopConfigKey.pushEncSessionKeys, this.sessionKeys)
	}

	/**
	 * try to get a B64 encoded PushIdentifierSessionKey that can decrypt a notificationSessionKey from memory or decrypt it from disk storage
	 * @param notificationSessionKey one notificationSessionKey from an alarmNotification.
	 * @return {Promise<?Base64>} a stored pushIdentifierSessionKey that should be able to decrypt the given notificationSessionKey
	 */
	async getPushIdentifierSessionKey(pushIdentifier: IdTuple): Promise<AesKey | null> {
		const pw = await this.keyStoreFacade.getDeviceKey()
		const pushIdentifierId = elementIdPart(pushIdentifier)

		if (this.sessionKeys[pushIdentifierId]) {
			return uint8ArrayToBitArray(base64ToUint8Array(this.sessionKeys[pushIdentifierId]))
		} else {
			const keys: Record<string, Base64> = (await this.conf.getVar(DesktopConfigKey.pushEncSessionKeys)) || {}
			const sessionKeyFromConf = keys[pushIdentifierId]

			if (sessionKeyFromConf == null) {
				// key with this id is not saved in local conf, so we can't resolve it
				return null
			}

			try {
				const decryptedKey = this.cryptoFacade.unauthenticatedAes256DecryptKey(pw, base64ToUint8Array(sessionKeyFromConf))
				this.sessionKeys[pushIdentifierId] = uint8ArrayToBase64(decryptedKey)
				return uint8ArrayToBitArray(decryptedKey)
			} catch (e) {
				console.warn("could not decrypt pushIdentifierSessionKey")
				return null
			}
		}
	}

	async storeAlarm(alarm: AlarmNotification): Promise<void> {
		const allAlarms = await this.getScheduledAlarms()
		findAllAndRemove(allAlarms, (an) => an.alarmInfo.alarmIdentifier === alarm.alarmInfo.alarmIdentifier)
		allAlarms.push(alarm)
		// FIXME encryptAndMapToLiteral
		const encryptedAlarms = await Promise.all(
			allAlarms.map(async (alarm) => {
				return await this.encryptAlarmNotification(alarm)
			}),
		)
		await this._saveAlarms(encryptedAlarms)
	}

	async deleteAlarm(identifier: string): Promise<void> {
		const allAlarms = await this.getScheduledAlarms()
		findAllAndRemove(allAlarms, (an) => an.alarmInfo.alarmIdentifier === identifier)
		// FIXME encryptAndMapToLiteral
		const encryptedAlarms = await Promise.all(
			allAlarms.map(async (alarm) => {
				return await this.encryptAlarmNotification(alarm)
			}),
		)
		await this._saveAlarms(encryptedAlarms)
	}

	/**
	 * If userId is null then we delete alarms for all users
	 */
	async deleteAllAlarms(userId: Id | null): Promise<void> {
		if (userId == null) {
			return this._saveAlarms([])
		} else {
			const allScheduledAlarms = await this.getScheduledAlarms()
			findAllAndRemove(allScheduledAlarms, (alarm) => alarm.user === userId)
			const encryptedAlarms = await Promise.all(
				allScheduledAlarms.map(async (alarm) => {
					return await this.encryptAlarmNotification(alarm)
				}),
			)
			return this._saveAlarms(encryptedAlarms)
		}
	}

	async getScheduledAlarms(): Promise<Array<AlarmNotification>> {
		// the model for alarm notifications changed and we may have stored some that are missing the
		// excludedDates field.
		// to be able to decrypt & map these we need to at least add a plausible value there
		// we'll unschedule, redownload and reschedule the fixed instances after login.
		const alarmNotificationTypeModel = await resolveTypeReference(AlarmNotificationTypeRef)
		const alarms: Array<UntypedInstance> = await this.conf.getVar(DesktopConfigKey.scheduledAlarms)
		if (!alarms) {
			return []
		} else if (alarms.length > 0 && typeof alarms[0]["_format"] === "string") {
			// Legacy code path before migration to type and attribute ids
			// CalendarFacade.scheduleAlarmsForNewDevice is anyway invoked if SystemModel has changed.
			return []
		} else {
			return Promise.all(
				alarms.map(async (untypedInstance) => {
					const encryptedParsedInstace = await this.instancePipeline.typeMapper.applyJsTypes(alarmNotificationTypeModel, untypedInstance)
					return await this.decryptAlarmNotification(encryptedParsedInstace)
				}),
			)
		}
	}

	_saveAlarms(alarms: ReadonlyArray<UntypedInstance>): Promise<void> {
		return this.conf.setVar(DesktopConfigKey.scheduledAlarms, alarms)
	}

	async encryptAlarmNotification(an: AlarmNotification): Promise<UntypedInstance> {
		// FIXME the AlarmNotification instance at this point should have only one relevant encrypted session key. Other are discarded in TutaSse
		const notificationSessionKey = an.notificationSessionKeys[0]
		const sessionKeyForPushId = assertNotNull(await this.getPushIdentifierSessionKey(notificationSessionKey.pushIdentifier))
		const sk = decryptKey(sessionKeyForPushId, notificationSessionKey.pushIdentifierSessionEncSessionKey)
		return await this.instancePipeline.encryptAndMapToLiteral(AlarmNotificationTypeRef, an, sk)
	}

	// FIXME this could probably take an UntypedInstance directly.

	public async decryptAlarmNotification(an: EncryptedParsedInstance): Promise<AlarmNotification> {
		const notificationSessionKeyModel = await resolveTypeReference(NotificationSessionKeyTypeRef)
		const alarmNotificationTypeModel = await resolveTypeReference(AlarmNotificationTypeRef)

		const notificationSessionKeys = AttributeModel.getAttribute<EncryptedParsedInstance[]>(an, "notificationSessionKeys", alarmNotificationTypeModel)
		for (const nsk of notificationSessionKeys) {
			const pushIdForKey = AttributeModel.getAttribute<IdTuple>(nsk, "pushIdentifier", notificationSessionKeyModel)
			const sessionKeyforPushId = await this.getPushIdentifierSessionKey(pushIdForKey)
			if (!sessionKeyforPushId) {
				// could not resolve session key for current notificationSessionKey. Continue iteration...
				continue
			}
			// now we can decrypt the session key
			const encSessionKey = AttributeModel.getAttribute<Base64>(nsk, "pushIdentifierSessionEncSessionKey", notificationSessionKeyModel)

			const sk = decryptKey(sessionKeyforPushId, base64ToUint8Array(encSessionKey))
			// sk can decrypt the an instance
			const parsedInstance = await this.instancePipeline.cryptoMapper.decryptParsedInstance(alarmNotificationTypeModel, an, sk)

			const alarmNotification: AlarmNotification = await this.instancePipeline.modelMapper.applyClientModel(AlarmNotificationTypeRef, parsedInstance)

			if (hasError(alarmNotification)) {
				// some property of the AlarmNotification couldn't be decrypted with the selected key
				// throw away the key that caused the error and try the next one
				await this.removePushIdentifierKey(elementIdPart(pushIdForKey))
				continue
			}

			// discard irrelevant session keys, keep currect encrypted session key
			alarmNotification.notificationSessionKeys = [
				createNotificationSessionKey({
					pushIdentifier: pushIdForKey,
					pushIdentifierSessionEncSessionKey: base64ToUint8Array(encSessionKey),
				}),
			]
			return alarmNotification
		}
		throw new CryptoError("could not decrypt alarmNotification")
	}
}
