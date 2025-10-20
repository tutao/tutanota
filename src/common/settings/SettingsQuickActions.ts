import { QuickAction } from "../misc/QuickActionBar"
import { lang } from "../misc/LanguageViewModel"
import { Router } from "../gui/ScopedRouter"
import { isApp, isBrowser, isDesktop, isOfflineStorageAvailable } from "../api/common/Env"
import { isNotNull } from "@tutao/tutanota-utils"
import { LoginController } from "../api/main/LoginController"
import { SETTINGS_PREFIX } from "../misc/RouteChange"

export async function quickSettingsActions(router: Router, logins: LoginController): Promise<readonly QuickAction[]> {
	return [
		...loginSettings(router),
		...emailSettings(router),
		...contactSettings(router),
		...appearanceSettings(router),
		...notificationSettings(router),
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("keyManagement_label")}`,
			exec: () => routeToFolder(router, "keymanagement"),
		},
		...desktopSettings(router),
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("mailExportSettings_label")}`,
			exec: () => routeToFolder(router, "mailExport"),
		},
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("mailImportSettings_label")}`,
			exec: () => routeToFolder(router, "mailImport"),
		},
		// Templates don't work yet, we don't know the ID of the template group in advance and there
		// isn't a "generic" tempaltes URL
		// {
		// 	description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("templateGroupDefaultName_label")}`,
		// 	exec: () => routeToFolder(router, "templates", "init"),
		// },
		...(logins.isGlobalAdminUserLoggedIn() ? adminSettings(router) : []),
	].filter(isNotNull)
}

function loginSettings(router: Router): readonly QuickAction[] {
	const loginSettingsLabel = `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("login_label")}`
	const folder = "login"
	return [
		{
			description: loginSettingsLabel,
			exec: () => routeToFolder(router, folder),
		},
		{
			description: `${loginSettingsLabel} ${lang.getTranslationText("loginCredentials_label")}`,
			exec: () => routeToFolderSection(router, folder, "user-settings"),
		},
		{
			description: `${loginSettingsLabel} ${lang.getTranslationText("activeSessions_label")}`,
			exec: () => routeToFolderSection(router, folder, "activesessions"),
		},
		{
			description: `${loginSettingsLabel} ${lang.getTranslationText("closedSessions_label")}`,
			exec: () => routeToFolderSection(router, folder, "closedsessions"),
		},
		{
			description: `${loginSettingsLabel} ${lang.getTranslationText("usageData_label")}`,
			exec: () => routeToFolderSection(router, folder, "usagedata"),
		},
	]
}

