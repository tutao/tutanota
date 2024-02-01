import m, { Child, Children } from "mithril"
import { assertMainOrNode, isApp } from "../api/common/Env"
import { lang } from "../misc/LanguageViewModel"

import type { DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import type { UpdatableSettingsViewer } from "./SettingsView"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { locator } from "../api/main/MainLocator.js"
import { FeatureType, OperationType } from "../api/common/TutanotaConstants.js"
import { TutanotaProperties, TutanotaPropertiesTypeRef } from "../api/entities/tutanota/TypeRefs.js"
import { deviceConfig } from "../misc/DeviceConfig.js"

assertMainOrNode()

export class ContactsSettingsViewer implements UpdatableSettingsViewer {
	private enableContactSync: boolean = false
	private noAutomaticContacts: boolean = false

	constructor() {
		this.enableContactSync = deviceConfig.getUserSyncContactsWithPhonePreference(locator.logins.getUserController().userId) ?? false
		this.noAutomaticContacts = locator.logins.getUserController().props.noAutomaticContacts
	}

	view(): Children {
		const noAutomaticContactsAttrs: DropDownSelectorAttrs<boolean> = {
			label: "createContacts_label",
			helpLabel: () => lang.get("createContactsForRecipients_action"),
			items: [
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			selectedValue: this.noAutomaticContacts,
			selectionChangedHandler: (v) => {
				locator.logins.getUserController().props.noAutomaticContacts = v
				locator.entityClient.update(locator.logins.getUserController().props)
			},
			dropdownWidth: 250,
		}

		return [
			m(
				"#user-settings.fill-absolute.scroll.plr-l.pb-xl",
				{
					role: "group",
				},
				[
					m(".h4.mt-l", lang.get("contactsManagement_label")),
					locator.logins.isEnabled(FeatureType.DisableContacts) ? null : m(DropDownSelector, noAutomaticContactsAttrs),
					this.buildContactsSyncDropdown(),
				],
			),
		]
	}

	private buildContactsSyncDropdown(): Child {
		if (!isApp()) return null

		return m(DropDownSelector, {
			label: "contactsSynchronization_label",
			helpLabel: () => lang.get("contactsSynchronizationWarning_msg"),
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this.enableContactSync,
			selectionChangedHandler: (contactSyncEnabled: boolean) => {
				const userId = locator.logins.getUserController().userId
				this.enableContactSync = contactSyncEnabled

				if (isApp()) {
					if (!contactSyncEnabled) {
						locator.nativeContactsSyncManager()?.clearContacts()
					} else {
						locator.nativeContactsSyncManager()?.syncContacts()
					}
				}

				deviceConfig.setUserSyncContactsWithPhonePreference(userId, contactSyncEnabled)
			},
			dropdownWidth: 250,
		})
	}

	updateTutaPropertiesSettings(props: TutanotaProperties) {
		this.noAutomaticContacts = props.noAutomaticContacts
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { operation } = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				const props = await locator.entityClient.load(TutanotaPropertiesTypeRef, locator.logins.getUserController().props._id)
				this.updateTutaPropertiesSettings(props)
			}
		}
		m.redraw()
	}
}
