import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { DisplayMode } from "../login/LoginViewModel"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { WizardStepContext } from "../gui/base/wizard/WizardController"
import { SignupViewModel } from "../signup/SignupView"
import { windowFacade } from "../misc/WindowFacade"
import { layout_size, px, size } from "../gui/size"
import { theme } from "../gui/theme"
import { MonospaceTextDisplay } from "../gui/base/MonospaceTextDisplay"
import { LoginButton, SecondaryButton, SecondaryButtonAttrs } from "../gui/base/buttons/LoginButton"
import { Icons } from "../gui/base/icons/Icons"
import { copyToClipboard } from "../misc/ClipboardUtils"
import { showSnackBar } from "../gui/base/SnackBar"
import { Checkbox } from "../gui/base/Checkbox"

export class UpgradeCongratulationsPageNew implements Component<WizardStepContext<SignupViewModel>> {
	private acceptedWarning: boolean = false

	private saveRecoveryCodeAsPdf(recoveryCode: string) {
		showProgressDialog(
			"pleaseWait_msg",
			locator.customerFacade.generatePdfRecoveryDocument(recoveryCode).then((pdfInvoice) => locator.fileController.saveDataFile(pdfInvoice)),
		)
	}
	view({ attrs }: Vnode<WizardStepContext<SignupViewModel>>): Children {
		let { newAccountData } = attrs.viewModel
		if (!newAccountData) {
			newAccountData = {
				recoverCode: "2671d7cf38d06c544979666f8d484f57cf625c0fe2a84c477b9c13be04eb4546",
				mailAddress: "placeholder@tuta.de",
				password: "dfkjkdfjkdfjkjdf:w",
			}
		}

		return m(
			".flex.flex-column.full-width",
			{
				style: {
					"max-width": px(layout_size.signup_wizard_content_max_width),
				},
			},
			[
				m("h1.font-mdio.line-height-1", lang.get("recovery_kit_page_title")),
				m("p", { style: { color: theme.on_surface_variant } }, lang.get("recovery_kit_page_subtitle")),

				m(".flex.gap-16", [
					m(".flex.col.flex-grow.gap-8", [
						m(".flex.col.gap-8", [
							m(
								".flex.col.items-center.pt-24.pb-24.plr-64.border-radius-16.gap-16",
								{
									style: {
										"background-color": theme.surface_container_high,
									},
								},
								[
									m(
										"",
										{
											style: {
												"background-color": theme.surface_container_highest,
												color: theme.on_surface_variant,
												"border-radius": px(size.radius_8),
												padding: px(size.spacing_16),
												"font-size": px(20),
												"font-weight": "bold",
											},
										},

										m(MonospaceTextDisplay, {
											text: newAccountData.recoverCode,
											chunksPerLine: 4,
											chunkSize: 4,
											border: false,
										}),
									),
									m(".flex.gap-16", [
										m(SecondaryButton, {
											label: "recoveryCode_label",
											icon: Icons.Clipboard,
											text: "Copy Recovery Code",
											onclick: () => {
												copyToClipboard(newAccountData?.recoverCode)
												void showSnackBar({
													message: "copied_msg",
													showingTime: 3000,
													leadingIcon: Icons.Clipboard,
												})
											},
											class: "flex-grow",
										}),

										m(SecondaryButton, {
											label: "recoveryCode_label",
											icon: Icons.Download,
											text: "Download PDF-File",
											onclick: () => {
												this.saveRecoveryCodeAsPdf(newAccountData?.recoverCode)
											},
											class: "flex-grow",
										} satisfies SecondaryButtonAttrs),
									]),
								],
							),
						]),
						m(".flex.full-width.justify-start", [
							m(Checkbox, {
								label: () => lang.get("recovery_kit_page_checkbox_msg"),
								checked: this.acceptedWarning,
								onChecked: (value) => {
									this.acceptedWarning = value
								},
							}),
						]),
						m(".flex.justify-end", [
							m(LoginButton, {
								width: "flex",
								label: "recovery_kit_page_continue_label",
								onclick: () => {
									attrs.goNext()
								},
								disabled: !this.acceptedWarning,
							}),
						]),
					]),
					m(".flex-grow", []),
				]),
			],
		)
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
