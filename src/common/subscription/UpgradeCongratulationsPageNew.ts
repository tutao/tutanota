import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { RecoverCodeField } from "../settings/login/RecoverCodeDialog.js"
import { VisSignupImage } from "../gui/base/icons/Icons.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { DisplayMode } from "../login/LoginViewModel"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { WizardStepContext } from "../gui/base/wizard/WizardController"
import { SignupViewModel } from "../login/SignupView"
import { windowFacade } from "../misc/WindowFacade"

export class UpgradeCongratulationsPageNew implements Component<WizardStepContext<SignupViewModel>> {
	private disabled: boolean = false

	view({ attrs: { viewModel } }: Vnode<WizardStepContext<SignupViewModel>>): Children {
		const { newAccountData } = viewModel

		return [
			m(".center.h4.pt", lang.get("accountCreationCongratulation_msg")),
			newAccountData
				? m(".plr-l", [
						m(RecoverCodeField, {
							showMessage: true,
							recoverCode: assertNotNull(newAccountData.recoverCode),
							image: {
								src: VisSignupImage,
								alt: "vitor_alt",
							},
						}),
					])
				: null,
			m(
				".flex-center.full-width.pt-l",
				m(LoginButton, {
					label: "ok_action",
					class: "small-login-button",
					disabled: this.disabled,
					onclick: () => {
						this.disabled = true
						this.close(viewModel)
					},
				}),
			),
		]
	}

	private async close(data: SignupViewModel) {
		let promise = Promise.resolve()

		if (data.newAccountData && locator.logins.isUserLoggedIn()) {
			promise = locator.logins.logout(false)
		}

		promise.then(async () => {
			const loginViewModel = (await locator.loginViewModelFactory())()
			loginViewModel.displayMode = DisplayMode.Form
			loginViewModel.password(data.newAccountData!.password)
			loginViewModel.mailAddress(data.newAccountData!.mailAddress)
			loginViewModel.savePassword(true)
			loginViewModel.skipPostLoginActions = true
			await showProgressDialog("pleaseWait_msg", loginViewModel.login())
			if (locator.logins.isUserLoggedIn()) {
				// this ensures that all created sessions during signup process are closed
				// either by clicking on `cancel`, closing the window, or confirm on the UpgradeCongratulationsPage
				await locator.logins.logout(true)
			}

			// ensure that we reload the client in order to reset any state of the client that has been set when creating a session during signup.
			if (data.newAccountData) {
				m.route.set("/login")
				await windowFacade.reload({
					noAutoLogin: false,
					loginWith: data.newAccountData.mailAddress,
				})
			}
		})
	}
}
