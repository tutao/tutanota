import m, { Children, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { lang } from "../misc/LanguageViewModel"
import type { SubscriptionParameters, UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { SubscriptionActionButtons, SubscriptionSelector } from "./SubscriptionSelector"
import { isApp, isTutanotaDomain } from "../api/common/Env"
import { client } from "../misc/ClientDetector"
import { Button, ButtonAttrs, ButtonType } from "../gui/base/Button.js"
import { UpgradeType } from "./SubscriptionUtils"
import { Dialog, DialogType } from "../gui/base/Dialog"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { Keys } from "../api/common/TutanotaConstants"
import { Checkbox } from "../gui/base/Checkbox.js"
import { locator } from "../api/main/MainLocator"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { SubscriptionType, UpgradePriceType } from "./FeatureListProvider"
import { asPaymentInterval, PaymentInterval } from "./PriceUtils.js"
import { lazy } from "@tutao/tutanota-utils"

/** Subscription type passed from the website */
export const SubscriptionTypeParameter = Object.freeze({
	FREE: "free",
	PREMIUM: "premium",
	TEAMS: "teams",
	PRO: "pro",
})

export class UpgradeSubscriptionPage implements WizardPageN<UpgradeSubscriptionData> {
	private _dom: HTMLElement | null = null
	private __signupFreeTest?: UsageTest
	private __signupPaidTest?: UsageTest
	private upgradeType: UpgradeType | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>): void {
		this._dom = vnode.dom as HTMLElement
		const subscriptionParameters = vnode.attrs.data.subscriptionParameters
		this.upgradeType = vnode.attrs.data.upgradeType

		this.__signupFreeTest = locator.usageTestController.getTest("signup.free")
		this.__signupFreeTest.active = false

		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid")
		this.__signupPaidTest.active = false

		if (subscriptionParameters) {
			const paymentInterval: PaymentInterval = asPaymentInterval(subscriptionParameters.interval)
			// We automatically route to the next page; when we want to go back from the second page, we do not want to keep calling nextPage
			vnode.attrs.data.subscriptionParameters = null
			vnode.attrs.data.options.paymentInterval = stream(paymentInterval)
			this.goToNextPageWithPreselectedSubscription(subscriptionParameters, vnode.attrs.data)
		}
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const data = vnode.attrs.data
		const subscriptionActionButtons: SubscriptionActionButtons = {
			Free: () => {
				return {
					label: "pricing.select_action",
					click: () => this.selectFree(data),
					type: ButtonType.Login,
				}
			},
			Premium: this.createUpgradeButton(data, SubscriptionType.Premium),
			PremiumBusiness: this.createUpgradeButton(data, SubscriptionType.PremiumBusiness),
			Teams: this.createUpgradeButton(data, SubscriptionType.Teams),
			TeamsBusiness: this.createUpgradeButton(data, SubscriptionType.TeamsBusiness),
			Pro: this.createUpgradeButton(data, SubscriptionType.Pro),
		}
		return m("#upgrade-account-dialog.pt", [
			m(SubscriptionSelector, {
				options: data.options,
				campaignInfoTextId: data.campaignInfoTextId,
				referralCodeMsg: data.referralCodeMsg,
				boxWidth: 230,
				boxHeight: 270,
				isInitialUpgrade: data.upgradeType !== UpgradeType.Switch,
				currentSubscriptionType: data.currentSubscription,
				currentlySharingOrdered: false,
				currentlyBusinessOrdered: false,
				currentlyWhitelabelOrdered: false,
				orderedContactForms: 0,
				actionButtons: subscriptionActionButtons,
				featureListProvider: vnode.attrs.data.featureListProvider,
				priceAndConfigProvider: vnode.attrs.data.planPrices,
			}),
		])
	}

	selectFree(data: UpgradeSubscriptionData) {
		// Confirmation of free subscription selection (click on subscription selector)
		if (this.__signupPaidTest) {
			this.__signupPaidTest.active = false
		}

		if (this.__signupFreeTest && this.upgradeType == UpgradeType.Signup) {
			this.__signupFreeTest.active = true
			this.__signupFreeTest.getStage(0).complete()
		}
		confirmFreeSubscription().then((confirmed) => {
			if (confirmed) {
				// Confirmation of free/business dialog (click on ok)
				this.__signupFreeTest?.getStage(1).complete()
				data.type = SubscriptionType.Free
				data.price = "0"
				data.priceNextYear = "0"
				this.showNextPage()
			}
		})
	}

	showNextPage(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.SHOWNEXTPAGE)
		}
	}

	goToNextPageWithPreselectedSubscription(subscriptionParameters: SubscriptionParameters, data: UpgradeSubscriptionData): void {
		if (subscriptionParameters.type === "private") {
			// we have to individually change the data so that when returning we show the chose subscription type (private/business) | false = private, true = business
			data.options.businessUse(false)

			switch (subscriptionParameters.subscription) {
				case SubscriptionTypeParameter.FREE:
					this.selectFree(data)
					break

				case SubscriptionTypeParameter.PREMIUM:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.Premium)
					break

				case SubscriptionTypeParameter.TEAMS:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.Teams)
					break

				default:
					console.log("Unknown subscription passed: ", subscriptionParameters)
					break
			}
		} else if (subscriptionParameters.type === "business") {
			data.options.businessUse(true)

			switch (subscriptionParameters.subscription) {
				case SubscriptionTypeParameter.PREMIUM:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.PremiumBusiness)
					break

				case SubscriptionTypeParameter.TEAMS:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.TeamsBusiness)
					break

				case SubscriptionTypeParameter.PRO:
					this.setNonFreeDataAndGoToNextPage(data, SubscriptionType.Pro)
					break

				default:
					console.log("Unknown subscription passed: ", subscriptionParameters)
					break
			}
		} else {
			console.log("Unknown subscription type passed: ", subscriptionParameters)
		}
	}

	setNonFreeDataAndGoToNextPage(data: UpgradeSubscriptionData, subscriptionType: SubscriptionType): void {
		// Confirmation of paid subscription selection (click on subscription selector)
		if (this.__signupFreeTest) {
			this.__signupFreeTest.active = false
		}

		if (this.__signupPaidTest && this.upgradeType == UpgradeType.Signup) {
			this.__signupPaidTest.active = true
			this.__signupPaidTest.getStage(0).complete()
		}
		data.type = subscriptionType
		const { planPrices, options } = data
		data.price = String(planPrices.getSubscriptionPrice(options.paymentInterval(), data.type, UpgradePriceType.PlanActualPrice))
		let nextYear = String(planPrices.getSubscriptionPrice(options.paymentInterval(), data.type, UpgradePriceType.PlanNextYearsPrice))
		data.priceNextYear = data.price !== nextYear ? nextYear : null
		this.showNextPage()
	}

	createUpgradeButton(data: UpgradeSubscriptionData, subscriptionType: SubscriptionType): lazy<ButtonAttrs> {
		return () => ({
			label: "pricing.select_action",
			click: () => this.setNonFreeDataAndGoToNextPage(data, subscriptionType),
			type: ButtonType.Login,
		})
	}
}

