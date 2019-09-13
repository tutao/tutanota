//@flow
export const DesktopConfigKey = {
	any: 'any',
	heartbeatTimeoutInSeconds: 'heartbeatTimeoutInSeconds',
	defaultDownloadPath: 'defaultDownloadPath',
	enableAutoUpdate: 'enableAutoUpdate',
	showAutoUpdateOption: 'showAutoUpdateOption',
	pushIdentifier: 'pushIdentifier',
	runAsTrayApp: 'runAsTrayApp',
	lastBounds: 'lastBounds',
	pushEncSessionKeys: 'pushEncSessionKeys',
	scheduledAlarms: 'scheduledAlarms',
	lastProcessedNotificationId: 'lastProcessedNotificationId',
	lastMissedNotificationCheckTime: 'lastMissedNotificationCheckTime',
	desktopConfigVersion: "desktopConfigVersion"
}
export type DesktopConfigKeyEnum = $Values<typeof DesktopConfigKey>

export const BuildConfigKey = {
	pollingInterval: "pollingInterval",
	checkUpdateSignature: "checkUpdateSignature",
	appUserModelId: "appUserModelId",
	initialSseConnectTimeoutInSeconds: "initialSseConnectTimeoutInSeconds",
	maxSseConnectTimeoutInSeconds: "maxSseConnectTimeoutInSeconds",
	defaultDesktopConfig: "defaultDesktopConfig",
	desktophtml: "desktophtml",
	preloadjs: "preloadjs",
	iconName: "iconName",
	fileManagerTimeout: "fileManagerTimeout",
	pubKeys: "pubKeys",
}
export type BuildConfigKeyEnum = $Values<typeof BuildConfigKey>