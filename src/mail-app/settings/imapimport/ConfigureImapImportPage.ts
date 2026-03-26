import m, { Children, Vnode, VnodeDOM } from "mithril"
import { InitializeImapImportParams } from "../../../api/worker/imapimport/ImapImporter.js"
import { ImapImportState, ImportState } from "../../../api/worker/imapimport/ImapImportState.js"
import { AddImapImportData } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import { lang, MaybeTranslation, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { Button, ButtonType } from "../../../common/gui/base/Button"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { locator } from "../../workerUtils/worker/WorkerLocator"

assertMainOrNode()

const DEFAULT_IMAP_IMPORT_MAX_QUOTA = "2500000000"

export class ConfigureImapImportPage implements WizardPageN<AddImapImportData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddImapImportData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<AddImapImportData>>): Children {
		const imapImportRootFolderNameAttrs: TextFieldAttrs = {
			label: "imapImportRootMailFolderName_label",
			value: vnode.attrs.data.model.rootImportMailFolderName(),
			oninput: vnode.attrs.data.model.rootImportMailFolderName,
			helpLabel: () => lang.get("imapImportRootMailFolderName_helpLabel"),
		}

		return m("", [
			m("h4.mt-l.text-center", lang.get("configureImapImport_title")),
			m("p.mt", lang.get("configureImapImportExplanation_msg")),
			m("p.mt", lang.get("configureImapImportNote_msg")),
			m(TextField, imapImportRootFolderNameAttrs),
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
						label: "startImapImport_action",
						click: () => emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOW_NEXT_PAGE),
					}),
				),
			),
		])
	}
}

export class ConfigureImapImportPageAttrs implements WizardPageAttrs<AddImapImportData> {
	data: AddImapImportData

	constructor(imapImportData: AddImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): MaybeTranslation {
		return "imapImportSetup_title"
	}

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		const errorMsg = this.data.model.validateRootImportMailFolder()

		if (errorMsg) {
			return showErrorDialog ? Dialog.message(errorMsg).then(() => false) : Promise.resolve(false)
		} else {
			let initializeImapImportParams: InitializeImapImportParams = {
				host: this.data.model.imapAccountHost(),
				port: this.data.model.imapAccountPort(),
				username: this.data.model.imapAccountUsername(),
				password: this.data.model.imapAccountPassword(),
				accessToken: null,
				maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
				rootImportMailFolderName: this.data.model.rootImportMailFolderName(),
			}

			this.data.model.imapImportState = await initializeAndContinueImapImport(initializeImapImportParams)

			if (this.data.model.imapImportState.state === ImportState.POSTPONED) {
				let postponedErrorMsg = "imapImportStartedPostponed_msg" as TranslationKey
				return showErrorDialog ? Dialog.message(postponedErrorMsg).then(() => true) : Promise.resolve(true)
			}

			return Promise.resolve(true)
		}
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}

async function initializeAndContinueImapImport(initializeImportParams: InitializeImapImportParams): Promise<ImapImportState> {
	const imapImporter = await locator.imapImporter()
	return showProgressDialog(
		"startingImapImport_msg",
		imapImporter.initializeImport(initializeImportParams).then(() => imapImporter.continueImport()),
	)
}
