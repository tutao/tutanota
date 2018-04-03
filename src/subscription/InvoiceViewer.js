//@flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel.js"
import {TextField, Type} from "../gui/base/TextField"

export class InvoiceViewer {

	_invoiceRecipientField: TextField;
	_invoiceAddressField: TextField;
	_invoiceCountryField: TextField;
	_paymentMehthodField: TextField;

	view: Function;

	constructor() {

		this._invoiceRecipientField = new TextField("invoiceRecipient_label").setValue(lang.get("loading_msg")).setDisabled()
		this._invoiceAddressField = new TextField("address_label").setValue(lang.get("loading_msg")).setDisabled().setType(Type.Area)
		this._invoiceCountryField = new TextField("invoiceCountry_label").setValue(lang.get("loading_msg")).setDisabled()
		this._paymentMehthodField = new TextField("paymentMethod_label").setValue(lang.get("loading_msg")).setDisabled()

		this.view = (): VirtualElement => {
			return m("#invoicing-settings.fill-absolute.scroll.plr-l", [
				m(".h4.mt-l", lang.get('invoiceData_msg')),
				m(this._invoiceRecipientField),
				m(this._invoiceAddressField),
				m(this._invoiceCountryField),
				m(this._paymentMehthodField),
				m(".h4.mt-l", lang.get('invoices_label')),
			])
		}
	}


	updateAccountTypeData(accountingInfo: AccountingInfo) {
		this._invoiceRecipientField.setValue(accountingInfo.invoiceName)
		this._invoiceAddressField.setValue(accountingInfo.invoiceAddress)
		this._invoiceCountryField.setValue(accountingInfo.invoiceCountry)
		m.redraw()
	}

}