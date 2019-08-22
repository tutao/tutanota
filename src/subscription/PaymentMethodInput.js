// @flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {Country} from "../api/common/CountryList"
import {CountryType} from "../api/common/CountryList"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {CreditCardInput} from "./CreditCardInput"
import {PayPalLogo} from "../gui/base/icons/Icons"
import {load} from "../api/main/Entity"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {locator} from "../api/main/MainLocator"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {SubscriptionOptions} from "./SubscriptionUtils"
import {MessageBoxN} from "../gui/base/MessageBoxN"
import {px} from "../gui/size"

/**
 * Component to display the input fields for a payment method. The selector to switch between payment methods is not included.
 */
export class PaymentMethodInput {
	view: Function;
	_currentPaymentMethodComponent: Component;
	_creditCardComponent: CreditCardInput;
	_payPalComponent: Component;
	_invoiceComponent: Component;
	_selectedCountry: Stream<?Country>;
	_selectedPaymentMethod: PaymentMethodTypeEnum;
	_subscriptionOptions: SubscriptionOptions;
	_payPalRequestUrl: LazyLoaded<string>;
	_accountingInfo: AccountingInfo;
	oncreate: Function;
	onremove: Function;

	constructor(subscriptionOptions: SubscriptionOptions, selectedCountry: Stream<?Country>, accountingInfo: AccountingInfo, payPalRequestUrl: LazyLoaded<string>) {
		this._selectedCountry = selectedCountry
		this._subscriptionOptions = subscriptionOptions;
		this._creditCardComponent = new CreditCardInput()
		this._accountingInfo = accountingInfo;
		this._payPalRequestUrl = payPalRequestUrl


		const accountingInfoListener = (updates) => {
			return Promise.each(updates, update => {
				if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
					return load(AccountingInfoTypeRef, update.instanceId).then(accountingInfo => {
						this._accountingInfo = accountingInfo
						m.redraw()
					})
				}
			}).return()
		}
		this._payPalComponent = {
			view: () => {
				return [
					m(".flex-center", {style: {'margin-top': "50px"}},
						m("button.button-height.flex.items-center.plr.border.border-radius.bg-white", {
							title: "PayPal",
							style: {
								cursor: "pointer"
							},
							onclick: () => {
								if (this._payPalRequestUrl.isLoaded()) {
									window.open(this._payPalRequestUrl.getSync())
								} else {
									showProgressDialog("payPalRedirect_msg", this._payPalRequestUrl.getAsync())
										.then(url => window.open(url))
								}
							}
						}, m("img[src=" + PayPalLogo + "]")),
					),
					m(".small.pt.center", this.isPaypalAssigned() ? lang.get("paymentDataPayPalFinished_msg", {"{accountAddress}": this._accountingInfo.paymentMethodInfo}) : lang.get("paymentDataPayPalLogin_msg"))
				]
			},
		}

		this._invoiceComponent = {
			view: () => {
				return m(".flex-center", m(MessageBoxN, {
					style: {marginTop: px(16)},
				}, lang.get(this.isOnAccountAllowed() ? "paymentMethodOnAccount_msg" : "paymentMethodNotAvailable_msg")))
			}
		}

		this._currentPaymentMethodComponent = this._creditCardComponent
		this._selectedPaymentMethod = PaymentMethodType.CreditCard
		this.view = () => m(this._currentPaymentMethodComponent)
		this.oncreate = () => locator.eventController.addEntityListener(accountingInfoListener)
		this.onremove = () => locator.eventController.removeEntityListener(accountingInfoListener)
	}

	isPaypalAssigned(): boolean {
		return this._accountingInfo.paypalBillingAgreement != null
	}

	isOnAccountAllowed(): boolean {
		const country = this._selectedCountry()
		if (!country) {
			return false
		} else if (this._accountingInfo.paymentMethod === PaymentMethodType.Invoice) {
			return true
		} else if (this._subscriptionOptions.businessUse() && country.t !== CountryType.OTHER) {
			return true
		} else {
			return false
		}
	}

	validatePaymentData(): ?TranslationKey {
		const country = this._selectedCountry()
		if (!this._selectedPaymentMethod) {
			return "invoicePaymentMethodInfo_msg"
		} else if (this._selectedPaymentMethod === PaymentMethodType.Invoice) {
			if (!this.isOnAccountAllowed()) {
				return "paymentMethodNotAvailable_msg"
			}
		} else if (this._selectedPaymentMethod === PaymentMethodType.Paypal) {
			return this.isPaypalAssigned() ? null : "paymentDataPayPalLogin_msg"
		} else if (this._selectedPaymentMethod === PaymentMethodType.CreditCard) {
			let cc = this._creditCardComponent.getCreditCardData()
			if (cc.number === "") {
				return "creditCardNumberFormat_msg"
			} else if (cc.cardHolderName === "") {
				return "creditCardCardHolderName_msg"
			} else if (cc.cvv === "") {
				return "creditCardCVVFormat_label"
			} else if (cc.expirationMonth.length !== 2 || (cc.expirationYear.length !== 4
				&& cc.expirationYear.length !== 2)) {
				return "creditCardExprationDateInvalid_msg"
			}
		}
	}

	updatePaymentMethod(value: PaymentMethodTypeEnum, paymentData: ?PaymentData) {
		this._selectedPaymentMethod = value
		if (value === PaymentMethodType.CreditCard) {
			this._currentPaymentMethodComponent = this._creditCardComponent
			if (paymentData) {
				this._creditCardComponent.setCreditCardData(paymentData.creditCardData)
			}
		} else if (value === PaymentMethodType.Paypal) {
			this._payPalRequestUrl.getAsync().then(() => m.redraw())
			this._currentPaymentMethodComponent = this._payPalComponent
		} else if (value === PaymentMethodType.Invoice) {
			this._currentPaymentMethodComponent = this._invoiceComponent
		}
		m.redraw()
	}


	getPaymentData(): PaymentData {
		return {
			paymentMethod: this._selectedPaymentMethod,
			creditCardData: this._selectedPaymentMethod === PaymentMethodType.CreditCard ?
				this._creditCardComponent.getCreditCardData() : null,
		}
	}

	getVisiblePaymentMethods(): Array<{name: string, value: PaymentMethodTypeEnum}> {
		const availablePaymentMethods = [
			{name: lang.get("paymentMethodCreditCard_label"), value: PaymentMethodType.CreditCard},
			{name: "PayPal", value: PaymentMethodType.Paypal}
		]

		// show bank transfer in case of business use, even if it is not available for the selected country
		if (this._subscriptionOptions.businessUse() || this._accountingInfo.paymentMethod === PaymentMethodType.Invoice) {
			availablePaymentMethods.push({
				name: lang.get("paymentMethodOnAccount_label"),
				value: PaymentMethodType.Invoice
			})
		}
		return availablePaymentMethods
	}

}
