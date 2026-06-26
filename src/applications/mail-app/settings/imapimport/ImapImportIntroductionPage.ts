import m, { Children, Vnode } from "mithril"
import { assertMainOrNode, ProgrammingError } from "@tutao/app-env"
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
import { OAuthHandler } from "./oauth/OAuthHandler"

assertMainOrNode()

export class ImapImportIntroductionPage implements WizardPageN<ImapImportData> {
	private shouldDisableNextButton: boolean = false
	private titleSectionParams: Partial<TitleSectionAttrs> = {
		icon: Icons.MailFilled,
		iconOptions: { color: theme.on_surface_variant },
		subTitle: lang.getTranslationText("imapSyncCredentialsInfo_msg"),
	}

	oninit(vnode: Vnode<WizardPageAttrs<ImapImportData>>) {
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
	}
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
							if (vnode.attrs.data.isImapServerSupportingOAuth) {
								this.shouldDisableNextButton = true
								const config = vnode.attrs.data.oauthConfig
								if (config === undefined) {
									throw new ProgrammingError("The provider set to support OAuth without having configs, please review ImapKnownConfigs.ts")
								}
								const oauthHandler = new OAuthHandler(config)
								const extraParams = {
									login_hint: vnode.attrs.data.imapAccountUsername,
									access_type: "offline",
									prompt: "consent",
								}
								await oauthHandler.setupOauthLoginParams(extraParams)
								const responseUrl = await mailLocator
									.getImapImportController()
									.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), config.redirectUri)
								if (responseUrl) {
									try {
										vnode.attrs.data.imapAccountOAuthToken = await oauthHandler.getAuthTokens(responseUrl)
										// only go forward if we have a token
										emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
									} catch (e) {
										// this happens when the user denies the permissions
										this.changeTitleSectionToErrorState()
									}
								} else {
									this.changeTitleSectionToErrorState()
								}
							} else {
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
							}
						},
						disabled: this.shouldDisableNextButton || !isMailAddress(vnode.attrs.data.imapAccountUsername, true),
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
		return true
	}
}
