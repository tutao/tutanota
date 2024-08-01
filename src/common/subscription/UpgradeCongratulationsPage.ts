import m, { Children, Vnode, VnodeDOM } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { locator } from "../api/main/CommonLocator"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { RecoverCodeField } from "../settings/login/RecoverCodeDialog.js"
import { VisSignupImage } from "../gui/base/icons/Icons.js"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"

export class UpgradeCongratulationsPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement
	private __signupPaidTest?: UsageTest
	private __signupFreeTest?: UsageTest

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid")
		this.__signupFreeTest = locator.usageTestController.getTest("signup.free")

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
							recoverCode: newAccountData.recoverCode,
							showImage: VisSignupImage,
						}),
				  ])
				: null,
			m(
				".flex-center.full-width.pt-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: "ok_action",
						onclick: () => {
							if (attrs.data.type === PlanType.Free) {
								const recoveryConfirmationStageFree = this.__signupFreeTest?.getStage(5)

								recoveryConfirmationStageFree?.setMetric({
									name: "switchedFromPaid",
									value: (this.__signupPaidTest?.isStarted() ?? false).toString(),
								})
								recoveryConfirmationStageFree?.complete()
							}

							this.close(attrs.data, this.dom)
						},
					}),
				),
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

	headerTitle(): string {
		return lang.get("accountCongratulations_msg")
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
