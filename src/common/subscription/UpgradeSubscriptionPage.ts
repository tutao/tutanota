import m, { Children, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { lang } from "../misc/LanguageViewModel"
import type { SubscriptionParameters, UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { SubscriptionActionButtons, SubscriptionSelector } from "./SubscriptionSelector"
import { Button, ButtonType } from "../gui/base/Button.js"
import { UpgradeType } from "./SubscriptionUtils"
import { Dialog, DialogType } from "../gui/base/Dialog"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { Keys, PlanType, SubscriptionType } from "../api/common/TutanotaConstants"
import { Checkbox } from "../gui/base/Checkbox.js"
import { locator } from "../api/main/CommonLocator"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { UpgradePriceType } from "./FeatureListProvider"
import { asPaymentInterval, PaymentInterval } from "./PriceUtils.js"
import { lazy } from "@tutao/tutanota-utils"
import { LoginButtonAttrs } from "../gui/base/buttons/LoginButton.js"
import { stringToSubscriptionType } from "../misc/LoginUtils.js"

/** Subscription type passed from the website */
export const PlanTypeParameter = Object.freeze({
	FREE: "free",
	REVOLUTIONARY: "revolutionary",
	LEGEND: "legend",
	ESSENTIAL: "essential",
	ADVANCED: "advanced",
	UNLIMITED: "unlimited",
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
			const paymentInterval: PaymentInterval = subscriptionParameters.interval
				? asPaymentInterval(subscriptionParameters.interval)
				: PaymentInterval.Yearly
			// We automatically route to the next page; when we want to go back from the second page, we do not want to keep calling nextPage
			vnode.attrs.data.subscriptionParameters = null
			vnode.attrs.data.options.paymentInterval = stream(paymentInterval)
			this.goToNextPageWithPreselectedSubscription(subscriptionParameters, vnode.attrs.data)
		}
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const data = vnode.attrs.data
		let availablePlans = vnode.attrs.data.acceptedPlans
		// newAccountData is filled in when signing up and then going back in the signup process
		// If the user has selected a tuta.com address we want to prevent them from selecting a free plan at this point
		if (!!data.newAccountData && data.newAccountData.mailAddress.includes("tuta.com") && availablePlans.includes(PlanType.Free)) {
			availablePlans = availablePlans.filter((plan) => plan != PlanType.Free)
		}
		const subscriptionActionButtons: SubscriptionActionButtons = {
			[PlanType.Free]: () => {
				return {
					label: "pricing.select_action",
					onclick: () => this.selectFree(data),
				} as LoginButtonAttrs
			},
			[PlanType.Revolutionary]: this.createUpgradeButton(data, PlanType.Revolutionary),
			[PlanType.Legend]: this.createUpgradeButton(data, PlanType.Legend),
			[PlanType.Essential]: this.createUpgradeButton(data, PlanType.Essential),
			[PlanType.Advanced]: this.createUpgradeButton(data, PlanType.Advanced),
			[PlanType.Unlimited]: this.createUpgradeButton(data, PlanType.Unlimited),
		}
		return m("#upgrade-account-dialog.pt", [
			m(SubscriptionSelector, {
				options: data.options,
				priceInfoTextId: data.priceInfoTextId,
				boxWidth: 230,
				boxHeight: 270,
				acceptedPlans: availablePlans,
				allowSwitchingPaymentInterval: data.upgradeType !== UpgradeType.Switch,
				currentPlanType: data.currentPlan,
				actionButtons: subscriptionActionButtons,
				featureListProvider: vnode.attrs.data.featureListProvider,
				priceAndConfigProvider: vnode.attrs.data.planPrices,
				multipleUsersAllowed: vnode.attrs.data.multipleUsersAllowed,
				msg: data.msg,
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
				data.type = PlanType.Free
				data.price = "0"
				data.priceNextYear = "0"
				this.showNextPage()
			}
		})
	}

	showNextPage(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.SHOW_NEXT_PAGE)
		}
	}

	goToNextPageWithPreselectedSubscription(subscriptionParameters: SubscriptionParameters, data: UpgradeSubscriptionData): void {
		let subscriptionType: SubscriptionType | null
		try {
			subscriptionType = subscriptionParameters.type == null ? null : stringToSubscriptionType(subscriptionParameters.type)
		} catch (e) {
			subscriptionType = null
		}

		if (subscriptionType === SubscriptionType.Personal || subscriptionType === SubscriptionType.PaidPersonal) {
			// we have to individually change the data so that when returning we show the chose subscription type (private/business) | false = private, true = business
			data.options.businessUse(false)

			switch (subscriptionParameters.subscription) {
				case PlanTypeParameter.FREE:
					this.selectFree(data)
					break

				case PlanTypeParameter.REVOLUTIONARY:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Revolutionary)
					break

				case PlanTypeParameter.LEGEND:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Legend)
					break

				default:
					console.log("Unknown subscription passed: ", subscriptionParameters)
					break
			}
		} else if (subscriptionType === SubscriptionType.Business) {
			data.options.businessUse(true)

			switch (subscriptionParameters.subscription) {
				case PlanTypeParameter.ESSENTIAL:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Essential)
					break

				case PlanTypeParameter.ADVANCED:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Advanced)
					break

				case PlanTypeParameter.UNLIMITED:
					this.setNonFreeDataAndGoToNextPage(data, PlanType.Unlimited)
					break

				default:
					console.log("Unknown subscription passed: ", subscriptionParameters)
					break
			}
		} else {
			console.log("Unknown subscription type passed: ", subscriptionParameters)
		}
	}

	setNonFreeDataAndGoToNextPage(data: UpgradeSubscriptionData, planType: PlanType): void {
		// Confirmation of paid subscription selection (click on subscription selector)
		if (this.__signupFreeTest) {
			this.__signupFreeTest.active = false
		}

		if (this.__signupPaidTest && this.upgradeType == UpgradeType.Signup) {
			this.__signupPaidTest.active = true
			this.__signupPaidTest.getStage(0).complete()
		}
		data.type = planType
		const { planPrices, options } = data
		try {
			// `data.price` is used for the amount parameter in the Braintree credit card verification call, so we do not include currency locale outside iOS.
			const subscriptionPrice = planPrices.getSubscriptionPriceWithCurrency(options.paymentInterval(), data.type, UpgradePriceType.PlanActualPrice)
			data.price = subscriptionPrice.rawPrice
			data.displayPrice = subscriptionPrice.displayPrice
			const nextYear = planPrices.getSubscriptionPriceWithCurrency(options.paymentInterval(), data.type, UpgradePriceType.PlanNextYearsPrice).displayPrice
			data.priceNextYear = data.price !== nextYear ? nextYear : null
		} catch (e) {
			console.error(e)
			Dialog.message("appStoreNotAvailable_msg")
			return
		}
		this.showNextPage()
	}

	createUpgradeButton(data: UpgradeSubscriptionData, planType: PlanType): lazy<LoginButtonAttrs> {
		return () => ({
			label: "pricing.select_action",
			onclick: () => this.setNonFreeDataAndGoToNextPage(data, planType),
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
		const isFormValid = () => oneAccountValue() && privateUseValue()
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
							if (isFormValid()) closeAction(true)
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
				exec: () => {
					if (isFormValid()) closeAction(true)
				},
				help: "ok_action",
			})
			.show()
	})
}

export class UpgradeSubscriptionPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData

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
		return true
	}
}
