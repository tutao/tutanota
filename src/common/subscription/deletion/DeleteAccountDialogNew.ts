import { MultiPageDialog } from "../../gui/dialogs/MultiPageDialog"
import { ReuseMailLandingPage } from "./pages/ReuseMailLandingPage"
import m from "mithril"
import { MailTakeoverPage } from "./pages/MailTakeoverPage"
import { AccountDeletionPage } from "./pages/AccountDeletionPage"
import { PasswordEntryPage } from "./pages/PasswordEntryPage"
import { ButtonAttrs, ButtonType } from "../../gui/base/Button"
import { LoginController } from "../../api/main/LoginController"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { TitleSection } from "../../gui/TitleSection"
import { Icons } from "../../gui/base/icons/Icons"

export type TitleState = "initial" | "sync" | "error" | "success"
export type TitleSectionType = "password" | "mail"

const DEFAULT_HEIGHT = 300
//FIXME Translation
const DEFAULT_TITLE = "Delete Account"
enum AccountDeletionPages {
	REUSE_MAIL_PAGE = "REUSE_MAIL_PAGE",
	MAIL_TAKEOVER_PAGE = "MAIL_TAKEOVER_PAGE",
	PASSWORD_ENTRY_PAGE = "PASSWORD_ENTRY_PAGE",
	DELETION_PAGE = "DELETION_PAGE",
}

export interface AccountDeletionPageState {
	loginController: LoginController
	takeOverMailAddress: string
	primaryMailAddress: string
	canContinuePassword: boolean
	canContinueTakeoverMail: boolean
	userPassword: string
}

export async function showAccountDeletionDialog(logins: LoginController) {
	const data: AccountDeletionPageState = {
		loginController: logins,
		primaryMailAddress: logins.getUserController().loginUsername,
		takeOverMailAddress: "",
		canContinuePassword: false,
		canContinueTakeoverMail: false,
		userPassword: "",
	}

	const multiPageDialog = new MultiPageDialog<AccountDeletionPages>(
		AccountDeletionPages.REUSE_MAIL_PAGE,
		(dialog, navigateToPage) => ({
			//Reuse Mail Page Section (1)
			[AccountDeletionPages.REUSE_MAIL_PAGE]: {
				title: DEFAULT_TITLE,
				content: m(ReuseMailLandingPage, {
					data,
					goToMailTakeoverPage: () => {
						//(2)
						navigateToPage(AccountDeletionPages.MAIL_TAKEOVER_PAGE) //FIXME: For testing, should be MAIL_TAKEOVER_PAGE
					},
					goToPasswordEntryPage: () => {
						//(3)
						navigateToPage(AccountDeletionPages.PASSWORD_ENTRY_PAGE)
					},
				}),
				leftAction: renderLeftButton(() => {
					dialog.close()
				}),
			},

			//Mail Takeover Page Section (2)
			[AccountDeletionPages.MAIL_TAKEOVER_PAGE]: {
				title: DEFAULT_TITLE,
				content: m(MailTakeoverPage, {
					data,
					goToPasswordEntryPage: () => {
						//(3)
						navigateToPage(AccountDeletionPages.PASSWORD_ENTRY_PAGE)
					},
				}),
				leftAction: renderLeftButton(() => {
					dialog.close()
				}),
				rightAction: renderRightContinueButton(() => {
					navigateToPage(AccountDeletionPages.PASSWORD_ENTRY_PAGE)
				}, !data.canContinueTakeoverMail),
			},

			//Password entry page section (3)
			[AccountDeletionPages.PASSWORD_ENTRY_PAGE]: {
				title: DEFAULT_TITLE,
				content: m(PasswordEntryPage, {
					data,
					goToAccountDeletionPage: () => {
						//(4)
						navigateToPage(AccountDeletionPages.DELETION_PAGE)
					},
				}),
				leftAction: renderLeftButton(() => {
					dialog.close()
				}),
				rightAction: renderRightContinueButton(() => {
					navigateToPage(AccountDeletionPages.DELETION_PAGE)
				}, !data.canContinuePassword),
			},

			//Account Deletion Page Section (4)
			[AccountDeletionPages.DELETION_PAGE]: {
				title: DEFAULT_TITLE,
				content: m(AccountDeletionPage, {
					data,
				}),
				leftAction: renderLeftButton(() => {
					dialog.close()
				}),
			},
		}),
		DEFAULT_HEIGHT,
	).getDialog()

	multiPageDialog.show()
	function renderLeftButton(onclick: () => void): ButtonAttrs {
		return {
			type: ButtonType.Secondary,
			click: onclick,
			label: "cancel_action",
			title: "cancel_action",
		}
	}
	function renderRightContinueButton(onclick: () => void, isDisabled: boolean = false): ButtonAttrs {
		console.log("Called with: ", isDisabled)
		return {
			type: ButtonType.Secondary,
			click: onclick,
			label: "continue_action",
			title: "continue_action",
			isDisabled,
		}
	}
}

//Shows the title section in dependence of the current state
export function showTitleSection(primaryMailAddress: string, state: TitleState, type: TitleSectionType) {
	const translations = {
		password: {
			checkingCorrectness: "checkingPasswordCorrectness_msg" as TranslationKey,
			enterForDeletion: "enterPasswordForAccountDeletion_msg" as TranslationKey,
			checkingOk: "passwordCheckingOk_msg" as TranslationKey,
			invalid: "invalidPassword_msg" as TranslationKey,
		},
		mail: {
			checkingCorrectness: "checkingMailCorrectness_msg" as TranslationKey,
			enterForDeletion: "whichMailShouldTakeover_msg" as TranslationKey,
			checkingOk: "mailCheckingOk_msg" as TranslationKey,
			invalid: "invalidMail_msg" as TranslationKey,
		},
	}
	switch (state) {
		case "sync":
			return m(TitleSection, {
				icon: Icons.Sync,
				title: "",
				subTitle: m(".normal-font-size", lang.getTranslation(translations[type].checkingCorrectness).text),
			})
		case "initial":
			return m(TitleSection, {
				icon: Icons.ExclamationFilled,
				title: "",
				subTitle: m(".normal-font-size", lang.getTranslation(translations[type].enterForDeletion, { "{mailAddress}": primaryMailAddress }).text),
			})
		case "success":
			return m(TitleSection, {
				icon: Icons.SuccessFilled,
				title: "",
				subTitle: m(".normal-font-size", lang.getTranslationText(translations[type].checkingOk)),
			})
		case "error":
			return m(TitleSection, {
				icon: Icons.FailureFilled,
				title: "",
				subTitle: m(".normal-font-size", lang.getTranslationText(translations[type].invalid)),
			})
	}
}
