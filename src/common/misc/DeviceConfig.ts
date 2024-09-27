import { Base64, base64ToUint8Array, typedEntries, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import type { LanguageCode } from "./LanguageViewModel"
import type { ThemePreference } from "../gui/theme"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import type { CredentialEncryptionMode } from "./credentials/CredentialEncryptionMode.js"
import { assertMainOrNodeBoot, isApp } from "../api/common/Env"
import { PersistedAssignmentData, UsageTestStorage } from "./UsageTestModel"
import { client } from "./ClientDetector"
import { NewsItemStorage } from "./news/NewsModel.js"
import { CredentialsInfo } from "../native/common/generatedipc/CredentialsInfo.js"
import { CalendarViewType } from "../api/common/utils/CommonCalendarUtils.js"
import { SyncStatus } from "../calendar/import/ImportExportUtils.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"

assertMainOrNodeBoot()
export const defaultThemePreference: ThemePreference = "auto:light|dark"

export enum ListAutoSelectBehavior {
	NONE,
	OLDER,
	NEWER,
}

export type LastExternalCalendarSyncEntry = { lastSuccessfulSync: number | undefined | null; lastSyncStatus: SyncStatus }

/**
 * Definition of the config object that will be saved to local storage
 */
interface ConfigObject {
	_version: number
	_credentials: Map<Id, DeviceConfigCredentials>
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
	/** true on legacy domain if it sent the credentials, true on new if it tried to receive them */
	hasParticipatedInCredentialsMigration: boolean
	/** Stores each users' definition about contact synchronization */
	syncContactsWithPhonePreference: Record<Id, boolean>
	/** Whether mobile calendar navigation is in the "per week" or "per month" mode */
	isCalendarDaySelectorExpanded: boolean
	/** Stores user's desired behavior to the view when an email is removed from the list */
	mailAutoSelectBehavior: ListAutoSelectBehavior
	// True if the app has already been run after install
	isSetupComplete: boolean
	// True if the credentials have been migrated to native
	isCredentialsMigratedToNative: boolean
	lastExternalCalendarSync: Record<Id, LastExternalCalendarSyncEntry>
}

/**
 * Device config for internal user auto login. Only one config per device is stored.
 */
export class DeviceConfig implements UsageTestStorage, NewsItemStorage {
	public static Version = 4
	public static LocalStorageKey = "tutanotaConfig"

	private config!: ConfigObject
	private lastSyncStream: Stream<Map<Id, LastExternalCalendarSyncEntry>> = stream(new Map())

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
			syncContactsWithPhonePreference: loadedConfig.syncContactsWithPhonePreference ?? {},
			isCalendarDaySelectorExpanded: loadedConfig.isCalendarDaySelectorExpanded ?? false,
			mailAutoSelectBehavior: loadedConfig.mailAutoSelectBehavior ?? (isApp() ? ListAutoSelectBehavior.NONE : ListAutoSelectBehavior.OLDER),
			isSetupComplete: loadedConfig.isSetupComplete ?? false,
			isCredentialsMigratedToNative: loadedConfig.isCredentialsMigratedToNative ?? false,
			lastExternalCalendarSync: loadedConfig.lastExternalCalendarSync ?? {},
		}

		this.lastSyncStream(new Map(Object.entries(this.config.lastExternalCalendarSync)))

		// We need to write the config if there was a migration and if we generate the signup token and if.
		// We do not save the config if there was no config. The config is stored when some value changes.
		if (doSave) {
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

	storeCredentials(credentials: DeviceConfigCredentials) {
		this.config._credentials.set(credentials.credentialInfo.userId, credentials)

		this.writeToStorage()
	}

	getCredentialsByUserId(userId: Id): DeviceConfigCredentials | null {
		return this.config._credentials.get(userId) ?? null
	}

	getCredentials(): Array<DeviceConfigCredentials> {
		return Array.from(this.config._credentials.values())
	}

	async deleteByUserId(userId: Id): Promise<void> {
		this.config._credentials.delete(userId)

		this.writeToStorage()
	}

	async clearCredentialsData(): Promise<void> {
		this.config._credentials.clear()
		this.config._encryptedCredentialsKey = null
		this.config._credentialEncryptionMode = null

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

	getIsSetupComplete(): boolean {
		return this.config.isSetupComplete ?? false
	}

	setIsSetupComplete(value: boolean): void {
		this.config.isSetupComplete = value
		this.writeToStorage()
	}

	getIsCredentialsMigratedToNative(): boolean {
		return this.config.isCredentialsMigratedToNative ?? false
	}

	setIsCredentialsMigratedToNative(value: boolean): void {
		this.config.isCredentialsMigratedToNative = value
		this.writeToStorage()
	}

	getLastExternalCalendarSync(): Map<Id, LastExternalCalendarSyncEntry> {
		return this.lastSyncStream()
	}

	setLastExternalCalendarSync(value: Map<Id, LastExternalCalendarSyncEntry>): void {
		this.config.lastExternalCalendarSync = Object.fromEntries(value)
		this.writeToStorage()
		this.lastSyncStream(value)
	}

	updateLastSync(groupId: Id, lastSyncStatus: SyncStatus = SyncStatus.Success) {
		const lastExternalCalendarSync = this.getLastExternalCalendarSync()
		const lastSuccessfulSync = lastSyncStatus === SyncStatus.Success ? Date.now() : lastExternalCalendarSync.get(groupId)?.lastSuccessfulSync
		lastExternalCalendarSync.set(groupId, { lastSuccessfulSync, lastSyncStatus })
		this.setLastExternalCalendarSync(lastExternalCalendarSync)
	}

	getLastSyncStream() {
		return this.lastSyncStream
	}

	removeLastSync(groupId: Id) {
		const lastExternalCalendarSync = this.getLastExternalCalendarSync()
		if (lastExternalCalendarSync.delete(groupId)) this.setLastExternalCalendarSync(lastExternalCalendarSync)
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

	async getCredentialEncryptionMode(): Promise<CredentialEncryptionMode | null> {
		return this.config._credentialEncryptionMode
	}

	async getCredentialsEncryptionKey(): Promise<Uint8Array | null> {
		return this.config._encryptedCredentialsKey ? base64ToUint8Array(this.config._encryptedCredentialsKey) : null
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

	getUserSyncContactsWithPhonePreference(id: Id): boolean | null {
		return this.config.syncContactsWithPhonePreference[id] ?? null
	}

	setUserSyncContactsWithPhonePreference(user: Id, value: boolean) {
		this.config.syncContactsWithPhonePreference[user] = value
		this.writeToStorage()
	}

	isCalendarDaySelectorExpanded(): boolean {
		return this.config.isCalendarDaySelectorExpanded
	}

	setCalendarDaySelectorExpanded(expanded: boolean) {
		this.config.isCalendarDaySelectorExpanded = expanded
		this.writeToStorage()
	}

	getMailAutoSelectBehavior(): ListAutoSelectBehavior {
		return this.config.mailAutoSelectBehavior
	}

	setMailAutoSelectBehavior(action: ListAutoSelectBehavior) {
		this.config.mailAutoSelectBehavior = action
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
			encryptedPassphraseKey: null, // should not be present
		}
	}
}

/**
 * Credentials as they are stored in DeviceConfig (byte arrays replaced with strings as DeviceConfig can only deal with strings).
 * @private visibleForTesting
 */
export interface DeviceConfigCredentials {
	readonly credentialInfo: CredentialsInfo
	readonly accessToken: string
	readonly databaseKey: Base64 | null
	readonly encryptedPassword: string
	readonly encryptedPassphraseKey: Base64 | null
}

export const deviceConfig: DeviceConfig = new DeviceConfig(DeviceConfig.Version, client.localStorage() ? localStorage : null)
