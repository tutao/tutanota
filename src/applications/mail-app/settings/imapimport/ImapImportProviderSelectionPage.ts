import m, { Children, Vnode, VnodeDOM } from "mithril"
import { ImapImportData } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { GmailLogo, Icons, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { getImapConfigForProvider, ImapAuthType, ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs.js"
import { TitleSection } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Button, ButtonType } from "../../../../ui/base/Button.js"
import { Icon, IconSize } from "../../../../ui/base/Icon"

assertMainOrNode()

const initialTitleSectionParams = {
	icon: Icons.MailFilled,
	iconOptions: { color: theme.on_surface_variant },
	subTitle: lang.getTranslationText("imapSyncChooseProvider_msg"),
}

export class ImapImportProviderSelectionPage implements WizardPageN<ImapImportData> {
	private selectedProvider: ImapProvider = ImapProvider.Other
	private titleSectionParams = initialTitleSectionParams

	oninit(vnode: Vnode<WizardPageAttrs<ImapImportData>>) {
		vnode.attrs.data.isImapServerSupportingOAuth = false
		vnode.attrs.data.oauthConfig = undefined
	}

	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		return m(".mt-24", [
			m(TitleSection, {
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
				...this.titleSectionParams,
			}),
			this.renderOptionButtons(vnode.attrs.data),
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
						onclick: async (_, dom) => {
							const imapConfig = getImapConfigForProvider(this.selectedProvider)
							const isConfigAvailableForSelectedProvider = imapConfig && this.selectedProvider !== ImapProvider.Other && imapConfig !== null
							if (isConfigAvailableForSelectedProvider) {
								if (imapConfig.authType === ImapAuthType.Oauth2) {
									vnode.attrs.data.isImapServerSupportingOAuth = true
									vnode.attrs.data.oauthConfig = imapConfig.oauthConfig
								}
								vnode.attrs.data.imapAccountHost = imapConfig.host
								vnode.attrs.data.imapAccountPort = Number.parseInt(imapConfig.port)
							}

							vnode.attrs.data.imapProvider = this.selectedProvider
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
						disabled: this.selectedProvider === null,
					}),
				),
			),
		])
	}

	private renderOptionButtons(data: ImapImportData): Children {
		const selectedItemClasses = ".border.border-radius.provider-selector"
		return m(".flex.row.gap-16.mt-32.justify-center", [
			m(
				`${this.selectedProvider === ImapProvider.Google ? selectedItemClasses : ""}.provider-selector.p-4`,
				m(Button, {
					label: "imapProviderGmail_label",
					click: () => {
						this.titleSectionParams = initialTitleSectionParams
						this.selectedProvider = ImapProvider.Google
						data.imapAccountUsername = "@gmail.com"
					},
					icon: m(".flex.mr-8", m.trust(GmailLogo)),
					class: ["content-fg"],
					type: ButtonType.Secondary,
				}),
			),
			m(
				`${this.selectedProvider === ImapProvider.Microsoft ? selectedItemClasses : ""}.provider-selector.p-4`,
				m(Button, {
					label: "imapProviderOutlook_label",
					click: () => {
						this.titleSectionParams = initialTitleSectionParams
						this.selectedProvider = ImapProvider.Microsoft
						data.imapAccountUsername = "@outlook.com"
					},
					icon: m(".flex.mr-8", m.trust(OutlookLogo)),
					type: ButtonType.Secondary,
				}),
			),
			m(
				`${this.selectedProvider === ImapProvider.Other ? selectedItemClasses : ""}.provider-selector.p-4`,
				m(Button, {
					label: "other_label",
					click: () => {
						this.titleSectionParams = initialTitleSectionParams
						this.selectedProvider = ImapProvider.Other
						data.imapAccountUsername = ""
					},
					icon: m(Icon, {
						icon: Icons.MailFilled,
						size: IconSize.PX40,
						class: "mr-8",
					}),
					type: ButtonType.Secondary,
				}),
			),
		])
	}
}

export class ImapImportProviderSelectionPageAttrs implements WizardPageAttrs<ImapImportData> {
	data: ImapImportData
	hideAllPagingButtons = true
	hidePagingButtonForPage = true

	constructor(imapImportData: ImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): TranslationKey {
		return "imapImportSetup_title"
	}

	nextAction(_: boolean = true): Promise<boolean> {
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
