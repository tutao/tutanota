import path from 'path'
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer, downcast} from "@tutao/tutanota-utils"
import type {MigrationKind} from "./migrations/DesktopConfigMigrator"
import {DesktopConfigMigrator} from "./migrations/DesktopConfigMigrator"
import fs from "fs"
import type {Config} from "./ConfigCommon"
import {BuildConfigKey, DesktopConfigEncKey, DesktopConfigKey} from "./ConfigKeys"
import type {App} from "electron"
import type {DesktopKeyStoreFacade} from "../KeyStoreFacadeImpl"
import {DesktopCryptoFacade} from "../DesktopCryptoFacade"
import {CryptoError} from "../../api/common/error/CryptoError"
import {log} from "../DesktopLog"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import type {ConfigFileType} from "./ConfigFile"
import {getConfigFile} from "./ConfigFile"

export type AllConfigKeys = DesktopConfigKey | DesktopConfigEncKey

type ConfigValue = string | number | {} | boolean | ReadonlyArray<ConfigValue>

type OnValueSetListeners = { [k in AllConfigKeys]: Array<(val: ConfigValue | null) => void> };

/**
 * manages build and user config
 */
export class DesktopConfig {
	_buildConfig: DeferredObject<Config>;
	_desktopConfig: DeferredObject<Config>; // user preferences as set for this installation
	_desktopConfigFile: ConfigFileType;
	_keyStoreFacade: DesktopKeyStoreFacade
	_cryptoFacade: DesktopCryptoFacade
	_app: App
	_migrator: DesktopConfigMigrator
	_onValueSetListeners: OnValueSetListeners

	constructor(app: App, migrator: DesktopConfigMigrator, keyStoreFacade: DesktopKeyStoreFacade, cryptFacade: DesktopCryptoFacade) {
		this._keyStoreFacade = keyStoreFacade
		this._cryptoFacade = cryptFacade
		this._app = app
		this._migrator = migrator
		this._desktopConfigFile = getConfigFile(path.join(app.getPath('userData'), 'conf.json'), fs)
		this._onValueSetListeners = {} as OnValueSetListeners
		this._buildConfig = defer()
		this._desktopConfig = defer()
	}

	async init() {
		try {
			const packageJsonFile = getConfigFile(path.join(this._app.getAppPath(), 'package.json'), fs)
			const packageJson = downcast<Record<string, unknown>>(await packageJsonFile.readJSON())
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

	async getConst(key?: BuildConfigKey): Promise<any> {
		const config = await this._buildConfig.promise
		return key ? config[key] : config
	}

	async getVar<K extends AllConfigKeys>(key: K): Promise<any> {
		const desktopConfig = await this._desktopConfig.promise

		if (key in DesktopConfigKey) {
			return desktopConfig[key]
		} else if (key in DesktopConfigEncKey) {
			return this._getEncryptedVar(key as DesktopConfigEncKey)
		}
	}

	async _getEncryptedVar(key: DesktopConfigEncKey): Promise<any> {
		const desktopConfig = await this._desktopConfig.promise
		const encryptedValue = desktopConfig[key]

		if (!encryptedValue) {
			return null
		}

		const deviceKey = await this._keyStoreFacade.getDeviceKey()
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

	async _setEncryptedVar(key: DesktopConfigEncKey, value: ConfigValue | null) {
		const deviceKey = await this._keyStoreFacade.getDeviceKey()
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
	async setVar(key: DesktopConfigKey | DesktopConfigEncKey, value: ConfigValue | null): Promise<void> {
		const desktopConfig = await this._desktopConfig.promise

		if (Object.values(DesktopConfigKey).includes(downcast(key))) {
			desktopConfig[key] = value
		} else if (Object.values(DesktopConfigEncKey).includes(downcast(key))) {
			if (value == null) {
				desktopConfig[key] = value
			} else {
				await this._setEncryptedVar(key as DesktopConfigEncKey, value)
			}
		} else {
			throw new ProgrammingError("Unknown config key: " + key)
		}

		await this._saveAndNotify(key, value)
	}

	async _saveAndNotify(key: AllConfigKeys, value: ConfigValue | null): Promise<void> {
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
	on(key: AllConfigKeys, cb: (val: any) => void): DesktopConfig {
		if (!this._onValueSetListeners[key]) {
			this._onValueSetListeners[key] = [cb]
		} else {
			this._onValueSetListeners[key].push(cb)
		}
		return this
	}

	removeAllListeners(key?: DesktopConfigKey): this {
		if (key) {
			this._onValueSetListeners[key] = []
		} else {
			this._onValueSetListeners = {} as OnValueSetListeners
		}

		return this
	}

	removeListener(key: AllConfigKeys, cb: (val: any) => void): this {
		if (!this._onValueSetListeners[key]) return this
		this._onValueSetListeners[key].splice(this._onValueSetListeners[key].indexOf(cb), 1)
		return this
	}

	_notifyChangeListeners(key: AllConfigKeys, value: ConfigValue | null) {
		if (this._onValueSetListeners[key]) {
			for (const cb of this._onValueSetListeners[key]) {
				cb(value)
			}
		}
	}
}