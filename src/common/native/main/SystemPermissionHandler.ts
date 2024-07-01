import { MobileSystemFacade } from "../common/generatedipc/MobileSystemFacade.js"
import { PermissionType } from "../common/generatedipc/PermissionType.js"
import { isAndroidApp } from "../../api/common/Env.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { PermissionError } from "../../api/common/error/PermissionError.js"
import { Dialog } from "../../gui/base/Dialog.js"

export class SystemPermissionHandler {
	constructor(private readonly systemFacade: MobileSystemFacade) {}

	async queryPermissionsState() {
		return {
			isNotificationPermissionGranted: await this.hasPermission(PermissionType.Notification),
			isBatteryPermissionGranted: isAndroidApp() ? await this.hasPermission(PermissionType.IgnoreBatteryOptimization) : true,
		}
	}

	async hasPermission(permission: PermissionType): Promise<boolean> {
		return await this.systemFacade.hasPermission(permission)
	}

	async requestPermission(permission: PermissionType, deniedMessage: TranslationKey): Promise<boolean> {
		try {
			await this.systemFacade.requestPermission(permission)
			return true
		} catch (e) {
			if (e instanceof PermissionError) {
				console.warn("Permission denied for", permission)
				Dialog.confirm(deniedMessage).then((confirmed) => {
					if (confirmed) {
						this.systemFacade.goToSettings()
					}
				})
				return false
			}
			throw e
		}
	}
}
