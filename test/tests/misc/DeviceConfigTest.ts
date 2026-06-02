import o, { verify } from "@tutao/otest"
import {
	DeviceConfig,
	DeviceConfigCredentials,
	ListAutoSelectBehavior,
	MailListDisplayMode,
	migrateConfigV2to3,
	migrateConfigV5to6,
} from "../../../src/applications/common/misc/DeviceConfig.js"
import { matchers, object, when } from "testdouble"

import { getDayShifted, getStartOfDay } from "../../../src/platform-kit/utils"
import { CredentialEncryptionMode } from "../../../src/platform-kit/app-env"
import { CredentialType } from "../../../src/platform-kit/network/types"
import { CalendarViewType } from "../../../src/applications/common/api/common/utils/CommonCalendarUtils"

o.spec("DeviceConfig", function () {
	o.spec("migrateConfig", function () {
		o.test("migrating from v2 to v3 preserves internal logins", function () {
			const oldConfig: any = {
				_version: 2,
				_credentials: [
					{
						mailAddress: "internal@example.com",
						userId: "internalUserId",
						accessToken: "internalAccessToken",
						encryptedPassword: "internalEncPassword",
					},
					{
						mailAddress: "externalUserId",
						userId: "externalUserId",
						accessToken: "externalAccessToken",
						encryptedPassword: "externalEncPassword",
					},
				],
			}

			migrateConfigV2to3(oldConfig)

			const expectedCredentialsAfterMigration: Record<string, Omit<DeviceConfigCredentials, "databaseKey">> = {
				internalUserId: {
					credentialInfo: {
						login: "internal@example.com",
						userId: "internalUserId",
						type: CredentialType.Internal,
					},
					accessToken: "internalAccessToken",
					encryptedPassword: "internalEncPassword",
					encryptedPassphraseKey: null,
				},
				externalUserId: {
					credentialInfo: {
						login: "externalUserId",
						userId: "externalUserId",
						type: CredentialType.External,
					},
					accessToken: "externalAccessToken",
					encryptedPassword: "externalEncPassword",
					encryptedPassphraseKey: null,
				},
			}

			o(oldConfig._credentials).deepEquals(expectedCredentialsAfterMigration)
		})

		o.test("migrating from v4 to v5 sets mailListDisplayMode to MAILS", function () {
			const oldConfig: any = {
				_version: 2,
				_credentials: [
					{
						mailAddress: "internal@example.com",
						userId: "internalUserId",
						accessToken: "internalAccessToken",
						encryptedPassword: "internalEncPassword",
					},
					{
						mailAddress: "externalUserId",
						userId: "externalUserId",
						accessToken: "externalAccessToken",
						encryptedPassword: "externalEncPassword",
					},
				],
			}

			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(oldConfig))
			o.check(new DeviceConfig(localStorageMock).getMailListDisplayMode()).equals(MailListDisplayMode.MAILS)
		})

		o.test("migrating from v5 to v6 sets offlineTimeRangeDateByUser based on days from offlineTimeRangeDaysByUser", function () {
			const user = "user"
			const days = 31
			const oldConfig: any = {
				_version: 5,
				offlineTimeRangeDaysByUser: { [user]: days },
			}

			const now = new Date("2025-03-21T12:33:40.972Z")
			const computedDate = getStartOfDay(getDayShifted(now, -days)).getTime()
			migrateConfigV5to6(oldConfig, now)
			o.check(oldConfig.offlineTimeRangeDateByUser).deepEquals({ [user]: computedDate })
		})

		o.test("migrating from v7 to v8 renames _defaultCalendarView to lastSelectedCalendarView", function () {
			const oldConfig: any = {
				_version: 7,
				_defaultCalendarView: { userId: "week" },
			}
			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(oldConfig))

			o.check(new DeviceConfig(localStorageMock)["_defaultCalendarView"]).equals(undefined)
			o.check(new DeviceConfig(localStorageMock).getLastSelectedCalendarView("userId")).equals(CalendarViewType.WEEK)
		})
	})

	o.spec("loading config", function () {
		let localStorageMock: Storage

		o.beforeEach(function () {
			localStorageMock = object<Storage>()
		})

		o("Won't write anything to localStorage when signupToken exists and the config version is the same", function () {
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(
				JSON.stringify({
					_version: DeviceConfig.Version,
					_signupToken: "somebase64value",
				}),
			)

			new DeviceConfig(localStorageMock)

			verify(localStorageMock.setItem(DeviceConfig.LocalStorageKey, matchers.anything()), { times: 0 })
		})

		o("When loading, migrations will not lose any config fields", function () {
			const storedInLocalStorage = {
				_version: 2,
				_credentials: [
					{
						mailAddress: "internal@example.com",
						userId: "internalUserId",
						accessToken: "internalAccessToken",
						encryptedPassword: "internalEncPassword",
					},
				],
				_credentialEncryptionMode: CredentialEncryptionMode.DEVICE_LOCK,
				_encryptedCredentialsKey: "somekey",
				acknowledgedNewsItems: [],
				_themeId: "mytheme",
				scheduledAlarmModelVersionPerUser: {},
				_language: "en",
				_defaultCalendarView: {},
				_hiddenCalendars: {},
				expandedMailFolders: {},
				_testDeviceId: "testId",
				_testAssignments: null,
				_signupToken: "signupToken",
				offlineTimeRangeDaysByUser: { userId1: 42 },
				conversationViewShowOnlySelectedMail: false,
				syncContactsWithPhonePreference: {},
				isCalendarDaySelectorExpanded: false,
				mailAutoSelectBehavior: ListAutoSelectBehavior.OLDER,
				isSetupComplete: true,
				lastExternalCalendarSync: {},
				events: [],
				lastRatingPromptedDate: null,
				retryRatingPromptAfter: null,
				scrollTime: 8,
				mailListDisplayMode: MailListDisplayMode.MAILS,
			}

			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(storedInLocalStorage))

			let storedJson
			when(localStorageMock.setItem(DeviceConfig.LocalStorageKey, matchers.anything())).thenDo((_, json) => {
				storedJson = json
			})

			new DeviceConfig(localStorageMock)

			const migratedConfig = {
				_credentialEncryptionMode: CredentialEncryptionMode.DEVICE_LOCK,
				_encryptedCredentialsKey: "somekey",
				acknowledgedNewsItems: [],
				_themeId: "mytheme",
				scheduledAlarmModelVersionPerUser: {},
				_language: "en",
				lastSelectedCalendarView: {}, // Renamed from _defaultCalendarView
				defaultCalendarViewSetting: {},
				_hiddenCalendars: {},
				expandedMailFolders: {},
				_testDeviceId: "testId",
				_testAssignments: null,
				_signupToken: "signupToken",
				conversationViewShowOnlySelectedMail: false,
				syncContactsWithPhonePreference: {},
				isCalendarDaySelectorExpanded: false,
				mailAutoSelectBehavior: ListAutoSelectBehavior.OLDER,
				lastExternalCalendarSync: {},
				events: [],
				lastRatingPromptedDate: null,
				retryRatingPromptAfter: null,
				scrollTime: 8,
				mailListDisplayMode: MailListDisplayMode.MAILS,
				mailListSize: {},

				_version: DeviceConfig.Version,
				_credentials: {
					internalUserId: {
						credentialInfo: {
							login: "internal@example.com",
							userId: "internalUserId",
							type: "internal",
						},
						accessToken: "internalAccessToken",
						encryptedPassword: "internalEncPassword",
						encryptedPassphraseKey: null,
					},
				},
				isSetupComplete: true,
				isCredentialsMigratedToNative: false,
				offlineTimeRangeDateByUser: { userId1: getStartOfDay(getDayShifted(new Date(), -42)).getTime() },
				installationDate: getStartOfDay(new Date()).getTime().toString(),
				isUndoSendEnabled: true,
			}

			// We can't just call verify on localStorageMock.setItem because the JSON string may not match perfectly
			o(JSON.parse(storedJson)).deepEquals(migratedConfig)
		})

		o.test("new config has MailListDisplayMode CONVERSATION", function () {
			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(null)

			o.check(new DeviceConfig(localStorageMock).getMailListDisplayMode()).equals(MailListDisplayMode.CONVERSATIONS)
		})
	})

	o.spec("getDefaultCalendarView", function () {
		o.test("returns MONTH by default", function () {
			const config = {
				_version: 8,
				lastSelectedCalendarView: {},
				defaultCalendarViewSetting: {},
			}
			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(config))

			o.check(new DeviceConfig(localStorageMock).getDefaultCalendarView("userId")).equals(CalendarViewType.MONTH)
		})
		o.test("returns user's lastSelectedCalendarView when defaultCalendarViewSetting unset", function () {
			const config = {
				_version: 8,
				lastSelectedCalendarView: { userId: CalendarViewType.WEEK },
				defaultCalendarViewSetting: {},
			}
			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(config))

			o.check(new DeviceConfig(localStorageMock).getDefaultCalendarView("userId")).equals(CalendarViewType.WEEK)
		})
		o.test("returns user's defaultCalendarViewSetting when lastSelectedCalendarView unset", function () {
			const config = {
				_version: 8,
				lastSelectedCalendarView: {},
				defaultCalendarViewSetting: { userId: CalendarViewType.WEEK },
			}
			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(config))

			o.check(new DeviceConfig(localStorageMock).getDefaultCalendarView("userId")).equals(CalendarViewType.WEEK)
		})
		o.test("user's defaultCalendarViewSetting overrides lastSelectedCalendarView when both set", function () {
			const config = {
				_version: 8,
				lastSelectedCalendarView: { userId: CalendarViewType.DAY },
				defaultCalendarViewSetting: { userId: CalendarViewType.WEEK },
			}
			const localStorageMock = object<Storage>()
			when(localStorageMock.getItem(DeviceConfig.LocalStorageKey)).thenReturn(JSON.stringify(config))

			o.check(new DeviceConfig(localStorageMock).getDefaultCalendarView("userId")).equals(CalendarViewType.WEEK)
		})
	})
})
