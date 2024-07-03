import type { DeferredObject } from "@tutao/tutanota-utils"
import { defer, downcast } from "@tutao/tutanota-utils"
import type { MigrationKind } from "./migrations/DesktopConfigMigrator"
import { DesktopConfigMigrator } from "./migrations/DesktopConfigMigrator"
import type { Config } from "./ConfigCommon"
import { BuildConfigKey, DesktopConfigEncKey, DesktopConfigKey } from "./ConfigKeys"
import type { DesktopKeyStoreFacade } from "../DesktopKeyStoreFacade.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { log } from "../DesktopLog"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"
import type { ConfigFileType } from "./ConfigFile"
import { ConfigFile } from "./ConfigFile"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

export type AllConfigKeys = DesktopConfigKey | DesktopConfigEncKey

type ConfigValue = string | number | {} | boolean | ReadonlyArray<ConfigValue>
// a callback function and a note marking if it should be called more than once
type Listener = { cb: (val: ConfigValue | null) => void; once: boolean }
type OnValueSetListeners = { [k in AllConfigKeys]: Array<Listener> }

/**
 * manages build and user config
 */
export class DesktopConfig {
	private readonly buildConfig: DeferredObject<Config>
	private readonly desktopConfig: DeferredObject<Config> // user preferences as set for this installation
	private desktopConfigFile!: ConfigFileType
	onValueSetListeners: OnValueSetListeners = {} as OnValueSetListeners

	constructor(
		private readonly migrator: DesktopConfigMigrator,
		private readonly keyStoreFacade: DesktopKeyStoreFacade,
		private readonly cryptoFacade: DesktopNativeCryptoFacade,
	) {
		this.buildConfig = defer()
		this.desktopConfig = defer()
	}

	async init(buildConfigFile: ConfigFile, desktopConfigFile: ConfigFile) {
		const packageJson = await buildConfigFile.readJSON()
		const buildConfig = packageJson["tutao-config"]
		this.buildConfig.resolve(buildConfig)

		this.desktopConfigFile = desktopConfigFile

		const defaultConf = buildConfig["defaultDesktopConfig"] as Config

		// create default config if none exists
		await this.desktopConfigFile.ensurePresence(defaultConf)
		const userConf = (await this.desktopConfigFile.readJSON()) || defaultConf
		const populatedConfig = Object.assign({}, defaultConf, userConf)

		const desktopConfig = await this.migrator.applyMigrations(downcast<MigrationKind>(buildConfig["configMigrationFunction"]), populatedConfig)

		await this.desktopConfigFile.writeJSON(desktopConfig)
		this.desktopConfig.resolve(desktopConfig)
	}

	async getConst(key?: BuildConfigKey): Promise<any> {
		const config = await this.buildConfig.promise
		return key ? config[key] : config
	}

	async getVar<K extends AllConfigKeys>(key: K): Promise<any> {
		const desktopConfig = await this.desktopConfig.promise

		if (key in DesktopConfigKey) {
			return desktopConfig[key]
		} else if (key in DesktopConfigEncKey) {
			return this.getEncryptedVar(key as DesktopConfigEncKey)
		}
	}

	private async getEncryptedVar(key: DesktopConfigEncKey): Promise<any> {
		const desktopConfig = await this.desktopConfig.promise
		const encryptedValue = desktopConfig[key]

		if (!encryptedValue) {
			return null
		}

		const deviceKey = await this.keyStoreFacade.getDeviceKey()
		try {
			return this.cryptoFacade.aesDecryptObject(deviceKey, downcast<string>(encryptedValue))
		} catch (e) {
			if (e instanceof CryptoError) {
				log.error(`Could not decrypt encrypted var ${key}`, e)
				await this.setVar(key, null)
				return null
			}
		}
	}

	private async setEncryptedVar(key: DesktopConfigEncKey, value: ConfigValue | null) {
		const deviceKey = await this.keyStoreFacade.getDeviceKey()
		let encryptedValue
		if (value != null) {
			encryptedValue = this.cryptoFacade.aesEncryptObject(deviceKey, value)
		} else {
			encryptedValue = null
		}
		const desktopConfig = await this.desktopConfig.promise
		desktopConfig[key] = encryptedValue
	}

	/**
	 * change the runtime-defined config and write it to disk
	 * @param key value to change. a key of "any" will replace the conf object with value.
	 * @param value the new value
	 * @returns {never|Promise<any>|Promise<void>|*}
	 */
	async setVar(key: DesktopConfigKey | DesktopConfigEncKey, value: ConfigValue | null): Promise<void> {
		const desktopConfig = await this.desktopConfig.promise

		if (Object.values(DesktopConfigKey).includes(downcast(key))) {
			desktopConfig[key] = value
		} else if (Object.values(DesktopConfigEncKey).includes(downcast(key))) {
			if (value == null) {
				desktopConfig[key] = value
			} else {
				await this.setEncryptedVar(key as DesktopConfigEncKey, value)
			}
		} else {
			throw new ProgrammingError("Unknown config key: " + key)
		}

		await this.saveAndNotify(key, value)
	}

	private async saveAndNotify(key: AllConfigKeys, value: ConfigValue | null): Promise<void> {
		const desktopConfig = await this.desktopConfig.promise
		await this.desktopConfigFile.writeJSON(desktopConfig)
		this.notifyChangeListeners(key, value)
	}

	/**
	 * listen to changes in the config
	 * @param key the value you want to listen for. a key of "any" will be called with the complete config for any changes to the config.
	 * @param cb a function that's called when the config changes. argument is the new value or the entire config object in case of the "any" event.
	 * @returns {DesktopConfig}
	 */
	on(key: AllConfigKeys, cb: (val: any) => void): DesktopConfig {
		return this.addListener(key, { cb, once: false })
	}

	once(key: AllConfigKeys, cb: (val: any) => void): DesktopConfig {
		return this.addListener(key, { cb, once: true })
	}

	private addListener(key: AllConfigKeys, callback: Listener) {
		if (!this.onValueSetListeners[key]) {
			this.onValueSetListeners[key] = [callback]
		} else {
			this.onValueSetListeners[key].push(callback)
		}
		return this
	}

	removeAllListeners(key?: DesktopConfigKey): this {
		if (key) {
			this.onValueSetListeners[key] = []
		} else {
			this.onValueSetListeners = {} as OnValueSetListeners
		}

		return this
	}

	removeListener(key: AllConfigKeys, cb: (val: any) => void): this {
		if (!this.onValueSetListeners[key]) return this
		const indexOfListener = this.onValueSetListeners[key].findIndex((listener) => listener.cb === cb)
		this.onValueSetListeners[key].splice(indexOfListener, 1)
		return this
	}

	private notifyChangeListeners(key: AllConfigKeys, value: ConfigValue | null) {
		const listeners = this.onValueSetListeners[key]
		if (listeners == null) return
		for (const { cb } of listeners) cb(value)
		this.onValueSetListeners[key] = listeners.filter((listener) => !listener.once)
	}
}
