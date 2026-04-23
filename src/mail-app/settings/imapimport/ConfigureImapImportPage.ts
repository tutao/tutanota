import m, { Children, Vnode, VnodeDOM } from "mithril"
import { ImapImporter, InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter.js"
import { assertMainOrNode } from "@tutao/app-env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import { lang, MaybeTranslation, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"
import { ImapImportState, ImportState } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { Switch, SwitchAttrs } from "../../../common/gui/base/Switch"
import { ImapImportModel } from "./AddImapImportWizard"

assertMainOrNode()

const DEFAULT_IMAP_IMPORT_MAX_QUOTA = "2500000000"

export class ConfigureImapImportPage implements WizardPageN<ImapImportModel> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<ImapImportModel>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportModel>>): Children {
		const imapImportRootFolderNameAttrs: TextFieldAttrs = {
			label: "imapImportRootMailFolderName_label",
			value: vnode.attrs.data.rootImportMailFolderName,
			oninput: (value) => (vnode.attrs.data.rootImportMailFolderName = value),
			helpLabel: () => lang.get("imapImportRootMailFolderName_helpLabel"),
			disabled: vnode.attrs.data.isModifyingExistingImport,
		}

		const matchImportFoldersToTutanotaFoldersAttrs: SwitchAttrs = {
			ariaLabel: "matchImportFoldersToTutanotaFolders_label",
			checked: false,
			onclick(checked: boolean) {
				vnode.attrs.data.matchImportFoldersToTutanotaFolders = checked
			},
			disabled: vnode.attrs.data.isModifyingExistingImport,
		}

		return m("", [
			m("h4.mt-32.text-center", lang.get("configureImapImport_title")),
			m("p.mt", lang.get("configureImapImportExplanation_msg")),
			m("p.mt", lang.get("configureImapImportNote_msg")),
			m(TextField, imapImportRootFolderNameAttrs),
			m(Switch, matchImportFoldersToTutanotaFoldersAttrs),
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
						label: "startImapImport_action",
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

export class ConfigureImapImportPageAttrs implements WizardPageAttrs<ImapImportModel> {
	data: ImapImportModel

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
		const errorMsg = this.data.validateRootImportMailFolder()

		if (errorMsg) {
			return showErrorDialog ? Dialog.message(errorMsg).then(() => false) : Promise.resolve(false)
		} else {
			let initializeImapImportParams: InitializeImapImportParams = {
				host: this.data.imapAccountHost,
				port: this.data.imapAccountPort,
				username: this.data.imapAccountUsername,
				password: this.data.imapAccountPassword,
				accessToken: null,
				maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
				rootImportMailFolderName: this.data.rootImportMailFolderName,
				matchImportFoldersToTutanotaFolders: this.data.matchImportFoldersToTutanotaFolders,
				isModifyingExistingImport: this.data.isModifyingExistingImport,
			}

			this.data.imapImportState = await initializeAndContinueImapImport(this.imapImporter, initializeImapImportParams)

			if (this.data.imapImportState.state === ImportState.POSTPONED) {
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

async function initializeAndContinueImapImport(imapImporter: ImapImporter, initializeImportParams: InitializeImapImportParams): Promise<ImapImportState> {
	return await showProgressDialog(
		"startingImapImport_msg",
		imapImporter.initializeImport(initializeImportParams).then(() => imapImporter.continueImport()),
	)
}
