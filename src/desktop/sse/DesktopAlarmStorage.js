// @flow
import * as keytar from 'keytar'
import type {DeferredObject} from "../../api/common/utils/Utils"
import {defer} from "../../api/common/utils/Utils"
import crypto from 'crypto'
import {CryptoError} from '../../api/common/error/CryptoError'
import {DesktopConfigHandler} from "../DesktopConfigHandler"

const SERVICE_NAME = 'tutanota-vault'
const ACCOUNT_NAME = 'tuta'
const ALGORITHM = 'aes-256-cbc'
type EncryptedKey = {
	encKeyB64: string,
	ivB64: string
}

/**
 * manages session keys used for decrypting alarm notifications, encrypting & persisting them to disk
 */
export class DesktopAlarmStorage {
	_initialized: DeferredObject<string>;
	_conf: DesktopConfigHandler;
	_sessionKeysB64: {[string]: string};

	constructor(conf: DesktopConfigHandler) {
		this._conf = conf
		this._initialized = defer()
		this._sessionKeysB64 = {}
	}

	/**
	 * needs to be called before using any of the public methods.
	 * ensures there is a device key in the local secure storage
	 */
	init(): Promise<void> {
		return keytar.findPassword(SERVICE_NAME)
		             .then(pw => pw
			             ? Promise.resolve(pw)
			             : this._generateAndStoreDeviceKey()
		             )
		             .then(pw => this._initialized.resolve(pw))
	}

	_generateAndStoreDeviceKey(): Promise<string> {
		console.warn("device key not found, generating a new one")
		const key = crypto.randomBytes(32).toString('base64')
		return keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key)
		             .then(() => keytar.findPassword(SERVICE_NAME))
		             .then(pw => {
			             if (!pw) {
				             throw new CryptoError("alarmstorage key creation failed!")
			             }
			             return pw
		             })
	}

	/**
	 * encrypts a key with the device key using aes-256-cbc
	 * @param keyToEncrypt B64 encoded key to encrypt
	 * @param deviceKeyB64 key used to encrypt
	 * @returns Promise<EncryptedKey> the B64 encoded encrypted key and its iv
	 * @private
	 */
	_encryptKey(keyToEncrypt: string, deviceKeyB64: string): EncryptedKey {
		const ivBuffer = crypto.randomBytes(16)
		const keyBuffer = Buffer.from(deviceKeyB64, 'base64')
		const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer)
		let encryptedKeyB64 = cipher.update(Buffer.from(keyToEncrypt, 'base64'), 'latin1' /* ignored! */, 'base64')
		encryptedKeyB64 += cipher.final('base64')
		return {
			encKeyB64: encryptedKeyB64, ivB64: ivBuffer.toString('base64')
		}
	}

	/**
	 * decrypts an encrypted key with the device key using aes-256-cbc
	 * @param keyToDecrypt encrypted key and iv
	 * @param deviceKeyB64 the key used for decryption
	 * @returns Promise<string> B64 representation of the decrypted key
	 * @private
	 */
	_decryptKey(keyToDecrypt: EncryptedKey, deviceKeyB64: string): string {
		const ivBuffer = Buffer.from(keyToDecrypt.ivB64, 'base64')
		const deviceKeyBuffer = Buffer.from(deviceKeyB64, 'base64')
		const decipher = crypto.createDecipheriv(ALGORITHM, deviceKeyBuffer, ivBuffer)
		const keyToDecryptBuffer = Buffer.from(keyToDecrypt.encKeyB64, 'base64')
		let decryptedKeyB64 = decipher.update(keyToDecryptBuffer)
		decryptedKeyB64 = Buffer.concat([decryptedKeyB64, decipher.final()])
		return decryptedKeyB64.toString('base64')
	}

	/**
	 * encrypt & store a session key to disk
	 * @param pushIdentifierId pushIdentifier the key belongs to
	 * @param pushIdentifierSessionKeyB64 unencrypted B64 encoded key to store
	 * @returns {*}
	 */
	storePushIdentifierSessionKey(pushIdentifierId: string, pushIdentifierSessionKeyB64: string): Promise<void> {
		const keys = this._conf.getDesktopConfig('pushEncSessionKeys') || {}
		if (!keys[pushIdentifierId]) {
			this._sessionKeysB64[pushIdentifierId] = pushIdentifierSessionKeyB64
			return this._initialized.promise
			           .then(pw => {
				           keys[pushIdentifierId] = this._encryptKey(pushIdentifierSessionKeyB64, pw)
				           return this._conf.setDesktopConfig('pushEncSessionKeys', keys)
			           })
		}
		return Promise.resolve()
	}

	/**
	 * get a B64 encoded sessionKey from memory or decrypt it from disk storage
	 * @param pushIdentifierId pushIdentifier that identifies the correct key
	 * @returns {*}
	 */
	resolvePushIdentifierSessionKey(pushIdentifierId: string): Promise<string> {
		const keys = this._conf.getDesktopConfig('pushEncSessionKeys') || {}
		return this._sessionKeysB64[pushIdentifierId]
			? Promise.resolve(this._sessionKeysB64[pushIdentifierId])
			: this._initialized.promise
			      .then(pw => {
				      const decryptedKeyB64 = this._decryptKey(keys[pushIdentifierId], pw)
				      this._sessionKeysB64[pushIdentifierId] = decryptedKeyB64
				      return decryptedKeyB64
			      })
	}

	storeScheduledAlarms(scheduledNotifications: {[string]: {timeout: TimeoutID, an: AlarmNotification}}): Promise<void> {
		return this._conf.setDesktopConfig('scheduledAlarms', Object.values(scheduledNotifications).map(val => val.an))
	}

	getScheduledAlarms(): Array<AlarmNotification> {
		return this._conf.getDesktopConfig('scheduledAlarms') || []
	}
}
