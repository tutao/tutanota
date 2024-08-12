import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import { formatPriceWithInfo, getPaymentMethodName, PaymentInterval } from "./PriceUtils"
import { createSwitchAccountTypePostIn } from "../api/entities/sys/TypeRefs.js"
import { AccountType, Const, PaymentMethodType, PaymentMethodTypeToName } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { BadGatewayError, PreconditionFailedError } from "../api/common/error/RestError"
import { appStorePlanName, getPreconditionFailedPaymentMsg, UpgradeType } from "./SubscriptionUtils"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { TextField } from "../gui/base/TextField.js"
import { base64ExtToBase64, base64ToUint8Array, neverNull, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../api/main/CommonLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { getDisplayNameOfPlanType, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { MobilePaymentResultType } from "../native/common/generatedipc/MobilePaymentResultType"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { SessionType } from "../api/common/SessionType"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError.js"

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

	private async upgrade(data: UpgradeSubscriptionData) {
		// We return early because we do the upgrade after the user has submitted payment which is on the confirmation page
		if (data.paymentData.paymentMethod === PaymentMethodType.AppStore) {
			const success = await this.handleAppStorePayment(data)
			if (!success) {
				return
			}
		}

		const serviceData = createSwitchAccountTypePostIn({
			accountType: AccountType.PAID,
			customer: null,
			plan: data.type,
			date: Const.CURRENT_DATE,
			referralCode: data.referralCode,
			specialPriceUserSingle: null,
			surveyData: null,
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

	/** @return whether subscribed successfully */
	private async handleAppStorePayment(data: UpgradeSubscriptionData): Promise<boolean> {
		if (!locator.logins.isUserLoggedIn()) {
			await locator.logins.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary)
		}

		const customerId = locator.logins.getUserController().user.customer!
		const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId))

		try {
			const result = await showProgressDialog(
				"pleaseWait_msg",
				locator.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(data.type), data.options.paymentInterval(), customerIdBytes),
			)
			if (result.result !== MobilePaymentResultType.Success) {
				return false
			}
		} catch (e) {
			if (e instanceof MobilePaymentError) {
				console.error("AppStore subscription failed", e)
				Dialog.message("appStoreSubscriptionError_msg", e.message)
				return false
			} else {
				throw e
			}
		}

		const success = await updatePaymentData(
			data.options.paymentInterval(),
			data.invoiceData,
			data.paymentData,
			null,
			data.newAccountData != null,
			null,
			data.accountingInfo!,
		)

		if (success) {
			await locator.appStorePaymentPicker.markSubscribedStageAsComplete()
		}

		return success
	}

	private renderConfirmSubscription(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		const isYearly = attrs.data.options.paymentInterval() === PaymentInterval.Yearly
		const subscription = isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label")

		return [
			m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
			m(".pt.pb.plr-l", [
				m(TextField, {
					label: "subscription_label",
					value: getDisplayNameOfPlanType(attrs.data.type),
					isReadOnly: true,
				}),
				m(TextField, {
					label: "paymentInterval_label",
					value: subscription,
					isReadOnly: true,
				}),
				m(TextField, {
					label: isYearly ? "priceFirstYear_label" : "price_label",
					value: buildPriceString(attrs.data.displayPrice, attrs.data.options),
					isReadOnly: true,
				}),
				this.renderPriceNextYear(attrs),
				m(TextField, {
					label: "paymentMethod_label",
					value: getPaymentMethodName(attrs.data.paymentData.paymentMethod),
					isReadOnly: true,
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
					m(LoginButton, {
						label: "buy_action",
						onclick: () => this.upgrade(attrs.data),
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
					isReadOnly: true,
			  })
			: null
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

function buildPriceString(price: string, options: SelectedSubscriptionOptions): string {
	return formatPriceWithInfo(price, options.paymentInterval(), !options.businessUse())
}