function confirmFreeSubscription(): Promise<boolean> {
	return new Promise((resolve) => {
		let oneAccountValue = stream(false)
		let privateUseValue = stream(false)
		let dialog: Dialog

		const closeAction = (confirmed: boolean) => {
			dialog.close()
			setTimeout(() => resolve(confirmed), DefaultAnimationTime)
		}

		dialog = new Dialog(DialogType.Alert, {
			view: () => [
				// m(".h2.pb", lang.get("confirmFreeAccount_label")),
				m("#dialog-message.dialog-contentButtonsBottom.text-break.text-prewrap.selectable", lang.getMaybeLazy("freeAccountInfo_msg")),
				m(".dialog-contentButtonsBottom", [
					m(Checkbox, {
						label: () => lang.get("confirmNoOtherFreeAccount_msg"),
						checked: oneAccountValue(),
						onChecked: oneAccountValue,
					}),
					m(Checkbox, {
						label: () => lang.get("confirmPrivateUse_msg"),
						checked: privateUseValue(),
						onChecked: privateUseValue,
					}),
				]),
				m(".flex-center.dialog-buttons", [
					m(Button, {
						label: "cancel_action",
						click: () => closeAction(false),
						type: ButtonType.Secondary,
					}),
					m(Button, {
						label: "ok_action",
						click: () => {
							if (oneAccountValue() && privateUseValue()) {
								closeAction(true)
							}
						},
						type: ButtonType.Primary,
					}),
				]),
			],
		})
			.setCloseHandler(() => closeAction(false))
			.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: () => closeAction(false),
				help: "cancel_action",
			})
			.addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: () => closeAction(true),
				help: "ok_action",
			})
			.show()
	})
}

export class UpgradeSubscriptionPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData
	subscriptionType: string | null = null
	hideAllPagingButtons = true

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.data = upgradeData
	}

	headerTitle(): string {
		return lang.get("subscription_label")
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return isTutanotaDomain() && !(isApp() && client.isIos())
	}
}
