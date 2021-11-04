// @flow
import path from 'path'
import type {DeferredObject} from "../../api/common/utils/Utils"
import {defer, downcast} from "../../api/common/utils/Utils"
import type {MigrationKind} from "./migrations/DesktopConfigMigrator"
import {DesktopConfigMigrator} from "./migrations/DesktopConfigMigrator"
import fs from "fs"
import type {Config} from "./ConfigCommon"
import type {BuildConfigKeyEnum, DesktopConfigEncKeyEnum, DesktopConfigKeyEnum} from "./ConfigKeys"
import {DesktopConfigEncKeyValues, DesktopConfigKeyValues} from "./ConfigKeys"
import type {App} from "electron"
import type {DesktopDeviceKeyProvider} from "../DeviceKeyProviderImpl"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {CryptoError} from "../../api/common/error/CryptoError"
import {log} from "../DesktopLog"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import type {ConfigFileType} from "./ConfigFile"
import {getConfigFile} from "./ConfigFile"


type AllConfigKeysEnum = DesktopConfigKeyEnum | DesktopConfigEncKeyEnum

type ConfigValue = string | number | {} | boolean | $ReadOnlyArray<ConfigValue>

/**
 * manages build and user config
 */
export class DesktopConfig {
	_buildConfig: DeferredObject<Config>;
	_desktopConfig: DeferredObject<Config>; // user preferences as set for this installation
	_desktopConfigFile: ConfigFileType;
	_deviceKeyProvider: DesktopDeviceKeyProvider
	_cryptoFacade: DesktopCryptoFacade
	_app: App
	_migrator: DesktopConfigMigrator
	_onValueSetListeners: {[AllConfigKeysEnum]: Array<(val: ?ConfigValue) => void>}

	constructor(app: App, migrator: DesktopConfigMigrator, deviceKeyProvider: DesktopDeviceKeyProvider, cryptFacade: DesktopCryptoFacade) {
		this._deviceKeyProvider = deviceKeyProvider
		this._cryptoFacade = cryptFacade
		this._app = app
		this._migrator = migrator
		this._desktopConfigFile = getConfigFile(path.join(app.getPath('userData'), 'conf.json'), fs)
		this._onValueSetListeners = {}
		this._buildConfig = defer()
		this._desktopConfig = defer()
	}

	async init() {
		try {
			const packageJsonFile = getConfigFile(path.join(this._app.getAppPath(), 'package.json'), fs)
			const packageJson = downcast<{[string]: mixed}>(await packageJsonFile.readJSON())
			this._buildConfig.resolve(downcast<Config>(packageJson['tutao-config']))
		} catch (e) {
			throw new Error("Could not load build config: " + e)
		}

		const buildConfig = await this._buildConfig.promise
		const defaultConf: Config = downcast(buildConfig["defaultDesktopConfig"])

		// create default config if none exists
		await this._desktopConfigFile.ensurePresence(defaultConf)

		const userConf = (await this._desktopConfigFile.readJSON()) || defaultConf
		const populatedConfig = Object.assign({}, defaultConf, userConf)
		const desktopConfig = await this._migrator.applyMigrations(
			downcast<MigrationKind>(buildConfig["configMigrationFunction"]),
			populatedConfig,
		)
		await fs.promises.mkdir(path.join(this._app.getPath('userData')), {recursive: true})
		await this._desktopConfigFile.writeJSON(desktopConfig)
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
		try {
			return this._cryptoFacade.aesDecryptObject(deviceKey, downcast<string>(encryptedValue))
		} catch (e) {
			if (e instanceof CryptoError) {
				log.error(`Could not decrypt encrypted var ${key}`, e)
				await this.setVar(key, null)
				return null
			}
		}
	}

	async _setEncryptedVar(key: DesktopConfigEncKeyEnum, value: ?ConfigValue) {
		const deviceKey = await this._deviceKeyProvider.getDeviceKey()
		let encryptedValue
		if (value != null) {
			encryptedValue = this._cryptoFacade.aesEncryptObject(deviceKey, value)
		} else {
			encryptedValue = null
		}
		const desktopConfig = await this._desktopConfig.promise
		desktopConfig[key] = encryptedValue
	}

	/**
	 * change the runtime-defined config and write it to disk
	 * @param key value to change. a key of "any" will replace the conf object with value.
	 * @param value the new value
	 * @returns {never|Promise<any>|Promise<void>|*}
	 */
	async setVar(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum, value: ?ConfigValue): Promise<void> {
		const desktopConfig = await this._desktopConfig.promise

		if (DesktopConfigKeyValues.has(downcast(key))) {
			desktopConfig[key] = value
		} else if (DesktopConfigEncKeyValues.has(downcast(key))) {
			if (value == null) {
				desktopConfig[key] = value
			} else {
				await this._setEncryptedVar(key, value)
			}
		} else {
			throw new ProgrammingError("Unknown config key: " + key)
		}

		await this._saveAndNotify(key, value)
	}

	async _saveAndNotify(key: AllConfigKeysEnum, value: ?ConfigValue): Promise<void> {
		const desktopConfig = await this._desktopConfig.promise
		await this._desktopConfigFile.writeJSON(desktopConfig)
		this._notifyChangeListeners(key, value)
	}

	/**
	 * listen to changes in the config
	 * @param key the value you want to listen for. a key of "any" will be called with the complete config for any changes to the config.
	 * @param cb a function that's called when the config changes. argument is the new value or the entire config object in case of the "any" event.
	 * @returns {DesktopConfig}
	 */
	on(key: DesktopConfigKeyEnum | DesktopConfigEncKeyEnum, cb: (val: any) => void): DesktopConfig {
		if (!this._onValueSetListeners[key]) {
			this._onValueSetListeners[key] = [cb]
		} else {
			this._onValueSetListeners[key].push(cb)
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

	_notifyChangeListeners(key: AllConfigKeysEnum, value: ?ConfigValue) {
		if (this._onValueSetListeners[key]) {
			for (const cb of this._onValueSetListeners[key]) {
				cb(value)
			}
		}
	}
}