// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {updatePaymentData} from "./InvoiceAndPaymentDataPage"
import {BadRequestError} from "../api/common/error/RestError"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import type {Customer} from "../api/entities/sys/Customer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {showBusinessBuyDialog} from "./BuyDialog"
import {locator} from "../api/main/MainLocator"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {defer, noOp} from "@tutao/tutanota-utils"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {InvoiceData} from "../api/common/TutanotaConstants"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"

/**
 * Shows a dialog to update the invoice data for business use. Switches the account to business use before actually saving the new invoice data
 * because only when the account is set to business use some payment data like vat id number may be saved.
 */
export function show(customer: Customer, invoiceData: InvoiceData, accountingInfo: AccountingInfo, currentlyBusinessOrdered: boolean, headingId: ?TranslationKey, infoMessageId: ?TranslationKey): Dialog {
	const invoiceDataInput = new InvoiceDataInput(true, invoiceData)
	const entityEventUpdateForCustomer = defer() // required if business is booked because the customer is then changed
	const entityEventListener = (updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> => {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(CustomerTypeRef, update)) {
				return locator.entityClient.load(CustomerTypeRef, customer._id)
				              .then(updatedCustomer => {
					              customer = updatedCustomer
					              entityEventUpdateForCustomer.resolve()
				              })
			}
		}).then(noOp)
	}
	locator.eventController.addEntityListener(entityEventListener)

	const confirmAction = () => {
		let error = invoiceDataInput.validateInvoiceData()
		if (error) {
			Dialog.error(error)
		} else {
			let p = Promise.resolve(false)
			if (!currentlyBusinessOrdered) {
				p = showBusinessBuyDialog(true)
			} else {
				entityEventUpdateForCustomer.resolve()
			}
			p.then(failed => {
				if (failed) {
					return
				}
				showProgressDialog("pleaseWait_msg", entityEventUpdateForCustomer.promise.then(() => {
					customer.businessUse = true
				}).then(() => {
					locator.entityClient.update(customer)
					       .then(() => {
						       updatePaymentData(Number(accountingInfo.paymentInterval), invoiceDataInput.getInvoiceData(), null, null, false, "0", accountingInfo)
							       .then(success => {
								       if (success) {
									       locator.eventController.removeEntityListener(entityEventListener)
									       dialog.close()
								       }
							       })
							       .catch(ofClass(BadRequestError, e => {
								       Dialog.error("paymentMethodNotAvailable_msg")
							       }))
					       })
				}))
			})
		}
	}

	const cancelAction = () => {
		locator.eventController.removeEntityListener(entityEventListener)
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
		cancelAction: cancelAction,
		allowCancel: true,
		okActionTextId: "save_action"
	})
	return dialog
}
