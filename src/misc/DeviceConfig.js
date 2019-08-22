// @flow
import {assertMainOrNodeBoot} from "../api/Env"
import {themeId} from "../gui/theme"
import {client} from "./ClientDetector"
import type {CalendarViewTypeEnum} from "../calendar/CalendarView"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"

assertMainOrNodeBoot()

const ConfigVersion = 2
const LocalStorageKey = 'tutanotaConfig'

/**
 * Device config for internal user auto login. Only one config per device is stored.
 */
class DeviceConfig {
	_version: number;
	_credentials: Credentials[];
	_scheduledAlarmUsers: Id[];
	_theme: ThemeId;
	_language: ?string;
	_defaultCalendarView: {[uderId: Id]: ?CalendarViewTypeEnum};
	_signupToken: string;

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
		this._scheduledAlarmUsers = loadedConfig && loadedConfig._scheduledAlarmUsers || []
		this._language = loadedConfig && loadedConfig._language
		this._defaultCalendarView = loadedConfig && loadedConfig._defaultCalendarView || {}

		let loadedSignupToken = loadedConfig && loadedConfig._signupToken
		if (loadedSignupToken) {
			this._signupToken = loadedSignupToken
		} else {
			let bytes = new Uint8Array(6);
			let crypto = window.crypto || window.msCrypto;
			crypto.getRandomValues(bytes)
			this._signupToken = uint8ArrayToBase64(bytes)
			this._store()
		}
	}

	getSignupToken(): string {
		return this._signupToken
	}

	getStoredAddresses(): string[] {
		return this._credentials.map(c => c.mailAddress)
	}

	get(mailAddress: string): ?Credentials {
		return this._credentials.find(c => c.mailAddress === mailAddress)
	}

	getByUserId(id: Id): ?Credentials {
		return this._credentials.find(c => c.userId === id)
	}

	hasScheduledAlarmsForUser(userId: Id): boolean {
		return this._scheduledAlarmUsers.includes(userId)
	}

	setAlarmsScheduledForUser(userId: Id, setScheduled: boolean) {
		const scheduledIndex = this._scheduledAlarmUsers.indexOf(userId)
		const scheduledSaved = scheduledIndex !== -1
		if (setScheduled && !scheduledSaved) {
			this._scheduledAlarmUsers.push(userId)
		} else if (!setScheduled && scheduledSaved) {
			this._scheduledAlarmUsers.splice(scheduledIndex, 1)
		}
		this._store()
	}

	setNoAlarmsScheduled() {
		this._scheduledAlarmUsers = []
		this._store()
	}

	getLanguage(): ?string {
		return this._language
	}

	setLanguage(language: ?string) {
		this._language = language
		this._store()
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

	deleteByAccessToken(accessToken: string) {
		this._credentials.splice(this._credentials.findIndex(c => c.accessToken === accessToken), 1)
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
		return this.getAll().filter(credential => credential.mailAddress.indexOf("@") > 0)
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

	getDefaultCalendarView(userId: Id): ?CalendarViewTypeEnum {
		return this._defaultCalendarView[userId]
	}

	setDefaultCalendarView(userId: Id, defaultView: CalendarViewTypeEnum) {
		if (this._defaultCalendarView[userId] !== defaultView) {
			this._defaultCalendarView[userId] = defaultView
			this._store()
		}
	}
}


export const deviceConfig: DeviceConfig = new DeviceConfig()
