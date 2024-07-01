// @bundleInto:common

export enum DesktopConfigKey {
	heartbeatTimeoutInSeconds = "heartbeatTimeoutInSeconds",
	defaultDownloadPath = "defaultDownloadPath",
	enableAutoUpdate = "enableAutoUpdate",
	showAutoUpdateOption = "showAutoUpdateOption",
	runAsTrayApp = "runAsTrayApp",
	lastBounds = "lastBounds",
	pushEncSessionKeys = "pushEncSessionKeys",
	scheduledAlarms = "scheduledAlarms",
	lastProcessedNotificationId = "lastProcessedNotificationId",
	lastMissedNotificationCheckTime = "lastMissedNotificationCheckTime",
	desktopConfigVersion = "desktopConfigVersion",
	mailExportMode = "mailExportMode",
	spellcheck = "spellcheck",
	selectedTheme = "selectedTheme",
	themes = "themes",
	/** the app password salt for encrypting the credentials key */
	appPassSalt = "appPassSalt",
	webConfigLocation = "webConfigLocation",
	extendedNotificationMode = "extendedNotificationMode",
}

export enum DesktopConfigEncKey {
	sseInfo = "sseInfo",
}

export enum BuildConfigKey {
	pollingInterval = "pollingInterval",
	checkUpdateSignature = "checkUpdateSignature",
	appUserModelId = "appUserModelId",
	initialSseConnectTimeoutInSeconds = "initialSseConnectTimeoutInSeconds",
	maxSseConnectTimeoutInSeconds = "maxSseConnectTimeoutInSeconds",
	defaultDesktopConfig = "defaultDesktopConfig",
	iconName = "iconName",
	fileManagerTimeout = "fileManagerTimeout",
	pubKeys = "pubKeys",
	updateUrl = "updateUrl",
}
