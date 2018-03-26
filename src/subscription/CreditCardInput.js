//@flow
import {TextField} from "../gui/base/TextField"
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"


export class CreditCardInput {

	view: Function;
	creditCardNumber: TextField;
	cvv: TextField;
	expirationDate: TextField;

	constructor() {

		this.creditCardNumber = new TextField("creditCardNumber_label", () => lang.get("creditCardNumberFormat_msg"))
		this.cvv = new TextField("creditCardCVV_label", () => lang.get("creditCardCVVFormat_label"))
		this.expirationDate = new TextField("creditCardExpirationDate_label", () => lang.get("creditCardExpirationDateFormat_msg"))

		this.view = () => {
			return [
				m(this.creditCardNumber),
				m(this.cvv),
				m(this.expirationDate)
			]
		}
	}
}