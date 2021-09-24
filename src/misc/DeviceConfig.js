// @flow
import {assertMainOrNodeBoot} from "../api/common/Env"
import {client} from "./ClientDetector"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import type {LanguageCode} from "./LanguageViewModel"
import type {ThemeId} from "../gui/theme"
import type {CalendarViewTypeEnum} from "../calendar/view/CalendarViewModel"
import type {ThemeId} from "../gui/theme"
import type {CredentialsStorage} from "./credentials/CredentialsProvider"
import {typedEntries} from "../api/common/utils/Utils"
import {ProgrammingError} from "../api/common/error/ProgrammingError"

assertMainOrNodeBoot()

const ConfigVersion = 3
const LocalStorageKey = 'tutanotaConfig'

export const defaultThemeId: ThemeId = 'light'

/**
 * Device config for internal user auto login. Only one config per device is stored.
 */
export class DeviceConfig implements CredentialsStorage {
	_version: number;
	_credentials: Map<Id, Base64>;
	_scheduledAlarmUsers: Id[];
	_themeId: ThemeId;
	_language: ?LanguageCode;
	_defaultCalendarView: {[userId: Id]: ?CalendarViewTypeEnum};
	_hiddenCalendars: {[userId: Id]: Id[]}
	_signupToken: string;

	constructor() {
		this._version = ConfigVersion
		this._load()
	}

	store(userId: Id, encryptedCredentials: Base64): void {
		this._credentials.set(userId, encryptedCredentials)
		this._writeToStorage()
	}

	loadByUserId(userId: Id): [Id, Base64] | null {
		const encryptedCredentials = this._credentials.get(userId)
		return encryptedCredentials ? [userId, encryptedCredentials] : null
	}

	loadAll(): Array<[Id, Base64]> {
		return Array.from(this._credentials.entries())
	}

	deleteByUserId(userId: Id): void {
		this._credentials.delete(userId)
		this._writeToStorage()
	}

	_load(): void {
		this._credentials = new Map()
		let loadedConfigString = client.localStorage() ? localStorage.getItem(LocalStorageKey) : null
		let loadedConfig = loadedConfigString != null ? this._parseConfig(loadedConfigString) : null
		this._themeId = defaultThemeId
		if (loadedConfig) {
			if (loadedConfig._themeId) {
				this._themeId = loadedConfig._themeId
			} else if (loadedConfig._theme) {
				this._themeId = loadedConfig._theme
			}
		}
		if (loadedConfig) {
			if (loadedConfig._version !== ConfigVersion) {
				this._credentials = migrateCredentials(loadedConfig)
				this._writeToStorage()
			} else {
				this._credentials = new Map(typedEntries(loadedConfig._credentials))
			}
		}
		this._scheduledAlarmUsers = loadedConfig && loadedConfig._scheduledAlarmUsers || []
		this._language = loadedConfig && loadedConfig._language
		this._defaultCalendarView = loadedConfig && loadedConfig._defaultCalendarView || {}
		this._hiddenCalendars = loadedConfig && loadedConfig._hiddenCalendars || {}
		let loadedSignupToken = loadedConfig && loadedConfig._signupToken
		if (loadedSignupToken) {
			this._signupToken = loadedSignupToken
		} else {
			let bytes = new Uint8Array(6);
			let crypto = window.crypto || window.msCrypto;
			crypto.getRandomValues(bytes)
			this._signupToken = uint8ArrayToBase64(bytes)
			this._writeToStorage()
		}

	}

	_parseConfig(loadedConfigString: string): ?any {
		try {
			return JSON.parse(loadedConfigString)
		} catch (e) {
			console.warn("Could not parse device config")
			return null
		}
	}

	getSignupToken(): string {
		return this._signupToken
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
		this._writeToStorage()
	}

	setNoAlarmsScheduled() {
		this._scheduledAlarmUsers = []
		this._writeToStorage()
	}

	getLanguage(): ?LanguageCode {
		return this._language
	}

	setLanguage(language: ?LanguageCode) {
		this._language = language
		this._writeToStorage()
	}

	_writeToStorage() {
		try {
			localStorage.setItem(LocalStorageKey, JSON.stringify(this, (key, value) => {
				if (key === "_credentials") {
					return Object.fromEntries(this._credentials.entries())
				} else {
					return value
				}
			}))
		} catch (e) {
			// may occur in Safari < 11 in incognito mode because it throws a QuotaExceededError
			// DOMException will occurr if all cookies are disabled
			console.log("could not store config", e)
		}
	}

	getTheme(): ThemeId {
		return this._themeId
	}

	setTheme(theme: ThemeId) {
		if (this._themeId !== theme) {
			this._themeId = theme
			this._writeToStorage()
		}
	}

	getDefaultCalendarView(userId: Id): ?CalendarViewTypeEnum {
		return this._defaultCalendarView[userId]
	}

	setDefaultCalendarView(userId: Id, defaultView: CalendarViewTypeEnum) {
		if (this._defaultCalendarView[userId] !== defaultView) {
			this._defaultCalendarView[userId] = defaultView
			this._writeToStorage()
		}
	}

	getHiddenCalendars(user: Id): Id[] {
		return this._hiddenCalendars.hasOwnProperty(user) ? this._hiddenCalendars[user] : []
	}

	setHiddenCalendars(user: Id, calendars: Id[]) {
		if (this._hiddenCalendars[user] !== calendars) {
			this._hiddenCalendars[user] = calendars
			this._writeToStorage()
		}
	}
}

export function migrateCredentials(loadedConfig: any): Map<Id, Base64> {
	if (loadedConfig === ConfigVersion) {
		throw new ProgrammingError("Should not migrate credentials, current version")
	}
	if (loadedConfig._version === 2) {
		const oldCredentialsArray = loadedConfig._credentials
		const newCredentials = new Map()
		for (const oldCredential of oldCredentialsArray) {
			// in version 2 external users had userId as their email address
			if (oldCredential.mailAddress.includes("@")) {
				const newCredential: Credentials = {
					mailAddress: oldCredential.mailAddress,
					encryptedPassword: oldCredential.encryptedPassword,
					accessToken: oldCredential.accessToken,
					userId: oldCredential.userId,
					type: "internal",
				}
				newCredentials.set(newCredential.userId, JSON.stringify(newCredential))
			}
		}
		return newCredentials
	} else {
		// Don't migrate otherwise
		return new Map()
	}
}


export const deviceConfig: DeviceConfig = new DeviceConfig()
