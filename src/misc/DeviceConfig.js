// @flow
import {assertMainOrNodeBoot} from "../api/Env"
import {themeId} from "../gui/theme"
import {client} from "./ClientDetector"

assertMainOrNodeBoot()

const ConfigVersion = 2
const LocalStorageKey = 'tutanotaConfig'

/**
 * Device config for internal user auto login. Only one config per device is stored.
 */
class DeviceConfig {
	_version: number;
	_credentials: Credentials[];
	_theme: ThemeId;

	/**
	 * @param config The config to copy from
	 */
	constructor() {
		this._version = ConfigVersion
		this._load()
	}

	_load(): void {
		this._credentials = []
		let loadedConfigString = client.localStorage() ? localStorage.getItem(LocalStorageKey) : null
		let loadedConfig = loadedConfigString != null ? JSON.parse(loadedConfigString) : null
		this._theme = (loadedConfig && loadedConfig._theme) ? loadedConfig._theme : 'light'
		if (loadedConfig && loadedConfig._version === ConfigVersion) {
			this._credentials = loadedConfig._credentials
		}
	}

	getStoredAddresses(): string[] {
		return this._credentials.map(c => c.mailAddress)
	}

	get(mailAddress: string): ?Credentials {
		return this._credentials.find(c => c.mailAddress === mailAddress)
	}

	set(credentials: Credentials) {
		let index = this._credentials.findIndex(c => c.mailAddress === credentials.mailAddress)
		if (index !== -1) {
			this._credentials[index] = credentials
		} else {
			this._credentials.push(credentials)
		}
		this._store()
	}

	delete(mailAddress: string) {
		this._credentials.splice(this._credentials.findIndex(c => c.mailAddress === mailAddress), 1)
		this._store()
	}

	_store() {
		try {
			localStorage.setItem(LocalStorageKey, JSON.stringify(this))
		} catch (e) {
			// may occur in Safari < 11 in incognito mode because it throws a QuotaExceededError
			console.log("could not store config", e)
		}
	}

	getAll(): Credentials[] {
		// make a copy to avoid changes from outside influencing the local array
		return JSON.parse(JSON.stringify(this._credentials));
	}

	getAllInternal(): Credentials[] {
		// make a copy to avoid changes from outside influencing the local array
		return this.getAll().filter(credential => credential.mailAddress.indexOf("@") > 0, true)
	}

	getTheme(): ThemeId {
		return this._theme
	}

	setTheme(theme: ThemeId) {
		if (this._theme !== theme) {
			this._theme = theme
			themeId(theme)
			this._store()
		}
	}

}


export const deviceConfig = new DeviceConfig()