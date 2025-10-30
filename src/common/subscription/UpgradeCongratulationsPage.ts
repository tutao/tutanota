import m, { Children, Vnode, VnodeDOM } from "mithril"
import { lang, type TranslationKey } from "../misc/LanguageViewModel"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { locator } from "../api/main/CommonLocator"
import { RecoverCodeField } from "../settings/login/RecoverCodeDialog.js"
import { VisSignupImage } from "../gui/base/icons/Icons.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { assertNotNull } from "@tutao/tutanota-utils"

export class UpgradeCongratulationsPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement

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
					onclick: () => {
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

		promise.then(() => {
			emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
		})
	}
}

export class UpgradeCongratulationsPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData
	preventGoBack = true
	hidePagingButtonForPage = true

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.data = upgradeData
	}

	headerTitle(): TranslationKey {
		return "accountCongratulations_msg"
	}

	nextAction(showDialogs: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
