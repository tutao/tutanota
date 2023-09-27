import type { Base64 } from "@tutao/tutanota-utils"
import { base64ToUint8Array, typedEntries, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import type { LanguageCode } from "./LanguageViewModel"
import type { ThemePreference } from "../gui/theme"
import type { CredentialsStorage, PersistentCredentials } from "./credentials/CredentialsProvider.js"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import type { CredentialEncryptionMode } from "./credentials/CredentialEncryptionMode"
import { assertMainOrNodeBoot } from "../api/common/Env"
import { PersistedAssignmentData, UsageTestStorage } from "./UsageTestModel"
import { client } from "./ClientDetector"
import { NewsItemStorage } from "./news/NewsModel.js"
import { CalendarViewType } from "../calendar/view/CalendarGuiUtils.js"

assertMainOrNodeBoot()
export const defaultThemePreference: ThemePreference = "auto:light|dark"

/**
 * Definition of the config object that will be saved to local storage
 */
interface ConfigObject {
	_version: number
	_credentials: Map<Id, PersistentCredentials>
	scheduledAlarmModelVersionPerUser: Record<Id, number>
	_themeId: ThemePreference
	_language: LanguageCode | null
	_defaultCalendarView: Record<Id, CalendarViewType | null>
	/** map from user id to a list of calendar grouproots*/
	_hiddenCalendars: Record<Id, Id[]>
	/** map from user id to a list of expanded folders (elementId)*/
	expandedMailFolders: Record<Id, Id[]>
	_signupToken: string
	_credentialEncryptionMode: CredentialEncryptionMode | null
	_encryptedCredentialsKey: Base64 | null
	/** list of acknowledged news item ids for this device */
	acknowledgedNewsItems: Id[]
	_testDeviceId: string | null
	_testAssignments: PersistedAssignmentData | null
	offlineTimeRangeDaysByUser: Record<Id, number>
	conversationViewShowOnlySelectedMail: boolean
	// true on old domain if it sent the credentials, true on new if it tried to receive them
	hasParticipatedInCredentialsMigration: boolean
}

/**
 * Device config for internal user auto login. Only one config per device is stored.
 */
export class DeviceConfig implements CredentialsStorage, UsageTestStorage, NewsItemStorage {
	public static Version = 4
	public static LocalStorageKey = "tutanotaConfig"

	private config!: ConfigObject

	constructor(private readonly _version: number, private readonly localStorage: Storage | null) {
		this.init()
	}

	init() {
		const loadedConfig = this.loadConfigFromLocalStorage() ?? {}

		let doSave = false
		if (loadedConfig._version != null && loadedConfig._version !== DeviceConfig.Version) {
			migrateConfig(loadedConfig)
			doSave = true
		}

		let signupToken
		if (loadedConfig._signupToken) {
			signupToken = loadedConfig._signupToken
		} else {
			let bytes = new Uint8Array(6)
			let crypto = window.crypto
			crypto.getRandomValues(bytes)
			signupToken = uint8ArrayToBase64(bytes)
			doSave = true
		}

		this.config = {
			_version: DeviceConfig.Version,
			_credentials: loadedConfig._credentials ? new Map(typedEntries(loadedConfig._credentials)) : new Map(),
			_credentialEncryptionMode: loadedConfig._credentialEncryptionMode ?? null,
			_encryptedCredentialsKey: loadedConfig._encryptedCredentialsKey ?? null,
			acknowledgedNewsItems: loadedConfig.acknowledgedNewsItems ?? [],
			_themeId: loadedConfig._themeId ?? defaultThemePreference,
			scheduledAlarmModelVersionPerUser: loadedConfig.scheduledAlarmModelVersionPerUser ?? {},
			_language: loadedConfig._language ?? null,
			_defaultCalendarView: loadedConfig._defaultCalendarView ?? {},
			_hiddenCalendars: loadedConfig._hiddenCalendars ?? {},
			expandedMailFolders: loadedConfig.expandedMailFolders ?? {},
			_testDeviceId: loadedConfig._testDeviceId ?? null,
			_testAssignments: loadedConfig._testAssignments ?? null,
			_signupToken: signupToken,
			offlineTimeRangeDaysByUser: loadedConfig.offlineTimeRangeDaysByUser ?? {},
			conversationViewShowOnlySelectedMail: loadedConfig.conversationViewShowOnlySelectedMail ?? false,
			hasParticipatedInCredentialsMigration: loadedConfig.hasParticipatedInCredentialsMigration ?? false,
		}

		// We need to write the config if there was a migration and if we generate the signup token and if.
		// We do not save the config if there was no config. The config is stored when some value changes.
		if (doSave && window.parent === window) {
			this.writeToStorage()
		}
	}

	private loadConfigFromLocalStorage(): any | null {
		if (this.localStorage == null) {
			return null
		}

		const loadedConfigString = this.localStorage.getItem(DeviceConfig.LocalStorageKey)
		if (loadedConfigString == null) {
			return null
		}

		try {
			return JSON.parse(loadedConfigString)
		} catch (e) {
			console.warn("Could not parse device config")
			return null
		}
	}

	store(persistentCredentials: PersistentCredentials): void {
		const existing = this.config._credentials.get(persistentCredentials.credentialInfo.userId)

		if (existing?.databaseKey) {
			persistentCredentials.databaseKey = existing.databaseKey
		}

		this.config._credentials.set(persistentCredentials.credentialInfo.userId, persistentCredentials)

		this.writeToStorage()
	}

	loadByUserId(userId: Id): PersistentCredentials | null {
		return this.config._credentials.get(userId) ?? null
	}

	loadAll(): Array<PersistentCredentials> {
		return Array.from(this.config._credentials.values())
	}

	deleteByUserId(userId: Id): void {
		this.config._credentials.delete(userId)

		this.writeToStorage()
	}

	getSignupToken(): string {
		return this.config._signupToken
	}

	getScheduledAlarmsModelVersion(userId: Id): number | null {
		return this.config.scheduledAlarmModelVersionPerUser[userId] ?? null
	}

	setScheduledAlarmsModelVersion(userId: Id, version: number): void {
		this.config.scheduledAlarmModelVersionPerUser[userId] = version
		this.writeToStorage()
	}

	setNoAlarmsScheduled() {
		this.config.scheduledAlarmModelVersionPerUser = {}
		this.writeToStorage()
	}

	getLanguage(): LanguageCode | null {
		return this.config._language
	}

	setLanguage(language: LanguageCode | null) {
		this.config._language = language
		this.writeToStorage()
	}

	private writeToStorage() {
		try {
			if (this.localStorage != null) {
				this.localStorage.setItem(
					DeviceConfig.LocalStorageKey,
					JSON.stringify(this.config, (key, value) => {
						if (key === "_credentials") {
							return Object.fromEntries(this.config._credentials.entries())
						} else {
							return value
						}
					}),
				)
			}
		} catch (e) {
			// may occur in Safari < 11 in incognito mode because it throws a QuotaExceededError
			// DOMException will occurr if all cookies are disabled
			console.log("could not store config", e)
		}
	}

	getTheme(): ThemePreference {
		return this.config._themeId
	}

	setTheme(theme: ThemePreference) {
		if (this.config._themeId !== theme) {
			this.config._themeId = theme

			this.writeToStorage()
		}
	}

	getDefaultCalendarView(userId: Id): CalendarViewType | null {
		return this.config._defaultCalendarView[userId]
	}

	setDefaultCalendarView(userId: Id, defaultView: CalendarViewType) {
		if (this.config._defaultCalendarView[userId] !== defaultView) {
			this.config._defaultCalendarView[userId] = defaultView

			this.writeToStorage()
		}
	}

	getHiddenCalendars(user: Id): Id[] {
		return this.config._hiddenCalendars.hasOwnProperty(user) ? this.config._hiddenCalendars[user] : []
	}

	setHiddenCalendars(user: Id, calendars: Id[]) {
		if (this.config._hiddenCalendars[user] !== calendars) {
			this.config._hiddenCalendars[user] = calendars

			this.writeToStorage()
		}
	}

	getExpandedFolders(user: Id): Id[] {
		return this.config.expandedMailFolders.hasOwnProperty(user) ? this.config.expandedMailFolders[user] : []
	}

	setExpandedFolders(user: Id, folders: Id[]) {
		if (this.config.expandedMailFolders[user] !== folders) {
			this.config.expandedMailFolders[user] = folders

			this.writeToStorage()
		}
	}

	hasAcknowledgedNewsItemForDevice(newsItemId: Id): boolean {
		return this.config.acknowledgedNewsItems.includes(newsItemId)
	}

	acknowledgeNewsItemForDevice(newsItemId: Id) {
		if (!this.config.acknowledgedNewsItems.includes(newsItemId)) {
			this.config.acknowledgedNewsItems.push(newsItemId)
			this.writeToStorage()
		}
	}

	getCredentialEncryptionMode(): CredentialEncryptionMode | null {
		return this.config._credentialEncryptionMode
	}

	setCredentialEncryptionMode(encryptionMode: CredentialEncryptionMode | null) {
		this.config._credentialEncryptionMode = encryptionMode

		this.writeToStorage()
	}

	getCredentialsEncryptionKey(): Uint8Array | null {
		return this.config._encryptedCredentialsKey ? base64ToUint8Array(this.config._encryptedCredentialsKey) : null
	}

	setCredentialsEncryptionKey(value: Uint8Array | null) {
		if (value) {
			this.config._encryptedCredentialsKey = uint8ArrayToBase64(value)
		} else {
			this.config._encryptedCredentialsKey = null
		}

		this.writeToStorage()
	}

	async getTestDeviceId(): Promise<string | null> {
		return this.config._testDeviceId
	}

	async storeTestDeviceId(testDeviceId: string): Promise<void> {
		this.config._testDeviceId = testDeviceId
		this.writeToStorage()
	}

	async getAssignments(): Promise<PersistedAssignmentData | null> {
		return this.config._testAssignments
	}

	async storeAssignments(persistedAssignmentData: PersistedAssignmentData): Promise<void> {
		this.config._testAssignments = persistedAssignmentData
		this.writeToStorage()
	}

	getOfflineTimeRangeDays(userId: Id): number | null {
		return this.config.offlineTimeRangeDaysByUser[userId]
	}

	setOfflineTimeRangeDays(userId: Id, days: number) {
		this.config.offlineTimeRangeDaysByUser[userId] = days
		this.writeToStorage()
	}

	getConversationViewShowOnlySelectedMail(): boolean {
		return this.config.conversationViewShowOnlySelectedMail
	}

	setConversationViewShowOnlySelectedMail(setting: boolean) {
		this.config.conversationViewShowOnlySelectedMail = setting
		this.writeToStorage()
	}

	getHasAttemptedCredentialsMigration(): boolean {
		return this.config.hasParticipatedInCredentialsMigration
	}

	setHasAttemptedCredentialsMigration(v: boolean): void {
		this.config.hasParticipatedInCredentialsMigration = v
		this.writeToStorage()
	}
}

export function migrateConfig(loadedConfig: any) {
	if (loadedConfig === DeviceConfig.Version) {
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
	loadedConfig._credentials = {}

	for (let credential of oldCredentialsArray) {
		let login, type
		if (credential.mailAddress.includes("@")) {
			login = credential.mailAddress
			type = "internal"
		} else {
			// in version 2 external users had userId as their email address
			// We use encryption stub in this version
			login = credential.userId
			type = "external"
		}

		loadedConfig._credentials[credential.userId] = {
			credentialInfo: {
				login,
				userId: credential.userId,
				type,
			},
			encryptedPassword: credential.encryptedPassword,
			accessToken: credential.accessToken,
		}
	}
}

export const deviceConfig: DeviceConfig = new DeviceConfig(DeviceConfig.Version, client.localStorage() && window.parent === window ? localStorage : null)
