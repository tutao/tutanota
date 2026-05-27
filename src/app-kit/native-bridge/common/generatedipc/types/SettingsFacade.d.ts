/* generated file, don't edit. */

import { DesktopConfigKey } from "../types/DesktopConfigKey"
import { UpdateInfo } from "../types/UpdateInfo"
import { IntegrationInfo } from "../types/IntegrationInfo"

/**
 * Desktop preferences.
 */
export interface SettingsFacade {
	getStringConfigValue(name: DesktopConfigKey): Promise<string | null>

	setStringConfigValue(name: DesktopConfigKey, value: string | null): Promise<void>

	getBooleanConfigValue(name: DesktopConfigKey): Promise<boolean>

	setBooleanConfigValue(name: DesktopConfigKey, value: boolean): Promise<void>

	getUpdateInfo(): Promise<UpdateInfo | null>

	registerMailto(): Promise<void>

	unregisterMailto(): Promise<void>

	integrateDesktop(): Promise<void>

	unIntegrateDesktop(): Promise<void>

	getSpellcheckLanguages(): Promise<ReadonlyArray<string>>

	getIntegrationInfo(): Promise<IntegrationInfo>

	enableAutoLaunch(): Promise<void>

	disableAutoLaunch(): Promise<void>

	manualUpdate(): Promise<boolean>

	changeLanguage(code: string, languageTag: string): Promise<void>
}
