// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {updatePaymentData} from "./InvoiceAndPaymentDataPage"
import {BadRequestError} from "../api/common/error/RestError"

export function show(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, infoMessageId: ?string): Dialog {

	const invoiceDataInput = new InvoiceDataInput(subscriptionOptions, invoiceData)

	const confirmAction = () => {
		let error = invoiceDataInput.validateInvoiceData()
		if (error) {
			Dialog.error(error)
		} else {
			updatePaymentData(subscriptionOptions, invoiceDataInput.getInvoiceData(), null, null).then(success => {
				if (success) {
					dialog.close()
				}
			}).catch(BadRequestError, e => {
				Dialog.error("paymentMethodNotAvailable_msg")
			})
		}
	}

	const dialog = Dialog.smallActionDialog(lang.get("invoiceData_msg"), {
		view: () => m("#changeInvoiceDataDialog", [
			infoMessageId ? m(".pt", lang.get(infoMessageId)) : null,
			m(invoiceDataInput),
		])
	}, confirmAction, true, "save_action")
	return dialog
}