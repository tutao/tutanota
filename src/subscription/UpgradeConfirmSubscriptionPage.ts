import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import { formatPriceWithInfo, getPaymentMethodName, PaymentInterval } from "./PriceUtils"
import { createSwitchAccountTypePostIn } from "../api/entities/sys/TypeRefs.js"
import { AccountType, Const, PaidSubscriptionType, PaymentMethodTypeToName } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { BadGatewayError, PreconditionFailedError } from "../api/common/error/RestError"
import { logins } from "../api/main/LoginController"
import { getPreconditionFailedPaymentMsg, UpgradeType } from "./SubscriptionUtils"
import { Button, ButtonType } from "../gui/base/Button.js"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { TextField } from "../gui/base/TextField.js"
import { ofClass } from "@tutao/tutanota-utils"
import { locator } from "../api/main/MainLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { getDisplayNameOfSubscriptionType, SelectedSubscriptionOptions, SubscriptionType } from "./FeatureListProvider"

export class UpgradeConfirmSubscriptionPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement
	private __signupPaidTest?: UsageTest
	private __signupFreeTest?: UsageTest

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid")
		this.__signupFreeTest = locator.usageTestController.getTest("signup.free")

		this.dom = vnode.dom as HTMLElement
	}

	view({ attrs }: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		return this.renderConfirmSubscription(attrs)
	}

	private upgrade(data: UpgradeSubscriptionData) {
		const serviceData = createSwitchAccountTypePostIn({
			accountType: AccountType.PREMIUM,
			subscriptionType: this.subscriptionTypeToPaidSubscriptionType(data.type),
			date: Const.CURRENT_DATE,
			referralCode: data.referralCode,
		})
		showProgressDialog(
			"pleaseWait_msg",
			locator.serviceExecutor.post(SwitchAccountTypeService, serviceData).then(() => {
				return locator.customerFacade.switchFreeToPremiumGroup()
			}),
		)
			.then(() => {
				// Order confirmation (click on Buy), send selected payment method as an enum
				const orderConfirmationStage = this.__signupPaidTest?.getStage(5)
				orderConfirmationStage?.setMetric({
					name: "paymentMethod",
					value: PaymentMethodTypeToName[data.paymentData.paymentMethod],
				})
				orderConfirmationStage?.setMetric({
					name: "switchedFromFree",
					value: (this.__signupFreeTest?.isStarted() ?? false).toString(),
				})
				orderConfirmationStage?.complete()

				return this.close(data, this.dom)
			})
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					Dialog.message(
						() =>
							lang.get(getPreconditionFailedPaymentMsg(e.data)) +
							(data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
					)
				}),
			)
			.catch(
				ofClass(BadGatewayError, (e) => {
					Dialog.message(
						() =>
							lang.get("paymentProviderNotAvailableError_msg") +
							(data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
					)
				}),
			)
	}

	private renderConfirmSubscription(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		const isYearly = attrs.data.options.paymentInterval() === PaymentInterval.Yearly
		const subscription = isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label")

		return [
			m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			m(".pt.pb.plr-l", [
				m(TextField, {
					label: "subscription_label",
					value: getDisplayNameOfSubscriptionType(attrs.data.type),
					disabled: true,
				}),
				m(TextField, {
					label: "paymentInterval_label",
					value: subscription,
					disabled: true,
				}),
				m(TextField, {
					label: isYearly ? "priceFirstYear_label" : "price_label",
					value: buildPriceString(attrs.data.price, attrs.data.options),
					disabled: true,
				}),
				this.renderPriceNextYear(attrs),
				m(TextField, {
					label: "paymentMethod_label",
					value: getPaymentMethodName(attrs.data.paymentData.paymentMethod),
					disabled: true,
				}),
			]),
			m(
				".smaller.center.pt-l",
				attrs.data.options.businessUse()
					? lang.get("pricing.subscriptionPeriodInfoBusiness_msg")
					: lang.get("pricing.subscriptionPeriodInfoPrivate_msg"),
			),
			m(
				".flex-center.full-width.pt-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(Button, {
						label: "buy_action",
						click: () => this.upgrade(attrs.data),
						type: ButtonType.Login,
					}),
				),
			),
		]
	}

	private renderPriceNextYear(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		return attrs.data.priceNextYear
			? m(TextField, {
					label: "priceForNextYear_label",
					value: buildPriceString(attrs.data.priceNextYear, attrs.data.options),
					disabled: true,
			  })
			: null
	}

	private subscriptionTypeToPaidSubscriptionType(subscriptionType: SubscriptionType): PaidSubscriptionType {
		switch (subscriptionType) {
			case SubscriptionType.Premium:
				return PaidSubscriptionType.Premium
			case SubscriptionType.PremiumBusiness:
				return PaidSubscriptionType.Premium_Business
			case SubscriptionType.Teams:
				return PaidSubscriptionType.Teams
			case SubscriptionType.TeamsBusiness:
				return PaidSubscriptionType.Teams_Business
			case SubscriptionType.Pro:
				return PaidSubscriptionType.Pro
			default:
				throw new Error("not a valid Premium subscription type: " + subscriptionType)
		}
	}

	private close(data: UpgradeSubscriptionData, dom: HTMLElement) {
		let promise = Promise.resolve()

		if (data.newAccountData && logins.isUserLoggedIn()) {
			promise = logins.logout(false)
		}

		promise.then(() => {
			emitWizardEvent(dom, WizardEventType.SHOWNEXTPAGE)
		})
	}
}

function buildPriceString(price: NumberString, options: SelectedSubscriptionOptions): string {
	return formatPriceWithInfo(Number(price), options.paymentInterval(), !options.businessUse())
}
