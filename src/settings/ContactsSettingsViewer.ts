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
import { Button, ButtonType } from "../gui/base/Button.js"
import { Dialog } from "../gui/base/Dialog.js"

assertMainOrNode()

export class ContactsSettingsViewer implements UpdatableSettingsViewer {
	private noAutomaticContacts: boolean = false

	constructor() {
		this.noAutomaticContacts = locator.logins.getUserController().props.noAutomaticContacts
	}

	view(): Children {
		return [
			m(
				".fill-absolute.scroll.plr-l.pb-xl",
				{
					role: "group",
				},
				[
					m(".h4.mt-l", lang.get("contactsManagement_label")),
					this.renderImportContactsButton(),
					locator.logins.isEnabled(FeatureType.DisableContacts) ? null : this.renderAutoCreateContactsPreference(),
					this.renderContactsSyncDropdown(),
				],
			),
		]
	}

	private renderAutoCreateContactsPreference(): Children {
		return m(DropDownSelector, {
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
		} satisfies DropDownSelectorAttrs<boolean>)
	}

	private renderImportContactsButton(): Children {
		if (!isApp()) {
			return null
		}
		return m(".flex.flex-space-between.items-center", [
			lang.get("importFromContactBook_label"),
			m(Button, {
				label: "import_action",
				click: () => this.importContactsFromDevice(),
				type: ButtonType.Primary,
			}),
		])
	}

	private renderContactsSyncDropdown(): Child {
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
			selectedValue: locator.nativeContactsSyncManager()?.isEnabled(),
			selectionChangedHandler: (contactSyncEnabled: boolean) => {
				if (isApp()) {
					if (!contactSyncEnabled) {
						locator.nativeContactsSyncManager()?.disableSync()
					} else {
						locator.nativeContactsSyncManager()?.enableSync()
						// We just enable if the synchronization started successfully
						locator
							.nativeContactsSyncManager()
							?.syncContacts()
							.then((allowed) => {
								if (!allowed) {
									this.handleContactsSynchronizationFail()
								}
							})
					}
				}
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

	private handleContactsSynchronizationFail() {
		locator.nativeContactsSyncManager()?.disableSync()
		this.showContactsPermissionDialog()
	}

	private async showContactsPermissionDialog() {
		await Dialog.message("allowContactReadWrite_msg")
		await locator.systemFacade.goToSettings()
	}

	private async importContactsFromDevice() {
		const importer = await locator.contactImporter()
		await importer.importContactsFromDeviceSafely()
	}
}
