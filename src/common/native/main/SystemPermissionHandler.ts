import { MobileSystemFacade } from "../common/generatedipc/MobileSystemFacade.js"
import { PermissionType } from "../common/generatedipc/PermissionType.js"
import { isIOSApp } from "../../api/common/Env.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { PermissionError } from "../../api/common/error/PermissionError.js"
import { Dialog } from "../../gui/base/Dialog.js"

export class SystemPermissionHandler {
	constructor(private readonly systemFacade: MobileSystemFacade) {}

	async queryPermissionsState(permissions: PermissionType[]) {
		const permissionsStatus: Map<PermissionType, boolean> = new Map()

		for (const permission of permissions) {
			permissionsStatus.set(permission, await this.hasPermission(permission))
		}

		return permissionsStatus
	}

	async hasPermission(permission: PermissionType): Promise<boolean> {
		if (permission === PermissionType.IgnoreBatteryOptimization && isIOSApp()) {
			return true
		}

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
