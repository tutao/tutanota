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
	/** the app pin salt for encrypting the credentials key */
	appPinSalt = "appPinSalt",
	webConfigLocation = "webConfigLocation",
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
	webAssetsPath = "webAssetsPath",
	preloadjs = "preloadjs",
	iconName = "iconName",
	fileManagerTimeout = "fileManagerTimeout",
	pubKeys = "pubKeys",
	updateUrl = "updateUrl",
}
