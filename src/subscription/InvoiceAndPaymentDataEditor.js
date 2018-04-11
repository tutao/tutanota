// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {TextField} from "../gui/base/TextField"
import {Countries, CountryType} from "../api/common/CountryList"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentDataResultType, PaymentMethodType} from "../api/common/TutanotaConstants"
import {CreditCardInput} from "./CreditCardInput"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import MessageBox from "../gui/base/MessageBox"
import {PayPalLogo} from "../gui/base/icons/Icons"
import {neverNull} from "../api/common/utils/Utils"
import {worker} from "../api/main/WorkerClient"
import {Dialog} from "../gui/base/Dialog"

/**
 * Editor component for editing invoice and payment data. Can be used to edit only invoice data or only payment data or both of them at the same time.
 */
export class InvoiceAndPaymentDataEditor {
	view: Function;
	_selectedCountry: stream<?Country>;
	_selectedPaymentMethod: stream<SegmentControlItem<PaymentMethodTypeEnum>>;
	_availablePaymentMethods: Array<SegmentControlItem<PaymentMethodTypeEnum>>;
	_currentPaymentMethodComponent: Component;
	_creditCardComponent: Component;
	_payPalComponent: Component;
	_invoiceComponent: Component;
	_invoiceAddressComponent: HtmlEditor;
	_vatNumberField: TextField;
	_subscriptionOptions: SubscriptionOptions;

	constructor(subscriptionOptions: SubscriptionOptions, invoiceData: ?InvoiceData, paymentData: ?PaymentData) {
		this._subscriptionOptions = subscriptionOptions
		this._invoiceAddressComponent = new HtmlEditor()
			.setMinHeight(120)
			.showBorders()
			.setPlaceholderId("invoiceAddress_label")
			.setMode(Mode.HTML)
			.setHtmlMonospace(false)

		this._vatNumberField = new TextField("invoiceVatIdNo_label")

		const countries = Countries.map(c => ({value: c, name: c.n}))
		countries.push({value: null, name: lang.get("choose_label")});
		this._selectedCountry = stream(null)

		const countryInput = new DropDownSelector("invoiceCountry_label",
			() => lang.get("invoiceCountryInfoConsumer_msg"),
			countries,
			this._selectedCountry,
			250).setSelectionChangedHandler(value => {
			this._selectedCountry(value)
		})

		if (invoiceData) {
			this._invoiceAddressComponent.setValue(invoiceData.invoiceAddress)
			this._vatNumberField.setValue(invoiceData.vatNumber)
			this._selectedCountry(invoiceData.country)
		}

		this._creditCardComponent = new CreditCardInput()
		this._payPalComponent = {
			view: () => {
				return m(".flex-center", {style: {'margin-top': "50px"}},
					m(".button-height.flex.items-center.plr.border.border-radius", m("img[src=" + PayPalLogo + "]"))
				)
			}
		}

		const messageBox = new MessageBox(() => (this._selectedCountry() && this._selectedCountry().t == CountryType.OTHER) ? lang.get("paymentMethodNotAvailable_msg") : lang.get("paymentMethodOnAccount_msg"), "content-message-bg", 50)
		this._invoiceComponent = {
			view: () => {
				return m(".flex-center", m(messageBox))
			}
		}

		this._availablePaymentMethods = [
			{name: lang.get("paymentMethodCreditCard_label"), value: PaymentMethodType.CreditCard},
			{name: "PayPal", value: PaymentMethodType.Paypal},
		]


		if (subscriptionOptions.businessUse || (subscriptionOptions.businessUse && paymentData && paymentData.paymentMethod == PaymentMethodType.Invoice)) {
			this._availablePaymentMethods.push({
				name: lang.get("paymentMethodOnAccount_label"),
				value: PaymentMethodType.Invoice
			})
		}

		this._selectedPaymentMethod = stream(this._availablePaymentMethods[0])
		this._currentPaymentMethodComponent = this._creditCardComponent
		const paymentMethodControl = new SegmentControl(this._availablePaymentMethods, this._selectedPaymentMethod, 130)
			.setSelectionChangedHandler((newValue) => this._updatePaymentMethodComponent(newValue))

		if (paymentData) {
			const invoiceDataPaymentMethod = this._availablePaymentMethods.find(pm => pm.value == neverNull(paymentData).paymentMethod)
			if (invoiceDataPaymentMethod) {
				this._updatePaymentMethodComponent(invoiceDataPaymentMethod)
			}
		}

		this.view = () => m("#invoiceAndPaymentDataEditor", [
			paymentData ? m(paymentMethodControl) : null,
			m(".flex-space-around.flex-wrap" + (paymentData ? ".pt" : ""), [
				invoiceData ? m(".flex-grow-shrink-half" + (paymentData ? ".plr-l" : ""), {style: {minWidth: "240px"}}, [
						m(".pt", m(this._invoiceAddressComponent)),
						m(".small", lang.get(subscriptionOptions.businessUse ? "invoiceAddressInfoBusiness_msg" : "invoiceAddressInfoConsumer_msg")),
						m(countryInput),
						this._isVatIdFieldVisible() ? m(this._vatNumberField) : null
					]) :
					null,
				paymentData ? m(".flex-grow-shrink-half" + (invoiceData ? ".plr-l" : ""), {style: {minWidth: "240px"}}, m(this._currentPaymentMethodComponent)) : null
			])
		])
	}


