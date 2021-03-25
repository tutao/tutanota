// @flow
import path from 'path'
import type {DeferredObject} from "../../api/common/utils/Utils"
import {defer, downcast, getChangedProps} from "../../api/common/utils/Utils"
import type {MigrationKind} from "./migrations/DesktopConfigMigrator"
import {DesktopConfigMigrator} from "./migrations/DesktopConfigMigrator"
import fs from "fs"
import type {Config} from "./ConfigCommon"
import type {BuildConfigKeyEnum, DesktopConfigEncKeyEnum, DesktopConfigKeyEnum} from "./ConfigKeys"
import {DesktopConfigEncKeyValues, DesktopConfigKeyValues} from "./ConfigKeys"
import type {App} from "electron"
import type {DeviceKeyProvider} from "../DeviceKeyProviderImpl"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"


type AllConfigKeysEnum = DesktopConfigKeyEnum | DesktopConfigEncKeyEnum

/**
 * manages build and user config
 */
export class DesktopConfig {
	_buildConfig: DeferredObject<Config>;
	_desktopConfig: DeferredObject<Config>; // user preferences as set for this installation
	_desktopConfigPath: string;
	_deviceKeyProvider: DeviceKeyProvider
	_cryptoFacade: DesktopCryptoFacade
	_app: App
	_migrator: DesktopConfigMigrator
	_onValueSetListeners: {[AllConfigKeysEnum]: Array<(val: any)=>void>}

	constructor(app: App, migrator: DesktopConfigMigrator, deviceKeyProvider: DeviceKeyProvider, cryptFacade: DesktopCryptoFacade) {
		this._deviceKeyProvider = deviceKeyProvider
		this._cryptoFacade = cryptFacade
		this._app = app
		this._migrator = migrator
		this._desktopConfigPath = path.join(app.getPath('userData'), 'conf.json')
		this._onValueSetListeners = {}
		this._buildConfig = defer()
		this._desktopConfig = defer()
	}

	async init() {
		try {
			const packageJsonPath = path.join(this._app.getAppPath(), 'package.json')
			const packageJson = downcast<{[string]: mixed}>(await readJSON(packageJsonPath))
			this._buildConfig.resolve(downcast<Config>(packageJson['tutao-config']))
		} catch (e) {
			throw new Error("Could not load build config: " + e)
		}

		const buildConfig = await this._buildConfig.promise
		const defaultConf: Config = downcast(buildConfig["defaultDesktopConfig"])

		// create default config if none exists
		try {
			fs.accessSync(this._desktopConfigPath, fs.constants.F_OK)
		} catch (e) {
			fs.writeFileSync(this._desktopConfigPath, JSON.stringify(defaultConf))
		}

		const userConf = await readJSON(this._desktopConfigPath)
		const populatedConfig = Object.assign({}, defaultConf, userConf)
		const desktopConfig = await this._migrator.applyMigrations(
			downcast<MigrationKind>(buildConfig["configMigrationFunction"]),
			populatedConfig,
		)
		await fs.mkdirSync(path.join(this._app.getPath('userData')), {recursive: true})
		const json = JSON.stringify(desktopConfig, null, 2)
		await fs.writeFileSync(this._desktopConfigPath, json)
		this._desktopConfig.resolve(desktopConfig)
	}

	async getConst(key?: BuildConfigKeyEnum): Promise<any> {
		const config = await this._buildConfig.promise
		return key ? config[key] : config
	}

	async getVar(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum): Promise<any> {
		const desktopConfig = await this._desktopConfig.promise

		if (DesktopConfigKeyValues.has(downcast(key))) {
			return desktopConfig[key]
		} else if (DesktopConfigEncKeyValues.has(downcast(key))) {
			return this._getEncryptedVar(key)
		}
	}

	async _getEncryptedVar(key: DesktopConfigEncKeyEnum): Promise<any> {
		const desktopConfig = await this._desktopConfig.promise
		const encryptedValue = desktopConfig[key]

		if (!encryptedValue) {
			return null
		}

		const deviceKey = await this._deviceKeyProvider.getDeviceKey()
		const decryptedValue = this._cryptoFacade.aesDecryptObject(deviceKey, downcast<string>(encryptedValue))
		return decryptedValue
	}

	async _setEncryptedVar(key: DesktopConfigEncKeyEnum, value: any) {
		const deviceKey = await this._deviceKeyProvider.getDeviceKey()
		const encryptedValue = this._cryptoFacade.aesEncryptObject(deviceKey, value)
		const desktopConfig = await this._desktopConfig.promise
		desktopConfig[key] = encryptedValue
	}

	/**
	 * change the runtime-defined config and write it to disk
	 * @param key value to change. a key of "any" will replace the conf object with value.
	 * @param value the new value
	 * @returns {never|Promise<any>|Promise<void>|*}
	 */
	async setVar(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum, value: any): Promise<void> {
		const desktopConfig = await this._desktopConfig.promise

		const oldValue = await this.getVar(key)

		if (DesktopConfigKeyValues.has(downcast(key))) {
			desktopConfig[key] = value
		} else if (DesktopConfigEncKeyValues.has(downcast(key))) {
			await this._setEncryptedVar(key, value)
		}

		await this._saveAndNotify(key, value, oldValue)
	}

	async _saveAndNotify(key: AllConfigKeysEnum, value: any, oldValue: any): Promise<void> {
		const desktopConfig = await this._desktopConfig.promise
		const json = JSON.stringify(desktopConfig, null, 2)
		fs.writeFileSync(this._desktopConfigPath, json)
		this._notifyChangeListeners(key, value, oldValue)
	}

	/**
	 * listen to changes in the config
	 * @param key the value you want to listen for. a key of "any" will be called with the complete config for any changes to the config.
	 * @param cb a function that's called when the config changes. argument is the new value or the entire config object in case of the "any" event.
	 * @param sendInitial {boolean} whether cb should be notified of current value right away. Default false.
	 * @returns {DesktopConfig}
	 */
	on(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum, cb: (val: any) => void, sendInitial: boolean = false): DesktopConfig {
		if (!this._onValueSetListeners[key]) {
			this._onValueSetListeners[key] = [cb]
		} else {
			this._onValueSetListeners[key].push(cb)
		}

		if (sendInitial) {
			this.getVar(key).then(cb)
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

	removeListener(key: AllConfigKeysEnum, cb: (val: any)=>void): this {
		if (!this._onValueSetListeners[key]) return this
		this._onValueSetListeners[key].splice(this._onValueSetListeners[key].indexOf(cb), 1)
		return this
	}

	// calls every callback for the given key, and every "any" callback
	_notifyChangeListeners(key: AllConfigKeysEnum, value: any, oldValue: any) {
		if (this._onValueSetListeners["any"]) {
			this._onValueSetListeners["any"].forEach(cb => cb(this._desktopConfig))
		}
		if (key === "any") {
			// check if any props with listeners changed
			for (const p of getChangedProps(value, oldValue)) {
				const configKey: AllConfigKeysEnum = downcast(p)
				if (configKey === 'any') continue;
				if (this._onValueSetListeners[configKey]) {
					for (const cb of this._onValueSetListeners[configKey]) {
						cb(value[configKey])
					}
				}
			}
		} else if (this._onValueSetListeners[key]) {
			for (const cb of this._onValueSetListeners[key]) {
				cb(value)
			}
		}

	}
}

async function readJSON(path: string): Promise<mixed> {
	const text: string = fs.readFileSync(path, "utf8")
	return JSON.parse(text)
}