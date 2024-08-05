import m, { Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { isAndroidApp } from "../api/common/Env.js"
import { Dialog } from "../gui/base/Dialog.js"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../gui/base/Button.js"
import { ClickHandler } from "../gui/base/GuiUtils.js"
import { PermissionType } from "../native/common/generatedipc/PermissionType.js"
import { locator } from "../api/main/CommonLocator.js"
import { renderSettingsBannerButton } from "./SettingsBannerButton.js"

function renderPermissionButton(permissionName: TranslationKey, isPermissionGranted: boolean, onclick: ClickHandler) {
	return renderSettingsBannerButton(isPermissionGranted ? "granted_msg" : permissionName, onclick, isPermissionGranted)
}

/// Shows a dialog that allows the user to set the notification and battery permissions on mobile.
/// It shows the same screen as the notifications page in the onboarding wizard
export async function renderNotificationPermissionsDialog(onClose: () => void) {
	let isNotificationPermissionGranted = await locator.systemPermissionHandler.hasPermission(PermissionType.Notification)
	let isBatteryPermissionGranted = await locator.systemPermissionHandler.hasPermission(PermissionType.IgnoreBatteryOptimization)

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "close_alt",
				click: () => dialog.close(),
				type: ButtonType.Secondary,
			},
		],
		middle: () => lang.get("permissions_label"),
		remove: () => onClose(),
	}
	const dialog = Dialog.editSmallDialog(headerBarAttrs, () =>
		m(NotificationPermissionsBody, {
			isNotificationPermissionGranted,
			isBatteryPermissionGranted,
			askForNotificationPermission: (isGranted) => {
				isNotificationPermissionGranted = isGranted
				m.redraw()
			},
			askForBatteryNotificationPermission: async (isGranted) => {
				isBatteryPermissionGranted = isGranted
				m.redraw()
			},
		}),
	)
	dialog.show()
}

export interface NotificationPermissionsBodyAttrs {
	isNotificationPermissionGranted: boolean
	isBatteryPermissionGranted: boolean
	askForNotificationPermission: (isGranted: boolean) => void
	askForBatteryNotificationPermission: (isGranted: boolean) => void
}

/// Displays buttons to grant the notification and battery permissions with explaining paragraphs
export class NotificationPermissionsBody implements Component<NotificationPermissionsBodyAttrs> {
	view({ attrs }: Vnode<NotificationPermissionsBodyAttrs>) {
		return [
			m("p.mb-s", lang.get("allowNotifications_msg")),
			renderPermissionButton("grant_notification_permission_action", attrs.isNotificationPermissionGranted, async () => {
				// Ask for the notification permission
				const isNotificationPermissionGranted = await locator.systemPermissionHandler.requestPermission(
					PermissionType.Notification,
					"grant_notification_permission_action",
				)
				// Register the push notifications if granted
				if (isNotificationPermissionGranted) {
					locator.pushService.register()
				}
				attrs.askForNotificationPermission(isNotificationPermissionGranted)
			}),
			!isAndroidApp()
				? null
				: m("section.mt-s.mb", [
						m("p.mb-s.mt-s", lang.get("allowBatteryPermission_msg")),
						renderPermissionButton("grant_battery_permission_action", attrs.isBatteryPermissionGranted, async () => {
							// Ask for permission to disable battery optimisations
							const isBatteryPermissionGranted = await locator.systemPermissionHandler.requestPermission(
								PermissionType.IgnoreBatteryOptimization,
								"allowBatteryPermission_msg",
							)
							attrs.askForBatteryNotificationPermission(isBatteryPermissionGranted)
						}),
				  ]),
		]
	}
}
