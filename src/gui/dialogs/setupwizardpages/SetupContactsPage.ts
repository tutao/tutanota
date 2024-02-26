import m, { Children, Component, Vnode } from "mithril"
import { WizardPageAttrs } from "../../base/WizardDialog.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { SetupPageLayout } from "./SetupPageLayout.js"
import { BootIcons } from "../../base/icons/BootIcons.js"
import { BannerButton } from "../../base/buttons/BannerButton.js"
import { theme } from "../../theme.js"
import { NativeContactsSyncManager } from "../../../contacts/model/NativeContactsSyncManager.js"
import { ContactImporter } from "../../../contacts/ContactImporter.js"
import { Dialog } from "../../base/Dialog.js"
import { MobileSystemFacade } from "../../../native/common/generatedipc/MobileSystemFacade.js"

export class SetupContactsPage implements Component<SetupContactsPageAttrs> {
	view({ attrs }: Vnode<SetupContactsPageAttrs>): Children {
		return m(SetupPageLayout, { icon: BootIcons.Contacts }, [
			m("p", "Import contacts from your phone book to make them available across your devices."),
			m(BannerButton, {
				text: "import_action",
				borderColor: theme.content_accent,
				color: theme.content_accent,
				class: "b full-width mt-s",
				click: () => {
					attrs.contactImporter.importContactsFromDevice()
				},
			}),
			m("p", lang.get("contactsSynchronizationWarning_msg")),
			m(BannerButton, {
				text: attrs.syncManager.isEnabled() ? "activated_label" : "activate_action",
				borderColor: theme.content_accent,
				color: theme.content_accent,
				class: "b full-width mt-s",
				click: () => {
					this.enableSync(attrs)
				},
				disabled: attrs.syncManager.isEnabled(),
			}),
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
		return true
	}

	isEnabled(): boolean {
		return true
	}
}
