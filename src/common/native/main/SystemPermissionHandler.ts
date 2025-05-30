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

	/**
	 * note that the deniedMessage dialog will be shown immediately if the user denied the permission before via an OS prompt. There will not be a
	 * second permission prompt, only the option to go to settings. It is not possible to determine if the OS prompt was shown for any given
	 * invocation of this method.
	 * @param permission the permission to request
	 * @param deniedMessage if the permission was denied (now or at any point before), a dialog will be shown with this message and the option to go
	 * to the system settings.
	 *
	 * @returns true if the permission was granted from the OS prompt, false if it was not granted or the user was redirected to the settings.
	 */
	async requestPermission(permission: PermissionType, deniedMessage: TranslationKey): Promise<boolean> {
		try {
			await this.systemFacade.requestPermission(permission)
			return true
		} catch (e) {
			if (e instanceof PermissionError) {
				console.warn("Permission denied for", permission)
				if (
					// this is not just a confirm dialog to make it look less like we're asking
					// again immediately after the potential first OS prompt was denied.
					await Dialog.choice(deniedMessage, [
						{ text: "notNow_label", value: false },
						{ text: "settings_label", value: true },
					])
				) {
					this.systemFacade.goToSettings()
				}
				return false
			}
			throw e
		}
	}
}
