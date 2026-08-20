import m, { Children, Component, Vnode } from "mithril"
import { MultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { assertMainOrNode } from "@tutao/app-env"
import { GmailLogo, Icons, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { WizardStepComponentAttrs } from "../../../../ui/base/wizard/WizardStep"
import { getImapConfigForProvider, ImapAuthType, ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { TitleSection } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { RadioSelectorOption } from "../../../../ui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../../../../ui/base/RadioSelector"

assertMainOrNode()

export const MultiUserMigrationProviderSelectionPage: Component<WizardStepComponentAttrs<MultiUserMigrationData>> = {
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
			renderOptionButtons(data),
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
	},
}

function renderOptionButtons(data: MultiUserMigrationData): Children {
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
			selectedOption: data.provider,
			onOptionSelected: (provider: ImapProvider) => {
				data.provider = provider
				data.adminUsername = ""
				const imapConfig = getImapConfigForProvider(provider)
				if (imapConfig !== null) {
					data.host = imapConfig.host
					data.port = Number.parseInt(imapConfig.port)
					if (imapConfig.authType === ImapAuthType.Oauth2) {
						data.isImapServerSupportingOAuth = true
						data.oauthConfig = imapConfig.oauthConfig
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
		} satisfies RadioSelectorAttrs<ImapProvider>),
	)
}
