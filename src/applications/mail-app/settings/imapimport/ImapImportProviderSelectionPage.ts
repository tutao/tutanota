import m, { Children, Vnode } from "mithril"
import { ImapImportData } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { GmailLogo, Icons, IconsSvg, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { getImapConfigForProvider, ImapAuthType, ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs.js"
import { TitleSection } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { RadioSelectorOption } from "../../../../ui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../../../../ui/base/RadioSelector"

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
		const imapConfigForProvider = getImapConfigForProvider(this.selectedProvider)
		if (imapConfigForProvider !== null) {
			const { host, port } = imapConfigForProvider
			vnode.attrs.data.imapAccountHost = host
			vnode.attrs.data.imapAccountPort = Number.parseInt(port)
		}
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
		const options: ReadonlyArray<RadioSelectorOption<ImapProvider>> = [
			{
				name: "migrationProviderGmail_label",
				value: ImapProvider.Gmail,
				icon: m(".flex.ml-4", m.trust(GmailLogo)),
			},
			{
				name: "migrationProviderOutlook_label",
				value: ImapProvider.Outlook,
				icon: m(".flex.ml-4", m.trust(OutlookLogo)),
			},
			{
				name: "migrationProviderOther_label",
				value: ImapProvider.Other,
				icon: m(Icon, {
					icon: Icons.MailFilled,
					size: IconSize.PX40,
					class: "mr-negative-4",
				}),
			},
		]

		return m(
			".mt-32.flex.justify-center",
			m(RadioSelector, {
				groupName: "migrationImapProvider_label",
				options,
				optionClass: ".flex.row",
				selectedOption: this.selectedProvider,
				onOptionSelected: (provider: ImapProvider) => {
					this.selectedProvider = provider
					data.imapAccountUsername = ""
					const imapConfig = getImapConfigForProvider(provider)
					if (imapConfig !== null) {
						const { host, port } = imapConfig
						data.imapAccountHost = host
						data.imapAccountPort = Number.parseInt(port)
					} else {
						data.imapAccountHost = ""
						data.imapAccountPort = 993
					}
				},
				horizontalLayout: true,
			} satisfies RadioSelectorAttrs<ImapProvider>),
		)
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