	validateInvoiceData(): ?string {
		if (this._subscriptionOptions.businessUse) {
			if (this._invoiceAddressComponent.getValue().trim() == "" || (this._invoiceAddressComponent.getValue().match(/\n/g) || []).length > 3) {
				return "invoiceAddressInfoBusiness_msg"
			} else if (!this._selectedCountry()) {
				return "invoiceCountryInfoBusiness_msg"
			} else if (this._isVatIdFieldVisible() && this._vatNumberField.value().trim() == "") {
				return "invoiceVatIdNoInfoBusiness_msg"
			}
		} else {
			if (!this._selectedCountry()) {
				return "invoiceCountryInfoBusiness_msg" // use business text here because it fits better
			} else if ((this._invoiceAddressComponent.getValue().match(/\n/g) || []).length > 3) {
				return "invoiceAddressInfoBusiness_msg"
			}
		}
		// no error
		return null
	}

	validatePaymentData(): ?string {
		if (!this._selectedPaymentMethod()) {
			return "invoicePaymentMethodInfo_msg"
		} else if (this._selectedPaymentMethod().value == PaymentMethodType.Invoice) {
			if (this._subscriptionOptions.businessUse && this._selectedCountry().t == CountryType.OTHER) {
				return "paymentMethodNotAvailable_msg"
			} else if (!this._subscriptionOptions.businessUse) {
				return "paymentMethodNotAvailable_msg"
			}
		} else if (this._selectedPaymentMethod().value == PaymentMethodType.Paypal) {
			return "paymentMethodNotAvailable_msg"
		} else if (this._selectedPaymentMethod().value == PaymentMethodType.CreditCard) {
			return "paymentMethodNotAvailable_msg"
		}
	}

	_isVatIdFieldVisible(): boolean {
		return this._subscriptionOptions.businessUse && this._selectedCountry() != null && this._selectedCountry().t == CountryType.EU
	}

	_updatePaymentMethodComponent(v: SegmentControlItem<PaymentMethodTypeEnum>) {
		this._selectedPaymentMethod(v)
		if (v.value == PaymentMethodType.CreditCard) {
			this._currentPaymentMethodComponent = this._creditCardComponent
		} else if (v.value == PaymentMethodType.Paypal) {
			this._currentPaymentMethodComponent = this._payPalComponent
		} else if (v.value == PaymentMethodType.Invoice) {
			this._currentPaymentMethodComponent = this._invoiceComponent
		}
		m.redraw()
	}


	getInvoiceData(): InvoiceData {
		return {
			invoiceAddress: this._invoiceAddressComponent.getValue(),
			country: this._selectedCountry(),
			vatNumber: (this._selectedCountry() && this._selectedCountry().t == CountryType.EU) ? this._vatNumberField.value() : ""
		}
	}

	getPaymentData(): PaymentData {
		return {
			paymentMethod: this._selectedPaymentMethod().value,
			paymentMethodInfo: "",
			paymentToken: null,
			creditCardData: null,
			payPalData: null,
		}
	}

}


export function updatePaymentData(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedCountry: ?Country): Promise<boolean> {
	return worker.updatePaymentData(subscriptionOptions, invoiceData, paymentData, confirmedCountry).then(paymentResult => {
		const statusCode = paymentResult.result
		if (statusCode == PaymentDataResultType.OK) {
			return true;
		} else {
			if (statusCode == PaymentDataResultType.COUNTRY_MISMATCH) {
				const countryName = invoiceData.country ? invoiceData.country.n : ""
				const confirmMessage = lang.get("confirmCountry_msg", {"{1}": countryName})
				return Dialog.confirm(() => confirmMessage).then(confirmed => {
					if (confirmed) {
						return updatePaymentData(subscriptionOptions, invoiceData, paymentData, invoiceData.country)  // add confirmed invoice country
					} else {
						return false;
					}
				})
			} else {
				if (statusCode == PaymentDataResultType.INVALID_VATID_NUMBER) {
					Dialog.error("invalidVatIdNumber_msg")
				} else if (statusCode == PaymentDataResultType.CREDIT_CARD_DECLINED) {
					Dialog.error("creditCardNumberInvalid_msg");
				} else if (statusCode == PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
					Dialog.error("creditCardCVVInvalid_msg");
				} else if (statusCode == PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
					Dialog.error("paymentProviderNotAvailable_msg");
				} else if (statusCode == PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
					Dialog.error("paymentAccountRejected_msg");
				} else {
					Dialog.error("otherPaymentProviderError_msg");
				}
				return false
			}
		}
	})
}