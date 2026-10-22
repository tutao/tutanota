import m, { Children, Vnode } from "mithril"
import { MigrationData } from "./AddMigrationWizard.js"
import { EnvProvider } from "@tutao/app-env"
import { ExchangeLogo, GmailLogo, Icons, MicrosoftLogo, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import {
	getServerMigrationConfigForProvider,
	MigrationAuthMethod,
	MailboxMigrationProvider,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs.js"
import { TitleSection } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { RadioSelectorOption } from "../../../../ui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../../../../ui/base/RadioSelector"
import { locator } from "../../../common/api/main/CommonLocator"

EnvProvider.assertMainOrNode()

export const enum MailboxMigrationProviderUI {
	Other,
	Outlook,
	Gmail,
	Exchange,
}

export function toMigrationProvider(provider: MailboxMigrationProviderUI): MailboxMigrationProvider {
	switch (provider) {
		case MailboxMigrationProviderUI.Gmail:
			return MailboxMigrationProvider.Gmail
		case MailboxMigrationProviderUI.Outlook:
			return MailboxMigrationProvider.Outlook
		case MailboxMigrationProviderUI.Exchange:
		case MailboxMigrationProviderUI.Other:
			return MailboxMigrationProvider.Other
	}
}

export function toMigrationProviderUI(provider: MailboxMigrationProvider, isExchange: boolean): MailboxMigrationProviderUI {
	switch (provider) {
		case MailboxMigrationProvider.Gmail:
			return MailboxMigrationProviderUI.Gmail
		case MailboxMigrationProvider.Outlook:
			return MailboxMigrationProviderUI.Outlook
		case MailboxMigrationProvider.Other:
			return isExchange ? MailboxMigrationProviderUI.Exchange : MailboxMigrationProviderUI.Other
	}
}

type ProviderOption = RadioSelectorOption<MailboxMigrationProviderUI>

export class MigrationProviderSelectionPage implements WizardPageN<MigrationData> {
	private selectedProvider: MailboxMigrationProviderUI = MailboxMigrationProviderUI.Gmail

	private titleSectionParams = {
		icon: Icons.DownloadFilled,
		iconOptions: { color: theme.on_surface_variant },
		subTitle: lang.getTranslationText("migrationChooseProvider_msg"),
	}

	oninit(vnode: Vnode<WizardPageAttrs<MigrationData>>) {
		this.selectedProvider = toMigrationProviderUI(vnode.attrs.data.provider, vnode.attrs.data.isExchange)
		vnode.attrs.data.oauthConfig = undefined
		vnode.attrs.data.oAuthToken = undefined
		const serverMigrationConfig = getServerMigrationConfigForProvider(vnode.attrs.data.provider)
		if (serverMigrationConfig !== null && serverMigrationConfig.imapConfig) {
			const { host, port } = serverMigrationConfig.imapConfig
			vnode.attrs.data.imapHost = host
			vnode.attrs.data.imapPort = port
		}
	}

	view(vnode: Vnode<WizardPageAttrs<MigrationData>>): Children {
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
							const provider = toMigrationProvider(this.selectedProvider)
							const serverMigrationConfig = getServerMigrationConfigForProvider(provider)
							const isConfigAvailableForSelectedProvider = serverMigrationConfig !== null
							if (isConfigAvailableForSelectedProvider) {
								if (serverMigrationConfig.authMethod === MigrationAuthMethod.Oauth2) {
									vnode.attrs.data.oauthConfig = serverMigrationConfig.oauthConfig
								} else {
									vnode.attrs.data.oauthConfig = undefined
								}
								if (serverMigrationConfig.imapConfig) {
									const { host, port } = serverMigrationConfig.imapConfig
									vnode.attrs.data.imapHost = host
									vnode.attrs.data.imapPort = port
								}
							}

							vnode.attrs.data.provider = provider
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
						disabled: this.selectedProvider === null,
					}),
				),
			),
		])
	}

	private renderOptionButtons(data: MigrationData): Children {
		const businessUse = locator.logins.getUserController().getCustomer()?.businessUse ?? false
		const options: ReadonlyArray<ProviderOption> = [
			{
				name: "migrationProviderGmail_label",
				value: MailboxMigrationProviderUI.Gmail,
				icon: m(".flex.ml-4", m.trust(GmailLogo)),
			},
			{
				name: businessUse ? "migrationProviderMicrosoft365_label" : "migrationProviderOutlook_label",
				value: MailboxMigrationProviderUI.Outlook,
				icon: m(".flex.ml-4", m.trust(businessUse ? MicrosoftLogo : OutlookLogo)),
			},
			...(businessUse
				? [
						{
							name: "migrationProviderExchange_label",
							value: MailboxMigrationProviderUI.Exchange,
							icon: m(".flex.ml-4", m.trust(ExchangeLogo)),
						} satisfies ProviderOption,
					]
				: []),
			{
				name: "migrationProviderOther_label",
				value: MailboxMigrationProviderUI.Other,
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
				onOptionSelected: (provider: MailboxMigrationProviderUI) => {
					this.selectedProvider = provider
					data.username = ""
					data.isExchange = provider === MailboxMigrationProviderUI.Exchange
					const migrationProvider = toMigrationProvider(provider)
					const serverMigrationConfig = getServerMigrationConfigForProvider(migrationProvider)
					if (serverMigrationConfig !== null && serverMigrationConfig.imapConfig) {
						const { host, port } = serverMigrationConfig.imapConfig
						data.imapHost = host
						data.imapPort = port
					} else {
						data.imapHost = ""
						data.imapPort = 993
					}
				},
				horizontalLayout: true,
			} satisfies RadioSelectorAttrs<MailboxMigrationProviderUI>),
		)
	}
}

export class MigrationProviderSelectionPageAttrs implements WizardPageAttrs<MigrationData> {
	data: MigrationData
	hideAllPagingButtons = true
	hidePagingButtonForPage = true

	constructor(migrationData: MigrationData) {
		this.data = migrationData
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
