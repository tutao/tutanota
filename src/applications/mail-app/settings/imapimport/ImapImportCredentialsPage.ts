import m, { Children, Vnode, VnodeDOM } from "mithril"
import { ImapImportData } from "./AddImapImportWizard.js"
import { assertMainOrNode, ProgrammingError } from "@tutao/app-env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection.js"
import { GmailLogo, Icons, OutlookLogo } from "../../../../ui/base/icons/Icons.js"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { LegacyTextFieldType } from "../../../../ui/base/LegacyTextField"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { mailLocator } from "../../mailLocator"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { OAuthHandler } from "./oauth/OAuthHandler"
import { isMailAddress } from "@tutao/utils"

assertMainOrNode()

export class ImapImportCredentialsPage implements WizardPageN<ImapImportData> {
	private shouldDisplayServerConfigFields: boolean = false
	private shouldDisableNextButton: boolean = false
	private titleSectionParams: Partial<TitleSectionAttrs> = {
		icon: Icons.MailFilled,
		iconOptions: { color: theme.on_surface_variant },
		subTitle: lang.getTranslationText("imapSyncCredentialsInfo_msg"),
	}
	oncreate(vnode: VnodeDOM<WizardPageAttrs<ImapImportData>>) {
		const provider = vnode.attrs.data.imapProvider
		switch (provider) {
			case ImapProvider.Google:
				this.titleSectionParams.icon = undefined
				this.titleSectionParams.iconOptions = undefined
				this.titleSectionParams.customIcon = m.trust(GmailLogo)
				break
			case ImapProvider.Microsoft:
				this.titleSectionParams.icon = undefined
				this.titleSectionParams.iconOptions = undefined
				this.titleSectionParams.customIcon = m.trust(OutlookLogo)
				break
		}
		this.shouldDisplayServerConfigFields = !vnode.attrs.data.isImapServerSupportingOAuth
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		return m(".mt-24", [
			m(TitleSection, {
				...this.titleSectionParams,
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			} as TitleSectionAttrs),
			m(".mt-16"),
			m(TextField, {
				label: "imapAccountUsername_label",
				class: "",
				value: vnode.attrs.data.imapAccountUsername,
				oninput: (value) => (vnode.attrs.data.imapAccountUsername = value),
				leadingIcon: {
					icon: Icons.MailFilled,
					color: theme.on_surface_variant,
				},
			}),
			this.shouldDisplayServerConfigFields
				? m(
						".flex.row.gap-16.mt-16",
						m(TextField, {
							label: "imapAccountPassword_label",
							value: vnode.attrs.data.imapAccountPassword,
							oninput: (value) => (vnode.attrs.data.imapAccountPassword = value),
							type: vnode.attrs.data.revealImapAccountPassword ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
							injectionsRight: () => this.renderRevealIcon(vnode.attrs.data),
							class: "",
							leadingIcon: {
								icon: Icons.GenericLockFilled,
								color: theme.on_surface_variant,
							},
						}),
					)
				: null,
			this.shouldDisplayServerConfigFields
				? m(".flex.row.gap-16.mt-16", [
						m(TextField, {
							label: "imapAccountHost_label",
							class: "",
							value: vnode.attrs.data.imapAccountHost,
							oninput: (value) => (vnode.attrs.data.imapAccountHost = value),
							leadingIcon: {
								icon: Icons.ServerFilled,
								color: theme.on_surface_variant,
							},
						}),
						m(TextField, {
							label: "imapAccountPort_label",
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
					])
				: null,
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
						disabled:
							this.shouldDisableNextButton ||
							(!this.shouldDisplayServerConfigFields && !isMailAddress(vnode.attrs.data.imapAccountUsername, true)) ||
							(this.shouldDisplayServerConfigFields &&
								!(
									isMailAddress(vnode.attrs.data.imapAccountUsername, true) &&
									vnode.attrs.data.imapAccountPassword.length > 0 &&
									vnode.attrs.data.imapAccountHost.length > 0 &&
									!Number.isNaN(vnode.attrs.data.imapAccountPort) &&
									vnode.attrs.data.imapAccountPort > 0
								)),
						onclick: async (_, dom) => {
							if (vnode.attrs.data.isImapServerSupportingOAuth) {
								this.shouldDisableNextButton = true
								const config = vnode.attrs.data.oauthConfig
								if (config === undefined) {
									throw new ProgrammingError("The provider set to support OAuth without having configs, please review ImapKnownConfigs.ts")
								}
								const oauthHandler = new OAuthHandler(config)
								const extraParams = { login_hint: vnode.attrs.data.imapAccountUsername }
								await oauthHandler.setupOauthLoginParams(extraParams)
								const controller = await mailLocator.imapImportController()
								const responseUrl = await controller.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), config.redirectUri)
								if (responseUrl) {
									try {
										vnode.attrs.data.imapAccountOAuthToken = await oauthHandler.getAuthTokens(responseUrl)
										//Only go forward if we have a token
										emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
									} catch (e) {
										// this happens when the user denies the permissions
										this.changeTitleSectionToErrorState()
									}
								} else {
									this.changeTitleSectionToErrorState()
								}
							} else {
								emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
							}
						},
					}),
				),
			),
		])
	}

	private changeTitleSectionToErrorState() {
		this.shouldDisableNextButton = false
		this.titleSectionParams = {
			icon: Icons.FailureFilled,
			iconOptions: { color: theme.error },
			subTitle: lang.getTranslationText("imapImportWindowClosedFailure_msg"),
		}
	}

	private renderRevealIcon(model: ImapImportData): Children {
		return m(ToggleButton, {
			title: model ? "concealPassword_action" : "revealPassword_action",
			toggled: model.revealImapAccountPassword,
			onToggled: (_, e) => {
				model.revealImapAccountPassword = !model.revealImapAccountPassword
				e.stopPropagation()
			},
			icon: model.revealImapAccountPassword ? Icons.EyeCrossedFilled : Icons.EyeFilled,
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
		return "imapImportSetup_title"
	}

	stepTitle = "imapSyncImap_title" as TranslationKey

	async nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
