import m, { Children, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import type { WizardPageAttrs, WizardPageN } from "../../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../gui/base/WizardDialog.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { assertMainOrNode } from "../../api/common/Env"
import { AddImapImportData } from "./AddImapImportWizard.js"
import { locator } from "../../api/main/MainLocator.js"

assertMainOrNode()

export class ImapImportStartedPage implements WizardPageN<AddImapImportData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddImapImportData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<AddImapImportData>>): Children {
		return m("", [
			m("h4.mt-l.text-center", lang.get("imapImportStarted_title")),
			m(
				"p.text-center",
				lang.get("imapImportStartedSuccess_msg", {
					"{externalImapAccountUsername}": vnode.attrs.data.model.imapAccountUsername(),
					"{rootImportMailFolderName}": vnode.attrs.data.model.rootImportMailFolderName(),
				}),
			),
			m("p.text-center", lang.get("imapImportStartedExplanation_msg")),
			m("p.text-center", lang.get("imapImportStartedNotify_msg")),
			m(
				".flex-center.full-width.pt-l.mb-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(Button, {
						type: ButtonType.Login,
						label: "closeImapImportSetup_action",
						click: () => emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOWNEXTPAGE),
					}),
				),
			),
		])
	}
}

export class ImapImportStartedPageAttrs implements WizardPageAttrs<AddImapImportData> {
	data: AddImapImportData
	preventGoBack = true
	hidePagingButtonForPage = true

	constructor(imapImportData: AddImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): string {
		return lang.get("imapImportSetup_title")
	}

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		await locator.imapImporterFacade.continueImport()
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
