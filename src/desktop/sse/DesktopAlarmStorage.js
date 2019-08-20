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
 * manages storage for alarm notifications/reminders
 */
export class DesktopAlarmStorage {
	_initialized: DeferredObject<string>;
	_conf: DesktopConfigHandler;

	constructor(conf: DesktopConfigHandler) {
		this._conf = conf
		this._initialized = defer()
	}

	init(): Promise<void> {
		return keytar.findPassword(SERVICE_NAME)
		             .then(pw => pw
			             ? Promise.resolve(pw)
			             : this.generateAndStoreDeviceKey()
		             )
		             .then(pw => this._initialized.resolve(pw))
	}

	generateAndStoreDeviceKey(): Promise<string> {
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
	 * @returns Promise<EncryptedKey> the B64 encoded encrypted key and its iv
	 */
	encryptKey(keyToEncrypt: string): Promise<EncryptedKey> {
		return keytar.findPassword(SERVICE_NAME)
		             .then(deviceKeyB64 => {
				             const ivBuffer = crypto.randomBytes(16)
				             const keyBuffer = Buffer.from(deviceKeyB64, 'base64')
				             const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer)
				             let encryptedKeyB64 = cipher.update(keyToEncrypt, 'base64', 'base64')
				             encryptedKeyB64 += cipher.final('base64')
				             return {
					             encKeyB64: encryptedKeyB64, ivB64: ivBuffer.toString('base64')
				             }
			             }
		             )
	}

	/**
	 * decrypts an encrypted key with the device key using aes-256-cbc
	 * @param keyToDecrypt encrypted key and iv
	 * @returns Promise<string> B64 representation of the decrypted key
	 */
	decryptKey(keyToDecrypt: EncryptedKey): Promise<string> {
		return keytar.findPassword(SERVICE_NAME)
		             .then(deviceKeyB64 => {
			             const ivBuffer = Buffer.from(keyToDecrypt.ivB64, 'base64')
			             const keyBuffer = Buffer.from(deviceKeyB64, 'base64')
			             const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer)
			             let decryptedKeyB64 = decipher.update(keyToDecrypt.encKeyB64, 'base64', 'base64')
			             decryptedKeyB64 += decipher.final('base64')
			             return decryptedKeyB64
		             })
	}

	storeSessionKey(pushIdentifierId: string, pushIdentifierSessionKeyB64: string): Promise<void> {
		const keys = this._conf.getDesktopConfig('pushEncSessionKeys') || {}
		if (!keys[pushIdentifierId]) {
			return this.encryptKey(pushIdentifierSessionKeyB64)
			           .then(pushEncSessionKey => {
				           keys[pushIdentifierId] = pushEncSessionKey
				           return this._conf.setDesktopConfig('pushEncSessionKeys', keys)
			           })
		}
		return Promise.resolve()
	}
}
