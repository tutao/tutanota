import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../../../ui/base/WizardDialog.js"
import { PermissionType } from "../../../../native-bridge/common/generatedipc/types"
import { type TranslationKey } from "../../../../ui/utils/LanguageViewModel.js"
import Stream from "mithril/stream"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { SystemPermissionHandler } from "../../SystemPermissionHandler.js"
import { NotificationPermissionsBody } from "../../../settings/NotificationPermissionsDialog.js"
import { isAndroidApp } from "@tutao/app-env"
import { NativePushServiceApp } from "../../NativePushServiceApp"

export interface NotificationPermissionsData {
	isNotificationPermissionGranted: boolean
	isBatteryPermissionGranted: boolean
	systemPermissionHandler: SystemPermissionHandler
	pushService: NativePushServiceApp | null
}

export class SetupNotificationsPage implements Component<SetupNotificationsPageAttrs> {
	view({ attrs }: Vnode<SetupNotificationsPageAttrs>): Children {
		return m(
			SetupPageLayout,
			{ image: "images/dynamic-color-svg/notifications.svg" },
			m(NotificationPermissionsBody, {
				isNotificationPermissionGranted: attrs.data.isNotificationPermissionGranted,
				isBatteryPermissionGranted: attrs.data.isBatteryPermissionGranted,
				askForNotificationPermission: (isGranted: boolean) => attrs.setIsNotificationPermissionGranted(isGranted),
				askForBatteryNotificationPermission: (isGranted) => attrs.setIsBatteryNotificationPermissionGranted(isGranted),
				pushService: attrs.data.pushService,
				systemPermissionHandler: attrs.data.systemPermissionHandler,
			}),
		)
	}
}

export class SetupNotificationsPageAttrs implements WizardPageAttrs<NotificationPermissionsData> {
	hidePagingButtonForPage = false
	data: NotificationPermissionsData
	// Cache the permission values to avoid the page becoming disabled while on it.
	private readonly isPageVisible: boolean

	constructor(permissionData: NotificationPermissionsData, visiblityStream: Stream<boolean>) {
		this.isPageVisible = this.isPageNeeded(permissionData)
		this.data = permissionData

		visiblityStream.map((isVisible) => {
			// Redraw the page when the user resumes the app to check for changes in permissions
			if (isVisible) {
				this.data.systemPermissionHandler
					.queryPermissionsState([PermissionType.Notification, PermissionType.IgnoreBatteryOptimization])
					.then((permissionState) => {
						this.data = {
							isNotificationPermissionGranted: permissionState.get(PermissionType.Notification) ?? false,
							isBatteryPermissionGranted: permissionState.get(PermissionType.IgnoreBatteryOptimization) ?? false,
							systemPermissionHandler: this.data.systemPermissionHandler,
							pushService: this.data.pushService,
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

	headerTitle(): TranslationKey {
		return "notificationSettings_action"
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
