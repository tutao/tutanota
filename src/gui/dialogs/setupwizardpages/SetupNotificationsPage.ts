import m, { Children, Vnode, VnodeDOM } from "mithril"
import { WizardPageAttrs, WizardPageN } from "../../base/WizardDialog.js"
import { PermissionType } from "../../../native/common/generatedipc/PermissionType.js"
import { isAndroidApp } from "../../../api/common/Env.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { queryPermissionsState, renderNextButton, renderPermissionButton, requestPermission } from "../SetupWizard.js"
import { Icon } from "../../base/Icon.js"
import { Icons } from "../../base/icons/Icons.js"
import { locator } from "../../../api/main/MainLocator.js"
import stream from "mithril/stream"

export interface NotificationPermissionsData {
	isNotificationPermissionGranted: boolean
	isBatteryPermissionGranted: boolean
}

export class SetupNotificationsPage implements WizardPageN<stream<NotificationPermissionsData>> {
	private dom!: HTMLElement

	oncreate(vnode: VnodeDOM<WizardPageAttrs<stream<NotificationPermissionsData>>>) {
		this.dom = vnode.dom as HTMLElement
		// Redraw the page when the user resumes the app to check for changes in permissions
		locator.isAppVisible.map((isVisible) => {
			if (isVisible) {
				queryPermissionsState().then((permissionState) => {
					vnode.attrs.data(permissionState)
					m.redraw()
				})
			}
		})
	}

	view({ attrs }: Vnode<WizardPageAttrs<stream<NotificationPermissionsData>>>): Children {
		return m("section.center.pt", [
			m(Icon, {
				icon: Icons.Notifications,
				large: true,
			}),
			m("p", lang.get("allowNotifications_msg")),
			renderPermissionButton("grant_notification_permission_action", attrs.data().isNotificationPermissionGranted, async () => {
				// Ask for the notification permission
				attrs.data({
					...attrs.data(),
					isNotificationPermissionGranted: await requestPermission(PermissionType.Notification, "grant_notification_permission_action"),
				})
				m.redraw()
			}),
			isAndroidApp()
				? m("section.mt-l", [
						m("p", lang.get("allowPushNotification_msg")),
						renderPermissionButton("grant_battery_permission_action", attrs.data().isBatteryPermissionGranted, async () => {
							// Ask for permission to disable battery optimisations
							attrs.data({
								...attrs.data(),
								isBatteryPermissionGranted: await requestPermission(
									PermissionType.IgnoreBatteryOptimization,
									"grant_battery_permission_action",
								),
							})
						}),
				  ])
				: null,
			renderNextButton(this.dom),
		])
	}
}

export class SetupNotificationsPageAttrs implements WizardPageAttrs<stream<NotificationPermissionsData>> {
	preventGoBack = false
	hidePagingButtonForPage = false
	data: stream<NotificationPermissionsData>
	// Cache the permission values to avoid the page becoming disabled while on it.
	private readonly isPageVisible: boolean

	constructor(permissionData: stream<NotificationPermissionsData>) {
		this.isPageVisible = this.isPageNeeded(permissionData())
		this.data = permissionData
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
		return true
	}

	isEnabled(): boolean {
		return this.isPageVisible
	}
}
