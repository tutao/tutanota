import m, { Component, Vnode } from "mithril"
import { DropDownSelector, DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector.js"
import { lang } from "../../common/misc/LanguageViewModel.js"
import { ExtendedNotificationMode } from "../../common/native/common/generatedipc/ExtendedNotificationMode.js"
import { isApp, isDesktop } from "../../common/api/common/Env.js"
import { PermissionType } from "../../common/native/common/generatedipc/PermissionType.js"
import { locator } from "../../common/api/main/CommonLocator.js"
import { renderNotificationPermissionsDialog } from "../../common/settings/NotificationPermissionsDialog.js"

export interface NotificationContentSelectorAttrs {
	extendedNotificationMode: ExtendedNotificationMode
	onChange: (value: ExtendedNotificationMode) => void
}

export class NotificationContentSelector implements Component<NotificationContentSelectorAttrs> {
	view(vnode: Vnode<NotificationContentSelectorAttrs>) {
		return m(DropDownSelector, {
			label: "notificationContent_label",
			// Subject is not available on desktop at the moment.
			items: isDesktop()
				? [
						{
							name: lang.get("notificationPreferenceNoSenderOrSubject_action"),
							value: ExtendedNotificationMode.NoSenderOrSubject,
						},
						{
							name: lang.get("notificationPreferenceOnlySender_action"),
							value: ExtendedNotificationMode.OnlySender,
						},
				  ]
				: [
						{
							name: lang.get("notificationPreferenceNoSenderOrSubject_action"),
							value: ExtendedNotificationMode.NoSenderOrSubject,
						},
						{
							name: lang.get("notificationPreferenceOnlySender_action"),
							value: ExtendedNotificationMode.OnlySender,
						},
						{
							name: lang.get("notificationPreferenceSenderAndSubject_action"),
							value: ExtendedNotificationMode.SenderAndSubject,
						},
				  ],
			selectedValue: vnode.attrs.extendedNotificationMode,
			selectionChangedHandler: async (newValue) => {
				// Permissions only exist on mobile, so we should not check on other platforms
				if (isApp()) {
					const isNotificationPermissionGranted = await locator.systemPermissionHandler.hasPermission(PermissionType.Notification)
					if (isNotificationPermissionGranted) {
						vnode.attrs.onChange(newValue)
					} else {
						await renderNotificationPermissionsDialog(() => {
							// Switch to the targeted setting regardless of whether the permission was granted
							vnode.attrs.onChange(newValue)
						})
					}
				} else {
					vnode.attrs.onChange(newValue)
				}
			},
			dropdownWidth: 250,
		} satisfies DropDownSelectorAttrs<ExtendedNotificationMode>)
	}
}
