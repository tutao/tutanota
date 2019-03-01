// @flow
import path from 'path'
import {promisify} from 'util'
import {app, dialog} from 'electron'
import fs from 'fs-extra'

export type DesktopConfigKey
	= 'any'
	| 'heartbeatTimeoutInSeconds'
	| 'defaultDownloadPath'
	| 'enableAutoUpdate'
	| 'pushIdentifier'
	| 'runAsTrayApp'
	| 'lastBounds'

export type BuildConfigKey
	= "pubKeyUrl"
	| "pollingInterval"
	| "checkUpdateSignature"
	| "appUserModelId"
	| "initialSseConnectTimeoutInSeconds"
	| "maxSseConnectTimeoutInSeconds"
	| "defaultDesktopConfig"

/**
 * manages build and user config
 */
export class DesktopConfigHandler {
	_buildConfig: any;
	_desktopConfig: any; // user preferences as set for this installation
	_desktopConfigPath: string;
	_onValueSetListeners: {[DesktopConfigKey]: Array<(val: any)=>void>}

	constructor() {
		this._desktopConfigPath = path.join(app.getPath('userData'), 'conf.json')
		this._onValueSetListeners = {}
		try {
			this._buildConfig = require(path.join(__dirname, '../..', 'package.json'))['tutao-config']
		} catch (e) {
			dialog.showMessageBox(null, {
				type: 'error',
				buttons: ['Ok'],
				defaultId: 0,
				// no lang yet
				title: 'Oh No!',
				message: `Couldn't load config: \n ${e.message}`
			})
			process.exit(1)
		}
		try {
			this._desktopConfig = this._buildConfig["defaultDesktopConfig"]
			const userConf = fs.existsSync(this._desktopConfigPath)
				? fs.readJSONSync(this._desktopConfigPath)
				: {}
			this._desktopConfig = Object.assign(this._desktopConfig, userConf)
			fs.mkdirp(path.join(app.getPath('userData')))
			fs.writeJSONSync(this._desktopConfigPath, this._desktopConfig, {spaces: 2})
		} catch (e) {
			this._desktopConfig = this._buildConfig["defaultDesktopConfig"]
			console.error("Could not create or load desktop config:", e.message)
		}
	}

	get(key?: BuildConfigKey): any {
		return key
			? this._buildConfig[key]
			: this._buildConfig
	}

	getDesktopConfig(key?: DesktopConfigKey): any {
		return key && key !== 'any'
			? this._desktopConfig[key]
			: this._desktopConfig
	}

	setDesktopConfig(key: DesktopConfigKey, value: any): Promise<void> {
		setImmediate(() => this._emit(key, value))
		if (key !== 'any') {
			this._desktopConfig[key] = value
		} else {
			this._desktopConfig = value
		}
		return promisify(fs.writeJson)(this._desktopConfigPath, this._desktopConfig, {spaces: 2})
	}

	on(key: DesktopConfigKey, cb: (val: any) => void): DesktopConfigHandler {
		if (!this._onValueSetListeners[key]) {
			this._onValueSetListeners[key] = [cb]
		} else {
			this._onValueSetListeners[key].push(cb)
		}
		return this
	}

	removeAllListeners(key?: DesktopConfigKey) {
		if (key) {
			this._onValueSetListeners[key] = []
		} else {
			this._onValueSetListeners = {}
		}

		return this
	}

	removeListener(key: DesktopConfigKey, cb: (val: any)=>void) {
		if (!this._onValueSetListeners[key]) return this
		this._onValueSetListeners[key].splice(this._onValueSetListeners[key].indexOf(cb), 1)
		return this
	}

	_emit(key: DesktopConfigKey, val: any) {
		if (!this._onValueSetListeners[key]) return
		this._onValueSetListeners[key].forEach(cb => cb(val))
	}
}
