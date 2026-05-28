import m from "mithril"
import { Dialog } from "../../../ui/base/Dialog"
import type { TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { InvoiceDataInput } from "./InvoiceDataInput"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { BadRequestError } from "@tutao/rest-client/error"
import type { InvoiceData } from "@tutao/app-env"
import { ofClass } from "@tutao/utils"
import { asPaymentInterval } from "./utils/PriceUtils.js"
import { AccountingInfo } from "@tutao/entities/sys"

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
		title: headingId ? headingId : "invoiceData_msg",
		child: {
			view: () => m("#changeInvoiceDataDialog", [infoMessageId ? m(".pt-16", lang.get(infoMessageId)) : null, m(invoiceDataInput)]),
		},
		okAction: confirmAction,
		allowCancel: true,
		okActionTextId: "save_action",
	})
	return dialog
}
