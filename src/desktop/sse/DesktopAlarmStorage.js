// @flow
import type {DeferredObject} from "../../api/common/utils/Utils"
import {defer, downcast} from "../../api/common/utils/Utils"
import {CryptoError} from '../../api/common/error/CryptoError'
import type {DesktopConfig} from "../config/DesktopConfig"
import type {TimeoutData} from "./DesktopAlarmScheduler"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {uint8ArrayToBitArray} from "../../api/worker/crypto/CryptoUtils"
import {base64ToUint8Array} from "../../api/common/utils/Encoding"
import type {AlarmNotification} from "../../api/entities/sys/AlarmNotification"
import {elementIdPart} from "../../api/common/utils/EntityUtils"
import {DesktopConfigKey} from "../config/ConfigKeys"
import type {SecretStorage} from "./SecretStorage"

const SERVICE_NAME = 'tutanota-vault'
const ACCOUNT_NAME = 'tuta'

/**
 * manages session keys used for decrypting alarm notifications, encrypting & persisting them to disk
 */
export class DesktopAlarmStorage {
	_initialized: DeferredObject<BitArray>;
	_conf: DesktopConfig;
	_crypto: DesktopCryptoFacade
	_sessionKeysB64: {[pushIdentifierId: string]: string};
	_secretStorage: SecretStorage

	constructor(conf: DesktopConfig, desktopCryptoFacade: DesktopCryptoFacade, secretStorage: SecretStorage) {
		this._conf = conf
		this._crypto = desktopCryptoFacade
		this._initialized = defer()
		this._sessionKeysB64 = {}
		this._secretStorage = secretStorage
	}

	/**
	 * needs to be called before using any of the public methods.
	 * ensures there is a device key in the local secure storage
	 */
	init(): Promise<void> {
		return this._secretStorage.findPassword(SERVICE_NAME)
		           .then(pw => pw
			           ? pw
			           : this._generateAndStoreDeviceKey()
		           )
		           .then(pw => this._initialized.resolve(uint8ArrayToBitArray(base64ToUint8Array(pw))))
	}

	_generateAndStoreDeviceKey(): Promise<string> {
		console.warn("device key not found, generating a new one")
		// save key entry in keychain
		return this._secretStorage.setPassword(SERVICE_NAME, ACCOUNT_NAME, this._crypto.generateDeviceKey())
		           .then(() => this._secretStorage.findPassword(SERVICE_NAME))
		           .then(pw => {
			           if (!pw) {
				           throw new CryptoError("alarmstorage key creation failed!")
			           }
			           return pw
		           })
	}

	/**
	 * encrypt & store a session key to disk
	 * @param pushIdentifierId pushIdentifier the key belongs to
	 * @param pushIdentifierSessionKeyB64 unencrypted B64 encoded key to store
	 * @returns {*}
	 */
	storePushIdentifierSessionKey(pushIdentifierId: string, pushIdentifierSessionKeyB64: string): Promise<void> {
		const keys = this._conf.getVar('pushEncSessionKeys') || {}
		if (!keys[pushIdentifierId]) {
			this._sessionKeysB64[pushIdentifierId] = pushIdentifierSessionKeyB64
			return this._initialized.promise
			           .then(pw => {
				           keys[pushIdentifierId] = this._crypto.aes256EncryptKeyToB64(pw, pushIdentifierSessionKeyB64)
				           return this._conf.setVar('pushEncSessionKeys', keys)
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
	resolvePushIdentifierSessionKey(sessionKeys: Array<{pushIdentifierSessionEncSessionKey: string, pushIdentifier: IdTuple}>): Promise<{piSkEncSk: string, piSk: string}> {
		return this._initialized.promise.then(pw => {
			const keys = this._conf.getVar('pushEncSessionKeys') || {}
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
		})
	}

	storeScheduledAlarms(scheduledNotifications: {[string]: {timeouts: Array<TimeoutData>, an: AlarmNotification}}): Promise<void> {
		return this._conf.setVar('scheduledAlarms', Object.values(scheduledNotifications).map(val => downcast(val).an))
	}

	getScheduledAlarms(): Array<AlarmNotification> {
		return this._conf.getVar('scheduledAlarms') || []
	}
}
