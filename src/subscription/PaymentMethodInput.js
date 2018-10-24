// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import type {Country} from "../api/common/CountryList"
import {CountryType} from "../api/common/CountryList"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {CreditCardInput} from "./CreditCardInput"
import MessageBox from "../gui/base/MessageBox"
import {PayPalLogo} from "../gui/base/icons/Icons"
import {load} from "../api/main/Entity"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {locator} from "../api/main/MainLocator"
import {neverNull} from "../api/common/utils/Utils"
import {isUpdateForTypeRef} from "../api/main/EntityEventController"

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
			for (let update of updates) {
				if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
					load(AccountingInfoTypeRef, update.instanceId).then(accountingInfo => {
						this._accountingInfo = accountingInfo
						m.redraw()
					})
				}
			}
		}
		this._payPalComponent = {
			view: () => {
				return [
					m(".flex-center", {style: {'margin-top': "50px"}},
						m(".button-height.flex.items-center.plr.border.border-radius", {
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
					m(".small.pt.center", this.isPaypalAssigned() ? lang.get("paymentDataPayPalFinished_msg", {"{accountAddress}": neverNull(this._accountingInfo).paymentMethodInfo}) : lang.get("paymentDataPayPalLogin_msg"))
				]
			},
		}
		const messageBox = new MessageBox(() => {
			const country = this._selectedCountry()
			return country && country.t === CountryType.OTHER
				? lang.get("paymentMethodNotAvailable_msg")
				: lang.get("paymentMethodOnAccount_msg")
		}, "content-message-bg", 16)
		this._invoiceComponent = {
			view: () => {
				return m(".flex-center", m(messageBox))
			}
		}

		this._currentPaymentMethodComponent = this._creditCardComponent
		this._selectedPaymentMethod = PaymentMethodType.CreditCard
		this.view = () => m(this._currentPaymentMethodComponent)
		this.oncreate = () => locator.entityEvent.addListener(accountingInfoListener)
		this.onremove = () => locator.entityEvent.removeListener(accountingInfoListener)
	}

	isPaypalAssigned() {
		return this._accountingInfo && this._accountingInfo.paypalBillingAgreement != null
	}

	validatePaymentData(): ?string {
		const country = this._selectedCountry()
		if (!this._selectedPaymentMethod) {
			return "invoicePaymentMethodInfo_msg"
		} else if (this._selectedPaymentMethod === PaymentMethodType.Invoice) {
			if (this._subscriptionOptions.businessUse && country && country.t === CountryType.OTHER) {
				return "paymentMethodNotAvailable_msg"
			} else if (!this._subscriptionOptions.businessUse) {
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
			} else if (cc.cvv = "") {
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

	getAvailablePaymentMethods(): Array<{name: string, value: PaymentMethodTypeEnum}> {
		const availablePaymentMethods = [
			{name: lang.get("paymentMethodCreditCard_label"), value: PaymentMethodType.CreditCard},
			{name: "PayPal", value: PaymentMethodType.Paypal}
		]

		if (this._subscriptionOptions.businessUse) {
			availablePaymentMethods.push({
				name: lang.get("paymentMethodOnAccount_label"),
				value: PaymentMethodType.Invoice
			})
		}
		return availablePaymentMethods
	}

}
