import m, { Child, Children } from "mithril"
import { lang } from "../../../ui/utils/LanguageViewModel"
import type { DropDownSelectorAttrs } from "../../../ui/base/DropDownSelector.js"
import { DropDownSelector } from "../../../ui/base/DropDownSelector.js"
import { locator } from "../../common/api/main/CommonLocator.js"
import { assertMainOrNode, FeatureType, isApp } from "../../../platform-kit/app-env"
import { Button, ButtonType } from "../../../ui/base/Button.js"
import { Dialog } from "../../../ui/base/Dialog.js"
import { mailLocator } from "../mailLocator.js"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { assert } from "../../../platform-kit/utils"
import { CURRENT_PRIVACY_VERSION, renderTermsAndConditionsButton, TermsSection } from "../../common/subscription/TermsAndConditions"
import { TutanotaProperties, TutanotaPropertiesTypeRef } from "@tutao/entities/tutanota"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { OperationType } from "../../../platform-kit/meta"

assertMainOrNode()

export class ContactsSettingsViewer implements UpdatableSettingsViewer {
	private noAutomaticContacts: boolean = false

	constructor() {
		this.noAutomaticContacts = locator.logins.getUserController().props.noAutomaticContacts
	}

	view(): Children {
		return [
			m(
				".fill-absolute.scroll.plr-24.pb-48",
				{
					role: "group",
				},
				[
					m(".h4.mt-32", lang.get("contactsManagement_label")),
					this.renderImportContactsButton(),
					locator.logins.isEnabled(FeatureType.DisableContacts) ? null : m("#createcontacts", this.renderAutoCreateContactsPreference()),
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
		return m("#importcontacts.flex.flex-space-between.items-center", [
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

		return m(
			"#contactsync",
			m(DropDownSelector, {
				label: "contactsSynchronization_label",
				helpLabel: () =>
					m("div", [
						lang.get("contactsSynchronizationWarning_msg"),
						m("span.mlr-4", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
					]),
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
				selectedValue: mailLocator.nativeContactsSyncManager().isEnabled(),
				selectionChangedHandler: async (contactSyncEnabled: boolean) => {
					await this.onContactSyncSelectionChanged(contactSyncEnabled)
				},
				dropdownWidth: 250,
			}),
		)
	}

	private async onContactSyncSelectionChanged(contactSyncEnabled: boolean) {
		assert(isApp(), "isApp")
		const syncManager = mailLocator.nativeContactsSyncManager()

		if (!contactSyncEnabled) {
			syncManager.disableSync()
		} else {
			const canSync = await syncManager.canSync()
			if (!canSync) {
				return
			}

			await syncManager.enableSync()
			// We just enable if the synchronization started successfully
			const isSyncAllowed = await syncManager.syncContacts()
			if (!isSyncAllowed) {
				this.handleContactsSynchronizationFail()
			}
			m.redraw()
		}
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
		mailLocator.nativeContactsSyncManager()?.disableSync()
		this.showContactsPermissionDialog()
	}

	private async showContactsPermissionDialog() {
		await Dialog.message("allowContactReadWrite_msg")
		await locator.systemFacade.goToSettings()
	}

	private async importContactsFromDevice() {
		const importer = await mailLocator.contactImporter()
		await importer.importContactsFromDeviceSafely()
	}
}
