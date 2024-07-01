import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import { InvoiceDataInput, InvoiceDataInputLocation } from "./InvoiceDataInput"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { BadRequestError } from "../api/common/error/RestError"
import type { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { InvoiceData } from "../api/common/TutanotaConstants"
import { asPaymentInterval } from "./PriceUtils.js"
import { defer, ofClass } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"

/**
 * Shows a dialog to update the invoice data for business use. Switches the account to business use before actually saving the new invoice data
 * because only when the account is set to business use some payment data like vat id number may be saved.
 * @return true, if the business invoiceData was written successfully
 */
export function showSwitchToBusinessInvoiceDataDialog(customer: Customer, invoiceData: InvoiceData, accountingInfo: AccountingInfo): Promise<boolean> {
	if (customer.businessUse) {
		throw new ProgrammingError("cannot show invoice data dialog if the customer is already a business customer")
	}
	const invoiceDataInput = new InvoiceDataInput(true, invoiceData, InvoiceDataInputLocation.InWizard)

	const result = defer<boolean>()
	const confirmAction = async () => {
		let error = invoiceDataInput.validateInvoiceData()

		if (error) {
			Dialog.message(error)
		} else {
			showProgressDialog("pleaseWait_msg", result.promise)

			const success = await updatePaymentData(
				asPaymentInterval(accountingInfo.paymentInterval),
				invoiceDataInput.getInvoiceData(),
				null,
				null,
				false,
				"0",
				accountingInfo,
			)
				.catch(
					ofClass(BadRequestError, () => {
						Dialog.message("paymentMethodNotAvailable_msg")
						return false
					}),
				)
				.catch((e) => {
					result.reject(e)
				})
			if (success) {
				dialog.close()
				result.resolve(true)
			} else {
				result.resolve(false)
			}
		}
	}

	const cancelAction = () => result.resolve(false)

	const dialog = Dialog.showActionDialog({
		title: lang.get("invoiceData_msg"),
		child: {
			view: () =>
				m("#changeInvoiceDataDialog", [
					// infoMessageId ? m(".pt", lang.get(infoMessageId)) : null,
					m(invoiceDataInput),
				]),
		},
		okAction: confirmAction,
		cancelAction: cancelAction,
		allowCancel: true,
		okActionTextId: "save_action",
	})

	return result.promise
}
