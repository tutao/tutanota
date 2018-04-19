//@flow
import {TextField} from "../gui/base/TextField"
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {createCreditCard} from "../api/entities/sys/CreditCard"


export class CreditCardInput {

	view: Function;

	cardHolderName: TextField;
	creditCardNumber: TextField;
	cvv: TextField;
	expirationDate: TextField;


	constructor() {
		this.creditCardNumber = new TextField("creditCardNumber_label")
		this.cardHolderName = new TextField("creditCardCardHolderName_label")
		this.cvv = new TextField("creditCardCVV_label")
		this.expirationDate = new TextField("creditCardExpirationDate_label", () => lang.get("creditCardExpirationDateFormat_msg"))

		this.view = () => {
			return [
				m(this.creditCardNumber),
				m(this.cardHolderName),
				m(this.cvv),
				m(this.expirationDate)
			]
		}
	}

	getCreditCardData(): CreditCard {
		let monthAndYear = this.expirationDate.value().split("/")
		let cc = createCreditCard();
		cc.number = this.creditCardNumber.value()
		cc.cardHolderName = this.cardHolderName.value()
		cc.cvv = this.cvv.value()
		cc.expirationMonth = monthAndYear.length > 0 ? monthAndYear[0] : ""
		cc.expirationYear = monthAndYear.length > 1 ? monthAndYear[1] : ""
		return cc;
	}

	setCreditCardData(data: ?CreditCard): void {
		if (data) {
			this.creditCardNumber.value(data.number)
			this.cardHolderName.value(data.cardHolderName)
			this.cvv.value(data.cvv)
			this.expirationDate.value(data.expirationMonth + "/" + data.expirationYear)
		} else {
			this.creditCardNumber.value("")
			this.cardHolderName.value("")
			this.cvv.value("")
			this.expirationDate.value("")
		}
	}

}