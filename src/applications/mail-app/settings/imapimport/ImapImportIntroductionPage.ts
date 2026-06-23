import m, { Children, Vnode } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { ImapImportData } from "./AddImapImportWizard"
import { mailLocator } from "../../mailLocator"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { GmailLogo, Icons, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { guessServerImapConfigFromEmail } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../ui/base/DropDownSelectorNew"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { isMailAddress } from "@tutao/utils"

assertMainOrNode()

export class ImapImportIntroductionPage implements WizardPageN<ImapImportData> {
	view(vnode: Vnode<WizardPageAttrs<ImapImportData>>): Children {
		const imapProvider = vnode.attrs.data.imapProvider
		let titleSectionParams: Partial<TitleSectionAttrs>
		switch (imapProvider) {
			case ImapProvider.Google:
				titleSectionParams = {
					customIcon: m.trust(GmailLogo),
				}
				break
			case ImapProvider.Microsoft:
				titleSectionParams = {
					customIcon: m.trust(OutlookLogo),
				}
				break
			default:
				titleSectionParams = {
					icon: Icons.MailFilled,
					iconOptions: { color: theme.on_surface_variant },
				}
		}
		return m(".mt-24", [
			m(TitleSection, {
				...titleSectionParams,
				title: "",
				subTitle: lang.getTranslationText("imapSyncIntroductionInfo_msg"),
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			}),
			m(".flex.row.gap-16.mt-16", [
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
				this.renderMailboxSelectionControls(),
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
						onclick: async (_, dom) => {
							if (vnode.attrs.data.imapProvider === ImapProvider.Other) {
								//Get settings if user is not using IMAP and if none exist, allow the user
								//to set it up.
								const imapConfig = guessServerImapConfigFromEmail(vnode.attrs.data.imapAccountUsername)
								if (imapConfig) {
									vnode.attrs.data.imapAccountHost = imapConfig.host
									vnode.attrs.data.imapAccountPort = Number.parseInt(imapConfig.port)
								}
							}
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						},
						disabled: !isMailAddress(vnode.attrs.data.imapAccountUsername, true),
					}),
				),
			),
		])
	}

	private renderMailboxSelectionControls() {
		const mailboxDetails = mailLocator.getImapImportController().mailboxDetails
		return mailboxDetails.length > 1
			? m(DropDownSelectorNew, {
					label: "imapImportDestination_label",
					items: mailboxDetails.map((mailboxDetail) => {
						return { name: getMailboxName(mailLocator.logins, mailboxDetail), value: mailboxDetail }
					}),
					selectedValue: mailLocator.getImapImportController().selectedMailBoxDetail,
					selectionChangedHandler: (selectedMailboxDetail) => {
						mailLocator.getImapImportController().onNewMailboxSelected(selectedMailboxDetail)
					},
					dropdownWidth: 300,
					helpLabel: () => null,
					icon: {
						icon: Icons.InboxFilled,
						color: theme.on_surface_variant,
					},
				} satisfies DropDownSelectorNewAttrs<MailboxDetail>)
			: null
	}
}

export class ImapImportIntroductionPageAttrs implements WizardPageAttrs<ImapImportData> {
	data: ImapImportData

	constructor(imapImportData: ImapImportData) {
		this.data = imapImportData
	}

	headerTitle(): TranslationKey {
		return "imapImportSetup_title"
	}

	stepTitle = "imapSyncCredentials_title" as TranslationKey

	nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return !this.data.isImapServerSupportingOAuth
	}
}
