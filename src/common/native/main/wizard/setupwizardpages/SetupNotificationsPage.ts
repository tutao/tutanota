import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../../../gui/base/WizardDialog.js"
import { PermissionType } from "../../../common/generatedipc/PermissionType.js"
import { isAndroidApp } from "../../../../api/common/Env.js"
import { lang } from "../../../../misc/LanguageViewModel.js"
import Stream from "mithril/stream"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { SystemPermissionHandler } from "../../SystemPermissionHandler.js"
import { NotificationPermissionsBody } from "../../../../settings/NotificationPermissionsDialog.js"

export interface NotificationPermissionsData {
	isNotificationPermissionGranted: boolean
	isBatteryPermissionGranted: boolean
}

export class SetupNotificationsPage implements Component<SetupNotificationsPageAttrs> {
	view({ attrs }: Vnode<SetupNotificationsPageAttrs>): Children {
		return m(
			SetupPageLayout,
			{ image: "notifications" },
			m(NotificationPermissionsBody, {
				isNotificationPermissionGranted: attrs.data.isNotificationPermissionGranted,
				isBatteryPermissionGranted: attrs.data.isBatteryPermissionGranted,
				askForNotificationPermission: (isGranted: boolean) => attrs.setIsNotificationPermissionGranted(isGranted),
				askForBatteryNotificationPermission: (isGranted) => attrs.setIsBatteryNotificationPermissionGranted(isGranted),
			}),
		)
	}
}

export class SetupNotificationsPageAttrs implements WizardPageAttrs<NotificationPermissionsData> {
	hidePagingButtonForPage = false
	data: NotificationPermissionsData
	// Cache the permission values to avoid the page becoming disabled while on it.
	private readonly isPageVisible: boolean

	constructor(
		permissionData: NotificationPermissionsData,
		visiblityStream: Stream<boolean>,
		private readonly systemPermissionHandler: SystemPermissionHandler,
	) {
		this.isPageVisible = this.isPageNeeded(permissionData)
		this.data = permissionData

		visiblityStream.map((isVisible) => {
			// Redraw the page when the user resumes the app to check for changes in permissions
			if (isVisible) {
				this.systemPermissionHandler
					.queryPermissionsState([PermissionType.Notification, PermissionType.IgnoreBatteryOptimization])
					.then((permissionState) => {
						this.data = {
							isNotificationPermissionGranted: permissionState.get(PermissionType.Notification) ?? false,
							isBatteryPermissionGranted: permissionState.get(PermissionType.IgnoreBatteryOptimization) ?? false,
						}
						m.redraw()
					})
			}
		})
	}

	setIsNotificationPermissionGranted(isGranted: boolean) {
		this.data = {
			...this.data,
			isNotificationPermissionGranted: isGranted,
		}
		m.redraw()
	}

	setIsBatteryNotificationPermissionGranted(isGranted: boolean) {
		this.data = {
			...this.data,
			isBatteryPermissionGranted: isGranted,
		}
		m.redraw()
	}

	private isPageNeeded(data: NotificationPermissionsData): boolean {
		// Skip this page if the needed permissions are already granted
		if (isAndroidApp()) {
			return !data.isNotificationPermissionGranted || !data.isBatteryPermissionGranted
		}
		return !data.isNotificationPermissionGranted
	}

	headerTitle(): string {
		return lang.get("notificationSettings_action")
	}

	nextAction(showDialogs: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return this.isPageVisible
	}
}
