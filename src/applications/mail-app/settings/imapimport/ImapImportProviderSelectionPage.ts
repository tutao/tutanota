import m, { Children, Vnode } from "mithril"
import { ImapImportData } from "./AddImapImportWizard.js"
import { EnvProvider } from "@tutao/app-env"
import { ExchangeLogo, GmailLogo, Icons, MicrosoftLogo, OutlookLogo } from "../../../../ui/base/icons/Icons"
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
import { locator } from "../../../common/api/main/CommonLocator"

EnvProvider.assertMainOrNode()

export const enum ImapProviderUI {
	Other,
	Outlook,
	Gmail,
	Exchange,
}

function toImapProvider(provider: ImapProviderUI): ImapProvider {
	switch (provider) {
		case ImapProviderUI.Gmail:
			return ImapProvider.Gmail
		case ImapProviderUI.Outlook:
			return ImapProvider.Outlook
		case ImapProviderUI.Exchange:
		case ImapProviderUI.Other:
			return ImapProvider.Other
	}
}

export function toImapProviderUI(provider: ImapProvider, isExchange: boolean): ImapProviderUI {
	switch (provider) {
		case ImapProvider.Gmail:
			return ImapProviderUI.Gmail
		case ImapProvider.Outlook:
			return ImapProviderUI.Outlook
		case ImapProvider.Other:
			return isExchange ? ImapProviderUI.Exchange : ImapProviderUI.Other
	}
}

type ProviderOption = RadioSelectorOption<ImapProviderUI>

export class ImapImportProviderSelectionPage implements WizardPageN<ImapImportData> {
	private selectedProvider: ImapProviderUI = ImapProviderUI.Gmail
	private titleSectionParams = {
		icon: Icons.DownloadFilled,
		iconOptions: { color: theme.on_surface_variant },
		subTitle: lang.getTranslationText("migrationChooseProvider_msg"),
	}

	oninit(vnode: Vnode<WizardPageAttrs<ImapImportData>>) {
		this.selectedProvider = toImapProviderUI(vnode.attrs.data.imapProvider, vnode.attrs.data.isExchange)
		vnode.attrs.data.isImapServerSupportingOAuth = false
		vnode.attrs.data.oauthConfig = undefined
		const imapConfigForProvider = getImapConfigForProvider(vnode.attrs.data.imapProvider)
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
							const provider = toImapProvider(this.selectedProvider)
							const imapConfig = getImapConfigForProvider(provider)
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

							vnode.attrs.data.imapProvider = provider
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
						disabled: this.selectedProvider === null,
					}),
				),
			),
		])
	}

	private renderOptionButtons(data: ImapImportData): Children {
		const businessUse = locator.logins.getUserController().getCustomer()?.businessUse ?? false
		const options: ReadonlyArray<ProviderOption> = [
			{
				name: "migrationProviderGmail_label",
				value: ImapProviderUI.Gmail,
				icon: m(".flex.ml-4", m.trust(GmailLogo)),
			},
			{
				name: businessUse ? "migrationProviderMicrosoft365_label" : "migrationProviderOutlook_label",
				value: ImapProviderUI.Outlook,
				icon: m(".flex.ml-4", m.trust(businessUse ? MicrosoftLogo : OutlookLogo)),
			},
			...(businessUse
				? [
						{
							name: "migrationProviderExchange_label",
							value: ImapProviderUI.Exchange,
							icon: m(".flex.ml-4", m.trust(ExchangeLogo)),
						} satisfies ProviderOption,
					]
				: []),
			{
				name: "migrationProviderOther_label",
				value: ImapProviderUI.Other,
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
				onOptionSelected: (provider: ImapProviderUI) => {
					this.selectedProvider = provider
					data.imapAccountUsername = ""
					data.isExchange = provider === ImapProviderUI.Exchange
					const imapProvider = toImapProvider(provider)
					const imapConfig = getImapConfigForProvider(imapProvider)
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
			} satisfies RadioSelectorAttrs<ImapProviderUI>),
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
