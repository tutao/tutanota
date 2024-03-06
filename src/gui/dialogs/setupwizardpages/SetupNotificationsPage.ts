import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../base/WizardDialog.js"
import { PermissionType } from "../../../native/common/generatedipc/PermissionType.js"
import { isAndroidApp } from "../../../api/common/Env.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { queryPermissionsState, renderPermissionButton, requestPermission } from "../SetupWizard.js"
import { OnboardingNotificationsImage } from "../../base/icons/Icons.js"
import Stream from "mithril/stream"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { locator } from "../../../api/main/MainLocator.js"

export interface NotificationPermissionsData {
	isNotificationPermissionGranted: boolean
	isBatteryPermissionGranted: boolean
}

export class SetupNotificationsPage implements Component<SetupNotificationsPageAttrs> {
	view({ attrs }: Vnode<SetupNotificationsPageAttrs>): Children {
		return m(SetupPageLayout, { image: OnboardingNotificationsImage }, [
			m("p.mt-l", lang.get("allowNotifications_msg")),
			renderPermissionButton("grant_notification_permission_action", attrs.data.isNotificationPermissionGranted, () =>
				attrs.askForNotificationPermission(),
			),
			!isAndroidApp()
				? null
				: m("section.mt.mb", [
						m("p", lang.get("allowBatteryPermission_msg")),
						renderPermissionButton("grant_battery_permission_action", attrs.data.isBatteryPermissionGranted, () =>
							attrs.askForBatteryNotificationPermission(),
						),
				  ]),
		])
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
				queryPermissionsState().then((permissionState) => {
					this.data = permissionState
					m.redraw()
				})
			}
		})
	}

	async askForNotificationPermission() {
		// Ask for the notification permission
		const isNotificationPermissionGranted = await requestPermission(PermissionType.Notification, "grant_notification_permission_action")
		this.data = {
			...this.data,
			isNotificationPermissionGranted,
		}

		// Register the push notifications if granted
		if (isNotificationPermissionGranted) {
			locator.pushService.register()
		}
		m.redraw()
	}

	async askForBatteryNotificationPermission() {
		// Ask for permission to disable battery optimisations
		this.data = {
			...this.data,
			isBatteryPermissionGranted: await requestPermission(PermissionType.IgnoreBatteryOptimization, "allowBatteryPermission_msg"),
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
