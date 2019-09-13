// @flow
import path from 'path'
import {downcast, getChangedProps} from "../../api/common/utils/Utils"
import type {MigrationKind} from "./migrations/DesktopConfigMigrator"
import applyMigrations from "./migrations/DesktopConfigMigrator"
import {existsSync, promises as fs, writeFileSync} from "fs"
import {readJSONSync} from "../DesktopUtils"
import type {Config} from "./ConfigCommon"
import type {BuildConfigKeyEnum, DesktopConfigKeyEnum} from "./ConfigKeys"
import type {App} from "electron"

/**
 * manages build and user config
 */
export class DesktopConfig {
	_buildConfig: Config;
	_desktopConfig: Config; // user preferences as set for this installation
	_desktopConfigPath: string;
	_onValueSetListeners: {[DesktopConfigKeyEnum]: Array<(val: any)=>void>}

	constructor(app: App) {
		this._desktopConfigPath = path.join(app.getPath('userData'), 'conf.json')
		this._onValueSetListeners = {}
		try {
			this._buildConfig = downcast<Config>(readJSONSync(path.join(app.getAppPath(), 'package.json'))['tutao-config'])
		} catch (e) {
			throw new Error("Could not load config: " + e)
		}
		try {
			const defaultConf: Config = downcast(this._buildConfig["defaultDesktopConfig"])
			const userConf = existsSync(this._desktopConfigPath)
				? readJSONSync(this._desktopConfigPath)
				: {}
			this._desktopConfig = Object.assign({}, defaultConf, userConf)
			this._desktopConfig = applyMigrations(
				downcast<MigrationKind>(this._buildConfig["configMigrationFunction"]),
				this._desktopConfig,
				defaultConf
			)
			fs.mkdir(path.join(app.getPath('userData')), {recursive: true})
			const json = JSON.stringify(this._desktopConfig, null, 2)
			writeFileSync(this._desktopConfigPath, json)
		} catch (e) {
			this._desktopConfig = downcast<Config>(this._buildConfig["defaultDesktopConfig"])
			console.error("Could not create or load desktop config:", e.message)
		}
	}

	getConst(key?: BuildConfigKeyEnum): any {
		return key
			? this._buildConfig[key]
			: this._buildConfig
	}

	getVar(key?: DesktopConfigKeyEnum): any {
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
	setVar(key: DesktopConfigKeyEnum, value: any): Promise<void> {
		let oldVal
		if (key !== 'any') {
			oldVal = this._desktopConfig[key]
			this._desktopConfig[key] = value
		} else {
			oldVal = this._desktopConfig
			this._desktopConfig = value
		}
		return Promise.resolve()
		              .then(() => this._notifyChangeListeners(key, value, oldVal))
		              .then(() => {
			              const json = JSON.stringify(this._desktopConfig, null, 2)
			              return fs.writeFile(this._desktopConfigPath, json)
		              })
	}

	/**
	 * listen to changes in the config
	 * @param key the value you want to listen for. a key of "any" will be called with the complete config for any changes to the config.
	 * @param cb a function that's called when the config changes. argument is the new value or the entire config object in case of the "any" event.
	 * @param sendInitial {boolean} whether cb should be notified of current value right away. Default false.
	 * @returns {DesktopConfig}
	 */
	on(key: DesktopConfigKeyEnum, cb: (val: any) => void, sendInitial: boolean = false): DesktopConfig {
		if (!this._onValueSetListeners[key]) {
			this._onValueSetListeners[key] = [cb]
		} else {
			this._onValueSetListeners[key].push(cb)
		}
		if (sendInitial) {
			cb(this.getVar(key))
		}
		return this
	}

	removeAllListeners(key?: DesktopConfigKeyEnum): this {
		if (key) {
			this._onValueSetListeners[key] = []
		} else {
			this._onValueSetListeners = {}
		}

		return this
	}

	removeListener(key: DesktopConfigKeyEnum, cb: (val: any)=>void): this {
		if (!this._onValueSetListeners[key]) return this
		this._onValueSetListeners[key].splice(this._onValueSetListeners[key].indexOf(cb), 1)
		return this
	}

	// calls every callback for the given key, and every "any" callback
	_notifyChangeListeners(key: DesktopConfigKeyEnum, value: any, oldValue: any) {
		if (this._onValueSetListeners["any"]) {
			this._onValueSetListeners["any"].forEach(cb => cb(this._desktopConfig))
		}
		if (key === "any") {
			// check if any props with listeners changed
			getChangedProps(value, oldValue).forEach(p => {
				if (p === 'any') return
				if (this._onValueSetListeners[p]) {
					this._onValueSetListeners[p]
						.forEach(cb => cb(value[p]))
				}
			})
		} else if (this._onValueSetListeners[key]) {
			this._onValueSetListeners[key].forEach(cb => cb(value))
		}

	}
}
