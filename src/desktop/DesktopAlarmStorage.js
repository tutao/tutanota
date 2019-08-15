// @flow
import {app} from 'electron'
import path from 'path'
import DesktopUtils from './DesktopUtils.js'
import * as keytar from 'keytar'
import type {DeferredObject} from "../api/common/utils/Utils"
import {defer} from "../api/common/utils/Utils"
import crypto from 'crypto'
import {CryptoError} from '../api/common/error/CryptoError'

const SERVICE_NAME = 'tutanota-vault'
const ACCOUNT_NAME = 'tuta'

/**
 * manages storage for alarm notifications/reminders
 */
export class DesktopAlarmStorage {
	_storageFile: string;
	_initialized: DeferredObject<string>;

	constructor() {
		const appPath = app.getPath('userData')
		this._storageFile = path.join(appPath, 'alarms.json')
		this._initialized = defer()
		DesktopUtils.touch(this._storageFile)
	}

	init(): Promise<void> {
		return keytar.findPassword(SERVICE_NAME)
		             .then(pw => pw
			             ? Promise.resolve(pw)
			             : this.generateAndStoreKey()
		             )
		             .then(pw => this._initialized.resolve(pw))
	}

	generateAndStoreKey(): Promise<string> {
		console.warn("device key not found, generating a new one")
		const key = crypto.randomBytes(256).toString('base64')
		return keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key)
		             .then(() => keytar.findPassword(SERVICE_NAME))
		             .then(pw => {
			             if (!pw) {
				             throw new CryptoError("vault key creation failed!")
			             }
			             return pw
		             })
	}


}
