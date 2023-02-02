import m, { Children, Vnode, VnodeDOM } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { lang, MaybeTranslation } from "../../../common/misc/LanguageViewModel.js"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"
import { ImapImportModel } from "./AddImapImportWizard"
import { ImapImporter } from "../../workerUtils/imapimport/ImapImporter"

assertMainOrNode()

export class ImapImportStartedPage implements WizardPageN<ImapImportModel> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<ImapImportModel>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view({ attrs: { data } }: Vnode<WizardPageAttrs<ImapImportModel>>): Children {
		return m("", [
			m("h4.mt-32.text-center", lang.get("imapImportStarted_title")),
			m(
				"p.text-center",
				lang.get("imapImportStartedSuccess_msg", {
					"{externalImapAccountUsername}": data.imapAccountUsername ?? "",
					"{rootImportMailFolderName}": data.rootImportMailFolderName ?? "",
				}),
			),
			m("p.text-center", lang.get("imapImportStartedExplanation_msg")),
			m("p.text-center", lang.get("imapImportStartedNotify_msg")),
			m(
				".flex-center.full-width.pt-32.mb-32",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "closeImapImportSetup_action",
						class: "wizard-next-button",
						onclick: (_, dom) => {
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
					}),
				),
			),
		])
	}
}

export class ImapImportStartedPageAttrs implements WizardPageAttrs<ImapImportModel> {
	data: ImapImportModel
	preventGoBack = true
	hidePagingButtonForPage = true

	constructor(
		private readonly imapImporter: ImapImporter,
		imapImportData: ImapImportModel,
	) {
		this.data = imapImportData
	}

	headerTitle(): MaybeTranslation {
		return "imapImportSetup_title"
	}

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		await this.imapImporter.continueImport()
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
