/* generated file, don't edit. */

import { DesktopConfigKey } from "./DesktopConfigKey.js"
import { SettingsFacade } from "./SettingsFacade.js"

export class SettingsFacadeReceiveDispatcher {
	constructor(private readonly facade: SettingsFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "getStringConfigValue": {
				const name: DesktopConfigKey = arg[0]
				return this.facade.getStringConfigValue(name)
			}
			case "setStringConfigValue": {
				const name: DesktopConfigKey = arg[0]
				const value: string | null = arg[1]
				return this.facade.setStringConfigValue(name, value)
			}
			case "getBooleanConfigValue": {
				const name: DesktopConfigKey = arg[0]
				return this.facade.getBooleanConfigValue(name)
			}
			case "setBooleanConfigValue": {
				const name: DesktopConfigKey = arg[0]
				const value: boolean = arg[1]
				return this.facade.setBooleanConfigValue(name, value)
			}
			case "getUpdateInfo": {
				return this.facade.getUpdateInfo()
			}
			case "registerMailto": {
				return this.facade.registerMailto()
			}
			case "unregisterMailto": {
				return this.facade.unregisterMailto()
			}
			case "integrateDesktop": {
				return this.facade.integrateDesktop()
			}
			case "unIntegrateDesktop": {
				return this.facade.unIntegrateDesktop()
			}
			case "getSpellcheckLanguages": {
				return this.facade.getSpellcheckLanguages()
			}
			case "getIntegrationInfo": {
				return this.facade.getIntegrationInfo()
			}
			case "enableAutoLaunch": {
				return this.facade.enableAutoLaunch()
			}
			case "disableAutoLaunch": {
				return this.facade.disableAutoLaunch()
			}
			case "manualUpdate": {
				return this.facade.manualUpdate()
			}
			case "changeLanguage": {
				const code: string = arg[0]
				const languageTag: string = arg[1]
				return this.facade.changeLanguage(code, languageTag)
			}
		}
	}
}
