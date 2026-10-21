import m, { Children, Vnode } from "mithril"
import { EnvProvider } from "@tutao/app-env"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog"
import { MigrationData } from "./AddMigrationWizard"
import { mailLocator } from "../../mailLocator"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { getTranslationForMigrationProvider, MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { GmailLogo, Icons, MicrosoftLogo, OutlookLogo } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { guessServerMigrationParamsFromEmail } from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../ui/base/DropDownSelectorNew"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { isMailAddress } from "@tutao/utils"
import { OAuthHandler } from "./oauth/OAuthHandler"
import { createManageLabelServiceLabelData } from "@tutao/entities/tutanota"
import { locator } from "../../../common/api/main/CommonLocator"

EnvProvider.assertMainOrNode()

export class MigrationIntroductionPage implements WizardPageN<MigrationData> {
	private shouldDisableNextButton: boolean = false
	private titleSectionParams: Partial<TitleSectionAttrs> = {
		icon: Icons.MailFilled,
		iconOptions: { color: theme.on_surface_variant },
	}

	oninit(vnode: Vnode<WizardPageAttrs<MigrationData>>) {
		const migrationData = vnode.attrs.data
		const provider = migrationData.provider
		switch (provider) {
			case MailboxMigrationProvider.Gmail:
				this.titleSectionParams.icon = undefined
				this.titleSectionParams.iconOptions = undefined
				this.titleSectionParams.customIcon = m.trust(GmailLogo)
				migrationData.matchMigrationMailboxesToTutaMailSets = false
				migrationData.addLabelToImportedMails = false
				break
			case MailboxMigrationProvider.Outlook:
				this.titleSectionParams.icon = undefined
				this.titleSectionParams.iconOptions = undefined
				this.titleSectionParams.customIcon = m.trust(businessUse ? MicrosoftLogo : OutlookLogo)
				break
			default:
				this.titleSectionParams.customIcon = undefined
				this.titleSectionParams.icon = Icons.MailFilled
				this.titleSectionParams.iconOptions = { color: theme.on_surface_variant }
		}
	}
	view(vnode: Vnode<WizardPageAttrs<MigrationData>>): Children {
		const mailboxMigrationProvider = vnode.attrs.data.provider
		const businessUse = locator.logins.getUserController().getCustomer()?.businessUse ?? false
		const providerTranslationText = lang.getTranslationText(getTranslationForMigrationProvider(mailboxMigrationProvider, businessUse))
		return m(".mt-24", [
			m(TitleSection, {
				...this.titleSectionParams,
				subTitle: lang.getTranslation("migrationIntroductionInfo_msg", { "{provider}": providerTranslationText }).text,
				title: "",
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			}),
			m(".flex.row.gap-16.mt-16", [
				m(TextField, {
					label: "migrationAccountUsername_label",
					class: "",
					value: vnode.attrs.data.username,
					oninput: (value) => {
						vnode.attrs.data.username = value
						vnode.attrs.data.rootImportMailSetName = value
						if (mailboxMigrationProvider !== MailboxMigrationProvider.Gmail) {
							vnode.attrs.data.syncLabelData = createManageLabelServiceLabelData({
								name: value,
								color: theme.primary,
								parentLabel: null,
							})
						}
					},
					leadingIcon: {
						icon: Icons.MailFilled,
						color: theme.on_surface_variant,
					},
					onDomInputCreated: (dom) => dom.focus(),
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
							if (vnode.attrs.data.oauthConfig) {
								if (vnode.attrs.data.oAuthToken) {
									emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
									return
								}
								this.shouldDisableNextButton = true
								const config = vnode.attrs.data.oauthConfig
								const oauthHandler = new OAuthHandler(config, mailLocator.serviceExecutor)
								const extraParams = {
									login_hint: vnode.attrs.data.username,
								}
								try {
									await oauthHandler.setupOauthLoginParams(extraParams)
								} catch (e) {
									const errorMessage = lang.getTranslation("migrationOAuthNetworkDiscoveryFailure_msg", {
										"{url}": config.server,
									}).text
									this.changeTitleSectionToErrorState(errorMessage)
									m.redraw()
									return
								}
								const responseUrl = await mailLocator
									.getMailboxMigrationController()
									.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), config!.redirectUri)
								if (responseUrl) {
									try {
										vnode.attrs.data.oAuthToken = await oauthHandler.getAuthTokens(responseUrl)
										// only go forward if we have a token
										emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
									} catch (e) {
										// this happens when the user denies the permissions
										this.changeTitleSectionToErrorState(lang.getTranslationText("migrationOAuthWindowClosedFailure_msg"))
									}
								} else {
									this.changeTitleSectionToErrorState(lang.getTranslationText("migrationOAuthWindowClosedFailure_msg"))
								}
							} else {
								if (vnode.attrs.data.provider === MailboxMigrationProvider.Other) {
									//Get settings if user is not using IMAP and if none exist, allow the user
									//to set it up.
									const serverMigrationParams = guessServerMigrationParamsFromEmail(vnode.attrs.data.username)
									if (serverMigrationParams && serverMigrationParams.imapConfig) {
										const { host, port } = serverMigrationParams.imapConfig
										vnode.attrs.data.imapHost = host
										vnode.attrs.data.imapPort = port
									}
								}
								emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
							}
						},
						disabled: this.shouldDisableNextButton || !isMailAddress(vnode.attrs.data.username, true),
					}),
				),
			),
		])
	}

	private changeTitleSectionToErrorState(errorStateText: string) {
		this.shouldDisableNextButton = false
		this.titleSectionParams = {
			icon: Icons.FailureFilled,
			iconOptions: { color: theme.error },
			subTitle: errorStateText,
		}
	}

	private renderMailboxSelectionControls() {
		const mailboxDetails = mailLocator.getMailboxMigrationController().mailboxDetails
		return mailboxDetails.length > 1
			? m(DropDownSelectorNew, {
					label: "migrationMailboxDestination_label",
					items: mailboxDetails.map((mailboxDetail) => {
						return { name: getMailboxName(mailLocator.logins, mailboxDetail), value: mailboxDetail }
					}),
					selectedValue: mailLocator.getMailboxMigrationController().selectedMailBoxDetail,
					selectionChangedHandler: (selectedMailboxDetail) => {
						mailLocator.getMailboxMigrationController().onNewMailboxSelected(selectedMailboxDetail)
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

export class MigrationIntroductionPageAttrs implements WizardPageAttrs<MigrationData> {
	data: MigrationData

	constructor(migrationData: MigrationData) {
		this.data = migrationData
	}

	headerTitle(): TranslationKey {
		return "migrationSetup_title"
	}

	stepTitle = "migrationCredentials_title" as TranslationKey

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
