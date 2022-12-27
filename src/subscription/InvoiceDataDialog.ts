import m from "mithril"
import { Dialog } from "../gui/base/Dialog"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { InvoiceDataInput } from "./InvoiceDataInput"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { BadRequestError } from "../api/common/error/RestError"
import type { AccountingInfo } from "../api/entities/sys/TypeRefs.js"
import type { InvoiceData } from "../api/common/TutanotaConstants"
import { ofClass } from "@tutao/tutanota-utils"
import { asPaymentInterval } from "./PriceUtils.js"

export function show(
	businessUse: boolean,
	invoiceData: InvoiceData,
	accountingInfo: AccountingInfo,
	headingId?: TranslationKey,
	infoMessageId?: TranslationKey,
): Dialog {
	const invoiceDataInput = new InvoiceDataInput(businessUse, invoiceData)

	const confirmAction = () => {
		let error = invoiceDataInput.validateInvoiceData()

		if (error) {
			Dialog.message(error)
		} else {
			updatePaymentData(asPaymentInterval(accountingInfo.paymentInterval), invoiceDataInput.getInvoiceData(), null, null, false, "0", accountingInfo)
				.then((success) => {
					if (success) {
						dialog.close()
					}
				})
				.catch(
					ofClass(BadRequestError, (e) => {
						Dialog.message("paymentMethodNotAvailable_msg")
					}),
				)
		}
	}

	const dialog = Dialog.showActionDialog({
		title: headingId ? lang.get(headingId) : lang.get("invoiceData_msg"),
		child: {
			view: () => m("#changeInvoiceDataDialog", [infoMessageId ? m(".pt", lang.get(infoMessageId)) : null, m(invoiceDataInput)]),
		},
		okAction: confirmAction,
		allowCancel: true,
		okActionTextId: "save_action",
	})
	return dialog
}
