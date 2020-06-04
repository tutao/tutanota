//@flow
import {typedValues} from "../../api/common/utils/Utils"

export const DesktopConfigKey = Object.freeze({
	heartbeatTimeoutInSeconds: 'heartbeatTimeoutInSeconds',
	defaultDownloadPath: 'defaultDownloadPath',
	enableAutoUpdate: 'enableAutoUpdate',
	showAutoUpdateOption: 'showAutoUpdateOption',
	runAsTrayApp: 'runAsTrayApp',
	lastBounds: 'lastBounds',
	pushEncSessionKeys: 'pushEncSessionKeys',
	scheduledAlarms: 'scheduledAlarms',
	lastProcessedNotificationId: 'lastProcessedNotificationId',
	lastMissedNotificationCheckTime: 'lastMissedNotificationCheckTime',
	desktopConfigVersion: "desktopConfigVersion",
	mailExportMode: "mailExportMode",
	spellcheck: "spellcheck"
})
export const DesktopConfigKeyValues: $ReadOnlySet<DesktopConfigKeyEnum> = new Set(typedValues(DesktopConfigKey))
export type DesktopConfigKeyEnum = $Values<typeof DesktopConfigKey>

export const DesktopConfigEncKey = {
	sseInfo: "sseInfo",
}
export const DesktopConfigEncKeyValues: $ReadOnlySet<DesktopConfigEncKeyEnum> = new Set(typedValues(DesktopConfigEncKey))
export type DesktopConfigEncKeyEnum = $Values<typeof DesktopConfigEncKey>

export const BuildConfigKey = Object.freeze({
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
	updateUrl: "updateUrl"
})
export type BuildConfigKeyEnum = $Values<typeof BuildConfigKey>