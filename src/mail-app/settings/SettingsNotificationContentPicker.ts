import m, { Component, Vnode } from "mithril"
import { DropDownSelector, DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector.js"
import { lang } from "../../common/misc/LanguageViewModel.js"
import { ExtendedNotificationMode } from "../../common/native/common/generatedipc/ExtendedNotificationMode.js"

export interface SettingsNotificationContentPickerAttrs {
	extendedNotificationMode: ExtendedNotificationMode
	onChange: (value: ExtendedNotificationMode) => void
}

export class SettingsNotificationContentPicker implements Component<SettingsNotificationContentPickerAttrs> {
	view(vnode: Vnode<SettingsNotificationContentPickerAttrs>) {
		return m(DropDownSelector, {
			label: "notificationContent_label",
			items: [
				{
					name: lang.get("notificationPreferenceNoSenderOrSubject_action"),
					value: ExtendedNotificationMode.NoSenderOrSubject,
				},
				{
					name: lang.get("notificationPreferenceOnlySender_action"),
					value: ExtendedNotificationMode.OnlySender,
				},
				// Uncomment when subject in notifications is available
				// {
				// 	name: lang.get("notificationPreferenceSenderAndSubject_action"),
				// 	value: ExtendedNotificationMode.SenderAndSubject,
				// },
			],
			selectedValue: vnode.attrs.extendedNotificationMode,
			selectionChangedHandler: vnode.attrs.onChange,
			dropdownWidth: 250,
		} satisfies DropDownSelectorAttrs<ExtendedNotificationMode>)
	}
}
