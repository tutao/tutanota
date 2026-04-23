import m, { Children, Vnode, VnodeDOM } from "mithril"
import { ImapImportModel } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog"
import { TextField, TextFieldAttrs, TextFieldType } from "../../../common/gui/base/TextField"
import { lang, MaybeTranslation } from "../../../common/misc/LanguageViewModel"
import { ToggleButton } from "../../../common/gui/base/buttons/ToggleButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"
import { Dialog } from "../../../common/gui/base/Dialog"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"

assertMainOrNode()

export class EnterImapCredentialsPage implements WizardPageN<ImapImportModel> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<ImapImportModel>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportModel>>): Children {
		const imapAccountHostAttrs: TextFieldAttrs = {
			label: "imapAccountHost_label",
			value: vnode.attrs.data.imapAccountHost,
			oninput: (value) => (vnode.attrs.data.imapAccountHost = value),
			helpLabel: () => {
				const host = vnode.attrs.data.imapAccountHost
				const errorMsg = vnode.attrs.data.validateImapAccountHost()

				if (errorMsg) {
					return lang.get(errorMsg)
				} else {
					return lang.get("imapAccountHost_helpLabel")
				}
			},
			disabled: vnode.attrs.data.isModifyingExistingImport,
		}
		const imapAccountPortAttrs: TextFieldAttrs = {
			label: "imapAccountPort_label",
			value: vnode.attrs.data.imapAccountPort.toString(),
			oninput: (value) => (vnode.attrs.data.imapAccountPort = Number.parseInt(value)),
			helpLabel: () => {
				const port = vnode.attrs.data.imapAccountPort

				if (port === 0) {
					return ""
				} else {
					return lang.get("imapAccountPort_helpLabel")
				}
			},
			disabled: vnode.attrs.data.isModifyingExistingImport,
		}
		const imapAccountUsernameAttrs: TextFieldAttrs = {
			label: "imapAccountUsername_label",
			value: vnode.attrs.data.imapAccountUsername,
			oninput: (value) => (vnode.attrs.data.imapAccountUsername = value),
			disabled: vnode.attrs.data.isModifyingExistingImport,
		}
		const imapAccountPasswordAttrs: TextFieldAttrs = {
			label: "imapAccountPassword_label",
			value: vnode.attrs.data.imapAccountPassword,
			oninput: (value) => (vnode.attrs.data.imapAccountPassword = value),
			type: vnode.attrs.data.isImapAccountPasswordRevealed() ? TextFieldType.Text : TextFieldType.Password,
			injectionsRight: () => this.renderRevealIcon(vnode.attrs.data),
		}

		return m("", [
			m("h4.mt-32.text-center", lang.get("enterImapImportCredentials_title")),
			m("p.mt", lang.get("enterImapImportIntroduction_msg")),
			m("p.mt", lang.get("enterImapImportGetReady_msg")),
			m("p.mt", lang.get("enterImapImportCredentialsEncrypted_msg")),
			m(TextField, imapAccountHostAttrs),
			m(TextField, imapAccountPortAttrs),
			m(TextField, imapAccountUsernameAttrs),
			m(TextField, imapAccountPasswordAttrs),
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
						label: "next_action",
						class: "wizard-next-button",
						onclick: (_, dom) => {
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
					}),
				),
			),
		])
	}

	private renderRevealIcon(model: ImapImportModel): Children {
		return m(ToggleButton, {
			title: model ? "concealPassword_action" : "revealPassword_action",
			toggled: model.isImapAccountPasswordRevealed(),
			onToggled: (_, e) => {
				model.toggleRevealImapAccountPassword()
				e.stopPropagation()
			},
			icon: model.isImapAccountPasswordRevealed() ? Icons.EyeCrossedFilled : Icons.EyeFilled,
			size: ButtonSize.Compact,
		})
	}
}

export class EnterImapCredentialsPageAttrs implements WizardPageAttrs<ImapImportModel> {
	data: ImapImportModel

	constructor(imapImportData: ImapImportModel) {
		this.data = imapImportData
	}

	headerTitle(): MaybeTranslation {
		return "imapImportSetup_title"
	}

	nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		const errorMsg = this.data.validateImapAccount()

		if (errorMsg) {
			return showErrorDialog ? Dialog.message(errorMsg).then(() => false) : Promise.resolve(false)
		} else {
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
