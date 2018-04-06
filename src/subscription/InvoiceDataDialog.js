// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {TextField} from "../gui/base/TextField"
import {Countries, CountryType, getByAbbreviation} from "../api/common/CountryList"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentMethodType, PaymentDataResultType} from "../api/common/TutanotaConstants"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Button, ButtonType} from "../gui/base/Button"
import {Keys} from "../misc/KeyManager"
import {CreditCardInput} from "./CreditCardInput"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import MessageBox from "../gui/base/MessageBox"
import {PayPalLogo} from "../gui/base/icons/Icons"
import {worker} from "../api/main/WorkerClient"
import {neverNull} from "../api/common/utils/Utils"

export function show(subscriptionOptions: SubscriptionOptions, accountingInfo: ?AccountingInfo, confirmActionId: string = "next_action"): Promise<?InvoiceData> {

	const invoiceName = new TextField("invoiceRecipient_label", () => subscriptionOptions.businessUse ? lang.get("invoiceAddressInfoBusiness_msg") : lang.get("invoiceAddressInfoConsumer_msg"))
	invoiceName.setValue(accountingInfo ? accountingInfo.invoiceName : "")
	const invoiceAddress = new HtmlEditor()
		.setMinHeight(120)
		.showBorders()
		.setPlaceholderId("invoiceAddress_label")
		.setMode(Mode.HTML)
		.setHtmlMonospace(false)
	invoiceAddress.setValue(accountingInfo ? accountingInfo.invoiceAddress : "")

	const vatNumber = new TextField("invoiceVatIdNo_label")
	vatNumber.setValue(accountingInfo ? accountingInfo.invoiceVatIdNo : "")

	const countries = Countries.map(c => ({value: c, name: c.n}))
	countries.push({value: null, name: lang.get("choose_label")});
	const country: stream<?Country> = stream((accountingInfo && accountingInfo.invoiceCountry) ? getByAbbreviation(accountingInfo.invoiceCountry) : null)

	const countryInput = new DropDownSelector("invoiceCountry_label",
		() => lang.get("invoiceCountryInfoConsumer_msg"),
		countries,
		country,
		250).setSelectionChangedHandler(value => {
		country(value)
	})

	const creditCardComponent = new CreditCardInput()
	const payPalComponent = {
		view: () => {
			return m(".flex-center", {style: {'margin-top': "100px"}},
				m(".button-height.flex.items-center.plr.border.border-radius", m("img[src=" + PayPalLogo + "]"))
			)
		}
	}

	const messageBox = new MessageBox(() => (country() && country().t == CountryType.OTHER) ? lang.get("paymentMethodNotAvailable_msg") : lang.get("paymentMethodOnAccount_msg"))
	const invoiceComponent = {
		view: () => {
			return m(".flex-center", m(messageBox))
		}
	}

	const paymentMethods = [
		{name: lang.get("paymentMethodCreditCard_label"), value: PaymentMethodType.CreditCard},
		{name: "PayPal", value: PaymentMethodType.Paypal}
	]
	if (subscriptionOptions.businessUse || (subscriptionOptions.businessUse && accountingInfo && accountingInfo.paymentMethod == PaymentMethodType.Invoice)) {
		paymentMethods.push({name: lang.get("paymentMethodOnAccount_label"), value: PaymentMethodType.Invoice})
	}

	const paymentMethod = stream(paymentMethods[0])
	let currentPaymentMethodComponent: Component = creditCardComponent
	const updatePaymentMethodComponent = (v: SegmentControlItem<PaymentMethodTypeEnum>) => {
		paymentMethod(v)
		if (v.value == PaymentMethodType.CreditCard) {
			currentPaymentMethodComponent = creditCardComponent
		} else if (v.value == PaymentMethodType.Paypal) {
			currentPaymentMethodComponent = payPalComponent
		} else if (v.value == PaymentMethodType.Invoice) {
			currentPaymentMethodComponent = invoiceComponent
		}
		m.redraw()
	}
	const paymentMethodControl = new SegmentControl(paymentMethods, paymentMethod, 130).setSelectionChangedHandler(updatePaymentMethodComponent)

	if (accountingInfo && accountingInfo.paymentMethod) {
		const accountingInfoPaymentMethod = paymentMethods.find(pm => pm.value == neverNull(accountingInfo).paymentMethod)
		if (accountingInfoPaymentMethod) {
			console.log("accounting info payment method", accountingInfoPaymentMethod)
			updatePaymentMethodComponent(accountingInfoPaymentMethod)
		}
	}

	const showVatIdNoField = (): boolean => subscriptionOptions.businessUse && country() != null && country().t == CountryType.EU

	const validateInvoiceData = (): ?string => {
		if (subscriptionOptions.businessUse) {
			if (invoiceName.value().trim() == "") {
				return "invoiceRecipientInfoBusiness_msg";
			} else if (invoiceAddress.getValue().trim() == "" || (invoiceAddress.getValue().match(/\n/g) || []).length > 3) {
				return "invoiceAddressInfoBusiness_msg"
			} else if (!country()) {
				return "invoiceCountryInfoBusiness_msg"
			} else if (showVatIdNoField() && vatNumber.value().trim() == "") {
				return "invoiceVatIdNoInfoBusiness_msg"
			} else if (!paymentMethod()) {
				return "invoicePaymentMethodInfo_msg"
			} else if (paymentMethod().value == PaymentMethodType.Invoice && country().t == CountryType.OTHER) {
				return "paymentMethodNotAvailable_msg"
			}
		} else {
			if (!country()) {
				return "invoiceCountryInfoBusiness_msg" // use business text here because it fits better
			} else if (!paymentMethod()) {
				return "invoicePaymentMethodInfo_msg"
			} else if ((invoiceAddress.getValue().match(/\n/g) || []).length > 3) {
				return "invoiceAddressInfoBusiness_msg"
			}
		}
		// no error
		return null
	}

	return Promise.fromCallback(callback => {
		const cancelAction = () => {
			dialog.close()
			callback(null, null)
		}
		const confirmAction = () => {
			let error = validateInvoiceData()
			if (error) {
				Dialog.error(error)
			} else {
				const invoiceData: InvoiceData = {
					invoiceName: invoiceName.value(),
					invoiceAddress: invoiceAddress.getValue(),
					country: country(),
					vatNumber: (country() && country().t == CountryType.EU) ? vatNumber.value() : "",
					paymentMethod: paymentMethod().value,
					paymentMethodInfo: "", //TODO set paymentMethodInfo
					creditCardData: null, // TODO collect credit card and PayPal data
					payPalData: null
				}
				updatePaymentData(subscriptionOptions, invoiceData, null).then(confirmedInvoiceData => {
					if (confirmedInvoiceData) {
						dialog.close()
						callback(null, invoiceData)
					}
				})
			}
		}
		const headerBar = new DialogHeaderBar()
			.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("adminPayment_action"))
			.addRight(new Button(confirmActionId, confirmAction).setType(ButtonType.Primary))
		const dialog = Dialog.largeDialog(headerBar, {
			//let dialog = new Dialog(DialogType.EditSmall, {
			view: () => m("#upgrade-account-dialog.pt", [
				m(paymentMethodControl),
				m(".flex-space-around.flex-wrap", [
					m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "240px"}}, [
						m(invoiceName),
						m(".pt", m(invoiceAddress)),
						m(countryInput),
						showVatIdNoField() ? m(vatNumber) : null
					]),
					m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "240px"}}, m(currentPaymentMethodComponent))
				])
			])
		})
		dialog.addShortcut({
			key: Keys.ESC,
			exec: cancelAction,
			help: "closeDialog_msg"
		})

		dialog.show()
	})
}

function updatePaymentData(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, confirmedCountry: Country): Promise<?InvoiceData> {
	return worker.updatePaymentData(subscriptionOptions, invoiceData, confirmedCountry).then(paymentResult => {
		const statusCode = paymentResult.result
		if (statusCode == PaymentDataResultType.OK) {
			return invoiceData;
		} else {
			if (statusCode == PaymentDataResultType.COUNTRY_MISMATCH) {
				const countryName = invoiceData.country.n
				const confirmMessage = lang.get("confirmCountry_msg", {"{1}": countryName})
				return Dialog.confirm(() => confirmMessage).then(confirmed => {
					if (confirmed) {
						return updatePaymentData(subscriptionOptions, invoiceData, invoiceData.country)  // add confirmed invoice country
					} else {
						return null;
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
				return null
			}
		}
	})
}