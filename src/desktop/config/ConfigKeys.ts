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
	offlineStorageEnabled = "offlineStorageEnabled",
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
	desktophtml = "desktophtml",
	preloadjs = "preloadjs",
	iconName = "iconName",
	fileManagerTimeout = "fileManagerTimeout",
	pubKeys = "pubKeys",
	updateUrl = "updateUrl",
}