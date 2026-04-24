import { AccountDeletionPageState, showTitleSection, TitleState } from "../DeleteAccountDialogNew"
import m, { Children, Component, Vnode } from "mithril"
import { PasswordFieldNew } from "../../../signup/components/PasswordFieldNew"
import { lang } from "../../../misc/LanguageViewModel"
import { debounce } from "@tutao/tutanota-utils"
import { locator } from "../../../api/main/CommonLocator"
import { AccessBlockedError, NotAuthenticatedError } from "../../../api/common/error/RestError"

type PasswordEntryPageProps = {
	data: AccountDeletionPageState
	goToAccountDeletionPage: () => void
}
export class PasswordEntryPage implements Component<PasswordEntryPageProps> {
	private state: TitleState = "initial"
	private password = ""
	private debouncedOnInput = debounce(1000, async (password: string, data: AccountDeletionPageState) => {
		this.state = "sync"
		const result = await checkPassword(password)
		if (result) {
			data.canContinuePassword = true
			data.userPassword = password
			this.state = "success"
		} else {
			this.state = "error"
		}
		m.redraw()
	})
	view({ attrs: { data } }: Vnode<PasswordEntryPageProps>): Children {
		return m(
			".pt-16",
			m("", [
				m("", { style: { minHeight: "185px" } }, showTitleSection(data.primaryMailAddress, this.state, "password")),
				m(PasswordFieldNew, {
					value: this.password,
					oninput: (value) => {
						this.state = "initial"
						data.canContinuePassword = false
						this.password = value
						if (value !== "") {
							this.debouncedOnInput(value, data)
						}
					},
					status: {
						type: "neutral",
						text: "passwordEnterNeutral_msg",
					},
				}),
			]),
		)
	}
}

//Calls recover code facade to check for the correct password of the user
async function checkPassword(password: string): Promise<boolean> {
	const recoverCodeFacade = locator.recoverCodeFacade
	try {
		await recoverCodeFacade.getRecoverCodeHex(password)
		return true
	} catch (e) {
		if (e instanceof NotAuthenticatedError) {
			lang.getTranslationText("invalidPassword_msg")
			return false
		}
		if (e instanceof AccessBlockedError) {
			lang.getTranslationText("tooManyAttempts_msg")
			return false
		}
		throw e
	}
}
