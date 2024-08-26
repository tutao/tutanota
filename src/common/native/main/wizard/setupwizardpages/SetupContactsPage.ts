import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../../../gui/base/WizardDialog.js"
import { lang } from "../../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { NativeContactsSyncManager } from "../../../../../mail-app/contacts/model/NativeContactsSyncManager.js"
import { ContactImporter } from "../../../../../mail-app/contacts/ContactImporter.js"
import { Dialog } from "../../../../gui/base/Dialog.js"
import { MobileSystemFacade } from "../../../common/generatedipc/MobileSystemFacade.js"
import { renderSettingsBannerButton } from "../../../../settings/SettingsBannerButton.js"

export class SetupContactsPage implements Component<SetupContactsPageAttrs> {
	view({ attrs }: Vnode<SetupContactsPageAttrs>): Children {
		return m(SetupPageLayout, { image: "contacts" }, this.renderImportAndSyncButtons(attrs))
	}

	private renderImportAndSyncButtons(attrs: SetupContactsPageAttrs): Children {
		const isContactSyncEnabled = attrs.syncManager.isEnabled()

		return [
			m("p.mb-s", lang.get("importContacts_msg")),
			renderSettingsBannerButton("import_action", () => {
				attrs.contactImporter.importContactsFromDeviceSafely()
			}),
			m("p.mb-s", lang.get("allowContactSynchronization")),
			renderSettingsBannerButton(
				isContactSyncEnabled ? "activated_label" : "activate_action",
				() => {
					this.enableSync(attrs)
				},
				isContactSyncEnabled,
				"mb-l",
			),
		]
	}

	private async enableSync(attrs: SetupContactsPageAttrs): Promise<void> {
		const success = await attrs.syncManager.enableSync()
		if (!success) {
			await attrs.syncManager.disableSync()
			await Dialog.message("allowContactReadWrite_msg")
			await attrs.mobileSystemFacade.goToSettings()
		}
	}
}

export class SetupContactsPageAttrs implements WizardPageAttrs<null> {
	hidePagingButtonForPage = false
	data: null = null

	constructor(
		public readonly syncManager: NativeContactsSyncManager,
		public readonly contactImporter: ContactImporter,
		public readonly mobileSystemFacade: MobileSystemFacade,
		public readonly allowContactSyncAndImport: boolean,
	) {}

	headerTitle(): string {
		return lang.get("contacts_label")
	}

	nextAction(showDialogs: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return this.allowContactSyncAndImport
	}
}
