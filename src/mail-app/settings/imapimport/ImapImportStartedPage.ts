import m, { Children, Vnode, VnodeDOM } from "mithril"
import { AddImapImportData } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "../../../common/api/common/Env.js"
import { lang, MaybeTranslation } from "../../../common/misc/LanguageViewModel.js"
import { Button, ButtonType } from "../../../common/gui/base/Button"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog"
import { locator } from "../../workerUtils/worker/WorkerLocator"

assertMainOrNode()

export class ImapImportStartedPage implements WizardPageN<AddImapImportData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddImapImportData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view({ attrs: { data } }: Vnode<WizardPageAttrs<AddImapImportData>>): Children {
		return m("", [
			m("h4.mt-l.text-center", lang.get("imapImportStarted_title")),
			m(
				"p.text-center",
				lang.get("imapImportStartedSuccess_msg", {
					"{externalImapAccountUsername}": data.model.imapAccountUsername() ?? "",
					"{rootImportMailFolderName}": data.model.rootImportMailFolderName() ?? "",
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
						type: ButtonType.Primary,
						label: "closeImapImportSetup_action",
						click: () => emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE),
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

	headerTitle(): MaybeTranslation {
		return "imapImportSetup_title"
	}

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		const importer = await locator.imapImporter()
		await importer.continueImport()
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