function emailSettings(router: Router): readonly QuickAction[] {
	const emailSettingsLabel = `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("email_label")}`
	const folder = "mail"
	return [
		{
			description: emailSettingsLabel,
			exec: () => routeToFolder(router, folder),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("storageCapacity_label")}`,
			exec: () => routeToFolderSection(router, folder, "storage"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("general_label")}`,
			exec: () => routeToFolderSection(router, folder, "general"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("conversationViewPref_label")}`,
			exec: () => routeToFolderSection(router, folder, "conversationthread"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("mailListGrouping_label")}`,
			exec: () => routeToFolderSection(router, folder, "maillistgrouping"),
		},
		isBrowser()
			? {
					description: `${emailSettingsLabel} ${lang.getTranslationText("searchMailbox_label")}`,
					exec: () => routeToFolderSection(router, folder, "mailindexing"),
				}
			: null,
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("behaviorAfterMovingEmail_label")}`,
			exec: () => routeToFolderSection(router, folder, "behavioraftermovingemail"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("emailSending_label")}`,
			exec: () => routeToFolderSection(router, folder, "emailsending"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("defaultSenderMailAddress_label")}`,
			exec: () => routeToFolderSection(router, folder, "defaultsender"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("userEmailSignature_label")}`,
			exec: () => routeToFolderSection(router, folder, "signature"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("spamReports_label")}`,
			exec: () => routeToFolderSection(router, folder, "spamreports"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("outOfOfficeNotification_title")}`,
			exec: () => routeToFolderSection(router, folder, "outofoffice"),
		},
		isOfflineStorageAvailable()
			? {
					description: `${emailSettingsLabel} ${lang.getTranslationText("localDataSection_label")}`,
					exec: () => routeToFolderSection(router, folder, "localdata"),
				}
			: null,
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("mailAddress_label")}`,
			exec: () => routeToFolderSection(router, folder, "mailaddresses"),
		},
		{
			description: `${emailSettingsLabel} ${lang.getTranslationText("inboxRulesSettings_action")}`,
			exec: () => routeToFolderSection(router, folder, "inboxrules"),
		},
	].filter(isNotNull)
}

function contactSettings(router: Router): readonly QuickAction[] {
	const contactsSettingsLabel = `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("contacts_label")}`
	const folder = "contacts"
	return [
		{
			description: `${contactsSettingsLabel} ${lang.getTranslationText("contactsManagement_label")}`,
			exec: () => routeToFolder(router, folder),
		},
		isApp()
			? {
					description: `${contactsSettingsLabel} ${lang.getTranslationText("importFromContactBook_label")}`,
					exec: () => routeToFolderSection(router, folder, "importcontacts"),
				}
			: null,
		{
			description: `${contactsSettingsLabel} ${lang.getTranslationText("createContacts_label")}`,
			exec: () => routeToFolderSection(router, folder, "createcontacts"),
		},
		isApp()
			? {
					description: `${contactsSettingsLabel} ${lang.getTranslationText("contactsSynchronization_label")}`,
					exec: () => routeToFolderSection(router, folder, "contactsync"),
				}
			: null,
	].filter(isNotNull)
}

function appearanceSettings(router: Router): readonly QuickAction[] {
	const appearanceSettingsLabel = `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("appearanceSettings_label")}`
	const folder = "appearance"

	return [
		{
			description: appearanceSettingsLabel,
			exec: () => routeToFolder(router, folder),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("settingsForDevice_label")}`,
			exec: () => routeToFolderSection(router, folder, "devicesettings"),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("language_label")}`,
			exec: () => routeToFolderSection(router, folder, "language"),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("switchColorTheme_action")}`,
			exec: () => routeToFolderSection(router, folder, "colortheme"),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("weekScrollTime_label")}`,
			exec: () => routeToFolderSection(router, folder, "weekscrolltime"),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("userSettings_label")}`,
			exec: () => routeToFolderSection(router, folder, "usersettings"),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("timeFormat_label")}`,
			exec: () => routeToFolderSection(router, folder, "hourformat"),
		},
		{
			description: `${appearanceSettingsLabel} ${lang.getTranslationText("weekStart_label")}`,
			exec: () => routeToFolderSection(router, folder, "weekstart"),
		},
	]
}

function notificationSettings(router: Router): readonly QuickAction[] {
	const notificationsSettingsLabel = `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("notificationSettings_action")}`
	const folder = "notifications"
	return [
		{
			description: `${notificationsSettingsLabel}`,
			exec: () => routeToFolder(router, folder),
		},
		isApp() || isDesktop()
			? {
					description: `${notificationsSettingsLabel} ${lang.getTranslationText("notificationContent_label")}`,
					exec: () => routeToFolderSection(router, folder, "content"),
				}
			: null,
		{
			description: `${notificationsSettingsLabel} ${lang.getTranslationText("notificationTargets_label")}`,
			exec: () => routeToFolderSection(router, folder, "targets"),
		},
		{
			description: `${notificationsSettingsLabel} ${lang.getTranslationText("emailPushNotification_action")}`,
			exec: () => routeToFolderSection(router, folder, "targets"),
		},
	].filter(isNotNull)
}

function desktopSettings(router: Router): readonly QuickAction[] {
	const desktopSettingslabel = `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("desktopSettings_label")}`
	const folder = "desktop"
	return [
		{
			description: desktopSettingslabel,
			exec: () => routeToFolder(router, folder),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("spelling_label")}`,
			exec: () => routeToFolderSection(router, folder, "spelling"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("defaultMailHandler_label")}`,
			exec: () => routeToFolderSection(router, folder, "defaultmailto"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("runInBackground_action")}`,
			exec: () => routeToFolderSection(router, folder, "background"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("runOnStartup_action")}`,
			exec: () => routeToFolderSection(router, folder, "runonstartup"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("defaultDownloadPath_label")}`,
			exec: () => routeToFolderSection(router, folder, "defaultdownloadpath"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("mailExportMode_label")}`,
			exec: () => routeToFolderSection(router, folder, "mailexportmode"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("desktopIntegration_label")}`,
			exec: () => routeToFolderSection(router, folder, "desktopintegration"),
		},
		{
			description: `${desktopSettingslabel} ${lang.getTranslationText("autoUpdate_label")}`,
			exec: () => routeToFolderSection(router, folder, "autoupdate"),
		},
	]
}

function planSettings(router: Router) {
	const folder = "subscription"
	return [
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("adminSubscription_action")}`,
			exec: () => routeToFolder(router, folder),
		},
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("giftCards_label")}`,
			exec: () => routeToFolderSection(router, folder, "giftcards"),
		},
	]
}

function adminSettings(router: Router) {
	return [
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("adminUserList_action")}`,
			exec: () => routeToFolder(router, "users"),
		},
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("sharedMailbox_label")}`,
			exec: () => routeToFolder(router, "groups"),
		},
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("globalSettings_label")}`,
			exec: () => routeToFolder(router, "global"),
		},
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("whitelabel_label")}`,
			exec: () => routeToFolder(router, "whitelabel"),
		},
		...planSettings(router),
		{
			description: `${lang.getTranslationText("settings_label")} ${lang.getTranslationText("adminPayment_action")}`,
			exec: () => routeToFolder(router, "invoice"),
		},
	]
}

function routeToFolder(router: Router, folder: string, id?: string) {
	if (id == null) {
		return router.routeTo(`${SETTINGS_PREFIX}/:folder`, { folder })
	} else {
		return router.routeTo(`${SETTINGS_PREFIX}/:folder/:id`, { folder, id })
	}
}

function routeToFolderSection(router: Router, folder: string, section: string): unknown {
	return router.routeTo(sectioned(folder, section), {})
}

function sectioned(folder: string, section: string): string {
	return `${SETTINGS_PREFIX}/${folder}#section=${section}`
}
