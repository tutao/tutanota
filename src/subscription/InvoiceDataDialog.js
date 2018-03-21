// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {TextField, Type} from "../gui/base/TextField"
import {Countries} from "../api/common/CountryList"
import type {SubscriptionOptions} from "./SubscriptionOptionsDialog"


export function openInvoiceDataDialog(subscriptionOptions: SubscriptionOptions): Promise<void> {
	let invoiceNameInput = new TextField("invoiceRecipient_label", () => subscriptionOptions.businessUse ? lang.get("invoiceRecipientInfoBusiness_msg") : lang.get("invoiceRecipientInfoConsumer_msg"))
	let invoiceAddressInput = new TextField("invoiceAddress_label", () => subscriptionOptions.businessUse ? lang.get("invoiceAddressInfoBusiness_msg") : lang.get("invoiceAddressInfoConsumer_msg")).setType(Type.Area)

	const countries = Countries.map(c => ({value: c.a, name: c.n}))
	countries.push({value: null, name: lang.get("choose_label")});
	let countryCode = stream(null)
	let countryInput = new DropDownSelector("invoiceCountry_label",
		() => lang.get("invoiceCountryInfoConsumer_msg"),
		countries,
		countryCode,
		250).setSelectionChangedHandler(v => {
		countryCode(v)
	})

	let paymentMethod = stream(null)
	let paymentMethodInput = new DropDownSelector("paymentMethod_label",
		() => lang.get("invoicePaymentMethodInfo_msg"),
		[{name: lang.get("choose_label"), value: null}],
		paymentMethod,
		250).setSelectionChangedHandler(v => {
		paymentMethod(v)
	})

	return Promise.fromCallback((callback) => {
		let invoiceDataDialog = Dialog.smallActionDialog(lang.get("invoiceData_msg"), {
			view: () => m(".text-break", [
				m(invoiceNameInput),
				m(invoiceAddressInput),
				m(countryInput),
				m(paymentMethodInput)
			])
		}, () => {
			if (!paymentMethod()) {
			}
			invoiceDataDialog.close()
			callback(null, null)
		}, true, "next_action", () => {
			invoiceDataDialog.close()
			callback(null, null)
		})
	})
}