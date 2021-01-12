// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {updatePaymentData} from "./InvoiceAndPaymentDataPage"
import {BadRequestError} from "../api/common/error/RestError"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {update} from "../api/main/Entity"
import type {Customer} from "../api/entities/sys/Customer"
import {showBusinessBuyDialog} from "./BuyDialog"

/**
 * Shows a dialog to update the invoice data for business use. Switches the account to business use before actually saving the new invoice data
 * because only when the account is set to business use some payment data like vat id number may be saved.
 */
export function show(customer: Customer, invoiceData: InvoiceData, accountingInfo: AccountingInfo, currentlyBusinessOrdered: boolean, headingId: ?TranslationKey, infoMessageId: ?TranslationKey): Dialog {
	const invoiceDataInput = new InvoiceDataInput(true, invoiceData)
	const confirmAction = () => {
		let error = invoiceDataInput.validateInvoiceData()
		if (error) {
			Dialog.error(error)
		} else {
			let p = Promise.resolve(false)
			if (!currentlyBusinessOrdered) {
				p = showBusinessBuyDialog(true)
			}
			p.then(failed => {
				if (failed) {
					return
				}
				customer.businessUse = true
				update(customer).then(() => {
					updatePaymentData(Number(accountingInfo.paymentInterval), invoiceDataInput.getInvoiceData(), null, null, false, "0", accountingInfo).then(success => {
						if (success) {
							dialog.close()
						}
					}).catch(BadRequestError, e => {
						Dialog.error("paymentMethodNotAvailable_msg")
					})
				})
			})
		}
	}

	const dialog = Dialog.showActionDialog({
		title: headingId ? lang.get(headingId) : lang.get("invoiceData_msg"),
		child: {
			view: () => m("#changeInvoiceDataDialog", [
				infoMessageId ? m(".pt", lang.get(infoMessageId)) : null,
				m(invoiceDataInput),
				m(".pt.small", lang.get("downgradeToPrivateNotAllowed_msg")),
				!currentlyBusinessOrdered ? m(".pt-s.small", lang.get("businessCustomerAutoBusinessFeature_msg")) : null,
			])
		},
		okAction: confirmAction,
		allowCancel: true,
		okActionTextId: "save_action"
	})
	return dialog
}
