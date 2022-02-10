import {client} from "./ClientDetector"
import type {Base64} from "@tutao/tutanota-utils"
import {base64ToUint8Array, typedEntries, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {LanguageCode} from "./LanguageViewModel"
import type {ThemeId} from "../gui/theme"
import type {CalendarViewType} from "../calendar/view/CalendarViewModel"
import type {CredentialsStorage, PersistentCredentials} from "./credentials/CredentialsProvider"
import {ProgrammingError} from "../api/common/error/ProgrammingError"
import type {CredentialEncryptionMode} from "./credentials/CredentialEncryptionMode"
import {assertMainOrNodeBoot} from "../api/common/Env"

assertMainOrNodeBoot()
const ConfigVersion = 3
const LocalStorageKey = "tutanotaConfig"
export const defaultThemeId: ThemeId = "light"

/**
 * Device config for internal user auto login. Only one config per device is stored.
 */
export class DeviceConfig implements CredentialsStorage {
	private _version: number
	private _credentials!: Map<Id, PersistentCredentials>
	private _scheduledAlarmUsers!: Id[]
	private _themeId!: ThemeId
	private _language!: LanguageCode | null
	private _defaultCalendarView!: Record<Id, CalendarViewType | null>
	private _hiddenCalendars!: Record<Id, Id[]>
	private _signupToken!: string
	private _credentialEncryptionMode!: CredentialEncryptionMode | null
	private _encryptedCredentialsKey!: Base64 | null

	constructor() {
		this._version = ConfigVersion

		this._load()
	}

	store(persistentCredentials: PersistentCredentials): void {

		const existing = this._credentials.get(persistentCredentials.credentialInfo.userId)

		if (existing?.databaseKey) {
			persistentCredentials.databaseKey = existing.databaseKey
		}

		this._credentials.set(persistentCredentials.credentialInfo.userId, persistentCredentials)

		this._writeToStorage()
	}

	loadByUserId(userId: Id): PersistentCredentials | null {
		return this._credentials.get(userId) ?? null
	}

	loadAll(): Array<PersistentCredentials> {
		return Array.from(this._credentials.values())
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
			if (loadedConfig._version !== ConfigVersion) {
				migrateConfig(loadedConfig)
			}

			if (loadedConfig._themeId) {
				this._themeId = loadedConfig._themeId
			} else if (loadedConfig._theme) {
				this._themeId = loadedConfig._theme
			}

			this._credentials = new Map(typedEntries(loadedConfig._credentials))
			this._credentialEncryptionMode = loadedConfig._credentialEncryptionMode
			this._encryptedCredentialsKey = loadedConfig._encryptedCredentialsKey

			// Write to storage, to save any migrations that may have occurred
			this._writeToStorage()
		}

		this._scheduledAlarmUsers = (loadedConfig && loadedConfig._scheduledAlarmUsers) || []
		this._language = loadedConfig && loadedConfig._language
		this._defaultCalendarView = (loadedConfig && loadedConfig._defaultCalendarView) || {}
		this._hiddenCalendars = (loadedConfig && loadedConfig._hiddenCalendars) || {}
		let loadedSignupToken = loadedConfig && loadedConfig._signupToken

		if (loadedSignupToken) {
			this._signupToken = loadedSignupToken
		} else {
			let bytes = new Uint8Array(6)
			let crypto = window.crypto
			crypto.getRandomValues(bytes)
			this._signupToken = uint8ArrayToBase64(bytes)

			this._writeToStorage()
		}
	}

	_parseConfig(loadedConfigString: string): any | null {
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

	getLanguage(): LanguageCode | null {
		return this._language
	}

	setLanguage(language: LanguageCode | null) {
		this._language = language

		this._writeToStorage()
	}

	_writeToStorage() {
		try {
			localStorage.setItem(
				LocalStorageKey,
				JSON.stringify(this, (key, value) => {
					if (key === "_credentials") {
						return Object.fromEntries(this._credentials.entries())
					} else {
						return value
					}
				}),
			)
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

	getDefaultCalendarView(userId: Id): CalendarViewType | null {
		return this._defaultCalendarView                [userId]
	}

	setDefaultCalendarView(userId: Id, defaultView: CalendarViewType) {
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

	getCredentialEncryptionMode(): CredentialEncryptionMode | null {
		return this._credentialEncryptionMode
	}

	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode | null) {
		this._credentialEncryptionMode = encryptionMode

		this._writeToStorage()
	}

	getCredentialsEncryptionKey(): Uint8Array | null {
		return this._encryptedCredentialsKey ? base64ToUint8Array(this._encryptedCredentialsKey) : null
	}

	setCredentialsEncryptionKey(value: Uint8Array | null) {
		if (value) {
			this._encryptedCredentialsKey = uint8ArrayToBase64(value)
		} else {
			this._encryptedCredentialsKey = null
		}

		this._writeToStorage()
	}
}


export function migrateConfig(loadedConfig: any) {
	if (loadedConfig === ConfigVersion) {
		throw new ProgrammingError("Should not migrate credentials, current version")
	}

	if (loadedConfig._version < 2) {
		loadedConfig._credentials = []
	}

	if (loadedConfig._version < 3) {
		migrateConfigV2to3(loadedConfig)
	}
}

/**
 * Migrate from V2 of the config to V3
 *
 * Exported for testing
 */
export function migrateConfigV2to3(loadedConfig: any) {

	const oldCredentialsArray = loadedConfig._credentials

	for (let i = 0; i < oldCredentialsArray.length; ++i) {

		const oldCredential = oldCredentialsArray[i]

		// in version 2 external users had userId as their email address
		// We use encryption stub in this version
		if (oldCredential.mailAddress.includes("@")) {
			oldCredentialsArray[i] = {
				credentialInfo: {
					login: oldCredential.mailAddress,
					userId: oldCredential.userId,
					type: "internal",
				},
				encryptedPassword: oldCredential.encryptedPassword,
				accessToken: oldCredential.accessToken,
			}
		} else {
			oldCredentialsArray[i] = {
				credentialInfo: {
					login: oldCredential.userId,
					userId: oldCredential.userId,
					type: "external",
				},
				encryptedPassword: oldCredential.encryptedPassword,
				accessToken: oldCredential.accessToken,
			}
		}
	}
}

export const deviceConfig: DeviceConfig = new DeviceConfig()