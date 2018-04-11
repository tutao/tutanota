// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InvoiceAndPaymentDataEditor, updatePaymentData} from "./InvoiceAndPaymentDataEditor"

export function show(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData): Dialog {

	const invoiceEditor = new InvoiceAndPaymentDataEditor(subscriptionOptions, invoiceData, null)

	const confirmAction = () => {
		let error = invoiceEditor.validateInvoiceData()
		if (error) {
			Dialog.error(error)
		} else {
			updatePaymentData(subscriptionOptions, invoiceEditor.getInvoiceData(), null, null).then(success => {
				if (success) {
					dialog.close()
				}
			})
		}
	}

	const dialog = Dialog.smallActionDialog(lang.get("invoiceData_msg"), {
		view: () => m("#changeInvoiceDataDialog", [
			m(invoiceEditor),
		])
	}, confirmAction, true, "save_action")
	return dialog
}