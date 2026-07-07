import m, { Children, Vnode } from "mithril"
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

export class ImapImportProviderSelectionPage implements WizardPageN<ImapImportData> {
	private selectedProvider: ImapProvider = ImapProvider.Gmail
	private titleSectionParams = {
		icon: Icons.MailFilled,
		iconOptions: { color: theme.on_surface_variant },
		subTitle: lang.getTranslationText("migrationChooseProvider_msg"),
	}

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
							const isConfigAvailableForSelectedProvider = imapConfig !== null
							if (isConfigAvailableForSelectedProvider) {
								if (imapConfig.authType === ImapAuthType.Oauth2) {
									vnode.attrs.data.isImapServerSupportingOAuth = true
									vnode.attrs.data.oauthConfig = imapConfig.oauthConfig
								} else {
									vnode.attrs.data.isImapServerSupportingOAuth = false
									vnode.attrs.data.oauthConfig = undefined
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
		const selectedItemClasses = ".outline.border-radius"
		return m(".flex.row.gap-16.mt-32.justify-center", [
			m(
				`${this.selectedProvider === ImapProvider.Gmail ? selectedItemClasses : ""}.provider-selector.p-4`,
				m(Button, {
					label: "migrationProviderGmail_label",
					click: () => {
						this.selectedProvider = ImapProvider.Gmail
						data.imapAccountUsername = ""
					},
					icon: m(".flex.mr-8", m.trust(GmailLogo)),
					class: ["content-fg"],
					type: ButtonType.Secondary,
				}),
			),
			m(
				`${this.selectedProvider === ImapProvider.Outlook ? selectedItemClasses : ""}.provider-selector.p-4`,
				m(Button, {
					label: "migrationProviderOutlook_label",
					click: () => {
						this.selectedProvider = ImapProvider.Outlook
						data.imapAccountUsername = ""
					},
					icon: m(".flex.mr-8", m.trust(OutlookLogo)),
					type: ButtonType.Secondary,
				}),
			),
			m(
				`${this.selectedProvider === ImapProvider.Other ? selectedItemClasses : ""}.provider-selector.p-4`,
				m(Button, {
					label: "migrationProviderOther_label",
					click: () => {
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
		return "migrationSetup_title"
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
