// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {getByAbbreviation} from "../api/common/CountryList"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {PaymentMethodInput} from "./PaymentMethodInput"
import {updatePaymentData} from "./InvoiceAndPaymentDataPage"
import {px} from "../gui/size"
import {formatNameAndAddress} from "../misc/Formatter"

export function show(accountingInfo: AccountingInfo): Dialog {

	let invoiceData = {
		invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
		country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
		vatNumber: accountingInfo.invoiceVatIdNo
	}

	const subscriptionOptions = {
		businessUse: accountingInfo.business,
		paymentInterval: Number(accountingInfo.paymentInterval)
	}

	const paymentMethodInput = new PaymentMethodInput(subscriptionOptions, stream(invoiceData.country), accountingInfo)
	const availablePaymentMethods = paymentMethodInput.getAvailablePaymentMethods()

	const selectedPaymentMethod: stream<PaymentMethodTypeEnum> = stream(availablePaymentMethods[0].value)

	const paymentMethodSelector = new DropDownSelector("paymentMethod_label",
		null,
		availablePaymentMethods,
		selectedPaymentMethod,
		250)

	paymentMethodSelector.setSelectionChangedHandler(value => {
		selectedPaymentMethod(value)
		paymentMethodInput.updatePaymentMethod(value)
	})


	const confirmAction = () => {
		let error = paymentMethodInput.validatePaymentData()
		if (error) {
			Dialog.error(error)
		} else {
			updatePaymentData(subscriptionOptions, invoiceData, paymentMethodInput.getPaymentData(), invoiceData.country).then(success => {
				if (success) {
					dialog.close()
				}
			})
		}
	}

	const dialog = Dialog.smallActionDialog(lang.get("adminPayment_action"), {
		view: () => m("#changePaymentDataDialog", {style: {minHeight: px(310)}}, [
			m(paymentMethodSelector),
			m(paymentMethodInput),
		])
	}, confirmAction, true, "save_action")
	return dialog
}
