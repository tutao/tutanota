import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { lang } from "../misc/LanguageViewModel"
import type { CreditCard } from "../api/entities/sys/TypeRefs.js"
import { createCreditCard } from "../api/entities/sys/TypeRefs.js"
import { TextField } from "../gui/base/TextField.js"
import Stream from "mithril/stream"

export class CreditCardAttrs {
	cardHolderName: Stream<string>
	creditCardNumber: Stream<string>
	cvv: Stream<string>
	expirationDate: Stream<string>

	constructor() {
		this.creditCardNumber = stream("")
		this.cardHolderName = stream("")
		this.cvv = stream("")
		this.expirationDate = stream("")
	}

	getCreditCardData(): CreditCard {
		let monthAndYear = this.expirationDate().split("/")
		let cc = createCreditCard()
		cc.number = this.creditCardNumber()
		cc.cardHolderName = this.cardHolderName()
		cc.cvv = this.cvv()
		cc.expirationMonth = monthAndYear.length > 0 ? monthAndYear[0] : ""
		cc.expirationYear = monthAndYear.length > 1 ? monthAndYear[1] : ""
		return cc
	}

	setCreditCardData(data: CreditCard | null): void {
		if (data) {
			this.creditCardNumber(data.number)
			this.cardHolderName(data.cardHolderName)
			this.cvv(data.cvv)

			if (data.expirationMonth && data.expirationYear) {
				this.expirationDate(data.expirationMonth + "/" + data.expirationYear)
			}
		} else {
			this.creditCardNumber("")
			this.cardHolderName("")
			this.cvv("")
			this.expirationDate("")
		}
	}
}

export class CreditCardInput implements Component<CreditCardAttrs> {
	view(vnode: Vnode<CreditCardAttrs>): Children {
		let attrs = vnode.attrs
		return [
			m(TextField, {
				label: "creditCardNumber_label",
				value: attrs.creditCardNumber(),
				oninput: attrs.creditCardNumber,
			}),
			m(TextField, {
				label: "creditCardCardHolderName_label",
				value: attrs.cardHolderName(),
				oninput: attrs.cardHolderName,
			}),
			m(TextField, {
				label: "creditCardCVV_label",
				value: attrs.cvv(),
				oninput: attrs.cvv,
			}),
			m(TextField, {
				label: "creditCardExpirationDate_label",
				helpLabel: () => lang.get("creditCardExpirationDateFormat_msg"),
				value: attrs.expirationDate(),
				oninput: attrs.expirationDate,
			}),
		]
	}
}
