import m, { Children, Component, Vnode } from "mithril"
import { MultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { ExchangeLogo, GmailLogo, Icons, MicrosoftLogo, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { WizardStepComponentAttrs } from "../../../../ui/base/wizard/WizardStep"
import { getServerMigrationConfigForProvider, MigrationAuthMethod } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { TitleSection } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { RadioSelectorOption } from "../../../../ui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../../../../ui/base/RadioSelector"
import { EnvProvider } from "@tutao/app-env"
import { locator } from "../../../common/api/main/CommonLocator"
import { MailboxMigrationProviderUI, toMigrationProvider, toMigrationProviderUI } from "./MigrationProviderSelectionPage"

EnvProvider.assertMainOrNode()

type ProviderOption = RadioSelectorOption<MailboxMigrationProviderUI>

export class MultiUserMigrationProviderSelectionPage implements Component<WizardStepComponentAttrs<MultiUserMigrationData>> {
	private selectedProvider: MailboxMigrationProviderUI = MailboxMigrationProviderUI.Gmail

	oninit({ attrs: { ctx } }: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>) {
		this.selectedProvider = toMigrationProviderUI(ctx.viewModel.provider, ctx.viewModel.isExchange)
	}

	view({ attrs: { ctx } }: Vnode<WizardStepComponentAttrs<MultiUserMigrationData>>): Children {
		const data = ctx.viewModel
		return m("", [
			m(TitleSection, {
				icon: Icons.MailFilled,
				iconOptions: { color: theme.on_surface_variant },
				subTitle: lang.getTranslationText("migrationChooseProvider_msg"),
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			}),
			this.renderOptionButtons(data),
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "continue_action",
						class: "wizard-next-button",
						onclick: () => ctx.goNext(),
					}),
				),
			),
		])
	}

	private renderOptionButtons(data: MultiUserMigrationData): Children {
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
				onOptionSelected: (providerUI: MailboxMigrationProviderUI) => {
					this.selectedProvider = providerUI
					data.adminUsername = ""
					data.isExchange = providerUI === MailboxMigrationProviderUI.Exchange
					const provider = toMigrationProvider(providerUI)
					data.provider = provider
					const serverMigrationConfig = getServerMigrationConfigForProvider(provider)
					if (serverMigrationConfig !== null) {
						data.host = serverMigrationConfig.imapConfig?.host ?? ""
						data.port = serverMigrationConfig.imapConfig?.port ?? 993
						if (serverMigrationConfig.authMethod === MigrationAuthMethod.Oauth2) {
							data.isImapServerSupportingOAuth = true
							data.oauthConfig = serverMigrationConfig.oauthConfig
						} else {
							data.isImapServerSupportingOAuth = false
							data.oauthConfig = undefined
						}
					} else {
						data.host = ""
						data.port = 993
						data.isImapServerSupportingOAuth = false
						data.oauthConfig = undefined
					}
				},
				horizontalLayout: true,
			} satisfies RadioSelectorAttrs<MailboxMigrationProviderUI>),
		)
	}
}
