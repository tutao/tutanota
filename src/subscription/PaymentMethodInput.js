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

/**
 * Component to display the input fields for a payment method. The selector to switch between payment methods is not included.
 */
export class PaymentMethodInput {
	view: Function;
	_currentPaymentMethodComponent: Component;
	_creditCardComponent: CreditCardInput;
	_payPalComponent: Component;
	_invoiceComponent: Component;
	_selectedCountry: stream<?Country>;
	_selectedPaymentMethod: PaymentMethodTypeEnum;
	_subscriptionOptions: SubscriptionOptions;

	constructor(subscriptionOptions: SubscriptionOptions, selectedCountry: stream<?Country>) {
		this._selectedCountry = selectedCountry
		this._subscriptionOptions = subscriptionOptions;
		this._creditCardComponent = new CreditCardInput()
		this._payPalComponent = {
			view: () => {
				return [m(".flex-center", {style: {'margin-top': "50px"}},
					m(".button-height.flex.items-center.plr.border.border-radius", {
						style: {
							cursor: "pointer"
						}
					}, m("img[src=" + PayPalLogo + "]")),
				), m(".small.pt.center", lang.get("paymentDataPayPalLogin_msg"))]
			}
		}
		const messageBox = new MessageBox(() => (this._selectedCountry() && this._selectedCountry().t == CountryType.OTHER) ? lang.get("paymentMethodNotAvailable_msg") : lang.get("paymentMethodOnAccount_msg"), "content-message-bg", 16)
		this._invoiceComponent = {
			view: () => {
				return m(".flex-center", m(messageBox))
			}
		}
		this._currentPaymentMethodComponent = this._creditCardComponent
		this._selectedPaymentMethod = PaymentMethodType.CreditCard
		this.view = () => m(this._currentPaymentMethodComponent)
	}

	validatePaymentData(): ?string {
		if (!this._selectedPaymentMethod) {
			return "invoicePaymentMethodInfo_msg"
		} else if (this._selectedPaymentMethod == PaymentMethodType.Invoice) {
			if (this._subscriptionOptions.businessUse && this._selectedCountry().t == CountryType.OTHER) {
				return "paymentMethodNotAvailable_msg"
			} else if (!this._subscriptionOptions.businessUse) {
				return "paymentMethodNotAvailable_msg"
			}
		} else if (this._selectedPaymentMethod == PaymentMethodType.Paypal) {
			return "paymentMethodNotAvailable_msg"
		} else if (this._selectedPaymentMethod == PaymentMethodType.CreditCard) {
			return "paymentMethodNotAvailable_msg"
		}
	}

	updatePaymentMethod(value: PaymentMethodTypeEnum, paymentData: ?PaymentData) {
		this._selectedPaymentMethod = value
		if (value == PaymentMethodType.CreditCard) {
			this._currentPaymentMethodComponent = this._creditCardComponent
			if (paymentData) {
				this._creditCardComponent.setCreditCardData(paymentData.creditCardData)
			}
		} else if (value == PaymentMethodType.Paypal) {
			this._currentPaymentMethodComponent = this._payPalComponent
		} else if (value == PaymentMethodType.Invoice) {
			this._currentPaymentMethodComponent = this._invoiceComponent
		}
		m.redraw()
	}


	getPaymentData(): PaymentData {
		return {
			paymentMethod: this._selectedPaymentMethod,
			paymentMethodInfo: "",
			paymentToken: null,
			creditCardData: this._selectedPaymentMethod == PaymentMethodType.CreditCard ? this._creditCardComponent.getCreditCardData() : null,
			payPalData: null,
		}
	}

	getAvailablePaymentMethods(): Array<{name:string, value:PaymentMethodTypeEnum}> {
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
