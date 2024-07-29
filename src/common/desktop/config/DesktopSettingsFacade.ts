import { SettingsFacade } from "../../native/common/generatedipc/SettingsFacade.js"
import { DesktopConfig } from "./DesktopConfig.js"
import { IntegrationInfo } from "../../native/common/generatedipc/IntegrationInfo.js"
import { DesktopConfigKey } from "./ConfigKeys.js"
import { DesktopUtils } from "../DesktopUtils.js"
import { DesktopIntegrator } from "../integration/DesktopIntegrator.js"
import { ElectronUpdater } from "../ElectronUpdater.js"
import * as electron from "electron"
import { UpdateInfo } from "electron-updater"
import { LanguageViewModel } from "../../misc/LanguageViewModel.js"

export class DesktopSettingsFacade implements SettingsFacade {
	constructor(
		private readonly conf: DesktopConfig,
		private readonly utils: DesktopUtils,
		private readonly integrator: DesktopIntegrator,
		private readonly updater: ElectronUpdater | null,
		private readonly lang: LanguageViewModel,
	) {}

	async changeLanguage(code: string, languageTag: string): Promise<void> {
		return this.lang.setLanguage({ code, languageTag })
	}

	async manualUpdate(): Promise<boolean> {
		return this.updater!.manualUpdate()
	}

	async enableAutoLaunch(): Promise<void> {
		return this.integrator.enableAutoLaunch()
	}

	async disableAutoLaunch(): Promise<void> {
		return this.integrator.disableAutoLaunch()
	}

	async getBooleanConfigValue(name: DesktopConfigKey): Promise<boolean> {
		return this.conf.getVar(name)
	}

	async getStringConfigValue(name: DesktopConfigKey): Promise<string | null> {
		return this.conf.getVar(name)
	}

	async setBooleanConfigValue(name: DesktopConfigKey, value: boolean): Promise<void> {
		await this.conf.setVar(name, value)
	}

	async setStringConfigValue(name: DesktopConfigKey, value: string | null): Promise<void> {
		await this.conf.setVar(name, value)
	}

	async getIntegrationInfo(): Promise<IntegrationInfo> {
		const [isAutoLaunchEnabled, isIntegrated, isUpdateAvailable] = await Promise.all([
			this.integrator.isAutoLaunchEnabled(),
			this.integrator.isIntegrated(),
			this.updater!.updateInfo != null,
		])
		return {
			isIntegrated,
			isAutoLaunchEnabled,
			isMailtoHandler: this.utils.checkIsMailtoHandler(),
			isUpdateAvailable,
		}
	}

	async getSpellcheckLanguages(): Promise<ReadonlyArray<string>> {
		return electron.session.defaultSession.availableSpellCheckerLanguages
	}

	async getUpdateInfo(): Promise<UpdateInfo | null> {
		return this.updater!.updateInfo
	}

	async integrateDesktop(): Promise<void> {
		await this.integrator.integrate()
	}

	async unIntegrateDesktop(): Promise<void> {
		await this.integrator.unintegrate()
	}

	async registerMailto(): Promise<void> {
		await this.utils.registerAsMailtoHandler()
	}

	async unregisterMailto(): Promise<void> {
		await this.utils.unregisterAsMailtoHandler()
	}
}
