import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang, MaybeTranslation, type TranslationKey } from "../misc/LanguageViewModel"
import { formatPrice, formatPriceWithInfo, getPaymentMethodName, PaymentInterval } from "./utils/PriceUtils"
import { createSwitchAccountTypePostIn } from "../api/entities/sys/TypeRefs.js"
import { AccountType, Const, PaymentMethodType } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { BadGatewayError, PreconditionFailedError } from "../api/common/error/RestError"
import { appStorePlanName, getPreconditionFailedPaymentMsg, SubscriptionApp, UpgradeType } from "./utils/SubscriptionUtils"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { TextField } from "../gui/base/TextField.js"
import { base64ExtToBase64, base64ToUint8Array, neverNull, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../api/main/CommonLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services"
import { getDisplayNameOfPlanType, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { MobilePaymentResultType } from "../native/common/generatedipc/MobilePaymentResultType"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { SessionType } from "../api/common/SessionType"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError.js"
import { client } from "../misc/ClientDetector.js"
import { DateTime } from "luxon"
import { formatDate } from "../misc/Formatter.js"
import { ReferralType, SignupFlowStage, SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils.js"
import { completeUpgradeStage } from "../ratings/UserSatisfactionUtils"

export class UpgradeConfirmSubscriptionPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {
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
			plan: data.targetPlanType,
			date: Const.CURRENT_DATE,
			referralCode: data.referralData?.code ?? null,
			specialPriceUserSingle: null,
			surveyData: null,
			app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail,
		})
		showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SwitchAccountTypeService, serviceData))
			.then(() => {
				// Order confirmation (click on Buy), send selected payment method as an enum

				return this.close(data, this.dom)
			})
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					Dialog.message(
						lang.makeTranslation(
							"precondition_failed",
							lang.get(getPreconditionFailedPaymentMsg(e.data)) +
								(data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
						),
					)
				}),
			)
			.catch(
				ofClass(BadGatewayError, (e) => {
					Dialog.message(
						lang.makeTranslation(
							"payment_failed",
							lang.get("paymentProviderNotAvailableError_msg") +
								(data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
						),
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
				locator.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(data.targetPlanType), data.options.paymentInterval(), customerIdBytes),
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

		return await updatePaymentData(
			data.options.paymentInterval(),
			data.invoiceData,
			data.paymentData,
			null,
			data.newAccountData != null,
			null,
			data.accountingInfo!,
		)
	}

	private renderConfirmSubscription(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		const isYearly = attrs.data.options.paymentInterval() === PaymentInterval.Yearly
		const subscription = isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label")

		const isFirstMonthForFree = attrs.data.planPrices.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly
		const isAppStorePayment = attrs.data.paymentData.paymentMethod === PaymentMethodType.AppStore

		return [
			m(".center.h4.pt-16", lang.get("upgradeConfirm_msg")),
			m(".pt-16.pb-16.plr-24", [
				m(TextField, {
					label: "subscription_label",
					value: getDisplayNameOfPlanType(attrs.data.targetPlanType),
					isReadOnly: true,
				}),
				m(TextField, {
					label: "paymentInterval_label",
					value: subscription,
					isReadOnly: true,
				}),
				!isAppStorePayment &&
					m.fragment({}, [
						isFirstMonthForFree &&
							m(TextField, {
								label: lang.getTranslation("priceTill_label", {
									"{date}": formatDate(DateTime.now().plus({ month: 1 }).toJSDate()),
								}),
								value: formatPrice(0, true),
								isReadOnly: true,
							}),
						m(TextField, {
							label: this.buildPriceLabel(isYearly, attrs),
							value: buildPriceString(attrs.data.price?.displayPrice ?? "0", attrs.data.options),
							isReadOnly: true,
						}),
						this.renderPriceNextYear(attrs),
					]),

				m(TextField, {
					label: "paymentMethod_label",
					value: getPaymentMethodName(attrs.data.paymentData.paymentMethod),
					isReadOnly: true,
				}),
			]),
			m(
				".smaller.center.pt-32",
				attrs.data.options.businessUse()
					? lang.get("pricing.subscriptionPeriodInfoBusiness_msg")
					: lang.get("pricing.subscriptionPeriodInfoPrivate_msg"),
			),
			m(
				".flex-center.full-width.pt-32",
				m(LoginButton, {
					label: isAppStorePayment ? "checkoutWithAppStore_action" : "buy_action",
					class: "small-login-button",
					onclick: () => this.upgrade(attrs.data),
				}),
			),
		]
	}

	private renderPriceNextYear(attrs: WizardPageAttrs<UpgradeSubscriptionData>) {
		return attrs.data.nextYearPrice
			? m(TextField, {
					label: "priceForNextYear_label",
					value: buildPriceString(attrs.data.nextYearPrice.displayPrice, attrs.data.options),
					isReadOnly: true,
				})
			: null
	}

	private buildPriceLabel(isYearly: boolean, { data: { nextYearPrice, planPrices } }: WizardPageAttrs<UpgradeSubscriptionData>): MaybeTranslation {
		if (planPrices.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly) {
			return lang.getTranslation("priceFrom_label", {
				"{date}": formatDate(
					DateTime.now()
						.plus({
							month: 1,
							day: 1,
						})
						.toJSDate(),
				),
			})
		}

		if (isYearly && nextYearPrice) {
			return "priceFirstYear_label"
		}

		return "price_label"
	}

	private close(data: UpgradeSubscriptionData, dom: HTMLElement) {
		emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
	}
}

export class UpgradeConfirmSubscriptionPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData
	_enabled: () => boolean = () => true

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.data = upgradeData
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		let referralConversion: ReferralType = "not_referred"
		if (this.data.referralData && this.data.referralData.isCalledBySatisfactionDialog) referralConversion = "satisfactiondialog_referral"
		else if (this.data.referralData && !this.data.referralData.isCalledBySatisfactionDialog) referralConversion = "organic_referral"
		SignupFlowUsageTestController.completeStage(
			SignupFlowStage.CONFIRM_PAYMENT,
			this.data.targetPlanType,
			this.data.options.paymentInterval(),
			this.data.paymentData.paymentMethod,
			referralConversion,
		)

		if (this.data.isCalledBySatisfactionDialog) {
			completeUpgradeStage(this.data.currentPlan!, this.data.targetPlanType)
		}

		return Promise.resolve(true)
	}

	prevAction(showErrorDialog: boolean): Promise<boolean> {
		SignupFlowUsageTestController.deletePing(SignupFlowStage.SELECT_PAYMENT_METHOD)
		return Promise.resolve(true)
	}

	headerTitle(): TranslationKey {
		return "adminPayment_action"
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return this._enabled()
	}

	/**
	 * Set the enabled function for isEnabled
	 * @param enabled
	 */
	setEnabledFunction<T>(enabled: () => boolean) {
		this._enabled = enabled
	}
}

function buildPriceString(price: string, options: SelectedSubscriptionOptions): string {
	return formatPriceWithInfo(price, options.paymentInterval(), !options.businessUse())
}
