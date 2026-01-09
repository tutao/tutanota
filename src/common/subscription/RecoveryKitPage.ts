import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { DisplayMode } from "../login/LoginViewModel"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { SignupViewModel } from "../signup/SignupView"
import { windowFacade } from "../misc/WindowFacade"
import { px } from "../gui/size"
import { theme } from "../gui/theme"
import { MonospaceTextDisplay } from "../gui/base/MonospaceTextDisplay"
import { LoginButton, SecondaryButton, SecondaryButtonAttrs } from "../gui/base/buttons/LoginButton"
import { Icons } from "../gui/base/icons/Icons"
import { copyToClipboard } from "../misc/ClipboardUtils"
import { showSnackBar } from "../gui/base/SnackBar"
import { Checkbox } from "../gui/base/Checkbox"
import { styles } from "../gui/styles"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { assertNotNull } from "@tutao/tutanota-utils"

export class RecoveryKitPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	private acceptedWarning: boolean = false

	private saveRecoveryCodeAsPdf(recoveryCode: string, email: string) {
		showProgressDialog(
			"pleaseWait_msg",
			locator.customerFacade.generatePdfRecoveryDocument(recoveryCode, email).then((pdfInvoice) => locator.fileController.saveDataFile(pdfInvoice)),
		)
	}

	oncreate({ attrs }: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		attrs.ctx.lockAllPreviousSteps()
	}

	view({ attrs }: Vnode<WizardStepComponentAttrs<SignupViewModel>>): Children {
		const { newAccountData } = attrs.ctx.viewModel
		assertNotNull(newAccountData)

		return m(".flex.flex-column.full-width.pt-16", [
			m(
				`h1.font-mdio${styles.isMobileLayout() ? ".h2" : ".h1"}`,
				{
					style: {
						position: "relative",
						top: px(-6),
					},
				},
				lang.get("recovery_kit_page_title"),
			),
			m(`p${styles.isMobileLayout() ? ".mb-32" : ""}`, { style: { color: theme.on_surface_variant } }, lang.get("recovery_kit_page_subtitle")),

			m(".flex.gap-16", [
				m(".flex.col.flex-grow.gap-32", [
					m(".flex.col.gap-8", [
						m(
							`.flex.items-start.pt-24.pb-24.plr-32.border-radius-16.gap-24${styles.isMobileLayout() ? ".col" : ""}`,
							{
								style: {
									"background-color": theme.surface_container_high,
								},
							},
							[
								m(
									`.plr-24.pt-16.pb-16.border-radius-8.b${styles.isMobileLayout() ? ".full-width" : ".flex-grow"}`,
									{
										style: {
											"background-color": theme.surface_container_highest,
											color: theme.on_surface_variant,
											"font-size": px(20),
										},
									},

									m(MonospaceTextDisplay, {
										text: newAccountData!.recoverCode,
										chunksPerLine: 4,
										chunkSize: 4,
										border: false,
									}),
								),
								m(".flex.col.items-start.full-width.gap-16.flex-grow", [
									m(SecondaryButton, {
										label: "recoveryCode_label",
										icon: Icons.Clipboard,
										text: lang.getTranslationText("copyRecoveryCode_action"),
										onclick: () => {
											copyToClipboard(newAccountData!.recoverCode)
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
										text: lang.getTranslationText("downloadRecoveryCode_action"),
										onclick: () => {
											this.saveRecoveryCodeAsPdf(newAccountData!.recoverCode, newAccountData!.mailAddress)
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
							width: styles.isMobileLayout() ? "full" : "flex",
							label: "recovery_kit_page_continue_label",
							onclick: async () => {
								attrs.ctx.goNext()
								await this.close(attrs.ctx.viewModel)
							},
							disabled: !this.acceptedWarning,
						}),
					]),
				]),
			]),
		])
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
					// loginWith: data.newAccountData.mailAddress,
				})
			}
		})
	}
}
