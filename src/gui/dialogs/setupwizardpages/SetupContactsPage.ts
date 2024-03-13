import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../base/WizardDialog.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { NativeContactsSyncManager } from "../../../contacts/model/NativeContactsSyncManager.js"
import { ContactImporter } from "../../../contacts/ContactImporter.js"
import { Dialog } from "../../base/Dialog.js"
import { MobileSystemFacade } from "../../../native/common/generatedipc/MobileSystemFacade.js"
import { renderBannerButton } from "../SetupWizard.js"

export class SetupContactsPage implements Component<SetupContactsPageAttrs> {
	view({ attrs }: Vnode<SetupContactsPageAttrs>): Children {
		const isContactSyncEnabled = attrs.syncManager.isEnabled()

		return m(SetupPageLayout, { image: "contacts" }, [
			m("p.mb-s", lang.get("importContacts_msg")),
			renderBannerButton("import_action", () => {
				attrs.contactImporter.importContactsFromDevice()
			}),
			m("p.mb-s", lang.get("allowContactSynchronization")),
			renderBannerButton(
				isContactSyncEnabled ? "activated_label" : "activate_action",
				() => {
					this.enableSync(attrs)
				},
				isContactSyncEnabled,
				"mb-l",
			),
		])
	}

	private async enableSync(attrs: SetupContactsPageAttrs) {
		attrs.syncManager.enableSync()
		const success = await attrs.syncManager.syncContacts()
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
		return true
	}
}
