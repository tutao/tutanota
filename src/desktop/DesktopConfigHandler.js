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
	| 'pushEncSessionKeys'
	| 'scheduledAlarms'
	| 'lastProcessedNotificationId'

export type BuildConfigKey
	= "pollingInterval"
	| "checkUpdateSignature"
	| "appUserModelId"
	| "initialSseConnectTimeoutInSeconds"
	| "maxSseConnectTimeoutInSeconds"
	| "defaultDesktopConfig"
	| "desktophtml"
	| "preloadjs"
	| "iconName"
	| "fileManagerTimeout"
	| "pubKeys"

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
			this._buildConfig = require(path.join(app.getAppPath(), 'package.json'))['tutao-config']
		} catch (e) {
			app.once('ready', () => {
				dialog.showMessageBox(null, {
					type: 'error',
					buttons: ['Ok'],
					defaultId: 0,
					// no lang yet
					title: 'Oh No!',
					message: `Couldn't load config: \n ${e.message}`
				})
				process.exit(1)
			})
			return
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

	/**
	 * change the runtime-defined config and write it to disk
	 * @param key value to change. a key of "any" will replace the conf object with value.
	 * @param value the new value
	 * @returns {never|Promise<any>|Promise<void>|*}
	 */
	setDesktopConfig(key: DesktopConfigKey, value: any): Promise<void> {
		setImmediate(() => this._emit(key, value))
		if (key !== 'any') {
			this._desktopConfig[key] = value
		} else {
			this._desktopConfig = value
		}
		return promisify(fs.writeJson)(this._desktopConfigPath, this._desktopConfig, {spaces: 2})
	}

	/**
	 * listen to changes in the config
	 * @param key the value you want to listen for. a key of "any" will be called with the complete config for any changes to the config.
	 * @param cb a function that's called when the config changes. argument is the new value or the entire config object in case of the "any" event.
	 * @returns {DesktopConfigHandler}
	 */
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

	// calls every callback for the given key, and every "any" callback
	_emit(key: DesktopConfigKey, val: any) {
		if (this._onValueSetListeners["any"]) {
			this._onValueSetListeners["any"].forEach(cb => cb(this._desktopConfig))
		}
		if (key === "any" || !this._onValueSetListeners[key]) return
		this._onValueSetListeners[key].forEach(cb => cb(val))
	}
}
