import m, { Children, Vnode, VnodeDOM } from "mithril"
import { lang, type TranslationKey } from "../misc/LanguageViewModel"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { locator } from "../api/main/CommonLocator"
import { RecoverCodeField } from "../settings/login/RecoverCodeDialog.js"
import { VisSignupImage } from "../gui/base/icons/Icons.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { assertNotNull, lazy } from "@tutao/tutanota-utils"
import { DisplayMode, LoginViewModel } from "../login/LoginViewModel"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"

export class UpgradeCongratulationsPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement
	private disabled: boolean = false

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view({ attrs }: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const { newAccountData } = attrs.data

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
						this.close(attrs.data, this.dom)
					},
				}),
			),
		]
	}

	private close(data: UpgradeSubscriptionData, dom: HTMLElement) {
		let promise = Promise.resolve()

		if (data.newAccountData && locator.logins.isUserLoggedIn()) {
			promise = locator.logins.logout(false)
		}

		promise.then(async () => {
			emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
		})
	}
}

export class UpgradeCongratulationsPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData
	preventGoBack = true
	hidePagingButtonForPage = true

	constructor(
		upgradeData: UpgradeSubscriptionData,
		private readonly loginViewModelFactory: lazy<LoginViewModel>,
	) {
		this.data = upgradeData
	}

	headerTitle(): TranslationKey {
		return "accountCongratulations_msg"
	}

	async nextAction(_showDialogs: boolean): Promise<boolean> {
		await locator.logins.logout(true)
		const loginViewModel = this.loginViewModelFactory()
		loginViewModel.displayMode = DisplayMode.Form
		loginViewModel.password(this.data.newAccountData!.password)
		loginViewModel.mailAddress(this.data.newAccountData!.mailAddress)
		loginViewModel.savePassword(true)
		loginViewModel.skipPostLoginActions = true
		await showProgressDialog("pleaseWait_msg", loginViewModel.login())
		return true
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
