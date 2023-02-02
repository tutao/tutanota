import m, { Children, Vnode, VnodeDOM } from "mithril"
import { TextField, TextFieldAttrs, TextFieldType } from "../../gui/base/TextField.js"
import { Dialog } from "../../gui/base/Dialog"
import { lang } from "../../misc/LanguageViewModel"
import type { WizardPageAttrs, WizardPageN } from "../../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../gui/base/WizardDialog.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { assertMainOrNode } from "../../api/common/Env"
import { AddImapImportData, ImapImportModel } from "./AddImapImportWizard.js"
import { ToggleButton } from "../../gui/base/ToggleButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

assertMainOrNode()

export class EnterImapCredentialsPage implements WizardPageN<AddImapImportData> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddImapImportData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<AddImapImportData>>): Children {
		const imapAccountHostAttrs: TextFieldAttrs = {
			label: "imapAccountHost_label",
			value: vnode.attrs.data.model.imapAccountHost(),
			oninput: vnode.attrs.data.model.imapAccountHost,
			helpLabel: () => {
				const host = vnode.attrs.data.model.imapAccountHost()
				const errorMsg = vnode.attrs.data.model.validateImapAccountHost()

				if (errorMsg) {
					return lang.get(errorMsg)
				} else {
					return lang.get("imapAccountHost_helpLabel")
				}
			},
		}
		const imapAccountPortAttrs: TextFieldAttrs = {
			label: "imapAccountPort_label",
			value: vnode.attrs.data.model.imapAccountPort(),
			oninput: vnode.attrs.data.model.imapAccountPort,
			helpLabel: () => {
				const port = vnode.attrs.data.model.imapAccountPort()

				if (port.length > 0) {
					return ""
				} else {
					return lang.get("imapAccountPort_helpLabel")
				}
			},
		}
		const imapAccountUsernameAttrs: TextFieldAttrs = {
			label: "imapAccountUsername_label",
			value: vnode.attrs.data.model.imapAccountUsername(),
			oninput: vnode.attrs.data.model.imapAccountUsername,
		}
		const imapAccountPasswordAttrs: TextFieldAttrs = {
			label: "imapAccountPassword_label",
			value: vnode.attrs.data.model.imapAccountPassword(),
			oninput: vnode.attrs.data.model.imapAccountPassword,
			type: vnode.attrs.data.model.isImapAccountPasswordRevealed() ? TextFieldType.Text : TextFieldType.Password,
			injectionsRight: () => this.renderRevealIcon(vnode.attrs.data.model),
		}

		return m("", [
			m("h4.mt-l.text-center", lang.get("enterImapImportCredentials_title")),
			m("p.mt", lang.get("enterImapImportIntroduction_msg")),
			m("p.mt", lang.get("enterImapImportGetReady_msg")),
			m("p.mt", lang.get("enterImapImportCredentialsEncrypted_msg")),
			m(TextField, imapAccountHostAttrs),
			m(TextField, imapAccountPortAttrs),
			m(TextField, imapAccountUsernameAttrs),
			m(TextField, imapAccountPasswordAttrs),
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
						label: "next_action",
						click: () => emitWizardEvent(this.dom as HTMLElement, WizardEventType.SHOWNEXTPAGE),
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
			icon: model.isImapAccountPasswordRevealed() ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}
}

export class EnterImapCredentialsPageAttrs implements WizardPageAttrs<AddImapImportData> {
	data: AddImapImportData

	constructor(imapImportData: AddImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): string {
		return lang.get("imapImportSetup_title")
	}

	nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		const errorMsg = this.data.model.validateImapAccount()

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
