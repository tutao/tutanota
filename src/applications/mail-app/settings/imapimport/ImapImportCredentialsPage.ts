import m, { Children, Vnode } from "mithril"
import { ImapImportData } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { LegacyTextFieldType } from "../../../../ui/base/LegacyTextField"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { isMailAddress } from "@tutao/utils"

assertMainOrNode()

export class ImapImportCredentialsPage implements WizardPageN<ImapImportData> {
	shouldRevealImapAccountPassword = false
	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		return m(".mt-24", [
			m(TitleSection, {
				icon: Icons.MailFilled,
				iconOptions: { color: theme.on_surface_variant },
				subTitle: lang.getTranslationText("migrationImapCredentials_title"),
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			} as TitleSectionAttrs),
			m(".mt-16"),
			m(TextField, {
				label: "migrationAccountUsername_label",
				class: "",
				value: vnode.attrs.data.imapAccountUsername,
				oninput: (value) => (vnode.attrs.data.imapAccountUsername = value),
				leadingIcon: {
					icon: Icons.MailFilled,
					color: theme.on_surface_variant,
				},
			}),
			m(
				".flex.row.gap-16.mt-16",
				m(TextField, {
					label: "migrationImapAccountPassword_label",
					value: vnode.attrs.data.imapAccountPassword ?? "",
					oninput: (value) => (vnode.attrs.data.imapAccountPassword = value),
					type: this.shouldRevealImapAccountPassword ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
					injectionsRight: () => this.renderRevealIcon(),
					class: "",
					leadingIcon: {
						icon: Icons.GenericLockFilled,
						color: theme.on_surface_variant,
					},
					onDomInputCreated: (dom) => dom.focus(),
				}),
			),
			m(".flex.row.gap-16.mt-16", [
				m(TextField, {
					label: "migrationImapAccountHost_label",
					class: "",
					value: vnode.attrs.data.imapAccountHost,
					oninput: (value) => (vnode.attrs.data.imapAccountHost = value),
					leadingIcon: {
						icon: Icons.ServerFilled,
						color: theme.on_surface_variant,
					},
				}),
				m(TextField, {
					label: "migrationImapAccountPort_label",
					class: "",
					value: vnode.attrs.data.imapAccountPort.toString(),
					oninput: (value) => {
						const typedNumber = Number.parseInt(value)
						vnode.attrs.data.imapAccountPort = Number.isNaN(typedNumber) ? 0 : typedNumber
					},
					leadingIcon: {
						icon: Icons.KeyFilled,
						color: theme.on_surface_variant,
					},
				}),
			]),
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(PrimaryButton, {
						label: "continue_action",
						class: "wizard-next-button",
						disabled: !(
							isMailAddress(vnode.attrs.data.imapAccountUsername, true) &&
							vnode.attrs.data.imapAccountPassword &&
							vnode.attrs.data.imapAccountPassword.length > 0 &&
							vnode.attrs.data.imapAccountHost.length > 0 &&
							!Number.isNaN(vnode.attrs.data.imapAccountPort) &&
							vnode.attrs.data.imapAccountPort > 0
						),
						onclick: async (_, dom) => {
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
					}),
				),
			),
		])
	}

	private renderRevealIcon(): Children {
		return m(ToggleButton, {
			title: this.shouldRevealImapAccountPassword ? "concealPassword_action" : "revealPassword_action",
			toggled: this.shouldRevealImapAccountPassword,
			onToggled: (_, e) => {
				this.shouldRevealImapAccountPassword = !this.shouldRevealImapAccountPassword
				e.stopPropagation()
			},
			icon: this.shouldRevealImapAccountPassword ? Icons.EyeCrossedFilled : Icons.EyeFilled,
			size: ButtonSize.Compact,
		})
	}
}

export class ImapImportCredentialsPageAttrs implements WizardPageAttrs<ImapImportData> {
	data: ImapImportData

	constructor(imapImportData: ImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): TranslationKey {
		return "migrationSetup_title"
	}

	stepTitle = "migrationImapImap_title" as TranslationKey

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return !this.data.isImapServerSupportingOAuth
	}
}
